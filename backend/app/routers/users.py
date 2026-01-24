from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import kitchen
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    dietary_preferences: Optional[str] = None
    allergies: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    age: Optional[int] = None
    activity_level: Optional[str] = None
    # Goals
    daily_calories: Optional[int] = None
    daily_protein: Optional[int] = None
    daily_carbs: Optional[int] = None
    daily_fat: Optional[int] = None

@router.get("/{user_id}")
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(kitchen.User).filter(kitchen.User.user_id == user_id).first()
    
    # Auto-create user if they don't exist (First time login via Supabase)
    # Auto-create user if they don't exist (First time login via Supabase)
    if not user:
        try:
            print(f"User {user_id} not found. Attempting to auto-create...", flush=True)
            # Create core user
            new_user = kitchen.User(user_id=user_id, name="Chef")
            db.add(new_user)
            db.commit()
            
            # Create empty profile
            new_profile = kitchen.UserProfile(user_id=user_id)
            db.add(new_profile)
            db.commit()
            
            db.refresh(new_user)
            user = new_user
            print(f"Successfully created user {user_id}", flush=True)
        except Exception as e:
            # CRITICAL: If write fails (e.g. RLS permissions), LOG IT but DO NOT CRASH.
            # Return a phantom user object so the frontend works.
            print(f"ERROR creating user {user_id}: {e}", flush=True)
            db.rollback()
            
            # Create a transient User object (not saved to DB) for the response
            user = kitchen.User(user_id=user_id, name="Chef", created_at=None)
            user.profile = kitchen.UserProfile(
                user_id=user_id, 
                display_name="Chef", 
                dietary_type="Standard",
                activity_level="Moderate"
            )

    # Merge basic user info with profile info
    profile_data = {
        "user_id": user.user_id,
        "name": user.name,
        "created_at": user.created_at
    }
    
    if user.profile:
        profile_data.update({
            "name": user.profile.display_name or user.name,
            "dietary_preferences": user.profile.dietary_type,
            "allergies": user.profile.allergies,
            "height": user.profile.height_cm,
            "weight": user.profile.weight_kg,
            "age": user.profile.age,
            "activity_level": user.profile.activity_level,
            "daily_calories": user.profile.daily_calories or 2000,
            "daily_protein": user.profile.daily_protein or 150,
            "daily_carbs": user.profile.daily_carbs or 250,
            "daily_fat": user.profile.daily_fat or 70
        })
    
    return profile_data

@router.put("/{user_id}")
def update_user_profile(user_id: str, profile: UserProfileUpdate, db: Session = Depends(get_db)):
    db_user = db.query(kitchen.User).filter(kitchen.User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Update core user name if provided
    if profile.name is not None:
        db_user.name = profile.name

    # 2. Get or create the profile record
    db_profile = db.query(kitchen.UserProfile).filter(kitchen.UserProfile.user_id == user_id).first()
    if not db_profile:
        db_profile = kitchen.UserProfile(user_id=user_id)
        db.add(db_profile)

    # 3. Map Pydantic model fields to Profile table columns
    if profile.name is not None:
        db_profile.display_name = profile.name
    if profile.dietary_preferences is not None:
        db_profile.dietary_type = profile.dietary_preferences
    if profile.allergies is not None:
        db_profile.allergies = profile.allergies
    if profile.height is not None:
        db_profile.height_cm = profile.height
    if profile.weight is not None:
        db_profile.weight_kg = profile.weight
    if profile.age is not None:
        db_profile.age = profile.age
    if profile.activity_level is not None:
        db_profile.activity_level = profile.activity_level

    # Update Goals
    if profile.daily_calories is not None:
        db_profile.daily_calories = profile.daily_calories
    if profile.daily_protein is not None:
        db_profile.daily_protein = profile.daily_protein
    if profile.daily_carbs is not None:
        db_profile.daily_carbs = profile.daily_carbs
    if profile.daily_fat is not None:
        db_profile.daily_fat = profile.daily_fat


    db.commit()
    db.refresh(db_user)
    
    # Return the merged view
    return get_user_profile(user_id, db)

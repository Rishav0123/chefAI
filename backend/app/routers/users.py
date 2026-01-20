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

@router.get("/{user_id}")
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(kitchen.User).filter(kitchen.User.user_id == user_id).first()
    
    # Auto-create user if they don't exist (First time login via Supabase)
    if not user:
        try:
            # Create core user
            user = kitchen.User(user_id=user_id, name="Chef")
            db.add(user)
            db.commit()
            
            # Create empty profile
            profile = kitchen.UserProfile(user_id=user_id)
            db.add(profile)
            db.commit()
            db.refresh(user)
        except Exception as e:
            # Rollback in case of race condition or error
            db.rollback()
            # Try fetching again in case another request created it
            user = db.query(kitchen.User).filter(kitchen.User.user_id == user_id).first()
            if not user:
                raise HTTPException(status_code=500, detail=f"Failed to create user profile: {str(e)}")

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
            "activity_level": user.profile.activity_level
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

    db.commit()
    db.refresh(db_user)
    
    # Return the merged view
    return get_user_profile(user_id, db)

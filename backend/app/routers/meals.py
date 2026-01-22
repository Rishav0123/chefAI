from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app.services.inventory import InventoryManager
from typing import List, Dict, Any

router = APIRouter(
    prefix="/meals",
    tags=["meals"],
)

class MealLogRequest(BaseModel):
    user_id: str
    name: str # e.g. "Tomato Pasta"
    ingredients_used: List[Dict[str, Any]] # [{"item": "Tomato", "qty": "3"}]
    confidence: int = 100
    # Nutrition & Metadata
    meal_type: str = "other"
    meal_source: str = "home"  # "home" | "outside"
    calories: int = None
    protein_g: int = None
    carbs_g: int = None
    fat_g: int = None

# --- AI Estimator ---
import os
import json
from openai import OpenAI
client = OpenAI()

class EstimationRequest(BaseModel):
    meal_name: str

@router.post("/estimate")
def estimate_meal_data(request: EstimationRequest):
    """
    Uses LLM to estimate ingredients and nutrition for a given meal name.
    """
    try:
        prompt = f"""
        You are a nutrition assistant. The user is cooking "{request.meal_name}".
        
        Please estimate:
        1. A list of 3-6 likely raw ingredients used (item name and approximate quantity for 1 serving).
        2. Nutritional values (calories, protein_g, carbs_g, fat_g).

        Return ONLY valid JSON in this format:
        {{
            "ingredients": [
                {{"item": "Ingredient Name", "qty": "Quantity (e.g. 100g)"}}
            ],
            "nutrition": {{
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0
            }}
        }}
        """

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        
        return data

    except Exception as e:
        print(f"Estimation Error: {e}")
        return {
            "ingredients": [],
            "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        }

@router.post("/")
def log_meal(request: MealLogRequest, db: Session = Depends(get_db)):
    """
    Log a meal and deduct ingredients from inventory.
    """
    try:
        manager = InventoryManager(db)
        
        # Only deduct stock if meal is cooked at home
        should_deduct = (request.meal_source == "home")

        meal, report = manager.log_meal_and_deduct_stock(
            user_id=request.user_id,
            meal_name=request.name,
            ingredients_used=request.ingredients_used,
            confidence=request.confidence,
            meal_type=request.meal_type,
            calories=request.calories,
            protein_g=request.protein_g,
            carbs_g=request.carbs_g,
            fat_g=request.fat_g,
            deduct_stock=should_deduct,
            source=request.meal_source 
        )
        return {
            "message": "Meal logged successfully",
            "meal_id": meal.id,
            "deduction_report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
def get_meal_history(user_id: str, db: Session = Depends(get_db)):
    """
    Get the last 20 meals logged by the user.
    """
    try:
        from app.models.meals import Meal
        meals = db.query(Meal).filter(Meal.user_id == user_id).order_by(Meal.created_at.desc()).limit(20).all()
        return meals
    except Exception as e:
        print(f"ERROR GETTING MEALS: {e}")
        # Return empty list or specific error to client to debug
        # We raise HTTPException so the frontend gets a JSON response instead of partial crash
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@router.delete("/{meal_id}")
def delete_meal(meal_id: str, db: Session = Depends(get_db)):
    """
    Delete a meal log.
    Note: This currently does NOT restore the stock deducted.
    """
    from app.models.meals import Meal
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted successfully"}

@router.put("/{meal_id}")
def update_meal(meal_id: str, request: MealLogRequest, db: Session = Depends(get_db)):
    """
    Update an existing meal log.
    Does NOT trigger stock re-calculation.
    """
    from app.models.meals import Meal
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    # Update fields
    meal.name = request.name
    meal.meal_type = request.meal_type
    meal.meal_source = request.meal_source
    meal.ingredients_used = request.ingredients_used
    meal.calories = request.calories
    meal.protein_g = request.protein_g
    meal.carbs_g = request.carbs_g
    meal.fat_g = request.fat_g
    
    db.commit()
    db.refresh(meal)
    return {"message": "Meal updated successfully", "meal": meal}

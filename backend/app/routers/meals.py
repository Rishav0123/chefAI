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
    from app.models.meals import Meal
    meals = db.query(Meal).filter(Meal.user_id == user_id).order_by(Meal.created_at.desc()).limit(20).all()
    return meals

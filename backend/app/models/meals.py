from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Meal(Base):
    __tablename__ = "meals"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    name = Column(String, nullable=False)
    ingredients_used = Column(JSON, default=list) # List of dicts: [{"item": "Tomato", "qty": 3}]
    confidence = Column(Integer, default=100)
    meal_type = Column(String) # breakfast, lunch, dinner, snack, other
    calories = Column(Integer, nullable=True)
    protein_g = Column(Integer, nullable=True)
    carbs_g = Column(Integer, nullable=True)
    fat_g = Column(Integer, nullable=True)
    source = Column(String) # manual, imported, predicted
    kitchen_id = Column(String, nullable=True) # ID of the kitchen where this was cooked
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="meals")

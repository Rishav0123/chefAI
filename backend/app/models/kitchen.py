import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
import uuid

# Helper for UUID compatibility with SQLite
def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    stocks = relationship("KitchenStock", back_populates="user")
    uploads = relationship("Uploads", back_populates="user")
    chat_history = relationship("ChatMessage", back_populates="user")
    meals = relationship("Meal", back_populates="user")
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    
    # Kitchen Relationships
    owned_kitchens = relationship("Kitchen", back_populates="owner")
    memberships = relationship("KitchenMember", back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"), unique=True)
    display_name = Column(String)
    age = Column(Integer)
    activity_level = Column(String)
    height_cm = Column(Integer)
    weight_kg = Column(Integer)
    dietary_type = Column(String, default="Standard")
    allergies = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")

class KitchenStock(Base):
    __tablename__ = "kitchen_stock"

    stock_id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    item_name = Column(String, index=True)
    quantity = Column(String)  # "500g", "2 pcs"
    category = Column(String)  # vegetable, spice, dairy
    expiry_date = Column(Date, nullable=True)
    source = Column(String)    # manual | bill | screenshot
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Link to Kitchen instead of User directly
    kitchen_id = Column(String, ForeignKey("kitchens.id"), nullable=True) 

    user = relationship("User", back_populates="stocks")
    kitchen = relationship("Kitchen", back_populates="stocks")

class Uploads(Base):
    __tablename__ = "uploads"

    upload_id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.user_id"))
    file_url = Column(Text)
    upload_type = Column(String) # bill | screenshot
    extracted_json = Column(Text) # Storing JSON as Text for SQLite compatibility
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="uploads")

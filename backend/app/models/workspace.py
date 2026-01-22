
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Kitchen(Base):
    __tablename__ = "kitchens"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    invite_code = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="owned_kitchens")
    members = relationship("KitchenMember", back_populates="kitchen", cascade="all, delete-orphan")
    stocks = relationship("KitchenStock", back_populates="kitchen")

class KitchenMember(Base):
    __tablename__ = "kitchen_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    kitchen_id = Column(String, ForeignKey("kitchens.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    role = Column(String, default="member") # admin, member
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    kitchen = relationship("Kitchen", back_populates="members")
    user = relationship("User", back_populates="memberships")

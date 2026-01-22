
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from ..db import get_db
from ..models.workspace import Kitchen, KitchenMember
from ..models.kitchen import User
from pydantic import BaseModel
from typing import List
import secrets
import string

router = APIRouter(prefix="/kitchens", tags=["kitchens"])

# --- Pydantic Schemas ---
class KitchenCreate(BaseModel):
    name: str
    owner_id: str

class JoinKitchen(BaseModel):
    user_id: str
    invite_code: str

class SwitchKitchen(BaseModel):
    user_id: str
    kitchen_id: str

class KitchenResponse(BaseModel):
    id: str
    name: str
    role: str
    invite_code: str
    is_active: bool

# --- Helpers ---
def generate_invite_code(length=6):
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

# --- Endpoints ---

@router.post("/", response_model=KitchenResponse)
def create_kitchen(payload: KitchenCreate, db: Session = Depends(get_db)):
    """Create a new shared kitchen (group)."""
    # 1. Check if user exists (or ensure they do)
    user = db.query(User).filter(User.user_id == payload.owner_id).first()
    if not user:
        # Auto-create user if missing (robustness)
        user = User(user_id=payload.owner_id, name="New User")
        db.add(user)
        db.commit()

    # 2. Generate unique code
    code = generate_invite_code()
    while db.query(Kitchen).filter(Kitchen.invite_code == code).first():
        code = generate_invite_code()

    # 3. Create Kitchen
    new_kitchen = Kitchen(
        name=payload.name,
        owner_id=payload.owner_id,
        invite_code=code
    )
    db.add(new_kitchen)
    db.commit()
    db.refresh(new_kitchen)

    # 4. Add Owner as Admin Member
    member = KitchenMember(
        kitchen_id=new_kitchen.id,
        user_id=payload.owner_id,
        role="admin"
    )
    db.add(member)
    db.commit()

    return {
        "id": new_kitchen.id,
        "name": new_kitchen.name,
        "role": "admin",
        "invite_code": new_kitchen.invite_code,
        "is_active": True
    }

@router.post("/join", response_model=KitchenResponse)
def join_kitchen(payload: JoinKitchen, db: Session = Depends(get_db)):
    """Join an existing kitchen via invite code."""
    # 1. Find Kitchen
    kitchen = db.query(Kitchen).filter(Kitchen.invite_code == payload.invite_code.upper()).first()
    if not kitchen:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # 2. Check if already member
    existing_member = db.query(KitchenMember).filter(
        KitchenMember.kitchen_id == kitchen.id,
        KitchenMember.user_id == payload.user_id
    ).first()

    if existing_member:
        return {
            "id": kitchen.id,
            "name": kitchen.name,
            "role": existing_member.role,
            "invite_code": kitchen.invite_code,
            "is_active": True
        }

    # 3. Add Member
    new_member = KitchenMember(
        kitchen_id=kitchen.id,
        user_id=payload.user_id,
        role="member"
    )
    db.add(new_member)
    db.commit()

    return {
        "id": kitchen.id,
        "name": kitchen.name,
        "role": "member",
        "invite_code": kitchen.invite_code,
        "is_active": True
    }

@router.get("/user/{user_id}", response_model=List[KitchenResponse])
def list_user_kitchens(user_id: str, db: Session = Depends(get_db)):
    """List all kitchens a user belongs to."""
    memberships = db.query(KitchenMember).filter(KitchenMember.user_id == user_id).all()
    
    results = []
    for m in memberships:
        # We assume the first one joined or "My Pantry" is active for now
        # Ideally, we store "active_kitchen_id" in UserProfile or pass it in query
        k = m.kitchen
        results.append({
            "id": k.id,
            "name": k.name,
            "role": m.role,
            "invite_code": k.invite_code,
            "is_active": False # Frontend will determine this
        })
    
    return results

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models.kitchen import KitchenStock, User
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

router = APIRouter(prefix="/stock", tags=["stock"])

class StockCreate(BaseModel):
    user_id: str
    item_name: str
    quantity: Optional[str] = None
    category: Optional[str] = None
    expiry_date: Optional[date] = None
    source: str = "manual"

class StockResponse(StockCreate):
    stock_id: str
    
    class Config:
        orm_mode = True

from app.services.inventory import InventoryManager

@router.post("/", response_model=StockResponse)
def add_item(item: StockCreate, db: Session = Depends(get_db)):
    # Ensure user exists (simple check or auto-create for MVP)
    user = db.query(User).filter(User.user_id == item.user_id).first()
    if not user:
        user = User(user_id=item.user_id, name="Default User")
        db.add(user)
        db.commit()
    
    # Use InventoryManager to handle duplicates/merging
    manager = InventoryManager(db)
    
    # Construct quantity string if unit and amount are separate, or just pass quantity if it's a string
    # The frontend usually sends "500g", but if we need strict parsing:
    qty_str = item.quantity if item.quantity else "1 unit"
    
    # We need to adapt add_stock to return the db_item or we refetch it
    # For now, let's look up the item after adding/updating
    manager.add_stock(item.user_id, item.item_name, qty_str, item.category or "other")
    
    # Refetch the item to return it
    # Note: add_stock might merge, so we look for the item by name
    # This matches the logic inside add_stock
    db_item = db.query(KitchenStock).filter(
        KitchenStock.user_id == item.user_id,
        KitchenStock.item_name.ilike(f"%{item.item_name}%")
    ).first()
    
    # Fallback if name changed slightly or fuzzy match
    if not db_item:
         db_item = db.query(KitchenStock).filter(KitchenStock.user_id == item.user_id).order_by(KitchenStock.updated_at.desc()).first()

    return db_item

@router.post("/batch", response_model=List[StockResponse])
def add_items_batch(items: List[StockCreate], db: Session = Depends(get_db)):
    """
    Bulk add items to stock.
    """
    manager = InventoryManager(db)
    
    # Ensure user exists for at least the first item
    if items:
        first_user_id = items[0].user_id
        user = db.query(User).filter(User.user_id == first_user_id).first()
        if not user:
             user = User(user_id=first_user_id, name="Default User")
             db.add(user)
             db.commit()

    processed_items = []
    
    for item in items:
        qty_str = item.quantity if item.quantity else "1 unit"
        manager.add_stock(item.user_id, item.item_name, qty_str, item.category or "other")
        
        # We can't easily return the exact objects without querying again, 
        # but the frontend might not strictl need the response list for batch ops aside from confirmation.
        # Let's try to fetch the item we just touched.
        db_item = db.query(KitchenStock).filter(
            KitchenStock.user_id == item.user_id,
            KitchenStock.item_name.ilike(f"%{item.item_name}%")
        ).first()
        if db_item:
            processed_items.append(db_item)
            
    return processed_items

@router.get("/{user_id}", response_model=List[StockResponse])
def get_stock(user_id: str, db: Session = Depends(get_db)):
    return db.query(KitchenStock).filter(KitchenStock.user_id == user_id).all()

@router.delete("/{stock_id}")
def delete_item(stock_id: str, db: Session = Depends(get_db)):
    item = db.query(KitchenStock).filter(KitchenStock.stock_id == stock_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}

@router.put("/{stock_id}", response_model=StockResponse)
def update_item(stock_id: str, item: StockCreate, db: Session = Depends(get_db)):
    db_item = db.query(KitchenStock).filter(KitchenStock.stock_id == stock_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..db import get_db
from ..models.kitchen import KitchenStock, User
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

router = APIRouter(prefix="/stock", tags=["stock"])

class StockCreate(BaseModel):
    user_id: Optional[str] = None
    kitchen_id: Optional[str] = None
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
    # Logic for adding: Handle User or Kitchen
    target_user_id = item.user_id
    target_kitchen_id = item.kitchen_id

    # If kitchen_id is provided, we prioritize linking to kitchen
    # Note: We still might need a user_id for "updated_by" logs, but for now we link ownership
    
    # Use InventoryManager... wait, current InventoryManager add_stock signature: (user_id, item_name, quantity, category)
    # We need to update InventoryManager to support kitchen_id OR manually handle it here
    
    # Manual Add/Update logic here to support kitchen_id without refactoring InventoryManager instantly
    
    # 1. Check existing item
    existing_query = db.query(KitchenStock).filter(KitchenStock.item_name.ilike(f"%{item.item_name}%"))
    
    if target_kitchen_id:
        existing_query = existing_query.filter(KitchenStock.kitchen_id == target_kitchen_id)
    elif target_user_id:
        existing_query = existing_query.filter(KitchenStock.user_id == target_user_id)
    else:
        raise HTTPException(status_code=400, detail="Must provide user_id or kitchen_id")

    db_item = existing_query.first()

    if db_item:
        # UPDATE existing
        # Parse quantity and add (simplification: just overwriting or appending text for MVP)
        # Ideally we parse "500g" + "200g" = "700g"
        # For this step, we just update the quantity text
        db_item.quantity = item.quantity if item.quantity else db_item.quantity
        if item.expiry_date:
            db_item.expiry_date = item.expiry_date
    else:
        # CREATE new
        db_item = KitchenStock(
            user_id=target_user_id, # Can be null if kitchen_id set? Model allows it?
            kitchen_id=target_kitchen_id,
            item_name=item.item_name,
            quantity=item.quantity,
            category=item.category or "other",
            expiry_date=item.expiry_date,
            source=item.source
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_item)

    return db_item

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

@router.get("/{id}", response_model=List[StockResponse])
def get_stock(id: str, db: Session = Depends(get_db)):
    try:
        # Support fetching by either User ID or Kitchen ID
        return db.query(KitchenStock).filter(
            or_(
                KitchenStock.user_id == id,
                KitchenStock.kitchen_id == id
            )
        ).all()
    except Exception as e:
        print(f"ERROR GETTING STOCK: {e}")
        raise HTTPException(status_code=500, detail=f"Stock Error: {str(e)}")

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

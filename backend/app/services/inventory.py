import re
from sqlalchemy.orm import Session
from app.models.kitchen import KitchenStock, User
from app.models.meals import Meal
from datetime import datetime

class QuantityParser:
    @staticmethod
    def parse(quantity_str: str):
        """
        Parses a quantity string like '500g', '2 pcs', '1.5kg' into (amount, unit).
        Returns (None, None) if parsing fails.
        """
        if not quantity_str:
            return None, None
            
        quantity_str = quantity_str.lower().strip()
        
        # Match number at start (int or float)
        match = re.match(r"([\d\.]+)\s*([a-zA-Z]*)", quantity_str)
        if match:
            amount = float(match.group(1))
            unit = match.group(2).strip().lower()
            
            # Normalize units
            unit_map = {
                "gm": "g", "gms": "g", "gram": "g", "grams": "g",
                "kg": "kg", "kgs": "kg", "kilogram": "kg",
                "ml": "ml", "mls": "ml",
                "l": "l", "liters": "l", "litre": "l",
                "pc": "pcs", "pcs": "pcs", "piece": "pcs", "pieces": "pcs",
                "tbsp": "tbsp", "tablespoon": "tbsp",
                "tsp": "tsp", "teaspoon": "tsp"
            }
            unit = unit_map.get(unit, unit)

            return amount, unit
        
        return None, None

    @staticmethod
    def get_base_unit(unit: str):
        """Returns (base_unit, factor_to_base)"""
        # Mass (base: g)
        if unit in ["kg", "g", "mg"]:
            if unit == "kg": return "g", 1000.0
            if unit == "mg": return "g", 0.001
            return "g", 1.0
        
        # Volume (base: ml)
        if unit in ["l", "ml", "tbsp", "tsp", "cup"]:
            if unit == "l": return "ml", 1000.0
            if unit == "tbsp": return "ml", 15.0
            if unit == "tsp": return "ml", 5.0
            if unit == "cup": return "ml", 240.0
            return "ml", 1.0
            
        return unit, 1.0

    @staticmethod
    def convert(amount: float, from_unit: str, to_unit: str):
        """
        Converts amount from one unit to another.
        Supports Mass encoded as Volume via basic density assumption (1g = 1ml) to prevent errors.
        """
        if from_unit == to_unit:
            return amount
            
        base1, factor1 = QuantityParser.get_base_unit(from_unit)
        base2, factor2 = QuantityParser.get_base_unit(to_unit)
        
        # Calculate amount in Base 1
        amount_base1 = amount * factor1

        # Handle incompatible base units (e.g. g vs ml)
        if base1 != base2:
            # Simple Density Fallback: 1 g ~= 1 ml
            # This handles "Stock: 1kg (1000g)" vs "Used: 1 cup (240ml)"
            if (base1 == "g" and base2 == "ml") or (base1 == "ml" and base2 == "g"):
                # Treat 1g = 1ml
                amount_base2 = amount_base1 
                return amount_base2 / factor2
            
            return None # Truly incompatible (e.g. 'pcs' vs 'g')
            
        # Standard conversion
        return amount_base1 / factor2

    @staticmethod
    def format(amount: float, unit: str):
        """Formats amount and unit back to string."""
        # Remove .0 for integers
        if amount == int(amount):
            amount = int(amount)
        return f"{amount} {unit}".strip()

class InventoryManager:
    def __init__(self, db: Session):
        self.db = db

    def log_meal_and_deduct_stock(self, user_id: str, meal_name: str, ingredients_used: list, confidence: int = 100, 
                                  meal_type: str = "other", calories: int = None, protein_g: int = None, 
                                  carbs_g: int = None, fat_g: int = None, deduct_stock: bool = True, source: str = "manual", kitchen_id: str = None):
        """
        Logs a meal and optionally deducts ingredients from stock.
        """
        # 1. Log the Meal
        meal = Meal(
            user_id=user_id,
            name=meal_name,
            ingredients_used=ingredients_used,
            confidence=confidence,
            meal_type=meal_type,
            calories=calories,
            protein_g=protein_g,
            carbs_g=carbs_g,
            fat_g=fat_g,
            source=source
        )
        self.db.add(meal)
        
        deduction_report = []

        # 2. Deduct Stock (Only if cooked at home)
        if deduct_stock:
            for ing in ingredients_used:
                item_name = ing.get("item")
                used_qty_raw = ing.get("qty")
                
                # Skip if critical data missing
                if not item_name or not used_qty_raw:
                    continue
    
                # normalize used qty
                used_amount, used_unit = QuantityParser.parse(str(used_qty_raw))
                if used_amount is None:
                    print(f"Skipping deduction for {item_name}: Could not parse quantity {used_qty_raw}")
                    continue
    
                # Find matching stock
                # Improved fuzzy matching: Check if stock name is inside used name OR used name is inside stock name
                # This handles "Tomato" vs "Tomatoes" and "Mozzarella Cheese" vs "Cheese"
                
                # Find Matching Stock
                # Priority: search kitchen_id if provided, else user_id
                query = self.db.query(KitchenStock)
                if kitchen_id:
                    query = query.filter(KitchenStock.kitchen_id == kitchen_id)
                else:
                    query = query.filter(KitchenStock.user_id == user_id)

                # 1. Direct Partial Match (Stock contains "Tomato")
                stock_item = query.filter(KitchenStock.item_name.ilike(f"%{item_name}%")).first()
                
                # 2. Reverse Partial Match (Used "Tomatoes" contains "Tomato" from stock)
                if not stock_item:
                    all_stocks = self.db.query(KitchenStock).filter(KitchenStock.user_id == user_id).all()
                    for stock in all_stocks:
                        if stock.item_name.lower() in item_name.lower():
                            stock_item = stock
                            break
    
                if stock_item:
                    current_amount, current_unit = QuantityParser.parse(stock_item.quantity)
                    
                    if current_amount is not None:
                        # Attempt conversion: used_unit -> current_unit
                        converted_used_amount = QuantityParser.convert(used_amount, used_unit, current_unit)
                        
                        if converted_used_amount is not None:
                            new_amount = current_amount - converted_used_amount
                            
                            if new_amount <= 0.001: # Epsilon for float compare
                                # Item used up
                                self.db.delete(stock_item)
                                deduction_report.append(f"Used {item_name}: {QuantityParser.format(converted_used_amount, current_unit)} (Original: {used_qty_raw}). Stock depleted.")
                            else:
                                # Update quantity
                                stock_item.quantity = QuantityParser.format(new_amount, current_unit)
                                deduction_report.append(f"Used {item_name}: {QuantityParser.format(converted_used_amount, current_unit)} (Original: {used_qty_raw}). Remaining: {stock_item.quantity}")
                        else:
                            deduction_report.append(f"Unit mismatch for {item_name}: Stock has '{current_unit}', used '{used_unit}'. Cannot convert.")
                    else:
                        deduction_report.append(f"Could not parse stock quantity for {item_name} ('{stock_item.quantity}'). No deduction made.")
                else:
                    deduction_report.append(f"Item {item_name} not found in stock.")
        else:
            deduction_report.append("Dining out: No stock deducted.")

        self.db.commit()
        return meal, deduction_report

    def add_stock(self, user_id: str, item_name: str, quantity_str: str, category: str = "other"):
        """
        Adds stock to the user's kitchen. Updates existing item if found (and units compatible),
        otherwise creates a new entry.
        """
        # 1. Parse quantity
        add_amount, add_unit = QuantityParser.parse(quantity_str)
        if add_amount is None:
            return f"Could not parse quantity '{quantity_str}' for {item_name}. Please interpret the quantity clearly (e.g. '2 kg', '500 g')."

        # 2. Find existing stock (Fuzzy match similar to deduction)
        # Check if stock name is inside used name OR used name is inside stock name
        stock_item = self.db.query(KitchenStock).filter(
            KitchenStock.user_id == user_id,
            KitchenStock.item_name.ilike(f"%{item_name}%") 
        ).first()
        
        if not stock_item:
            all_stocks = self.db.query(KitchenStock).filter(KitchenStock.user_id == user_id).all()
            for stock in all_stocks:
                if stock.item_name.lower() in item_name.lower():
                    stock_item = stock
                    break
        
        action = "Created new"
        
        if stock_item:
            # Try to update existing
            current_amount, current_unit = QuantityParser.parse(stock_item.quantity)
            if current_amount is not None:
                # Convert add_amount (add_unit) -> current_unit
                converted_add_amount = QuantityParser.convert(add_amount, add_unit, current_unit)
                
                if converted_add_amount is not None:
                    new_total = current_amount + converted_add_amount
                    stock_item.quantity = QuantityParser.format(new_total, current_unit)
                    action = "Updated"
                    # Update name if the new name is more specific? No, keep original name for consistency.
                else:
                    # Incompatible units (e.g. user has '5 eggs', trying to add '200g eggs')
                    # Create new entry or append to name? 
                    # Let's create a new entry to be safe, maybe refine later
                    stock_item = None 
            else:
               stock_item = None

        if not stock_item:
            # Create new
            stock_item = KitchenStock(
                user_id=user_id,
                item_name=item_name,
                quantity=QuantityParser.format(add_amount, add_unit),
                category=category,
                source="manual_chat"
            )
            self.db.add(stock_item)
            action = "Added"

        self.db.commit()
        return f"{action} '{stock_item.item_name}' (Total: {stock_item.quantity})."

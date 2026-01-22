from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

def check_and_migrate_meals_table(engine: Engine):
    """
    Checks the 'meals' table for new columns and adds them if missing.
    Works for both SQLite and PostgreSQL using SQLAlchemy.
    """
    try:
        inspector = inspect(engine)
        if not inspector.has_table("meals"):
            print("Table 'meals' does not exist yet. Skipping migration (will be created by metadata).")
            return

        existing_columns = [col['name'] for col in inspector.get_columns('meals')]
        
        # Define new columns
        new_columns = {
            "calories": "INTEGER",
            "protein_g": "INTEGER",
            "carbs_g": "INTEGER",
            "fat_g": "INTEGER",
            "meal_type": "VARCHAR",
            "kitchen_id": "VARCHAR",
            "source": "VARCHAR" # Ensure source is also there just in case 
        }
        
        with engine.connect() as conn:
            for col_name, col_type in new_columns.items():
                if col_name not in existing_columns:
                    print(f"Migrating: Adding column '{col_name}' to 'meals' table.")
                    try:
                        conn.execute(text(f"ALTER TABLE meals ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                    except Exception as e:
                        print(f"Error adding column {col_name}: {e}")
            
        print("Schema check completed.")
        
    except Exception as e:
        print(f"Migration error: {e}")


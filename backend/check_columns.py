
from app.db import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        print("Adding nutritional goal columns to user_profiles...")
        # Add columns one by one
        params = [
            ("daily_calories", "INTEGER DEFAULT 2000"),
            ("daily_protein", "INTEGER DEFAULT 150"),
            ("daily_carbs", "INTEGER DEFAULT 250"),
            ("daily_fat", "INTEGER DEFAULT 70")
        ]
        
        for col, dtype in params:
            try:
                conn.execute(text(f"ALTER TABLE user_profiles ADD COLUMN {col} {dtype}"))
                print(f"Added {col}")
            except Exception as e:
                print(f"Could not add {col} (might exist): {e}")
        
        conn.commit()
        print("Migration finished.")

if __name__ == "__main__":
    run_migration()

from app.db import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        print("Adding nutritional goal columns to user_profiles...")
        
        # List of columns to add and their types
        columns = [
            ("daily_calories", "INTEGER DEFAULT 2000"),
            ("daily_protein", "INTEGER DEFAULT 150"),
            ("daily_carbs", "INTEGER DEFAULT 250"),
            ("daily_fat", "INTEGER DEFAULT 70")
        ]
        
        for col_name, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE user_profiles ADD COLUMN {col_name} {col_type}"))
                print(f"Added {col_name}")
            except Exception as e:
                # Most likely the column already exists, which is fine
                print(f"Skipping {col_name}: {e}")
        
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    run_migration()

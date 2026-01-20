from app.db import engine
from sqlalchemy import text

def fix_rls():
    tables = [
        "users",
        "user_profiles",
        "kitchen_stock",
        "uploads",
        "meals",
        "chat_history"
    ]
    
    print("Connecting to database...")
    with engine.connect() as connection:
        for table in tables:
            print(f"Disabling RLS on table: {table}")
            try:
                connection.execute(text(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;"))
                print(f"✓ RLS disabled for {table}")
            except Exception as e:
                print(f"✗ Failed to disable RLS for {table}: {e}")
                
        connection.commit()
    print("Done! Backend should now have full access.")

if __name__ == "__main__":
    fix_rls()

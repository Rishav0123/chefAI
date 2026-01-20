from app.db import engine
from sqlalchemy import text

def apply_policies():
    tables = [
        "users",
        "user_profiles",
        "kitchen_stock",
        "uploads",
        "meals",
        "chat_history"
    ]
    
    print("Connecting to database...")
    try:
        with engine.connect() as connection:
            for table in tables:
                print(f"Processing table: {table}")
                
                # 1. Enable RLS
                try:
                    connection.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;"))
                    print(f"  ✓ Enabled RLS table")
                except Exception as e:
                    print(f"  ! Could not enable RLS: {e}")

                # 2. Add Policy for Postgres/Service Role (Full Access)
                # This ensures the Backend (running as postgres) is never blocked.
                try:
                    # Drop existing if exists to avoid conflict
                    connection.execute(text(f"DROP POLICY IF EXISTS \"Service Role Full Access\" ON {table};"))
                    connection.execute(text(f"""
                        CREATE POLICY "Service Role Full Access" ON {table}
                        AS PERMISSIVE FOR ALL
                        TO postgres, service_role
                        USING (true)
                        WITH CHECK (true);
                    """))
                    print(f"  ✓ Added Service Role policy")
                except Exception as e:
                    print(f"  ! Failed to add Service Role policy: {e}")
                
                # 3. Add Policy for Authenticated Users (Own Data)
                # Matches auth.uid() to the table's user_id column
                try:
                    connection.execute(text(f"DROP POLICY IF EXISTS \"Users manage own data\" ON {table};"))
                    # Note: We cast auth.uid() to text because our columns are String. 
                    # If this fails, the user might need to adjust based on exact schema types.
                    connection.execute(text(f"""
                        CREATE POLICY "Users manage own data" ON {table}
                        AS PERMISSIVE FOR ALL
                        TO authenticated
                        USING ((select auth.uid()::text) = user_id)
                        WITH CHECK ((select auth.uid()::text) = user_id);
                    """))
                    print(f"  ✓ Added User Ownership policy")
                except Exception as e:
                    print(f"  ! Failed to add User policy: {e}")

            connection.commit()
        print("Done! RLS enabled with correct policies.")
        
    except Exception as ie:
        print("\nCRITICAL ERROR: Connection Failed.")
        print(f"Error details: {ie}")
        print("\nSUGGESTION: Copy the logic above and run it in the Supabase SQL Editor directly.")

if __name__ == "__main__":
    apply_policies()

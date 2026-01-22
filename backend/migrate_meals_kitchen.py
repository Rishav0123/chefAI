
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("Database URL not found in environment")
    exit(1)

engine = create_engine(db_url)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE meals ADD COLUMN kitchen_id TEXT;"))
        conn.commit()
        print("Successfully added kitchen_id column to meals table")
    except Exception as e:
        print(f"Error executing migration: {e}")
        # Could be duplicate column, ignore if so
        if "DuplicateColumn" in str(e) or "already exists" in str(e):
            print("Column already exists, proceeding.")

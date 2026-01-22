
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, name, source, kitchen_id FROM meals ORDER BY created_at DESC LIMIT 5;"))
    print("--- LAST 5 MEALS ---")
    for row in result:
        print(row)

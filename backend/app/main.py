
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import kitchen, base, chat as chat_model
from .db import engine
from app.routers import stock, upload, users, chat, meals
from app.migration_utils import check_and_migrate_meals_table
import os
from dotenv import load_dotenv

load_dotenv()

# Run simple migration check
print("Starting migration check...")
try:
    check_and_migrate_meals_table(engine)
    print("Migration check completed.")
except Exception as e:
    print(f"Migration check failed: {e}")

# Create tables
print("Starting table creation...")
try:
    base.Base.metadata.create_all(bind=engine)
    print("Table creation completed.")
except Exception as e:
    print(f"Table creation failed: {e}")

app = FastAPI(title="Kitchen Buddy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for mobile testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock.router)
app.include_router(upload.router)
app.include_router(users.router)
app.include_router(chat.router)
from .routers import meals
app.include_router(meals.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Kitchen Buddy API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

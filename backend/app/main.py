
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import kitchen, base, chat as chat_model, meals
from .db import engine
from app.routers import stock, upload, users, chat, meals
from app.migration_utils import check_and_migrate_meals_table
import os
from dotenv import load_dotenv

load_dotenv()

# Run simple migration check
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Run migrations and create tables
    print("Starting migration check...", flush=True)
    
    # DEBUG: Print connection details to debug Render config
    db_url = os.getenv("DATABASE_URL", "")
    if "@" in db_url:
        # Extract and print just the user/host part, hiding password
        user_host = db_url.split("@")[1]
        user_part = db_url.split("@")[0].split("//")[1]
        username = user_part.split(":")[0]
        print(f"DEBUG: Connecting as User: '{username}' to Host: '{user_host}'", flush=True)
    else:
        print(f"DEBUG: DATABASE_URL not standard format: {db_url[:10]}...", flush=True)

    try:
        check_and_migrate_meals_table(engine)
        print("Migration check completed.", flush=True)
    except Exception as e:
        print(f"Migration check failed: {e}", flush=True)

    print("Starting table creation...", flush=True)
    try:
        base.Base.metadata.create_all(bind=engine)
        print("Table creation completed.", flush=True)
    except Exception as e:
        print(f"Table creation failed: {e}", flush=True)
    
    yield
    # Shutdown: Clean up resources if needed (e.g., db connections)
    print("Shutting down...", flush=True)

app = FastAPI(title="Kitchen Buddy API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://chef-jfngtelpf-rishavs-projects-42db2f67.vercel.app",
        "https://chef-n61hg7esr-rishavs-projects-42db2f67.vercel.app",
        "https://chef-ai-beryl.vercel.app",
        "https://chefai-m270.onrender.com",
        "http://localhost",
        "https://localhost",
        "capacitor://localhost"
    ],
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

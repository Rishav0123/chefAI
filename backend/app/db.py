import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

from sqlalchemy.pool import NullPool

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kitchen_buddy.db")

connect_args = {}
pool_class = None

if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args = {"check_same_thread": False}
    # SQLite doesn't really use the same pooling logic, but QueuePool is default for Engine
else:
    # --- OPTIMIZED POOLING CONFIGURATION ---
    # We use QueuePool (default) instead of NullPool to maintain open connections.
    # This prevents the overhead of opening/closing TCP/SSL connections for every request.
    
    # --- REVERTED TO NULLPOOL (STABILITY FIX) ---
    # The local network environment seems to block or drop persistent connections to Supabase (port 5432).
    # We revert to NullPool to ensure every request opens a fresh connection. This is slower but reliable.
    
    pool_class = NullPool
    
    # Increase timeout to handle Supabase cold starts
    connect_args = {"connect_timeout": 60}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    poolclass=pool_class
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

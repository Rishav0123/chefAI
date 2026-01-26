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
    
    # --- SMART POOLING CONFIGURATION ---
    # Render/Production: Use QueuePool for performance (keep connections open)
    # Local/Windows: Use NullPool for stability (avoid firewall/ISP timeouts)
    if os.getenv("RENDER"):
        print("Running on Render: Using QueuePool", flush=True)
        pool_class = QueuePool
        pool_size = 5
        max_overflow = 10
        pool_timeout = 30
        pool_recycle = 300
    else:
        print("Running Locally: Using NullPool", flush=True)
        pool_class = NullPool
        pool_size = None
        max_overflow = None
        pool_timeout = None
        pool_recycle = None
    
    # Increase timeout to handle Supabase cold starts
    connect_args = {
        "connect_timeout": 60, 
        "keepalives": 1, 
        "keepalives_idle": 30, 
        "keepalives_interval": 10, 
        "keepalives_count": 5
    }

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    poolclass=pool_class,
    pool_size=pool_size,
    max_overflow=max_overflow,
    pool_timeout=pool_timeout,
    pool_recycle=pool_recycle
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

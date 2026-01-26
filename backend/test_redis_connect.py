from app.services.job_store import job_store
import sys

if job_store.redis:
    print("SUCCESS: Connected to Redis!")
    print(f"Redis Info: {job_store.redis.ping()}")
    sys.exit(0)
else:
    print("FAILURE: Could not connect to Redis. Using in-memory fallback.")
    sys.exit(1)

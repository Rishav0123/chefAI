import os
import json
import redis
from dotenv import load_dotenv

load_dotenv()

class JobStore:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL")
        self.redis = None
        if self.redis_url:
            try:
                # Use from_url to parse the connection string automatically
                self.redis = redis.from_url(self.redis_url, decode_responses=True)
                # Test connection
                self.redis.ping()
                print("Connected to Redis successfully.")
            except Exception as e:
                print(f"Failed to connect to Redis: {e}. Falling back to in-memory store.")
                self.redis = None
        else:
            print("REDIS_URL not found. Using in-memory store.")
        
        # Fallback for local development if Redis fails or isn't set
        self._memory_store = {}

    def save_job(self, job_id, data):
        """
        Saves or updates a job. Data should be a dictionary.
        In Redis, we store this as a JSON string containing the whole job state.
        """
        if self.redis:
            try:
                # Expiry: 1 hour (3600 seconds) to keep things clean
                self.redis.setex(f"job:{job_id}", 3600, json.dumps(data))
            except Exception as e:
                print(f"Redis Error (Save): {e}")
        else:
            self._memory_store[job_id] = data

    def get_job(self, job_id):
        """
        Retrieves a job by ID.
        """
        if self.redis:
            try:
                data = self.redis.get(f"job:{job_id}")
                if data:
                    return json.loads(data)
                return None
            except Exception as e:
                print(f"Redis Error (Get): {e}")
                return None
        else:
            return self._memory_store.get(job_id)

    def update_status(self, job_id, status, result=None, error=None):
        """
        Helper to fetch, update status/data, and save back.
        """
        job = self.get_job(job_id)
        if not job:
            # Create if missing (shouldn't happen usually for update, but safe fallback)
            job = {"created_at": 0} 
        
        job["status"] = status
        if result is not None:
            job["data"] = result
        if error is not None:
            job["error"] = error
            
        self.save_job(job_id, job)

# Singleton instance
job_store = JobStore()

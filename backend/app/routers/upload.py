from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from ..db import get_db, SessionLocal
from ..models.kitchen import KitchenStock, User, Uploads
from ..services.ocr import extract_items_from_image, extract_meal_from_image
import json
import uuid
import time

router = APIRouter(prefix="/upload", tags=["upload"])

# In-memory job store: { "job_id": { "status": "processing" | "completed" | "error", "data": ..., "error": ... } }
# In a production app, use Redis/Database
ACTIVE_JOBS = {}

def process_upload_background(job_id: str, contents: bytes, user_id: str, upload_type: str, filename: str, content_type: str):
    print(f"[Job {job_id}] Starting background processing for {user_id}")
    ACTIVE_JOBS[job_id]["status"] = "processing"
    
    # Create a new DB session for this background thread
    db = SessionLocal()
    
    try:
        # 2. Process with OpenAI Vision
        print(f"[Job {job_id}] Calling OpenAI Vision...")
        extracted_data = None
        
        if upload_type == "meal":
            extracted_data = extract_meal_from_image(contents, mime_type=content_type)
        else:
            extracted_data = extract_items_from_image(contents, mime_type=content_type)
            
        print(f"[Job {job_id}] OpenAI Result: {extracted_data}")
        
        if not extracted_data:
             raise Exception("AI Extraction failed. The image might be unclear or empty.")

        # 3. Upload to Supabase Storage
        print(f"[Job {job_id}] Uploading to Supabase Storage...")
        public_url = f"local://{filename}" # Default fallback
        try:
             # Lazy import inside try block
            from ..services.storage import storage_service
            public_url = storage_service.upload_file(contents, filename, content_type)
            print(f"[Job {job_id}] File uploaded successfully. URL: {public_url}")
        except Exception as e:
            print(f"[Job {job_id}] Failed to upload to Supabase: {e}")
            public_url = f"local://{filename}" 

        # 4. Save Upload Record
        print(f"[Job {job_id}] Saving to DB...")
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            user = User(user_id=user_id, name="Default User")
            db.add(user)
            db.commit()

        new_upload = Uploads(
            user_id=user_id,
            file_url=public_url, 
            upload_type=f"{upload_type}_ocr",
            extracted_json=json.dumps(extracted_data)
        )
        db.add(new_upload)
        db.commit() 
        print(f"[Job {job_id}] Transaction committed.")
        
        # Update Job Status
        ACTIVE_JOBS[job_id]["status"] = "completed"
        ACTIVE_JOBS[job_id]["data"] = extracted_data

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Job {job_id}] Error: {e}")
        ACTIVE_JOBS[job_id]["status"] = "error"
        ACTIVE_JOBS[job_id]["error"] = str(e)
    finally:
        db.close()


@router.post("/")
async def upload_file(
    background_tasks: BackgroundTasks,
    user_id: str = Query(...), 
    upload_type: str = Query("stock"), # stock | meal
    file: UploadFile = File(...), 
):
    print(f"--- Received Upload Request for User: {user_id} Type: {upload_type} ---")
    print(f"File: {file.filename}, Content-Type: {file.content_type}")

    try:
        # 1. Read file immediately (before request ends)
        contents = await file.read()
        print(f"File read successfully. Size: {len(contents)} bytes")
        
        # 2. Assign Job ID
        job_id = str(uuid.uuid4())
        ACTIVE_JOBS[job_id] = {
            "status": "pending",
            "created_at": time.time()
        }
        
        # 3. Queue Background Task
        background_tasks.add_task(
            process_upload_background, 
            job_id, 
            contents, 
            user_id, 
            upload_type, 
            file.filename, 
            file.content_type
        )
        
        # 4. Return immediately
        return {
            "message": "Upload accepted. Processing in background.",
            "job_id": job_id,
            "status": "pending"
        }

    except Exception as e:
        print(f"Unexpected Error: {e}")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")


@router.get("/status/{job_id}")
async def get_upload_status(job_id: str):
    job = ACTIVE_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

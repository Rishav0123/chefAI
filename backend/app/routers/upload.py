from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..models.kitchen import KitchenStock, User, Uploads
from ..services.ocr import extract_items_from_image, extract_meal_from_image
import json

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/")
async def upload_file(
    user_id: str = Query(...), 
    upload_type: str = Query("stock"), # stock | meal
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    print(f"--- Received Upload Request for User: {user_id} Type: {upload_type} ---")
    print(f"File: {file.filename}, Content-Type: {file.content_type}")

    try:
        # 1. Read file
        contents = await file.read()
        print(f"File read successfully. Size: {len(contents)} bytes")

        # 2. Process with OpenAI Vision
        print("Calling OpenAI Vision...")
        extracted_data = None
        
        if upload_type == "meal":
            extracted_data = extract_meal_from_image(contents, mime_type=file.content_type)
        else:
            extracted_data = extract_items_from_image(contents, mime_type=file.content_type)
            
        print("OpenAI Result:", extracted_data)
        
        if not extracted_data:
             print("Extraction failed: Empty result.")
             raise HTTPException(status_code=500, detail="AI Extraction failed. The image might be unclear or empty.")

        # 3. Upload to Supabase Storage
        print("Uploading to Supabase Storage...")
        public_url = f"local://{file.filename}" # Default fallback
        try:
             # Lazy import inside try block
            from ..services.storage import storage_service
            public_url = storage_service.upload_file(contents, file.filename, file.content_type)
            print(f"File uploaded successfully. URL: {public_url}")
        except Exception as e:
            print(f"Failed to upload to Supabase (using local fallback): {e}")
            public_url = f"local://{file.filename}" 

        # 4. Save Upload Record
        print("Saving to DB...")
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
        print("Transaction committed.")
        
        # 5. Return extracted data
        return {
            "message": "Analysis complete. Please review.",
            "data": extracted_data
        }

    except HTTPException as he:
        print(f"HTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Unexpected Error: {e}")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

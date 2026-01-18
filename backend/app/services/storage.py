import os
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

# Try to import supabase, but don't crash if it's missing (fallback to dummy)
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("Warning: 'supabase' module not found. Storage service will use local fallback.")

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY") # Use service key if RLS blocks uploads
BUCKET_NAME = "kitchen-buddy"

class StorageService:
    def __init__(self):
        if SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_KEY:
             self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        else:
             self.supabase = None
             print("StorageService initialized in OFFLINE mode (Supabase unavailable).")

    def upload_file(self, file_content: bytes, filename: str, content_type: str):
        """
        Uploads a file to Supabase Storage and returns the public URL.
        """
        if not self.supabase:
            raise ImportError("Supabase client is not available.")

        # Generate a unique path: uploads/USER_ID/UUID_FILENAME
        # Since we don't have user_id here easily, let's just use a UUID prefix
        unique_filename = f"{uuid.uuid4()}_{filename}"
        path = f"uploads/{unique_filename}"

        try:
            # Upload the file
            res = self.supabase.storage.from_(BUCKET_NAME).upload(
                path=path,
                file=file_content,
                file_options={"content-type": content_type}
            )
            
            # Get public URL
            public_url = self.supabase.storage.from_(BUCKET_NAME).get_public_url(path)
            return public_url
        except Exception as e:
            print(f"Supabase Upload Error: {e}")
            raise e

storage_service = StorageService()

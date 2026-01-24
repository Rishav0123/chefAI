
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("DATABASE_URL")
if url:
    # simple masking
    print(f"DATABASE_URL found: {url.split('@')[-1] if '@' in url else url}")
else:
    print("DATABASE_URL not set")


import os
import sys
import psycopg2
from urllib.parse import urlparse

# Load env manually since we might not have python-dotenv installed in this script context
# (or just rely on os.environ if set, but better to read .env if possible)
def load_env():
    try:
        with open('.env') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    k, v = line.strip().split('=', 1)
                    os.environ[k] = v
    except:
        pass

load_env()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment.")
    sys.exit(1)

print(f"Testing connection to: {DATABASE_URL.split('@')[-1]}") # Hide password

# Parse URL
result = urlparse(DATABASE_URL)
username = result.username
password = result.password
database = result.path[1:]
hostname = result.hostname
port = result.port

print(f"Host: {hostname}")
print(f"Port: {port}")
print(f"User: {username}")
print(f"DB: {database}")

try:
    conn = psycopg2.connect(
        dbname=database,
        user=username,
        password=password,
        host=hostname,
        port=port,
        connect_timeout=10 # Short timeout
    )
    print("SUCCESS: Connection established!")
    conn.close()
except Exception as e:
    print(f"FAILURE: {e}")

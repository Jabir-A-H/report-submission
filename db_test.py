import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

print("Testing direct database connection...")
print(f"HOST: {HOST}")
print(f"PORT: {PORT}")
print(f"DBNAME: {DBNAME}")
print(f"USER: {USER}")

try:
    conn = psycopg2.connect(
        host=HOST,
        port=PORT,
        dbname=DBNAME,
        user=USER,
        password=PASSWORD,
        sslmode="require",
    )

    cursor = conn.cursor()

    # Check if people table exists
    cursor.execute(
        """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('people', 'user');
    """
    )

    tables = cursor.fetchall()
    print(f"Found tables: {tables}")

    # If people table exists, check its contents
    if any("people" in str(table) for table in tables):
        cursor.execute("SELECT COUNT(*) FROM people;")
        count = cursor.fetchone()[0]
        print(f"Number of records in people table: {count}")

        cursor.execute("SELECT name, email, user_id, active FROM people LIMIT 5;")
        users = cursor.fetchall()
        print("Sample users:")
        for user in users:
            print(f"  {user}")

    # Check if old 'user' table still exists
    if any("user" in str(table) for table in tables):
        print("WARNING: Old 'user' table still exists!")

    cursor.close()
    conn.close()
    print("Database test completed successfully")

except Exception as e:
    print(f"Database connection error: {e}")

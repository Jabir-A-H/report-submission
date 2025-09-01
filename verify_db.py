#!/usr/bin/env python3
"""
Simple script to verify database connection and table structure
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

# Get environment variables
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

print("=== Database Connection Test ===")
print(f"Host: {HOST}")
print(f"Port: {PORT}")
print(f"Database: {DBNAME}")
print(f"User: {USER}")

if not all([USER, PASSWORD, HOST, PORT, DBNAME]):
    print("❌ Missing environment variables. Check your .env file.")
    exit(1)

# Test connection
DATABASE_URL = (
    f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"
)

try:
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        print("✅ Database connection successful!")

        # Check if people table exists
        result = conn.execute(
            text(
                """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'people'
        """
            )
        )

        people_table = result.fetchone()
        if people_table:
            print("✅ 'people' table exists")

            # Count users
            count_result = conn.execute(text("SELECT COUNT(*) FROM people"))
            count = count_result.fetchone()[0]
            print(f"📊 Found {count} users in people table")

            # Show sample users
            if count > 0:
                users_result = conn.execute(
                    text(
                        """
                    SELECT name, email, user_id, active 
                    FROM people 
                    LIMIT 3
                """
                    )
                )

                print("👥 Sample users:")
                for user in users_result:
                    print(f"   - {user[0]} ({user[2]}) - {user[1]} - Active: {user[3]}")
        else:
            print("❌ 'people' table does not exist!")

        # Check for old 'user' table
        result = conn.execute(
            text(
                """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'user'
        """
            )
        )

        old_table = result.fetchone()
        if old_table:
            print("⚠️  WARNING: Old 'user' table still exists!")
        else:
            print("✅ No old 'user' table found")

except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("\n🔧 Troubleshooting tips:")
    print("1. Check your .env file exists and has correct values")
    print("2. Verify Supabase connection details")
    print("3. Check if your IP is whitelisted in Supabase")
    print("4. Try using Session Pooler instead of Transaction Pooler")

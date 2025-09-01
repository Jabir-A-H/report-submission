#!/usr/bin/env python3
"""
Fix PostgreSQL sequence for the people table.
This script resets the auto-increment sequence to the correct value.
"""

import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

# Database connection parameters
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")


def fix_people_sequence():
    """Reset the people table sequence to the correct value."""
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host=HOST,
            port=PORT,
            database=DBNAME,
            user=USER,
            password=PASSWORD,
            sslmode="require",
        )

        cursor = conn.cursor()

        # Find the maximum ID in the people table
        cursor.execute("SELECT MAX(id) FROM people;")
        max_id = cursor.fetchone()[0]

        if max_id is None:
            max_id = 0

        print(f"Current max ID in people table: {max_id}")

        # Reset the sequence to max_id + 1
        next_val = max_id + 1
        cursor.execute(f"SELECT setval('people_id_seq', {next_val}, false);")

        # Commit the changes
        conn.commit()

        # Verify the sequence is set correctly
        cursor.execute("SELECT nextval('people_id_seq');")
        new_next_val = cursor.fetchone()[0]

        print(f"Sequence reset successfully!")
        print(f"Next ID will be: {new_next_val}")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"Error fixing sequence: {e}")
        return False


def check_sequence_status():
    """Check the current status of the sequence."""
    try:
        conn = psycopg2.connect(
            host=HOST,
            port=PORT,
            database=DBNAME,
            user=USER,
            password=PASSWORD,
            sslmode="require",
        )

        cursor = conn.cursor()

        # Check current sequence value
        cursor.execute("SELECT last_value, is_called FROM people_id_seq;")
        last_value, is_called = cursor.fetchone()

        # Check max ID in table
        cursor.execute("SELECT MAX(id) FROM people;")
        max_id = cursor.fetchone()[0] or 0

        # Check count of records
        cursor.execute("SELECT COUNT(*) FROM people;")
        count = cursor.fetchone()[0]

        print(f"Sequence Status:")
        print(f"  Last value: {last_value}")
        print(f"  Is called: {is_called}")
        print(f"  Max ID in table: {max_id}")
        print(f"  Total records: {count}")

        if is_called:
            next_id = last_value + 1
        else:
            next_id = last_value

        print(f"  Next ID would be: {next_id}")

        if next_id <= max_id:
            print(f"  ⚠️  CONFLICT! Next ID ({next_id}) <= Max existing ID ({max_id})")
            return False
        else:
            print(f"  ✅ Sequence is properly synchronized")
            return True

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error checking sequence: {e}")
        return False


if __name__ == "__main__":
    print("PostgreSQL Sequence Fix for People Table")
    print("=" * 45)

    print("\n1. Checking current sequence status...")
    status_ok = check_sequence_status()

    if not status_ok:
        print("\n2. Fixing sequence...")
        if fix_people_sequence():
            print("\n3. Verifying fix...")
            check_sequence_status()
        else:
            print("Failed to fix sequence!")
    else:
        print("\nSequence is already properly synchronized!")

#!/usr/bin/env python3
"""
Simple sequence fix using SQLAlchemy - run this with Flask app context
"""

from app import app, db
from sqlalchemy import text


def fix_people_sequence():
    """Fix the people table sequence using SQLAlchemy."""
    try:
        with app.app_context():
            # Get the maximum ID from the people table
            result = db.session.execute(text("SELECT MAX(id) FROM people"))
            max_id = result.scalar()

            if max_id is None:
                max_id = 0

            print(f"Current max ID in people table: {max_id}")

            # Set the sequence to max_id + 1
            next_val = max_id + 1
            db.session.execute(
                text(f"SELECT setval('people_id_seq', {next_val}, false)")
            )
            db.session.commit()

            print(f"Sequence reset successfully! Next ID will be: {next_val}")

            # Verify the fix
            result = db.session.execute(text("SELECT nextval('people_id_seq')"))
            new_next_val = result.scalar()
            print(f"Verified next ID: {new_next_val}")

            return True

    except Exception as e:
        print(f"Error fixing sequence: {e}")
        db.session.rollback()
        return False


if __name__ == "__main__":
    print("Fixing PostgreSQL sequence for people table...")
    if fix_people_sequence():
        print("✅ Sequence fixed successfully!")
    else:
        print("❌ Failed to fix sequence!")

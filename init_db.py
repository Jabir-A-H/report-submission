"""
Database initialization script for the report-submission app.
Drops all tables, recreates them, and adds sample users.
"""

from werkzeug.security import generate_password_hash
from app import app, db, User


def init_db():
    """Drop all tables, recreate them, and add sample users."""
    with app.app_context():
        db.drop_all()
        db.create_all()
        # Create a default zone
        from app import Zone

        default_zone = Zone(name="Default Zone")
        db.session.add(default_zone)
        db.session.commit()
        # Add sample users, all assigned to the default zone
        users = [
            User(
                id=98,
                name="User One",
                mobile_number="01711111111",
                email="user1@example.com",
                password=generate_password_hash("password"),
                role="user",
                zone_id=default_zone.id,
                is_active=True,
            ),
            User(
                id=100,
                name="User Two",
                mobile_number="01722222222",
                email="user2@example.com",
                password=generate_password_hash("password"),
                role="user",
                zone_id=default_zone.id,
                is_active=True,
            ),
            User(
                id=99,
                name="Admin",
                mobile_number="01733333333",
                email="admin@example.com",
                password=generate_password_hash("password"),
                role="admin",
                zone_id=default_zone.id,
                is_active=True,
            ),
        ]
        db.session.bulk_save_objects(users)
        db.session.commit()
        # Set sqlite_sequence for user table to 102 so next id is 103
        db.session.execute("UPDATE sqlite_sequence SET seq = 102 WHERE name = 'user';")
        db.session.commit()
        print("Database initialized with sample users and a default zone.")


if __name__ == "__main__":
    init_db()

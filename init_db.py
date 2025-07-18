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
        # Add sample users, all assigned to the default zone and ward 1
        users = [
            User(
                username="user1",
                email="user1@example.com",
                password=generate_password_hash("password"),
                role="user",
                zone_id=default_zone.id,
                ward=1,
                is_active=True,
            ),
            User(
                username="user2",
                email="user2@example.com",
                password=generate_password_hash("password"),
                role="user",
                zone_id=default_zone.id,
                ward=2,
                is_active=True,
            ),
            User(
                username="admin",
                email="admin@example.com",
                password=generate_password_hash("password"),
                role="admin",
                zone_id=default_zone.id,
                ward=99,
                is_active=True,
            ),
        ]
        db.session.bulk_save_objects(users)
        db.session.commit()
        print("Database initialized with sample users and a default zone.")


if __name__ == "__main__":
    init_db()

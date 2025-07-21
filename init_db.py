"""
Database initialization script for the report-submission app.
Drops all tables, recreates them, and adds sample users and categories.
"""

from werkzeug.security import generate_password_hash
from app import app, db, User


def init_db():
    """Drop all tables, recreate them, and add sample users and predefined zones."""
    with app.app_context():
        db.drop_all()
        db.create_all()

        # Create predefined zones from TODO specification
        from app import Zone

        zone_names = [
            "শ্যামপুর জোন",
            "ডেমরা জোন",
            "যাত্রাবাড়ী পূর্ব জোন",
            "যাত্রাবাড়ী পশ্চিম জোন",
            "ওয়ারী জোন",
            "সূত্রাপুর জোন",
            "চকবাজার বংশাল জোন",
            "লালবাগ কামরাঙ্গীর চর জোন",
            "ধানমন্ডি জোন",
            "মতিঝিল জোন",
            "পল্টন জোন",
            "খিলগাঁও জোন",
            "সবুজবাগ মুগদা জোন",
        ]

        zones = []
        for zone_name in zone_names:
            zone = Zone(name=zone_name)
            zones.append(zone)
            db.session.add(zone)

        db.session.commit()

        # Add sample users, assigned to first zone
        first_zone = zones[0]
        users = [
            User(
                id=98,
                name="User One",
                mobile_number="01711111111",
                email="user1@example.com",
                password=generate_password_hash("password"),
                role="user",
                zone_id=first_zone.id,
                active=True,
            ),
            User(
                id=100,
                name="User Two",
                mobile_number="01722222222",
                email="user2@example.com",
                password=generate_password_hash("password"),
                role="user",
                zone_id=first_zone.id,
                active=True,
            ),
            User(
                id=99,
                name="Admin",
                mobile_number="01733333333",
                email="admin@example.com",
                password=generate_password_hash("password"),
                role="admin",
                zone_id=first_zone.id,
                active=True,
            ),
        ]
        db.session.bulk_save_objects(users)
        db.session.commit()

        # Set sqlite_sequence for user table to 102 so next id is 103
        db.session.execute("UPDATE sqlite_sequence SET seq = 102 WHERE name = 'user';")
        db.session.commit()

        print("Database initialized with sample users and predefined zones.")


if __name__ == "__main__":
    init_db()

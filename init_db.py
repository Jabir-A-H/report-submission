def init_db():
    """
    Database initialization script for the report-submission app.
    Drops all tables, recreates them, and adds sample users and zones.
    """
    from werkzeug.security import generate_password_hash
    from app import app, db, User, Zone

    with app.app_context():
        db.drop_all()
        db.create_all()
        # Predefined zones
        zone_names = [
            "ডি সি এস",
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
        for name in zone_names:
            zone = Zone(name=name)
            db.session.add(zone)
            zones.append(zone)
        db.session.commit()
        # Add sample users
        first_zone = zones[1]
        dcs_zone = next(z for z in zones if z.name == "ডি সি এস")
        users = [
            User(
                user_id="001",
                name="Admin",
                email="admin@example.com",
                password=generate_password_hash("password"),
                role="admin",
                zone_id=dcs_zone.id,
                active=True,
            ),
            User(
                user_id="021",
                name="User One",
                email="user1@example.com",
                password=generate_password_hash("password"),
                role="user",
                zone_id=first_zone.id,
                active=True,
            ),
            User(
                user_id="051",
                name="User Two",
                email="user2@example.com",
                password=generate_password_hash("password"),
                role="user",
                zone_id=first_zone.id,
                active=True,
            ),
            User(
                user_id="100",
                name="User Three",
                email="user3@example.com",
                password=generate_password_hash("password"),
                role="user",
                zone_id=first_zone.id,
                active=True,
            ),
        ]
        db.session.bulk_save_objects(users)
        db.session.commit()
        print("Database initialized with sample users and predefined zones.")


if __name__ == "__main__":
    init_db()

#!/usr/bin/env python3

from app import app, db, People
from werkzeug.security import check_password_hash


def test_people_table():
    """Test if the people table exists and has data"""
    with app.app_context():
        try:
            users = People.query.all()
            print(f"Found {len(users)} users in the people table")
            for user in users[:5]:  # Show first 5 users
                print(
                    f"User: {user.name}, Email: {user.email}, User_ID: {user.user_id}, Active: {user.active}, Zone_ID: {user.zone_id}"
                )
            return users
        except Exception as e:
            print(f"Error accessing people table: {e}")
            return None


def test_login(identifier, password):
    """Test login functionality"""
    with app.app_context():
        try:
            user = People.query.filter(
                (People.email == identifier) | (People.user_id == identifier)
            ).first()

            if user:
                print(
                    f"Found user: {user.name} (ID: {user.user_id}, Email: {user.email})"
                )
                print(f"User active: {user.active}")
                print(f"Password check: {check_password_hash(user.password, password)}")

                if user.active and check_password_hash(user.password, password):
                    print("LOGIN SUCCESS!")
                    return True
                else:
                    print("LOGIN FAILED: Inactive account or wrong password")
                    return False
            else:
                print(f"No user found with identifier: {identifier}")
                return False

        except Exception as e:
            print(f"Error during login test: {e}")
            return False


if __name__ == "__main__":
    print("=== Testing People Table ===")
    users = test_people_table()

    if users:
        print("\n=== Testing Login ===")
        # Test with admin credentials
        test_login("admin@example.com", "password")
        test_login("001", "password")

        # Test with user credentials
        test_login("user1@example.com", "password")
        test_login("021", "password")

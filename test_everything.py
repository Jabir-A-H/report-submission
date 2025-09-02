#!/usr/bin/env python3
"""
Simple script to test if your database and login functionality work
Run this first to diagnose any issues
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Test environment variables
print("=== Environment Variables Test ===")
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

print(f"USER: {'✅ Set' if USER else '❌ Missing'}")
print(f"PASSWORD: {'✅ Set' if PASSWORD else '❌ Missing'}")
print(f"HOST: {'✅ Set' if HOST else '❌ Missing'}")
print(f"PORT: {'✅ Set' if PORT else '❌ Missing'}")
print(f"DBNAME: {'✅ Set' if DBNAME else '❌ Missing'}")

if not all([USER, PASSWORD, HOST, PORT, DBNAME]):
    print("\n❌ Missing environment variables! Create a .env file with:")
    print("user=your_supabase_user")
    print("password=your_password")
    print("host=your_host")
    print("port=5432") 
    print("dbname=postgres")
    exit(1)

print(f"\n=== Database Connection Test ===")
print(f"Connecting to: {HOST}:{PORT}")

try:
    import psycopg2
    
    # Test direct connection with timeout
    conn = psycopg2.connect(
        host=HOST,
        port=PORT,
        dbname=DBNAME,
        user=USER,
        password=PASSWORD,
        sslmode='require',
        connect_timeout=10  # 10 second timeout
    )
    
    print("✅ Direct psycopg2 connection successful!")
    
    cursor = conn.cursor()
    
    # Test people table
    cursor.execute("SELECT COUNT(*) FROM people")
    count = cursor.fetchone()[0]
    print(f"✅ People table found with {count} records")
    
    # Test sample login
    cursor.execute("SELECT name, email, user_id, active FROM people WHERE active = true LIMIT 3")
    users = cursor.fetchall()
    
    print(f"\n=== Sample Active Users ===")
    for user in users:
        name, email, user_id, active = user
        print(f"👤 {name} (ID: {user_id}, Email: {email}, Active: {active})")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Database test completed successfully!")
    print("Your database connection is working. The issue might be with Flask/SQLAlchemy configuration.")
    
except psycopg2.OperationalError as e:
    print(f"❌ Database connection failed: {e}")
    if "timeout" in str(e).lower():
        print("🔧 This looks like a network/firewall issue")
        print("   - Check if your IP is whitelisted in Supabase")
        print("   - Try using a VPN")
        print("   - Check Windows Firewall settings")
    elif "authentication" in str(e).lower():
        print("🔧 This looks like an authentication issue")
        print("   - Verify your username and password")
        print("   - Check if the user has proper permissions")
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    print("🔧 Check your .env file and Supabase settings")

print(f"\n=== Flask App Test ===")
try:
    # Test if we can import the app
    print("Testing app import...")
    from app import app, People
    print("✅ App import successful")
    
    # Test app context
    with app.app_context():
        print("✅ App context working")
        
        # Try a simple query
        user_count = People.query.count()
        print(f"✅ SQLAlchemy query successful: {user_count} users found")
        
        # Test login query
        test_user = People.query.filter(
            (People.email == "admin@example.com") | (People.user_id == "001")
        ).first()
        
        if test_user:
            print(f"✅ Admin user found: {test_user.name} ({test_user.user_id})")
            print(f"   Active: {test_user.active}")
        else:
            print("⚠️  Admin user not found")
    
    print("\n🎉 All tests passed! Your setup should work.")
    
except Exception as e:
    print(f"❌ Flask/SQLAlchemy test failed: {e}")
    print("🔧 This suggests an issue with your Flask configuration")

print(f"\n=== Next Steps ===")
print("1. If database connection works but Flask fails:")
print("   - Check your app.py configuration")
print("   - Try running: python app.py")
print("")
print("2. If database connection fails:")
print("   - Check your .env file")
print("   - Verify Supabase settings")
print("   - Check network/firewall")
print("")
print("3. Try the app on different port:")
print("   - Run: python app.py")
print("   - Should auto-find free port")

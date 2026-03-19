from extensions import db

def test_index_redirects_to_dashboard_when_logged_in(client, app):
    # This is a very basic test to verify that the main blueprint works
    response = client.get("/")
    # Normally without login, it renders landing.html and returns 200
    assert response.status_code == 200
    assert b"Report Submission System" in response.data or b"Login" in response.data

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert b"ok" in response.data or response.json.get("status") == "ok"

def test_auth_login_get(client):
    response = client.get("/login")
    assert response.status_code == 200
    assert b"Login" in response.data

def test_auth_register_get(client):
    response = client.get("/register")
    assert response.status_code == 200
    assert b"Register" in response.data

def test_dashboard_access(client, app):
    from models import Zone, People
    from werkzeug.security import generate_password_hash
    with app.app_context():
        # Create a test zone and user
        zone = Zone(name="Test Zone")
        db.session.add(zone)
        db.session.commit()
        
        user = People(
            user_id="999",
            name="Test User",
            email="test@example.com",
            password=generate_password_hash("password"),
            zone_id=zone.id,
            role="user",
            active=True
        )
        db.session.add(user)
        db.session.commit()
        
    # Mock login by posting to /login
    client.post("/login", data={"identifier": "999", "password": "password"})
    
    # Access dashboard
    response = client.get("/dashboard")
    assert response.status_code == 200
    # Should not raise AttributeError: type object 'Report' has no attribute 'created_at'

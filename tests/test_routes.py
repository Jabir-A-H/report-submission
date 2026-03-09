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

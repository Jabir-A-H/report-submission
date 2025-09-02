"""
Alternative app.py with fallback connection methods
"""

import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager,
    login_user,
    login_required,
    logout_user,
    current_user,
    UserMixin,
)
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import create_engine, text
import psycopg2

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "your-secret-key-here")

# Get environment variables
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port", "5432")
DBNAME = os.getenv("dbname", "postgres")

print(f"Attempting to connect to: {HOST}:{PORT}")


# Try multiple connection methods
def get_database_url():
    """Try different connection string formats"""
    base_url = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}"

    connection_options = [
        f"{base_url}?sslmode=require",
        f"{base_url}?sslmode=prefer",
        f"{base_url}?sslmode=disable",
        f"{base_url}",
    ]

    for i, url in enumerate(connection_options):
        try:
            print(f"Trying connection method {i+1}...")
            test_engine = create_engine(
                url, pool_timeout=10, connect_args={"connect_timeout": 10}
            )

            # Test connection
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                print(f"✅ Connection method {i+1} successful!")
                return url

        except Exception as e:
            print(f"❌ Connection method {i+1} failed: {e}")
            continue

    raise Exception("All connection methods failed")


try:
    DATABASE_URL = get_database_url()
    print(f"Using connection: {DATABASE_URL.split('@')[0]}@***")
except Exception as e:
    print(f"💥 Could not establish database connection: {e}")
    print("Using fallback configuration - app may not work properly")
    DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"

# Configure Flask app
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"


# Simple People model for testing
class People(UserMixin, db.Model):
    __tablename__ = "people"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(3), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(10), nullable=False, default="user")
    active = db.Column(db.Boolean, default=False)
    zone_id = db.Column(db.Integer, nullable=False)

    def get_id(self):
        return str(self.id)


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(People, int(user_id))


@app.route("/")
def index():
    return f"""
    <h1>Report Submission App - Connection Test</h1>
    <p>Database URL: {DATABASE_URL.split('@')[0]}@***</p>
    <a href="/test-db">Test Database</a> | 
    <a href="/login">Login</a>
    """


@app.route("/test-db")
def test_db():
    try:
        # Test database query
        user_count = People.query.count()
        users = People.query.filter_by(active=True).limit(3).all()

        result = f"""
        <h2>Database Test Results</h2>
        <p>✅ Connection successful!</p>
        <p>Total users: {user_count}</p>
        <h3>Sample active users:</h3>
        <ul>
        """

        for user in users:
            result += f"<li>{user.name} (ID: {user.user_id}, Email: {user.email})</li>"

        result += "</ul><a href='/'>Back</a>"
        return result

    except Exception as e:
        return f"""
        <h2>Database Test Failed</h2>
        <p>❌ Error: {str(e)}</p>
        <a href='/'>Back</a>
        """


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        identifier = request.form["identifier"]
        password = request.form["password"]

        try:
            user = People.query.filter(
                (People.email == identifier) | (People.user_id == identifier)
            ).first()

            if user and user.active and check_password_hash(user.password, password):
                login_user(user)
                return f"✅ Login successful! Welcome {user.name}"
            else:
                return "❌ Invalid credentials or account not approved."

        except Exception as e:
            return f"❌ Login error: {str(e)}"

    return """
    <form method="post">
        <h2>Login Test</h2>
        <input type="text" name="identifier" placeholder="Email or User ID" required><br><br>
        <input type="password" name="password" placeholder="Password" required><br><br>
        <button type="submit">Login</button>
    </form>
    <p>Try: admin@example.com / password</p>
    <p>Or: 001 / password</p>
    <a href="/">Back</a>
    """


if __name__ == "__main__":
    # Find available port
    import socket

    def find_free_port():
        ports = [5000, 5001, 8000, 8001, 3000, 4000]
        for port in ports:
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(("localhost", port))
                    return port
            except OSError:
                continue
        return 5000

    port = find_free_port()
    print(f"🚀 Starting test server on http://localhost:{port}")
    print("Test URLs:")
    print(f"  - Main: http://localhost:{port}/")
    print(f"  - DB Test: http://localhost:{port}/test-db")
    print(f"  - Login: http://localhost:{port}/login")

    app.run(host="127.0.0.1", port=port, debug=True)

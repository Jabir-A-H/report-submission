from flask import Blueprint, jsonify, render_template, redirect, url_for, current_app
from sqlalchemy import text
from flask_login import current_user
from extensions import db

main_bp = Blueprint("main", __name__)

@main_bp.route("/health")
def health_check():
    """Lightweight health check endpoint — used by UptimeRobot to keep
    Render awake and Supabase active by making a minimal DB query."""
    try:
        result = db.session.execute(text("SELECT 1"))
        result.scalar()
        return jsonify({"status": "ok", "db": "connected"}), 200
    except Exception:
        current_app.logger.exception("Health check failed")
        return jsonify({"status": "error"}), 500


@main_bp.route("/")
def index():
    """Landing page - shows different content based on authentication status"""
    if current_user.is_authenticated:
        # User is logged in, redirect to dashboard
        return redirect(url_for("reports.dashboard"))
    else:
        # User is not logged in, show landing page
        return render_template("landing.html")

@main_bp.route("/help")
def help_page():
    return render_template("help.html")


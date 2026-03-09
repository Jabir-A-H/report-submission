from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required
from extensions import db, cache
from models import People, Zone
from utils import is_admin, get_zones_cached

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/users", methods=["GET", "POST"])
@login_required
def admin_users():
    if not is_admin():
        return redirect(url_for("reports.dashboard"))
    if request.method == "POST":
        user_id = request.form["user_id"]
        action = request.form["action"]
        people = db.session.get(People, int(user_id))
        if action == "approve":
            people.active = True
        elif action == "reject":
            db.session.delete(people)
        elif action == "assign_zone":
            zone_id = request.form.get("zone_id")
            if zone_id:
                people.zone_id = int(zone_id)
        db.session.commit()
    # Limit results for better performance
    people = People.query.limit(100).all()  # Only show first 100 users
    zones = get_zones_cached()  # Use cached zones
    return render_template("users.html", people=people, zones=zones)


@admin_bp.route("/zones", methods=["GET", "POST"])
@login_required
def admin_zones():
    if not is_admin():
        return redirect(url_for("reports.dashboard"))
    if request.method == "POST":
        name = request.form.get("name")
        if not name:
            flash("Zone name is required.")
        elif Zone.query.filter_by(name=name).first():
            flash("Zone name already exists.")
        else:
            db.session.add(Zone(name=name))
            db.session.commit()
            # Clear cache when zones are updated
            cache.delete_memoized(get_zones_cached)
            flash("Zone added successfully.")
            return redirect(url_for("admin.admin_zones"))
    zones = get_zones_cached()
    return render_template("zones.html", zones=zones)


# --- Delete Zone Route ---
@admin_bp.route("/delete_zone/<int:zone_id>", methods=["POST"])
@login_required
def delete_zone(zone_id):
    if not is_admin():
        return redirect(url_for("reports.dashboard"))
    zone = Zone.query.get_or_404(zone_id)
    if zone.people:
        flash("Cannot delete zone: users are assigned to this zone.")
        return redirect(url_for("admin.admin_zones"))
    db.session.delete(zone)
    db.session.commit()
    flash("Zone deleted successfully.")
    return redirect(url_for("admin.admin_zones"))


# --- Fix Sequence Route (Admin Only) ---
@admin_bp.route("/fix-sequence", methods=["POST"])
@login_required
def fix_sequence():
    if not is_admin():
        flash("Admin access required.")
        return redirect(url_for("reports.dashboard"))

    try:
        from sqlalchemy import text

        # Get the sequence name dynamically using pg_get_serial_sequence
        sequence_result = db.session.execute(
            text("SELECT pg_get_serial_sequence('people', 'id')")
        )
        sequence_name = sequence_result.scalar()

        if not sequence_name:
            flash("❌ Error: Could not find sequence for people.id column")
            return redirect(url_for("admin.admin_users"))

        # Get the maximum ID from the people table
        result = db.session.execute(text("SELECT MAX(id) FROM people"))
        max_id = result.scalar()

        if max_id is None:
            max_id = 0

        # Set the sequence to max_id + 1
        next_val = max_id + 1
        db.session.execute(text(f"SELECT setval('{sequence_name}', {next_val}, false)"))
        db.session.commit()

        flash(f"✅ Sequence fixed! Next ID will be: {next_val}")

    except Exception as e:
        db.session.rollback()
        flash(f"❌ Error fixing sequence: {str(e)}")

    return redirect(url_for("admin.admin_users"))

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, login_required, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2
import traceback
from extensions import db, limiter
from models import People
from utils import generate_next_user_id, get_zones_cached
from forms.auth import LoginForm, RegisterForm

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["GET", "POST"])
@limiter.limit("5 per minute")
def login():
    form = LoginForm()
    if form.validate_on_submit():
        identifier = form.identifier.data
        password = form.password.data

        try:
            user = People.query.filter(
                (People.email == identifier) | (People.user_id == identifier)
            ).first()

            if user and user.active and check_password_hash(user.password, password):
                login_user(user)
                return redirect(url_for("reports.dashboard"))
            else:
                flash("Invalid credentials or account not approved.")

        except psycopg2.OperationalError as e:
            print(f"Database connection error during login: {e}")
            traceback.print_exc()
            db.session.rollback()
            flash("Database connection issue. Please try again in a moment.")

        except Exception as e:
            print(f"Error during login: {e}")
            traceback.print_exc()
            db.session.rollback()
            db.session.rollback()
            flash("An error occurred during login. Please try again.")

    return render_template("login.html", form=form)


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))


@auth_bp.route("/register", methods=["GET", "POST"])
@limiter.limit("5 per minute")
def register():
    form = RegisterForm()
    
    # Populate the dynamic choices
    zones = get_zones_cached()
    form.zone_id.choices = [(zone.id, zone.name) for zone in zones]
    # Add a blank option for the placeholder logic
    form.zone_id.choices.insert(0, (0, "জোন নির্বাচন করুন"))

    if form.validate_on_submit():
        try:
            name = form.name.data
            email = form.email.data
            password = form.password.data
            zone_id = form.zone_id.data
            
            # Since our blank choice is 0, we should ensure they selected a valid one
            if zone_id == 0:
                flash("Please select a valid zone.")
                return redirect(url_for("auth.register"))

            if People.query.filter_by(email=email).first():
                flash("Email already registered.")
                return redirect(url_for("auth.register"))

            user_id = generate_next_user_id()
            hashed_pw = generate_password_hash(password)

            user = People(
                user_id=user_id,
                name=name,
                email=email,
                password=hashed_pw,
                zone_id=int(zone_id),
                role="user",
                active=False,
            )

            db.session.add(user)
            db.session.commit()
            flash("Registration successful! Await admin approval.")
            return redirect(url_for("auth.login"))

        except Exception as e:
            db.session.rollback()
            error_str = str(e)
            print(f"Registration error: {e}")
            traceback.print_exc()

            if "UniqueViolation" in error_str or "duplicate key" in error_str:
                if "people_pkey" in error_str:
                    flash(
                        "Database sequence error. Please contact admin to fix the sequence."
                    )
                elif "email" in error_str:
                    flash("Email already registered.")
                else:
                    flash("Registration failed: Duplicate data detected.")
            else:
                flash(f"Registration failed: {error_str}")

            return redirect(url_for("auth.register"))

    try:
        zones = get_zones_cached()
        return render_template("register.html", form=form, zones=zones)
    except Exception as e:
        print(f"Error loading zones: {e}")
        traceback.print_exc()
        flash("Error loading registration form.")
        return redirect(url_for("auth.login"))

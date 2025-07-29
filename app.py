"""
Report Submission System - Clean Implementation

Implements all updated requirements from TODO.md, TODO_2.md, and TODO_3.md.
- Section-based, dashboard-centric workflow
- Modern Flask, SQLAlchemy, Flask-Login
- No legacy or duplicate code
- Models, routes, and logic are cleanly separated
"""

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    jsonify,  # type: ignore
    send_file,  # type: ignore
)
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager,
    login_user,  # type: ignore
    login_required,  # type: ignore
    logout_user,
    current_user,
    UserMixin,
)
from werkzeug.security import generate_password_hash, check_password_hash
import os
import re
import unicodedata
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# --- Initialize Flask App and Configurations ---
BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(exist_ok=True)
DEFAULT_DB_PATH = INSTANCE_DIR / "reports.db"

db_uri = os.getenv("SQLALCHEMY_DATABASE_URI")
if not db_uri:
    db_uri = f"sqlite:///{DEFAULT_DB_PATH}"

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"  # type: ignore


# Normalize Unicode to NFC and strip whitespace
def normalize_cat(s):
    return unicodedata.normalize("NFC", s).strip()


def slugify(s):
    s = normalize_cat(s)
    s = s.lower()
    s = s.replace(" ", "-")
    for ch in ["(", ")", "্", "়", "’", '"', "'"]:
        s = s.replace(ch, "")
    s = re.sub(r"[^\w\-]+", "", s)
    return s


# --- Helper: Populate Categories for New Report ---
def populate_categories_for_report(report_id):
    from sqlalchemy.exc import IntegrityError

    # Course Categories
    course_categories = [
        "বিশিষ্টদের",
        "সাধারণদের",
        "কর্মীদের",
        "ইউনিট সভানেত্রী",
        "অগ্রসরদের",
        "শিশু- তা'লিমুল কুরআন",
        "নিরক্ষর- তা'লিমুস সলাত",
    ]
    for cat in course_categories:
        norm_cat = normalize_cat(cat)
        if not ReportCourse.query.filter_by(
            category=norm_cat, report_id=report_id
        ).first():
            try:
                db.session.add(
                    ReportCourse(category=norm_cat, number=0, report_id=report_id)
                )
                db.session.commit()
            except IntegrityError:
                db.session.rollback()

    # Organizational Categories
    org_categories = [
        "দাওয়াত দান",
        "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন",
        "সহযোগী হয়েছে",
        "সম্মতি দিয়েছেন",
        "সক্রিয় সহযোগী",
        "কর্মী",
        "রুকন",
        "দাওয়াতী ইউনিট",
        "ইউনিট",
        "সূধী",
        "এককালীন",
        "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)",
        "বই বিলি",
        "বই বিক্রি",
    ]
    for cat in org_categories:
        norm_cat = normalize_cat(cat)
        if not ReportOrganizational.query.filter_by(
            category=norm_cat, report_id=report_id
        ).first():
            try:
                db.session.add(
                    ReportOrganizational(
                        category=norm_cat, number=0, report_id=report_id
                    )
                )
                db.session.commit()
            except IntegrityError:
                db.session.rollback()

    # Personal Activities Categories
    personal_categories = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"]
    for cat in personal_categories:
        norm_cat = normalize_cat(cat)
        if not ReportPersonal.query.filter_by(
            category=norm_cat, report_id=report_id
        ).first():
            try:
                db.session.add(ReportPersonal(category=norm_cat, report_id=report_id))
                db.session.commit()
            except IntegrityError:
                db.session.rollback()

    # Meeting Categories
    meeting_categories = [
        "কমিটি বৈঠক হয়েছে",
        "মুয়াল্লিমাদের নিয়ে বৈঠক",
        "Committee Orientation",
        "Muallima Orientation",
    ]
    for cat in meeting_categories:
        norm_cat = normalize_cat(cat)
        if not ReportMeeting.query.filter_by(
            category=norm_cat, report_id=report_id
        ).first():
            try:
                db.session.add(ReportMeeting(category=norm_cat, report_id=report_id))
                db.session.commit()
            except IntegrityError:
                db.session.rollback()

    # Extra Activity Categories
    extra_categories = [
        "মক্তব সংখ্যা",
        "মক্তব বৃদ্ধি",
        "মহানগরী পরিচালিত",
        "স্থানীয়ভাবে পরিচালিত",
        "মহানগরীর সফর",
        "থানা কমিটির সফর",
        "থানা প্রতিনিধির সফর",
        "ওয়ার্ড প্রতিনিধির সফর",
    ]
    for cat in extra_categories:
        norm_cat = normalize_cat(cat)
        if not ReportExtra.query.filter_by(
            category=norm_cat, report_id=report_id
        ).first():
            try:
                db.session.add(
                    ReportExtra(category=norm_cat, number=0, report_id=report_id)
                )
                db.session.commit()
            except IntegrityError:
                db.session.rollback()


# --- Models ---


class Zone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    users = db.relationship("User", backref="zone", lazy=True)
    reports = db.relationship("Report", backref="zone", lazy=True)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(3), unique=True, nullable=False)  # 3-digit user ID
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(10), nullable=False, default="user")  # 'user' or 'admin'
    active = db.Column(db.Boolean, default=False)
    zone_id = db.Column(db.Integer, db.ForeignKey("zone.id"), nullable=False)

    def get_id(self):
        return str(self.id)


class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    zone_id = db.Column(db.Integer, db.ForeignKey("zone.id"), nullable=False)
    month = db.Column(db.Integer, nullable=True)  # Only for মাসিক
    year = db.Column(db.Integer, nullable=False)
    report_type = db.Column(db.String(20), nullable=False)  # মাসিক, ত্রৈমাসিক, ...
    header = db.relationship("ReportHeader", uselist=False, backref="report")
    courses = db.relationship("ReportCourse", backref="report", lazy=True)
    organizational = db.relationship(
        "ReportOrganizational", backref="report", lazy=True
    )
    personal = db.relationship("ReportPersonal", backref="report", lazy=True)
    meetings = db.relationship("ReportMeeting", backref="report", lazy=True)
    extras = db.relationship("ReportExtra", backref="report", lazy=True)
    comments = db.relationship("ReportComment", uselist=False, backref="report")


class ReportHeader(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    responsible_name = db.Column(db.String(100), nullable=False)
    thana = db.Column(db.String(100), nullable=False)
    ward = db.Column(db.Integer, nullable=False)
    total_muallima = db.Column(db.Integer, default=0, nullable=False)
    muallima_increase = db.Column(db.Integer, default=0, nullable=False)
    muallima_decrease = db.Column(db.Integer, default=0, nullable=False)
    certified_muallima = db.Column(db.Integer, default=0, nullable=False)
    certified_muallima_taking_classes = db.Column(db.Integer, default=0, nullable=False)
    trained_muallima = db.Column(db.Integer, default=0, nullable=False)
    trained_muallima_taking_classes = db.Column(db.Integer, default=0, nullable=False)
    total_unit = db.Column(db.Integer, default=0, nullable=False)
    units_with_muallima = db.Column(db.Integer, default=0, nullable=False)


class ReportCourse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    number = db.Column(db.Integer, default=0, nullable=False)
    increase = db.Column(db.Integer, default=0, nullable=False)
    decrease = db.Column(db.Integer, default=0, nullable=False)
    sessions = db.Column(db.Integer, default=0, nullable=False)
    students = db.Column(db.Integer, default=0, nullable=False)
    attendance = db.Column(db.Integer, default=0, nullable=False)
    status_board = db.Column(db.Integer, default=0, nullable=False)
    status_qayda = db.Column(db.Integer, default=0, nullable=False)
    status_ampara = db.Column(db.Integer, default=0, nullable=False)
    status_quran = db.Column(db.Integer, default=0, nullable=False)
    completed = db.Column(db.Integer, default=0, nullable=False)
    correctly_learned = db.Column(db.Integer, default=0, nullable=False)


class ReportOrganizational(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    number = db.Column(db.Integer, default=0, nullable=False)
    increase = db.Column(db.Integer, default=0, nullable=False)
    amount = db.Column(db.Integer, nullable=True)
    comments = db.Column(db.String(200), nullable=True)


class ReportPersonal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    teaching = db.Column(db.Integer, default=0, nullable=False)
    learning = db.Column(db.Integer, default=0, nullable=False)
    olama_invited = db.Column(db.Integer, default=0, nullable=False)
    became_shohojogi = db.Column(db.Integer, default=0, nullable=False)
    became_sokrio_shohojogi = db.Column(db.Integer, default=0, nullable=False)
    became_kormi = db.Column(db.Integer, default=0, nullable=False)
    became_rukon = db.Column(db.Integer, default=0, nullable=False)


class ReportMeeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    city_count = db.Column(db.Integer, default=0, nullable=False)
    city_avg_attendance = db.Column(db.Integer, default=0, nullable=False)
    thana_count = db.Column(db.Integer, default=0, nullable=False)
    thana_avg_attendance = db.Column(db.Integer, default=0, nullable=False)
    ward_count = db.Column(db.Integer, default=0, nullable=False)
    ward_avg_attendance = db.Column(db.Integer, default=0, nullable=False)
    comments = db.Column(db.Text, nullable=True)


class ReportExtra(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    number = db.Column(db.Integer, default=0, nullable=False)


class ReportComment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    comment = db.Column(db.Text, nullable=True)


# --- Login Manager ---


@login_manager.user_loader  # type: ignore
def load_user(user_id):  # type: ignore
    return db.session.get(User, int(user_id))  # type: ignore


# --- Utility Functions ---


def is_admin():
    return current_user.is_authenticated and current_user.role == "admin"


# --- Utility function to generate next user_id ---
def generate_next_user_id():
    last_user = User.query.order_by(User.user_id.desc()).first()
    if last_user and last_user.user_id.isdigit():
        next_id = int(last_user.user_id) + 1
    else:
        next_id = 100
    return f"{next_id:03d}"


# --- Jinja2 Filters ---


@app.template_filter("month_name")
def month_name(month):
    months = [
        "জানুয়ারি",
        "ফেব্রুয়ারি",
        "মার্চ",
        "এপ্রিল",
        "মে",
        "জুন",
        "জুলাই",
        "আগস্ট",
        "সেপ্টেম্বর",
        "অক্টোবর",
        "নভেম্বর",
        "ডিসেম্বর",
    ]
    try:
        return months[int(month) - 1]
    except (IndexError, ValueError, TypeError):
        return ""


# --- Jinja2 Global: Get Current Report ---
def get_current_report(zone_id, month, year, report_type):
    query = {
        "zone_id": zone_id,
        "year": year,
        "report_type": report_type,
    }
    if report_type == "মাসিক":
        query["month"] = month
    return Report.query.filter_by(**query).first()


app.jinja_env.globals.update(get_current_report=get_current_report)


# --- Routes ---


@app.route("/")
@login_required
def dashboard():
    from datetime import datetime

    month = request.args.get("month")
    year = request.args.get("year")
    report_type = request.args.get("report_type")
    now = datetime.now()
    if not month:
        month = now.month
    if not year:
        year = now.year
    if not report_type:
        report_type = "মাসিক"  # Default report type

    # Define available report types
    report_types = [
        {"value": "মাসিক", "label": "মাসিক"},
        {"value": "ত্রৈমাসিক", "label": "ত্রৈমাসিক"},
        {"value": "ষান্মাসিক", "label": "ষান্মাসিক"},
        {"value": "নয়-মাসিক", "label": "নয়-মাসিক"},
        {"value": "বার্ষিক", "label": "বার্ষিক"},
    ]

    if is_admin():
        return render_template(
            "admin_reports.html",
            user=current_user,
            month=month,
            year=year,
            report_type=report_type,
            report_types=report_types,
        )
    else:
        # Build sections list with completion status and navigation URLs
        section_defs = [
            {
                "name": "মূল তথ্য",
                "icon": "📝",
                "url": url_for("report_header", month=month, year=year),
                "model": ReportHeader,
            },
            {
                "name": "গ্রুপ / কোর্স রিপোর্ট",
                "icon": "📚",
                "url": url_for("report_courses", month=month, year=year),
                "model": ReportCourse,
            },
            {
                "name": "দাওয়াত ও সংগঠন",
                "icon": "🏢",
                "url": url_for("report_organizational", month=month, year=year),
                "model": ReportOrganizational,
            },
            {
                "name": "ব্যক্তিগত উদ্যোগে তা’লীমুল কুরআন",
                "icon": "🗃",
                "url": url_for("report_personal", month=month, year=year),
                "model": ReportPersonal,
            },
            {
                "name": "বৈঠকসমূহ",
                "icon": "🤝",
                "url": url_for("report_meetings", month=month, year=year),
                "model": ReportMeeting,
            },
            {
                "name": "মক্তব ও সফর রিপোর্ট",
                "icon": "✨",
                "url": url_for("report_extras", month=month, year=year),
                "model": ReportExtra,
            },
            {
                "name": "মন্তব্য রিপোর্ট",
                "icon": "💬",
                "url": url_for("report_comments", month=month, year=year),
                "model": ReportComment,
            },
        ]

        # Find the user's zone report for the selected period
        report = Report.query.filter_by(
            zone_id=current_user.zone_id,
            month=month,
            year=year,
        ).first()
        # If a new report was just created, populate its categories
        if report:
            populate_categories_for_report(report.id)

        # Map model class to relationship attribute for uselist=False
        model_to_attr = {
            "ReportHeader": "header",
            "ReportComment": "comments",
        }
        sections = []
        for sdef in section_defs:
            completed = False
            if report:
                model_name = sdef["model"].__name__
                rel_attr = model_to_attr.get(model_name, model_name.lower())
                if hasattr(report, rel_attr):
                    section_obj = getattr(report, rel_attr)
                    # uselist=False: object, uselist=True: list
                    if isinstance(section_obj, list):
                        completed = section_obj and len(section_obj) > 0
                    else:
                        completed = section_obj is not None
            sections.append(
                {
                    "name": sdef["name"],
                    "icon": sdef["icon"],
                    "url": sdef["url"],
                    "completed": completed,
                }
            )

        report_month_year = f"{month}/{year}"

        return render_template(
            "index.html",
            user=current_user,
            month=month,
            year=year,
            sections=sections,
            report_month_year=report_month_year,
        )


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        identifier = request.form["identifier"]  # Can be email or user_id
        password = request.form["password"]
        user = User.query.filter(
            (User.email == identifier) | (User.user_id == identifier)
        ).first()
        if user and user.active and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for("dashboard"))
        else:
            flash("Invalid credentials or account not approved.")
    return render_template("login.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form["name"]
        email = request.form["email"]
        password = request.form["password"]
        zone_id = request.form["zone_id"]
        if User.query.filter_by(email=email).first():
            flash("Email already registered.")
            return redirect(url_for("register"))
        user_id = generate_next_user_id()
        hashed_pw = generate_password_hash(password)
        user = User(
            user_id=user_id,
            name=name,
            email=email,
            password=hashed_pw,
            zone_id=zone_id,
            role="user",
            active=False,
        )
        db.session.add(user)
        db.session.commit()
        flash("Registration successful! Await admin approval.")
        return redirect(url_for("login"))
    zones = Zone.query.all()
    return render_template("register.html", zones=zones)


# --- Admin Management ---


@app.route("/users", methods=["GET", "POST"])
@login_required
def admin_users():
    if not is_admin():
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        user_id = request.form["user_id"]
        action = request.form["action"]
        user = db.session.get(User, int(user_id))
        if action == "approve":
            user.active = True
        elif action == "reject":
            db.session.delete(user)
        elif action == "assign_zone":
            zone_id = request.form.get("zone_id")
            if zone_id:
                user.zone_id = int(zone_id)
        db.session.commit()
    users = User.query.all()
    zones = Zone.query.all()
    return render_template("users.html", users=users, zones=zones)


@app.route("/zones", methods=["GET", "POST"])
@login_required
def admin_zones():
    if not is_admin():
        return redirect(url_for("dashboard"))
    if request.method == "POST":
        name = request.form.get("name")
        if not name:
            flash("Zone name is required.")
        elif Zone.query.filter_by(name=name).first():
            flash("Zone name already exists.")
        else:
            db.session.add(Zone(name=name))
            db.session.commit()
            flash("Zone added successfully.")
            return redirect(url_for("admin_zones"))
    zones = Zone.query.all()
    return render_template("zones.html", zones=zones)


# --- Delete Zone Route ---
@app.route("/delete_zone/<int:zone_id>", methods=["POST"])
@login_required
def delete_zone(zone_id):
    if not is_admin():
        return redirect(url_for("dashboard"))
    zone = Zone.query.get_or_404(zone_id)
    if zone.users:
        flash("Cannot delete zone: users are assigned to this zone.")
        return redirect(url_for("admin_zones"))
    db.session.delete(zone)
    db.session.commit()
    flash("Zone deleted successfully.")
    return redirect(url_for("admin_zones"))


@app.route("/zone_reports")
@login_required
def zone_reports():
    if not is_admin():
        return redirect(url_for("dashboard"))
    reports = Report.query.all()
    return render_template("zone_reports.html", reports=reports)


# --- City Report Page ---
@app.route("/city_report")
@login_required
def city_report_page():
    if not is_admin():
        return redirect(url_for("dashboard"))
    from datetime import datetime

    month = request.args.get("month")
    year = request.args.get("year")
    now = datetime.now()
    if not month:
        month = now.month
    if not year:
        year = now.year
    course_totals = {}  # TODO: Replace with real data
    return render_template(
        "city_report.html", month=month, year=year, course_totals=course_totals
    )


# --- Helper: Get Report Period ---
def get_report_period():
    from datetime import datetime

    month = request.args.get("month")
    year = request.args.get("year")
    report_type = request.args.get("report_type", "মাসিক")
    now = datetime.now()
    if not month and report_type == "মাসিক":
        month = now.month
    if not year:
        year = now.year
    return int(month) if month else None, int(year), report_type


# --- DRY Section POST Handler ---
def handle_section_post(report, section_attr, categories, fields):
    section_list = getattr(report, section_attr)
    model = section_list[0].__class__ if section_list else None
    # Normalize all categories for robust matching
    # Always use normalized categories and slugs
    norm_categories = [normalize_cat(cat) for cat in categories]
    slugs = [slugify(cat) for cat in norm_categories]
    slug_to_cat = {slug: cat for slug, cat in zip(slugs, norm_categories)}
    cat_to_slug = {cat: slug for cat, slug in zip(norm_categories, slugs)}
    # Map DB rows by slug for robust matching
    db_rows_by_slug = {slugify(normalize_cat(r.category)): r for r in section_list}
    for slug, cat in slug_to_cat.items():
        row = db_rows_by_slug.get(slug)
        if not row and model:
            row = model(report_id=report.id, category=cat)
            db.session.add(row)
        if row:
            for field in fields:
                form_key = f"{field}_{slug}"
                value = request.form.get(form_key)
                if value is not None:
                    col_type = getattr(row.__class__, field).type
                    if isinstance(col_type, db.Integer):
                        value = int(value) if value else 0
                    elif isinstance(col_type, db.String):
                        value = value.strip() or None
                    setattr(row, field, value)
    db.session.commit()


@app.route("/report/header", methods=["GET", "POST"])
@login_required
def report_header():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = Report.query.filter_by(
            zone_id=current_user.zone_id,
            month=month,
            year=year,
            report_type=report_type,
        ).first()
        if not report:
            # Create report if not exists
            report = Report(
                zone_id=current_user.zone_id,
                month=month,
                year=year,
                report_type=report_type,
            )
            db.session.add(report)
            db.session.commit()

        if request.method == "POST":
            # Get form data
            responsible_name = request.form.get("responsible_name")
            thana = request.form.get("thana")
            ward = request.form.get("ward")
            total_muallima = request.form.get("total_muallima", type=int)
            muallima_increase = request.form.get("muallima_increase", type=int)
            muallima_decrease = request.form.get("muallima_decrease", type=int)
            certified_muallima = request.form.get("certified_muallima", type=int)
            certified_muallima_taking_classes = request.form.get(
                "certified_muallima_taking_classes", type=int
            )
            trained_muallima = request.form.get("trained_muallima", type=int)
            trained_muallima_taking_classes = request.form.get(
                "trained_muallima_taking_classes", type=int
            )
            total_unit = request.form.get("total_unit", type=int)
            units_with_muallima = request.form.get("units_with_muallima", type=int)

            # Validate required fields
            if not responsible_name or not thana or not ward:
                error = "সব আবশ্যক ঘর পূরণ করুন।"
            else:
                # Create or update ReportHeader
                header = report.header
                if not header:
                    header = ReportHeader(report_id=report.id)
                    db.session.add(header)
                header.responsible_name = responsible_name
                header.thana = thana
                header.ward = ward
                header.total_muallima = total_muallima or 0
                header.muallima_increase = muallima_increase or 0
                header.muallima_decrease = muallima_decrease or 0
                header.certified_muallima = certified_muallima or 0
                header.certified_muallima_taking_classes = (
                    certified_muallima_taking_classes or 0
                )
                header.trained_muallima = trained_muallima or 0
                header.trained_muallima_taking_classes = (
                    trained_muallima_taking_classes or 0
                )
                header.total_unit = total_unit or 0
                header.units_with_muallima = units_with_muallima or 0
                db.session.commit()
                success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
                # Refresh report object
                report = Report.query.filter_by(id=report.id).first()

    return render_template(
        "report/header.html",
        month=month,
        year=year,
        report_type=report_type,
        report=report,
        error=error,
        success=success,
    )


@app.route("/report/courses", methods=["GET", "POST"])
@login_required
def report_courses():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = get_current_report(current_user.zone_id, month, year, report_type)
        if request.method == "POST" and report:
            course_categories = [
                "বিশিষ্টদের",
                "সাধারণদের",
                "কর্মীদের",
                "ইউনিট সভানেত্রী",
                "অগ্রসরদের",
                "শিশু- তা'লিমুল কুরআন",
                "নিরক্ষর- তা'লিমুস সলাত",
            ]
            fields = [
                "number",
                "increase",
                "decrease",
                "sessions",
                "students",
                "attendance",
                "status_board",
                "status_qayda",
                "status_ampara",
                "status_quran",
                "completed",
                "correctly_learned",
            ]
            norm_categories = [normalize_cat(cat) for cat in course_categories]
            slugs = [slugify(cat) for cat in norm_categories]
            slug_to_cat = {slug: cat for slug, cat in zip(slugs, norm_categories)}
            cat_to_slug = {cat: slug for cat, slug in zip(norm_categories, slugs)}
            handle_section_post(report, "courses", course_categories, fields)
            success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
        # Always provide slug mappings to template
        course_categories = [
            normalize_cat(cat)
            for cat in [
                "বিশিষ্টদের",
                "সাধারণদের",
                "কর্মীদের",
                "ইউনিট সভানেত্রী",
                "অগ্রসরদের",
                "শিশু- তা'লিমুল কুরআন",
                "নিরক্ষর- তা'লিমুস সলাত",
            ]
        ]
        slugs = [slugify(cat) for cat in course_categories]
        slug_to_cat = {slug: cat for slug, cat in zip(slugs, course_categories)}
        cat_to_slug = {cat: slug for cat, slug in zip(course_categories, slugs)}
        return render_template(
            "report/courses.html",
            month=month,
            year=year,
            report_type=report_type,
            report=report,
            error=error,
            success=success,
            course_categories=course_categories,
            slug_to_cat=slug_to_cat,
            cat_to_slug=cat_to_slug,
        )


@app.route("/report/organizational", methods=["GET", "POST"])
@login_required
def report_organizational():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = get_current_report(current_user.zone_id, month, year, report_type)
        org_categories = [
            "দাওয়াত দান",
            "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন",
            "সহযোগী হয়েছে",
            "সম্মতি দিয়েছেন",
            "সক্রিয় সহযোগী",
            "কর্মী",
            "রুকন",
            "দাওয়াতী ইউনিট",
            "ইউনিট",
            "সূধী",
            "এককালীন",
            "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)",
            "বই বিলি",
            "বই বিক্রি",
        ]
        # Normalize categories for template and mapping
        # Normalize categories and always use slugs for template mapping
        norm_categories = [normalize_cat(cat) for cat in org_categories]
        slugs = [slugify(cat) for cat in norm_categories]
        slug_to_cat = {slug: cat for slug, cat in zip(slugs, norm_categories)}
        cat_to_slug = {cat: slug for cat, slug in zip(norm_categories, slugs)}
        org_categories = norm_categories
        if request.method == "POST" and report:
            fields = ["number", "increase", "amount", "comments"]
            handle_section_post(report, "organizational", org_categories, fields)
            success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
    return render_template(
        "report/organizational.html",
        month=month,
        year=year,
        report_type=report_type,
        report=report,
        error=error,
        success=success,
        org_categories=org_categories,
        slug_to_cat=slug_to_cat,
        cat_to_slug=cat_to_slug,
    )


@app.route("/report/personal", methods=["GET", "POST"])
@login_required
def report_personal():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = get_current_report(current_user.zone_id, month, year, report_type)
        if request.method == "POST" and report:
            personal_categories = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"]
            fields = [
                "teaching",
                "learning",
                "olama_invited",
                "became_shohojogi",
                "became_sokrio_shohojogi",
                "became_kormi",
                "became_rukon",
            ]
            norm_categories = [normalize_cat(cat) for cat in personal_categories]
            slugs = [slugify(cat) for cat in norm_categories]
            slug_to_cat = {slug: cat for slug, cat in zip(slugs, norm_categories)}
            cat_to_slug = {cat: slug for cat, slug in zip(norm_categories, slugs)}
            handle_section_post(report, "personal", personal_categories, fields)
            success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
        personal_categories = [
            normalize_cat(cat) for cat in ["রুকন", "কর্মী", "সক্রিয় সহযোগী"]
        ]
        slugs = [slugify(cat) for cat in personal_categories]
        slug_to_cat = {slug: cat for slug, cat in zip(slugs, personal_categories)}
        cat_to_slug = {cat: slug for cat, slug in zip(personal_categories, slugs)}
        return render_template(
            "report/personal.html",
            month=month,
            year=year,
            report_type=report_type,
            report=report,
            error=error,
            success=success,
            personal_categories=personal_categories,
            slug_to_cat=slug_to_cat,
            cat_to_slug=cat_to_slug,
        )


@app.route("/report/meetings", methods=["GET", "POST"])
@login_required
def report_meetings():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = get_current_report(current_user.zone_id, month, year, report_type)
        if request.method == "POST" and report:
            meeting_categories = [
                "কমিটি বৈঠক হয়েছে",
                "মুয়াল্লিমাদের নিয়ে বৈঠক",
                "Committee Orientation",
                "Muallima Orientation",
            ]
            fields = [
                "city_count",
                "city_avg_attendance",
                "thana_count",
                "thana_avg_attendance",
                "ward_count",
                "ward_avg_attendance",
                "comments",
            ]
            norm_categories = [normalize_cat(cat) for cat in meeting_categories]
            slugs = [slugify(cat) for cat in norm_categories]
            slug_to_cat = {slug: cat for slug, cat in zip(slugs, norm_categories)}
            cat_to_slug = {cat: slug for cat, slug in zip(norm_categories, slugs)}
            handle_section_post(report, "meetings", meeting_categories, fields)
            success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
        meeting_categories = [
            normalize_cat(cat)
            for cat in [
                "কমিটি বৈঠক হয়েছে",
                "মুয়াল্লিমাদের নিয়ে বৈঠক",
                "Committee Orientation",
                "Muallima Orientation",
            ]
        ]
        slugs = [slugify(cat) for cat in meeting_categories]
        slug_to_cat = {slug: cat for slug, cat in zip(slugs, meeting_categories)}
        cat_to_slug = {cat: slug for cat, slug in zip(meeting_categories, slugs)}
        return render_template(
            "report/meetings.html",
            month=month,
            year=year,
            report_type=report_type,
            report=report,
            error=error,
            success=success,
            meeting_categories=meeting_categories,
            slug_to_cat=slug_to_cat,
            cat_to_slug=cat_to_slug,
        )


@app.route("/report/extras", methods=["GET", "POST"])
@login_required
def report_extras():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = get_current_report(current_user.zone_id, month, year, report_type)
        if request.method == "POST" and report:
            extra_categories = [
                "মক্তব সংখ্যা",
                "মক্তব বৃদ্ধি",
                "মহানগরী পরিচালিত",
                "স্থানীয়ভাবে পরিচালিত",
                "মহানগরীর সফর",
                "থানা কমিটির সফর",
                "থানা প্রতিনিধির সফর",
                "ওয়ার্ড প্রতিনিধির সফর",
            ]
            fields = ["number"]
            norm_categories = [normalize_cat(cat) for cat in extra_categories]
            slugs = [slugify(cat) for cat in norm_categories]
            slug_to_cat = {slug: cat for slug, cat in zip(slugs, norm_categories)}
            cat_to_slug = {cat: slug for cat, slug in zip(norm_categories, slugs)}
            handle_section_post(report, "extras", extra_categories, fields)
            success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
        extra_categories = [
            normalize_cat(cat)
            for cat in [
                "মক্তব সংখ্যা",
                "মক্তব বৃদ্ধি",
                "মহানগরী পরিচালিত",
                "স্থানীয়ভাবে পরিচালিত",
                "মহানগরীর সফর",
                "থানা কমিটির সফর",
                "থানা প্রতিনিধির সফর",
                "ওয়ার্ড প্রতিনিধির সফর",
            ]
        ]
        slugs = [slugify(cat) for cat in extra_categories]
        slug_to_cat = {slug: cat for slug, cat in zip(slugs, extra_categories)}
        cat_to_slug = {cat: slug for cat, slug in zip(extra_categories, slugs)}
        return render_template(
            "report/extras.html",
            month=month,
            year=year,
            report_type=report_type,
            report=report,
            error=error,
            success=success,
            extra_categories=extra_categories,
            slug_to_cat=slug_to_cat,
            cat_to_slug=cat_to_slug,
        )


@app.route("/report/comments", methods=["GET", "POST"])
@login_required
def report_comments():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = get_current_report(current_user.zone_id, month, year, report_type)
        if request.method == "POST" and report:
            comment = request.form.get("comment", "").strip() or None
            if report.comments:
                report.comments.comment = comment
            else:
                db.session.add(ReportComment(report_id=report.id, comment=comment))
            db.session.commit()
            success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
    return render_template(
        "report/comments.html",
        month=month,
        year=year,
        report_type=report_type,
        report=report,
        error=error,
        success=success,
    )


# --- At a Glance / Summary Report ---


@app.route("/report")
@login_required
def report_summary():
    from datetime import datetime

    report_id = request.args.get("report_id")
    report_type = request.args.get("report_type", "মাসিক")
    month = request.args.get("month")
    year = request.args.get("year")
    now = datetime.now()
    if not month and report_type == "মাসিক":
        month = now.month
    if not year:
        year = now.year

    report = None
    # If report_id is provided and user is admin, show that report
    if report_id and is_admin():
        report = Report.query.filter_by(id=report_id).first()
        # Optionally, set month/year/report_type from the report for display
        if report:
            month = report.month
            year = report.year
            report_type = report.report_type
    else:
        # Get the report object for the current user's zone, type, month, year
        query = {
            "zone_id": current_user.zone_id,
            "year": int(year),
            "report_type": report_type,
        }
        if report_type == "মাসিক":
            query["month"] = int(month)
        report = Report.query.filter_by(**query).first()

    return render_template(
        "report.html",
        report=report,
        report_type=report_type,
        month=month,
        year=year,
    )


# --- Help Page ---


@app.route("/help")
def help_page():
    return render_template("help.html")


# --- Error Handlers ---


@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404


# --- Main ---

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true",
    )

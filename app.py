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
        "রুকনদের অনুশীলনী ক্লাস",
        "তারবিয়াত বৈঠক",
        "পারিবারিক ইউনিটে তা'লীমুল কুরআন",
        "শিশু- তা'লিমুল কুরআন",
        "নিরক্ষর- তা'লিমুস সলাত",
    ]
    for cat in course_categories:
        if not ReportCourse.query.filter_by(category=cat, report_id=report_id).first():
            try:
                db.session.add(
                    ReportCourse(category=cat, number=0, report_id=report_id)
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
        if not ReportOrganizational.query.filter_by(
            category=cat, report_id=report_id
        ).first():
            try:
                db.session.add(
                    ReportOrganizational(category=cat, number=0, report_id=report_id)
                )
                db.session.commit()
            except IntegrityError:
                db.session.rollback()

    # Personal Activities Categories
    personal_categories = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"]
    for cat in personal_categories:
        if not ReportPersonal.query.filter_by(
            category=cat, report_id=report_id
        ).first():
            try:
                db.session.add(ReportPersonal(category=cat, report_id=report_id))
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
        if not ReportMeeting.query.filter_by(category=cat, report_id=report_id).first():
            try:
                db.session.add(ReportMeeting(category=cat, report_id=report_id))
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
        if not ReportExtra.query.filter_by(category=cat, report_id=report_id).first():
            try:
                db.session.add(ReportExtra(category=cat, number=0, report_id=report_id))
                db.session.commit()
            except IntegrityError:
                db.session.rollback()


# --- Seed Predefined Categories ---
def seed_predefined_categories():
    from sqlalchemy.exc import IntegrityError

    # Course Categories
    course_categories = [
        "বিশিষ্টদের",
        "সাধারণদের",
        "কর্মীদের",
        "ইউনিট সভানেত্রী",
        "অগ্রসরদের",
        "রুকনদের অনুশীলনী ক্লাস",
        "তারবিয়াত বৈঠক",
        "পারিবারিক ইউনিটে তা'লীমুল কুরআন",
        "শিশু- তা'লিমুল কুরআন",
        "নিরক্ষর- তা'লিমুস সলাত",
    ]
    for cat in course_categories:
        if not ReportCourse.query.filter_by(category=cat).first():
            try:
                db.session.add(ReportCourse(category=cat, number=0, report_id=1))
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
        if not ReportOrganizational.query.filter_by(category=cat).first():
            try:
                db.session.add(
                    ReportOrganizational(category=cat, number=0, report_id=1)
                )
                db.session.commit()
            except IntegrityError:
                db.session.rollback()

    # Personal Activities Categories
    personal_categories = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"]
    for cat in personal_categories:
        if not ReportPersonal.query.filter_by(category=cat).first():
            try:
                db.session.add(ReportPersonal(category=cat, report_id=1))
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
        if not ReportMeeting.query.filter_by(category=cat).first():
            try:
                db.session.add(ReportMeeting(category=cat, report_id=1))
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
        if not ReportExtra.query.filter_by(category=cat).first():
            try:
                db.session.add(ReportExtra(category=cat, number=0, report_id=1))
                db.session.commit()
            except IntegrityError:
                db.session.rollback()


# Call this function once after db.create_all()
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

from dotenv import load_dotenv

load_dotenv()

# --- Initialize Flask App and Configurations ---
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"  # type: ignore

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
    last_user = User.query.order_by(User.id.desc()).first()
    next_id = 1 if not last_user else last_user.id + 1
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

        sections = []
        for sdef in section_defs:
            completed = False
            if report:
                # For uselist=False relationships
                if hasattr(report, sdef["model"].__name__.lower()):
                    section_obj = getattr(report, sdef["model"].__name__.lower())
                    completed = section_obj is not None
                else:
                    # For uselist=True relationships
                    rel = getattr(report, sdef["model"].__name__.lower(), None)
                    completed = rel and len(rel) > 0
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


# --- Admin: View Individual Zone Report ---
@app.route("/zone_report/<int:report_id>")
@login_required
def view_zone_report(report_id):
    if not is_admin():
        return redirect(url_for("dashboard"))
    report = Report.query.get_or_404(report_id)
    return render_template("zone_report.html", report=report)


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


# --- Report Section Routes ---


@app.route("/report/header", methods=["GET", "POST"])
@login_required
def report_header():
    # ...section logic here...
    return render_template("report/header.html")


@app.route("/report/courses", methods=["GET", "POST"])
@login_required
def report_courses():
    from datetime import datetime

    month = request.args.get("month")
    year = request.args.get("year")
    now = datetime.now()
    if not month:
        month = now.month
    if not year:
        year = now.year

    # Get the report object for the current user, month, year
    report = None
    if current_user.is_authenticated:
        report = Report.query.filter_by(
            zone_id=current_user.zone_id, month=month, year=year
        ).first()
    return render_template(
        "report/courses.html",
        month=month,
        year=year,
        report=report,
    )


@app.route("/report/organizational", methods=["GET", "POST"])
@login_required
def report_organizational():
    # ...section logic here...
    return render_template("report/organizational.html")


@app.route("/report/personal", methods=["GET", "POST"])
@login_required
def report_personal():
    # ...section logic here...
    return render_template("report/personal.html")


@app.route("/report/meetings", methods=["GET", "POST"])
@login_required
def report_meetings():
    # ...section logic here...
    return render_template("report/meetings.html")


@app.route("/report/extras", methods=["GET", "POST"])
@login_required
def report_extras():
    # ...section logic here...
    return render_template("report/extras.html")


@app.route("/report/comments", methods=["GET", "POST"])
@login_required
def report_comments():
    # ...section logic here...
    return render_template("report/comments.html")


# --- At a Glance / Summary Report ---


@app.route("/report")
@login_required
def report_summary():
    from datetime import datetime

    month = request.args.get("month")
    year = request.args.get("year")
    now = datetime.now()
    if not month:
        month = now.month
    if not year:
        year = now.year

    return render_template(
        "report.html",
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
    app.run(debug=True)

# --- ADMIN: View, edit, unlock, comment, audit trail ---
@app.route('/admin/reports')
@login_required
def admin_reports():
    if current_user.role != 'admin':
        return redirect(url_for('form'))
    reports = Report.query.order_by(Report.year.desc(), Report.month.desc()).all()
    return render_template('admin_reports.html', reports=reports)

@app.route('/admin/report/<int:report_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_report(report_id):
    if current_user.role != 'admin':
        return redirect(url_for('form'))
    report = Report.query.get_or_404(report_id)
    audit_trail = ReportEdit.query.filter_by(report_id=report.id).order_by(ReportEdit.edit_time.desc()).all()
    if request.method == 'POST':
        # Unlock/lock
        if 'unlock' in request.form:
            report.edit_locked = False
            db.session.commit()
            return render_template('form.html', report=report, audit_trail=audit_trail, success='Report unlocked for user.')
        if 'lock' in request.form:
            report.edit_locked = True
            db.session.commit()
            return render_template('form.html', report=report, audit_trail=audit_trail, success='Report locked.')
        # Admin comment
        admin_comment = request.form.get('admin_comment')
        if admin_comment is not None:
            report.admin_comment = admin_comment
            db.session.commit()
            return render_template('form.html', report=report, audit_trail=audit_trail, success='Admin comment updated.')
    return render_template('form.html', report=report, audit_trail=audit_trail)

# --- MASTER REPORT: Aggregation and Export ---
import calendar
@app.route('/master_report', methods=['GET'])
@login_required
def master_report():
    if current_user.role != 'admin':
        return render_template('report.html', error='Unauthorized access.'), 403
    # Filter by period
    month = request.args.get('month')
    year = request.args.get('year')
    period = request.args.get('period', 'monthly')
    query = Report.query
    if year:
        query = query.filter_by(year=int(year))
    if period == 'monthly' and month:
        query = query.filter_by(month=month)
    reports = query.all()
    # Aggregate header fields
    header_fields = [
        'total_teachers', 'teacher_increase', 'teacher_decrease', 'certified_teachers',
        'trained_teachers', 'unit_count', 'teachers_taking_classes_1', 'teachers_taking_classes_2', 'units_with_teachers'
    ]
    agg = {f: 0 for f in header_fields}
    for r in reports:
        if r.header:
            for f in header_fields:
                agg[f] += getattr(r.header, f, 0) or 0
    # TODO: Aggregate other sections as needed
    return render_template('report.html', report_data=[{'category': k, 'total_value': v} for k, v in agg.items()])

@app.route('/export/<format>')
@login_required
def export_report(format):
    if current_user.role != 'admin':
        return 'Unauthorized', 403
    # Use same aggregation as master_report
    month = request.args.get('month')
    year = request.args.get('year')
    period = request.args.get('period', 'monthly')
    query = Report.query
    if year:
        query = query.filter_by(year=int(year))
    if period == 'monthly' and month:
        query = query.filter_by(month=month)
    reports = query.all()
    header_fields = [
        'total_teachers', 'teacher_increase', 'teacher_decrease', 'certified_teachers',
        'trained_teachers', 'unit_count', 'teachers_taking_classes_1', 'teachers_taking_classes_2', 'units_with_teachers'
    ]
    agg = {f: 0 for f in header_fields}
    for r in reports:
        if r.header:
            for f in header_fields:
                agg[f] += getattr(r.header, f, 0) or 0
    import pandas as pd
    from io import BytesIO
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    if format == 'excel':
        df = pd.DataFrame([{'category': k, 'total_value': v} for k, v in agg.items()])
        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False)
        output.seek(0)
        return send_file(output, as_attachment=True, download_name='master_report.xlsx', mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    elif format == 'pdf':
        output = BytesIO()
        c = canvas.Canvas(output, pagesize=letter)
        width, height = letter
        c.setFont('Helvetica-Bold', 16)
        c.drawString(30, height - 40, 'Master Report')
        c.setFont('Helvetica', 12)
        y = height - 80
        c.drawString(30, y, 'Category')
        c.drawString(200, y, 'Total Value')
        y -= 20
        for k, v in agg.items():
            c.drawString(30, y, str(k))
            c.drawString(200, y, str(v))
            y -= 20
            if y < 40:
                c.showPage()
                y = height - 40
        c.save()
        output.seek(0)
        return send_file(output, as_attachment=True, download_name='master_report.pdf', mimetype='application/pdf')
    else:
        return 'Invalid format', 400
from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    send_file,
    Response,
)
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    login_required,
    current_user,
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
import os

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "your-secure-secret")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///reports.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"


# --- MODELS ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(10), nullable=False)  # user or admin
    zone = db.Column(db.String(50), nullable=True)
    ward = db.Column(db.Integer, nullable=True)
    reports = db.relationship("Report", backref="user", lazy=True)
    edits = db.relationship("ReportEdit", backref="editor", lazy=True)


class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    month = db.Column(db.String(20), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    responsible_name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    edit_locked = db.Column(db.Boolean, default=False)  # If True, user cannot edit
    admin_comment = db.Column(db.Text, nullable=True)
    header = db.relationship(
        "ReportHeader", backref="report", uselist=False, cascade="all, delete-orphan"
    )
    classes = db.relationship(
        "ReportClass", backref="report", lazy=True, cascade="all, delete-orphan"
    )
    meetings = db.relationship(
        "ReportMeeting", backref="report", lazy=True, cascade="all, delete-orphan"
    )
    manpower = db.relationship(
        "ReportManpower", backref="report", lazy=True, cascade="all, delete-orphan"
    )
    efforts = db.relationship(
        "ReportIndividualEffort",
        backref="report",
        lazy=True,
        cascade="all, delete-orphan",
    )
    edits = db.relationship(
        "ReportEdit", backref="report", lazy=True, cascade="all, delete-orphan"
    )


class ReportHeader(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    total_teachers = db.Column(db.Integer, nullable=False)
    teacher_increase = db.Column(db.Integer, nullable=False)
    teacher_decrease = db.Column(db.Integer, nullable=False)
    certified_teachers = db.Column(db.Integer, nullable=False)
    trained_teachers = db.Column(db.Integer, nullable=False)
    unit_count = db.Column(db.Integer, nullable=False)
    teachers_taking_classes_1 = db.Column(db.Integer, nullable=False)
    teachers_taking_classes_2 = db.Column(db.Integer, nullable=False)
    units_with_teachers = db.Column(db.Integer, nullable=False)


class ReportClass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    dept_type = db.Column(db.String(50), nullable=False)
    number = db.Column(db.Integer, nullable=False)
    increase = db.Column(db.Integer, nullable=False)
    decrease = db.Column(db.Integer, nullable=False)
    sessions = db.Column(db.Integer, nullable=False)
    students = db.Column(db.Integer, nullable=False)
    attendance = db.Column(db.Integer, nullable=False)
    status_board = db.Column(db.Integer, nullable=False)
    status_qayda = db.Column(db.Integer, nullable=False)
    status_ampara = db.Column(db.Integer, nullable=False)
    status_quran = db.Column(db.Integer, nullable=False)
    completed = db.Column(db.Integer, nullable=False)
    correctly_learned = db.Column(db.Integer, nullable=False)


class ReportMeeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    meeting_type = db.Column(db.String(50), nullable=False)
    city_count = db.Column(db.Integer, nullable=False)
    city_avg_attendance = db.Column(db.Integer, nullable=False)
    thana_count = db.Column(db.Integer, nullable=False)
    thana_avg_attendance = db.Column(db.Integer, nullable=False)
    ward_count = db.Column(db.Integer, nullable=False)
    ward_avg_attendance = db.Column(db.Integer, nullable=False)
    comments = db.Column(db.Text, nullable=True)


class ReportManpower(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    count = db.Column(db.Integer, nullable=False)
    additional_count = db.Column(db.Integer, nullable=True)


class ReportIndividualEffort(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    teaching_count = db.Column(db.Integer, nullable=False)
    taught_count = db.Column(db.Integer, nullable=False)


# Audit trail for edits
class ReportEdit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    editor_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    edit_time = db.Column(db.DateTime, default=db.func.current_timestamp())
    changes = db.Column(db.Text, nullable=False)  # JSON string describing changes
    comment = db.Column(db.Text, nullable=True)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            if user.role == "admin":
                return redirect(url_for("master_report"))
            else:
                return redirect(url_for("form"))
        else:
            return render_template("login.html", error="Invalid credentials")
    return render_template("login.html")


# --- Helper: Audit Logging ---
import json


def log_report_edit(report_id, editor_id, changes, comment=None):
    edit = ReportEdit(
        report_id=report_id,
        editor_id=editor_id,
        changes=json.dumps(changes, ensure_ascii=False),
        comment=comment,
    )
    db.session.add(edit)
    db.session.commit()


# --- Multi-section, wizard/full, edit, admin edit, audit, permission logic ---
from sqlalchemy.orm import joinedload


@app.route("/form", methods=["GET", "POST"])
@login_required
def form():
    # Determine if admin is editing another user's report
    report_id = request.args.get("id")
    is_admin = current_user.role == "admin"
    editing = False
    report = None
    audit_trail = []
    if request.method == "POST":
        form_mode = request.form.get("form_mode", "full")
        step = request.form.get("step")
        # --- Parse header fields ---
        header_data = {
            "total_teachers": request.form.get("total_teachers"),
            "teacher_increase": request.form.get("teacher_increase"),
            "teacher_decrease": request.form.get("teacher_decrease"),
            "certified_teachers": request.form.get("certified_teachers"),
            "trained_teachers": request.form.get("trained_teachers"),
            "unit_count": request.form.get("unit_count"),
            "teachers_taking_classes_1": request.form.get("teachers_taking_classes_1"),
            "teachers_taking_classes_2": request.form.get("teachers_taking_classes_2"),
            "units_with_teachers": request.form.get("units_with_teachers"),
        }
        # --- Parse classes ---
        classes = []
        i = 0
        while True:
            dept_type = request.form.get(f"class_dept_type_{i}")
            if not dept_type:
                break
            classes.append({
                "dept_type": dept_type,
                "number": request.form.get(f"class_number_{i}"),
                "increase": request.form.get(f"class_increase_{i}"),
                "decrease": request.form.get(f"class_decrease_{i}"),
                "sessions": request.form.get(f"class_sessions_{i}"),
                "students": request.form.get(f"class_students_{i}"),
                "attendance": request.form.get(f"class_attendance_{i}"),
                "status_board": request.form.get(f"class_status_board_{i}"),
                "status_qayda": request.form.get(f"class_status_qayda_{i}"),
                "status_ampara": request.form.get(f"class_status_ampara_{i}"),
                "status_quran": request.form.get(f"class_status_quran_{i}"),
                "completed": request.form.get(f"class_completed_{i}"),
                "correctly_learned": request.form.get(f"class_correctly_learned_{i}"),
            })
            i += 1
        # --- Parse meetings ---
        meetings = []
        i = 0
        while True:
            meeting_type = request.form.get(f"meeting_type_{i}")
            if not meeting_type:
                break
            meetings.append({
                "meeting_type": meeting_type,
                "city_count": request.form.get(f"meeting_city_count_{i}"),
                "city_avg_attendance": request.form.get(f"meeting_city_avg_attendance_{i}"),
                "thana_count": request.form.get(f"meeting_thana_count_{i}"),
                "thana_avg_attendance": request.form.get(f"meeting_thana_avg_attendance_{i}"),
                "ward_count": request.form.get(f"meeting_ward_count_{i}"),
                "ward_avg_attendance": request.form.get(f"meeting_ward_avg_attendance_{i}"),
                "comments": request.form.get(f"meeting_comments_{i}"),
            })
            i += 1
        # --- Parse manpower ---
        manpower = []
        i = 0
        while True:
            category = request.form.get(f"manpower_category_{i}")
            if not category:
                break
            manpower.append({
                "category": category,
                "count": request.form.get(f"manpower_count_{i}"),
                "additional_count": request.form.get(f"manpower_additional_count_{i}"),
            })
            i += 1
        # --- Parse efforts ---
        efforts = []
        i = 0
        while True:
            category = request.form.get(f"effort_category_{i}")
            if not category:
                break
            efforts.append({
                "category": category,
                "teaching_count": request.form.get(f"effort_teaching_count_{i}"),
                "taught_count": request.form.get(f"effort_taught_count_{i}"),
            })
            i += 1
        # Validate required header fields
        missing = [k for k, v in header_data.items() if v is None or v == ""]
        if missing:
            return render_template("form.html", error=f"Missing fields: {', '.join(missing)}", report=report, audit_trail=audit_trail)
        # Save or update report
        if editing and report:
            # Save old values for audit
            old_header = {k: getattr(report.header, k) for k in header_data} if hasattr(report, "header") and report.header else {}
            # Update report fields
            report.month = request.form.get("month")
            report.year = request.form.get("year")
            report.responsible_name = request.form.get("responsible_name")
            # Update header
            if hasattr(report, "header") and report.header:
                for k, v in header_data.items():
                    setattr(report.header, k, v)
            else:
                header = ReportHeader(report_id=report.id, **header_data)
                db.session.add(header)
            # Update classes
            report.classes.clear()
            for c in classes:
                db.session.add(ReportClass(report_id=report.id, **c))
            # Update meetings
            report.meetings.clear()
            for m in meetings:
                db.session.add(ReportMeeting(report_id=report.id, **m))
            # Update manpower
            report.manpower.clear()
            for mp in manpower:
                db.session.add(ReportManpower(report_id=report.id, **mp))
            # Update efforts
            report.efforts.clear()
            for ef in efforts:
                db.session.add(ReportIndividualEffort(report_id=report.id, **ef))
            db.session.commit()
            # Log audit
            log_report_edit(report.id, current_user.id, {
                "old_header": old_header,
                "new_header": header_data,
                "classes": classes,
                "meetings": meetings,
                "manpower": manpower,
                "efforts": efforts
            })
            return render_template("form.html", success="Report updated.", report=report, audit_trail=audit_trail)
        else:
            # New report
            report = Report(
                user_id=current_user.id,
                month=request.form.get("month"),
                year=request.form.get("year"),
                responsible_name=request.form.get("responsible_name")
            )
            db.session.add(report)
            db.session.commit()
            header = ReportHeader(report_id=report.id, **header_data)
            db.session.add(header)
            for c in classes:
                db.session.add(ReportClass(report_id=report.id, **c))
            for m in meetings:
                db.session.add(ReportMeeting(report_id=report.id, **m))
            for mp in manpower:
                db.session.add(ReportManpower(report_id=report.id, **mp))
            for ef in efforts:
                db.session.add(ReportIndividualEffort(report_id=report.id, **ef))
            db.session.commit()
            log_report_edit(report.id, current_user.id, {
                "new_header": header_data,
                "classes": classes,
                "meetings": meetings,
                "manpower": manpower,
                "efforts": efforts
            })
            return render_template("form.html", success="Report submitted.", report=report, audit_trail=audit_trail)
                ),
                "units_with_teachers": request.form.get("units_with_teachers"),
            },
            # TODO: Add classes, meetings, manpower, efforts
        }
        # Validate required fields (demo: header only)
        missing = [k for k, v in data["header"].items() if v is None or v == ""]
        if missing:
            return render_template(
                "form.html",
                error=f"Missing fields: {', '.join(missing)}",
                report=report,
                audit_trail=audit_trail,
            )
        # Save or update report
        if editing and report:
            # Save old values for audit
            old = (
                {k: getattr(report.header, k) for k in data["header"]}
                if hasattr(report, "header")
                else {}
            )
            # Update report fields
            report.month = data["month"]
            report.year = data["year"]
            report.responsible_name = data["responsible_name"]
            # Update header
            if hasattr(report, "header") and report.header:
                for k, v in data["header"].items():
                    setattr(report.header, k, v)
            else:
                header = ReportHeader(report_id=report.id, **data["header"])
                db.session.add(header)
            db.session.commit()
            # Log audit
            log_report_edit(
                report.id, current_user.id, {"old": old, "new": data["header"]}
            )
            return render_template(
                "form.html",
                success="Report updated.",
                report=report,
                audit_trail=audit_trail,
            )
        else:
            # New report
            report = Report(
                user_id=current_user.id,
                month=data["month"],
                year=data["year"],
                responsible_name=data["responsible_name"],
            )
            db.session.add(report)
            db.session.commit()
            header = ReportHeader(report_id=report.id, **data["header"])
            db.session.add(header)
            db.session.commit()
            log_report_edit(report.id, current_user.id, {"new": data["header"]})
            return render_template(
                "form.html",
                success="Report submitted.",
                report=report,
                audit_trail=audit_trail,
            )
    # GET: render form, prefill if editing
    return render_template("form.html", report=report, audit_trail=audit_trail)


@app.route("/master_report")
@login_required
def master_report():
    if current_user.role != "admin":
        return render_template("report.html", error="Unauthorized access."), 403
    reports = Report.query.all()
    df = pd.DataFrame([{"category": r.category, "value": r.value} for r in reports])
    if df.empty:
        report_data = []
    else:
        agg = df.groupby("category").sum().reset_index()
        report_data = agg.rename(columns={"value": "total_value"}).to_dict(
            orient="records"
        )
    return render_template("report.html", report_data=report_data)


@app.route("/export/<format>")
@login_required
def export(format):
    if current_user.role != "admin":
        return "Unauthorized", 403
    reports = Report.query.all()
    df = pd.DataFrame([{"category": r.category, "value": r.value} for r in reports])
    if df.empty:
        df = pd.DataFrame(columns=["category", "total_value"])
    else:
        df = (
            df.groupby("category")
            .sum()
            .reset_index()
            .rename(columns={"value": "total_value"})
        )
    if format == "excel":
        output = BytesIO()
        with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
            df.to_excel(writer, index=False)
        output.seek(0)
        return send_file(
            output,
            as_attachment=True,
            download_name="master_report.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    elif format == "pdf":
        output = BytesIO()
        c = canvas.Canvas(output, pagesize=letter)
        width, height = letter
        c.setFont("Helvetica-Bold", 16)
        c.drawString(30, height - 40, "Master Report")
        c.setFont("Helvetica", 12)
        y = height - 80
        c.drawString(30, y, "Category")
        c.drawString(200, y, "Total Value")
        y -= 20
        for _, row in df.iterrows():
            c.drawString(30, y, str(row["category"]))
            c.drawString(200, y, str(row["total_value"]))
            y -= 20
            if y < 40:
                c.showPage()
                y = height - 40
        c.save()
        output.seek(0)
        return send_file(
            output,
            as_attachment=True,
            download_name="master_report.pdf",
            mimetype="application/pdf",
        )
    else:
        return "Invalid format", 400


@app.route("/")
def index():
    if current_user.is_authenticated:
        if current_user.role == "admin":
            return redirect(url_for("master_report"))
        else:
            return redirect(url_for("form"))
    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(debug=True)

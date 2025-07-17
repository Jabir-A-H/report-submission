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


# Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(10), nullable=False)  # user or admin


class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    value = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())


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


@app.route("/form", methods=["GET", "POST"])
@login_required
def form():
    if current_user.role != "user":
        return redirect(url_for("master_report"))
    if request.method == "POST":
        category = request.form.get("category", "").strip()
        value = request.form.get("value", "").strip()
        description = request.form.get("description", "").strip()
        if not category or not value:
            return render_template(
                "form.html", error="Category and value are required."
            )
        try:
            value = float(value)
        except ValueError:
            return render_template("form.html", error="Value must be a number.")
        report = Report(
            user_id=current_user.id,
            category=category,
            value=value,
            description=description,
        )
        db.session.add(report)
        db.session.commit()
        return render_template("form.html", success="Report submitted successfully!")
    return render_template("form.html")


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

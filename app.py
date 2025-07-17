from flask import Flask, render_template, request, redirect, url_for, send_file, Response
from flask_login import LoginManager, UserMixin, login_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secure-secret')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///reports.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # submitter, manager, executive

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    value = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('form' if user.role == 'submitter' else 'master_report'))
        return render_template('login.html', error='Invalid credentials')
    return render_template('login.html')

@app.route('/form', methods=['GET', 'POST'])
@login_required
def form():
    if current_user.role != 'submitter':
        return redirect(url_for('master_report'))
    if request.method == 'POST':
        report = Report(
            user_id=current_user.id,
            category=request.form['category'],
            value=float(request.form['value']),
            description=request.form.get('description')
        )
        db.session.add(report)
        db.session.commit()
        return render_template('form.html', success='Report submitted')
    return render_template('form.html')

@app.route('/master_report')
@login_required
def master_report():
    if current_user.role not in ['manager', 'executive']:
        return redirect(url_for('form'))
    reports = Report.query.all()
    df = pd.DataFrame([(r.category, r.value) for r in reports], columns=['category', 'value'])
    summary = df.groupby('category').sum().to_dict()['value']
    return render_template('report.html', summary=summary)

@app.route('/export/<format>')
@login_required
def export(format):
    if current_user.role not in ['manager', 'executive']:
        return redirect(url_for('form'))
    reports = Report.query.all()
    df = pd.DataFrame([(r.category, r.value) for r in reports], columns=['category', 'value'])
    summary = df.groupby('category').sum().reset_index()

    if format == 'excel':
        buffer = BytesIO()
        summary.to_excel(buffer, index=False)
        buffer.seek(0)
        return send_file(buffer, download_name='master_report.xlsx', as_attachment=True)
    elif format == 'pdf':
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        c.drawString(100, 750, 'Master Report')
        y = 700
        for _, row in summary.iterrows():
            c.drawString(100, y, f"Category: {row['category']}, Total: {row['value']}")
            y -= 20
        c.save()
        buffer.seek(0)
        return send_file(buffer, download_name='master_report.pdf', as_attachment=True)
    return redirect(url_for('master_report'))

if __name__ == '__main__':
    app.run(debug=True)
# ...existing code...

# --- MODELS ---


@app.route("/form", methods=["GET"])
@login_required
def form():
    """
    Multi-section report submission and edit form (legacy, now read-only).
    Use the section-based routes for editing.
    """
    report_id = request.args.get("id")
    is_admin = current_user.role == "admin"
    report = None
    audit_trail = []
    if report_id:
        report = Report.query.options(db.joinedload(Report.header)).get(report_id)
        if report:
            audit_trail = (
                ReportEdit.query.filter_by(report_id=report.id)
                .order_by(ReportEdit.edit_time.desc())
                .all()
            )
            if not (is_admin or report.user_id == current_user.id):
                return render_template(
                    "form.html", error="Unauthorized", report=None, audit_trail=[]
                )
    return render_template("form.html", report=report, audit_trail=audit_trail)


# Main Flask application for report submission and aggregation.
# Handles user/admin authentication, report CRUD, audit trail, export, and admin zone management.
# Database models are defined with SQLAlchemy ORM.

from __future__ import annotations
from typing import Optional
from flask import Flask, render_template, request, redirect, url_for, send_file, jsonify
import json
from flask_login import LoginManager, UserMixin, login_user, login_required, current_user, logout_user  # type: ignore
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
import os

# --- Flask app and DB setup ---
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "your-secure-secret")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///reports.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"  # type: ignore


# --- Report Dashboard (shows all sections with completion status) ---
@app.route("/report_dashboard")
@login_required
def report_dashboard():
    """Dashboard showing all report sections and their completion status."""
    month = request.args.get("month")
    year = request.args.get("year")

    if not month or not year:
        from datetime import datetime

        now = datetime.now()
        month = now.month
        year = now.year

    # Get or create report for current month/year
    report = Report.query.filter_by(
        user_id=current_user.id, month=int(month), year=int(year)
    ).first()

    if not report:
        report = Report(
            user_id=current_user.id,
            zone_id=current_user.zone_id,
            month=int(month),
            year=int(year),
        )
        db.session.add(report)
        db.session.commit()

    # Check completion status for each section
    sections = [
        {
            "name": "মূল তথ্য",
            "url": f"/report_header?month={month}&year={year}",
            "completed": bool(report.header),
            "icon": "📋",
        },
        {
            "name": "শিক্ষামূলক কোর্স",
            "url": f"/report_courses?month={month}&year={year}",
            "completed": len(report.courses) > 0,
            "icon": "📚",
        },
        {
            "name": "সাংগঠনিক কার্যক্রম",
            "url": f"/report_organizational?month={month}&year={year}",
            "completed": len(report.organizational) > 0,
            "icon": "🏢",
        },
        {
            "name": "ব্যক্তিগত উন্নয়ন",
            "url": f"/report_personal?month={month}&year={year}",
            "completed": len(report.personal) > 0,
            "icon": "👤",
        },
        {
            "name": "মিটিং/সভা",
            "url": f"/report_meetings?month={month}&year={year}",
            "completed": len(report.meetings) > 0,
            "icon": "🤝",
        },
        {
            "name": "অতিরিক্ত কার্যক্রম",
            "url": f"/report_extras?month={month}&year={year}",
            "completed": len(report.extras) > 0,
            "icon": "➕",
        },
        {
            "name": "মন্তব্য ও পরামর্শ",
            "url": f"/report_comments?month={month}&year={year}",
            "completed": bool(report.comments),
            "icon": "💬",
        },
    ]

    return render_template(
        "report_dashboard.html",
        sections=sections,
        report=report,
        month=month,
        year=year,
        report_month_year=f"{get_month_name(int(month))} {year}",
    )


# --- Individual Report Section Routes ---


@app.route("/report_header", methods=["GET", "POST"])
@login_required
def report_header():
    """Header section form."""
    month = request.args.get("month")
    year = request.args.get("year")

    if not month or not year:
        from datetime import datetime

        now = datetime.now()
        month = now.month
        year = now.year

    # Get or create report
    report = Report.query.filter_by(
        user_id=current_user.id, month=int(month), year=int(year)
    ).first()

    if not report:
        report = Report(
            user_id=current_user.id,
            zone_id=current_user.zone_id,
            month=int(month),
            year=int(year),
        )
        db.session.add(report)
        db.session.commit()

    if request.method == "POST":
        try:
            # Create or update header
            if not report.header:
                report.header = ReportHeader(report_id=report.id)
                db.session.add(report.header)

            # Update header fields
            for field in [
                "responsible_name",
                "thana",
                "ward",
                "total_muallima",
                "muallima_increase",
                "muallima_decrease",
                "certified_muallima",
                "certified_muallima_taking_classes",
                "trained_muallima",
                "trained_muallima_taking_classes",
                "total_unit",
                "units_with_muallima",
            ]:
                value = request.form.get(field, "")
                if field in [
                    "total_muallima",
                    "muallima_increase",
                    "muallima_decrease",
                    "certified_muallima",
                    "certified_muallima_taking_classes",
                    "trained_muallima",
                    "trained_muallima_taking_classes",
                    "total_unit",
                    "units_with_muallima",
                ]:
                    value = int(value) if value else 0
                setattr(report.header, field, value)

            db.session.commit()
            return redirect(
                f"/report_header?month={month}&year={year}&success=তথ্য সংরক্ষিত হয়েছে"
            )

        except Exception as e:
            db.session.rollback()
            return render_template(
                "sections/header.html",
                report=report,
                month=month,
                year=year,
                error=f"তথ্য সংরক্ষণে ত্রুটি: {str(e)}",
            )

    success = request.args.get("success")
    error = request.args.get("error")

    return render_template(
        "sections/header.html",
        report=report,
        month=month,
        year=year,
        success=success,
        error=error,
    )


@app.route("/report_courses", methods=["GET", "POST"])
@login_required
def report_courses():
    """Courses section form."""
    month = request.args.get("month")
    year = request.args.get("year")

    if not month or not year:
        from datetime import datetime

        now = datetime.now()
        month = now.month
        year = now.year

    # Get or create report
    report = Report.query.filter_by(
        user_id=current_user.id, month=int(month), year=int(year)
    ).first()

    if not report:
        report = Report(
            user_id=current_user.id,
            zone_id=current_user.zone_id,
            month=int(month),
            year=int(year),
        )
        db.session.add(report)
        db.session.commit()

    if request.method == "POST":
        try:
            # Clear existing courses
            ReportCourse.query.filter_by(report_id=report.id).delete()

            # Add new courses
            categories = request.form.getlist("category[]")
            numbers = request.form.getlist("number[]")
            increases = request.form.getlist("increase[]")
            decreases = request.form.getlist("decrease[]")
            sessions = request.form.getlist("sessions[]")
            students = request.form.getlist("students[]")
            attendances = request.form.getlist("attendance[]")
            status_boards = request.form.getlist("status_board[]")
            status_qaydas = request.form.getlist("status_qayda[]")
            status_amparas = request.form.getlist("status_ampara[]")
            status_qurans = request.form.getlist("status_quran[]")
            completeds = request.form.getlist("completed[]")
            correctly_learneds = request.form.getlist("correctly_learned[]")

            for i in range(len(categories)):
                if categories[i]:
                    course = ReportCourse(
                        report_id=report.id,
                        category=categories[i],
                        number=int(numbers[i]) if numbers[i] else 0,
                        increase=int(increases[i]) if increases[i] else 0,
                        decrease=int(decreases[i]) if decreases[i] else 0,
                        sessions=int(sessions[i]) if sessions[i] else 0,
                        students=int(students[i]) if students[i] else 0,
                        attendance=int(attendances[i]) if attendances[i] else 0,
                        status_board=int(status_boards[i]) if status_boards[i] else 0,
                        status_qayda=int(status_qaydas[i]) if status_qaydas[i] else 0,
                        status_ampara=(
                            int(status_amparas[i]) if status_amparas[i] else 0
                        ),
                        status_quran=int(status_qurans[i]) if status_qurans[i] else 0,
                        completed=int(completeds[i]) if completeds[i] else 0,
                        correctly_learned=(
                            int(correctly_learneds[i]) if correctly_learneds[i] else 0
                        ),
                    )
                    db.session.add(course)

            db.session.commit()
            return redirect(
                f"/report_courses?month={month}&year={year}&success=কোর্স তথ্য সংরক্ষিত হয়েছে"
            )

        except Exception as e:
            db.session.rollback()
            return render_template(
                "sections/courses.html",
                report=report,
                month=month,
                year=year,
                categories=COURSE_CATEGORIES,
                error=f"তথ্য সংরক্ষণে ত্রুটি: {str(e)}",
            )

    success = request.args.get("success")
    error = request.args.get("error")

    return render_template(
        "sections/courses.html",
        report=report,
        month=month,
        year=year,
        categories=COURSE_CATEGORIES,
        success=success,
        error=error,
    )


@app.route("/report_organizational", methods=["GET", "POST"])
@login_required
def report_organizational():
    """Organizational activities section form."""
    month = request.args.get("month")
    year = request.args.get("year")

    if not month or not year:
        from datetime import datetime

        now = datetime.now()
        month = now.month
        year = now.year

    # Get or create report
    report = Report.query.filter_by(
        user_id=current_user.id, month=int(month), year=int(year)
    ).first()

    if not report:
        report = Report(
            user_id=current_user.id,
            zone_id=current_user.zone_id,
            month=int(month),
            year=int(year),
        )
        db.session.add(report)
        db.session.commit()

    if request.method == "POST":
        try:
            # Clear existing organizational activities
            ReportOrganizational.query.filter_by(report_id=report.id).delete()

            # Add new activities
            categories = request.form.getlist("category[]")
            numbers = request.form.getlist("number[]")
            increases = request.form.getlist("increase[]")
            amounts = request.form.getlist("amount[]")
            comments = request.form.getlist("comments[]")

            for i in range(len(categories)):
                if categories[i]:
                    activity = ReportOrganizational(
                        report_id=report.id,
                        category=categories[i],
                        number=int(numbers[i]) if numbers[i] else 0,
                        increase=int(increases[i]) if increases[i] else 0,
                        amount=int(amounts[i]) if amounts[i] else None,
                        comments=comments[i] if i < len(comments) else "",
                    )
                    db.session.add(activity)

            db.session.commit()
            return redirect(
                f"/report_organizational?month={month}&year={year}&success=সাংগঠনিক তথ্য সংরক্ষিত হয়েছে"
            )

        except Exception as e:
            db.session.rollback()
            return render_template(
                "sections/organizational.html",
                report=report,
                month=month,
                year=year,
                categories=ORGANIZATIONAL_CATEGORIES,
                error=f"তথ্য সংরক্ষণে ত্রুটি: {str(e)}",
            )

    success = request.args.get("success")
    error = request.args.get("error")

    return render_template(
        "sections/organizational.html",
        report=report,
        month=month,
        year=year,
        categories=ORGANIZATIONAL_CATEGORIES,
        success=success,
        error=error,
    )


@app.route("/report_personal", methods=["GET", "POST"])
@login_required
def report_personal():
    """Personal development section form."""
    month = request.args.get("month")
    year = request.args.get("year")

    if not month or not year:
        from datetime import datetime

        now = datetime.now()
        month = now.month
        year = now.year

    # Get or create report
    report = Report.query.filter_by(
        user_id=current_user.id, month=int(month), year=int(year)
    ).first()

    if not report:
        report = Report(
            user_id=current_user.id,
            zone_id=current_user.zone_id,
            month=int(month),
            year=int(year),
        )
        db.session.add(report)
        db.session.commit()

    if request.method == "POST":
        try:
            # Clear existing personal activities
            ReportPersonal.query.filter_by(report_id=report.id).delete()

            # Add new activities
            categories = request.form.getlist("category[]")
            rukons = request.form.getlist("rukon[]")
            kormis = request.form.getlist("kormi[]")
            shokrio_shohojogis = request.form.getlist("shokrio_shohojogi[]")

            for i in range(len(categories)):
                if categories[i]:
                    activity = ReportPersonal(
                        report_id=report.id,
                        category=categories[i],
                        rukon=int(rukons[i]) if rukons[i] else 0,
                        kormi=int(kormis[i]) if kormis[i] else 0,
                        shokrio_shohojogi=(
                            int(shokrio_shohojogis[i]) if shokrio_shohojogis[i] else 0
                        ),
                    )
                    db.session.add(activity)

            db.session.commit()
            return redirect(
                f"/report_personal?month={month}&year={year}&success=ব্যক্তিগত তথ্য সংরক্ষিত হয়েছে"
            )

        except Exception as e:
            db.session.rollback()
            return render_template(
                "sections/personal.html",
                report=report,
                month=month,
                year=year,
                categories=PERSONAL_CATEGORIES,
                error=f"তথ্য সংরক্ষণে ত্রুটি: {str(e)}",
            )

    success = request.args.get("success")
    error = request.args.get("error")

    return render_template(
        "sections/personal.html",
        report=report,
        month=month,
        year=year,
        categories=PERSONAL_CATEGORIES,
        success=success,
        error=error,
    )


@app.route("/report_meetings", methods=["GET", "POST"])
@login_required
def report_meetings():
    """Meetings section form."""
    month = request.args.get("month")
    year = request.args.get("year")

    if not month or not year:
        from datetime import datetime

        now = datetime.now()
        month = now.month
        year = now.year

    # Get or create report
    report = Report.query.filter_by(
        user_id=current_user.id, month=int(month), year=int(year)
    ).first()

    if not report:
        report = Report(
            user_id=current_user.id,
            zone_id=current_user.zone_id,
            month=int(month),
            year=int(year),
        )
        db.session.add(report)
        db.session.commit()

    if request.method == "POST":
        try:
            # Clear existing meetings
            ReportMeeting.query.filter_by(report_id=report.id).delete()

            # Add new meetings
            categories = request.form.getlist("category[]")
            city_counts = request.form.getlist("city_count[]")
            city_avg_attendances = request.form.getlist("city_avg_attendance[]")
            thana_counts = request.form.getlist("thana_count[]")
            thana_avg_attendances = request.form.getlist("thana_avg_attendance[]")
            ward_counts = request.form.getlist("ward_count[]")
            ward_avg_attendances = request.form.getlist("ward_avg_attendance[]")
            comments = request.form.getlist("comments[]")

            for i in range(len(categories)):
                if categories[i]:
                    meeting = ReportMeeting(
                        report_id=report.id,
                        category=categories[i],
                        city_count=int(city_counts[i]) if city_counts[i] else 0,
                        city_avg_attendance=(
                            int(city_avg_attendances[i])
                            if city_avg_attendances[i]
                            else 0
                        ),
                        thana_count=int(thana_counts[i]) if thana_counts[i] else 0,
                        thana_avg_attendance=(
                            int(thana_avg_attendances[i])
                            if thana_avg_attendances[i]
                            else 0
                        ),
                        ward_count=int(ward_counts[i]) if ward_counts[i] else 0,
                        ward_avg_attendance=(
                            int(ward_avg_attendances[i])
                            if ward_avg_attendances[i]
                            else 0
                        ),
                        comments=comments[i] if i < len(comments) else "",
                    )
                    db.session.add(meeting)

            db.session.commit()
            return redirect(
                f"/report_meetings?month={month}&year={year}&success=মিটিং তথ্য সংরক্ষিত হয়েছে"
            )

        except Exception as e:
            db.session.rollback()
            return render_template(
                "sections/meetings.html",
                report=report,
                month=month,
                year=year,
                categories=MEETING_CATEGORIES,
                error=f"তথ্য সংরক্ষণে ত্রুটি: {str(e)}",
            )

    success = request.args.get("success")
    error = request.args.get("error")

    return render_template(
        "sections/meetings.html",
        report=report,
        month=month,
        year=year,
        categories=MEETING_CATEGORIES,
        success=success,
        error=error,
    )


@app.route("/report_extras", methods=["GET", "POST"])
@login_required
def report_extras():
    """Extra activities section form."""
    month = request.args.get("month")
    year = request.args.get("year")

    if not month or not year:
        from datetime import datetime

        now = datetime.now()
        month = now.month
        year = now.year

    # Get or create report
    report = Report.query.filter_by(
        user_id=current_user.id, month=int(month), year=int(year)
    ).first()

    if not report:
        report = Report(
            user_id=current_user.id,
            zone_id=current_user.zone_id,
            month=int(month),
            year=int(year),
        )
        db.session.add(report)
        db.session.commit()

    if request.method == "POST":
        try:
            # Clear existing extras
            ReportExtra.query.filter_by(report_id=report.id).delete()

            # Add new extras
            categories = request.form.getlist("category[]")
            numbers = request.form.getlist("number[]")

            for i in range(len(categories)):
                if categories[i]:
                    extra = ReportExtra(
                        report_id=report.id,
                        category=categories[i],
                        number=int(numbers[i]) if numbers[i] else 0,
                    )
                    db.session.add(extra)

            db.session.commit()
            return redirect(
                f"/report_extras?month={month}&year={year}&success=অতিরিক্ত তথ্য সংরক্ষিত হয়েছে"
            )

        except Exception as e:
            db.session.rollback()
            return render_template(
                "sections/extras.html",
                report=report,
                month=month,
                year=year,
                categories=EXTRA_CATEGORIES,
                error=f"তথ্য সংরক্ষণে ত্রুটি: {str(e)}",
            )

    success = request.args.get("success")
    error = request.args.get("error")

    return render_template(
        "sections/extras.html",
        report=report,
        month=month,
        year=year,
        categories=EXTRA_CATEGORIES,
        success=success,
        error=error,
    )


@app.route("/report_comments", methods=["GET", "POST"])
@login_required
def report_comments():
    """Comments section form."""
    month = request.args.get("month")
    year = request.args.get("year")

    if not month or not year:
        from datetime import datetime

        now = datetime.now()
        month = now.month
        year = now.year

    # Get or create report
    report = Report.query.filter_by(
        user_id=current_user.id, month=int(month), year=int(year)
    ).first()

    if not report:
        report = Report(
            user_id=current_user.id,
            zone_id=current_user.zone_id,
            month=int(month),
            year=int(year),
        )
        db.session.add(report)
        db.session.commit()

    if request.method == "POST":
        try:
            if not report.comments:
                report.comments = ReportComment(report_id=report.id)
                db.session.add(report.comments)

            report.comments.report_month = get_month_name(int(month))
            report.comments.monthly_comment = request.form.get("monthly_comment", "")
            report.comments.tri_monthly_comment = request.form.get(
                "tri_monthly_comment", ""
            )
            report.comments.six_monthly_comment = request.form.get(
                "six_monthly_comment", ""
            )
            report.comments.yearly_comment = request.form.get("yearly_comment", "")

            db.session.commit()
            return redirect(
                f"/report_comments?month={month}&year={year}&success=মন্তব্য সংরক্ষিত হয়েছে"
            )

        except Exception as e:
            db.session.rollback()
            return render_template(
                "sections/comments.html",
                report=report,
                month=month,
                year=year,
                error=f"তথ্য সংরক্ষণে ত্রুটি: {str(e)}",
            )

    success = request.args.get("success")
    error = request.args.get("error")

    return render_template(
        "sections/comments.html",
        report=report,
        month=month,
        year=year,
        success=success,
        error=error,
    )


def get_month_name(month_num):
    """Get Bengali month name from number."""
    months = {
        1: "জানুয়ারি",
        2: "ফেব্রুয়ারি",
        3: "মার্চ",
        4: "এপ্রিল",
        5: "মে",
        6: "জুন",
        7: "জুলাই",
        8: "আগস্ট",
        9: "সেপ্টেম্বর",
        10: "অক্টোবর",
        11: "নভেম্বর",
        12: "ডিসেম্বর",
    }
    return months.get(month_num, str(month_num))


@app.route("/autosave", methods=["POST"])
@login_required
def autosave():
    """Auto-save endpoint for report drafts. Supports all report sections."""
    report_id = request.form.get("id")
    section = request.form.get("section")
    if not report_id or not section:
        return jsonify({"status": "no-id-or-section"})
    report = Report.query.get(report_id)
    if not report or (
        report.user_id != current_user.id and current_user.role != "admin"
    ):
        return jsonify({"error": "Unauthorized"}), 403

    try:
        if section == "header":
            if hasattr(report, "header") and report.header:
                header = report.header
            else:
                header = ReportHeader(report_id=report.id)
                db.session.add(header)
                report.header = header
            for field in [
                "responsible_name",
                "thana",
                "ward",
                "total_muallima",
                "muallima_increase",
                "muallima_decrease",
                "certified_muallima",
                "certified_muallima_taking_classes",
                "trained_muallima",
                "trained_muallima_taking_classes",
                "total_unit",
                "units_with_muallima",
            ]:
                val = request.form.get(field)
                if val is not None:
                    if field in [
                        "total_muallima",
                        "muallima_increase",
                        "muallima_decrease",
                        "certified_muallima",
                        "certified_muallima_taking_classes",
                        "trained_muallima",
                        "trained_muallima_taking_classes",
                        "total_unit",
                        "units_with_muallima",
                    ]:
                        val = int(val) if val else 0
                    setattr(header, field, val)
        elif section == "courses":
            # Clear and re-add all courses
            ReportCourse.query.filter_by(report_id=report.id).delete()
            categories = request.form.getlist("category[]")
            numbers = request.form.getlist("number[]")
            increases = request.form.getlist("increase[]")
            decreases = request.form.getlist("decrease[]")
            sessions = request.form.getlist("sessions[]")
            students = request.form.getlist("students[]")
            attendances = request.form.getlist("attendance[]")
            status_boards = request.form.getlist("status_board[]")
            status_qaydas = request.form.getlist("status_qayda[]")
            status_amparas = request.form.getlist("status_ampara[]")
            status_qurans = request.form.getlist("status_quran[]")
            completeds = request.form.getlist("completed[]")
            correctly_learneds = request.form.getlist("correctly_learned[]")
            for i in range(len(categories)):
                if categories[i]:
                    course = ReportCourse(
                        report_id=report.id,
                        category=categories[i],
                        number=int(numbers[i]) if numbers[i] else 0,
                        increase=int(increases[i]) if increases[i] else 0,
                        decrease=int(decreases[i]) if decreases[i] else 0,
                        sessions=int(sessions[i]) if sessions[i] else 0,
                        students=int(students[i]) if students[i] else 0,
                        attendance=int(attendances[i]) if attendances[i] else 0,
                        status_board=int(status_boards[i]) if status_boards[i] else 0,
                        status_qayda=int(status_qaydas[i]) if status_qaydas[i] else 0,
                        status_ampara=(
                            int(status_amparas[i]) if status_amparas[i] else 0
                        ),
                        status_quran=int(status_qurans[i]) if status_qurans[i] else 0,
                        completed=int(completeds[i]) if completeds[i] else 0,
                        correctly_learned=(
                            int(correctly_learneds[i]) if correctly_learneds[i] else 0
                        ),
                    )
                    db.session.add(course)
        elif section == "organizational":
            ReportOrganizational.query.filter_by(report_id=report.id).delete()
            categories = request.form.getlist("category[]")
            numbers = request.form.getlist("number[]")
            increases = request.form.getlist("increase[]")
            amounts = request.form.getlist("amount[]")
            comments = request.form.getlist("comments[]")
            for i in range(len(categories)):
                if categories[i]:
                    activity = ReportOrganizational(
                        report_id=report.id,
                        category=categories[i],
                        number=int(numbers[i]) if numbers[i] else 0,
                        increase=int(increases[i]) if increases[i] else 0,
                        amount=int(amounts[i]) if amounts[i] else None,
                        comments=comments[i] if i < len(comments) else "",
                    )
                    db.session.add(activity)
        elif section == "personal":
            ReportPersonal.query.filter_by(report_id=report.id).delete()
            categories = request.form.getlist("category[]")
            rukons = request.form.getlist("rukon[]")
            kormis = request.form.getlist("kormi[]")
            shokrio_shohojogis = request.form.getlist("shokrio_shohojogi[]")
            for i in range(len(categories)):
                if categories[i]:
                    activity = ReportPersonal(
                        report_id=report.id,
                        category=categories[i],
                        rukon=int(rukons[i]) if rukons[i] else 0,
                        kormi=int(kormis[i]) if kormis[i] else 0,
                        shokrio_shohojogi=(
                            int(shokrio_shohojogis[i]) if shokrio_shohojogis[i] else 0
                        ),
                    )
                    db.session.add(activity)
        elif section == "meetings":
            ReportMeeting.query.filter_by(report_id=report.id).delete()
            categories = request.form.getlist("category[]")
            city_counts = request.form.getlist("city_count[]")
            city_avg_attendances = request.form.getlist("city_avg_attendance[]")
            thana_counts = request.form.getlist("thana_count[]")
            thana_avg_attendances = request.form.getlist("thana_avg_attendance[]")
            ward_counts = request.form.getlist("ward_count[]")
            ward_avg_attendances = request.form.getlist("ward_avg_attendance[]")
            comments = request.form.getlist("comments[]")
            for i in range(len(categories)):
                if categories[i]:
                    meeting = ReportMeeting(
                        report_id=report.id,
                        category=categories[i],
                        city_count=int(city_counts[i]) if city_counts[i] else 0,
                        city_avg_attendance=(
                            int(city_avg_attendances[i])
                            if city_avg_attendances[i]
                            else 0
                        ),
                        thana_count=int(thana_counts[i]) if thana_counts[i] else 0,
                        thana_avg_attendance=(
                            int(thana_avg_attendances[i])
                            if thana_avg_attendances[i]
                            else 0
                        ),
                        ward_count=int(ward_counts[i]) if ward_counts[i] else 0,
                        ward_avg_attendance=(
                            int(ward_avg_attendances[i])
                            if ward_avg_attendances[i]
                            else 0
                        ),
                        comments=comments[i] if i < len(comments) else "",
                    )
                    db.session.add(meeting)
        elif section == "extras":
            ReportExtra.query.filter_by(report_id=report.id).delete()
            categories = request.form.getlist("category[]")
            numbers = request.form.getlist("number[]")
            for i in range(len(categories)):
                if categories[i]:
                    extra = ReportExtra(
                        report_id=report.id,
                        category=categories[i],
                        number=int(numbers[i]) if numbers[i] else 0,
                    )
                    db.session.add(extra)
        elif section == "comments":
            if not report.comments:
                report.comments = ReportComment(report_id=report.id)
                db.session.add(report.comments)
            report.comments.report_month = request.form.get("report_month", "")
            report.comments.monthly_comment = request.form.get("monthly_comment", "")
            report.comments.tri_monthly_comment = request.form.get(
                "tri_monthly_comment", ""
            )
            report.comments.six_monthly_comment = request.form.get(
                "six_monthly_comment", ""
            )
            report.comments.yearly_comment = request.form.get("yearly_comment", "")
        db.session.commit()
        return jsonify({"status": "saved"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "error": str(e)})


# --- Admin view of all reports for review, edit, and audit ---
@app.route("/admin/reports")
@login_required
def admin_reports():
    """Admin view of all reports for review, edit, and audit."""
    if current_user.role != "admin":
        return redirect(url_for("form"))
    reports = Report.query.order_by(Report.year.desc(), Report.month.desc()).all()  # type: ignore
    return render_template("admin_reports.html", reports=reports)


# --- Admin can view and edit a specific report, unlock/lock, and add comments ---
@app.route("/admin/report/<int:report_id>", methods=["GET", "POST"])
@login_required
def admin_edit_report(report_id: int):
    """Admin can view and edit a specific report, unlock/lock, and add comments."""
    if current_user.role != "admin":
        return redirect(url_for("form"))
    report = Report.query.get_or_404(report_id)
    audit_trail: List[ReportEdit] = (  # type: ignore
        ReportEdit.query.filter_by(report_id=report.id)
        .order_by(ReportEdit.edit_time.desc())
        .all()
    )
    # POST logic for unlock/lock/comment is handled in the form route, not here
    return render_template("form.html", report=report, audit_trail=audit_trail)


# --- Logout route ---
@app.route("/logout")
@login_required
def logout():
    """Log out the current user and redirect to login page."""
    logout_user()
    return redirect(url_for("login"))


# --- Admin: Approve users, manage zones ---
@app.route("/admin/users", methods=["GET", "POST"])
@login_required
def admin_users():
    """Admin page to approve users and manage zones."""
    if current_user.role != "admin":
        return "Unauthorized", 403
    if request.method == "POST":
        # Approve or delete user
        if "approve" in request.form:
            user_id = int(request.form["approve"])
            user = User.query.get(user_id)
            if user:
                user.active = True
                db.session.commit()
        elif "delete" in request.form:
            user_id = int(request.form["delete"])
            user = User.query.get(user_id)
            if user:
                db.session.delete(user)
                db.session.commit()
        elif "add_zone" in request.form:
            zone_name = request.form.get("zone_name")
            if zone_name and not Zone.query.filter_by(name=zone_name).first():
                db.session.add(Zone(name=zone_name))  # type: ignore
                db.session.commit()
        elif "delete_zone" in request.form:
            zone_id = int(request.form["delete_zone"])
            zone = Zone.query.get(zone_id)
            if zone:
                if zone.users:  # Check if any users are assigned to this zone
                    return render_template(
                        "admin_users.html",
                        users=User.query.order_by(User.id.desc()).all(),
                        zones=Zone.query.order_by(Zone.name).all(),
                        error="Cannot delete zone: users are assigned to this zone.",
                    )
                db.session.delete(zone)
                db.session.commit()
    users = User.query.order_by(User.id.desc()).all()  # type: ignore
    zones = Zone.query.order_by(Zone.name).all()  # type: ignore
    return render_template("admin_users.html", users=users, zones=zones)


@app.route("/admin/approve_user/<int:user_id>", methods=["POST"])
@login_required
def approve_user(user_id: int):
    """Admin endpoint to approve a user (AJAX or form POST)."""
    if current_user.role != "admin":
        return "Unauthorized", 403
    user = User.query.get_or_404(user_id)
    user.active = True
    db.session.commit()
    return "approved"


class Report(db.Model):
    """Main report model, links to all report sections."""

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    zone_id = db.Column(db.Integer, db.ForeignKey("zone.id"), nullable=False)
    month = db.Column(db.Integer, nullable=False)  # 1-12
    year = db.Column(db.Integer, nullable=False)
    period_type = db.Column(
        db.String(20), nullable=False, default="monthly"
    )  # monthly, quarterly, half-yearly, yearly
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    # Relationships to new models
    header = db.relationship(
        "ReportHeader", backref="report", uselist=False, cascade="all, delete-orphan"
    )  # type: ignore
    courses = db.relationship(
        "ReportCourse", backref="report", lazy=True, cascade="all, delete-orphan"
    )  # type: ignore
    organizational = db.relationship(
        "ReportOrganizational",
        backref="report",
        lazy=True,
        cascade="all, delete-orphan",
    )  # type: ignore
    personal = db.relationship(
        "ReportPersonal", backref="report", lazy=True, cascade="all, delete-orphan"
    )  # type: ignore
    meetings = db.relationship(
        "ReportMeeting", backref="report", lazy=True, cascade="all, delete-orphan"
    )  # type: ignore
    extras = db.relationship(
        "ReportExtra", backref="report", lazy=True, cascade="all, delete-orphan"
    )  # type: ignore
    comments = db.relationship(
        "ReportComment", backref="report", uselist=False, cascade="all, delete-orphan"
    )  # type: ignore

    # Relationships
    user = db.relationship("User", backref="reports")  # type: ignore
    zone = db.relationship("Zone", backref="zone_reports")  # type: ignore


@login_manager.user_loader  # type: ignore
def load_user(user_id: str) -> Optional["User"]:
    user: Optional[User] = User.query.get(int(user_id))
    if user and user.is_active:
        return user
    return None


@app.route("/login", methods=["GET", "POST"])
def login():
    """
    User login page. Only active (admin-approved) users can log in.
    Redirects admin to master report, users to form.
    """
    if request.method == "POST":
        identifier = request.form.get("email")
        password = request.form.get("password")
        if not password:
            return render_template("login.html", error="পাসওয়ার্ড দিন")
        user: Optional[User] = None
        if identifier and "@" in identifier:
            user = User.query.filter_by(email=identifier).first()  # type: ignore
        elif (
            identifier
            and identifier.isdigit()
            and len(identifier) == 11
            and identifier.startswith("01")
        ):
            user = User.query.filter_by(mobile_number=identifier).first()  # type: ignore
        elif identifier and identifier.isdigit() and len(identifier) >= 3:
            user = User.query.filter_by(id=int(identifier)).first()  # type: ignore
        if user is not None and user.password is not None and check_password_hash(user.password, password):  # type: ignore
            if not user.is_active:  # type: ignore
                return render_template("login.html", error="এডমিন অনুমোদন বাকি")
            login_user(user)  # type: ignore
            if user.role == "admin":  # type: ignore
                return redirect(url_for("master_report"))
            else:
                return redirect(url_for("form"))
        else:
            return render_template(
                "login.html", error="ভুল ইমেইল, মোবাইল, আইডি বা পাসওয়ার্ড"
            )
    return render_template("login.html")


# --- Helper: Audit Logging ---


def log_report_edit(report_id, editor_id, changes, comment=None):  # type: ignore
    """Log an edit to a report for audit trail."""
    edit = ReportEdit(
        report_id=report_id,  # type: ignore
        editor_id=editor_id,  # type: ignore
        changes=json.dumps(changes, ensure_ascii=False),  # type: ignore
        comment=comment,  # type: ignore
    )
    db.session.add(edit)
    db.session.commit()


# --- Multi-section, wizard/full, edit, admin edit, audit, permission logic ---


# --- Multi-section report submission and edit form (legacy, now read-only) ---
@app.route("/form", methods=["GET"])
@login_required
def form():
    """
    Multi-section report submission and edit form (legacy, now read-only).
    Use the section-based routes for editing.
    """
    report_id = request.args.get("id")
    is_admin = current_user.role == "admin"
    report = None
    audit_trail = []
    if report_id:
        report = Report.query.options(db.joinedload(Report.header)).get(report_id)
        if report:
            audit_trail = (
                ReportEdit.query.filter_by(report_id=report.id)
                .order_by(ReportEdit.edit_time.desc())
                .all()
            )
            if not (is_admin or report.user_id == current_user.id):
                return render_template(
                    "form.html", error="Unauthorized", report=None, audit_trail=[]
                )
    return render_template("form.html", report=report, audit_trail=audit_trail)


@app.route("/master_report")
@login_required
def master_report():
    """
    Admin-only: Aggregate all report headers for master summary view.
    Returns totals for each header field across all reports.
    """
    if current_user.role != "admin":
        return render_template("report.html", error="Unauthorized access."), 403
    reports = Report.query.options(db.joinedload(Report.header)).all()
    header_fields = [
        "total_teachers",
        "teacher_increase",
        "teacher_decrease",
        "certified_teachers",
        "trained_teachers",
        "unit_count",
        "teachers_taking_classes_1",
        "teachers_taking_classes_2",
        "units_with_teachers",
    ]
    agg = {f: 0 for f in header_fields}
    for r in reports:
        if r.header:
            for f in header_fields:
                agg[f] += getattr(r.header, f, 0) or 0
    report_data = [{"category": k, "total_value": v} for k, v in agg.items()]
    return render_template("report.html", report_data=report_data)


@app.route("/export/<format>")
@login_required
def export(format):
    """
    Admin-only: Export master report as Excel or PDF.
    Aggregates all report headers and outputs in requested format.
    """
    if current_user.role != "admin":
        return "Unauthorized", 403
    reports = Report.query.options(db.joinedload(Report.header)).all()
    header_fields = [
        "total_teachers",
        "teacher_increase",
        "teacher_decrease",
        "certified_teachers",
        "trained_teachers",
        "unit_count",
        "teachers_taking_classes_1",
        "teachers_taking_classes_2",
        "units_with_teachers",
    ]
    agg = {f: 0 for f in header_fields}
    for r in reports:
        if r.header:
            for f in header_fields:
                agg[f] += getattr(r.header, f, 0) or 0
    df = pd.DataFrame([{"category": k, "total_value": v} for k, v in agg.items()])
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
    """
    Home route: Redirects authenticated users to their dashboard, else to login.
    """
    if current_user.is_authenticated:
        if current_user.role == "admin":
            return redirect(url_for("master_report"))
        else:
            return redirect(url_for("report_dashboard"))
    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(debug=True)

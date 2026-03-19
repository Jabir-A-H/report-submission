from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, send_file, current_app
from flask.views import MethodView
import traceback
import psycopg2
from flask_login import login_required, current_user
import urllib.parse
from datetime import datetime
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from extensions import db, cache
from models import HeaderObj, CommentsObj, AggReport
from models import People, Zone, Report, ReportHeader, ReportCourse, ReportOrganizational, ReportPersonal, ReportMeeting, ReportExtra, ReportComment, CityReportOverride
from utils import month_name, get_current_report, get_or_create_report, get_zones_cached, make_slugs, COURSE_CATEGORIES, ORG_CATEGORIES, PERSONAL_CATEGORIES, MEETING_CATEGORIES, EXTRA_CATEGORIES, is_admin
from forms.reports import ReportHeaderForm, ReportCommentForm

reports_bp = Blueprint("reports", __name__)
from services.pdf_generator import generate_pdf_with_playwright, generate_city_report_pdf
from services.report_aggregator import generate_city_report_data, get_city_report_overrides, apply_overrides_to_agg
from services.report_crud import handle_section_post
from services.report_aggregator import get_reports_for_period

class DashboardView(MethodView):
    decorators = [login_required]

    def get(self):
        month = request.args.get("month")
        year = request.args.get("year")
        report_type = request.args.get("report_type", "মাসিক")

        now = datetime.now()
        if not month and report_type == "মাসিক":
            month = now.month
        if not year:
            year = now.year

        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 25, type=int)

        from models import Report
        from sqlalchemy import desc

        query = Report.query
        if month:
            query = query.filter_by(month=int(month))
        if year:
            query = query.filter_by(year=int(year))
        if report_type:
            query = query.filter_by(report_type=report_type)

        if not current_user.role == "admin":
            query = query.filter_by(zone_id=current_user.zone_id)
            template = "index.html"
        else:
            template = "index_admin.html"

        pagination = query.order_by(desc(Report.id)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        reports = pagination.items

        city_report_url = url_for("reports.city_report_page", month=month, year=year, report_type=report_type)

        return render_template(
            template,
            reports=reports,
            pagination=pagination,
            month=month,
            year=year,
            report_type=report_type,
            city_report_url=city_report_url
        )

class CityReportView(MethodView):
    decorators = [login_required]

    def get(self):
        if not is_admin():
            return redirect(url_for("reports.dashboard"))
        from datetime import datetime

        month = request.args.get("month")
        year = request.args.get("year")
        report_type = request.args.get("report_type", "মাসিক")
        zone_id = request.args.get("zone_id")
        
        now = datetime.now()
        if not month and report_type == "মাসিক":
            month = now.month
        if not year:
            year = now.year

        from services.report_aggregator import generate_aggregated_report_data
        
        # This single Pandas delegation replaces 300+ lines of procedural looping!
        data = generate_aggregated_report_data(int(year), int(month) if month else None, report_type, zone_id=zone_id)
        
        zones = Zone.query.all()
        
        override_page_url = None
        if not zone_id:
            override_page_url = url_for("city_report_override", month=month, year=year, report_type=report_type)

        return render_template(
            "city_report.html",
            month=month,
            year=year,
            report_type=report_type,
            course_categories=data["course_categories"],
            org_categories=data["org_categories"],
            personal_categories=data["personal_categories"],
            meeting_categories=data["meeting_categories"],
            extra_categories=data["extra_categories"],
            cat_to_slug=data.get("cat_to_slug", {}),
            slug_to_cat=data.get("slug_to_cat", {}),
            org_cat_to_slug=data.get("org_cat_to_slug", {}),
            org_slug_to_cat=data.get("org_slug_to_cat", {}),
            personal_cat_to_slug=data.get("personal_cat_to_slug", {}),
            personal_slug_to_cat=data.get("personal_slug_to_cat", {}),
            meeting_cat_to_slug=data.get("meeting_cat_to_slug", {}),
            meeting_slug_to_cat=data.get("meeting_slug_to_cat", {}),
            extra_cat_to_slug=data.get("extra_cat_to_slug", {}),
            extra_slug_to_cat=data.get("extra_slug_to_cat", {}),
            city_summary=data["city_summary"],
            city_courses=data["city_courses"],
            city_organizational=data["city_organizational"],
            city_personal=data["city_personal"],
            city_meetings=data["city_meetings"],
            city_extras=data["city_extras"],
            city_comments=data["city_comments"],
            reports=data["reports"],
            total_zones=data["total_zones"],
            zones=zones,
            selected_zone_id=zone_id,
            overrides=data.get("overrides", {}),
            override_page_url=override_page_url,
        )

    def post(self):
        return self.get()

reports_bp.add_url_rule('/dashboard', view_func=DashboardView.as_view('dashboard'))
reports_bp.add_url_rule('/city_report', view_func=CityReportView.as_view('city_report_page'))

class CityReportOverrideView(MethodView):
    decorators = [login_required]

    def post(self):
        if not is_admin():
            return redirect(url_for("reports.dashboard"))
        from datetime import datetime

        year = int(request.form.get("year"))
        month = request.form.get("month")
        month = int(month) if month else None
        report_type = request.form.get("report_type")
        if request.form.get("remove_override") == "1":
            section = request.form.get("section")
            field = request.form.get("field")
            CityReportOverride.query.filter_by(
                year=year, month=month, report_type=report_type, section=section, field=field
            ).delete()
            db.session.commit()
            return redirect(url_for("reports.city_report_override", year=year, month=month, report_type=report_type))

        section = request.form.get("section")
        field = request.form.get("field")
        value = request.form.get("value")
        # Upsert override
        override = CityReportOverride.query.filter_by(
            year=year,
            month=month,
            report_type=report_type,
            section=section,
            field=field,
        ).first()
        if override:
            override.value = value
        else:
            override = CityReportOverride(
                year=year,
                month=month,
                report_type=report_type,
                section=section,
                field=field,
                value=value,
            )
            db.session.add(override)
        db.session.commit()
        # For AJAX: return OK, else redirect for normal POST
        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return ("OK", 200)
        # For normal POST, reload the page with same params
        return redirect(
            url_for(
                "reports.city_report_override", year=year, month=month, report_type=report_type
            )
        )


    def get(self):
        if not is_admin():
            return redirect(url_for("reports.dashboard"))
        
        from datetime import datetime
        month = request.args.get("month")
        year = request.args.get("year")
        report_type = request.args.get("report_type", "মাসিক")
        
        now = datetime.now()
        if not month and report_type == "মাসিক":
            month = now.month
        if not year:
            year = now.year

        from services.report_aggregator import generate_aggregated_report_data
        
        # Use the same aggregator as the city report page to get base values
        data = generate_aggregated_report_data(int(year), int(month) if month else None, report_type)
        
        # Fetch overrides for this period
        from models import CityReportOverride
        query = CityReportOverride.query.filter_by(year=int(year), report_type=report_type)
        if month:
            query = query.filter_by(month=int(month))
        else:
            query = query.filter(CityReportOverride.month.is_(None))
        overrides = query.order_by(
            CityReportOverride.section, CityReportOverride.field
        ).all()

        return render_template(
            "city_report_override.html",
            overrides=overrides,
            year=year,
            month=month,
            report_type=report_type,
            course_categories=data["course_categories"],
            org_categories=data["org_categories"],
            personal_categories=data["personal_categories"],
            meeting_categories=data["meeting_categories"],
            extra_categories=data["extra_categories"],
            cat_to_slug=data.get("cat_to_slug", {}),
            slug_to_cat=data.get("slug_to_cat", {}),
            org_cat_to_slug=data.get("org_cat_to_slug", {}),
            org_slug_to_cat=data.get("org_slug_to_cat", {}),
            personal_cat_to_slug=data.get("personal_cat_to_slug", {}),
            personal_slug_to_cat=data.get("personal_slug_to_cat", {}),
            meeting_cat_to_slug=data.get("meeting_cat_to_slug", {}),
            meeting_slug_to_cat=data.get("meeting_slug_to_cat", {}),
            extra_cat_to_slug=data.get("extra_cat_to_slug", {}),
            extra_slug_to_cat=data.get("extra_slug_to_cat", {}),
            city_summary=data["city_summary"],
            city_courses=data["city_courses"],
            city_organizational=data["city_organizational"],
            city_personal=data["city_personal"],
            city_meetings=data["city_meetings"],
            city_extras=data["city_extras"],
            city_comments=data["city_comments"],
        )


    # --- Helper: Get Report Period ---
reports_bp.add_url_rule('/city_report/override', view_func=CityReportOverrideView.as_view('city_report_override'))

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

@reports_bp.route("/report/header", methods=["GET", "POST"])
@login_required
def report_header():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        try:
            report = get_or_create_report(
                current_user.zone_id, month, year, report_type
            )
        except Exception as e:
            error = f"রিপোর্ট তৈরিতে সমস্যা হয়েছে: {str(e)}"
            print(f"Error in report_header: {e}")
            traceback.print_exc()
            # Create a minimal report object to prevent template errors
            report = Report(
                zone_id=current_user.zone_id,
                month=month,
                year=year,
                report_type=report_type,
            )

        form = ReportHeaderForm(obj=report.header if report else None)

        if form.validate_on_submit():
            # Create or update ReportHeader
            header = report.header
            if not header:
                header = ReportHeader(report_id=report.id)
                db.session.add(header)
            
            form.populate_obj(header)

            # Ensure absent numerical data strictly defaults to 0 safely without typing coercion overhead
            for int_field in ['total_muallima', 'muallima_increase', 'muallima_decrease', 
                              'certified_muallima', 'certified_muallima_taking_classes',
                              'trained_muallima', 'trained_muallima_taking_classes',
                              'total_unit', 'units_with_muallima']:
                if getattr(header, int_field) is None:
                    setattr(header, int_field, 0)

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
        form=form,
        error=error,
        success=success,
    )


@reports_bp.route("/report/courses", methods=["GET", "POST"])
@login_required
def report_courses():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        try:
            report = get_or_create_report(
                current_user.zone_id, month, year, report_type
            )
        except Exception as e:
            error = f"রিপোর্ট তৈরিতে সমস্যা হয়েছে: {str(e)}"
            print(f"Error in report_courses: {e}")
            traceback.print_exc()
            # Create a minimal report object to prevent template errors
            report = Report(
                zone_id=current_user.zone_id,
                month=month,
                year=year,
                report_type=report_type,
            )
        course_categories_raw = [
            "বিশিষ্টদের",
            "সাধারণদের",
            "কর্মীদের",
            "ইউনিট সভানেত্রী",
            "অগ্রসরদের",
            "শিশু- তা'লিমুল কুরআন",
            "নিরক্ষর- তা'লিমুস সলাত",
        ]
        course_categories, slug_to_cat, cat_to_slug = make_slugs(course_categories_raw)
        if request.method == "POST" and report:
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
            handle_section_post(report, "courses", course_categories, fields, request.form)
            success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
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


@reports_bp.route("/report/organizational", methods=["GET", "POST"])
@login_required
def report_organizational():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = get_or_create_report(current_user.zone_id, month, year, report_type)
        org_categories_raw = [
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
        org_categories, slug_to_cat, cat_to_slug = make_slugs(org_categories_raw)
        if request.method == "POST" and report:
            fields = ["number", "increase", "amount", "comments"]
            handle_section_post(report, "organizational", org_categories, fields, request.form)
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


@reports_bp.route("/report/personal", methods=["GET", "POST"])
@login_required
def report_personal():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = get_or_create_report(current_user.zone_id, month, year, report_type)
        personal_categories_raw = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"]
        personal_categories, slug_to_cat, cat_to_slug = make_slugs(
            personal_categories_raw
        )
        if request.method == "POST" and report:
            fields = [
                "teaching",
                "learning",
                "olama_invited",
                "became_shohojogi",
                "became_sokrio_shohojogi",
                "became_kormi",
                "became_rukon",
            ]
            handle_section_post(report, "personal", personal_categories, fields, request.form)
            success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
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


@reports_bp.route("/report/meetings", methods=["GET", "POST"])
@login_required
def report_meetings():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = get_or_create_report(current_user.zone_id, month, year, report_type)
        meeting_categories_raw = [
            "কমিটি বৈঠক হয়েছে",
            "মুয়াল্লিমাদের নিয়ে বৈঠক",
            "Committee Orientation",
            "Muallima Orientation",
        ]
        meeting_categories, slug_to_cat, cat_to_slug = make_slugs(
            meeting_categories_raw
        )
        if request.method == "POST" and report:
            fields = [
                "city_count",
                "city_avg_attendance",
                "thana_count",
                "thana_avg_attendance",
                "ward_count",
                "ward_avg_attendance",
                "comments",
            ]
            handle_section_post(report, "meetings", meeting_categories, fields, request.form)
            success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
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


@reports_bp.route("/report/extras", methods=["GET", "POST"])
@login_required
def report_extras():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = get_or_create_report(current_user.zone_id, month, year, report_type)
        extra_categories_raw = [
            "মক্তব সংখ্যা",
            "মক্তব বৃদ্ধি",
            "মহানগরী পরিচালিত",
            "স্থানীয়ভাবে পরিচালিত",
            "মহানগরীর সফর",
            "থানা কমিটির সফর",
            "থানা প্রতিনিধির সফর",
            "ওয়ার্ড প্রতিনিধির সফর",
        ]
        extra_categories, slug_to_cat, cat_to_slug = make_slugs(extra_categories_raw)
        if request.method == "POST" and report:
            fields = ["number"]
            handle_section_post(report, "extras", extra_categories, fields, request.form)
            success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
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


@reports_bp.route("/report/comments", methods=["GET", "POST"])
@login_required
def report_comments():
    month, year, report_type = get_report_period()
    report = None
    error = None
    success = None
    if current_user.is_authenticated:
        report = get_or_create_report(current_user.zone_id, month, year, report_type)
        form = ReportCommentForm(obj=report.comments if report else None)

        if form.validate_on_submit() and report:
            if report.comments:
                form.populate_obj(report.comments)
            else:
                new_comment = ReportComment(report_id=report.id)
                form.populate_obj(new_comment)
                db.session.add(new_comment)
            db.session.commit()
            success = "তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
    return render_template(
        "report/comments.html",
        month=month,
        year=year,
        report_type=report_type,
        report=report,
        form=form,
        error=error,
        success=success,
    )


# --- At a Glance / Summary Report ---


class ReportSummaryView(MethodView):
    decorators = [login_required]

    def get(self):
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

        # Use make_slugs helper for all categories and slug mappings
        from utils import make_slugs
        course_categories_raw = ["বিশিষ্টদের", "সাধারণদের", "কর্মীদের", "ইউনিট সভানেত্রী", "অগ্রসরদের", "শিশু- তা'লিমুল কুরআন", "নিরক্ষর- তা'লিমুস সলাত"]
        org_categories_raw = ["দাওয়াত দান", "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন", "সহযোগী হয়েছে", "সম্মতি দিয়েছেন", "সক্রিয় সহযোগী", "কর্মী", "রুকন", "দাওয়াতী ইউনিট", "ইউনিট", "সূধী", "এককালীন", "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)", "বই বিলি", "বই বিক্রি"]
        personal_categories_raw = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"]
        meeting_categories_raw = ["কমিটি বৈঠক হয়েছে", "মুয়াল্লিমাদের নিয়ে বৈঠক", "Committee Orientation", "Muallima Orientation"]
        extra_categories_raw = ["মক্তব সংখ্যা", "মক্তব বৃদ্ধি", "মহানগরী পরিচালিত", "স্থানীয়ভাবে পরিচালিত", "মহানগরীর সফর", "থানা কমিটির সফর", "থানা প্রতিনিধির সফর", "ওয়ার্ড প্রতিনিধির সফর"]

        course_categories, cat_to_slug, slug_to_cat = make_slugs(course_categories_raw)
        org_categories, org_cat_to_slug, org_slug_to_cat = make_slugs(org_categories_raw)
        personal_categories, personal_cat_to_slug, personal_slug_to_cat = make_slugs(personal_categories_raw)
        meeting_categories, meeting_cat_to_slug, meeting_slug_to_cat = make_slugs(meeting_categories_raw)
        extra_categories, extra_cat_to_slug, extra_slug_to_cat = make_slugs(extra_categories_raw)

        year_int = int(year)

        # If report_id is provided and user is admin, show that report only (no aggregation)
        if report_id and is_admin():
            from repositories.report_repository import ReportRepository
            report = ReportRepository.get_by_id(report_id)
            if report:
                month = report.month
                year = report.year
                report_type = report.report_type
            return render_template(
                "report.html", report=report, report_type=report_type, month=month, year=year,
                course_categories=course_categories, org_categories=org_categories, personal_categories=personal_categories,
                meeting_categories=meeting_categories, extra_categories=extra_categories, cat_to_slug=cat_to_slug,
                slug_to_cat=slug_to_cat, org_cat_to_slug=org_cat_to_slug, org_slug_to_cat=org_slug_to_cat,
                personal_cat_to_slug=personal_cat_to_slug, personal_slug_to_cat=personal_slug_to_cat,
                meeting_cat_to_slug=meeting_cat_to_slug, meeting_slug_to_cat=meeting_slug_to_cat,
                extra_cat_to_slug=extra_cat_to_slug, extra_slug_to_cat=extra_slug_to_cat,
            )

        # For monthly reports:
        if report_type == "মাসিক":
            from repositories.report_repository import ReportRepository
            
            # If admin is looking at a specific zone's monthly report (already handled by report_id check above if applicable)
            # or if they are looking at the general monthly view, we decide based on role.
            if is_admin() and not report_id:
                # Admins see the city-wide aggregated monthly report
                from services.report_aggregator import generate_aggregated_report_data, dict_to_agg_report
                data = generate_aggregated_report_data(year_int, int(month) if month else None, report_type)
                agg_report_obj = dict_to_agg_report(data) if data["reports"] else None
                return render_template(
                    "report.html", report=agg_report_obj, report_type=report_type, month=month, year=year,
                    course_categories=course_categories, org_categories=org_categories, personal_categories=personal_categories,
                    meeting_categories=meeting_categories, extra_categories=extra_categories, cat_to_slug=cat_to_slug,
                    slug_to_cat=slug_to_cat, org_cat_to_slug=org_cat_to_slug, org_slug_to_cat=org_slug_to_cat,
                    personal_cat_to_slug=personal_cat_to_slug, personal_slug_to_cat=personal_slug_to_cat,
                    meeting_cat_to_slug=meeting_cat_to_slug, meeting_slug_to_cat=meeting_slug_to_cat,
                    extra_cat_to_slug=extra_cat_to_slug, extra_slug_to_cat=extra_slug_to_cat,
                )
            else:
                # Regular users or specific report_id views (though report_id is handled above)
                report = ReportRepository.get_singular(zone_id=current_user.zone_id, year=year_int, report_type=report_type, month=int(month))
                return render_template(
                    "report.html", report=report, report_type=report_type, month=month, year=year,
                    course_categories=course_categories, org_categories=org_categories, personal_categories=personal_categories,
                    meeting_categories=meeting_categories, extra_categories=extra_categories, cat_to_slug=cat_to_slug,
                    slug_to_cat=slug_to_cat, org_cat_to_slug=org_cat_to_slug, org_slug_to_cat=org_slug_to_cat,
                    personal_cat_to_slug=personal_cat_to_slug, personal_slug_to_cat=personal_slug_to_cat,
                    meeting_cat_to_slug=meeting_cat_to_slug, meeting_slug_to_cat=meeting_slug_to_cat,
                    extra_cat_to_slug=extra_cat_to_slug, extra_slug_to_cat=extra_slug_to_cat,
                )

        # For other types: Delegate to Pandas Aggregator Service
        from services.report_aggregator import generate_aggregated_report_data, dict_to_agg_report
        data = generate_aggregated_report_data(year_int, int(month) if month else None, report_type, zone_id=current_user.zone_id)
        
        # We must convert the dictionary into the `AggReport` object syntax required by `report.html`.
        agg_report_obj = dict_to_agg_report(data) if data["reports"] else None

        return render_template(
            "report.html",
            report=agg_report_obj,
            report_type=report_type,
            month=month,
            year=year,
            course_categories=course_categories,
            org_categories=org_categories,
            personal_categories=personal_categories,
            meeting_categories=meeting_categories,
            extra_categories=extra_categories,
            cat_to_slug=cat_to_slug,
            slug_to_cat=slug_to_cat,
            org_cat_to_slug=org_cat_to_slug,
            org_slug_to_cat=org_slug_to_cat,
            personal_cat_to_slug=personal_cat_to_slug,
            personal_slug_to_cat=personal_slug_to_cat,
            meeting_cat_to_slug=meeting_cat_to_slug,
            meeting_slug_to_cat=meeting_slug_to_cat,
            extra_cat_to_slug=extra_cat_to_slug,
            extra_slug_to_cat=extra_slug_to_cat,
        )


    # --- Download Features ---



reports_bp.add_url_rule('/report', view_func=ReportSummaryView.as_view('report_summary'))

@reports_bp.route("/download/excel")
@login_required
def download_excel():
    import pandas as pd  # Import only when needed

    report_type = request.args.get("report_type", "মাসিক")
    month = request.args.get("month", "জানুয়ারি")
    year = int(request.args.get("year", 2025))
    zone_id = request.args.get("zone_id")  # For admin to download specific zone

    # Get report data based on user role
    if current_user.role == "admin" and zone_id:
        # Admin downloading specific zone report
        zone = Zone.query.get_or_404(zone_id)
        reports = get_reports_for_period(zone_id, report_type, month, year)
        filename = f"Zone_{zone.name}_{report_type}_{year}"
        if report_type == "মাসিক":
            filename += f"_{month}"
    elif current_user.role == "admin":
        # Admin downloading city report (all zones aggregated)
        reports = []
        zones = Zone.query.all()
        for zone in zones:
            zone_reports = get_reports_for_period(zone.id, report_type, month, year)
            reports.extend(zone_reports)
        filename = f"City_Report_{report_type}_{year}"
        if report_type == "মাসিক":
            filename += f"_{month}"
    else:
        # User downloading their zone report
        reports = get_reports_for_period(current_user.zone_id, report_type, month, year)
        filename = f"Zone_{current_user.zone.name}_{report_type}_{year}"
        if report_type == "মাসিক":
            filename += f"_{month}"

    from services.excel_export import generate_excel_file
    output = generate_excel_file(reports, report_type)
    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@reports_bp.route("/download/pdf")
@login_required
def download_pdf():
    report_type = request.args.get("report_type", "মাসিক")
    month = request.args.get("month", "জানুয়ারি")
    year = int(request.args.get("year", 2025))
    zone_id = request.args.get("zone_id")

    # Get report data based on user role
    if current_user.role == "admin" and zone_id:
        zone = Zone.query.get_or_404(zone_id)
        reports = get_reports_for_period(zone_id, report_type, month, year)
        title = f"Zone: {zone.name}"
        filename = f"Zone_{zone.name}_{report_type}_{year}"
    elif current_user.role == "admin":
        reports = []
        zones = Zone.query.all()
        for zone in zones:
            zone_reports = get_reports_for_period(zone.id, report_type, month, year)
            reports.extend(zone_reports)
        title = "City Report"
        filename = f"City_Report_{report_type}_{year}"
    else:
        reports = get_reports_for_period(current_user.zone_id, report_type, month, year)
        title = f"Zone: {current_user.zone.name}"
        filename = f"Zone_{current_user.zone.name}_{report_type}_{year}"

    if report_type == "মাসিক":
        title += f" - {month}"
        filename += f"_{month}"

    title += f" {year} - {report_type}"
    filename += ".pdf"

    # Use Playwright for PDF generation
    return generate_pdf_with_playwright(reports, title, filename)


@reports_bp.route("/download/city_report_pdf")
@login_required
def download_city_report_pdf():
    """Download aggregated city report as PDF with overrides applied"""
    print(
        f"[DEBUG] City report PDF download route called with params: month={request.args.get('month')}, year={request.args.get('year')}, report_type={request.args.get('report_type')}"
    )

    if not is_admin():
        print("[DEBUG] User is not admin, redirecting to dashboard")
        return redirect(url_for("reports.dashboard"))

    from datetime import datetime

    month = request.args.get("month")
    year = request.args.get("year")
    report_type = request.args.get("report_type", "মাসিক")
    now = datetime.now()

    if not month and report_type == "মাসিক":
        month = now.month
    if not year:
        year = now.year

    year_int = int(year)
    print(
        f"[DEBUG] Final parameters: month={month}, year={year_int}, report_type={report_type}"
    )

    # Generate the aggregated city report data (same logic as city_report_page)
    try:
        print("[DEBUG] Generating city report data...")
        city_data = generate_city_report_data(year_int, month, report_type)
        print(
            f"[DEBUG] City data generated successfully: {len(city_data.get('city_courses', []))} course categories"
        )
    except Exception as e:
        print(f"[DEBUG] Error generating city data: {e}")
        traceback.print_exc()
        flash(f"Error generating report data: {str(e)}", "error")
        return redirect(url_for("reports.city_report_page"))

    # Create filename
    filename = f"City_Report_{report_type}_{year}"
    if report_type == "মাসিক":
        filename += f"_{month}"
    filename += ".pdf"

    title = f"City Report - {report_type}"
    if report_type == "মাসিক":
        title += f" - {month}"
    title += f" {year}"

    print(f"[DEBUG] About to generate PDF with title: {title}, filename: {filename}")

    # Generate PDF of the aggregated city report
    try:
        return generate_city_report_pdf(city_data, title, filename)
    except Exception as e:
        print(f"[DEBUG] Error in PDF generation: {e}")
        traceback.print_exc()
        flash(f"PDF generation failed: {str(e)}", "error")
        return redirect(url_for("reports.city_report_page"))







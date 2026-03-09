import unicodedata
import re
import traceback
from extensions import db, cache
from models import (
    ReportCourse,
    ReportOrganizational,
    ReportPersonal,
    ReportMeeting,
    ReportExtra,
    People,
    Report,
    Zone,
)
from flask_login import current_user

# --- Constants for Report Categories ---
COURSE_CATEGORIES = [
    "বিশিষ্টদের",
    "সাধারণদের",
    "কর্মীদের",
    "ইউনিট সভানেত্রী",
    "অগ্রসরদের",
    "শিশু- তা'লিমুল কুরআন",
    "নিরক্ষর- তা'লিমুস সলাত",
]

ORG_CATEGORIES = [
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

PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"]

MEETING_CATEGORIES = [
    "কমিটি বৈঠক হয়েছে",
    "মুয়াল্লিমাদের নিয়ে বৈঠক",
    "Committee Orientation",
    "Muallima Orientation",
]

EXTRA_CATEGORIES = [
    "মক্তব সংখ্যা",
    "মক্তব বৃদ্ধি",
    "মহানগরী পরিচালিত",
    "স্থানীয়ভাবে পরিচালিত",
    "মহানগরীর সফর",
    "থানা কমিটির সফর",
    "থানা প্রতিনিধির সফর",
    "ওয়ার্ড প্রতিনিধির সফর",
]

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


# DRY helper for slug mappings
def make_slugs(categories):
    norm_categories = [normalize_cat(cat) for cat in categories]
    slugs = [slugify(cat) for cat in norm_categories]
    slug_to_cat = {slug: cat for slug, cat in zip(slugs, norm_categories)}
    cat_to_slug = {cat: slug for cat, slug in zip(norm_categories, slugs)}
    return norm_categories, slug_to_cat, cat_to_slug


# --- Helper: Populate Categories for New Report ---
def populate_categories_for_report(report_id):
    from sqlalchemy.exc import IntegrityError

    try:
        # Course Categories
        for cat in COURSE_CATEGORIES:
            norm_cat = normalize_cat(cat)
            if not ReportCourse.query.filter_by(
                category=norm_cat, report_id=report_id
            ).first():
                try:
                    db.session.add(
                        ReportCourse(category=norm_cat, number=0, report_id=report_id)
                    )
                    db.session.flush()
                except IntegrityError:
                    db.session.rollback()
                    continue

        # Organizational Categories
        for cat in ORG_CATEGORIES:
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
                    db.session.flush()
                except IntegrityError:
                    db.session.rollback()
                    continue

        # Personal Activities Categories
        for cat in PERSONAL_CATEGORIES:
            norm_cat = normalize_cat(cat)
            if not ReportPersonal.query.filter_by(
                category=norm_cat, report_id=report_id
            ).first():
                try:
                    db.session.add(
                        ReportPersonal(category=norm_cat, report_id=report_id)
                    )
                    db.session.flush()
                except IntegrityError:
                    db.session.rollback()
                    continue

        # Meeting Categories
        for cat in MEETING_CATEGORIES:
            norm_cat = normalize_cat(cat)
            if not ReportMeeting.query.filter_by(
                category=norm_cat, report_id=report_id
            ).first():
                try:
                    db.session.add(
                        ReportMeeting(category=norm_cat, report_id=report_id)
                    )
                    db.session.flush()
                except IntegrityError:
                    db.session.rollback()
                    continue

        # Extra Activity Categories
        for cat in EXTRA_CATEGORIES:
            norm_cat = normalize_cat(cat)
            if not ReportExtra.query.filter_by(
                category=norm_cat, report_id=report_id
            ).first():
                try:
                    db.session.add(
                        ReportExtra(category=norm_cat, number=0, report_id=report_id)
                    )
                    db.session.flush()
                except IntegrityError:
                    db.session.rollback()
                    continue

        # Commit all changes at once
        db.session.commit()

    except Exception as e:
        db.session.rollback()
        raise e


# --- Utility Functions ---

def is_admin():
    return current_user.is_authenticated and current_user.role == "admin"


def generate_next_user_id():
    try:
        last_user = People.query.order_by(People.user_id.desc()).first()
        if last_user and last_user.user_id.isdigit():
            next_id = int(last_user.user_id) + 1
        else:
            next_id = 100
        return f"{next_id:03d}"
    except Exception as e:
        print(f"Error generating user ID: {e}")
        traceback.print_exc()
        import random
        return f"{random.randint(100, 999):03d}"


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


def get_current_report(zone_id, month, year, report_type):
    from repositories.report_repository import ReportRepository
    query = {
        "zone_id": zone_id,
        "year": year,
        "report_type": report_type,
    }
    if report_type == "মাসিক":
        query["month"] = month
    return ReportRepository.get_singular(**query)


def get_or_create_report(zone_id, month, year, report_type):
    """Get existing report or create new one if it doesn't exist"""
    from models import Report
    from repositories.report_repository import ReportRepository

    query = {
        "zone_id": zone_id,
        "year": year,
        "report_type": report_type,
    }
    if report_type == "মাসিক":
        query["month"] = month

    report = ReportRepository.get_singular(**query)
    if not report:
        try:
            # Create report if not exists
            report = Report(
                zone_id=zone_id,
                month=month,
                year=year,
                report_type=report_type,
            )
            ReportRepository.save(report)

            # Populate categories for new report
            try:
                populate_categories_for_report(report.id)
            except Exception as e:
                print(f"Warning: Failed to populate categories for report {report.id}: {e}")
                traceback.print_exc()

        except Exception as e:
            db.session.rollback()
            print(f"Error creating report: {e}")
            traceback.print_exc()
            raise e

    return report


@cache.memoize(timeout=300)
def get_zones_cached():
    """Get zones with caching to reduce database hits"""
    return Zone.query.all()


def register_template_filters(app):
    app.template_filter("month_name")(month_name)
    app.jinja_env.globals.update(get_current_report=get_current_report)

from sqlalchemy.orm import joinedload
from flask import flash
from models import CityReportOverride, Zone
from models import AggReport, HeaderObj, CommentsObj
from utils import populate_categories_for_report, make_slugs, COURSE_CATEGORIES, ORG_CATEGORIES, PERSONAL_CATEGORIES, MEETING_CATEGORIES, EXTRA_CATEGORIES, normalize_cat
from collections import defaultdict
import pandas as pd
import numpy as np

def get_reports_for_period(zone_id, report_type, month, year):
    month_name_to_number = {
        "জানুয়ারি": 1, "ফেব্রুয়ারি": 2, "মার্চ": 3, "এপ্রিল": 4, "মে": 5, "জুন": 6,
        "জুলাই": 7, "আগস্ট": 8, "সেপ্টেম্বর": 9, "অক্টোবর": 10, "নভেম্বর": 11, "ডিসেম্বর": 12,
    }
    if report_type == "মাসিক":
        if isinstance(month, str) and month in month_name_to_number:
            month_nums = [month_name_to_number[month]]
        else:
            month_nums = [int(month)]
    elif report_type == "ত্রৈমাসিক": month_nums = [1, 2, 3]
    elif report_type == "ষান্মাসিক": month_nums = [1, 2, 3, 4, 5, 6]
    elif report_type == "নয়-মাসিক": month_nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    elif report_type == "বার্ষিক": month_nums = list(range(1, 13))
    else:
        month_nums = [month_name_to_number[month]] if isinstance(month, str) and month in month_name_to_number else [int(month)]

    from repositories.report_repository import ReportRepository

    reports = []
    for m in month_nums:
        report = ReportRepository.get_singular(zone_id, m, year, "মাসিক")
        if report:
            reports.append(report)
    return reports

def get_city_report_overrides(year, month, report_type):
    from repositories.report_repository import OverrideRepository
    overrides = OverrideRepository.get_all_for_period(year, month, report_type)
    return {(o.section, o.field): o.value for o in overrides}

def apply_overrides_to_agg(agg_dict, section, overrides):
    for field in agg_dict:
        key = (section, field)
        if key in overrides:
            val = overrides[key]
            if isinstance(agg_dict[field], (int, float, np.integer, np.floating)):
                try: agg_dict[field] = int(val)
                except Exception: agg_dict[field] = val
            else:
                agg_dict[field] = val
    return agg_dict

def extract_dataframe(serialized_reports, section_key):
    """Safely extracts a pandas DataFrame from the nested Marshmallow serialization."""
    records = []
    for r in serialized_reports:
        # For nested lists
        if section_key in r and isinstance(r[section_key], list):
            for row in r[section_key]:
                if row:
                    records.append(row)
        # For singular nested dicts (like header or comments)
        elif section_key in r and isinstance(r[section_key], dict):
            records.append(r[section_key])
            
    if not records:
        return pd.DataFrame()
    return pd.DataFrame(records)

def aggregate_dataframe(df, categories, agg_fields, category_col="category", fill_value=0):
    """Uses Pandas groupby sum to cleanly aggregate fields matching specific categories."""
    if df.empty:
        return [{"category": cat, **{field: fill_value for field in agg_fields}} for cat in categories]
    
    # Normalize category names in the DF to match standard ones exactly
    if category_col in df.columns:
        df["_norm_cat"] = df[category_col].apply(lambda c: normalize_cat(str(c)))
    else:
        df["_norm_cat"] = ""

    results = []
    for cat in categories:
        norm_c = normalize_cat(cat)
        # Filter dataframe for this category
        cat_df = df[df["_norm_cat"] == norm_c]
        agg_res = {"category": cat}
        for field in agg_fields:
            if field in cat_df.columns:
                # Sum numeric values, ignore non-numeric gracefully
                val = pd.to_numeric(cat_df[field], errors='coerce').sum()
                agg_res[field] = int(val) if pd.notna(val) else fill_value
            else:
                agg_res[field] = fill_value
        results.append(agg_res)
    return results

def generate_city_report_data(year, month, report_type):
    course_categories_raw = ["বিশিষ্টদের", "সাধারণদের", "কর্মীদের", "ইউনিট সভানেত্রী", "অগ্রসরদের", "শিশু- তা'লিমুল কুরআন", "নিরক্ষর- তা'লিমুস সলাত"]
    org_categories_raw = ["দাওয়াত দান", "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন", "সহযোগী হয়েছে", "সম্মতি দিয়েছেন", "সক্রিয় সহযোগী", "কর্মী", "রুকন", "দাওয়াতী ইউনিট", "ইউনিট", "সূধী", "এককালীন", "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)", "বই বিলি", "বই বিক্রি"]
    personal_categories_raw = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"]
    meeting_categories_raw = ["কমিটি বৈঠক হয়েছে", "মুয়াল্লিমাদের নিয়ে বৈঠক", "Committee Orientation", "Muallima Orientation"]
    extra_categories_raw = ["মক্তব সংখ্যা", "মক্তব বৃদ্ধি", "মহানগরী পরিচালিত", "স্থানীয়ভাবে পরিচালিত", "মহানগরীর সফর", "থানা কমিটির সফর", "থানা প্রতিনিধির সফর", "ওয়ার্ড প্রতিনিধির সফর"]

    course_categories, cat_to_slug, slug_to_cat = make_slugs(course_categories_raw)
    org_categories, org_cat_to_slug, org_slug_to_cat = make_slugs(org_categories_raw)
    personal_categories, personal_cat_to_slug, personal_slug_to_cat = make_slugs(personal_categories_raw)
    meeting_categories, meeting_cat_to_slug, meeting_slug_to_cat = make_slugs(meeting_categories_raw)
    extra_categories, extra_cat_to_slug, extra_slug_to_cat = make_slugs(extra_categories_raw)

    def get_months(report_type, month):
        if report_type == "মাসিক": return [int(month)] if month else []
        elif report_type == "ত্রৈমাসিক": return [1, 2, 3]
        elif report_type == "ষান্মাসিক": return [1, 2, 3, 4, 5, 6]
        elif report_type == "নয়-মাসিক": return [1, 2, 3, 4, 5, 6, 7, 8, 9]
        elif report_type == "বার্ষিক": return list(range(1, 13))
        return []

    months = get_months(report_type, month)

    from repositories.report_repository import ReportRepository
    from schemas import ReportSchema

    if report_type == "মাসিক":
        reports = ReportRepository.get_city_aggregated(year, [int(month)], "মাসিক")
    else:
        reports = ReportRepository.get_city_aggregated(year, months, "মাসিক")

    # MARSHMALLOW SERIALIZATION
    serialized_reports = ReportSchema(many=True).dump(reports)
    overrides = get_city_report_overrides(year, int(month) if month else None, report_type)

    # HEADER AGGREGATION VIA PANDAS
    header_fields = ["ward", "total_muallima", "muallima_increase", "muallima_decrease", "certified_muallima", "certified_muallima_taking_classes", "trained_muallima", "trained_muallima_taking_classes", "total_unit", "units_with_muallima"]
    city_summary = {field: 0 for field in header_fields}
    city_summary["responsible_name"] = None
    city_summary["thana"] = None

    header_df = extract_dataframe(serialized_reports, "header")
    if not header_df.empty:
        for field in header_fields:
            if field in header_df.columns:
                city_summary[field] = int(pd.to_numeric(header_df[field], errors='coerce').sum())
        
        # Thana logic (sum if all are integers)
        if "thana" in header_df.columns:
            thana_series = pd.to_numeric(header_df["thana"], errors='coerce')
            if thana_series.notna().all() and len(thana_series) > 0:
                city_summary["thana"] = int(thana_series.sum())

    city_summary = apply_overrides_to_agg(city_summary, "header", overrides)

    # COURSES AGGREGATION VIA PANDAS
    course_fields = ["number", "increase", "decrease", "sessions", "students", "attendance", "status_board", "status_qayda", "status_ampara", "status_quran", "completed", "correctly_learned"]
    courses_df = extract_dataframe(serialized_reports, "courses")
    raw_city_courses = aggregate_dataframe(courses_df, course_categories, course_fields)
    city_courses = [apply_overrides_to_agg(c, f"courses:{c['category']}", overrides) for c in raw_city_courses]

    # ORGANIZATIONAL AGGREGATION VIA PANDAS
    org_fields = ["number", "increase", "amount"]
    org_df = extract_dataframe(serialized_reports, "organizational")
    raw_city_org = aggregate_dataframe(org_df, org_categories, org_fields)
    city_organizational = []
    for agg in raw_city_org:
        cat = agg['category']
        # Handle string comments natively
        agg["comments"] = 0
        cat_df = org_df[org_df["category"].apply(lambda c: normalize_cat(str(c))) == normalize_cat(cat)] if "category" in org_df.columns else pd.DataFrame()
        
        if not cat_df.empty and "comments" in cat_df.columns:
            comment_series = pd.to_numeric(cat_df["comments"], errors='coerce')
            if comment_series.isna().any(): # Contains non-numeric text
                agg["comments"] = None
            else:
                agg["comments"] = int(comment_series.sum())
                
        city_organizational.append(apply_overrides_to_agg(agg, f"organizational:{cat}", overrides))

    # PERSONAL AGGREGATION VIA PANDAS
    personal_fields = ["teaching", "learning", "olama_invited", "became_shohojogi", "became_sokrio_shohojogi", "became_kormi", "became_rukon"]
    personal_df = extract_dataframe(serialized_reports, "personal")
    raw_city_personal = aggregate_dataframe(personal_df, personal_categories, personal_fields)
    city_personal = [apply_overrides_to_agg(c, f"personal:{c['category']}", overrides) for c in raw_city_personal]

    # MEETINGS AGGREGATION VIA PANDAS
    meetings_df = extract_dataframe(serialized_reports, "meetings")
    city_meetings = []
    
    if "category" in meetings_df.columns:
        meetings_df["_norm_cat"] = meetings_df["category"].apply(lambda c: normalize_cat(str(c)))
    else:
        meetings_df["_norm_cat"] = ""

    for cat in meeting_categories:
        agg = {"category": cat, "city_count": 0, "city_avg_attendance": 0, "thana_count": 0, "thana_avg_attendance": 0, "ward_count": 0, "ward_avg_attendance": 0, "comments": 0}
        norm_c = normalize_cat(cat)
        cat_df = meetings_df[meetings_df["_norm_cat"] == norm_c] if not meetings_df.empty else pd.DataFrame()

        if not cat_df.empty:
            for prefix in ["city", "thana", "ward"]:
                count_col = f"{prefix}_count"
                att_col = f"{prefix}_avg_attendance"
                if count_col in cat_df.columns and att_col in cat_df.columns:
                    counts = pd.to_numeric(cat_df[count_col], errors='coerce').fillna(0)
                    atts = pd.to_numeric(cat_df[att_col], errors='coerce').fillna(0)
                    total_count = counts.sum()
                    if total_count > 0:
                        total_att = (counts * atts).sum()
                        agg[count_col] = int(total_count)
                        agg[att_col] = int(total_att / total_count)
                        
            if "comments" in cat_df.columns:
                comment_series = pd.to_numeric(cat_df["comments"], errors='coerce')
                if comment_series.isna().any():
                    agg["comments"] = None
                else:
                    agg["comments"] = int(comment_series.sum())

        city_meetings.append(apply_overrides_to_agg(agg, f"meetings:{cat}", overrides))

    # EXTRAS AGGREGATION VIA PANDAS
    extra_fields = ["number"]
    extras_df = extract_dataframe(serialized_reports, "extras")
    raw_city_extras = aggregate_dataframe(extras_df, extra_categories, extra_fields)
    city_extras = [apply_overrides_to_agg(c, f"extras:{c['category']}", overrides) for c in raw_city_extras]

    # COMMENTS AGGREGATION VIA PANDAS
    city_comments = {"comment": ""}
    comments_df = extract_dataframe(serialized_reports, "comments")
    if not comments_df.empty and "comment" in comments_df.columns:
        valid_comments = comments_df["comment"].dropna()
        if len(valid_comments) > 0:
            comment_series = pd.to_numeric(valid_comments, errors='coerce')
            if comment_series.isna().any():
                # Merge string comments
                city_comments["comment"] = ", ".join(valid_comments.astype(str).str.strip().tolist())
            else:
                s = int(comment_series.sum())
                city_comments["comment"] = s if s != 0 else ""
                
    city_comments = apply_overrides_to_agg(city_comments, "comments", overrides)

    total_zones = len(set([r["zone_id"] for r in serialized_reports]))

    return {
        "month": month,
        "year": year,
        "report_type": report_type,
        "course_categories": course_categories,
        "org_categories": org_categories,
        "personal_categories": personal_categories,
        "meeting_categories": meeting_categories,
        "extra_categories": extra_categories,
        "city_summary": city_summary,
        "city_courses": city_courses,
        "city_organizational": city_organizational,
        "city_personal": city_personal,
        "city_meetings": city_meetings,
        "city_extras": city_extras,
        "city_comments": city_comments,
        "total_zones": total_zones,
        "overrides": overrides,
    }


def generate_aggregated_report_data(year, month, report_type, zone_id=None):
    """
    A versatile wrapper over generate_city_report_data.
    If zone_id is provided, fetches and aggregates ONLY that zone's data.
    Overrides are only applied if zone_id is None.
    """
    from repositories.report_repository import ReportRepository
    from schemas import ReportSchema
    
    # Base dependencies
    course_categories_raw = ["বিশিষ্টদের", "সাধারণদের", "কর্মীদের", "ইউনিট সভানেত্রী", "অগ্রসরদের", "শিশু- তা'লিমুল কুরআন", "নিরক্ষর- তা'লিমুস সলাত"]
    org_categories_raw = ["দাওয়াত দান", "কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন", "সহযোগী হয়েছে", "সম্মতি দিয়েছেন", "সক্রিয় সহযোগী", "কর্মী", "রুকন", "দাওয়াতী ইউনিট", "ইউনিট", "সূধী", "এককালীন", "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)", "বই বিলি", "বই বিক্রি"]
    personal_categories_raw = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"]
    meeting_categories_raw = ["কমিটি বৈঠক হয়েছে", "মুয়াল্লিমাদের নিয়ে বৈঠক", "Committee Orientation", "Muallima Orientation"]
    extra_categories_raw = ["মক্তব সংখ্যা", "মক্তব বৃদ্ধি", "মহানগরী পরিচালিত", "স্থানীয়ভাবে পরিচালিত", "মহানগরীর সফর", "থানা কমিটির সফর", "থানা প্রতিনিধির সফর", "ওয়ার্ড প্রতিনিধির সফর"]

    course_categories, cat_to_slug, slug_to_cat = make_slugs(course_categories_raw)
    org_categories, org_cat_to_slug, org_slug_to_cat = make_slugs(org_categories_raw)
    personal_categories, personal_cat_to_slug, personal_slug_to_cat = make_slugs(personal_categories_raw)
    meeting_categories, meeting_cat_to_slug, meeting_slug_to_cat = make_slugs(meeting_categories_raw)
    extra_categories, extra_cat_to_slug, extra_slug_to_cat = make_slugs(extra_categories_raw)

    def get_months(r_type, m):
        if r_type == "মাসিক": return [int(m)] if m else []
        elif r_type == "ত্রৈমাসিক": return [1, 2, 3]
        elif r_type == "ষান্মাসিক": return [1, 2, 3, 4, 5, 6]
        elif r_type == "নয়-মাসিক": return [1, 2, 3, 4, 5, 6, 7, 8, 9]
        elif r_type == "বার্ষিক": return list(range(1, 13))
        return []

    months = get_months(report_type, month)

    if zone_id:
        if report_type == "মাসিক":
            reports = ReportRepository.get_multiple_by_zone(zone_id, year, "মাসিক", [int(month)]) if month else []
        else:
            reports = ReportRepository.get_multiple_by_zone(zone_id, year, "মাসিক", months)
        overrides = {} # No overrides for zone-specific reports
    else:
        if report_type == "মাসিক":
            reports = ReportRepository.get_city_aggregated(year, [int(month)], "মাসিক") if month else []
        else:
            reports = ReportRepository.get_city_aggregated(year, months, "মাসিক")
        overrides = get_city_report_overrides(year, int(month) if month else None, report_type)

    # MARSHMALLOW SERIALIZATION
    serialized_reports = ReportSchema(many=True).dump(reports)

    # HEADER AGGREGATION VIA PANDAS
    header_fields = ["ward", "total_muallima", "muallima_increase", "muallima_decrease", "certified_muallima", "certified_muallima_taking_classes", "trained_muallima", "trained_muallima_taking_classes", "total_unit", "units_with_muallima"]
    city_summary = {field: 0 for field in header_fields}
    city_summary["responsible_name"] = None
    city_summary["thana"] = None

    header_df = extract_dataframe(serialized_reports, "header")
    if not header_df.empty:
        for field in header_fields:
            if field in header_df.columns:
                city_summary[field] = int(pd.to_numeric(header_df[field], errors='coerce').sum())
        
        # Thana logic (sum if all are integers)
        if "thana" in header_df.columns:
            thana_series = pd.to_numeric(header_df["thana"], errors='coerce')
            if thana_series.notna().all() and len(thana_series) > 0:
                city_summary["thana"] = int(thana_series.sum())

    city_summary = apply_overrides_to_agg(city_summary, "header", overrides)

    # COURSES AGGREGATION VIA PANDAS
    course_fields = ["number", "increase", "decrease", "sessions", "students", "attendance", "status_board", "status_qayda", "status_ampara", "status_quran", "completed", "correctly_learned"]
    courses_df = extract_dataframe(serialized_reports, "courses")
    raw_city_courses = aggregate_dataframe(courses_df, course_categories, course_fields)
    city_courses = [apply_overrides_to_agg(c, f"courses:{c['category']}", overrides) for c in raw_city_courses]

    # ORGANIZATIONAL AGGREGATION VIA PANDAS
    org_fields = ["number", "increase", "amount"]
    org_df = extract_dataframe(serialized_reports, "organizational")
    raw_city_org = aggregate_dataframe(org_df, org_categories, org_fields)
    city_organizational = []
    for agg in raw_city_org:
        cat = agg['category']
        agg["comments"] = 0
        cat_df = org_df[org_df["category"].apply(lambda c: normalize_cat(str(c))) == normalize_cat(cat)] if "category" in org_df.columns else pd.DataFrame()
        
        if not cat_df.empty and "comments" in cat_df.columns:
            comment_series = pd.to_numeric(cat_df["comments"], errors='coerce')
            if comment_series.isna().any(): 
                agg["comments"] = None
            else:
                agg["comments"] = int(comment_series.sum())
                
        city_organizational.append(apply_overrides_to_agg(agg, f"organizational:{cat}", overrides))

    # PERSONAL AGGREGATION VIA PANDAS
    personal_fields = ["teaching", "learning", "olama_invited", "became_shohojogi", "became_sokrio_shohojogi", "became_kormi", "became_rukon"]
    personal_df = extract_dataframe(serialized_reports, "personal")
    raw_city_personal = aggregate_dataframe(personal_df, personal_categories, personal_fields)
    city_personal = [apply_overrides_to_agg(c, f"personal:{c['category']}", overrides) for c in raw_city_personal]

    # MEETINGS AGGREGATION VIA PANDAS
    meetings_df = extract_dataframe(serialized_reports, "meetings")
    city_meetings = []
    
    if "category" in meetings_df.columns:
        meetings_df["_norm_cat"] = meetings_df["category"].apply(lambda c: normalize_cat(str(c)))
    else:
        meetings_df["_norm_cat"] = ""

    for cat in meeting_categories:
        agg = {"category": cat, "city_count": 0, "city_avg_attendance": 0, "thana_count": 0, "thana_avg_attendance": 0, "ward_count": 0, "ward_avg_attendance": 0, "comments": 0}
        norm_c = normalize_cat(cat)
        cat_df = meetings_df[meetings_df["_norm_cat"] == norm_c] if not meetings_df.empty else pd.DataFrame()

        if not cat_df.empty:
            for prefix in ["city", "thana", "ward"]:
                count_col = f"{prefix}_count"
                att_col = f"{prefix}_avg_attendance"
                if count_col in cat_df.columns and att_col in cat_df.columns:
                    counts = pd.to_numeric(cat_df[count_col], errors='coerce').fillna(0)
                    atts = pd.to_numeric(cat_df[att_col], errors='coerce').fillna(0)
                    total_count = counts.sum()
                    if total_count > 0:
                        total_att = (counts * atts).sum()
                        agg[count_col] = int(total_count)
                        agg[att_col] = int(total_att / total_count)
                        
            if "comments" in cat_df.columns:
                comment_series = pd.to_numeric(cat_df["comments"], errors='coerce')
                if comment_series.isna().any():
                    agg["comments"] = None
                else:
                    agg["comments"] = int(comment_series.sum())

        city_meetings.append(apply_overrides_to_agg(agg, f"meetings:{cat}", overrides))

    # EXTRAS AGGREGATION VIA PANDAS
    extra_fields = ["number"]
    extras_df = extract_dataframe(serialized_reports, "extras")
    raw_city_extras = aggregate_dataframe(extras_df, extra_categories, extra_fields)
    city_extras = [apply_overrides_to_agg(c, f"extras:{c['category']}", overrides) for c in raw_city_extras]

    # COMMENTS AGGREGATION VIA PANDAS
    city_comments = {"comment": ""}
    comments_df = extract_dataframe(serialized_reports, "comments")
    if not comments_df.empty and "comment" in comments_df.columns:
        valid_comments = comments_df["comment"].dropna()
        if len(valid_comments) > 0:
            comment_series = pd.to_numeric(valid_comments, errors='coerce')
            if comment_series.isna().any():
                city_comments["comment"] = ", ".join(valid_comments.astype(str).str.strip().tolist())
            else:
                s = int(comment_series.sum())
                city_comments["comment"] = s if s != 0 else ""
                
    city_comments = apply_overrides_to_agg(city_comments, "comments", overrides)

    total_zones = len(set([str(r.get("zone_id", "")) for r in serialized_reports if r.get("zone_id")]))

    return {
        "month": month,
        "year": year,
        "report_type": report_type,
        "course_categories": course_categories,
        "org_categories": org_categories,
        "personal_categories": personal_categories,
        "meeting_categories": meeting_categories,
        "extra_categories": extra_categories,
        "cat_to_slug": cat_to_slug,
        "slug_to_cat": slug_to_cat,
        "org_cat_to_slug": org_cat_to_slug,
        "org_slug_to_cat": org_slug_to_cat,
        "personal_cat_to_slug": personal_cat_to_slug,
        "personal_slug_to_cat": personal_slug_to_cat,
        "meeting_cat_to_slug": meeting_cat_to_slug,
        "meeting_slug_to_cat": meeting_slug_to_cat,
        "extra_cat_to_slug": extra_cat_to_slug,
        "extra_slug_to_cat": extra_slug_to_cat,
        "city_summary": city_summary,
        "city_courses": city_courses,
        "city_organizational": city_organizational,
        "city_personal": city_personal,
        "city_meetings": city_meetings,
        "city_extras": city_extras,
        "city_comments": city_comments,
        "reports": reports,
        "total_zones": total_zones,
        "overrides": overrides,
    }

class DynamicObject:
    def __init__(self, dictionary):
        for k, v in dictionary.items():
            setattr(self, k, v)

def dict_to_agg_report(data):
    """
    Converts the structured dictionary from generate_aggregated_report_data
    into the `AggReport` object hierarchy that `report.html` natively expects.
    This entirely replaces the duplicate routing loop mapping logic.
    """
    agg = AggReport()
    agg.header = DynamicObject(data.get("city_summary", {}))
    
    # report.html loops over collections of objects using getattr: row.category
    agg.courses = [DynamicObject(row) for row in data.get("city_courses", [])]
    agg.organizational = [DynamicObject(row) for row in data.get("city_organizational", [])]
    agg.personal = [DynamicObject(row) for row in data.get("city_personal", [])]
    agg.meetings = [DynamicObject(row) for row in data.get("city_meetings", [])]
    agg.extras = [DynamicObject(row) for row in data.get("city_extras", [])]
    
    if data.get("city_comments"):
        agg.comments = DynamicObject(data.get("city_comments"))
    
    return agg

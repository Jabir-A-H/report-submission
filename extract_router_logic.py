import re
import os

ROUTER_FILE = "routes/reports.py"

with open(ROUTER_FILE, "r", encoding="utf-8") as f:
    lines: list[str] = f.readlines()

# Reconstruct content as a single string for the existing logic
content: str = "".join(lines)

# ---------------------------------------------------------
# 1. Update CityReportView.get
# ---------------------------------------------------------

# Find the start of CityReportView.get
city_report_get_start_regex = r"def get\(self\):\n\s+if not is_admin\(\):\n\s+return redirect\(url_for\(\"reports\.dashboard\"\)\)\n\s+from datetime import datetime"

# We want to replace everything from `month = request.args.get("month")`...
# down to the `return render_template(...)`

city_report_replacement_logic = """        month = request.args.get("month")
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
        )"""

# 1. Update CityReportView.get logic
match1_start = content.find('        month = request.args.get("month")')
match1_end_str = '            override_page_url=override_page_url,\n        )'
match1_end_idx = content.find(match1_end_str, match1_start)

if match1_start != -1 and match1_end_idx != -1:
    match1_end = match1_end_idx + len(match1_end_str)
    content = content[:match1_start] + city_report_replacement_logic + content[match1_end:]
    print("SUCCESS: Replaced CityReportView.get logic")
else:
    print(f"FAILED to match CityReportView.get (start: {match1_start}, end: {match1_end_idx})")


# ---------------------------------------------------------
# 2. Update ReportSummaryView.get
# ---------------------------------------------------------

summary_replacement_logic = """        # Use make_slugs helper for all categories and slug mappings
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

        # For users: মাসিক report is NOT aggregated, just show the single report for that month
        if report_type == "মাসিক":
            from repositories.report_repository import ReportRepository
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
        )"""

# 2. Update ReportSummaryView.get logic
match2_start = content.find('        # Use make_slugs helper for all categories and slug mappings')
match2_end_str = '            extra_slug_to_cat=extra_slug_to_cat,\n        )'
match2_end_idx = content.find(match2_end_str, match2_start)

if match2_start != -1 and match2_end_idx != -1:
    match2_end = match2_end_idx + len(match2_end_str)
    content = content[:match2_start] + summary_replacement_logic + content[match2_end:]
    print("SUCCESS: Replaced ReportSummaryView.get logic")
else:
    print(f"FAILED to match ReportSummaryView.get (start: {match2_start}, end: {match2_end_idx})")

with open(ROUTER_FILE, "w", encoding="utf-8") as f:
    f.write(content)
print("Finished rewriting routes/reports.py")

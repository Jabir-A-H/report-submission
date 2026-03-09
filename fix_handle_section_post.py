def fix():
    with open('routes/reports.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacements
    replacements = {
        'handle_section_post(report, "courses", course_categories, fields)': 'handle_section_post(report, "courses", course_categories, fields, request.form)',
        'handle_section_post(report, "organizational", org_categories, fields)': 'handle_section_post(report, "organizational", org_categories, fields, request.form)',
        'handle_section_post(report, "personal", personal_categories, fields)': 'handle_section_post(report, "personal", personal_categories, fields, request.form)',
        'handle_section_post(report, "meetings", meeting_categories, fields)': 'handle_section_post(report, "meetings", meeting_categories, fields, request.form)',
        'handle_section_post(report, "extras", extra_categories, fields)': 'handle_section_post(report, "extras", extra_categories, fields, request.form)'
    }

    for k, v in replacements.items():
        content = content.replace(k, v)
        
    with open('routes/reports.py', 'w', encoding='utf-8') as f:
        f.write(content)
        
if __name__ == "__main__":
    fix()

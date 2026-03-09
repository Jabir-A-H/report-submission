import os

def extract():
    with open('routes/reports.py', 'r', encoding='utf-8') as f:
        lines: list[str] = f.readlines()

    # Create services directory
    os.makedirs('services', exist_ok=True)
    with open('services/__init__.py', 'w', encoding='utf-8') as f:
        pass

    # Ranges derived from outline
    playwright_pdf_range = (3175, 3726)
    city_pdf_range = (2686, 3173)
    get_reports_range = (3728, 3774)

    # 1. Services: pdf_generator.py
    with open('services/pdf_generator.py', 'w', encoding='utf-8') as f:
        f.write("import os\n")
        f.write("import tempfile\n")
        f.write("from flask import render_template, current_app\n")
        f.write("\n")
        f.writelines(lines[city_pdf_range[0]:city_pdf_range[1]])
        f.write("\n")
        f.writelines(lines[playwright_pdf_range[0]:playwright_pdf_range[1]])

    # 2. Services: report_aggregator.py
    with open('services/report_aggregator.py', 'w', encoding='utf-8') as f:
        f.write("from models import Report\n")
        f.write("from sqlalchemy.orm import joinedload\n")
        f.write("from flask import flash\n")
        f.write("\n")
        f.writelines(lines[get_reports_range[0]:get_reports_range[1]])

    # Remove the extracted blocks from reports.py
    # We delete from bottom to top to preserve line numbers
    remove_ranges = [
        get_reports_range,
        playwright_pdf_range,
        city_pdf_range,
    ]
    remove_ranges.sort(reverse=True)

    for start, end in remove_ranges:
        del lines[start:end]

    # Prepend the new imports to routes/reports.py
    import_stmt = (
        "from services.pdf_generator import generate_pdf_with_playwright, generate_city_report_pdf\n"
        "from services.report_aggregator import get_reports_for_period\n"
    )
    lines.insert(14, import_stmt) # Insert after other imports

    with open('routes/reports.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("Extraction successful.")

if __name__ == "__main__":
    extract()

import os
import tempfile
from flask import render_template, current_app

def generate_city_report_pdf(city_data, title, filename):
    """Generate PDF from aggregated city report data using Playwright"""
    try:
        from playwright.sync_api import sync_playwright
        from datetime import datetime
        import io

        print("[DEBUG] Starting PDF generation with Playwright...")

        # Create HTML content for the city report
        html_content = f"""
        <!DOCTYPE html>
        <html lang="bn">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title}</title>
            <link href="https://fonts.googleapis.com/css2?family=Tiro+Bangla:ital@0;1&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap" rel="stylesheet">
            <style>
                body {{
                    font-family: 'Tiro Bangla', sans-serif;
                    margin: 20px;
                    font-size: 11px;
                    line-height: 1.3;
                    color: #333;
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #3498db;
                    padding-bottom: 20px;
                }}
                .title {{
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #2c3e50;
                }}
                .subtitle {{
                    font-size: 16px;
                    color: #7f8c8d;
                    margin-bottom: 5px;
                }}
                .report-info {{
                    font-size: 12px;
                    color: #95a5a6;
                }}
                .section {{
                    margin-bottom: 25px;
                    page-break-inside: avoid;
                }}
                .section-title {{
                    font-size: 14px;
                    font-weight: bold;
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .header-grid {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                }}
                .header-item {{
                    padding: 8px 12px;
                    background: #f8f9fa;
                    border-left: 4px solid #3498db;
                    border-radius: 4px;
                }}
                .header-label {{
                    font-weight: bold;
                    color: #2c3e50;
                }}
                .header-value {{
                    color: #27ae60;
                    font-weight: 600;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 10px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border-radius: 6px;
                    overflow: hidden;
                }}
                th {{
                    background: linear-gradient(135deg, #34495e, #2c3e50);
                    color: white;
                    padding: 10px 6px;
                    text-align: center;
                    font-weight: bold;
                    border: 1px solid #2c3e50;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                    font-size: 9px;
                    line-height: 1.2;
                }}
                th.sub-header {{
                    background: linear-gradient(135deg, #5dade2, #3498db);
                    font-size: 8px;
                }}
                td {{
                    padding: 6px;
                    border: 1px solid #bdc3c7;
                    text-align: center;
                    background-color: #ffffff;
                    font-size: 9px;
                }}
                td.category {{
                    text-align: left;
                    font-weight: bold;
                    background-color: #ecf0f1;
                    color: #2c3e50;
                    padding-left: 10px;
                }}
                tr:nth-child(even) td {{
                    background-color: #f8f9fa;
                }}
                tr.totals {{
                    background: linear-gradient(135deg, #85c1e9, #5dade2) !important;
                    font-weight: bold;
                }}
                tr.totals td {{
                    background: linear-gradient(135deg, #85c1e9, #5dade2) !important;
                    color: #1a5490;
                    font-weight: bold;
                }}
                .number {{
                    font-family: 'Ubuntu', sans-serif;
                    text-align: center;
                    font-weight: 600;
                    color: #27ae60;
                }}
                .comments-box {{
                    background: #f8f9fa;
                    border: 2px solid #e9ecef;
                    border-radius: 6px;
                    padding: 15px;
                    min-height: 60px;
                    line-height: 1.5;
                }}
                .zone-list {{
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    padding: 15px;
                }}
                .zone-list ul {{
                    margin: 0;
                    padding-left: 20px;
                }}
                .zone-list li {{
                    margin-bottom: 5px;
                    color: #495057;
                }}
                .totals-info {{
                    text-align: right;
                    color: #6c757d;
                    font-size: 10px;
                    margin-top: 10px;
                    font-style: italic;
                }}
                @media print {{
                    body {{ margin: 10px; }}
                    .section {{ page-break-inside: avoid; }}
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">{title}</div>
                <div class="subtitle">সিটি রিপোর্ট সারসংক্ষেপ</div>
                <div class="report-info">রিপোর্টের ধরন: {city_data['report_type']} | বছর: {city_data['year']}</div>
            </div>

            <!-- Header Section -->
            <div class="section">
                <div class="section-title">📋 মূল তথ্য</div>
                <div class="header-grid">
        """

        # Add header data in grid format matching the web template
        header_items = [
            ("responsible_name", "দায়িত্বশীলের নাম"),
            ("thana", "থানা"),
            ("ward", "ওয়ার্ড"),
            ("total_muallima", "মোট মুয়াল্লিমা সংখ্যা"),
            ("muallima_increase", "মুয়াল্লিমা বৃদ্ধি"),
            ("muallima_decrease", "মুয়াল্লিমা হ্রাস"),
            ("certified_muallima", "প্রশিক্ষিত মুয়াল্লিমা"),
            ("certified_muallima_taking_classes", "প্রশিক্ষিত মুয়াল্লিমা (ক্লাস নিচ্ছেন)"),
            ("trained_muallima", "ট্রেইনিং প্রাপ্ত মুয়াল্লিমা"),
            ("trained_muallima_taking_classes", "ট্রেইনিং প্রাপ্ত মুয়াল্লিমা (ক্লাস নিচ্ছেন)"),
            ("total_unit", "মোট ইউনিট"),
            ("units_with_muallima", "মুয়াল্লিমা সহ ইউনিট"),
        ]

        for field, label in header_items:
            value = city_data["city_summary"].get(field)
            display_value = value if value is not None else "N/A"
            html_content += f"""
                    <div class="header-item">
                        <span class="header-label">{label}:</span>
                        <span class="header-value">{display_value}</span>
                    </div>
                """

        html_content += """
                </div>
            </div>

            <!-- Courses Section -->
            <div class="section">
                <div class="section-title">📚 গ্রুপ / কোর্স রিপোর্ট</div>
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2">বিভাগ/ধরন</th>
                            <th colspan="3">গ্রুপ / কোর্স</th>
                            <th rowspan="2">অধিবেশন সংখ্যা</th>
                            <th rowspan="2">শিক্ষার্থী সংখ্যা</th>
                            <th rowspan="2">উপস্থিতি সংখ্যা</th>
                            <th colspan="4">শিক্ষার্থী অবস্থান</th>
                            <th rowspan="2">কতজন নিয়ে সমাপ্ত</th>
                            <th rowspan="2">সহীহ শিখেছেন কতজন</th>
                        </tr>
                        <tr class="sub-header">
                            <th>সংখ্যা</th>
                            <th>বৃদ্ধি</th>
                            <th>ঘাটতি</th>
                            <th>বোর্ডে</th>
                            <th>কায়দায়</th>
                            <th>আমপারা</th>
                            <th>কুরআন</th>
                        </tr>
                    </thead>
                    <tbody>
        """

        for course in city_data["city_courses"]:
            html_content += f"""
                        <tr>
                            <td class="category">{course['category']}</td>
                            <td class="number">{course['number']}</td>
                            <td class="number">{course['increase']}</td>
                            <td class="number">{course['decrease']}</td>
                            <td class="number">{course['sessions']}</td>
                            <td class="number">{course['students']}</td>
                            <td class="number">{course['attendance']}</td>
                            <td class="number">{course['status_board']}</td>
                            <td class="number">{course['status_qayda']}</td>
                            <td class="number">{course['status_ampara']}</td>
                            <td class="number">{course['status_quran']}</td>
                            <td class="number">{course['completed']}</td>
                            <td class="number">{course['correctly_learned']}</td>
                        </tr>
            """

        html_content += """
                    </tbody>
                </table>
            </div>

            <!-- Organizational Section -->
            <div class="section">
                <div class="section-title">🏢 দাওয়াত ও সংগঠন</div>
                <table>
                    <thead>
                        <tr>
                            <th>দাওয়াত ও সংগঠন</th>
                            <th>সংখ্যা</th>
                            <th>বৃদ্ধি</th>
                            <th>পরিমাণ</th>
                            <th>মন্তব্য</th>
                        </tr>
                    </thead>
                    <tbody>
        """

        for org in city_data["city_organizational"]:
            html_content += f"""
                        <tr>
                            <td class="category">{org['category']}</td>
                            <td class="number">{org['number']}</td>
                            <td class="number">{org['increase']}</td>
                            <td class="number">{org['amount']}</td>
                            <td>{org['comments'] if org['comments'] is not None else ''}</td>
                        </tr>
            """

        html_content += """
                    </tbody>
                </table>
            </div>

            <!-- Personal Section -->
            <div class="section">
                <div class="section-title">ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন</div>
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2">ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন</th>
                            <th rowspan="2">কতজন শিখাচ্ছেন</th>
                            <th rowspan="2" style="border-right: 4px solid #3498db;">কতজনকে শিখাচ্ছেন</th>
                            <th rowspan="2">কতজন ওয়ালামাকে দাওয়াত দিয়েছেন</th>
                            <th colspan="4">দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে</th>
                        </tr>
                        <tr class="sub-header">
                            <th>সহযোগী হয়েছেন</th>
                            <th>সক্রিয় সহযোগী হয়েছেন</th>
                            <th>কর্মী হয়েছেন</th>
                            <th>রুকন হয়েছেন</th>
                        </tr>
                    </thead>
                    <tbody>
        """

        # Calculate totals for personal section
        teaching_total = sum(p["teaching"] for p in city_data["city_personal"])
        learning_total = sum(p["learning"] for p in city_data["city_personal"])
        olama_invited_total = sum(
            p["olama_invited"] for p in city_data["city_personal"]
        )
        became_shohojogi_total = sum(
            p["became_shohojogi"] for p in city_data["city_personal"]
        )
        became_sokrio_shohojogi_total = sum(
            p["became_sokrio_shohojogi"] for p in city_data["city_personal"]
        )
        became_kormi_total = sum(p["became_kormi"] for p in city_data["city_personal"])
        became_rukon_total = sum(p["became_rukon"] for p in city_data["city_personal"])

        for personal in city_data["city_personal"]:
            html_content += f"""
                        <tr>
                            <td class="category">{personal['category']}</td>
                            <td class="number">{personal['teaching']}</td>
                            <td class="number" style="border-right: 4px solid #3498db;">{personal['learning']}</td>
                            <td class="number">{personal['olama_invited']}</td>
                            <td class="number">{personal['became_shohojogi']}</td>
                            <td class="number">{personal['became_sokrio_shohojogi']}</td>
                            <td class="number">{personal['became_kormi']}</td>
                            <td class="number">{personal['became_rukon']}</td>
                        </tr>
            """

        # Add totals row for personal section
        html_content += f"""
                        <tr class="totals">
                            <td class="category">মোট</td>
                            <td class="number">{teaching_total}</td>
                            <td class="number" style="border-right: 4px solid #1a5490;">{learning_total}</td>
                            <td class="number">{olama_invited_total}</td>
                            <td class="number">{became_shohojogi_total}</td>
                            <td class="number">{became_sokrio_shohojogi_total}</td>
                            <td class="number">{became_kormi_total}</td>
                            <td class="number">{became_rukon_total}</td>
                        </tr>
        """

        html_content += """
                    </tbody>
                </table>
            </div>

            <!-- Meetings Section -->
            <div class="section">
                <div class="section-title">🤝 বৈঠকসমূহ</div>
                <table>
                    <thead>
                        <tr>
                            <th>বৈঠকসমূহ</th>
                            <th>মহানগরীর কতটি</th>
                            <th>মহানগরী গড় উপস্থিতি</th>
                            <th>থানা কতটি</th>
                            <th>থানা গড় উপস্থিতি</th>
                            <th>ওয়ার্ড কতটি</th>
                            <th>ওয়ার্ড গড় উপস্থিতি</th>
                            <th>মন্তব্য</th>
                        </tr>
                    </thead>
                    <tbody>
        """

        for meeting in city_data["city_meetings"]:
            html_content += f"""
                        <tr>
                            <td class="category">{meeting['category']}</td>
                            <td class="number">{meeting['city_count']}</td>
                            <td class="number">{meeting['city_avg_attendance']}</td>
                            <td class="number">{meeting['thana_count']}</td>
                            <td class="number">{meeting['thana_avg_attendance']}</td>
                            <td class="number">{meeting['ward_count']}</td>
                            <td class="number">{meeting['ward_avg_attendance']}</td>
                            <td>{meeting['comments'] if meeting['comments'] is not None else ''}</td>
                        </tr>
            """

        html_content += """
                    </tbody>
                </table>
            </div>

            <!-- Extras Section -->
            <div class="section">
                <div class="section-title">📊 মক্তব ও সফর রিপোর্ট</div>
                <table>
                    <thead>
                        <tr>
                            <th>বিষয়</th>
                            <th>সংখ্যা</th>
                        </tr>
                    </thead>
                    <tbody>
        """

        for extra in city_data["city_extras"]:
            html_content += f"""
                        <tr>
                            <td class="category">{extra['category']}</td>
                            <td class="number">{extra['number']}</td>
                        </tr>
            """

        html_content += f"""
                    </tbody>
                </table>
            </div>

            <!-- Comments Section -->
            <div class="section">
                <div class="section-title">💬 মন্তব্য</div>
                <div class="comments-box">
                    {city_data['city_comments']['comment'] if city_data['city_comments']['comment'] else 'কোনো মন্তব্য নেই'}
                </div>
            </div>
        """

        html_content += """
        </body>
        </html>
        """

        # Generate PDF using Playwright
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            # Set content and wait for fonts to load
            page.set_content(html_content)
            page.wait_for_load_state("networkidle")

            # Generate PDF with high quality settings
            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                margin={
                    "top": "0.5in",
                    "bottom": "0.5in",
                    "left": "0.5in",
                    "right": "0.5in",
                },
            )

            browser.close()

            # Return PDF as response
            output = io.BytesIO(pdf_bytes)
            output.seek(0)

            return send_file(
                output,
                as_attachment=True,
                download_name=filename,
                mimetype="application/pdf",
            )

    except Exception as e:
        print(f"[DEBUG] City Report PDF generation failed: {e}")
        traceback.print_exc()
        flash(f"PDF generation failed: {str(e)}", "error")
        return redirect(url_for("reports.city_report_page"))

def generate_pdf_with_playwright(reports, title, filename):
    """Generate PDF using Playwright for perfect Bengali support"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise Exception(
            "Playwright not installed. Install with: pip install playwright"
        )

    # Create comprehensive HTML content with all report sections
    html_content = f"""
    <!DOCTYPE html>
    <html lang="bn">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap');

            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}

            body {{
                font-family: 'Noto Sans Bengali', Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                margin: 15px;
            }}

            .header {{
                text-align: center;
                margin-bottom: 25px;
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
            }}

            .title {{
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
                color: #2c3e50;
            }}

            .subtitle {{
                font-size: 14px;
                color: #7f8c8d;
            }}

            .section {{
                margin-bottom: 20px;
                page-break-inside: avoid;
            }}

            .section-title {{
                font-size: 16px;
                font-weight: bold;
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
                padding: 8px 12px;
                margin-bottom: 10px;
                border-radius: 4px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }}

            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                font-size: 11px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}

            th {{
                background: linear-gradient(135deg, #34495e, #2c3e50);
                color: white;
                padding: 10px 8px;
                text-align: center;
                font-weight: bold;
                border: 1px solid #2c3e50;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }}

            td {{
                padding: 8px;
                border: 1px solid #bdc3c7;
                text-align: center;
                background-color: #ffffff;
            }}

            tr:nth-child(even) td {{
                background-color: #f8f9fa;
            }}

            tr:hover td {{
                background-color: #e8f4fd;
            }}

            .field-name {{
                font-weight: bold;
                background-color: #ecf0f1 !important;
                text-align: left;
                color: #2c3e50;
            }}

            .number-cell {{
                font-weight: bold;
                color: #27ae60;
            }}

            .timestamp {{
                margin-top: 20px;
                text-align: center;
                font-size: 10px;
                color: #7f8c8d;
                border-top: 1px solid #bdc3c7;
                padding-top: 10px;
            }}

            .page-break {{
                page-break-before: always;
            }}

            @media print {{
                body {{ margin: 10px; }}
                .section {{ page-break-inside: avoid; }}
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">{title}</div>
            <div class="subtitle">রিপোর্ট সারসংক্ষেপ</div>
        </div>
    """

    # Process each report
    for report_index, report in enumerate(reports):
        if report_index > 0:
            html_content += '<div class="page-break"></div>'

        # Header Section
        if report.header:
            html_content += """
            <div class="section">
                <div class="section-title">📋 হেডার তথ্য (Header Information)</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40%;">ক্ষেত্র</th>
                            <th style="width: 60%;">মান</th>
                        </tr>
                    </thead>
                    <tbody>"""

            header_data = [
                ("দায়িত্বশীলের নাম", report.header.responsible_name or ""),
                ("থানা", str(report.header.thana or "")),
                ("ওয়ার্ড", str(report.header.ward or "")),
                ("মোট মুয়াল্লিমা", str(report.header.total_muallima or 0)),
                ("মুয়াল্লিমা বৃদ্ধি", str(report.header.muallima_increase or 0)),
                ("মুয়াল্লিমা হ্রাস", str(report.header.muallima_decrease or 0)),
                ("সার্টিফিকেটধারী মুয়াল্লিমা", str(report.header.certified_muallima or 0)),
                (
                    "সার্টিফিকেটধারী মুয়াল্লিমা ক্লাস নিচ্ছেন",
                    str(report.header.certified_muallima_taking_classes or 0),
                ),
                ("প্রশিক্ষিত মুয়াল্লিমা", str(report.header.trained_muallima or 0)),
                (
                    "প্রশিক্ষিত মুয়াল্লিমা ক্লাস নিচ্ছেন",
                    str(report.header.trained_muallima_taking_classes or 0),
                ),
                ("মোট ইউনিট", str(report.header.total_unit or 0)),
                ("মুয়াল্লিমা সহ ইউনিট", str(report.header.units_with_muallima or 0)),
            ]

            for field, value in header_data:
                html_content += f"""
                        <tr>
                            <td class="field-name">{field}</td>
                            <td class="number-cell">{value}</td>
                        </tr>"""

            html_content += """
                    </tbody>
                </table>
            </div>"""

        # Courses Section
        if report.courses:
            html_content += """
            <div class="section">
                <div class="section-title">📚 গ্রুপ / কোর্স রিপোর্ট</div>
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2" style="width: 15%;">বিভাগ/ধরন</th>
                            <th colspan="3" style="border-bottom: 1px solid #bdc3c7;">গ্রুপ / কোর্স</th>
                            <th rowspan="2">অধিবেশন সংখ্যা</th>
                            <th rowspan="2">শিক্ষার্থী সংখ্যা</th>
                            <th rowspan="2">উপস্থিতি সংখ্যা</th>
                            <th colspan="4" style="border-bottom: 1px solid #bdc3c7;">শিক্ষার্থী অবস্থান</th>
                            <th rowspan="2">কতজন নিয়ে সমাপ্ত</th>
                            <th rowspan="2">সহীহ শিখেছেন কতজন</th>
                        </tr>
                        <tr>
                            <th>সংখ্যা</th>
                            <th>বৃদ্ধি</th>
                            <th>ঘাটতি</th>
                            <th>বোর্ডে</th>
                            <th>কায়দায়</th>
                            <th>আমপারা</th>
                            <th>কুরআন</th>
                        </tr>
                    </thead>
                    <tbody>"""

            for category in COURSE_CATEGORIES:
                # Find the course row for this category
                course_row = next(
                    (c for c in report.courses if c.category == category), None
                )

                html_content += f"""
                        <tr>
                            <td class="field-name">{category}</td>
                            <td class="number-cell">{course_row.number if course_row and course_row.number is not None else 0}</td>
                            <td class="number-cell">{course_row.increase if course_row and course_row.increase is not None else 0}</td>
                            <td class="number-cell">{course_row.decrease if course_row and course_row.decrease is not None else 0}</td>
                            <td class="number-cell">{course_row.sessions if course_row and course_row.sessions is not None else 0}</td>
                            <td class="number-cell">{course_row.students if course_row and course_row.students is not None else 0}</td>
                            <td class="number-cell">{course_row.attendance if course_row and course_row.attendance is not None else 0}</td>
                            <td class="number-cell">{course_row.status_board if course_row and course_row.status_board is not None else 0}</td>
                            <td class="number-cell">{course_row.status_qayda if course_row and course_row.status_qayda is not None else 0}</td>
                            <td class="number-cell">{course_row.status_ampara if course_row and course_row.status_ampara is not None else 0}</td>
                            <td class="number-cell">{course_row.status_quran if course_row and course_row.status_quran is not None else 0}</td>
                            <td class="number-cell">{course_row.completed if course_row and course_row.completed is not None else 0}</td>
                            <td class="number-cell">{course_row.correctly_learned if course_row and course_row.correctly_learned is not None else 0}</td>
                        </tr>"""

            html_content += """
                    </tbody>
                </table>
            </div>"""

        # Organizational Section
        if report.organizational:
            html_content += """
            <div class="section">
                <div class="section-title">🏢 দাওয়াত ও সংগঠন</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40%;">দাওয়াত ও সংগঠন</th>
                            <th>সংখ্যা</th>
                            <th>বৃদ্ধি</th>
                            <th>পরিমাণ</th>
                            <th>মন্তব্য</th>
                        </tr>
                    </thead>
                    <tbody>"""

            for category in ORG_CATEGORIES:
                # Find the organizational row for this category
                org_row = next(
                    (o for o in report.organizational if o.category == category), None
                )

                html_content += f"""
                        <tr>
                            <td class="field-name">{category}</td>
                            <td class="number-cell">{org_row.number if org_row and org_row.number is not None else 0}</td>
                            <td class="number-cell">{org_row.increase if org_row and org_row.increase is not None else 0}</td>
                            <td class="number-cell">{org_row.amount if org_row and org_row.amount is not None else 0}</td>
                            <td>{org_row.comments if org_row and org_row.comments is not None else ""}</td>
                        </tr>"""

            html_content += """
                    </tbody>
                </table>
            </div>"""

        # Personal Section
        if report.personal:
            html_content += """
            <div class="section">
                <div class="section-title">👤 ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন</div>
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2" style="width: 20%;">ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন</th>
                            <th rowspan="2">কতজন শিখাচ্ছেন</th>
                            <th rowspan="2">কতজনকে শিখাচ্ছেন</th>
                            <th rowspan="2">কতজন ওয়ালামাকে দাওয়াত দিয়েছেন</th>
                            <th colspan="4" style="border-bottom: 1px solid #bdc3c7;">দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে</th>
                        </tr>
                        <tr>
                            <th>সহযোগী হয়েছেন</th>
                            <th>সক্রিয় সহযোগী হয়েছেন</th>
                            <th>কর্মী হয়েছেন</th>
                            <th>রুকন হয়েছেন</th>
                        </tr>
                    </thead>
                    <tbody>"""

            # Calculate totals
            teaching_total = 0
            learning_total = 0
            olama_invited_total = 0
            became_shohojogi_total = 0
            became_sokrio_shohojogi_total = 0
            became_kormi_total = 0
            became_rukon_total = 0

            for category in PERSONAL_CATEGORIES:
                # Find the personal row for this category
                personal_row = next(
                    (p for p in report.personal if p.category == category), None
                )

                teaching_val = (
                    personal_row.teaching
                    if personal_row and personal_row.teaching is not None
                    else 0
                )
                learning_val = (
                    personal_row.learning
                    if personal_row and personal_row.learning is not None
                    else 0
                )
                olama_invited_val = (
                    personal_row.olama_invited
                    if personal_row and personal_row.olama_invited is not None
                    else 0
                )
                became_shohojogi_val = (
                    personal_row.became_shohojogi
                    if personal_row and personal_row.became_shohojogi is not None
                    else 0
                )
                became_sokrio_shohojogi_val = (
                    personal_row.became_sokrio_shohojogi
                    if personal_row and personal_row.became_sokrio_shohojogi is not None
                    else 0
                )
                became_kormi_val = (
                    personal_row.became_kormi
                    if personal_row and personal_row.became_kormi is not None
                    else 0
                )
                became_rukon_val = (
                    personal_row.became_rukon
                    if personal_row and personal_row.became_rukon is not None
                    else 0
                )

                # Add to totals
                teaching_total += teaching_val
                learning_total += learning_val
                olama_invited_total += olama_invited_val
                became_shohojogi_total += became_shohojogi_val
                became_sokrio_shohojogi_total += became_sokrio_shohojogi_val
                became_kormi_total += became_kormi_val
                became_rukon_total += became_rukon_val

                html_content += f"""
                        <tr>
                            <td class="field-name">{category}</td>
                            <td class="number-cell">{teaching_val}</td>
                            <td class="number-cell">{learning_val}</td>
                            <td class="number-cell">{olama_invited_val}</td>
                            <td class="number-cell">{became_shohojogi_val}</td>
                            <td class="number-cell">{became_sokrio_shohojogi_val}</td>
                            <td class="number-cell">{became_kormi_val}</td>
                            <td class="number-cell">{became_rukon_val}</td>
                        </tr>"""

            # Add totals row
            html_content += f"""
                        <tr style="background-color: #e0f2fe; font-weight: bold;">
                            <td class="field-name">মোট</td>
                            <td class="number-cell">{teaching_total}</td>
                            <td class="number-cell">{learning_total}</td>
                            <td class="number-cell">{olama_invited_total}</td>
                            <td class="number-cell">{became_shohojogi_total}</td>
                            <td class="number-cell">{became_sokrio_shohojogi_total}</td>
                            <td class="number-cell">{became_kormi_total}</td>
                            <td class="number-cell">{became_rukon_total}</td>
                        </tr>"""

            html_content += """
                    </tbody>
                </table>
            </div>"""

        # Meetings Section
        if report.meetings:
            html_content += """
            <div class="section">
                <div class="section-title">🤝 বৈঠকসমূহ</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 25%;">বৈঠকসমূহ</th>
                            <th>মহানগরীর কতটি</th>
                            <th>মহানগরী গড় উপস্থিতি</th>
                            <th>থানা কতটি</th>
                            <th>থানা গড় উপস্থিতি</th>
                            <th>ওয়ার্ড কতটি</th>
                            <th>ওয়ার্ড গড় উপস্থিতি</th>
                            <th>মন্তব্য</th>
                        </tr>
                    </thead>
                    <tbody>"""

            for category in MEETING_CATEGORIES:
                # Find the meeting row for this category
                meeting_row = next(
                    (m for m in report.meetings if m.category == category), None
                )

                html_content += f"""
                        <tr>
                            <td class="field-name">{category}</td>
                            <td class="number-cell">{meeting_row.city_count if meeting_row and meeting_row.city_count is not None else 0}</td>
                            <td class="number-cell">{meeting_row.city_avg_attendance if meeting_row and meeting_row.city_avg_attendance is not None else 0}</td>
                            <td class="number-cell">{meeting_row.thana_count if meeting_row and meeting_row.thana_count is not None else 0}</td>
                            <td class="number-cell">{meeting_row.thana_avg_attendance if meeting_row and meeting_row.thana_avg_attendance is not None else 0}</td>
                            <td class="number-cell">{meeting_row.ward_count if meeting_row and meeting_row.ward_count is not None else 0}</td>
                            <td class="number-cell">{meeting_row.ward_avg_attendance if meeting_row and meeting_row.ward_avg_attendance is not None else 0}</td>
                            <td>{meeting_row.comments if meeting_row and meeting_row.comments is not None else ""}</td>
                        </tr>"""

            html_content += """
                    </tbody>
                </table>
            </div>"""

        # Extras Section
        if report.extras:
            html_content += """
            <div class="section">
                <div class="section-title">➕ মক্তব ও সফর রিপোর্ট</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 70%;">বিষয়</th>
                            <th style="width: 30%;">সংখ্যা</th>
                        </tr>
                    </thead>
                    <tbody>"""

            for category in EXTRA_CATEGORIES:
                # Find the extras row for this category
                extra_row = next(
                    (e for e in report.extras if e.category == category), None
                )

                html_content += f"""
                        <tr>
                            <td class="field-name">{category}</td>
                            <td class="number-cell">{extra_row.number if extra_row and extra_row.number is not None else 0}</td>
                        </tr>"""

            html_content += """
                    </tbody>
                </table>
            </div>"""

        # Comments Section
        if report.comments and report.comments.comment:
            html_content += f"""
            <div class="section">
                <div class="section-title">💬 মন্তব্য</div>
                <table>
                    <tbody>
                        <tr>
                            <td style="padding: 15px; text-align: left; background-color: #f8f9fa;">
                                {report.comments.comment}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>"""

    # Add timestamp
    html_content += f"""
        <div class="timestamp">
            রিপোর্ট তৈরি হয়েছে: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | 
            সিস্টেম: রিপোর্ট সাবমিশন সিস্টেম
        </div>
    </body>
    </html>
    """

    # Generate PDF using Playwright
    print("[DEBUG] Starting Playwright PDF generation...")
    with sync_playwright() as p:
        browser = None
        try:
            print("[DEBUG] Launching browser...")
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            print("[DEBUG] Browser launched, setting content...")

            # Set content and wait for fonts to load
            page.set_content(html_content, wait_until="networkidle")
            print("[DEBUG] Content set, waiting for fonts...")

            # Wait a bit for Google Fonts to load
            page.wait_for_timeout(2000)
            print("[DEBUG] Generating PDF...")

            # Generate PDF with high quality settings
            pdf_bytes = page.pdf(
                format="A4",
                margin={
                    "top": "0.5in",
                    "right": "0.5in",
                    "bottom": "0.5in",
                    "left": "0.5in",
                },
                print_background=True,
                prefer_css_page_size=True,
            )

            print(f"[DEBUG] PDF generated successfully, size: {len(pdf_bytes)} bytes")
            browser.close()

            # Return as downloadable file
            import io

            output = io.BytesIO(pdf_bytes)
            print("[DEBUG] Returning PDF file...")
            return send_file(
                output,
                as_attachment=True,
                download_name=filename,
                mimetype="application/pdf",
            )

        except Exception as e:
            print(f"[DEBUG] Playwright PDF generation failed: {e}")
            traceback.print_exc()
            if browser:
                browser.close()
            raise

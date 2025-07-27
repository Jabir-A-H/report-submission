# Project Simplification Notes for Report Submission System

**Context:** The Report Submission System is a Flask-based web app for 20 -30 users (zone members and admins) to manage educational reports with seven sections (Header, Courses, Organizational, Personal, Meetings, Extras, Comments) across multiple periods (monthly, quarterly, half-yearly, nine-month, yearly). The app must support Bengali localization, mobile-first UI, and PDF and Excel exports. Given the small user base, the implementation should avoid overkill while meeting the UI requirements in TODO_4.md.

**Streamlined Approach:**
  - Keep app.py monolithic; avoid splitting into models.py, routes.py, etc., to reduce maintenance.
  - Use SQLite exclusively (instance/reports.db) for simplicity, as it’s sufficient for low concurrency.
  - Include minimal dependencies in requirements.txt
  - Use Tailwind CDN for styling instead of local build tools to avoid extra setup.
  - Store all templates in the default templates/ folder and static files in static/ for Flask auto-discovery.
  - Rely on Flask’s built-in session and authentication for user management; avoid external auth libraries unless needed.
  - Use Jinja2 template inheritance for consistent layout (base.html).
  - Implement client-side validation with HTML5 and minimal JS; keep JS logic simple and focused.
  - For Bengali localization, hardcode labels/messages in templates and JS, avoiding complex i18n libraries.
  - Use Flask’s send_file for exports; avoid heavy reporting libraries, but include pandas and reportlab for Excel/PDF generation.
  - Document all endpoints and UI flows in README for easy onboarding.
  - Implement autosave for report sections (AJAX + /autosave endpoint).
  - Add export/download endpoints using send_file for Excel/PDF.
  - Allow admin to change user zones from the admin panel.


# Report at a glance Logic

## Logic for different report types for both users and admins
- For মাসিক reports, include detailed data for the selected month.
- For ত্রৈমাসিক reports, aggregate data from the first three months of the year.
- For ষান্মাসিক reports, aggregate data from the first six months.
- For নয়-মাসিক reports, aggregate data from the first nine months.
- For বার্ষিক reports, include data from all twelve months.

## Logic for adding up zone reports to make the main report for admin
*Exact summary logic is to be added.*



# Report Types

## রিপোর্টের ধরণ (Report Types)
- মাসিক
- ত্রৈমাসিক
- ষান্মাসিক
- নয়-মাসিক
- বার্ষিক

**Selection Logic:**
- If মাসিক is selected, the user chooses a month from the dropdown.
- If ত্রৈমাসিক is selected, the summary covers জানুয়ারি, ফেব্রুয়ারি, and মার্চ.
- If ষান্মাসিক is selected, the summary covers জানুয়ারি–জুন.
- If নয়-মাসিক is selected, the summary covers জানুয়ারি–সেপ্টেম্বর.
- If বার্ষিক is selected, the summary covers all 12 months.

## Dropdown Menu for মাসিক Months (Bangla)
- জানুয়ারি
- ফেব্রুয়ারি
- মার্চ
- এপ্রিল
- মে
- জুন
- জুলাই
- আগস্ট
- সেপ্টেম্বর
- অক্টোবর
- নভেম্বর
- ডিসেম্বর

## Year Dropdown Menu
- 2025
- 2026


# Site Map (Index Format)

- **Login** (`/login`): User authentication page for registered users. Users can log in using either their email or their 3-digit user_id.
- **Register** (`/register`): New user registration form (requires admin approval). System auto-generates a 3-digit user_id for each user.
- **Report Dashboard** (`/`): Main landing page after login for both users and admins.
- **At a Glance** (`/report`): Aggregated/summary report for the selected period. Users see their zone's data; admins the city level report. Includes a download button (Excel/PDF). Available to both users (for their zone) and admins (for the city level report).
- **Report Sections**: Individual forms for each part of the report, matching the database schema:
  - Header Section (`/report/header`): Responsible person, location, and teacher statistics. *(ReportHeader)*
  - Courses Section (`/report/courses`): Educational program details, enrollment, and progress. *(ReportCourse)*
  - Organizational Section (`/report/organizational`): Membership and organizational activities. *(ReportOrganizational)*
  - Personal Section (`/report/personal`): Individual teaching activities. *(ReportPersonal)*
  - Meetings Section (`/report/meetings`): Meeting types and attendance data. *(ReportMeeting)*
  - Extras Section (`/report/extras`): Additional activities and programs. *(ReportExtra)*
  - Comments Section (`/report/comments`): Period-specific narrative comments. *(ReportComment)*
- **Admin Dashboard** (`/`): Admin dashboard provides an overview of all reports and user activities and links to different admin features in a card format. The dashboard view is determined by login role: users see the user dashboard, admins see the admin dashboard.
- **Users Management** (`/users`): Approve/reject users, assign/reassign zones, view user list and status.
- **Zones Management** (`/zones`): Create, delete, and manage zones.
- **All Zone Reports** (`/zone_reports`): View all zone reports filter by report type, month, and year.
- **Help** (`/help`): Help page with frequently asked questions and guidance.
- **Logout** (`/logout`): Log out of the system.


---

# Recommended Project Directory Structure

This structure is minimal and clean, suitable for a small Flask web app with the features described above:

```
report-submission/
│
├── app.py                  # Main Flask app entry point
├── requirements.txt        # Python dependencies
├── README.md               # Project overview
├── TODO.md                 # Database schema & enumerated values
├── TODO_2.md               # Features & workflow design
├── TODO_3.md               # Sitemap, navigation, and project structure
├── init_db.py              # Script to initialize the database
├── instance/
│   └── reports.db          # SQLite database (ignored in VCS)
│
├── static/                 # Static files (CSS, JS, images)
│   ├── styles.css
│   ├── scripts.js
│   └── modern-animations.css
│
├── templates/              # Jinja2 HTML templates
│   ├── base.html           # Base template (layout)
│   ├── login.html
│   ├── register.html
│   ├── report_dashboard.html
│   ├── report.html         # At a glance/summary
│   ├── admin_users.html
│   ├── admin_reports.html
│   ├── admin_zones.html
│   ├── admin_fields.html
│   ├── form.html           # Generic form template
│   └── sections/           # Section partials
│       ├── header.html
│       ├── courses.html
│       ├── organizational.html
│       ├── personal.html
│       ├── meetings.html
│       ├── extras.html
│       └── comments.html
│
├── project_idea_extras/    # Optional: brainstorming, extra docs, data
│
└── __pycache__/            # Python bytecode (ignored in VCS)
```

**Notes:**
- All admin/user logic can be handled in `app.py`.
- For a very small user base, keep things simple: avoid unnecessary microservices or over-engineering.
- Use `instance/` for the database and secrets (Flask convention).
- Place all documentation in the root for easy access.
- Static and template folders follow Flask defaults.

*This file serves as the main documentation for navigation, report workflow, summary logic, and project structure. Section and table names are aligned with the current database schema.*

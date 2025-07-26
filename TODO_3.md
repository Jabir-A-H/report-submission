
# Report Type

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
  - **Period Selector** (in dashboard): Choose report type, month (if applicable), and year. After selection, the dashboard displays navigation to all report sections and the summary for that period. (The selector is not always at the top; it appears in the dashboard for both users and admins.)
- **At a Glance / Summary Report** (`/report`): Aggregated/summary report for the selected period. Users see their zone's data; admins see all zones (individual and aggregated). Includes a download button (Excel/PDF). Available to both users (for their zone) and admins (for all zones).
- **Report Sections**: Individual forms for each part of the report, matching the database schema:
  - Header Section (`/report/header`): Responsible person, location, and teacher statistics. *(ReportHeader)*
  - Courses Section (`/report/courses`): Educational program details, enrollment, and progress. *(ReportCourse)*
  - Organizational Section (`/report/organizational`): Membership and organizational activities. *(ReportOrganizational)*
  - Personal Section (`/report/personal`): Individual teaching activities. *(ReportPersonal)*
  - Meetings Section (`/report/meetings`): Meeting types and attendance data. *(ReportMeeting)*
  - Extras Section (`/report/extras`): Additional activities and programs. *(ReportExtra)*
  - Comments Section (`/report/comments`): Period-specific narrative comments. *(ReportComment)*
- **Admin Dashboard** (`/`): Admin dashboard provides an overview of all reports and user activities. The dashboard view is determined by login role: users see the user dashboard, admins see the admin dashboard.
- **Users Management** (`/users`): Approve/reject users, view user list and status.
- **Zones Management** (`/zones`): Create, delete, and manage zones.
- **Reports Management** (`/zone_reports`): View, filter, and edit all reports.
- **Fields Management** (`/fields`): Admins can add or remove rows in categorized data tables (e.g., ReportOrganizational, ReportMeeting, etc.) to accommodate new categories or data points.
- **Help / FAQ** (`/help`): Help page with frequently asked questions and guidance.
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

# Summary Report Conditions or Summarization Logic
- For মাসিক reports, include detailed data for the selected month.
- For ত্রৈমাসিক reports, aggregate data from the first three months of the year.
- For ষান্মাসিক reports, aggregate data from the first six months.
- For নয়-মাসিক reports, aggregate data from the first nine months.
- For বার্ষিক reports, include data from all twelve months.

*Exact summary logic is to be added.*

4. Features
Implement autosave for report sections (AJAX + /autosave endpoint).
Add export/download endpoints using send_file for Excel/PDF.
Allow admin to change user zones from the admin panel.
Add user profile and password change functionality.
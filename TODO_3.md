
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

- **Login** (`/login`): User authentication page for registered users.
- **Register** (`/register`): New user registration form (requires admin approval).
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
- **Admin Management** (`/admin`): Admin landing page with management tools for users, zones, reports, and editable database fields.
  - Users Management (`/admin/users`): Approve/reject users, view user list and status.
  - Zones Management (`/admin/zones`): Create, delete, and manage zones.
  - Reports Management (`/admin/reports`): View, filter, and edit all reports.
  - Fields Management (`/admin/fields`): Admins can add or remove rows in categorized data tables (e.g., ReportOrganizational, ReportMeeting, etc.) to accommodate new categories or data points.
- **Help / FAQ** (`/help`): Help page with frequently asked questions and guidance.
- **Logout** (`/logout`): Log out of the system.

*This file serves as the main documentation for navigation, report workflow, and summary logic. Section and table names are aligned with the current database schema.*

# Summary Report Conditions or Summarization Logic
- For মাসিক reports, include detailed data for the selected month.
- For ত্রৈমাসিক reports, aggregate data from the first three months of the year.
- For ষান্মাসিক reports, aggregate data from the first six months.
- For নয়-মাসিক reports, aggregate data from the first nine months.
- For বার্ষিক reports, include data from all twelve months.

*Exact summary logic is to be added.*


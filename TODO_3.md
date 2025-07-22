# period fixing, instead of calling it period, call it report type. make the datababse table attributes reflect this change.
## রিপোর্টের ধরণ: 
মাসিক
ত্রৈমাসিক
ষান্মাসিক
নয়-মাসিক
বার্ষিক
    If মাসিক is selected, then the report type will be মাসিক and the month will be selected from the dropdown.
    If ত্রৈমাসিক is selected, then the report type will be ত্রৈমাসিক and the month will be the summary report of month জানুয়ারি, ফেব্রুয়ারি, and মার্চ.
    If ষান্মাসিক is selected, then the report type will be ষান্মাসিক and the month will be the summary report of month জানুয়ারি, ফেব্রুয়ারি, মার্চ, এপ্রিল, মে, and জুন.
    If নয়-মাসিক is selected, then the report type will be নয়-মাসিক and the month will be the summary report of month জানুয়ারি, ফেব্রুয়ারি, মার্চ, এপ্রিল, মে, জুন, জুলাই, আগস্ট, and সেপ্টেম্বর.
    If বার্ষিক is selected, then the report type will be বার্ষিক and the month will be the summary report of all 12 months.

## Dropdown menu for the মাসিক months in Bangla:
জানুয়ারি
ফেব্রুয়ারি
মার্চ
এপ্রিল
মে
জুন
জুলাই
আগস্ট
সেপ্টেম্বর
অক্টোবর
নভেম্বর
ডিসেম্বর

## Year Dropdown Menu:
- 2025
- 2026



# Site Map (Index Format)

- **Login** (`/login`): User authentication page for registered users.
- **Register** (`/register`): New user registration form (requires admin approval).
- **Report Dashboard** (`/`): Main user landing page after login. Lets users select the active period and shows navigation to all report sections and summary.
  - **Period Selector** (always visible at top): Choose month, year, and period type to view/edit reports.
- **At a Glance / Summary Report** (`/report`): Aggregated/summary report for the selected period. Users see their zone's data; admins see all zones. Includes a download button (Excel/PDF).
- **Report Sections**: Individual forms for each part of the report.
  - Header Section (`/report/header`): Responsible person, location, and teacher statistics.
  - Courses Section (`/report/courses`): Educational program details, enrollment, and progress.
  - Organizational Section (`/report/organizational`): Membership and organizational activities.
  - Personal Section (`/report/personal`): Individual teaching activities.
  - Meetings Section (`/report/meetings`): Meeting types and attendance data.
  - Extras Section (`/report/extras`): Additional activities and programs.
  - Comments Section (`/report/comments`): Period-specific narrative comments.
- **Admin Dashboard** (`/admin`): Admin landing page with management tools.
  - Users Management (`/admin/users`): Approve/reject users, view user list and status.
  - Zones Management (`/admin/zones`): Create, delete, and manage zones.
  - Reports Management (`/admin/reports`): View, filter, and edit all reports.
- **Help / FAQ** (`/help`): Help page with frequently asked questions and guidance.
- **Logout** (`/logout`): Log out of the system.

# Summary report conditions or summarization logic
- For মাসিক reports, include detailed data for the selected month.
- For ত্রৈমাসিক reports, aggregate data from the first three months of the year.
- For ষান্মাসিক reports, aggregate data from the first six months.
- For নয়-মাসিক reports, aggregate data from the first nine months.
- For বার্ষিক reports, include data from all twelve months.

more to be added


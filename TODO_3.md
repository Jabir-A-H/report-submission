Need to update any tables in database?
period fixing, call it report type

# 📄 Site Map (Index Format)

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




# Report Submission Website: Feature & Workflow Design Document

---

## Table of Contents
1. Overview
2. User Roles
3. Authentication & Registration
4. Zones Management
5. Report Workflow & UI/UX
6. Feature Details
    - Admin Features
    - User Features
    - Data Export
7. Data Model (Entity-Relationship Overview)
8. Enumerated/Predefined Values
9. Security & Validation
10. Not Included / Out of Scope
11. User Stories (Examples)
12. Technical Stack
13. Deployment
14. Maintenance

---

## 1. Overview
A web application for monthly, quarterly, half-yearly, and yearly report submission, review, and aggregation for an educational/admin organization. The system supports user registration, authentication, multi-section report entry, autosave, admin review, and data export.

---

## 2. User Roles
- **User**: Regular member who submits reports for their assigned zone.
- **Admin**: Approves users, manages zones, reviews and edits all reports, exports data.

---


## 3. Authentication & Registration
### Registration Workflow
1. User visits the registration page (`/register`).
2. User fills out:
    - Name (text, required)
    - Mobile number (11 digits, starts with 01, required, unique)
    - Email (required, unique)
    - Password (required, min 8 chars, masked)
    - Zone (dropdown, required, populated from admin-managed zones)
3. On submit:
    - Server validates all fields (format, uniqueness, required)
    - If valid, user is created with `active=False` (pending approval)
    - User sees a message: "Registration successful! Await admin approval."
    - If invalid, user sees error messages inline for each field
4. Admin receives notification (future: email/SMS) or sees pending users in admin panel

### Approval Workflow
1. Admin logs in and visits `/admin/users`
2. Admin sees a list of pending users with approve/reject buttons
3. On approval, user becomes `active=True` and can log in
4. On rejection, user is deleted (optional: send notification)

### Login Workflow
1. User visits `/login`
2. User enters identifier (email, mobile, or user ID) and password
3. System checks:
    - If user exists and is active
    - If password matches (hashed check)
4. On success:
    - If admin, redirect to `/master_report`
    - If user, redirect to `/report_dashboard`
5. On failure, show error: "Invalid credentials or not approved"


---


## 4. Zones Management
### Admin Zone Management Workflow
1. Admin visits `/admin/users`
2. Admin sees a list of all zones and users
3. Admin can:
    - Add a new zone (unique name, form at top or modal)
    - Delete a zone (only if no users are assigned; else error shown)
    - See which users are assigned to each zone
4. When a zone is deleted, it is removed from the dropdown for registration and report assignment
5. All zone changes are reflected immediately in registration and report forms


---



## 5. Report Workflow & UI/UX

### Report Structure & Workflow
- User selects period (month/year) on dashboard or section page
- Period types: Monthly, 1st quarterly, half-yearly, 2nd quarterly, yearly
- User logs in and is redirected to `/report_dashboard` for the current period.
- Dashboard displays all report sections as cards/links, each with:
    - Section name, icon, completion status (complete/incomplete)
    - Link to fill/edit that section
- User can click any section in any order.
- Each section is a separate page/form:
    - Header: Responsible person, thana, ward, muallima/unit stats
    - Courses: Table input, add/remove rows, select category, enter numbers
    - Organizational: Table input, add/remove rows, select category, enter numbers/comments
    - Personal: Table input, add/remove rows, select category, enter numbers
    - Meetings: Table input, add/remove rows, select category, enter counts/attendance/comments
    - Extras: Table input, add/remove rows, select category, enter numbers
    - Comments: Textareas for each period type
- Each form autosaves on field change (AJAX to `/autosave` with section and data).
- User can navigate between sections at any time; progress is saved.
- When all required sections are complete, dashboard shows "Ready for review" or similar.

#### Report Locking & Editing
- When user submits all sections, admin can review and lock the report.
- Locked reports cannot be edited by user unless admin unlocks.
- Users can always view their own and their zone's reports (read-only if locked).

#### Admin Review Workflow
- Admin visits `/admin/reports` to see all submitted reports.
- Admin can filter/sort by period, zone, user.
- Admin can view/edit any section of any report.
- Admin can lock/unlock reports, add comments, and export data.

### UI/UX (Detailed)
- Responsive, modern UI (Tailwind CSS, mobile-friendly)
- Bengali language support throughout (all labels, messages, and templates)
- Clear error/success messages (inline and global alerts)
- Section navigation from dashboard (cards/links, icons, completion status)
- Consistent layout for all forms and tables
- Loading indicators for autosave and data fetches
- Accessible design (keyboard navigation)

---




## 7. Data Model (Entity-Relationship Overview)
> **Note:** For all detailed table structures, field definitions, and enumerated/predefined values, refer to `TODO.md` (section 3, Table Structures). This file only summarizes the entity relationships and does not repeat detailed schema. Always check `TODO.md` for the authoritative, up-to-date schema and categories.

- **User**: see detailed table structure in TODO.md (section 3, Table Structures)
- **Zone**: see detailed table structure in TODO.md (section 3, Table Structures)
- **Report**: see detailed table structure in TODO.md (section 3, Table Structures)
- **ReportHeader**: see detailed table structure in TODO.md (section 3, Table Structures)
- **ReportCourse**: see detailed table structure in TODO.md (section 3, Table Structures)
- **ReportOrganizational**: see detailed table structure in TODO.md (section 3, Table Structures)
- **ReportPersonal**: see detailed table structure in TODO.md (section 3, Table Structures)
- **ReportMeeting**: see detailed table structure in TODO.md (section 3, Table Structures)
- **ReportExtra**: see detailed table structure in TODO.md (section 3, Table Structures)
- **ReportComment**: see detailed table structure in TODO.md (section 3, Table Structures)

### Data Integrity & Validation
- All foreign keys are enforced.
- Unique constraints on email, zone name.
- All numeric fields validated for type.
- All numeric fields are integers; the reports have no float/fraction numbers.


## 8. Enumerated/Predefined Values
See `TODO.md` for the full list of categories, period types, and admin-editable values.

---


## 7. Admin Features (Detailed)
- Approve/reject users (see pending list, approve/reject with one click)
- Add new or delete old zones
- View all reports (table with filters for report of any period of any zone)
- Edit any report section (open any user's report, edit any section, save changes)
- Export master report (Excel/PDF, select period, zone, user for export)


---


## 8. User Features (Detailed)
- Register and await approval (see status on login page if not yet approved)
- Login with email or user ID
- View dashboard with sections. each section is linked to a different page.
- Fill/edit any report section in any order (navigate freely, no forced order as each section has its own page)
- Autosave on all section forms (no data loss, instant feedback)
- View submitted reports (past reports page, can view all previous reports for their zone)


---


## 9. Data Export (Detailed)
- Admin can export aggregated report data as Excel or PDF
- Export includes:
    - All header fields, totals
    - Optionally, breakdowns by zone, user, or period
- Export is available from the admin dashboard and report review pages
- Download links are provided after export is generated
(exact format for the summary report made from users report will be given later.)


---


## 10. Security & Validation (Detailed)
- Passwords are hashed (never stored in plain text)
- Only active users can log in (pending users are blocked)
- Only admin can access admin features (role check on all admin routes)
- Users can only edit/view their own reports (except admin, who can edit all)
- All forms validate required fields and data types (server and client side)
- 


---



## 11. UI/UX (Detailed)
- Responsive, modern UI (Tailwind CSS, mobile-friendly)
- Bengali language support throughout (all labels, messages, and templates)
- Clear error/success messages (inline and global alerts)
- Section navigation from dashboard (cards/links, icons, completion status)
- Consistent layout for all forms and tables
- Loading indicators for autosave and data fetches
- Accessible design (keyboard navigation)

---



## 12. Features
- Customizable categories (admin-editable, add/remove categories for each section)
- User profile management (edit name, mobile, email, password)


---


## 13. Not Included / Out of Scope
- Tracking changes history
- Audit trail
- Progress/completion indicators for each section
- Multi-language support (other than Bengali/English)
- Real-time collaborative editing
- API for mobile app integration
- Advanced data analytics/visualization
- email/SMS Notification system ( for approvals, reminders)
- no report lock feature
- View user edit history and report submission completion stats



---


## 14. User Stories (Examples)
- As a user, I can register and submit my monthly report in sections, saving as I go.
- As a user, I can see which sections of my report are complete and which need attention.
- As a user, I can view all my previous reports and their lock status.
- As a user, I can request admin to unlock a report for further editing.
- As an admin, I can approve users, manage zones, and export all report data.
- As an admin, I can review and edit any report in the system.
- As an admin, I can lock/unlock reports and add comments for users.


---


## 15. Technical Stack
- Python, Flask, SQLAlchemy, Flask-Login
- SQLite (default), can be upgraded to PostgreSQL/MySQL
- Jinja2 templates, Tailwind CSS
- Pandas, ReportLab for export


---





---


## 14. Maintenance
- Codebase uses `# type: ignore` for SQLAlchemy dynamic attributes to reduce editor noise
- All models, routes, and templates are modular and maintainable
- Automated tests for core workflows (pytest, unittest)
- Linting and formatting enforced (black, flake8)
- Documentation updated with every major feature

---

*This document should be updated as features are added or changed.*

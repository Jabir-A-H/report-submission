
# Report Submission System: Features & Workflow Design

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [User Management](#2-user-management)
3. [Report Workflow](#3-report-workflow)
4. [Admin Features](#4-admin-features)
5. [User Features](#5-user-features)
6. [UI/UX Design](#6-uiux-design)
7. [Security & Validation](#7-security--validation)
8. [Technical Implementation](#8-technical-implementation)
9. [User Stories](#9-user-stories)
10. [System Limitations](#10-system-limitations)

---


## 1. System Overview

### Purpose
A web application for educational organization report submission, review, and aggregation, supporting multiple reporting periods and organizational zones.

### Key Features
- **Flexible report types:** Supports মাসিক (monthly), ত্রৈমাসিক (quarterly), ষান্মাসিক (half-yearly), নয়-মাসিক (nine-month), and বার্ষিক (yearly) reports, with dynamic summarization and dropdown selection for month/year as appropriate.
- **Zone-based organization:** Users assigned to specific zones.
- **Section-based reports:** 7 distinct sections per report.
- **Auto-save functionality:** No data loss during form completion.
- **Admin oversight:** Complete system management and data export.
- **Bengali language support:** Full localization for the target audience.

### User Roles
- **User:** Zone members who submit and edit reports.
- **Admin:** System managers who approve users, manage zones, and oversee all reports.

---


## 2. User Management

### Registration Process
1. **Initial Registration** (`/register`)
   - User provides: Name, Email, Password, Zone selection
   - System auto-generates a 3-digit user_id (e.g., 001, 002, ...) for each user
   - Server validates: Format, uniqueness, required fields
   - Account created with `active=False` (pending approval)
   - User receives confirmation: *Registration successful! Await admin approval.*

2. **Admin Approval** (`/admin/users`)
   - Admin reviews pending registrations
   - Approve: User becomes `active=True`, can log in
   - Reject: Account deleted

3. **Login Process** (`/login`)
   - User enters: Email **or** 3-digit User ID and password
   - System validates: User exists (by email or user_id), is active, password matches
   - Redirect: Admin → `/admin/dashboard`, User → `/report_dashboard`

### Zone Management
- **Admin Controls** (`/admin/zones`):
  - Add new zones (unique names)
  - Delete zones (only if no assigned users)
  - View zone assignments
- **User Assignment:** Each user belongs to exactly one zone.
- **Report Association:** Each zone has one report per period.

---


## 3. Report Workflow

### Report Structure
Each report contains 7 sections accessible from the dashboard:

1. **Header:** Responsible person, location, teacher statistics
2. **Courses:** Educational programs with enrollment and progress data
3. **Organizational:** Membership and organizational activities
4. **Personal:** Individual teaching activities
5. **Meetings:** Various meeting types and attendance
6. **Extras:** Additional activities and programs
7. **Comments:** Period-specific narrative comments

### User Workflow
1. **Report Type Selection:** Choose report type (মাসিক, ত্রৈমাসিক, ষান্মাসিক, নয়-মাসিক, বার্ষিক) and year. If মাসিক is selected, also choose month. Dropdowns are dynamically populated and validated.
2. **Dashboard Navigation** (`/`):
   - View all sections as cards with completion status
   - Navigate to any section in any order
   - See overall at-a-glance report, downloadable by users
3. **Section Editing:**
   - Individual forms for each section with auto-save
   - Save button on each section updates completion status by checking if all required fields are filled (completion is determined dynamically; no extra field is stored in the database)
4. **Flexible Navigation:** Switch between sections without losing progress
5. **Filter Controls:** By period, zone, or combinations
6. **Data Export:**
   - **Export Options:** Excel and PDF formats
   - **Filter Controls:** By report type, year, month (if applicable), zone, or combinations
   - **Aggregated Reports:** Summarization logic for each report type is detailed in `TODO_3.md`.
   - **Download Management:** Generated file is downloaded directly to the user's device (not stored on the server)
7. **Historical Access:** View and reference previous period reports

### Auto-save System
- **Trigger:** Every field change via AJAX
- **Feedback:** Visual indicators for save status
- **Recovery:** No data loss on navigation or browser issues


## 4. Admin Features

### User Administration
- **Pending Approvals:** Review and approve/reject new registrations
- **User Management:** View all users, their zones, and activity status
- **Zone Management:** Create, delete, and manage organizational zones

### Report Oversight
- **View All Reports** (`/admin/reports`):
  - Filter by period, zone, or both
  - Access any report section for editing
- **Edit Capabilities:**
  - Modify any report section system-wide
  - Add/remove rows for categorized data
- **Data Validation:** Ensure report completeness and accuracy

---


## 5. User Features

### Report Management
- **Dashboard Overview:** Section completion status and navigation
- **Multi-section Editing:** Access any section independently
- **Progress Tracking:** Visual indicators for incomplete sections
- **Historical Access:** View and reference previous period reports

### Data Entry
- **Form Validation:** Client and server-side validation
- **Auto-save:** Continuous progress saving
- **Completion Status:** Save button on each section updates completion status, ensuring all required fields are filled



## 6. UI/UX Design

### Design Principles
- **Responsive:** Mobile-first design with Tailwind CSS
- **Accessible:** Keyboard navigation and screen reader support
- **Bengali Support:** Complete localization for all text and messages
- **Intuitive Navigation:** Clear paths between sections and features

### User Interface Elements
- **Dashboard Cards:** Visual section overview
- **Dynamic Forms:** Add/remove table rows by admin only for flexible data entry
- **Loading Indicators:** Clear feedback for auto-save and data operations
- **Error Handling:** Inline validation messages and global alerts
- **Consistent Layout:** Unified header, navigation, and content structure

### User Experience Flow
- **Registration:** Simple form with clear validation feedback
- **Login:** Flexible identifier acceptance (email/ID)
- **Dashboard:** Immediate overview of report status and next actions
- **Section Editing:** Focused forms with persistent navigation options
- **Admin Interface:** Comprehensive but organized management tools



## 7. Security & Validation

### Authentication & Authorization
- **Password Security:** Bcrypt hashing, minimum 8 characters
- **Session Management:** Flask-Login for secure session handling
- **Role-based Access:** Strict separation of user and admin capabilities
- **Zone Restrictions:** Users limited to their assigned zone data

### Data Validation
- **Input Sanitization:** Server-side validation for all form inputs
- **Type Checking:** Numeric fields validated as integers
- **Business Rules:** Logical constraints on numeric relationships

### Security Measures
- **SQL Injection Prevention:** SQLAlchemy ORM parameter binding
- **CSRF Protection:** Token validation on all state-changing operations
- **Access Control:** Route-level permission checking
- **Data Integrity:** Foreign key constraints and referential integrity

---


## 8. Technical Implementation

### Technology Stack
- **Backend:** Python 3.8+, Flask, SQLAlchemy, Flask-Login
- **Database:** SQLite (development), PostgreSQL/MySQL (production)
- **Frontend:** Jinja2 templates, Tailwind CSS, JavaScript (AJAX)
- **Export:** Pandas for data processing, ReportLab for PDF generation
- **Testing:** pytest for automated testing, coverage reporting

### Development Standards
- **Code Quality:** Black formatting, flake8 linting
- **Type Hints:** SQLAlchemy dynamic attributes with `# type: ignore`
- **Documentation:** Comprehensive inline documentation
- **Modular Design:** Separated models, routes, templates, and utilities

---


## 9. User Stories

### User Registration & Authentication
- **As a new user**, I can register with my details and await admin approval.
- **As a registered user**, I can log in with my email or user ID.
- **As an admin**, I can approve or reject pending user registrations.

### Report Management
- **As a user**, I can create and edit reports for my zone in any section order.
- **As a user**, I can see which report sections are complete or need attention.
- **As a user**, I can view my zone's historical reports for reference.
- **As a user**, I can download my zone's completed report in PDF or Excel format.
- **As an admin**, I can view, edit, and export any report in the system.

### System Administration
- **As an admin**, I can create and manage organizational zones.
- **As an admin**, I can assign users to zones and manage their access.
- **As an admin**, I can export aggregated report data in multiple formats.

---


## 10. System Limitations

### Not Used / Excluded Features
- **Mobile Number:** Not used for registration or login; not stored in the user table.
- **Last Edited User Tracking:** The system does not track which user last edited a report.
- **Change Tracking:** No audit trail or edit history.
- **Real-time Collaboration:** No simultaneous multi-user editing.
- **Advanced Analytics:** No built-in charts or statistical analysis.
- **Notification System:** No email/SMS alerts for approvals or deadlines.
- **Mobile App:** Web-only interface, no native mobile application.
- **Multi-language:** Bengali/English only, no additional language support.
- **Report Locking:** No mechanism to prevent editing of submitted reports.
- **Version Control:** No backup or rollback capabilities for report data.

### Design Decisions
- **Simplicity Over Features:** Focus on core functionality without complexity.
- **Single Zone Assignment:** Users belong to one zone only.
- **Collaborative Reports:** One report per zone per period, edited by all zone users.
- **Admin Override:** Admins can edit any data without restrictions.
- **Dynamic Tables:** Add/remove rows for categorized data by admin only.

---

*For detailed database schema and enumerated values, refer to `TODO.md`.*
More details on how to make the summary report from each zone will be provided later in the `TODO_3.md` file.

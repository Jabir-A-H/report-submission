# Report Submission System: Database Schema & Data Model

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Database Tables](#2-database-tables)
3. [Enumerated Values](#3-enumerated-values)
4. [Data Integrity & Constraints](#4-data-integrity--constraints)

---

## 1. System Overview

### Core Workflow
- **Multi-section reports**: Each report contains 7 sections (Header, Courses, Organizational, Personal, Meetings, Extras, Comments)
- **Flexible report types**: Supports মাসিক (monthly), ত্রৈমাসিক (quarterly), ষান্মাসিক (half-yearly), নয়-মাসিক (nine-month), and বার্ষিক (yearly) reports, with dynamic summarization and dropdown selection for month/year as appropriate
- **Zone-based structure**: Each zone submits one report per period; all zone users collaborate on the same report
- **Flexible navigation**: Users can edit any section in any order from the dashboard
- **Auto-save functionality**: All forms auto-save on field changes
- **Role-based access**: Users edit their zone's reports; Admins manage all reports and system settings

---

## 2. Database Tables

### User
| Field    | Type    | Constraints             | Description     |
| -------- | ------- | ----------------------- | --------------- |
| id       | Integer | PRIMARY KEY             | Internal DB ID  |
| user_id  | String  | UNIQUE, NOT NULL, 3-digit | Login ID (3-digit, auto-increment, used for login) |
| name     | String  | NOT NULL                | Full name       |
| email    | String  | UNIQUE, NOT NULL        | Email address   |
| password | String  | NOT NULL                | Hashed password |
| role     | String  | CHECK (user/admin)      | User role       |
| active   | Boolean | DEFAULT False           | Approval status |
| zone_id  | Integer | FK to Zone.id, NOT NULL | Assigned zone   |

### Zone
| Field | Type    | Constraints      | Description |
| ----- | ------- | ---------------- | ----------- |
| id    | Integer | PRIMARY KEY      | Zone ID     |
| name  | String  | UNIQUE, NOT NULL | Zone name   |

### Report
| Field       | Type     | Constraints                | Description                              |
| ----------- | -------- | -------------------------- | ---------------------------------------- |
| id          | Integer  | PRIMARY KEY                | Report ID                                |
| zone_id     | Integer  | FK to Zone.id, NOT NULL    | Report zone                              |
| month       | Integer  | NOT NULL, CHECK (1-12)     | Reporting month (used only for মাসিক type) |
| year        | Integer  | NOT NULL                   | Reporting year                           |
| report_type | String   | NOT NULL, CHECK (see enum) | Report type (see below)                  |
| created_at  | DateTime | DEFAULT CURRENT_TIMESTAMP  | Creation timestamp                       |
| updated_at  | DateTime | DEFAULT CURRENT_TIMESTAMP  | Last update timestamp                    |

### ReportHeader
| Field                             | Type    | Constraints               | Description                  |
| --------------------------------- | ------- | ------------------------- | ---------------------------- |
| id                                | Integer | PRIMARY KEY               | Header ID                    |
| report_id                         | Integer | FK to Report.id, NOT NULL | Parent report                |
| responsible_name                  | String  | NOT NULL                  | Responsible person name      |
| thana                             | String  | NOT NULL                  | Thana name                   |
| ward                              | Integer | NOT NULL                  | Ward number                  |
| total_muallima                    | Integer | NOT NULL, DEFAULT 0       | Total teachers               |
| muallima_increase                 | Integer | NOT NULL, DEFAULT 0       | New teachers                 |
| muallima_decrease                 | Integer | NOT NULL, DEFAULT 0       | Teachers left                |
| certified_muallima                | Integer | NOT NULL, DEFAULT 0       | Certified teachers           |
| certified_muallima_taking_classes | Integer | NOT NULL, DEFAULT 0       | Active certified teachers    |
| trained_muallima                  | Integer | NOT NULL, DEFAULT 0       | Trained teachers             |
| trained_muallima_taking_classes   | Integer | NOT NULL, DEFAULT 0       | Active trained teachers      |
| total_unit                        | Integer | NOT NULL, DEFAULT 0       | Total units                  |
| units_with_muallima               | Integer | NOT NULL, DEFAULT 0       | Units with assigned teachers |

### ReportCourse
| Field             | Type    | Constraints               | Description                |
| ----------------- | ------- | ------------------------- | -------------------------- |
| id                | Integer | PRIMARY KEY               | Course entry ID            |
| report_id         | Integer | FK to Report.id, NOT NULL | Parent report              |
| category          | String  | NOT NULL                  | Course category            |
| number            | Integer | NOT NULL, DEFAULT 0       | Total courses              |
| increase          | Integer | NOT NULL, DEFAULT 0       | New courses                |
| decrease          | Integer | NOT NULL, DEFAULT 0       | Discontinued courses       |
| sessions          | Integer | NOT NULL, DEFAULT 0       | Total sessions held        |
| students          | Integer | NOT NULL, DEFAULT 0       | Total students             |
| attendance        | Integer | NOT NULL, DEFAULT 0       | Average attendance         |
| status_board      | Integer | NOT NULL, DEFAULT 0       | Students at board level    |
| status_qayda      | Integer | NOT NULL, DEFAULT 0       | Students at qayda level    |
| status_ampara     | Integer | NOT NULL, DEFAULT 0       | Students at ampara level   |
| status_quran      | Integer | NOT NULL, DEFAULT 0       | Students at quran level    |
| completed         | Integer | NOT NULL, DEFAULT 0       | Students completed         |
| correctly_learned | Integer | NOT NULL, DEFAULT 0       | Students learned correctly |

### ReportOrganizational
| Field     | Type    | Constraints               | Description            |
| --------- | ------- | ------------------------- | ---------------------- |
| id        | Integer | PRIMARY KEY               | Organizational ID      |
| report_id | Integer | FK to Report.id, NOT NULL | Parent report          |
| category  | String  | NOT NULL                  | Activity category      |
| number    | Integer | NOT NULL, DEFAULT 0       | Count/quantity         |
| increase  | Integer | NOT NULL, DEFAULT 0       | Increase from last     |
| amount    | Integer | NULLABLE                  | Amount (if applicable) |
| comments  | Text    | NULLABLE                  | Additional notes       |

### ReportPersonal
| Field                   | Type    | Constraints               | Description              |
| ----------------------- | ------- | ------------------------- | ------------------------ |
| id                      | Integer | PRIMARY KEY               | Personal development ID  |
| report_id               | Integer | FK to Report.id, NOT NULL | Parent report            |
| category                | String  | NOT NULL                  | Member category          |
| teaching                | Integer | NOT NULL, DEFAULT 0       | Members teaching others  |
| learning                | Integer | NOT NULL, DEFAULT 0       | Members being taught     |
| olama_invited           | Integer | NOT NULL, DEFAULT 0       | Scholars invited         |
| became_shohojogi        | Integer | NOT NULL, DEFAULT 0       | Became supporters        |
| became_sokrio_shohojogi | Integer | NOT NULL, DEFAULT 0       | Became active supporters |
| became_kormi            | Integer | NOT NULL, DEFAULT 0       | Became workers           |
| became_rukon            | Integer | NOT NULL, DEFAULT 0       | Became members           |

### ReportMeeting
| Field                | Type    | Constraints               | Description                 |
| -------------------- | ------- | ------------------------- | --------------------------- |
| id                   | Integer | PRIMARY KEY               | Meeting ID                  |
| report_id            | Integer | FK to Report.id, NOT NULL | Parent report               |
| category             | String  | NOT NULL                  | Meeting type                |
| city_count           | Integer | NOT NULL, DEFAULT 0       | City-level meetings (admin) |
| city_avg_attendance  | Integer | NOT NULL, DEFAULT 0       | City attendance (admin)     |
| thana_count          | Integer | NOT NULL, DEFAULT 0       | Thana-level meetings        |
| thana_avg_attendance | Integer | NOT NULL, DEFAULT 0       | Thana attendance            |
| ward_count           | Integer | NOT NULL, DEFAULT 0       | Ward-level meetings         |
| ward_avg_attendance  | Integer | NOT NULL, DEFAULT 0       | Ward attendance             |
| comments             | Text    | NULLABLE                  | Meeting notes               |

### ReportExtra
| Field     | Type    | Constraints               | Description       |
| --------- | ------- | ------------------------- | ----------------- |
| id        | Integer | PRIMARY KEY               | Extra activity ID |
| report_id | Integer | FK to Report.id, NOT NULL | Parent report     |
| category  | String  | NOT NULL                  | Activity type     |
| number    | Integer | NOT NULL, DEFAULT 0       | Count/quantity    |

### ReportComment
| Field     | Type    | Constraints               | Description                                                                     |
| --------- | ------- | ------------------------- | ------------------------------------------------------------------------------- |
| id        | Integer | PRIMARY KEY               | Comment ID                                                                      |
| report_id | Integer | FK to Report.id, NOT NULL | Parent report                                                                   |
| comment   | Text    | NULLABLE                  | Main comment for this report (zone, year, report_type, and month if applicable) |

---

## 3. Enumerated Values

### Report Types (Report.report_type)
- মাসিক (Monthly): User selects a month (Bangla month dropdown: জানুয়ারি–ডিসেম্বর) and year. Data is for the selected month only.
- ত্রৈমাসিক (Quarterly): Summarizes Jan-Mar for the selected year.
- ষান্মাসিক (Half-yearly): Summarizes Jan-Jun for the selected year.
- নয়-মাসিক (Nine-month): Summarizes Jan-Sep for the selected year.
- বার্ষিক (Yearly): Summarizes Jan-Dec for the selected year.



**Behavior & UI:**
- The report type selector is a dropdown on the dashboard. When মাসিক is selected, a month dropdown appears. For other types, only year is selectable.
- Dropdowns for months and years are dynamically populated. If no month/year is selected, defaults to the current month/year.
- Validation ensures the selected month/year is valid for the chosen report type.
- The summarization logic for each type is detailed in `TODO_3.md`.
- The `ReportComment` table includes fields for comments specific to each report type and month, so users can provide relevant context.

### Zone Names (Zone.name)
- শ্যামপুর জোন
- ডেমরা জোন
- যাত্রাবাড়ী পূর্ব জোন
- যাত্রাবাড়ী পশ্চিম জোন
- ওয়ারী জোন
- সূত্রাপুর জোন
- চকবাজার বংশাল জোন
- লালবাগ কামরাঙ্গীর চর জোন
- ধানমন্ডি জোন
- মতিঝিল জোন
- পল্টন জোন
- খিলগাঁও জোন
- সবুজবাগ মুগদা জোন

### Course Categories (ReportCourse.category)
- বিশিষ্টদের
- সাধারণদের
- কর্মীদের
- ইউনিট সভানেত্রী
- অগ্রসরদের
- রুকনদের অনুশীলনী ক্লাস
- তারবিয়াত বৈঠক
- পারিবারিক ইউনিটে তা'লীমুল কুরআন
- শিশু- তা'লিমুল কুরআন
- নিরক্ষর- তা'লিমুস সলাত

### Organizational Categories (ReportOrganizational.category)
- দাওয়াত দান
- কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন
- সহযোগী হয়েছে
- সম্মতি দিয়েছেন
- সক্রিয় সহযোগী
- কর্মী
- রুকন
- দাওয়াতী ইউনিট
- ইউনিট
- সূধী
- এককালীন
- জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)
- বই বিলি
- বই বিক্রি

### Personal Activities Categories (ReportPersonal.category)
- রুকন
- কর্মী
- সক্রিয় সহযোগী

### Meeting Categories (ReportMeeting.category)
- কমিটি বৈঠক হয়েছে
- মুয়াল্লিমাদের নিয়ে বৈঠক
- Committee Orientation *(Admin only)*
- Muallima Orientation *(Admin only)*

### Extra Activity Categories (ReportExtra.category)
- মক্তব সংখ্যা
- মক্তব বৃদ্ধি
- মহানগরী পরিচালিত *(Admin only)*
- স্থানীয়ভাবে পরিচালিত 
- মহানগরীর সফর
- থানা কমিটির সফর
- থানা প্রতিনিধির সফর
- ওয়ার্ড প্রতিনিধির সফর

---

## 4. Data Integrity & Constraints

### Unique Constraints
- **User.email**: Must be unique
- **Zone.name**: Must be unique
- **Report**: Combination of (zone_id, month, year, report_type) must be unique (one report per zone per period)

### Foreign Key Relationships
- **User.zone_id** → Zone.id
- **Report.zone_id** → Zone.id
- **All Report* tables.report_id** → Report.id

### Validation Rules
- **Email**: Must be a valid email format
- **Passwords**: Minimum 6 characters
- **All numeric fields**: Non-negative integers
- **Month**: Between 1-12 (used only for মাসিক type)
- **Year**: Valid 4-digit year

### Access Control
- Users can only view/edit reports for their assigned zone
- Admins can view/edit all reports and manage system settings
- City-level data in meetings is admin-only


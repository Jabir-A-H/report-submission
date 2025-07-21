

# Report Submission Database Design & Data Model

---

## 1. System Workflow & Rationale

The system is designed for efficient, section-based report submission and review. Key workflow features:

- **Multi-step wizard:** Each report section (Header, Courses, Organizational, Personal, Meetings, Extras, Comments) is a separate page, accessible in any order from the dashboard.
- **Reporting period selection:** Users must select the reporting period (month/year and type) before accessing or editing any report.
- **Zone-based reporting:** Each zone has one report per period; all users in a zone can view and edit the same up-to-date report for that period.
- **Autosave:** All section forms autosave on every field change (with an explicit save button for making sure they fill out all required fields and instant feedback).
- **Flexible navigation:** Users can freely navigate between sections and view/edit past period reports for their zone.
- **Admin controls:** Admins can review, edit, and export any report. Admin-only fields are access-controlled and hidden from regular users.
- **UI/UX:** Responsive, mobile-friendly, Bengali support, clear error/success messages, and loading indicators.
- **Simplicity:** Edit history/audit trail and real-time collaboration are not included for simplicity.

---

## 2. Database Tables Overview

The following tables define the normalized data model for the report submission system:

- **User**
- **Zone**
- **Report**
- **ReportHeader**
- **ReportCourse**
- **ReportOrganizational**
- **ReportPersonal**
- **ReportMeeting**
- **ReportExtra**
- **ReportComment**

---



### User
| Field    | Type   | Constraints             | Description      |
| -------- | ------ | ----------------------- | ---------------- |
| id       | int    | PK                      | User ID          |
| name     | string | NOT NULL                |                  |
| email    | string | UNIQUE, NOT NULL        |                  |
| password | string | NOT NULL                | Hashed           |
| role     | string | CHECK (user/admin)      | User or admin    |
| active   | bool   | DEFAULT False           | Must be approved |
| zone_id  | int    | FK to Zone.id, NOT NULL | User's zone      |



### Zone
| Field | Type   | Constraints      | Description |
| ----- | ------ | ---------------- | ----------- |
| id    | int    | PK               | Zone ID     |
| name  | string | UNIQUE, NOT NULL | Zone name   |



### Report
| Field       | Type   | Constraints                        | Description                                                |
| ----------- | ------ | ---------------------------------- | ---------------------------------------------------------- |
| id          | int    | PK                                 | Report ID                                                  |
| user_id     | int    | FK to User.id, NOT NULL            | Who created/last edited                                    |
| zone_id     | int    | FK to Zone.id, NOT NULL            | Zone for this report                                       |
| month       | int    | NOT NULL                           | Reporting month (1-12)                                     |
| year        | int    | NOT NULL                           | Reporting year                                             |
| period_type | string | CHECK (see below), NOT NULL        | monthly, 1st quarterly, half-yearly, 2nd quarterly, yearly |
| created_at  | date   | DEFAULT now()                      |                                                            |
| updated_at  | date   | DEFAULT now(), auto-update on edit |                                                            |




### ReportHeader
| Field                             | Type   | Constraints               | Description |
| --------------------------------- | ------ | ------------------------- | ----------- |
| id                                | int    | PK                        | Header ID   |
| report_id                         | int    | FK to Report.id, NOT NULL |             |
| responsible_name                  | string | NOT NULL                  |             |
| thana                             | string | NOT NULL                  |             |
| ward                              | int    | NOT NULL                  |             |
| total_muallima                    | int    | NOT NULL                  |             |
| muallima_increase                 | int    | NOT NULL                  |             |
| muallima_decrease                 | int    | NOT NULL                  |             |
| certified_muallima                | int    | NOT NULL                  |             |
| certified_muallima_taking_classes | int    | NOT NULL                  |             |
| trained_muallima                  | int    | NOT NULL                  |             |
| trained_muallima_taking_classes   | int    | NOT NULL                  |             |
| total_unit                        | int    | NOT NULL                  |             |
| units_with_muallima               | int    | NOT NULL                  |             |



### ReportCourse
| Field             | Type   | Constraints               | Description          |
| ----------------- | ------ | ------------------------- | -------------------- |
| id                | int    | PK                        |                      |
| report_id         | int    | FK to Report.id, NOT NULL |                      |
| category          | string | NOT NULL                  | See categories below |
| number            | int    | NOT NULL                  |                      |
| increase          | int    | NOT NULL                  |                      |
| decrease          | int    | NOT NULL                  |                      |
| sessions          | int    | NOT NULL                  |                      |
| students          | int    | NOT NULL                  |                      |
| attendance        | int    | NOT NULL                  |                      |
| status_board      | int    | NOT NULL                  |                      |
| status_qayda      | int    | NOT NULL                  |                      |
| status_ampara     | int    | NOT NULL                  |                      |
| status_quran      | int    | NOT NULL                  |                      |
| completed         | int    | NOT NULL                  |                      |
| correctly_learned | int    | NOT NULL                  |                      |



### ReportOrganizational
| Field     | Type   | Constraints               | Description          |
| --------- | ------ | ------------------------- | -------------------- |
| id        | int    | PK                        |                      |
| report_id | int    | FK to Report.id, NOT NULL |                      |
| category  | string | NOT NULL                  | See categories below |
| number    | int    | NOT NULL                  |                      |
| increase  | int    | NOT NULL                  |                      |
| amount    | int    | NULLABLE                  |                      |
| comments  | string | NULLABLE                  |                      |



### ReportPersonal
| Field                   | Type   | Constraints               | Description                             |
| ----------------------- | ------ | ------------------------- | --------------------------------------- |
| id                      | int    | PK                        |                                         |
| report_id               | int    | FK to Report.id, NOT NULL |                                         |
| category                | string | NOT NULL                  | রুকন, কর্মী, সক্রিয় সহযোগী                     |
| teaching                | int    | NOT NULL                  | কতজন শিখাচ্ছেন                              |
| learning                | int    | NOT NULL                  | কতজনকে শিখাচ্ছেন                             |
| olama_invited           | int    | NOT NULL                  | কতজন ওয়ালামাকে দাওয়াত দিয়েছেন                    |
| became_shohojogi        | int    | NOT NULL                  | দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে সহযোগী হয়েছেন কতজন      |
| became_sokrio_shohojogi | int    | NOT NULL                  | দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে সক্রিয় সহযোগী হয়েছেন কতজন |
| became_kormi            | int    | NOT NULL                  | দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে কর্মী হয়েছেন কতজন       |
| became_rukon            | int    | NOT NULL                  | দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে রুকন হয়েছেন কতজন       |



### ReportMeeting
| Field                | Type   | Constraints               | Description               |
| -------------------- | ------ | ------------------------- | ------------------------- |
| id                   | int    | PK                        |                           |
| report_id            | int    | FK to Report.id, NOT NULL |                           |
| category             | string | NOT NULL                  | See categories below      |
| city_count           | int    | NOT NULL                  | Admin-only in aggregation |
| city_avg_attendance  | int    | NOT NULL                  | Admin-only in aggregation |
| thana_count          | int    | NOT NULL                  |                           |
| thana_avg_attendance | int    | NOT NULL                  |                           |
| ward_count           | int    | NOT NULL                  |                           |
| ward_avg_attendance  | int    | NOT NULL                  |                           |
| comments             | string | NULLABLE                  |                           |



### ReportExtra
| Field     | Type   | Constraints               | Description          |
| --------- | ------ | ------------------------- | -------------------- |
| id        | int    | PK                        |                      |
| report_id | int    | FK to Report.id, NOT NULL |                      |
| category  | string | NOT NULL                  | See categories below |
| number    | int    | NOT NULL                  |                      |




### ReportComment
| Field                    | Type   | Constraints               | Description               |
| ------------------------ | ------ | ------------------------- | ------------------------- |
| id                       | int    | PK                        |                           |
| report_id                | int    | FK to Report.id, NOT NULL |                           |
| monthly_comment          | string | NOT NULL                  | For monthly reports       |
| first_quarterly_comment  | string | NOT NULL                  | For 1st quarterly reports |
| half_yearly_comment      | string | NOT NULL                  | For half-yearly reports   |
| second_quarterly_comment | string | NOT NULL                  | For 2nd quarterly reports |
| yearly_comment           | string | NOT NULL                  | For yearly reports        |




---


## 4. Enumerated/Predefined Values (Admin Editable)

### Zone.name
- শ্যামপুর জোন
- ডেমরা জোন
- যাত্রাবাড়ী পূর্ব জোন
- যাত্রাবাড়ী পশ্চিম জোন
- ওয়ারী জোন
- সূত্রাপুর জোন
- চকবাজার বংশাল জোন
- লালবাগ কামরাঙ্গীর চর জোন
- ধানমন্ডি জোন
- মতিঝিল জোন
- পল্টন জোন
- খিলগাঁও জোন
- সবুজবাগ মুগদা জোন

### Report.period_type
- monthly
- 1st quarterly
- half-yearly
- 2nd quarterly
- yearly

### ReportCourse.category
- বিশিষ্টদের
- সাধারণদের
- কর্মীদের
- ইউনিট সভানেত্রী
- অগ্রসরদের
- রুকনদের অনুশীলনী ক্লাস
- তারবিয়াত বৈঠক
- পারিবারিক ইউনিটে তা’লীমুল কুরআন
- শিশু- তা’লিমুল কুরআন
- নিরক্ষর- তা’লিমুস সলাত

### ReportOrganizational.category
- দাওয়াত দান
- কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন
- সহযোগী হয়েছে
- সম্মতি দিয়েছেন
- সক্রিয় সহযোগী
- কর্মী
- রুকন
- দাওয়াতী ইউনিট
- ইউনিট
- সূধী
- এককালীন
- জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)
- বই বিলি
- বই বিক্রি

### ReportPersonal.category
- রুকন
- কর্মী
- সক্রিয় সহযোগী

### ReportMeeting.category
- কমিটি বৈঠক হয়েছে
- মুয়াল্লিমাদের নিয়ে বৈঠক
- Committee Orientation
- Muallima Orientation
> *Users only see and edit the first two items in ReportMeeting.category*

### ReportExtra.category
- Moktob Count
- Moktob Increase
- Moktob City *(only admin can edit this value in the main aggregated summary report file)*
- Moktob Local
- Sofor City
- Sofor Thana Committee
- Sofor Thana Representative
- Sofor Ward Representative


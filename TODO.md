
# Report Submission Database Design & Workflow

---

## 1. Workflow & Rationale


- The system uses a multi-step wizard: each report section (Header, Courses, Organizational, Personal, Meetings, Extras, Comments) is a separate page, accessible in any order from the dashboard.
- Users must select the reporting period (month/year and type) before accessing or editing any report.
- Each zone has one report per period; all users in a zone can view and edit the same up-to-date report for that period.
- All section forms autosave on every field change (an explicit save button for making sure they fill out all required fields; instant feedback).
- Users can freely navigate between sections.
- Users can view and edit past periods reports for their zone.
- Admins can review, edit, lock/unlock, and export any report; admin-only fields are access-controlled.
- UI is responsive, mobile-friendly, and supports Bengali; clear error/success messages and loading indicators are provided.
- Admin only fields are hidden from regular users and can only be edited via access control.
- Edit history/audit trail and real-time collaboration are not included for simplicity.

---

here following are the table headers that i want for each table-

## 2. Database Tables Overview

Tables:
- User
- Zone
- Report
- ReportHeader
- ReportCourse
- ReportOrganizational
- ReportPersonal
- ReportMeeting
- ReportExtra
- ReportComment

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
| Field             | Type   | Constraints               | Description          |
| ----------------- | ------ | ------------------------- | -------------------- |
| id                | int    | PK                        |                      |
| report_id         | int    | FK to Report.id, NOT NULL |                      |
| category          | string | NOT NULL                  | See categories below |
| rukon             | int    | NOT NULL                  |                      |
| kormi             | int    | NOT NULL                  |                      |
| shokrio_shohojogi | int    | NOT NULL                  |                      |



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

## 3. Enumerated/Predefined Values (Admin Editable)

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
- কতজন শিখাচ্ছেন
- কতজনকে শিখাচ্ছেন
- কতজন ওয়ালামাকে দাওয়াত দিয়েছেন
- দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে সহযোগী হয়েছেন কতজন
- দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে সক্রিয় সহযোগীকে হয়েছেন কতজন
- দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে কর্মী হয়েছেন কতজন
- দাওয়াত প্রাপ্ত ওয়ালামার মধ্যে রুকন হয়েছেন কতজন

### ReportMeeting.category
- কমিটি বৈঠক হয়েছে
- মুয়াল্লিমাদের নিয়ে বৈঠক
- CM/MO (only admin can edit this value in the main aggregated file)

### ReportExtra.category
- Moktob Count
- Moktob Increase
- Moktob City (only admin can edit this value in the main aggregated file)
- Moktob Local
- Sofor City
- Sofor Thana Committee
- Sofor Thana Representative
- Sofor Ward Representative


# Database Tables and Columns (Visual Table Only)

```mermaid
%% Only table names and columns, no relationships
classDiagram
    %% Arrows show foreign key relationships
    Zone <|-- User : zone_id
    User <|-- Report : user_id
    Report <|-- ReportHeader : report_id
    Report <|-- ReportClass : report_id
    Report <|-- ReportMeeting : report_id
    Report <|-- ReportManpower : report_id
    Report <|-- ReportIndividualEffort : report_id
    Report <|-- ReportEdit : report_id
    User <|-- ReportEdit : editor_id

    class Zone {
        int id
        string name
    }
    class User {
        int id
        string username
        string email
        string password
        string role
        boolean is_active
        int zone_id
        int ward
    }
    class Report {
        int id
        int user_id
        string month
        int year
        string responsible_name
        datetime created_at
        boolean edit_locked
        text admin_comment
    }
    class ReportHeader {
        int id
        int report_id
        int total_teachers
        int teacher_increase
        int teacher_decrease
        int certified_teachers
        int trained_teachers
        int unit_count
        int teachers_taking_classes_1
        int teachers_taking_classes_2
        int units_with_teachers
    }
    class ReportClass {
        int id
        int report_id
        string dept_type
        int number
        int increase
        int decrease
        int sessions
        int students
        int attendance
        int status_board
        int status_qayda
        int status_ampara
        int status_quran
        int completed
        int correctly_learned
    }
    class ReportMeeting {
        int id
        int report_id
        string meeting_type
        int city_count
        int city_avg_attendance
        int thana_count
        int thana_avg_attendance
        int ward_count
        int ward_avg_attendance
        text comments
    }
    class ReportManpower {
        int id
        int report_id
        string category
        int count
        int additional_count
    }
    class ReportIndividualEffort {
        int id
        int report_id
        string category
        int teaching_count
        int taught_count
    }
    class ReportEdit {
        int id
        int report_id
        int editor_id
        datetime edit_time
        text changes
        text comment
    }
```

---

# Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    ZONE ||--o{ USER : "has"
    USER ||--o{ REPORT : "submits"
    REPORT ||--|| REPORTHEADER : "has"
    REPORT ||--o{ REPORTCLASS : "has"
    REPORT ||--o{ REPORTMEETING : "has"
    REPORT ||--o{ REPORTMANPOWER : "has"
    REPORT ||--o{ REPORTINDIVIDUALEFFORT : "has"
    REPORT ||--o{ REPORTEDIT : "has"
    USER ||--o{ REPORTEDIT : "edits (as editor)"

    ZONE {
        int id PK
        string name
    }
    USER {
        int id PK
        string username
        string email
        string password
        string role
        boolean is_active
        int zone_id FK
        int ward
    }
    REPORT {
        int id PK
        int user_id FK
        string month
        int year
        string responsible_name
        datetime created_at
        boolean edit_locked
        text admin_comment
    }
    REPORTHEADER {
        int id PK
        int report_id FK
        int total_teachers
        int teacher_increase
        int teacher_decrease
        int certified_teachers
        int trained_teachers
        int unit_count
        int teachers_taking_classes_1
        int teachers_taking_classes_2
        int units_with_teachers
    }
    REPORTCLASS {
        int id PK
        int report_id FK
        string dept_type
        int number
        int increase
        int decrease
        int sessions
        int students
        int attendance
        int status_board
        int status_qayda
        int status_ampara
        int status_quran
        int completed
        int correctly_learned
    }
    REPORTMEETING {
        int id PK
        int report_id FK
        string meeting_type
        int city_count
        int city_avg_attendance
        int thana_count
        int thana_avg_attendance
        int ward_count
        int ward_avg_attendance
        text comments
    }
    REPORTMANPOWER {
        int id PK
        int report_id FK
        string category
        int count
        int additional_count
    }
    REPORTINDIVIDUALEFFORT {
        int id PK
        int report_id FK
        string category
        int teaching_count
        int taught_count
    }
    REPORTEDIT {
        int id PK
        int report_id FK
        int editor_id FK
        datetime edit_time
        text changes
        text comment
    }
```
---

# System Workflow (All Roles)

```mermaid
flowchart TD
    subgraph User
        U1[User visits site] --> U2[Register or Login]
        U2 -->|Register| U3[Submit registration form]
        U3 --> U4[Wait for admin approval]
        U2 -->|Login| U5{Is approved?}
        U4 --> U5
        U5 -- No --> U6[Show 'Awaiting approval']
        U5 -- Yes --> U7[User Dashboard]
        U7 -->|Submit Report| U8[Fill multi-section form]
        U8 --> U9[Save/Submit report]
        U7 -->|Edit Report| U10[Edit own report]
        U7 -->|Logout| U11[Session ends]
    end

    subgraph Admin
        A1[Admin logs in] --> A2{Dashboard}
        A2 -->|Manage Users| A3[View pending users]
        A3 -->|Approve| A4[User is activated]
        A3 -->|Delete| A5[User is removed]
        A2 -->|Manage Zones| A6[Add/Edit/Delete Zone]
        A2 -->|View Reports| A7[See all reports]
        A7 -->|Edit| A8[Edit any report]
        A7 -->|View Audit| A9[See report audit trail]
        A2 -->|Export Data| A10[Download Excel/PDF]
        A2 -->|Logout| A11[Session ends]
    end

    %% Cross-role interactions
    U3 -.-> A3
    U9 -.-> A7
    U10 -.-> A8
```

---

# Database Tables, Columns, and Relationships

## Zone

- id (PK): Integer
- name: String (unique, not null)
- users: Relationship to User (one-to-many)

## User

- id (PK): Integer
- username: String (unique, nullable)
- email: String (unique, not null)
- password: String (not null)
- role: String (user/admin, not null)
- is_active: Boolean (default False)
- zone_id (FK): Integer → Zone.id
- ward: Integer (not null)
- reports: Relationship to Report (one-to-many, via user_id)

## Report

- id (PK): Integer
- user_id (FK): Integer → User.id
- month: String (not null)
- year: Integer (not null)
- responsible_name: String (not null)
- created_at: DateTime (default now)
- edit_locked: Boolean (default False)
- admin_comment: Text (nullable)
- header: Relationship to ReportHeader (one-to-one, via report_id)
- classes: Relationship to ReportClass (one-to-many, via report_id)
- meetings: Relationship to ReportMeeting (one-to-many, via report_id)
- manpower: Relationship to ReportManpower (one-to-many, via report_id)
- efforts: Relationship to ReportIndividualEffort (one-to-many, via report_id)
- edits: Relationship to ReportEdit (one-to-many, via report_id)

## ReportHeader

- id (PK): Integer
- report_id (FK): Integer → Report.id
- total_teachers: Integer
- teacher_increase: Integer
- teacher_decrease: Integer
- certified_teachers: Integer
- trained_teachers: Integer
- unit_count: Integer
- teachers_taking_classes_1: Integer
- teachers_taking_classes_2: Integer
- units_with_teachers: Integer

## ReportClass

- id (PK): Integer
- report_id (FK): Integer → Report.id
- dept_type: String
- number: Integer
- increase: Integer
- decrease: Integer
- sessions: Integer
- students: Integer
- attendance: Integer
- status_board: Integer
- status_qayda: Integer
- status_ampara: Integer
- status_quran: Integer
- completed: Integer
- correctly_learned: Integer

## ReportMeeting

- id (PK): Integer
- report_id (FK): Integer → Report.id
- meeting_type: String
- city_count: Integer
- city_avg_attendance: Integer
- thana_count: Integer
- thana_avg_attendance: Integer
- ward_count: Integer
- ward_avg_attendance: Integer
- comments: Text (nullable)

## ReportManpower

- id (PK): Integer
- report_id (FK): Integer → Report.id
- category: String
- count: Integer
- additional_count: Integer (nullable)

## ReportIndividualEffort

- id (PK): Integer
- report_id (FK): Integer → Report.id
- category: String
- teaching_count: Integer
- taught_count: Integer

## ReportEdit (Audit Trail)

- id (PK): Integer
- report_id (FK): Integer → Report.id
- editor_id (FK): Integer → User.id
- edit_time: DateTime (default now)
- changes: Text (JSON string)
- comment: Text (nullable)

# Relationships Summary

- Zone 1---* User
- User 1---* Report
- Report 1---1 ReportHeader
- Report 1---* ReportClass
- Report 1---* ReportMeeting
- Report 1---* ReportManpower
- Report 1---* ReportIndividualEffort
- Report 1---* ReportEdit
- User 1---* ReportEdit (as editor)
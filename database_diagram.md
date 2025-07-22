# Database Tables and Columns (Visual Table Only)

```mermaid
%% Only table names and columns, no relationships
classDiagram
    %% Arrows show foreign key relationships
    Zone <|-- User : zone_id
    Zone <|-- Report : zone_id
    Report <|-- ReportHeader : report_id
    Report <|-- ReportCourse : report_id
    Report <|-- ReportOrganizational : report_id
    Report <|-- ReportPersonal : report_id
    Report <|-- ReportMeeting : report_id
    Report <|-- ReportExtra : report_id
    Report <|-- ReportComment : report_id

    class Zone {
        int id
        string name
    }
    class User {
        int id
        string user_id  # 3-digit, unique, used for login
        string name
        string email
        string password
        string role
        bool active
        int zone_id
    }
    class Report {
        int id
        int zone_id
        int month
        int year
        string report_type
        datetime created_at
        datetime updated_at
    }
    class ReportHeader {
        int id
        int report_id
        string responsible_name
        string thana
        int ward
        int total_muallima
        int muallima_increase
        int muallima_decrease
        int certified_muallima
        int certified_muallima_taking_classes
        int trained_muallima
        int trained_muallima_taking_classes
        int total_unit
        int units_with_muallima
    }
    class ReportCourse {
        int id
        int report_id
        string category
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
    class ReportOrganizational {
        int id
        int report_id
        string category
        int number
        int increase
        int amount
        text comments
    }
    class ReportPersonal {
        int id
        int report_id
        string category
        int teaching
        int learning
        int olama_invited
        int became_shohojogi
        int became_sokrio_shohojogi
        int became_kormi
        int became_rukon
    }
    class ReportMeeting {
        int id
        int report_id
        string category
        int city_count
        int city_avg_attendance
        int thana_count
        int thana_avg_attendance
        int ward_count
        int ward_avg_attendance
        text comments
    }
    class ReportExtra {
        int id
        int report_id
        string category
        int number
    }
    class ReportComment {
        int id
        int report_id
        text comment
    }
```

---

# Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    ZONE ||--o{ USER : "has"
    ZONE ||--o{ REPORT : "has"
    REPORT ||--|| REPORTHEADER : "has"
    REPORT ||--o{ REPORTCOURSE : "has"
    REPORT ||--o{ REPORTORGANIZATIONAL : "has"
    REPORT ||--o{ REPORTPERSONAL : "has"
    REPORT ||--o{ REPORTMEETING : "has"
    REPORT ||--o{ REPORTEXTRA : "has"
    REPORT ||--o{ REPORTCOMMENT : "has"

    ZONE {
        int id PK
        string name
    }
    USER {
        int id PK
        string user_id UNIQUE  # 3-digit, used for login
        string name
        string email
        string password
        string role
        bool active
        int zone_id FK
    }
    REPORT {
        int id PK
        int zone_id FK
        int month
        int year
        string report_type
        datetime created_at
        datetime updated_at
    }
    REPORTHEADER {
        int id PK
        int report_id FK
        string responsible_name
        string thana
        int ward
        int total_muallima
        int muallima_increase
        int muallima_decrease
        int certified_muallima
        int certified_muallima_taking_classes
        int trained_muallima
        int trained_muallima_taking_classes
        int total_unit
        int units_with_muallima
    }
    REPORTCOURSE {
        int id PK
        int report_id FK
        string category
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
    REPORTORGANIZATIONAL {
        int id PK
        int report_id FK
        string category
        int number
        int increase
        int amount
        text comments
    }
    REPORTPERSONAL {
        int id PK
        int report_id FK
        string category
        int teaching
        int learning
        int olama_invited
        int became_shohojogi
        int became_sokrio_shohojogi
        int became_kormi
        int became_rukon
    }
    REPORTMEETING {
        int id PK
        int report_id FK
        string category
        int city_count
        int city_avg_attendance
        int thana_count
        int thana_avg_attendance
        int ward_count
        int ward_avg_attendance
        text comments
    }
    REPORTEXTRA {
        int id PK
        int report_id FK
        string category
        int number
    }
    REPORTCOMMENT {
        int id PK
        int report_id FK
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

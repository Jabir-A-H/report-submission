# Project Simplification Notes for Report Submission System

Context: The Report Submission System is a Flask-based web app for 20 -30 users (zone members and admins) to manage educational reports with seven sections (Header, Courses, Organizational, Personal, Meetings, Extras, Comments) across multiple periods (monthly, quarterly, half-yearly, nine-month, yearly). The app must support Bengali localization, mobile-first UI, and PDF and Excel exports. Given the small user base, the implementation should avoid overkill while meeting the UI requirements in TODO_4.md.

**Streamlined Approach:**
  - Keep app.py monolithic; avoid splitting into models.py, routes.py, etc., to reduce maintenance.
  - Use SQLite exclusively (instance/reports.db) for simplicity, as it’s sufficient for low concurrency.
  - Include minimal dependencies in requirements.txt


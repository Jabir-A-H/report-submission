# Project Simplification Notes for Report Submission System

**Context:** The Report Submission System is a Flask-based web app for 20 -30 users (zone members and admins) to manage educational reports with seven sections (Header, Courses, Organizational, Personal, Meetings, Extras, Comments) across multiple periods (monthly, quarterly, half-yearly, nine-month, yearly). The app must support Bengali localization, mobile-first UI, and PDF and Excel exports. Given the small user base, the implementation should avoid overkill while meeting the UI requirements in TODO_4.md.

**Streamlined Approach:**
  - Keep app.py monolithic; avoid splitting into models.py, routes.py, etc., to reduce maintenance.
  - Use SQLite exclusively (instance/reports.db) for simplicity, as it’s sufficient for low concurrency.
  - Include minimal dependencies in requirements.txt
  - Use Tailwind CDN for styling instead of local build tools to avoid extra setup.
  - Store all templates in the default templates/ folder and static files in static/ for Flask auto-discovery.
  - Rely on Flask’s built-in session and authentication for user management; avoid external auth libraries unless needed.
  - Use Jinja2 template inheritance for consistent layout (base.html).
  - Implement client-side validation with HTML5 and minimal JS; keep JS logic simple and focused.
  - For Bengali localization, hardcode labels/messages in templates and JS, avoiding complex i18n libraries.
  - Use Flask’s send_file for exports; avoid heavy reporting libraries, but include pandas and reportlab for Excel/PDF generation.
  - Document all endpoints and UI flows in README for easy onboarding.


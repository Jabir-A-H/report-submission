# Prompt for GitHub Copilot with GPT-4.1

Create a complete web application called **Report-Submission** for a small team of 10-12 users to automate report collection and aggregation, replacing manual Google Sheets workflows with a complex, team-specific report format. The app allows users to log in, submit Excel-like forms, store data in a SQLite database, and enable authorized users to generate a master report based on custom conditions (sum by category) with export options (PDF, Excel). Use a simple tech stack: Flask (Python), SQLite, and HTML/CSS/JavaScript with Bootstrap. Below are the detailed requirements.

## Requirements

### General
- **Purpose**: Automate report collection for a team of 10-12 users with a unique, complex Excel format.
- **Features**:
  - Secure login with role-based access (user, admin).
  - Form submission page for users to enter report data (fields to be customized, e.g., category [string], value [number], description [text]).
  - Master report page for admin role to view aggregated data (sum by category) and export as PDF or Excel.
  - SQLite database to store users and reports.
- **Tech Stack**:
  - **Backend**: Flask (Python), Flask-Login (session-based authentication), Flask-SQLAlchemy (SQLite).
  - **Frontend**: HTML, CSS (Bootstrap 5), vanilla JavaScript (use `fetch` for API calls).
  - **Libraries**: pandas (Excel export), reportlab (PDF export).
- **Simplicity**: Minimal dependencies, no complex build tools (e.g., no React/Node.js). Suitable for a small, private app.
- **Security**: Hash passwords, use secure session management, restrict master report to admin role.

### File Structure
Generate the following files in a `report-submission` directory:
```
report-submission/
├── app.py                 # Flask app with routes and logic
├── init_db.py            # Script to initialize SQLite database
├── templates/
│   ├── login.html        # Login page
│   ├── form.html         # Form submission page for users
│   ├── report.html       # Master report page for admin
├── static/
│   ├── styles.css        # Custom CSS (if needed beyond Bootstrap)
│   ├── scripts.js        # JavaScript for frontend logic
├── requirements.txt       # Python dependencies
├── .env                  # Environment variables
├── .gitignore            # Git ignore file
├── README.md             # Project documentation
└── reports.db            # SQLite database (generated at runtime)
```

### Detailed File Requirements

1. **app.py**:
   - Flask app with routes:
     - `/login` (GET, POST): Render login page, handle authentication using Flask-Login. Redirect to `/form` (user) or `/master_report` (admin).
     - `/logout` (GET): Log out user and redirect to `/login`.
     - `/form` (GET, POST): Render form for users to enter report data (placeholder fields: category [string], value [number], description [text]). Validate inputs (e.g., required fields, numeric value). Save to SQLite.
     - `/master_report` (GET): Display aggregated report (sum by category) for admin role in a table.
     - `/export/<format>` (GET): Export report as PDF (reportlab) or Excel (pandas). Support `format` values: `pdf`, `excel`.
   - Use SQLAlchemy models:
     - `User`: Columns: id (primary key), username (unique, string), email (unique, string), password (hashed, string), role (user/admin).
     - `Report`: Columns: id (primary key), user_id (foreign key to User.id), category (string), value (float), description (text), created_at (timestamp).
   - Protect routes with `@login_required` and role checks (e.g., restrict `/master_report` to admin).
   - Use pandas for aggregation (sum `value` by `category`).
   - Generate PDF with reportlab (list categories and totals). Generate Excel with pandas (columns: category, total value).
   - Handle errors (e.g., invalid form data, database errors, unauthorized access) with user-friendly messages.

2. **init_db.py**:
   - Script to create SQLite database (`reports.db`) and initialize `User` and `Report` tables.
   - Add 3 sample users:
     - username: user1, email: user1@example.com, password: "password", role: user
     - username: user2, email: user2@example.com, password: "password", role: user
     - username: admin, email: admin@example.com, password: "password", role: admin
   - Use `werkzeug.security.generate_password_hash` for passwords.

3. **templates/login.html**:
   - Bootstrap 5-styled login form (email, password fields, submit button).
   - Display error messages (e.g., "Invalid credentials") in a Bootstrap alert.
   - POST to `/login`.
   - Include a logout link if user is authenticated.

4. **templates/form.html**:
   - Bootstrap 5-styled form for users (placeholder fields: category [text, required], value [number, required], description [textarea, optional]).
   - Display success message (e.g., "Report submitted") or error (e.g., "Invalid input") in a Bootstrap alert.
   - POST to `/form`.

5. **templates/report.html**:
   - Bootstrap 5-styled table showing aggregated report (columns: category, total value).
   - Buttons to download as PDF or Excel (use `fetch` to `/export/pdf` or `/export/excel`).
   - Accessible only to admin role (enforced by backend).
   - Include a logout link.

6. **static/styles.css**:
   - Minimal custom CSS for tweaks beyond Bootstrap (e.g., table padding, button alignment).

7. **static/scripts.js**:
   - JavaScript for:
     - Handling form submission errors/success via `fetch` (display alerts).
     - Triggering PDF/Excel downloads via `fetch` to `/export/<format>`.
   - No JPG export or html2canvas dependency.

8. **requirements.txt**:
   - List dependencies: `flask`, `flask-login`, `flask-sqlalchemy`, `pandas`, `reportlab`.

9. **.env**:
   - Include:
     ```
     FLASK_APP=app.py
     SECRET_KEY=your-secure-secret
     SQLALCHEMY_DATABASE_URI=sqlite:///reports.db
     ```

10. **.gitignore**:
    - Exclude:
      ```
      reports.db
      __pycache__/
      .env
      *.pyc
      venv/
      ```

11. **README.md**:
    - Short description: "Report-Submission automates report collection for a small team of 10-12 users. Users submit Excel-like forms, stored in SQLite. Admins generate a master report (sum by category) and export as PDF or Excel."
    - Installation:
      - Clone repo, `pip install -r requirements.txt`, run `python init_db.py`, then `flask run`.
      - Access at `http://localhost:5000`.
    - Usage:
      - Login with email (e.g., user1@example.com, password: password).
      - Users submit forms; admins view/export reports.
    - Customization:
      - Edit `form.html` and `Report` model for specific fields.
      - Update `/master_report` in `app.py` for custom aggregation logic.
    - Deployment: Local or PythonAnywhere.
    - License: MIT.

### Functional Requirements
- **Authentication**: Use Flask-Login for session-based auth. Redirect users to `/form`, admins to `/master_report`. Unauthenticated users go to `/login`. Support `/logout`.
- **Form Submission**: Save reports to SQLite with user_id, category, value, description, timestamp. Validate inputs (e.g., category non-empty, value numeric).
- **Master Report**: Aggregate reports by summing `value` per `category` using pandas. Display in a table (category, total value).
- **Exports**:
  - **PDF**: Use reportlab to generate a PDF listing categories and total values.
  - **Excel**: Use pandas to generate an XLSX file with columns: category, total value.
- **Security**:
  - Hash passwords with `werkzeug.security`.
  - Restrict `/master_report` and `/export` to admin role.
  - Use `.env` for `SECRET_KEY` and `SQLALCHEMY_DATABASE_URI`.
- **Error Handling**: Return user-friendly messages for invalid login, form errors, or unauthorized access.

### Customization Notes
- Form fields (category, value, description) are placeholders. The team uses a complex Excel format, to be provided separately (e.g., via sample Excel/PDF). Update `form.html`, `Report` model, and `/master_report` logic to match the format once provided.
- Keep the app lightweight for 10-12 users; avoid complex frameworks.

### Instructions for Copilot
- Generate all files listed above with complete, functional code.
- Ensure Flask routes handle errors (e.g., invalid login, form validation, unauthorized access) with Bootstrap alerts.
- Use Bootstrap 5 CDN: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css`.
- Test the app locally with `flask run` and verify:
  - Login works for user/admin roles.
  - Users can submit forms, view their own report submissions and export them; admins can view/export all reports.
  - PDF/Excel exports download correctly.
  - Role restrictions prevent users from accessing `/master_report`.
- If unsure about the complex Excel format, use placeholder fields (category, value, description) and note that they will be updated later.

Please generate all files and ensure they work together seamlessly. Notify if clarification is needed on the Excel format or aggregation logic!
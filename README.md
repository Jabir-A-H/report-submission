# Report-Submission

**Report-Submission** automates report collection and aggregation for a small team. Users log in to submit Excel-like forms, stored in a SQLite database. Authorized users generate a master report based on custom conditions (e.g., summing by category) and export it as PDF, Excel, or JPG. Role-based access ensures secure viewing, streamlining manual workflows.

## Features
- Secure login with roles (submitter, manager, executive).
- Excel-like form for data submission, tailored to unique report formats.
- Master report generation with custom aggregation logic.
- Export reports as PDF, Excel, or JPG.
- Lightweight SQLite database for simple data management.
- Responsive UI with Bootstrap for ease of use.

## Tech Stack
- **Frontend**: HTML, CSS (Bootstrap), JavaScript (vanilla)
- **Backend**: Flask (Python), SQLite
- **Libraries**: pandas (Excel), reportlab (PDF), html2canvas (JPG), Flask-Login (authentication)
- **Deployment**: Local or PythonAnywhere/Render

## Prerequisites
- Python 3.8+
- SQLite (included with Python)
- Git
- A modern web browser

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Jabir-A-H/report-submission.git
   cd report-submission
   ```

2. **Set Up Python Environment**:
   - Install dependencies:
     ```bash
     pip install flask flask-login pandas reportlab
     ```
   - Create a `.env` file:
     ```env
     FLASK_APP=app.py
     SECRET_KEY=your-secure-secret
     ```

3. **Initialize Database**:
   - Run the initialization script to create the SQLite database (`reports.db`):
     ```bash
     python init_db.py
     ```
   - Add initial users (example):
     ```python
     from app import db, User
     from werkzeug.security import generate_password_hash
     db.create_all()
     db.session.add_all([
         User(email="submitter@example.com", password=generate_password_hash("password"), role="submitter"),
         User(email="manager@example.com", password=generate_password_hash("password"), role="manager"),
         User(email="executive@example.com", password=generate_password_hash("password"), role="executive")
     ])
     db.session.commit()
     ```

4. **Run the App**:
   - Start the Flask server:
     ```bash
     flask run
     ```
   - Open `http://localhost:5000` in a browser.

## Usage

1. **Login**:
   - Navigate to `http://localhost:5000` and log in (e.g., `submitter@example.com`, password: `password`).

2. **Submit Reports**:
   - Submitter role: Access the form page, enter data (e.g., category, value, description), and submit.
   - Data is stored in SQLite.

3. **View Master Report**:
   - Manager/executive role: View the summarized report (e.g., sums by category).
   - Export as PDF, Excel, or JPG via download buttons.

4. **Customization**:
   - Edit `templates/form.html` to match your report fields.
   - Update `routes.py` (e.g., `/master_report`) for custom aggregation logic.
   - Adjust `static/styles.css` or Bootstrap classes for UI tweaks.

## Project Structure
```
report-submission/
├── app.py                 # Flask app and routes
├── init_db.py            # Database initialization
├── templates/            # HTML templates (form.html, report.html, login.html)
├── static/               # CSS, JavaScript (Bootstrap, html2canvas)
├── reports.db            # SQLite database
├── requirements.txt       # Python dependencies
├── .env                 # Environment variables
├── .gitignore           # Git ignore file
└── README.md            # This file
```

## Customization
- **Form Fields**: Modify `templates/form.html` and the `Report` model in `app.py` to match your Google Sheets columns.
- **Aggregation Logic**: Update the `/master_report` route in `app.py` with your specific conditions (e.g., sum by category, filter by date).
- **Exports**: PDF/Excel handled by `reportlab`/`pandas`. JPG uses `html2canvas` to capture the report table.
- **Styling**: Customize Bootstrap classes in `templates/*.html` or add CSS in `static/styles.css`.

## Deployment
- **Local**: Run `flask run` on a local machine.
- **Cloud**: Deploy to PythonAnywhere or Render. Copy `reports.db` and update `.env`.
- **Database**: SQLite is embedded, no separate server needed.

## Security Notes
- Replace `SECRET_KEY` with a strong value in production.
- Use HTTPS for production deployments.
- Hash passwords (handled by `Flask-Login`).
- Restrict SQLite file access (e.g., file permissions).

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License
MIT License. See `LICENSE` file for details.

## Contact
For issues or feature requests, open a GitHub issue or contact the project maintainer.
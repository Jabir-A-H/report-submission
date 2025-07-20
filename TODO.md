no, the ui is not correct as well, i now want only an multi step wizard for report submission. i dont need users to submit report in one page. Right now i am not focusing on the editing part. just the basic report database. and thats why use following names for the report parts-
ReportSummary
ReportCourse
ReportOrg
ReportPersonal
ReportMeeting
ReportExtra


here following are the table headers that i want for each table-
ReportSummary
    Responsible Name
    Thana
    Ward
    Total Muallima
    Muallima Increase
    Muallima Decrease
    Certified Muallima
    Certified Muallima Taking Classes
    Trained Muallima
    Trained Muallima Taking Classes
    Total Unit
    Units With Muallima

ReportCourse
    Type (admin can change it)
    Number
    Increase
    Decrease
    Sessions
    Students
    Attendance
    Status Board
    Status Qayda
    Status Ampara
    Status Quran
    Completed
    Correctly Learned

ReportOrg
    Dawah and Organization
    Number
    Increase
    Amount (not necesary for all entries)
    Comments












class ReportHeader(db.Model):
    """Header section of a report, stores summary Muallima/unit stats."""

    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    total_Muallima = db.Column(db.Integer, nullable=False)
    Muallima_increase = db.Column(db.Integer, nullable=False)
    Muallima_decrease = db.Column(db.Integer, nullable=False)
    certified_Muallima = db.Column(db.Integer, nullable=False)
    trained_Muallima = db.Column(db.Integer, nullable=False)
    unit_count = db.Column(db.Integer, nullable=False)
    Muallima_taking_classes_1 = db.Column(db.Integer, nullable=False)
    Muallima_taking_classes_2 = db.Column(db.Integer, nullable=False)
    units_with_Muallima = db.Column(db.Integer, nullable=False)


class ReportClass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    dept_type = db.Column(db.String(50), nullable=False)
    number = db.Column(db.Integer, nullable=False)
    increase = db.Column(db.Integer, nullable=False)
    decrease = db.Column(db.Integer, nullable=False)
    sessions = db.Column(db.Integer, nullable=False)
    students = db.Column(db.Integer, nullable=False)
    attendance = db.Column(db.Integer, nullable=False)
    status_board = db.Column(db.Integer, nullable=False)
    status_qayda = db.Column(db.Integer, nullable=False)
    status_ampara = db.Column(db.Integer, nullable=False)
    status_quran = db.Column(db.Integer, nullable=False)
    completed = db.Column(db.Integer, nullable=False)
    correctly_learned = db.Column(db.Integer, nullable=False)


class ReportMeeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    meeting_type = db.Column(db.String(50), nullable=False)
    city_count = db.Column(db.Integer, nullable=False)
    city_avg_attendance = db.Column(db.Integer, nullable=False)
    thana_count = db.Column(db.Integer, nullable=False)
    thana_avg_attendance = db.Column(db.Integer, nullable=False)
    ward_count = db.Column(db.Integer, nullable=False)
    ward_avg_attendance = db.Column(db.Integer, nullable=False)
    comments = db.Column(db.Text, nullable=True)


class ReportManpower(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    count = db.Column(db.Integer, nullable=False)
    additional_count = db.Column(db.Integer, nullable=True)


class ReportIndividualEffort(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    teaching_count = db.Column(db.Integer, nullable=False)
    taught_count = db.Column(db.Integer, nullable=False)
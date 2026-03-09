from extensions import db, login_manager
from flask_login import UserMixin
from sqlalchemy.orm import joinedload

class Zone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    people = db.relationship("People", backref="zone", lazy=True)
    reports = db.relationship("Report", backref="zone", lazy=True)


class People(UserMixin, db.Model):
    __tablename__ = "people"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(3), unique=True, nullable=False)  # 3-digit user ID
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(10), nullable=False, default="user")  # 'user' or 'admin'
    active = db.Column(db.Boolean, default=False)
    zone_id = db.Column(db.Integer, db.ForeignKey("zone.id"), nullable=False)

    def get_id(self):
        return str(self.id)


class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    zone_id = db.Column(db.Integer, db.ForeignKey("zone.id"), nullable=False)
    month = db.Column(db.Integer, nullable=True)  # Only for মাসিক
    year = db.Column(db.Integer, nullable=False)
    report_type = db.Column(db.String(20), nullable=False)  # মাসিক, ত্রৈমাসিক, ...
    header = db.relationship("ReportHeader", uselist=False, backref="report")
    courses = db.relationship("ReportCourse", backref="report", lazy=True)
    organizational = db.relationship(
        "ReportOrganizational", backref="report", lazy=True
    )
    personal = db.relationship("ReportPersonal", backref="report", lazy=True)
    meetings = db.relationship("ReportMeeting", backref="report", lazy=True)
    extras = db.relationship("ReportExtra", backref="report", lazy=True)
    comments = db.relationship("ReportComment", uselist=False, backref="report")

    # Add composite index for common queries
    __table_args__ = (
        db.Index("idx_report_zone_month_year", "zone_id", "month", "year"),
    )


class ReportHeader(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    responsible_name = db.Column(db.String(100), nullable=False)
    thana = db.Column(db.String(100), nullable=False)
    ward = db.Column(db.Integer, nullable=False)
    total_muallima = db.Column(db.Integer, default=0, nullable=False)
    muallima_increase = db.Column(db.Integer, default=0, nullable=False)
    muallima_decrease = db.Column(db.Integer, default=0, nullable=False)
    certified_muallima = db.Column(db.Integer, default=0, nullable=False)
    certified_muallima_taking_classes = db.Column(db.Integer, default=0, nullable=False)
    trained_muallima = db.Column(db.Integer, default=0, nullable=False)
    trained_muallima_taking_classes = db.Column(db.Integer, default=0, nullable=False)
    total_unit = db.Column(db.Integer, default=0, nullable=False)
    units_with_muallima = db.Column(db.Integer, default=0, nullable=False)


class ReportCourse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    number = db.Column(db.Integer, default=0, nullable=False)
    increase = db.Column(db.Integer, default=0, nullable=False)
    decrease = db.Column(db.Integer, default=0, nullable=False)
    sessions = db.Column(db.Integer, default=0, nullable=False)
    students = db.Column(db.Integer, default=0, nullable=False)
    attendance = db.Column(db.Integer, default=0, nullable=False)
    status_board = db.Column(db.Integer, default=0, nullable=False)
    status_qayda = db.Column(db.Integer, default=0, nullable=False)
    status_ampara = db.Column(db.Integer, default=0, nullable=False)
    status_quran = db.Column(db.Integer, default=0, nullable=False)
    completed = db.Column(db.Integer, default=0, nullable=False)
    correctly_learned = db.Column(db.Integer, default=0, nullable=False)


class ReportOrganizational(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    number = db.Column(db.Integer, default=0, nullable=False)
    increase = db.Column(db.Integer, default=0, nullable=False)
    amount = db.Column(db.Integer, nullable=True)
    comments = db.Column(db.String(200), nullable=True)


class ReportPersonal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    teaching = db.Column(db.Integer, default=0, nullable=False)
    learning = db.Column(db.Integer, default=0, nullable=False)
    olama_invited = db.Column(db.Integer, default=0, nullable=False)
    became_shohojogi = db.Column(db.Integer, default=0, nullable=False)
    became_sokrio_shohojogi = db.Column(db.Integer, default=0, nullable=False)
    became_kormi = db.Column(db.Integer, default=0, nullable=False)
    became_rukon = db.Column(db.Integer, default=0, nullable=False)


class ReportMeeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    city_count = db.Column(db.Integer, default=0, nullable=False)
    city_avg_attendance = db.Column(db.Integer, default=0, nullable=False)
    thana_count = db.Column(db.Integer, default=0, nullable=False)
    thana_avg_attendance = db.Column(db.Integer, default=0, nullable=False)
    ward_count = db.Column(db.Integer, default=0, nullable=False)
    ward_avg_attendance = db.Column(db.Integer, default=0, nullable=False)
    comments = db.Column(db.Text, nullable=True)


class ReportExtra(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    number = db.Column(db.Integer, default=0, nullable=False)


class ReportComment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey("report.id"), nullable=False)
    comment = db.Column(db.Text, nullable=True)


class CityReportOverride(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=True)
    report_type = db.Column(db.String(20), nullable=False)
    # Optionally, you can add zone_id if you want per-zone overrides
    # zone_id = db.Column(db.Integer, db.ForeignKey("zone.id"), nullable=True)
    section = db.Column(
        db.String(50), nullable=False
    )  # e.g., 'header', 'organizational', etc.
    field = db.Column(
        db.String(50), nullable=False
    )  # e.g., 'total_muallima', 'comments', etc.
    value = db.Column(db.Text, nullable=True)


@login_manager.user_loader
def load_user(user_id):
    return (
        db.session.query(People)
        .options(joinedload(People.zone))
        .filter(People.id == int(user_id))
        .first()
    )

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any

@dataclass
class HeaderObj:
    responsible_name: Optional[str] = None
    thana: Optional[int] = None
    ward: Optional[int] = None
    total_muallima: int = 0
    muallima_increase: int = 0
    muallima_decrease: int = 0
    certified_muallima: int = 0
    certified_muallima_taking_classes: int = 0
    trained_muallima: int = 0
    trained_muallima_taking_classes: int = 0
    total_unit: int = 0
    units_with_muallima: int = 0

@dataclass
class CommentsObj:
    comment: Optional[str] = None

@dataclass
class AggReport:
    header: Optional[HeaderObj] = None
    courses: List[Dict[str, Any]] = field(default_factory=list)
    organizational: List[Dict[str, Any]] = field(default_factory=list)
    personal: List[Dict[str, Any]] = field(default_factory=list)
    meetings: List[Dict[str, Any]] = field(default_factory=list)
    extras: List[Dict[str, Any]] = field(default_factory=list)
    comments: Optional[CommentsObj] = None


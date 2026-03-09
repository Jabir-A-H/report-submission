from extensions import db
from models import Report, CityReportOverride, ReportComment

class ReportRepository:
    """Data Access Object for Report queries."""
    
    @staticmethod
    def get_paginated(page, per_page):
        from sqlalchemy.orm import joinedload
        return (
            Report.query.options(joinedload(Report.zone))
            .order_by(Report.id.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

    @staticmethod
    def get_by_id(report_id):
        return Report.query.filter_by(id=report_id).first()

    @staticmethod
    def get_singular(zone_id, month, year, report_type="মাসিক"):
        query = Report.query.filter_by(zone_id=zone_id, year=year, report_type=report_type)
        if report_type == "মাসিক" and month is not None:
            query = query.filter_by(month=month)
        return query.first()

    @staticmethod
    def get_city_aggregated(year, months, report_type):
        query = Report.query.filter_by(year=year, report_type=report_type)
        if months:
            query = query.filter(Report.month.in_(months))
        return query.all()

    @staticmethod
    def get_multiple_by_zone(zone_id, year, report_type="মাসিক", months=None):
        query = Report.query.filter_by(zone_id=zone_id, year=year, report_type=report_type)
        if report_type == "মাসিক" and months:
            query = query.filter(Report.month.in_(months))
        return query.all()

    @staticmethod
    def save(report):
        db.session.add(report)
        db.session.commit()
        return report

class OverrideRepository:
    """DAO for CityReportOverride queries."""
    
    @staticmethod
    def get_override(year, month, report_type, section, field):
        return CityReportOverride.query.filter_by(
            year=year,
            month=month,
            report_type=report_type,
            section=section,
            field=field,
        ).first()

    @staticmethod
    def get_all_for_period(year, month, report_type):
        query = CityReportOverride.query.filter_by(year=year, report_type=report_type)
        if month:
            query = query.filter_by(month=month)
        else:
            query = query.filter(CityReportOverride.month.is_(None))
        return query.all()

    @staticmethod
    def save(override):
        db.session.add(override)
        db.session.commit()
        return override

class CommentRepository:
    """DAO for ReportComment."""
    
    @staticmethod
    def save(comment):
        db.session.add(comment)
        db.session.commit()
        return comment

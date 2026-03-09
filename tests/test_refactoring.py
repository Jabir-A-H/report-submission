import pytest
from app import create_app
from extensions import db, ma
from models import Zone, Report, ReportHeader, ReportCourse
from services.report_aggregator import generate_city_report_data
from services.excel_export import generate_excel_file
from repositories.report_repository import ReportRepository

def test_marshmallow_pandas_pipeline(app):
    with app.app_context():
        # 1. Arrange Data
        zone = Zone(name="Test Zone")
        db.session.add(zone)
        db.session.commit()
        
        report = Report(month=1, year=2026, zone_id=zone.id, report_type="মাসিক")
        db.session.add(report)
        db.session.flush() # flush to get report id
        header = ReportHeader(report_id=report.id, responsible_name="Test Name", thana="1", ward="1", total_muallima=10)
        course = ReportCourse(report_id=report.id, category="সাধারণদের", number=5)
        
        db.session.add_all([header, course])
        db.session.commit()
        
        # 2. Act on Aggregation Pipeline
        try:
            data = generate_city_report_data(2026, 1, "মাসিক")
            assert data is not None
            assert data['year'] == 2026
            assert data['month'] == 1
            # Total zones should be 1
            assert data['total_zones'] == 1
            
            # Check city summary mapping
            assert data['city_summary']['total_muallima'] == 10
            
            # Check courses aggregation
            general_course = next((c for c in data['city_courses'] if c['category'] == "সাধারণদের"), None)
            assert general_course is not None
            assert general_course['number'] == 5
        except Exception as e:
            pytest.fail(f"Aggregation logic crashed: {str(e)}")
            
        # 3. Act on Excel Pipeline
        try:
            reports = ReportRepository.get_city_aggregated(2026, [1], "মাসিক")
            excel_bytes = generate_excel_file(reports, "মাসিক")
            assert excel_bytes is not None
            assert len(excel_bytes.getvalue()) > 0
        except Exception as e:
            pytest.fail(f"Excel Export logic crashed: {str(e)}")


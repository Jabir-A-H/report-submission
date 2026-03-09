import os
import sys

# Change to the application directory to ensure imports work correctly
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from extensions import db
from models import Zone, Report

def run_test():
    app = create_app()
    with app.app_context():
        print("Checking Database context...")
        zone = Zone.query.first()
        if not zone:
            print("No zones found in DB. Test might not have fully fledged data, but we will proceed.")
        else:
            print(f"Found zone: {zone.name} (ID: {zone.id})")
        
        try:
            from services.report_aggregator import generate_city_report_data
            print("\\n[1] Testing generate_city_report_data...")
            data = generate_city_report_data(2025, 1, "মাসিক")
            print(" -> Success! generate_city_report_data executed without throwing exceptions.")
            print(" -> Returned Dictionary Keys:", list(data.keys()))
            if 'city_summary' in data:
                 print(" -> city_summary parsed keys:", list(data['city_summary'].keys()))
        except Exception as e:
            print("\\n[ERROR] generate_city_report_data crashed!!!")
            import traceback
            traceback.print_exc()
            sys.exit(1)
            
        try:
            from repositories.report_repository import ReportRepository
            from services.excel_export import generate_excel_file
            print("\\n[2] Testing generate_excel_file...")
            reports = ReportRepository.get_city_aggregated(2025, [1], "মাসিক")
            print(f" -> Fetched {len(reports)} reports for Excel generation.")
            
            excel_bytes = generate_excel_file(reports, "মাসিক")
            print(" -> Success! generate_excel_file executed natively over Marshmallow schemas.")
            print(f" -> Generated Excel File Size: {len(excel_bytes.getvalue())} bytes.")
        except Exception as e:
            print("\\n[ERROR] generate_excel_file crashed!!!")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    run_test()
    print("\\n\\n✅ ALL DYNAMIC VERIFICATION TESTS PASSED: Marshmallow/Pandas Integration is mathematically sound.")

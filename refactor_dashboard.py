import os

def main():
    with open("routes/reports.py", "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    in_dashboard = False
    dashboard_lines = []

    for line in lines:
        if line.startswith('@reports_bp.route("/dashboard")'):
            in_dashboard = True
            continue
        if in_dashboard and line.startswith('@login_required'):
            continue
        if in_dashboard and line.startswith('def dashboard():'):
            continue
        
        if in_dashboard:
            # Check if we've reached the next route
            if line.startswith('@reports_bp.route') or (line.startswith('def ') and not line.startswith('    def ')):
                in_dashboard = False
                
                # Now build the class
                new_lines.append("class DashboardView(MethodView):\n")
                new_lines.append("    decorators = [login_required]\n\n")
                new_lines.append("    def get(self):\n")
                for d_line in dashboard_lines:
                    if d_line.strip() == "":
                        new_lines.append(d_line)
                    else:
                        new_lines.append("    " + d_line)
                new_lines.append("reports_bp.add_url_rule('/dashboard', view_func=DashboardView.as_view('dashboard'))\n\n")
                new_lines.append(line)
            else:
                dashboard_lines.append(line)
        else:
            new_lines.append(line)

    if in_dashboard:
        new_lines.append("class DashboardView(MethodView):\n")
        new_lines.append("    decorators = [login_required]\n\n")
        new_lines.append("    def get(self):\n")
        for d_line in dashboard_lines:
            if d_line.strip() == "":
                new_lines.append(d_line)
            else:
                new_lines.append("    " + d_line)
        new_lines.append("reports_bp.add_url_rule('/dashboard', view_func=DashboardView.as_view('dashboard'))\n\n")

    # Add necessary top-level imports safely
    imports_to_add = []
    if not any('from flask.views import MethodView' in line for line in new_lines):
        imports_to_add.append('from flask.views import MethodView\n')
    if not any('import traceback' in line for line in new_lines):
        imports_to_add.append('import traceback\n')
    if not any('import psycopg2' in line for line in new_lines):
        imports_to_add.append('import psycopg2\n')
    if not any('joinedload' in line for line in new_lines) and any('joinedload' in line for line in dashboard_lines):
        imports_to_add.append('from sqlalchemy.orm import joinedload\n')

    for i, line in enumerate(new_lines):
        if line.startswith('from flask import'):
            for imp in reversed(imports_to_add):
                new_lines.insert(i + 1, imp)
            break

    with open("routes/reports.py", "w", encoding="utf-8") as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    main()

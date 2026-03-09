import os

def main():
    with open("routes/reports.py", "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    in_target = False
    target_lines = []

    for line in lines:
        if line.startswith('@reports_bp.route("/city_report"'):
            in_target = True
            continue
        if in_target and line.startswith('@login_required'):
            continue
        if in_target and line.startswith('def city_report_page():'):
            continue
        
        if in_target:
            if line.startswith('@reports_bp.route') or (line.startswith('def ') and not line.startswith('    def ')):
                in_target = False
                
                new_lines.append("class CityReportView(MethodView):\n")
                new_lines.append("    decorators = [login_required]\n\n")
                new_lines.append("    def get(self):\n")
                for d_line in target_lines:
                    if d_line.strip() == "":
                        new_lines.append(d_line)
                    else:
                        new_lines.append("    " + d_line)
                new_lines.append("\n    def post(self):\n")
                new_lines.append("        return self.get()\n\n")
                new_lines.append("reports_bp.add_url_rule('/city_report', view_func=CityReportView.as_view('city_report_page'))\n\n")
                new_lines.append(line)
            else:
                target_lines.append(line)
        else:
            new_lines.append(line)

    if in_target:
        new_lines.append("class CityReportView(MethodView):\n")
        new_lines.append("    decorators = [login_required]\n\n")
        new_lines.append("    def get(self):\n")
        for d_line in target_lines:
            if d_line.strip() == "":
                new_lines.append(d_line)
            else:
                new_lines.append("    " + d_line)
        new_lines.append("\n    def post(self):\n")
        new_lines.append("        return self.get()\n\n")
        new_lines.append("reports_bp.add_url_rule('/city_report', view_func=CityReportView.as_view('city_report_page'))\n\n")

    with open("routes/reports.py", "w", encoding="utf-8") as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    main()

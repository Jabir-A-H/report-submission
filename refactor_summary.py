import os

def main():
    with open("routes/reports.py", "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    in_target = False
    target_lines = []

    for line in lines:
        if line.startswith('@reports_bp.route("/report")'):
            in_target = True
            continue
        if in_target and line.startswith('@login_required'):
            continue
        if in_target and line.startswith('def report_summary():'):
            continue
        
        if in_target:
            if line.startswith('@reports_bp.route') or (line.startswith('def ') and not line.startswith('    def ')):
                in_target = False
                
                new_lines.append("class ReportSummaryView(MethodView):\n")
                new_lines.append("    decorators = [login_required]\n\n")
                new_lines.append("    def get(self):\n")
                for d_line in target_lines:
                    if d_line.strip() == "":
                        new_lines.append(d_line)
                    else:
                        new_lines.append("    " + d_line)
                new_lines.append("\nreports_bp.add_url_rule('/report', view_func=ReportSummaryView.as_view('report_summary'))\n\n")
                new_lines.append(line)
            else:
                target_lines.append(line)
        else:
            new_lines.append(line)

    if in_target:
        new_lines.append("class ReportSummaryView(MethodView):\n")
        new_lines.append("    decorators = [login_required]\n\n")
        new_lines.append("    def get(self):\n")
        for d_line in target_lines:
            if d_line.strip() == "":
                new_lines.append(d_line)
            else:
                new_lines.append("    " + d_line)
        new_lines.append("\nreports_bp.add_url_rule('/report', view_func=ReportSummaryView.as_view('report_summary'))\n\n")

    with open("routes/reports.py", "w", encoding="utf-8") as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    main()

import os

def extract():
    with open('routes/reports.py', 'r', encoding='utf-8') as f:
        lines: list[str] = f.readlines()

    # The Excel generation logic is lines 1853 to 2269
    # Lines are 0-indexed in python list.
    excel_logic = lines[1852:2269]

    # 1. Services: excel_export.py
    with open('services/excel_export.py', 'w', encoding='utf-8') as f:
        f.write("import io\n")
        f.write("import pandas as pd\n")
        f.write("\n")
        f.write("def generate_excel_file(reports, report_type):\n")
        f.write("    data = []\n")
        f.write("    # Add empty spacer\n")
        # Removing the 4 space indentation to line it up inside the funtion because it was at 4 spaces
        for line in excel_logic:
            # If line starts with 4 spaces and is not empty, it stays at 4 spaces. 
            # In the original file, it ranges from 4 to 24 spaces indentation because it's inside download_excel().
            f.write(line)
        f.write("\n")
        f.write("    return output\n")

    # Now remove the internal logic from routes/reports.py
    # Delete from 1852 to 2269
    del lines[1852:2269]

    # Insert the new code block
    replacement = [
        "    from services.excel_export import generate_excel_file\n",
        "    output = generate_excel_file(reports, report_type)\n"
    ]
    for idx, repl_line in enumerate(replacement):
        lines.insert(1852 + idx, repl_line)

    with open('routes/reports.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("Excel extraction successful.")

if __name__ == "__main__":
    extract()

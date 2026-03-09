import os

def fix():
    # 1. Read routes/reports.py and extract lines 20-47 (inclusive)
    with open('routes/reports.py', 'r', encoding='utf-8') as f:
        rep_lines = f.readlines()
    
    dataclass_code = "".join(rep_lines[19:48])  # 20 to 48 in 1-based indexing
    
    # Remove from routes/reports.py
    del rep_lines[19:48]
    
    # Add import to routes/reports.py at line 12 (or just the top)
    # We will just insert it after 'from extensions import db, cache' near line 10
    rep_lines.insert(10, "from models import HeaderObj, CommentsObj, AggReport\n")
    
    with open('routes/reports.py', 'w', encoding='utf-8') as f:
        f.writelines(rep_lines)
        
    # 2. Append to models.py
    with open('models.py', 'a', encoding='utf-8') as f:
        f.write("\n")
        f.write("from dataclasses import dataclass, field\n")
        f.write("from typing import Dict, List, Optional, Any\n")
        f.write("\n")
        f.write(dataclass_code)
        
    # 3. Fix services/report_aggregator.py
    with open('services/report_aggregator.py', 'r', encoding='utf-8') as f:
        agg_lines = f.readlines()
        
    for i, line in enumerate(agg_lines):
        if "from routes.reports import AggReport, HeaderObj, CommentsObj" in line:
            agg_lines[i] = "from models import AggReport, HeaderObj, CommentsObj\n"
            
    with open('services/report_aggregator.py', 'w', encoding='utf-8') as f:
        f.writelines(agg_lines)
        
    print("Circular import fixed.")

if __name__ == "__main__":
    fix()

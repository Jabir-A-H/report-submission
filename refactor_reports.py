import re
import os

with open("app.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
new_lines.append("from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, send_file, current_app\n")
new_lines.append("from flask_login import login_required, current_user\n")
new_lines.append("from extensions import db, cache\n")
new_lines.append("from models import *\n")
new_lines.append("from utils import *\n")
new_lines.append("from datetime import datetime\n")
new_lines.append("import io\n")
new_lines.append("import os\n")
new_lines.append("import psycopg2\n")
new_lines.append("\nreports_bp = Blueprint('reports', __name__)\n\n")

for i, line in enumerate(lines):
    line_num = i + 1
    
    # Skip preamble up to dashboard (Starts at 593)
    if line_num <= 590:
        continue
        
    # Skip auth/admin routes (796 to 965)
    if 796 <= line_num <= 965:
        continue

    # Skip error handler in reports.py (4492 to 4499)
    if 4492 <= line_num <= 4499:
        continue
        
    # Change app.route to reports_bp.route
    if line.startswith("@app.route"):
        line = line.replace("@app.route", "@reports_bp.route")
        
    # Fix url_for calls where necessary. 
    # "dashboard" -> "reports.dashboard"
    # "login" -> "auth.login"
    # "register" -> "auth.register"
    # "admin_zones" -> "admin.admin_zones"
    # "admin_users" -> "admin.admin_users"
    # Note: Flask allows url_for within same blueprint to omit the prefix, but for cross-blueprint we need it.
    line = re.sub(r'url_for\(\s*["\']login["\']\s*\)', 'url_for("auth.login")', line)
    line = re.sub(r'url_for\(\s*["\']register["\']\s*\)', 'url_for("auth.register")', line)
    line = re.sub(r'url_for\(\s*["\']admin_zones["\']\s*\)', 'url_for("admin.admin_zones")', line)
    line = re.sub(r'url_for\(\s*["\']admin_users["\']\s*\)', 'url_for("admin.admin_users")', line)
    line = re.sub(r'url_for\(\s*["\']dashboard["\']\s*\)', 'url_for("reports.dashboard")', line)
    
    # Replace app.logger with current_app.logger
    line = line.replace("app.logger.", "current_app.logger.")
    
    new_lines.append(line)

with open("routes/reports.py", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Created routes/reports.py")

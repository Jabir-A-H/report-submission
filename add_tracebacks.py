import re
import os

filepath = 'f:/WebDev/report-submission/app.py'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if 'import traceback' not in content:
    content = content.replace('import os', 'import os\nimport traceback', 1)

# Only add traceback.print_exc() to blocks that don't already have it
def add_traceback(match):
    prefix = match.group(1)
    block = match.group(0)
    if 'traceback.print_exc()' not in block:
        return prefix + 'except Exception as e:\n' + prefix + '    traceback.print_exc()\n'
    return block

# Find \bexcept Exception as e:\n\s+... and just add traceback right after
new_content = re.sub(r'(?sm)^(\s*)except Exception as e:\n', add_traceback, content)

# Check operational error too
def add_traceback_op(match):
    prefix = match.group(1)
    block = match.group(0)
    if 'traceback.print_exc()' not in block:
        return prefix + 'except psycopg2.OperationalError as e:\n' + prefix + '    traceback.print_exc()\n'
    return block
new_content = re.sub(r'(?sm)^(\s*)except psycopg2\.OperationalError as e:\n', add_traceback_op, new_content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Replaced {content.count('except Exception as e:')} exception blocks.")

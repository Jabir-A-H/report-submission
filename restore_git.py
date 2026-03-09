import os
import zlib

def read_git_object(hexsha):
    path = os.path.join('.git', 'objects', hexsha[:2], hexsha[2:])
    with open(path, 'rb') as f:
        data = zlib.decompress(f.read())
    # obj_type, size, content
    null_idx = data.find(b'\\x00')
    return data[null_idx+1:].decode('utf-8', errors='ignore')

def search_commits_for_file():
    # Read HEAD
    with open('.git/logs/HEAD', 'r') as f:
        logs = f.readlines()
        if not logs: return
        
        last_log = logs[-1].split()
        commit_hash = last_log[1]
        print(f"Latest commit: {commit_hash}")
        
    # Checkout via command line didn't work, let's just use python directly to run a simple git command if it exists in another path.
    import subprocess
    git_paths = [
        "C:\\\\Program Files\\\\Git\\\\cmd\\\\git.exe",
        "C:\\\\Program Files\\\\Git\\\\bin\\\\git.exe",
        "git"
    ]
    for p in git_paths:
        try:
            res = subprocess.run([p, "show", f"{commit_hash}:routes/reports.py"], capture_output=True, text=True)
            if res.returncode == 0:
                with open("restored_reports.py", "w", encoding="utf-8") as out:
                    out.write(res.stdout)
                print(f"Successfully recovered reports.py using git at {p}")
                return
        except FileNotFoundError:
            pass
            
    print("Could not find git. Try searching python site-packages for gitpython.")

search_commits_for_file()

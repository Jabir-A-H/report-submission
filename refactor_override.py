import os

def main():
    with open("routes/reports.py", "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    in_target = False
    target_lines = []

    for line in lines:
        if line.startswith('@reports_bp.route("/city_report/override"'):
            in_target = True
            continue
        if in_target and line.startswith('@login_required'):
            continue
        if in_target and line.startswith('def city_report_override():'):
            continue
        
        if in_target:
            if line.startswith('@reports_bp.route') or (line.startswith('def ') and not line.startswith('    def ')):
                in_target = False
                
                # Split target lines into POST and GET
                post_lines = []
                get_lines = []
                in_post = False
                common_prefix = []
                has_hit_post = False
                
                i = 0
                while i < len(target_lines):
                    l = target_lines[i]
                    if l.startswith('    if request.method == "POST":'):
                        has_hit_post = True
                        in_post = True
                        i += 1
                        continue
                        
                    if in_post:
                        if l.startswith('    # GET: show the override page'):
                            in_post = False
                            get_lines.append(l)
                        elif l.startswith('    month = request.args.get("month")') and not has_hit_post: # shouldn't happen
                            pass
                        elif l.startswith('    ') and not l.startswith('        ') and l.strip():
                            # back to 1 indent => end of POST. But wait, in python it could just be a comment.
                            if l.startswith('    # GET:'):
                                in_post = False
                                get_lines.append(l)
                            else:
                                if l.startswith('    return redirect'):
                                    in_post = False # Oh wait, post usually returns
                                    # Actually, let's just use the exact comment '    # GET: show the override page' as delimiter.
                    
                    if not has_hit_post:
                        common_prefix.append(l)
                    elif in_post:
                        post_lines.append(l[4:] if len(l) > 4 else l) # dedent 1 level (4 spaces) because it was inside `if request.method == "POST":`
                    else:
                        get_lines.append(l)
                    i += 1


                new_lines.append("class CityReportOverrideView(MethodView):\n")
                new_lines.append("    decorators = [login_required]\n\n")
                
                new_lines.append("    def post(self):\n")
                for c in common_prefix:
                    if c.strip(): new_lines.append("    " + c)
                    else: new_lines.append(c)
                for p in post_lines:
                    if p.strip(): new_lines.append("    " + p)
                    else: new_lines.append(p)
                
                new_lines.append("\n    def get(self):\n")
                for c in common_prefix:
                    if c.strip(): new_lines.append("    " + c)
                    else: new_lines.append(c)
                for g in get_lines:
                    if g.strip(): new_lines.append("    " + g)
                    else: new_lines.append(g)

                new_lines.append("reports_bp.add_url_rule('/city_report/override', view_func=CityReportOverrideView.as_view('city_report_override'))\n\n")
                new_lines.append(line)
            else:
                target_lines.append(line)
        else:
            new_lines.append(line)

    if in_target:
        pass # Not handling EOF since the file doesn't end with override.

    with open("routes/reports.py", "w", encoding="utf-8") as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    main()

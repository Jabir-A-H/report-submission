from extensions import db
from flask import flash, current_app
from utils import normalize_cat, slugify



# --- DRY Section POST Handler ---
def handle_section_post(report, section_attr, categories, fields, form_data):
    section_list = getattr(report, section_attr)
    model = section_list[0].__class__ if section_list else None
    # Normalize all categories for robust matching
    # Always use normalized categories and slugs
    norm_categories = [normalize_cat(cat) for cat in categories]
    slugs = [slugify(cat) for cat in norm_categories]
    slug_to_cat = {slug: cat for slug, cat in zip(slugs, norm_categories)}
    cat_to_slug = {cat: slug for cat, slug in zip(norm_categories, slugs)}
    # Map DB rows by slug for robust matching
    db_rows_by_slug = {slugify(normalize_cat(r.category)): r for r in section_list}
    for slug, cat in slug_to_cat.items():
        row = db_rows_by_slug.get(slug)
        if not row and model:
            print(f"[DEBUG] Creating new row for category: {cat} (slug: {slug})")
            row = model(report_id=report.id, category=cat)
            db.session.add(row)
        if row:
            for field in fields:
                form_key = f"{field}_{slug}"
                value = form_data.get(form_key)
                print(
                    f"[DEBUG] Field: {field}, Slug: {slug}, Form Key: {form_key}, Value: {value}"
                )
                if value is not None:
                    col_type = getattr(row.__class__, field).type
                    if isinstance(col_type, db.Integer):
                        value = int(value) if value else 0
                    elif isinstance(col_type, db.String):
                        value = value.strip() or None
                    print(
                        f"[DEBUG] Setting {field} for category {cat} (slug: {slug}) to {value}"
                    )
                    setattr(row, field, value)
    db.session.commit()
    print("[DEBUG] Database commit complete for section_post.")


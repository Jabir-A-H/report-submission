# ADR-009: Zone Hierarchy (`zone_type` + `parent_id`) & Admin Site Restructure

## Status

Accepted — Pending Implementation

## Date

2026-07-16

## Context

### Zone Identity Problem

During an admin site audit (2026-07-16), it was discovered that **ডি সি এস (DCS — Dhaka City South, zone_id = 1)** was being treated architecturally as a regular reporting zone when it is actually the **city-level administrative entity** whose report is derived by aggregating all underlying zone reports.

Confirmed from legacy Python/Flask system (`legacy/repositories/report_repository.py`): `get_city_aggregated()` fetched ALL reports with no `zone_id` filter, then used pandas `SUM` aggregation across them. There was never a "save totals to zone 1" pattern — DCS has always been the city, not a data-entry zone.

**Problems this caused in the current Next.js system:**

1. All `view_city_*_agg` Postgres views have no `zone_id` filter. If a report exists for `zone_id = 1`, it is included in the city SUM — causing a **self-reference loop** where DCS data inflates the city total.

2. Both admins (superadmin Jabir and admin Jetsky) are assigned `zone_id = 1`. Visiting `/report/[section]?type=monthly&month=7&year=2026` as an admin does **not** check role — it fetches `zone_id` from the admin's profile (1) and auto-creates/opens a DCS zone report with full data-entry forms. This is `WEB-006`.

3. The accidental report `id=36` for zone_id=1, July 2026 was created this way and its (likely empty) data is currently being included in city aggregation.

### Admin Site Fragmentation Problem

The admin area had grown to 7 separate routes with significant duplication:
- **3 dashboards**: `/` (AdminDashboard component), `/admin/dashboard` (KPI analytics page), `/admin/city-report` (aggregated report, acts as a 3rd analytical view)
- **2 report list pages**: `/admin/reports` (simple table) and `/admin/zone-reports` (paginated, filtered — same data, better UI)
- **2 user management pages**: `/admin/users` (full management) and `/admin/approval` (subset of users, approval-only — 100% duplicate)
- **Nav collision**: Root `<Navbar>` and `<BottomNav>` rendered on all `/admin/*` routes simultaneously with the admin sidebar, because no pathname exclusion existed for `/admin`.
- **6+ `useMemo` violations**: `createClient()` called without `useMemo` in every admin page, violating `TECHNICAL_MANUAL.md §1.3`.

### Future Scale Consideration

The system is designed to eventually support a 4-tier organizational hierarchy (City → Zone → Thana → Ward). The current flat `zone` table with only `id` and `name` columns has no structural support for this. Hardcoding `zone_id != 1` in aggregation views would be brittle — a named type system is required.

## Decision Drivers

- DCS must be excluded from zone-level report submission (it is the city, not a zone)
- City aggregation views must exclude DCS to prevent self-reference
- Admin visiting `/report` with DCS selected should see aggregated city data (read-only), not a data-entry form
- Admin visiting `/report/[section]` should be blocked entirely (no data entry for admins)
- The admin UI must be streamlined to 4 necessary pages, no luxury items yet
- Zone hierarchy must be structurally extensible to support future Thana/Ward levels without another migration

## Considered Options

### Zone Architecture

**Option A: Hardcode `zone_id != 1` in views**
- Pros: Zero migration, immediate fix
- Cons: Brittle — breaks if zone table changes; not self-documenting; blocks future hierarchy

**Option B: `zone_type` column only**
- Pros: Clean label, filter views by `zone_type != 'city'`
- Cons: No parent-child relationship — can't represent "which zone does this thana belong to" in the future

**Option C: `zone_type` + `parent_id` (self-referential)**
- Pros: Full hierarchy. Current zones get `parent_id = 1` (DCS). Future wards get `parent_id = <zone_id>`. Aggregation becomes `WHERE parent_id = X` instead of hardcoded IDs. Self-documenting.
- Cons: Slightly more complex zone management UI (parent selector on create)

### Admin Site Structure

**Option A: Keep 7 routes, patch individually**
- Rejected: Addresses symptoms, not the structural problem

**Option B: 4 necessary pages only, no dashboard landing**
- Considered: User requested a dashboard landing be kept as a navigation entry point

**Option C: Simple dashboard landing + 4 tool pages**
- Selected: Dashboard is a navigation card grid (no DB queries, no analytics). 4 tool pages cover all necessary admin functions.

## Decision

### 1. Zone Table: Add `zone_type` + `parent_id`

```sql
ALTER TABLE zone ADD COLUMN zone_type TEXT NOT NULL DEFAULT 'zone';
ALTER TABLE zone ADD COLUMN parent_id INTEGER REFERENCES zone(id);

-- DCS is the city
UPDATE zone SET zone_type = 'city', parent_id = NULL WHERE id = 1;

-- All current zones are children of DCS
UPDATE zone SET zone_type = 'zone', parent_id = 1 WHERE id != 1;
```

**`zone_type` values (current):** `'city'`, `'zone'`
**`zone_type` values (future, names TBD):** `'thana'`, `'ward'`, `'unit'`

Zone type names beyond `'city'` and `'zone'` are not finalized. The column is free-text (not an enum) intentionally so future values can be added without a schema migration.

### 2. Update All `view_city_*_agg` Postgres Views

Replace unconditional joins with a filter that excludes `zone_type = 'city'`:

```sql
-- Example for view_city_header_agg (all 6 views follow same pattern):
CREATE OR REPLACE VIEW view_city_header_agg AS
SELECT r.year, r.month, r.report_type, ...SUM fields...
FROM report r
JOIN report_header rh ON r.id = rh.report_id
JOIN zone z ON r.zone_id = z.id
WHERE z.zone_type != 'city'   -- ← excludes DCS from the sum
GROUP BY r.year, r.month, r.report_type;
```

### 3. Admin Site: 5 Pages (Dashboard Landing + 4 Tool Pages)

**Final admin route map:**

| Route | Purpose |
|:---|:---|
| `/admin` | Dashboard landing — 3 navigation cards, no DB queries |
| `/admin/reports` | Paginated, filtered list of all zone-submitted reports |
| `/admin/city-report` | Aggregated city report (read) + inline override editing |
| `/admin/management` | Tab 1: Users (approve/deactivate/reassign/delete) · Tab 2: Zones (add/rename/delete) |

**Deleted routes:** `/admin/dashboard`, `/admin/approval`, `/admin/zone-reports`, `/admin/zones`, `/admin/users`

**Deleted component:** `src/components/dashboard/admin-dashboard.tsx`

### 4. Fix `WEB-006`: Admin Role Guard on `/report/[section]`

Add role check in `src/app/report/[section]/page.tsx` after profile fetch:

```typescript
if (person.role === 'admin' || person.role === 'superadmin') {
  router.replace('/admin');
  return;
}
```

### 5. DCS Zone in `/report` Page: Show Aggregated Data

When an admin selects DCS (zone_type = 'city') in the `/report` zone dropdown:
- Do NOT query `report WHERE zone_id = 1`
- Instead query the `view_city_*_agg` views for the selected period
- Render read-only (no edit buttons, no "go to section" buttons)
- This gives the admin a clean read-only city report view from `/report`, while `/admin/city-report` remains the override-specific page

### 6. Nav Collision Fix & Unified Navigation Architecture

Instead of rendering a disconnected left sidebar on desktop or a hamburger drawer on mobile, `<Navbar>` and `<BottomNav>` dynamically adapt to the user's role across the entire application:
- **Desktop (`Navbar`)**: For admins or when inside `/admin/*`, the top header displays the 4 core admin links (`ড্যাশবোর্ড`, `জমাকৃত রিপোর্ট`, `সিটি রিপোর্ট`, `ব্যবস্থাপনা`) right inside the top navigation bar alongside `UserDropdown`.
- **Mobile (`BottomNav`)**: For admins, the bottom navigation bar dynamically shifts from 3 tabs (`grid-cols-3`) to a sleek 5-tab grid (`grid-cols-5`): `ড্যাশবোর্ড`, `জমাকৃত`, `সিটি`, `ব্যবস্থাপনা`, and `প্রোফাইল` (slide-up panel with Theme, Language, Help, and Logout).
- **Admin Shell (`/admin/layout.tsx`)**: Renders as a full-width container without `AdminSidebar.tsx` or separate mobile headers.

### 7. Root `/` Admin Redirect

`src/app/page.tsx`: when `isAdmin === true`, `redirect('/admin')` instead of rendering `<AdminDashboard />`.

### 8. Clean Up Accidental DCS Report

Delete `report.id = 36` (zone_id=1, July 2026 — accidentally created via admin visiting the data-entry form). Once views exclude `zone_type = 'city'`, this is harmless but should be cleaned up.

## Consequences

### Positive
- DCS is structurally identified as `city` type — no hardcoded IDs anywhere in application code or views
- City aggregation views are self-correcting regardless of which zone_id the city is assigned
- Admin cannot accidentally enter data through the zone manager's data-entry forms
- Future tier expansion (Thana, Ward) requires only new rows in `zone` table with appropriate `zone_type` and `parent_id` — no schema migration needed
- Admin UI is reduced from 7 fragmented routes to 5 clean, purposeful pages
- Nav collision eliminated: public navbar is completely absent from all `/admin/*` routes

### Negative
- Zone management page (`/admin/management` → Zones tab) must show `zone_type` and `parent_id` in its UI, adding minor complexity
- Existing report `id=36` for DCS must be cleaned up manually (one-time operation)
- `view_city_*_agg` all 6 views must be recreated (safe, non-destructive DDL change)

### Risks
- `parent_id` column is self-referential (`REFERENCES zone(id)`). Deleting a parent zone while child zones exist would violate FK constraint. The zone deletion guard (currently checks `user_count > 0`) must also check `child_zone_count > 0`.
- Zone type names (`'thana'`, `'ward'`, etc.) are deferred — the column allows any string. Application code should treat `zone_type != 'city'` as "reportable zone" rather than pattern-matching specific names.

## Implementation Notes & Migration Staging Protocol

### 1. Staged Database Migration (To Be Applied Later After User Adoption)
> [!IMPORTANT]
> **Rollout Governance**: Execution of this SQL migration on the live database (`pxdkvewaglagnfcqeckn`) and porting the reporting tree one level down (from `Zone` to `Thana` level) are **deliberately staged for a later rollout phase**. We must first ensure that our current users get completely accustomed to and confident with the newly established 2-tier system (`City → Zone`). Only after stable user adoption is achieved will we execute this DDL query and port down to the next hierarchical tier.

When the application hierarchy is officially ported down one level (`Zone → Thana`), the following SQL DDL migration must be applied atomically via `apply_migration` (or Supabase SQL Editor):
```sql
ALTER TABLE zone ADD COLUMN IF NOT EXISTS zone_type TEXT NOT NULL DEFAULT 'zone';
ALTER TABLE zone ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES zone(id);
```

### 2. Frontend Schema Resilience & Fallback Protocol
During systematic debugging of `ManagementPage` (`src/app/admin/management/page.tsx`), it was observed that explicitly selecting `select("id, name, zone_type, parent_id")` against an unmigrated database threw Postgres Error `42703 (undefined_column)`, resulting in `zonesData === null` and an empty zone list UI (`0 items`).
To permanently prevent schema-transition breakage:
- **Resilient Querying**: Both `fetchUsers` and `fetchZones` use `supabase.from("zone").select("*")`. When `zone_type` and `parent_id` are absent in Postgres, the query succeeds returning existing columns without error. Once the migration runs, the extra columns are automatically captured and rendered in the UI.
- **Fallback Insertion (`42703` Trap)**: `addZone()` attempts insertion with `{ name, zone_type, parent_id }` first. If Postgres throws error code `42703`, the function catches it and automatically retries inserting with just `{ name }`.

### 3. General Implementation Checklist
- Delete `report.id = 36` before updating views (to avoid transient inclusion)
- Migration must be an `apply_migration` via Supabase MCP — not applied ad-hoc
- All 6 `view_city_*_agg` views must be updated atomically
- `view_city_course_final` (which wraps `view_city_course_agg`) will automatically pick up the fix since it reads from the base view

## Related Decisions

- ADR-002: Core Reliability Stabilization First — establishes the pattern of fixing structural issues before features
- ADR-003: Postgres Trigger Synchronized Profiles — same principle of using DB-level correctness guarantees
- ADR-005: Hybrid State Persistence — context for the URL-only state pattern carried forward in the admin routes

## References

- `legacy/repositories/report_repository.py` — confirms DCS was never a data-entry zone
- `docs/KNOWN_ISSUES.md` — `WEB-006` admin form access bug
- Supabase project: `pxdkvewaglagnfcqeckn`
- Current zone data: 14 zones, id 1 = ডি সি এস (DCS), ids 2–14 = reporting zones

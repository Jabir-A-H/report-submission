# Pre-Production Schema & Dead-Weight Cleanup Backlog (Rule 7 Audit)

**Status**: Deferred for Further Evaluation (Documented per Owner Directive on 2026-11-07)  
**Context**: Re-evaluating past compromises through `AGENTS.md` Rule 7 (Pre-Production Agility & Zero Dead-Weight). In active pre-production development with zero live field workers, clean DDL updates and dead-object drops should supersede application-layer workarounds and backward-compatibility shims.

---

## 1. Backlog Inventory for Later Evaluation

### Item 1: Direct `month` Column on `report_header` (RS-03)
- **Problem**: `report_header` lacks a `month` column; `month` lives on parent `report`. In multi-month aggregations, `sumHeaderRows` needs chronological month sorting for stock/inventory snapshot metrics (`total_muallima`, `total_unit`, etc.).
- **Evaluated Workaround**: Map `month` in the frontend/route query layer via JavaScript object attachment.
- **Clean DDL Proposal**:
  ```sql
  ALTER TABLE public.report_header ADD COLUMN month smallint;
  UPDATE public.report_header rh 
    SET month = r.month 
    FROM public.report r 
    WHERE rh.report_id = r.id;
  ALTER TABLE public.report_header ALTER COLUMN month SET NOT NULL;
  ```
  Update `get_or_create_report` RPC to write `month` directly to `report_header`.

---

### Item 2: Permanent Dropping of Dead Database & Code Objects
- **`legacy_people`**: Currently secured with an RLS `deny_all` policy in ADR 023. Contains 18 rows of old migration data with plaintext password columns.
  - **Action**: `DROP TABLE public.legacy_people CASCADE;`
- **`handle_new_auth_user`**: Orphaned PostgreSQL function with 0 attached triggers.
  - **Action**: `DROP FUNCTION public.handle_new_auth_user() CASCADE;`
- **`view_city_course_final`**: Unused in application code; inner query lacks `o.report_type = agg.report_type`.
  - **Action**: `DROP VIEW public.view_city_course_final CASCADE;`
- **`src/components/auth/session-cleaner.tsx`**: Retained in ADR 020 with try/catch sandbox to clear a sessionStorage key eradicated in ADR 006.
  - **Action**: Delete `session-cleaner.tsx` and unmount from `src/app/home/page.tsx`.

---

### Item 3: DCS Zone 1 Entity & 2-Tier Hierarchy Migration (Phase 3.5 / ADR 009)
- **Problem**: DCS (`zone_id = 1`) is currently hardcoded as `WHERE r.zone_id <> 1` across all 6 SQL views (`view_city_*_agg`) and `if (zone_id === 1)` in frontend components.
- **Clean DDL Proposal**:
  ```sql
  ALTER TABLE public.zone ADD COLUMN zone_type text NOT NULL DEFAULT 'zone';
  ALTER TABLE public.zone ADD COLUMN parent_id integer REFERENCES public.zone(id);
  UPDATE public.zone SET zone_type = 'city' WHERE id = 1;
  ```
  Update SQL views to `JOIN zone z ON r.zone_id = z.id WHERE z.zone_type != 'city'`.
  Delete accidental report `report.id = 36` created for DCS.
  Replace magic number `zone_id === 1` checks in client code with `zone.zone_type === 'city'`.

---

### Item 4: Database String Standardization & Pruning Dual-String Shims
- **Problem**: `src/lib/report-utils.ts` retains dual-string fallback lookups (`find(r => r.category === cat || r.category === legacyMashq)`, `find(r => r.category === "সহযোগী হয়েছেন" || r.category === "সহযোগী হয়েছে")`) to support stale test rows.
- **Clean Action**:
  Run a 1-line SQL update to standardize all historical test rows to canonical Unicode NFC strings:
  ```sql
  UPDATE public.report_organizational SET category = 'সহযোগী হয়েছেন' WHERE category = 'সহযোগী হয়েছে';
  ```
  Delete all dual-string fallback shims from `report-utils.ts`.

---

### Item 5: Native Period Keying in `city_report_override`
- **Problem**: Multi-month overrides were mapped to `month = months[0]` (ADR 018), leading to custom range collisions (ADR 023 / KI-021).
- **Clean Action**: Now that `end_month` is present, cleanly pass `start_month` and `end_month` across `CorrectionButton`, `city-report/page.tsx`, and export routes without artificial single-month assumptions.

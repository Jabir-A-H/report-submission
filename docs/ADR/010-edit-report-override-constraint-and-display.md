# ADR 010: Edit Report Override Unique Constraint and Comparative Value Display Architecture

## Status

Accepted

## Context

During systematic auditing of the admin reporting subsystem, three primary issues and requirements were identified:
1. **Save Override Failure (`42P10`)**: When admins attempted to save data corrections via `CorrectionButton` (`supabase.from('city_report_override').upsert(...)`), PostgREST returned database error `42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification`. The table previously only possessed a primary key `id` without a composite unique constraint across the lookup dimensions (`year, month, report_type, section, field, category`). Furthermore, because `category` can be `NULL` (such as in header metrics), standard unique constraints do not treat multiple `NULL` values as identical unless configured explicitly.
2. **Page Naming and Workflow**: The `/admin/city-report` page ("সিটি রিপোর্ট") functioned primarily as an editing interface where admins override aggregated zone values for city-wide reporting. The explicit "override toggle" button (`ওভাররাইড করুন` / `ওভাররাইড বন্ধ করুন`) created unnecessary friction, as admins visiting the page almost exclusively intended to review and edit values.
3. **Comparative Value Transparency**: When a cell value was overridden, the UI displayed only the overridden number (`value`) inside an amber badge (`isOverridden`). Admins had no visual indicator on the table itself showing what the original aggregated (`computedValue`) value was prior to the override without clicking into the edit modal.

## Decision Drivers

* **Database-Level Data Integrity**: Must prevent duplicate override entries per field/period at the Postgres layer using deterministic constraints.
* **Resilient Upsert Logic**: Must ensure `category IS NULL` matches reliably during insert/update operations without relying purely on PostgREST composite `onConflict` quirks with `NULL`s.
* **Immediate Visual Feedback**: Must show both the original aggregated value and the newly edited override value on every modified cell across all reporting tables.
* **Streamlined Admin UX**: The page must be branded accurately as "এডিট রিপোর্ট" (`Edit Report`) and permanently remain in override mode (`isEditing = true`), removing redundant toggles.
* **Reversibility**: Admins must be able to cleanly delete/revert an override from inside the correction modal to restore the raw aggregated zone total.

## Considered Options

### Option 1: Application-Level Deduplication Only (Rejected)
- Rely solely on a `select` check before `insert` or `update` inside `CorrectionButton.tsx` without modifying database constraints.
- **Why Rejected**: Without a database-level unique constraint, race conditions or direct API calls could still insert duplicate override records, causing inconsistent aggregation and `.maybeSingle()` errors.

### Option 2: Postgres `UNIQUE NULLS NOT DISTINCT` Constraint + Check-Then-Update Logic + Dual Value Pill Display (Accepted)
- **Database Layer**: Add `ALTER TABLE public.city_report_override ADD CONSTRAINT city_report_override_unique_key UNIQUE NULLS NOT DISTINCT (year, month, report_type, section, field, category);` via Supabase SQL execution. This ensures `NULL` categories (e.g. `header` metrics) are treated as distinct keys while preventing duplicate overrides.
- **Component Layer (`CorrectionButton.tsx`)**: Implement explicit check-then-update/insert (`query.is('category', null)` when category is nullish) as primary logic, backed by `.upsert(..., { onConflict: 'year,month,report_type,section,field,category' })`. Add a `Trash2` ("মুছুন") button to allow removing existing overrides.
- **UI & Display Layer (`NumericCell` in `city-report/page.tsx`)**:
  - Rename page title and navigation tabs from "সিটি রিপোর্ট" (`City Report`) to "এডিট রিপোর্ট" (`Edit Report`).
  - Default `isEditing` state to `true` and replace the toggle button with a static indicator: `⚡ ওভাররাইড মোড সক্রিয়`.
  - When `isOverridden` is true, render a dual pill displaying:
    `[ <s>computedValue</s> newValue ]` (with the original value struck through and the override value bolded inside an amber highlight box).
- **React Compiler Compliance**: Define `NumericCell` and `CityReportContext` at the top level outside `CityReportPage()` to eliminate `react-hooks/static-components` (`Cannot create components during render`) errors.

## Consequences

### Positive
- Zero duplicate overrides or `42P10` database errors during save operations.
- Full transparency across all tables: admins immediately see both the original aggregated zone total (`computedValue`) and the overridden total (`newValue`) side-by-side.
- Clean one-click deletion/reversion of overrides directly from the correction modal.
- Zero extra clicks required to enter edit mode (`isEditing` defaults to `true`).

### Negative / Trade-offs
- The dual value pill (`[ <s>১২০</s> ১৫০ ]`) takes slightly more horizontal space inside table cells than a single number, requiring responsive scrolling on very narrow mobile viewports.

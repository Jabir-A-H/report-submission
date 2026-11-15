# Segment 01 Review: Data Integrity, Aggregation & Calculation Engines

**Target Codebase**: `talimul-quran-report-submission`  
**Auditor**: Subagent B (Adversarial Reviewer)  
**Standard**: Adversarial "Doubt Gate" (`AGENTS.md` Rules 2 & 6), Pre-Production Agility (`AGENTS.md` Rule 7), Zero Dead-Weight Policy  
**Scope**: Adversarial Cross-Examination of Subagent A's Investigation (`docs/issues-critique/segment-01-investigation.md`) covering RS-01–07, RS-27, KI-005, KI-006, KI-017, KI-021, C07-01, C06-02, and Backlog Items 1, 4, 5.

---

## 1. Adversarial Scorecard & Sanity Check

| Issue / Proposal | Subagent A Position | Subagent B Adversarial Finding | Sanity Verdict |
|:---|:---|:---|:---:|
| **`report_header.month` DDL Migration (RS-03 / Backlog Item 1)** | Recommends DDL: `ALTER TABLE report_header ADD COLUMN month smallint NOT NULL` to eliminate in-memory joins. | **HIGH RISK OF SCHEMA DRIFT**: Adding `month` to `report_header` introduces a 2nd source of truth and violates 3NF without a composite foreign key. `report_header` would be the *only* child table with `month`. Furthermore, `report/page.tsx` was broken simply because it bypassed [`loadReportDataBundle()`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L467-L490) and duplicated ~80 lines of raw queries. | **REJECT AS DOGMATIC DDL; ADOPT ARCHITECTURAL CONSOLIDATION** |
| **Override Range Isolation (RS-01, KI-021 / Backlog Item 5)** | Recommends wiring `end_month` into `CorrectionButton` and dropping `city_report_override_unique_key`. | **CONFIRMED DEFECT, BUT SUBAGENT A'S FIX IS INCOMPLETE**: Subagent A missed that `loadReportDataBundle()` queries `.in("month", months)` and keys `overrideMap` purely on `${section}:${field}:${cat}`. Overlapping custom ranges (e.g. Feb–Apr vs Feb–Jun) will STILL collide and clobber each other in memory unless period query boundaries are strictly locked to exact match. | **ACCEPTED WITH QUERY BOUNDARY HARDENING** |
| **Empty Override Zero-Clobbering (RS-02)** | Claims text comments bypass validation and `Number("") === 0` can clobber real numeric aggregates to 0. | **FALSE POSITIVE FOR NUMERIC METRICS**: Numeric inputs in [`CorrectionButton`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L58-L64) strictly reject empty input via `parseFloat()`. Comment fields use separate `section='comment'` keys and are never parsed as numbers. Zero-clobbering cannot occur through the application UI. | **DISCHARGED AS FALSE POSITIVE** |
| **Unicode NFC/NFD Desynchronization (RS-27 / Backlog Item 4)** | Found 48 rows in `report_extra` using decomposed NFD (`e0a6afe0a6bc`), causing 100% save failures in Section 6. | **AUTHORITATIVELY VERIFIED**: Direct PostgreSQL inspection confirmed `nfd_count = 48, nfc_count = 0` in `public.report_extra`, and RPC `get_or_create_report` seeds NFD bytes. Critical blocker for pre-production field launch. | **CONFIRMED CRITICAL DEFECT** |
| **Multi-Month Partial Zone Coverage (RS-04)** | Flagged that late-quarter partial reporting wipes city stock totals without any UI indicator. | **CONFIRMED MATHEMATICAL FAILURE**: If Month 3 has 1 reporting zone, `sumHeaderRows()` adopts Month 3's stock values (e.g. 10 muallimas), discarding complete data from Months 1 and 2 (140 muallimas) with zero coverage warnings. | **CONFIRMED ARCHITECTURAL DEFECT** |
| **Course Attendance Averaging (KI-006)** | Claims `report_course.attendance` is erroneously summed and should be converted to weighted mean. | **UNVERIFIED DOMAIN ASSUMPTION**: In the UI and schema, `attendance` is labeled `উপস্থিতি` (Attendance), not `গড় উপস্থিতি` (Average Attendance). PostgreSQL view `view_city_course_agg` explicitly uses `sum(rc.attendance)`. Converting to average unilaterally creates severe view-to-loader discrepancies. | **REJECTED AS UNVERIFIED ASSUMPTION** |
| **Numeral Parsing in `toFiniteNumber()` (C07-01)** | Rated A- (Stabilized). | **DISCOVERED EDGE CASE VULNERABILITY**: While `AutoSaveField` and `CorrectionButton` strip commas, [`toFiniteNumber()`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L301-L306) in `report-utils.ts` does NOT strip commas! `toFiniteNumber("1,200")` evaluates to `0` in JavaScript because `Number("1,200")` is `NaN`. | **VULNERABILITY DISCOVERED & PATCH IDENTIFIED** |

---

## 2. False-Positive Discharge Table

The following table explicitly discharges items that are either non-defects, resolved, or based on incorrect assumptions:

| Issue ID | Documented Assertion | Live Investigation Reality | Adversarial Verdict & Rationale |
|:---|:---|:---|:---|
| **RS-02** | Empty override value silently clobbers real aggregates to 0 | In [`CorrectionButton.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L58-L64), `parseFloat(normalized)` evaluates `""` to `NaN`, setting an error and blocking submission. Text comment overrides (`isText=true`) can submit `""`, but comments reside under `section='comment'` and are never routed to `toFiniteNumber()` or `sumRows()`. | **DISCHARGED (FALSE POSITIVE)**<br>Numeric overrides cannot be saved as empty strings via the UI. Comment keys never collide with numeric keys. |
| **RS-07** | No reasonableness checks on entered numbers (e.g. 99,999 muallimas in a unit) | The product owner and architectural team explicitly decided in ADR 022 that field workers should not be blocked by arbitrary heuristic bounds. Non-negative checks (`CHECK col >= 0`) are enforced in PostgreSQL. | **DISCHARGED (DECIDED-NOT-DOING)**<br>Domain-level deliberate choice; no action required. |
| **KI-006 (Courses)** | `report_course.attendance` should be weighted average like meetings | Unlike Section 4 (`report_meeting`), where fields are explicitly named `city_avg_attendance` and labeled `গড় উপস্থিতি`, Section 1 (`report_course`) labels the metric `উপস্থিতি` (Attendance count). View `view_city_course_agg` executes `sum(rc.attendance)`. | **DISCHARGED AS DEFECT (DOMAIN INVARIANT)**<br>Additive summation is the verified database standard. Converting to weighted average without owner instruction would distort valid course headcount metrics. |

---

## 3. Edge Case Mathematical Failure Scenarios

### Scenario 1: The Overlapping Custom Range Override Clobbering Trap
**Root Cause**: In [`src/lib/report-data-loader.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L134-L138) and [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L396-L401), override queries use `.in("month", months)` and index `overrideMap` on `${section}:${field}:${category}` without period boundary qualification.

```
[Timeline of Events]
1. Admin selects Custom Range A (Feb–Apr, months 2–4).
   - Enters override for total_muallima = 200.
   - Saved with month = 2, end_month = 4, report_type = 'কাস্টম'.

2. Admin later selects Custom Range B (Feb–Jun, months 2–6).
   - Months array = [2, 3, 4, 5, 6].
   - Query executes: .eq("report_type", "কাস্টম").in("month", [2, 3, 4, 5, 6]).
   - PostgREST returns the override row from Range A (since month = 2 is in [2, 3, 4, 5, 6]).

3. report-data-loader executes lines 198-201:
   overrideMap.set("header:total_muallima:", "200");

4. Result: Custom Range B (6-month aggregate) displays "200" (the 3-month Feb-Apr override)!
```
**Adversarial Finding**: Subagent A's proposal to add `end_month` to the unique index DOES NOT prevent this bug. The bug exists in the **query predicate** (`.in("month", months)`) and the **in-memory mapping key** (`overrideMap`). Overrides for multi-month periods must be queried with **exact match on `(year, report_type, start_month, end_month)`**.

---

### Scenario 2: Early-Quarter Partial Zone Ingestion & Inventory Clobbering (RS-04)
**Root Cause**: `sumHeaderRows()` resolves inventory stock metrics (`total_muallima`, `total_unit`, `certified_muallima`) from the latest chronological month present in the query result set.

```
[Mathematical Proof of Data Distortion]
- Total Active Zones: 14 zones (Dhaka City South).
- Period: Q1 2026 (January, February, March).
- Month 1 (Jan): 14 zones submitted -> sum(total_muallima) = 140.
- Month 2 (Feb): 14 zones submitted -> sum(total_muallima) = 140.
- Month 3 (Mar): Date is March 2nd. Only Zone 2 has submitted.
  Zone 2 total_muallima = 10. Remaining 13 zones pending.

- view_city_header_agg returns:
  [ { month: 1, total_muallima: 140 },
    { month: 2, total_muallima: 140 },
    { month: 3, total_muallima: 10 } ]

- sumHeaderRows sorts chronologically: latest = Month 3.
- Final Q1 City Total Muallima = 10!
```
**Impact**: The city-wide total collapses by **93%**, reporting `১০ জন` instead of `১৪০ জন` on official PDF and Excel exports, with **zero visual indication** that 13 zones have not yet submitted Month 3.

---

### Scenario 3: Schema Denormalization Drift on `report_header.month`
**Root Cause**: Subagent A recommends executing `ALTER TABLE report_header ADD COLUMN month smallint NOT NULL;`.

```
[Adversarial Cross-Examination]
1. Normal Form Violation:
   `report` already holds (id, zone_id, month, year, report_type) under a UNIQUE constraint.
   Adding `month` to `report_header` introduces redundant duplicate state.

2. Lack of Referential Integrity:
   PostgreSQL cannot enforce a foreign key from `report_header(report_id, month)` to `report(id, month)` 
   unless `report` creates a redundant composite unique key `UNIQUE (id, month)`.
   Without this, `report_header.month` can drift if `report.month` is modified.

3. Schema Asymmetry:
   If `report_header` has `month`, but `report_course`, `report_organizational`, `report_personal`, 
   `report_meeting`, `report_extra`, and `report_comment` do not, the child table architecture is 
   inconsistent and confusing to future maintainers.

4. The True Cause of the Bug:
   `report-data-loader.ts` ALREADY attaches parent `month` via `monthMap` in 2 lines of code (lines 467-490).
   `src/app/report/page.tsx` was broken ONLY because it bypassed `loadReportDataBundle()` and wrote 
   an unmaintained copy of raw queries!
```
**Recommendation**: Reject the DDL migration. Instead, **consolidate `src/app/report/page.tsx` to consume `loadReportDataBundle()` directly**, establishing a single source of truth and resolving RS-03 with zero DDL risk.

---

### Scenario 4: Bengali Numeral Comma Truncation in `toFiniteNumber()`
**Root Cause**: In [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L301-L306):
```typescript
export function toFiniteNumber(val: unknown): number {
  if (typeof val === "boolean" || val === null || val === undefined) return 0;
  const en = typeof val === "string" ? bnToEn(val.trim()) : val;
  const num = typeof en === "number" ? en : Number(en);
  return Number.isFinite(num) ? num : 0;
}
```
**Test Execution**:
```javascript
toFiniteNumber("1,200") // -> bnToEn("1,200") -> "1,200" -> Number("1,200") -> NaN -> 0!
toFiniteNumber("১,২০০") // -> bnToEn("১,২০০") -> "1,200" -> Number("1,200") -> NaN -> 0!
```
**Impact**: If formatted text or copy-pasted values containing commas reach `toFiniteNumber()`, they are **silently wiped to 0**! `toFiniteNumber()` must strip `/[,\s]/g` identically to `AutoSaveField` and `CorrectionButton`.

---

### Scenario 5: PostgREST Upsert `onConflict` Crash
**Root Cause**: In [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L106):
```typescript
.upsert({ ... }, { onConflict: 'year,month,report_type,section,field,category' })
```
If Subagent A's recommendation to drop `city_report_override_unique_key` is executed in PostgreSQL without updating `CorrectionButton`, PostgREST will throw HTTP 400 (`42P10: no unique constraint matching ON CONFLICT spec`). Any admin attempting to save an override will face instant application crashes.

---

## 4. Cross-Segment Blast Radius Analysis

| Proposed Mutation | Impacted Subsystem | Blast Radius & Potential Failure Mode |
|:---|:---|:---|
| **Add `month` to `report_header`** | **Segment 02 (Autosave)** | `updateField()` in `ReportContext` targets `report_id` and does not break, but `get_or_create_report` RPC **must** be updated. If `get_or_create_report` is not updated simultaneously, report creation will crash with `23502 (null value in column "month" violates not-null constraint)`. |
| **Drop `city_report_override_unique_key`** | **Segment 05 (City Report UI)** | `CorrectionButton`'s upsert query will fail with `42P10` unless `onConflict` is updated to include `end_month`. |
| **Normalize `report_extra` to NFC** | **Segment 06 (Section Forms & Exports)** | Immediate **positive blast radius**: Fixes the 100% save failure in Section 6 (`extras-form.tsx`) and restores Maktab/Safar metrics on PDF and Excel exports. |
| **Harden `toFiniteNumber()` with `replace(/[,\s]/g, "")`** | **Segment 01 (Calculations) & Segment 06 (Exports)** | Zero negative blast radius; eliminates silent `0` wipes on comma-separated strings across all aggregators. |
| **Unify `report/page.tsx` via `loadReportDataBundle()`** | **Segment 05 (Navigation)** | Eliminates ~80 lines of duplicate query code; guarantees single-zone multi-month reports render correct chronological snapshots. |

---

## 5. Final Hardened Pre-Production Action Plan

Under `AGENTS.md` Rule 7 (Pre-Production Agility & Zero Dead-Weight), the following ordered action plan provides a mathematically bulletproof resolution:

### Step 1: Immediate PostgreSQL Unicode Repair (Highest Priority)
1. **Normalize Decomposed NFD Strings in `report_extra`**:
   ```sql
   UPDATE public.report_extra 
   SET category = 'স্থানীয়ভাবে পরিচালিত' 
   WHERE category = 'স্থানীয়ভাবে পরিচালিত';

   UPDATE public.report_extra 
   SET category = 'ওয়ার্ড প্রতিনিধির সফর' 
   WHERE category = 'ওয়ার্ড প্রতিনিধির সফর';
   ```
2. **Update `get_or_create_report` RPC**:
   Ensure array literals in the `FOREACH v_extra_cat` block use canonical NFC codepoints (`U+09DF` for `য়`), preventing future NFD seeding.

---

### Step 2: Override Isolation & Index Hardening
1. **Update `CorrectionButtonProps` & Implementation**:
   - Add `endMonth?: number` to `CorrectionButtonProps`.
   - Pass `end_month: endMonth || 0` in `select`, `delete`, and `upsert` calls.
   - Update `onConflict` parameter to:  
     `{ onConflict: 'year,month,end_month,report_type,section,field,category' }`.
2. **Reconcile Database Unique Indexes**:
   ```sql
   DROP INDEX IF EXISTS public.city_report_override_unique_key;
   CREATE UNIQUE INDEX IF NOT EXISTS city_report_override_period_unique 
   ON public.city_report_override USING btree (year, month, end_month, report_type, section, field, category) 
   NULLS NOT DISTINCT;
   ```
3. **Lock Down Override Queries in `report-data-loader.ts` & `city-report/page.tsx`**:
   Replace `.in("month", months)` with exact period boundary matching:
   ```typescript
   supabase
     .from("city_report_override")
     .select("*")
     .eq("year", year)
     .eq("report_type", dbType)
     .eq("month", startMonth)
     .eq("end_month", isMultiMonth ? endMonth : 0)
   ```

---

### Step 3: Architectural Consolidation of `src/app/report/page.tsx` (RS-03)
1. Eliminate the raw, unmaintained queries in [`src/app/report/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/page.tsx#L240-L290).
2. Wire `loadReportDataBundle()` directly into `report/page.tsx` for multi-month zone views.
3. This guarantees `sumHeaderRows()` always receives rows with `month` properly populated from `monthlyReports`, completely resolving RS-03 without schema denormalization or DDL risk.

---

### Step 4: Arithmetic Safety & Partial Coverage Indicator
1. **Harden `toFiniteNumber()` in [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L301-L306)**:
   ```typescript
   export function toFiniteNumber(val: unknown): number {
     if (typeof val === "boolean" || val === null || val === undefined) return 0;
     const cleaned = typeof val === "string" ? val.replace(/[,\s]/g, "").trim() : val;
     const en = typeof cleaned === "string" ? bnToEn(cleaned) : cleaned;
     const num = typeof en === "number" ? en : Number(en);
     return Number.isFinite(num) ? num : 0;
   }
   ```
2. **Modernize SQL Views & Zone Coverage (RS-04)**:
   - In all 6 `view_city_*_agg` views, replace `WHERE r.zone_id <> 1` with `JOIN zone z ON r.zone_id = z.id WHERE z.zone_type <> 'city'`.
   - In `view_city_header_agg`, add `count(DISTINCT r.zone_id) AS submitted_zones_count`.
   - In `city-report/page.tsx`, display a coverage badge: `"পরিসংখ্যান কভারেজ: [X]/[Total] জোন"` when viewing partial multi-month periods.

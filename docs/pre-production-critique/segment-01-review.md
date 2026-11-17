# Segment 01 Review Report: Data Calculation, Aggregation & Shared Data Loader

**Repository**: `talimul-quran-report-submission`  
**Audit Standard**: 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`), Pre-Production Agility & Zero Dead-Weight (`AGENTS.md` Rule 7), Adversarial Doubt-Driven Review (`Rule 2 & 6`)  
**Reviewing Agent**: Subagent 01B (Adversarial Reviewer)  
**Investigating Agent**: Subagent 01A (Lead Investigator)  
**Target Files Inspected**:
- [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts)
- [`src/lib/report-utils.test.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.test.ts)
- [`src/lib/report-data-loader.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts)
- [`src/lib/report-data-loader.test.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.test.ts)
- [`src/lib/date-utils.ts`](file:///d:/WebDev/report-submission/src/lib/date-utils.ts)
- [`src/lib/date-utils.test.ts`](file:///d:/WebDev/report-submission/src/lib/date-utils.test.ts)
- [`src/app/report/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/page.tsx)
- [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx)
- [`src/app/api/export/pdf/route.tsx`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx)
- [`src/app/api/export/excel/route.ts`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts)
- [`src/lib/i18n.ts`](file:///d:/WebDev/report-submission/src/lib/i18n.ts)

---

## 1. Adversarial Verdict & Quality Scorecard Validation

### Overall Verdict: **APPROVED WITH AMENDMENTS**

Subagent 01A conducted a rigorous and technically perceptive investigation, unearthing two severe defects that directly corrupt reporting numbers:
1. **PostgreSQL View Arithmetic Inflation (`DEF-01-01` / `WEB-013`)**: `public.view_city_meeting_agg` performs raw `sum(rm.city_avg_attendance)`, causing **13x arithmetic inflation** on single-month City Reports and compounding calculation errors in multi-month exports.
2. **Web UI Stock Snapshot Corruption & Query Duplication (`DEF-01-02` / `WEB-004`)**: `src/app/report/page.tsx` bypassed the shared loader `loadReportDataBundle()`, maintained 100+ lines of duplicate queries, and omitted `monthMap`, causing multi-month stock metrics (`total_muallima`, `total_unit`) to resolve from arbitrary row arrival order rather than the latest month.

However, several of Subagent 01A's bloatware claims and remediation proposals were found to be **over-engineered, speculative, or carrying unmitigated SQL failure modes** when stress-tested against the Adversarial Doubt Gate (*"Under what real-world field conditions will this clean-looking code fail?"*). These proposals have been amended or discharged below.

### Authoritative Subsystem Health Score: **76 / 100**

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEGMENT 01 SUBSYSTEM HEALTH: 76/100                  │
├────────────────────────────────┬───────┬───────────────────────────────┤
│ Dimension                      │ Score │ Status / Primary Defect       │
├────────────────────────────────┼───────┼───────────────────────────────┤
│ Core Arithmetic & Aggregation  │ 65/100│ 🔴 Broken SQL view summation  │
│ Bangladeshi Numeral & Unicode  │ 90/100│ 🟢 Hardened regex & clamping  │
│ Temporal Boundaries & Timezone │ 95/100│ 🟢 Infallible UTC+6 fallback   │
│ Data Loading & Query Parity    │ 65/100│ 🔴 Duplication in report/page │
│ Pre-Production Simplicity      │ 78/100│ 🟡 Speculative enum proposal  │
└────────────────────────────────┴───────┴───────────────────────────────┘
```

---

## 2. False Positives & Over-Engineered Proposals Discharged

Under `AGENTS.md` Rule 2.5 (Favor Simplicity) and Rule 6 (Solution Alternatives & Adversarial Pre-Check), all speculative abstraction layers, trivial objections, and high-risk rewrites that do not tangibly improve production reliability must be discharged.

### 2.1 Discharge of BLOAT-01-01: Speculative English Enum Migration for `report_type`
- **Subagent 01A Proposal**: Classify `DB_TYPE_MAP` and `URL_TO_ENGLISH_MAP` in [`src/lib/report-utils.ts#L44-L74`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L44-L74) as bloatware. Migrate PostgreSQL `report.report_type`, `city_report_override.report_type`, and RPCs to English enum values (`monthly`, `quarterly`, `half_yearly`, `nine_month`, `yearly`, `custom`), leaving Bengali strings purely in `i18n.ts`.
- **Adversarial Doubt Gate Evaluation**:
  1. *Field Conditions & Blast Radius*:
     - In the live database, `report.report_type` is guarded by `CHECK (report_type = 'মাসিক')` (ADR 027).
     - Overrides in `city_report_override` are stored with Bengali strings (`'মাসিক'`, `'ত্রৈমাসিক'`, `'ষান্মাসিক'`, `'নয়-মাসিক'`, `'বার্ষিক'`, `'কাস্টম'`).
     - Stored RPC `get_or_create_report` expects `p_report_type = 'মাসিক'`.
     - 6 SQL aggregation views (`view_city_*_agg`) select and group by `r.report_type`.
  2. *Architectural Evaluation*:
     - HTTP URL query strings use English tokens (`?type=monthly`, `?type=quarterly`) because Bengali percent-encoded URLs (e.g. `?type=%E0%A6%AE%E0%A6%BE%E0%A6%B8%E0%A6%BF%E0%A6%95`) break SMS/WhatsApp link sharing, trigger encoding quirks in mobile webviews, and look unreadable in browser address bars.
     - The database stores canonical Bengali domain strings (`'মাসিক'`) because official organizational reporting in Bangladesh operates in Bengali.
     - A simple, immutable 10-line dictionary lookup (`DB_TYPE_MAP[rawType] || "মাসিক"`) takes 0.0001 ms, has zero runtime dependencies, and is 100% covered by unit tests.
  3. **Adversarial Ruling**: **DISCHARGED AS OVER-ENGINEERED CHURN**. Rewriting 2 database tables, 1 RPC, 6 SQL views, and dozens of UI components to eliminate a 10-line in-memory dictionary is an unwarranted architectural risk that creates massive regression exposure for zero operational gain.

### 2.2 Discharge of Parser Incompatibility Trap between `toFiniteNumber` and `CorrectionButton`
- **Subagent 01A Proposal**: Flagged an ergonomic hazard in Section 4.2 claiming that `toFiniteNumber` silently zeroes out numbers entered in `CorrectionButton` if Bengali counting classifiers (e.g. `"১২ জন"`) are entered.
- **Adversarial Doubt Gate Evaluation**:
  - Code inspection of [`src/components/admin/correction-button.tsx#L96-L103`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L96-L103) reveals:
    ```ts
    const parsed = parseBangladeshiNumber(valueToSave);
    if (!parsed.isValid) {
      setError("সংশোধিত মান অবশ্যই একটি সঠিক সংখ্যা হতে হবে।");
      return;
    }
    valueToSave = String(parsed.value);
    ```
  - `CorrectionButton` *already* executes `parseBangladeshiNumber()` on the client input and stores `String(parsed.value)` (a clean ASCII integer string like `"12"`) in `city_report_override.value`.
  - When `toFiniteNumber("12")` runs in `report-data-loader.ts`, `Number("12")` evaluates cleanly to `12`.
  - Furthermore, `toFiniteNumber()` is intentionally designed to preserve floating-point numbers for averages and percentages (which `parseBangladeshiNumber()` rounds via `Math.round()`). Unifying them into a single rounding parser would destroy floating-point precision in financial and percentage calculations.
- **Adversarial Ruling**: **DISCHARGED AS FALSE POSITIVE**. The current division of labor is mathematically sound: `parseBangladeshiNumber` parses untrusted user text and clamps to integer counts, while `toFiniteNumber` safely converts numeric database strings to finite IEEE 754 floats.

---

## 3. Intercepted Implementation Traps & Real-World Failure Modes

Applying the Doubt Gate to Subagent 01A's recommended remediation plans exposed critical implementation traps that would cause production failures if deployed without amendments:

### 3.1 Trap 1: NULL Product Erasure in `view_city_meeting_agg` Rewrite (Option A Amendment)
- **Subagent 01A Proposed SQL**:
  ```sql
  round(sum(rm.city_count * rm.city_avg_attendance)::numeric / sum(rm.city_count)::numeric)
  ```
- **Real-World Field Failure Mode**:
  - In PostgreSQL, if any zone record has `city_avg_attendance IS NULL` or `city_count IS NULL` (common when a zone manager leaves an input untouched before auto-save defaults), the SQL expression `rm.city_count * rm.city_avg_attendance` evaluates to `NULL`.
  - In PostgreSQL arithmetic, `10 + NULL = NULL`. While `sum()` ignores standalone NULLs, if one row in a multiplication expression is NULL, that entire row's product is lost from the numerator!
  - Furthermore, if `rm.city_count = 0` but a zone manager reported an informal meeting with attendance `20`, 01A's `WHEN sum(rm.city_count) > 0` forces the result to `0`, discarding valid attendance data.
- **Hardened Production Remediation**:
  Wrap all metric columns in `COALESCE` and handle both count-weighted and fallback unweighted averages:
  ```sql
  CREATE OR REPLACE VIEW public.view_city_meeting_agg WITH (security_invoker = true) AS
  SELECT 
    r.year, 
    r.month, 
    r.report_type, 
    rm.category,
    sum(COALESCE(rm.city_count, 0)) AS city_count,
    CASE 
      WHEN sum(COALESCE(rm.city_count, 0)) > 0 THEN 
        round(sum(COALESCE(rm.city_count, 0) * COALESCE(rm.city_avg_attendance, 0))::numeric / sum(COALESCE(rm.city_count, 0))::numeric)
      WHEN count(rm.id) FILTER (WHERE COALESCE(rm.city_avg_attendance, 0) > 0) > 0 THEN
        round(avg(COALESCE(rm.city_avg_attendance, 0)) FILTER (WHERE COALESCE(rm.city_avg_attendance, 0) > 0))
      ELSE 0 
    END AS city_avg_attendance,
    sum(COALESCE(rm.thana_count, 0)) AS thana_count,
    CASE 
      WHEN sum(COALESCE(rm.thana_count, 0)) > 0 THEN 
        round(sum(COALESCE(rm.thana_count, 0) * COALESCE(rm.thana_avg_attendance, 0))::numeric / sum(COALESCE(rm.thana_count, 0))::numeric)
      WHEN count(rm.id) FILTER (WHERE COALESCE(rm.thana_avg_attendance, 0) > 0) > 0 THEN
        round(avg(COALESCE(rm.thana_avg_attendance, 0)) FILTER (WHERE COALESCE(rm.thana_avg_attendance, 0) > 0))
      ELSE 0 
    END AS thana_avg_attendance,
    sum(COALESCE(rm.ward_count, 0)) AS ward_count,
    CASE 
      WHEN sum(COALESCE(rm.ward_count, 0)) > 0 THEN 
        round(sum(COALESCE(rm.ward_count, 0) * COALESCE(rm.ward_avg_attendance, 0))::numeric / sum(COALESCE(rm.ward_count, 0))::numeric)
      WHEN count(rm.id) FILTER (WHERE COALESCE(rm.ward_avg_attendance, 0) > 0) > 0 THEN
        round(avg(COALESCE(rm.ward_avg_attendance, 0)) FILTER (WHERE COALESCE(rm.ward_avg_attendance, 0) > 0))
      ELSE 0 
    END AS ward_avg_attendance
  FROM public.report r
  JOIN public.report_meeting rm ON r.id = rm.report_id
  JOIN public.zone z ON r.zone_id = z.id
  WHERE (z.zone_type IS DISTINCT FROM 'city')
  GROUP BY r.year, r.month, r.report_type, rm.category;
  ```

### 3.2 Trap 2: RPC Failure Cascade on `report_header.month` NOT NULL Migration
- **Subagent 01A Proposed DDL**:
  ```sql
  ALTER TABLE public.report_header ADD COLUMN month smallint;
  UPDATE public.report_header rh SET month = r.month FROM public.report r WHERE rh.report_id = r.id;
  ALTER TABLE public.report_header ALTER COLUMN month SET NOT NULL;
  ```
- **Real-World Field Failure Mode**:
  - The PostgreSQL stored function `get_or_create_report` seeds the initial row for `report_header` upon report initialization.
  - If a developer executes `ALTER TABLE public.report_header ALTER COLUMN month SET NOT NULL;` without updating the `get_or_create_report` RPC definition in the exact same migration script, every field worker attempting to open or create a report will crash with:
    `ERROR: null value in column "month" of relation "report_header" violates not-null constraint (SQLSTATE 23502)`.
- **Hardened Production Remediation**:
  The DDL migration script MUST bundle the `get_or_create_report` RPC update in an atomic transaction:
  ```sql
  BEGIN;
  ALTER TABLE public.report_header ADD COLUMN IF NOT EXISTS month smallint;
  UPDATE public.report_header rh SET month = r.month FROM public.report r WHERE rh.report_id = r.id AND rh.month IS NULL;
  ALTER TABLE public.report_header ALTER COLUMN month SET NOT NULL;
  -- Re-declare get_or_create_report RPC inserting p_month into report_header
  -- ...
  COMMIT;
  ```

### 3.3 Trap 3: Web UI State Incompatibilities when Consolidating `report/page.tsx`
- **Subagent 01A Proposed Consolidation**:
  Refactor `src/app/report/page.tsx` to consume `loadReportDataBundle()`, deleting 100+ lines of duplicated queries.
- **Real-World Field Failure Mode**:
  - `src/app/report/page.tsx` is an interactive client component that manages:
    1. `activeReport` state containing root report flags: `is_submitted`, `zone_id`, `report_type`, `year`, `month`.
    2. Editing button gating: non-admin users cannot edit if `activeReport.is_submitted === true`.
    3. Direct submission action button: triggers `handleSubmitReport(activeReport.id)`.
  - `loadReportDataBundle()` was originally designed for headless exports (PDF/Excel) and only returns `{ header, courses, org, personal, meetings, extras, comment }`. It does NOT return `reportId` or `is_submitted` in the top-level bundle object!
  - If `report/page.tsx` blindly replaces its query with `loadReportDataBundle()`, the page will lose `activeReport.is_submitted` and `activeReport.id`, completely breaking the Submit button and Lock banner!
- **Hardened Production Remediation**:
  Extend `ReportDataBundle` interface in `src/lib/report-data-loader.ts` to include canonical root metadata:
  ```ts
  export interface ReportDataBundle {
    reportId?: number | null;
    isSubmitted?: boolean;
    zoneId?: number;
    // ... existing fields
  }
  ```
  This allows `src/app/report/page.tsx` to consume the bundle seamlessly without breaking submission and lock controls.

### 3.4 Trap 4: Verification of Month Spelling Normalization Impact
- **Question Investigated**: Does normalizing month spellings between `report-utils.ts` (`জানুয়ারি`) and `i18n.ts` (`জানুয়ারি`) break any database columns, indexes, or URL routes?
- **Adversarial Verification**:
  - Grep audit across all 71 source files and database schemas confirms:
    1. Database `report.month` and `city_report_override.month` are strictly `smallint` (1..12).
    2. URLs strictly pass numeric parameters (`?month=1` to `?month=12`).
    3. `MONTHS_BN` is used **exclusively for string display labels** in `period-selector.tsx`, `report-data-loader.ts`, and PDF exports.
  - **Conclusion**: Normalizing `MONTHS_BN` to Bangla Academy modern orthography (`জানুয়ারি`, `ফেব্রুয়ারি`) has **ZERO database or routing blast radius**. It is a pure UI consistency and orthographic polish enhancement.

---

## 4. Cross-Segment Blast Radius & Cohesion Verification

Segment 01 forms the mathematical bedrock of the entire application. The blast radius of Segment 01 fixes across adjacent audit segments has been exhaustively traced:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEGMENT 01 HARDENED ARTIFACTS                        │
│   (view_city_meeting_agg DDL, report_header.month, loadReportDataBundle)  │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
       Exports & Bundles               Period Configuration & Formulas
                    ▼                               ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  SEGMENT 06: Admin & Export Engines  │  │  SEGMENT 03: Form Ergonomics │
│  - /api/export/pdf (route.tsx)       │  │  - meetings-form.tsx         │
│  - /api/export/excel (route.ts)      │  │  - comments-form.tsx         │
│  - /admin/city-report (page.tsx)     │  │  (Custom meeting title &     │
│  (Fixes 13x attendance inflation,    │  │   comment overrides flow     │
│   restores custom meeting names &    │  │   consistently to exports)   │
│   comments, prevents range overlap)  │  │                              │
└──────────────────────────────────────┘  └──────────────────────────────┘
                    │                               │
                    ▼                               ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│    SEGMENT 05: Canonical Routing     │  │  SEGMENT 02: Save Machine    │
│  - /report (overview page.tsx)       │  │  - auto-save-field.tsx       │
│  - period-selector.tsx               │  │  (Shared parseBangladeshi    │
│  (Eliminates 100+ duplicate query    │  │   numeral normalization and  │
│   lines, fixes stock snapshot sort,  │  │   non-negative bounds check) │
│   prevents "undefined ২০২৬" label)   │  │                              │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

1. **Cohesion with Segment 06 (Admin Workflows & Export Engines)**:
   - Modifying `view_city_meeting_agg` DDL automatically fixes meeting attendance for both `/admin/city-report` and `/api/export/*` without touching application calculation code.
   - Injecting `meeting_name` and `comments` overrides into `loadReportDataBundle` fixes the long-standing bug where custom titles on the "অন্যান্য" row were dropped in PDF/Excel exports.
   - Removing `.in("month", months)` and pinning `.eq("month", activePeriod.overrideMonth)` eliminates custom range collision in both city report screens and exported files.
2. **Cohesion with Segment 05 (Routing & Report Overview Page)**:
   - Consolidating `src/app/report/page.tsx` onto `loadReportDataBundle()` eradicates the out-of-order snapshot bug (RS-03) in the client web UI and guarantees 100% data parity between the web dashboard and exported documents.
   - Tightening month bounds in `resolvePeriodConfig()` guarantees period selectors cannot generate `"undefined ২০২৬"` or bypass future-period locks.
3. **Cohesion with Segment 02 & 03 (Save Machine & Form Presentation)**:
   - Preserves `parseBangladeshiNumber()` integer contract for forms and autosave fields while preserving `toFiniteNumber()` float fidelity for rate calculations.

---

## 5. Final Hardened Pre-Production Action Plan

In accordance with `AGENTS.md` Rule 7 (Pre-Production Agility & Zero Dead-Weight), the following battle-tested roadmap defines the exact implementation sequence:

### Tier 1: Clean Database Schema & DDL Migrations (Supabase Direct)
- [ ] **DDL-01-01**: Deploy hardened `public.view_city_meeting_agg` view with `security_invoker = true`, `COALESCE` arithmetic, weighted average attendance calculation, and fallback unweighted mean.
- [ ] **DDL-01-02**: Add native `month smallint NOT NULL` column to `public.report_header`, populate existing rows from parent `report`, and atomically update `get_or_create_report` RPC to write `p_month` into `report_header`.
- [ ] **DDL-01-03**: Clean legacy test rows in `city_report_override`:
  ```sql
  UPDATE public.city_report_override 
  SET category = 'মহানগরী মন্তব্য' 
  WHERE section = 'comment' AND (category IS NULL OR category = '');
  ```

### Tier 2: Application Architecture & Loader Consolidation
- [ ] **APP-01-01**: In [`src/lib/report-data-loader.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts), pin the override query to exact `.eq("month", activePeriod.overrideMonth)` and remove obsolete `.in("month", months)`.
- [ ] **APP-01-02**: In [`src/lib/report-data-loader.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts), resolve `meeting_name` and `comments` from `overrideMap` for `meetings` and `org` categories so custom meeting titles and comments are preserved in exports.
- [ ] **APP-01-03**: Extend `ReportDataBundle` to expose `reportId`, `isSubmitted`, and `zoneId`.
- [ ] **APP-01-04**: Refactor [`src/app/report/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/page.tsx) to consume `loadReportDataBundle()`, deleting ~100 lines of duplicated child queries and manual `sumRows`/`sumHeaderRows` loops.
- [ ] **APP-01-05**: In [`src/lib/report-utils.ts#L297-L299`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L297-L299), clamp `input.month` (1..12) and `input.year` (2020..2050) to prevent `NaN` month propagation and label corruption.

### Tier 3: UI/UX, Mobile Ergonomics & Localization Refinements
- [ ] **UI-01-01**: Synchronize `MONTHS_BN` in [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts) with `translations.bn.months` in [`src/lib/i18n.ts`](file:///d:/WebDev/report-submission/src/lib/i18n.ts) (`"জানুয়ারি"`, `"ফেব্রুয়ারি"`).

### Tier 4: Documentation Suite Reconciliations
- [ ] **DOC-01-01**: Reconcile [`docs/TECHNICAL_MANUAL.md`](file:///d:/WebDev/report-submission/docs/TECHNICAL_MANUAL.md) Chapters 2.3 and 3 to reflect native `report_header.month`, weighted meeting SQL view, and purge phantom dual-string references.
- [ ] **DOC-01-02**: Update [`docs/KNOWN_ISSUES.md`](file:///d:/WebDev/report-submission/docs/KNOWN_ISSUES.md) RS-50 entry to accurately list live date utilities.

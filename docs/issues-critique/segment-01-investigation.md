# Segment 01 Investigation: Data Integrity, Aggregation & Calculation Engines

**Target Codebase**: `talimul-quran-report-submission`  
**Auditor**: Subagent A (Lead Investigator)  
**Standard**: 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`), Pre-Production Agility (`AGENTS.md` Rule 7), Zero Dead-Weight Policy  
**Scope**: RS-01 through RS-07, RS-27, KI-005, KI-006, KI-017, KI-021, C07-01, C06-02; Backlog Items 1, 4, 5; Chapters 2 & 3 of `TECHNICAL_MANUAL.md`.

---

## 1. Executive Scorecard for Calculation & Data Integrity

| Dimension | Rating | Status | Summary Finding |
|:---|:---:|:---:|:---|
| **Arithmetic Safety & Numeral Casting** | **A-** | **STABILIZED** | `toFiniteNumber()` and `sumRows()` defend against `"5" + 3 = "53"` string concatenation, Bengali numeral erasure, and boolean coercion. Weighted attendance math is intact for meetings. |
| **Inventory / Stock Snapshot Resolution** | **D** | **REGRESSION IN UI** | Track 2 fixed RS-03 in `report-data-loader.ts` via an in-memory `monthMap` shim, but [`src/app/report/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/page.tsx#L261-L269) was omitted and **remains broken**, sorting month-less rows by `0 - 0 = 0`. |
| **Period Override Keying & Custom Ranges** | **F** | **BROKEN / DORMANT** | Despite adding `end_month` in PostgreSQL DDL (ADR 023), `CorrectionButton` and query loaders **never wire or pass `end_month`**, and the old unique index `city_report_override_unique_key` was never dropped. Custom ranges sharing a start month silently collide and overwrite each other. |
| **Unicode String Normalization (NFC/NFD)** | **F** | **CRITICAL SILENT FAILURE** | PostgreSQL table `report_extra` and RPC `get_or_create_report` store **NFD strings** (`e0a6afe0a6bc`), while TypeScript constants and form components use **NFC** (`e0a79f`). **100% of data for 2 categories in `report_extra` fails to save and displays as 0**. |
| **Multi-Month City Coverage Indication** | **C-** | **UNVERIFIED PARTIAL DATA** | When viewing multi-month periods (e.g. Q1), `sumHeaderRows()` adopts the latest month's stock metrics. If Month 3 has only 1 zone reporting, that 1 zone's data clobbers complete data from Months 1 and 2 with zero coverage warnings. |
| **SQL View Modernization** | **C** | **UNMIGRATED SHIM** | All 6 PostgreSQL views `view_city_*_agg` still hardcode `WHERE r.zone_id <> 1` instead of filtering on `WHERE z.zone_type <> 'city'`. |

---

## 2. Issue-by-Issue Reality Check

### RS-01: Overrides on Non-Monthly City Views Saved Under the Wrong Month Key
- **Documented Status**: RESOLVED (ADR 018) · High Severity
- **Live Code Inspection**:
  - In [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L185-L192), `getOverrideMonthForPeriod(reportType, selectedMonth, endMonth)` maps non-monthly periods to `months[0]` (e.g. Q1 $\rightarrow 1$, Q2 $\rightarrow 4$, Q3 $\rightarrow 7$, Q4 $\rightarrow 10$).
  - In [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L45), `const overrideMonth = getOverrideMonthForPeriod(reportType, month)` is called.
  - In [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L545), `CityReportContext.Provider` passes `month: activePeriod.overrideMonth` and `reportType: activePeriod.dbType`.
- **Reality Check**:
  - **Single-month & standard quarters**: Overrides are stored under the period's start month (`1`, `4`, `7`, `10`) with `report_type = "ত্রৈমাসিক"`. Queries filter on `.eq("report_type", dbType).in("month", months)`. For calendar quarters, this prevents month drift.
  - **Custom Range Defect**: For custom ranges (e.g. Feb–May), `report_type = "কাস্টম"`, `month = 2`. Because `end_month` is never persisted or queried (see KI-021 below), any subsequent custom range starting in February (e.g. Feb–Aug) overwrites the earlier override.
- **Verdict**: **PARTIALLY RESOLVED for fixed quarters; UNRESOLVED for custom ranges**.

---

### RS-02: Empty Override Value Silently Becomes 0
- **Documented Status**: RESOLVED (ADR 020) · Medium Severity
- **Live Code Inspection**:
  - In [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L58-L64):
    ```typescript
    const normalized = bnToEn(valueToSave).replace(/[,\s]/g, "")
    const num = parseFloat(normalized)
    if (isNaN(num) || num < 0) {
      setError("সংশোধিত মান অবশ্যই শূন্য বা ধনাত্মক সংখ্যা হতে হবে। পূর্বের মানে ফিরতে 'মুছুন' চাপুন।")
      return
    }
    valueToSave = String(Math.round(num))
    ```
  - In [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L324-L332):
    ```typescript
    const ov = overrideMap.get(key);
    if (ov !== undefined) {
      const numVal = Number(bnToEn(String(ov)));
      return {
        value: isText ? ov : (isNaN(numVal) ? 0 : numVal),
        isOverridden: true
      };
    }
    ```
  - In [`src/lib/report-data-loader.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L203-L207):
    ```typescript
    const getVal = (section: string, field: string, computed: number, cat?: string) => {
      const key = `${section}:${field}:${cat || ""}`;
      const ov = overrideMap.get(key);
      return ov !== undefined ? toFiniteNumber(ov) : toFiniteNumber(computed);
    };
    ```
- **Reality Check**:
  - Numeric input in `CorrectionButton` correctly rejects empty string `""` on submission (`parseFloat("")` is `NaN`), showing an explicit error message.
  - **Zero-Clobbering Vulnerability 1 (Text Overrides)**: In [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L50-L56), when `isText={true}` and `isOverridden` is `false` (creating a new comment override), submitting empty whitespace `""` bypasses the check and writes `value = ""` to PostgreSQL!
  - **Zero-Clobbering Vulnerability 2 (Empty String in Map)**: If an override record has `value = ""` in the database, `overrideMap.get(key)` returns `""`. `ov !== undefined` evaluates to `true`. In JavaScript: `Number("")` evaluates to `0` (`isNaN(0)` is `false`). In `report-data-loader.ts`, `toFiniteNumber("")` evaluates to `0`. Consequently, an empty override string silently overrides and wipes real computed sums to `0`.
- **Verdict**: **MOSTLY FIXED for numbers in UI; VULNERABLE to whitespace in text comments and `Number("") === 0` coercion**.

---

### RS-03 / KI-005: Per-Zone Multi-Month Header Snapshot May Pick an Arbitrary Row
- **Documented Status**: RESOLVED (ADR 025 / Track 2) in Loader · High Severity
- **Live Code Inspection**:
  - In PostgreSQL, table `report_header` **lacks a `month` column** (verified via `information_schema.columns`).
  - In [`src/lib/report-data-loader.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L467-L490), an in-memory mapping was created:
    ```typescript
    const monthMap = new Map((monthlyReports || []).map((r: any) => [r.id, r.month]));
    ...
    const rawHeader = (headerRes.data || []).map((h: any) => ({
      ...h,
      month: monthMap.get(h.report_id) ?? h.month,
    }));
    header = sumHeaderRows(rawHeader) || {};
    ```
  - **CRITICAL DISCOVERY IN [`src/app/report/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/page.tsx#L252-L269)**:
    ```typescript
    const [headerRes, ...] = await Promise.all([
      supabase.from("report_header").select("*").in("report_id", reportIds),
      ...
    ]);
    const rawHeader = headerRes.data || [];
    ...
    setHeaderData(sumHeaderRows(rawHeader));
    ```
- **Reality Check**:
  - In [`src/app/report/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/page.tsx#L269), `rawHeader` is passed straight to `sumHeaderRows(rawHeader)` **WITHOUT `monthMap` enrichment**.
  - In [`src/lib/report-utils.ts:sumHeaderRows`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L455):
    ```typescript
    const sorted = [...rows].sort((a, b) => (Number(a.month) || 0) - (Number(b.month) || 0));
    const latest = sorted[sorted.length - 1];
    ```
  - Because `row.month` is `undefined`, `(Number(a.month) || 0)` evaluates to `0` for every row. The sort expression evaluates to `0 - 0 = 0`.
  - The "latest" row is selected entirely based on PostgreSQL physical storage or packet traversal order!
  - Under pre-production development (`AGENTS.md` Rule 7), the in-memory `monthMap` in `report-data-loader.ts` is an unneeded polyfill. Adding `month` directly to `report_header` via DDL eliminates the bug everywhere at 0 runtime cost.
- **Verdict**: **CONFIRMED ACTIVE DEFECT on `/report`; FRAGILE SHIM in export loader**.

---

### RS-04: City Snapshot Uses Latest Month's Partial Data With No Coverage Indicator
- **Documented Status**: VERIFY-FIRST · Medium Severity
- **Live Code Inspection**:
  - Look at the SQL view definition of `view_city_header_agg`:
    ```sql
    SELECT r.year, r.month, r.report_type,
           sum(rh.total_muallima) AS total_muallima,
           sum(rh.total_unit) AS total_unit, ...
    FROM report r
    JOIN report_header rh ON r.id = rh.report_id
    WHERE r.zone_id <> 1
    GROUP BY r.year, r.month, r.report_type;
    ```
  - When querying Q1 (months `[1, 2, 3]`), `view_city_header_agg` returns 3 rows.
  - In [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L407) and [`src/lib/report-data-loader.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L142):
    ```typescript
    const computedHeader = isMultiMonth ? sumHeaderRows(rawHeader) : rawHeader[0] || null;
    ```
  - `sumHeaderRows` assigns stock snapshot metrics (`total_muallima`, `total_unit`, `certified_muallima`) from the row with the highest month (`sorted[sorted.length - 1]`).
- **Reality Check**:
  - **Scenario**: In Q1, Zone 1 through 14 submit reports for Month 1 and Month 2 (`total_muallima = 140`). In Month 3 (early in the month), only 1 zone has opened or submitted a report (`total_muallima = 10`).
  - `view_city_header_agg` produces a row for Month 3 with `total_muallima = 10`.
  - `sumHeaderRows` resolves Month 3 as `latest`, setting the quarterly city total to **10**!
  - Complete data from Months 1 and 2 is completely discarded for stock metrics.
  - There is **no zone coverage indicator** ("1 of 14 zones reporting") in the UI or exports.
- **Verdict**: **CONFIRMED ARCHITECTURAL DEFECT**.

---

### RS-05 / KI-017: Non-Monthly Periods Hardcoded to Start in January
- **Documented Status**: RESOLVED (ADR 022) · Medium Severity
- **Live Code Inspection**:
  - In [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L144-L177), `getMonthsForPeriod` supports dynamic calendar quarters (Q1: 1–3, Q2: 4–6, Q3: 7–9, Q4: 10–12), calendar halves (H1: 1–6, H2: 7–12), 9-month (1–9), yearly (1–12), and custom ranges (`[startMonth..endMonth]`).
  - Governed by `resolvePeriodConfig()` and the Start-Month Future Lockout rule (lines 207–299).
  - Verified by 24 unit tests in [`src/lib/report-utils.test.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.test.ts#L93-L162).
- **Reality Check**:
  - Period calculation itself is completely sound. The flaw lies exclusively in override storage and range collisions (see KI-021).
- **Verdict**: **RESOLVED for periods; BLOCKED by override storage collisions**.

---

### RS-06: Overrides Are Absolute, Unaudited Replacements, and Can Duplicate
- **Documented Status**: PLANNED (ADR 022) · Medium Severity
- **Live Code Inspection**:
  - In [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L121-L152), the *"গণনা করা মানে ফিরে যান"* (`RotateCcw`) button executes a direct `delete()` query on `city_report_override` and triggers `onSuccess()`.
- **Reality Check**:
  - **Revert to calculated**: Deletes cleanly and triggers UI refresh.
  - **Audit trail**: Still completely absent. `city_report_override` has no `created_by`, `updated_by`, `reason`, or `updated_at` columns.
  - **Duplicate / Collision Risk**: Custom range overrides collide because `end_month` is unmanaged.
- **Verdict**: **PARTIALLY RESOLVED (Revert button implemented; audit trail and range isolation missing)**.

---

### RS-07: No Reasonableness Checks on Entered Numbers
- **Documented Status**: DECIDED-NOT-DOING (ADR 022) · Low Severity
- **Reality Check**: Confirmed owner's deliberate domain choice. Numeric inputs remain unconstrained.
- **Verdict**: **DISCHARGED / DECIDED-NOT-DOING**.

---

### RS-27 / Backlog Item 4: Dual-String Backward-Compatibility Shims & Unicode Normalization Drift
- **Documented Status**: RESOLVED (ADR 020 / ADR 022) · Medium Severity
- **Live Code Inspection**:
  - In [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L73-L132), all category lists are centralized. Dual-string fallbacks (`|| r.category === ...`) have been removed from TypeScript code in favor of strict `x.category === cat`.
  - Database schema analysis of PostgreSQL `public.report_extra` and `public.report_organizational` via Supabase MCP:
    ```sql
    SELECT DISTINCT category FROM public.report_organizational;
    -- Result: All 15 rows match canonical NFC strings ('সহযোগী হয়েছেন', split Mashq).
    ```
  - **CRITICAL LIVE CODE-TO-DATABASE BREACH**:
    When querying `public.report_extra`:
    ```sql
    SELECT count(*) filter (where category = 'ওয়ার্ড প্রতিনিধির সফর') as nfd_count,
           count(*) filter (where category = 'ওয়ার্ড প্রতিনিধির সফর') as nfc_count
    FROM public.report_extra;
    -- Result: nfd_count = 24, nfc_count = 0!
    
    SELECT count(*) filter (where category = 'স্থানীয়ভাবে পরিচালিত') as nfd_count,
           count(*) filter (where category = 'স্থানীয়ভাবে পরিচালিত') as nfc_count
    FROM public.report_extra;
    -- Result: nfd_count = 24, nfc_count = 0!
    ```
    - In `report-utils.ts`, [`src/components/report/sections/extras-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/extras-form.tsx#L29), [`src/app/report/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/page.tsx#L858), [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L1041), and [`src/app/api/export/pdf/route.tsx`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L681), the category string uses **NFC composed Bengali `য়` (Unicode codepoint `U+09DF`, UTF-8 `e0a79f`)**.
    - In PostgreSQL database rows and inside PostgreSQL function `get_or_create_report`, the seeded category string uses **NFD decomposed `য` + `়` (`U+09AF` + `U+09BC`, UTF-8 `e0a6afe0a6bc`)**!
    - When `AutoSaveField` tries to save in Section 6, PostgREST evaluates `WHERE category = 'স্থানীয়ভাবে পরিচালিত'` (NFC). In PostgreSQL, this matches **0 ROWS**. The save check throws `"Save verification failed: 0 rows affected"`.
    - When loading reports or exporting to PDF/Excel, `.find(e => e.category === "স্থানীয়ভাবে পরিচালিত")` evaluates to `undefined`, silently defaulting to `0`!
- **Verdict**: **CRITICAL SILENT FAILURE ACROSS EXTRA SECTION DATA ENTRY & EXPORTS**.

---

### KI-021 / Backlog Item 5: Custom Range Override Collisions & Dormant `end_month`
- **Documented Status**: RESOLVED & MIGRATED (ADR 023)
- **Live Database & Code Inspection**:
  - Supabase MCP query on `pg_indexes` for `city_report_override`:
    ```sql
    [
      { "indexname": "city_report_override_unique_key", "indexdef": "CREATE UNIQUE INDEX city_report_override_unique_key ON public.city_report_override USING btree (year, month, report_type, section, field, category) NULLS NOT DISTINCT" },
      { "indexname": "city_report_override_period_unique", "indexdef": "CREATE UNIQUE INDEX city_report_override_period_unique ON public.city_report_override USING btree (year, month, end_month, report_type, section, field, category) NULLS NOT DISTINCT" }
    ]
    ```
  - **Two conflicting unique indexes exist simultaneously**!
  - In [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L8-L21):
    `CorrectionButtonProps` **does NOT accept `endMonth`**!
  - Lines 70–108: `CorrectionButton` queries and upserts with:
    `eq('month', overrideMonth)` and `{ onConflict: 'year,month,report_type,section,field,category' }`.
    `end_month` is never provided, defaulting to `0`.
  - In [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L396-L400) and [`src/lib/report-data-loader.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L134-L138):
    The loader queries `.eq("month", overrideMonth)` or `.in("month", months)` without filtering on `end_month`.
- **Reality Check**:
  - The entire `end_month` migration in ADR 023 is **dormant and non-functional**.
  - Any two custom ranges sharing a start month (e.g. March–May vs March–August) collide 100%, overwriting each other's data.
  - If a developer attempts to pass `end_month`, `city_report_override_unique_key` triggers a PostgreSQL unique constraint violation error (`23505`).
- **Verdict**: **CRITICAL DORMANT FIX / ARCHITECTURAL DEFECT**.

---

### C07-01: `sumRows` Arithmetic String Concatenation & Numeral Safety
- **Documented Status**: RESOLVED (ADR 025 / Track 2)
- **Live Code Inspection**:
  - In [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L301-L306):
    ```typescript
    export function toFiniteNumber(val: unknown): number {
      if (typeof val === "boolean" || val === null || val === undefined) return 0;
      const en = typeof val === "string" ? bnToEn(val.trim()) : val;
      const num = typeof en === "number" ? en : Number(en);
      return Number.isFinite(num) ? num : 0;
    }
    ```
  - In `sumRows()` (lines 352–358):
    Standard numeric accumulation strictly coerces both operands with `toFiniteNumber()`. String concatenation (`"5" + 3 = "53"`) is mathematically impossible.
  - Text keys (`meeting_name`, `comments`) are whitelisted in `NON_NUMERIC_KEYS` and merged via regex tokenization and `Set` deduplication.
  - 10 unit tests pass in [`src/lib/report-utils.test.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.test.ts#L187-L297).
- **Verdict**: **VERIFIED FULLY RESOLVED**.

---

### KI-006: Weighted Mean for Average Attendance
- **Documented Status**: RESOLVED (ADR 025 / Track 2)
- **Live Code Inspection**:
  - In [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L322-L326):
    `ATTENDANCE_WEIGHT_PAIRS` defines:
    `city_avg_attendance: "city_count"`, `thana_avg_attendance: "thana_count"`, `ward_avg_attendance: "ward_count"`.
  - In `sumRows()`, attendees are multiplied by count and divided by `totalCount`.
  - **Courses Attendance Discrepancy**: In `report_course`, column `attendance` (উপস্থিতি) is **NOT** included in `ATTENDANCE_WEIGHT_PAIRS`. When aggregating multi-month course rows, `attendance` is summed directly (`50 + 50 = 100`). In courses where `attendance` represents average daily attendance, summing across 3 months inflates the attendance by 300%.
- **Verdict**: **RESOLVED for Meetings; DEFECT in Courses Attendance Multi-Month Summation**.

---

### C06-02: Export Route Query Duplication (~500 lines) & Case B Override Parity
- **Documented Status**: RESOLVED (ADR 025 / Track 2)
- **Live Code Inspection**:
  - [`src/lib/report-data-loader.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts) extracts `loadReportDataBundle()`.
  - Both [`src/app/api/export/pdf/route.tsx`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L752) and [`src/app/api/export/excel/route.ts`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts#L43) consume the shared bundle.
  - Queries are normalized via `resolvePeriodConfig()`, ensuring `city_report_override` is queried with canonical Bengali `dbType`.
- **Verdict**: **VERIFIED FULLY RESOLVED**.

---

## 3. Pre-Production Bloatware & Shims Catalog

Under `AGENTS.md` Rule 7 (Pre-Production Agility & Zero Dead-Weight), the following application-layer shims and database artifacts must be purged in favor of clean DDL:

### Bloatware 1: In-Memory Header `month` Attachment Shim
- **Current Workaround**:
  `report-data-loader.ts` queries `report(id, month)`, builds `monthMap = new Map()`, and iterates over `rawHeader` in memory to attach `month`. Meanwhile, `src/app/report/page.tsx` omitted the shim and remains broken.
- **Why It Exists**: Developed under the false premise that `report_header` schema could not be altered in production.
- **Clean DDL Replacement**:
  ```sql
  -- 1. Add month column to report_header
  ALTER TABLE public.report_header ADD COLUMN month smallint;

  -- 2. Backfill existing rows directly from parent report table
  UPDATE public.report_header rh
  SET month = r.month
  FROM public.report r
  WHERE rh.report_id = r.id;

  -- 3. Enforce NOT NULL and add covering index
  ALTER TABLE public.report_header ALTER COLUMN month SET NOT NULL;
  CREATE INDEX idx_report_header_month ON public.report_header(month);

  -- 4. Update get_or_create_report RPC to populate month upon creation
  -- (Inside get_or_create_report, add p_month to INSERT INTO report_header)
  ```
- **Code Pruning**: Delete `monthMap` and in-memory enrichment from `report-data-loader.ts`. `sumHeaderRows()` will receive native `month` on all pages automatically.

---

### Bloatware 2: Duplicate Index & Dormant `end_month` on `city_report_override`
- **Current Workaround**:
  Database has two competing unique indexes (`city_report_override_unique_key` and `city_report_override_period_unique`). Frontend code ignores `end_month` and saves with `onConflict: 'year,month,report_type,section,field,category'`.
- **Clean DDL Replacement**:
  ```sql
  -- Drop the obsolete single-month index that blocks custom ranges
  DROP INDEX IF EXISTS public.city_report_override_unique_key;

  -- Ensure the authoritative period unique index is active
  CREATE UNIQUE INDEX IF NOT EXISTS city_report_override_period_unique 
  ON public.city_report_override USING btree (year, month, end_month, report_type, section, field, category) 
  NULLS NOT DISTINCT;
  ```
- **Code Modernization**:
  Update `CorrectionButtonProps` to accept `endMonth?: number`. Pass `startMonth` and `endMonth` into `city_report_override` queries, deletes, and upserts (`onConflict: 'year,month,end_month,report_type,section,field,category'`).

---

### Bloatware 3: NFD Unicode Decomposed Strings in PostgreSQL
- **Current Workaround**:
  None. The data is simply broken. 24 rows in `report_extra` use NFD `য` + `়`, while the frontend uses NFC `য়`.
- **Clean DDL Replacement**:
  ```sql
  -- Normalize existing test rows in report_extra to canonical Unicode NFC
  UPDATE public.report_extra 
  SET category = 'স্থানীয়ভাবে পরিচালিত' 
  WHERE category = 'স্থানীয়ভাবে পরিচালিত';

  UPDATE public.report_extra 
  SET category = 'ওয়ার্ড প্রতিনিধির সফর' 
  WHERE category = 'ওয়ার্ড প্রতিনিধির সফর';

  -- Update get_or_create_report RPC definition to seed NFC strings
  ```

---

### Bloatware 4: Hardcoded `WHERE r.zone_id <> 1` Magic Numbers in 6 Aggregation Views
- **Current Workaround**:
  All 6 views (`view_city_header_agg`, `view_city_course_agg`, `view_city_organizational_agg`, `view_city_personal_agg`, `view_city_meeting_agg`, `view_city_extra_agg`) hardcode `WHERE (r.zone_id <> 1)`.
- **Clean DDL Replacement**:
  Since `zone_type` was added to `zone` in ADR 023, update all 6 views to:
  ```sql
  JOIN public.zone z ON r.zone_id = z.id
  WHERE z.zone_type <> 'city'
  ```

---

## 4. 5-Layer Behavioral Trace

Tracing a data metric (e.g. `total_muallima` in Section 0 and `স্থানীয়ভাবে পরিচালিত` in Section 6) from user entry to PDF export:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. INPUT LAYER (DOM / Form Interaction)                                │
│ - User inputs "১৫" into AutoSaveField (extras-form.tsx).               │
│ - Category passed: 'স্থানীয়ভাবে পরিচালিত' (Unicode NFC U+09DF).        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. CONTEXT & PERSISTENCE LAYER (ReportContext / AutoSaveField)         │
│ - persist() normalizes "১৫" via bnToEn -> "15".                        │
│ - updateField executes PostgREST UPDATE on report_extra:               │
│   .eq('report_id', 42).eq('category', 'স্থানীয়ভাবে পরিচালিত')           │
│ - 💥 TRAP: Database holds NFD 'স্থানীয়ভাবে পরিচালিত' (U+09AF+U+09BC). │
│ - PostgREST matches 0 rows! .select('id') returns [].                  │
│ - Error thrown: "Save verification failed: 0 rows affected".           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. AGGREGATOR LAYER (sumHeaderRows / sumRows)                          │
│ - In multi-month city view, view_city_header_agg returns 3 rows.       │
│ - sumHeaderRows sorts by Number(row.month).                            │
│ - Takes latest month for inventory (total_muallima).                   │
│ - 💥 TRAP: Month 3 with only 1 reporting zone clobbers full city total! │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. VIEW LAYER (city-report/page.tsx / report/page.tsx)                 │
│ - /city-report queries city_report_override by (year, dbType, month).  │
│ - 💥 TRAP: Ignores end_month; multiple custom ranges collide.          │
│ - /report calls sumHeaderRows(rawHeader) without monthMap!             │
│ - 💥 TRAP: rawHeader has no month; rows sort arbitrarily by 0 - 0 = 0! │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. EXPORT LAYER (loadReportDataBundle -> /api/export/pdf)              │
│ - loadReportDataBundle fetches view_city_*_agg and overrides.          │
│ - .find(e => e.category === 'স্থানীয়ভাবে পরিচালিত') evaluates to false! │
│ - 💥 TRAP: Maktab extra metric renders as "০ টি" on official PDF!     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Recommended Clean Modern Architecture

To establish mathematically bulletproof data integrity under `AGENTS.md` Rule 7, execute the following 4-step architecture refactor:

### Step 1: Database DDL Migration (`public` Schema)
1. **Add `month` to `report_header`**:
   Add `month smallint NOT NULL` with backfill from `report.month`.
2. **Update `get_or_create_report` RPC**:
   - Insert `p_month` directly into `report_header`.
   - Seed canonical NFC strings for `report_extra` (`'স্থানীয়ভাবে পরিচালিত'`, `'ওয়ার্ড প্রতিনিধির সফর'`).
3. **Normalize Existing Database Rows**:
   Update `report_extra` rows to NFC strings.
4. **Fix `city_report_override` Unique Indexes**:
   Drop obsolete `city_report_override_unique_key`. Retain only `city_report_override_period_unique` with `end_month`.
5. **Update SQL Aggregation Views**:
   Replace `WHERE r.zone_id <> 1` with `JOIN public.zone z ON r.zone_id = z.id WHERE z.zone_type <> 'city'`.

### Step 2: Override Period & Range Wiring
1. **Update `CorrectionButtonProps`**:
   Add `endMonth?: number`.
2. **Wire `end_month` in `CorrectionButton`**:
   Pass `end_month: endMonth || 0` in `select`, `delete`, and `upsert` queries. Use `onConflict: 'year,month,end_month,report_type,section,field,category'`.
3. **Wire `end_month` in `city-report/page.tsx` & `report-data-loader.ts`**:
   Filter `city_report_override` on `.eq('month', startMonth).eq('end_month', endMonth || 0)`.

### Step 3: Header Snapshot & Zone Coverage Indicator
1. **Fix `src/app/report/page.tsx`**:
   With `month` present on `report_header`, `sumHeaderRows(rawHeader)` naturally sorts chronologically without frontend joins.
2. **Implement Zone Coverage Badge (RS-04)**:
   In `view_city_header_agg`, add `count(distinct r.zone_id) AS reporting_zones_count`.
   In `city-report/page.tsx` and PDF export, display:
   `"পরিসংখ্যান কভারেজ: [X] / [Y] টি জোন জমাকৃত"` whenever viewing a multi-month period where not all zones have reported.

### Step 4: Courses Attendance Averaging (KI-006)
1. Add `attendance: "sessions"` or calculate weighted mean for `report_course.attendance` in `sumRows()` rather than accumulating direct sums.

---

## 6. Pre-Flight Verification Protocol for Implementors

Prior to concluding any future implementation derived from this investigation:
1. `npm run lint` $\rightarrow$ 0 errors.
2. `npx tsc --noEmit` $\rightarrow$ 0 errors.
3. `npm test` $\rightarrow$ 100% pass across all 43+ unit tests, including new test cases for `report_header.month`, `end_month` override isolation, and NFC category updates.
4. `npm run build` $\rightarrow$ Clean Turbopack compilation.

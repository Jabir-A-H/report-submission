# Segment 01 Investigation Report: Data Calculation, Aggregation & Shared Data Loader

**Repository**: `talimul-quran-report-submission`  
**Audit Standard**: 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`), Impeccable UI/UX Ergonomics, Pre-Production Agility & Zero Dead-Weight (`AGENTS.md` Rule 7), Adversarial Doubt-Driven Review (`Rule 2 & 6`)  
**Investigating Agent**: Subagent 01A (Lead Investigator)  
**Target Files**:
- `src/lib/report-utils.ts`
- `src/lib/report-utils.test.ts`
- `src/lib/report-data-loader.ts`
- `src/lib/report-data-loader.test.ts`
- `src/lib/date-utils.ts`
- `src/lib/date-utils.test.ts`
**Target Documentation**:
- `docs/TECHNICAL_MANUAL.md` (Chapters 1.4, 2.2, 3)
- `docs/ADR/014-mathematical-aggregation-parity-and-zero-dead-weight.md`
- `docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md`
- `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`
- `docs/ADR/022-issue-register-decisions-routing-periods-and-ci.md`
- `docs/ADR/025-core-infrastructure-sumrows-hardening-compute-proximity-and-shared-data-loader.md`
- `docs/ADR/028-track-2-core-save-machine-concurrency-and-numeral-normalization.md`
- `docs/KNOWN_ISSUES.md` (`KI-005`, `KI-006`, `KI-014`, `KI-015`, `KI-021`)

---

## 1. Executive Scorecard & Segment Quality Assessment

### Overall Segment Grade: **B+** (Solid Core Hardening, but Compromised by SQL View Arithmetic Summation and Client Query Duplication)

| Evaluation Dimension | Grade | Assessment Summary |
|:---|:---:|:---|
| **Mathematical Aggregation Parity** | **B** | `sumRows()` weighted averages and `sumHeaderRows()` stock/delta sorting are mathematically sound for single-zone periods. However, a critical defect exists where PostgreSQL view `view_city_meeting_agg` performs raw `sum(rm.city_avg_attendance)`, causing **13x arithmetic inflation** on single-month City Reports and compounding errors in multi-month aggregations. |
| **Bangladeshi Numeral & Unicode Ergonomics** | **A-** | `parseBangladeshiNumber()` and `toFiniteNumber()` thoroughly defend against Arabic commas (`،`), Arabic thousands separators (`٬`), fullwidth commas (`，`), and Bengali counting suffixes (`জন`, `টি`, `টা`). Clamping to non-negative integers preserves PostgreSQL `CHECK (col >= 0)` invariants. Minor edge cases exist with unstripped words or multiple numbers in voice-to-text. |
| **Timezone & Temporal Boundary Invariants** | **A** | `date-utils.ts` cleanly isolates `Asia/Dhaka` timezone math via module-level cached `DHAKA_FORMATTER` with infallible UTC+6 mathematical projection fallback, avoiding future-period lockouts on midnight boundary hours. |
| **Query Consolidation & Loader Architecture** | **B+** | `loadReportDataBundle()` successfully unifies PDF and Excel export data fetching (ADR 025). However, `src/app/report/page.tsx` still duplicates ~100 lines of query and aggregation logic, re-introducing the out-of-order month snapshot bug (RS-03) in the client web UI. |
| **Pre-Production Agility & Zero Dead-Weight (Rule 7)** | **B** | Lingering dual-string mappers (`DB_TYPE_MAP`, `URL_TO_ENGLISH_MAP`), category fallback shims, missing `month` column on `report_header`, and documentation drift across `TECHNICAL_MANUAL.md` and `KNOWN_ISSUES.md` show residual prototype artifacts that should be eliminated under Rule 7. |

---

## 2. Rule 7 Pre-Production Bloatware & Legacy Shenanigans Register

Under `AGENTS.md` Rule 7, the platform is in active pre-production development with zero live field workers. Defensive polyfills, dual-token mappers, and application-layer shims created to bypass database schema constraints must be cataloged and slated for clean DDL or architectural consolidation.

| Ref ID | Source Location | Description & Nature of Bloatware | Failure Mode & Field Consequences | Clean Pre-Production DDL / Architecture Remedy |
|:---|:---|:---|:---|:---|
| **BLOAT-01-01** | [`src/lib/report-utils.ts#L44-L74`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L44-L74) | **Dual-String Period Token Mappers (`DB_TYPE_MAP` & `URL_TO_ENGLISH_MAP`)**: 13 redundant bidirectional translation mappings between English tokens (`monthly`, `quarterly`, `halfYearly`, `nineMonth`, `yearly`, `custom`) and Bengali strings (`মাসিক`, `ত্রৈমাসিক`, `ষান্মাসিক`, `নয়-মাসিক`, `বার্ষিক`, `কাস্টম`, `কাস্টম রেঞ্জ`). | Forces dual-token maintenance throughout the frontend; whenever a new period or custom parameter is touched, both dicts must be updated. Creates confusion over whether DB stores English or Bengali identifiers. | Standardize database schemas and application models on canonical English enum values (`monthly`, `quarterly`, `half_yearly`, `nine_month`, `yearly`, `custom`) backed by PostgreSQL `CHECK (report_type IN (...))`. Confine Bengali strings exclusively to UI presentation labels in `i18n.ts`. |
| **BLOAT-01-02** | [`src/lib/report-data-loader.ts#L320-L323`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L320-L323) | **Dual-Category Fallback Shim for City Comment**: `overrideMap.get("comment:city_comment:মহানগরী মন্তব্য") \|\| overrideMap.get("comment:city_comment:")`. | Exists solely because older test rows had `category = ""` while newer rows had `category = "মহানগরী মন্তব্য"`. Violates Rule 7 by preserving obsolete test row compromises in application code. | Clean the test rows in `city_report_override`: `UPDATE city_report_override SET category = 'মহানগরী মন্তব্য' WHERE section = 'comment';`. Enforce exact category key lookup without fallback. |
| **BLOAT-01-03** | [`src/lib/report-data-loader.ts#L488-L491`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L488-L491) | **Application-Layer Header Month Shaping**: `report_header` lacks a native `month` column, forcing `loadReportDataBundle()` to query parent `report(id, month)`, build a `monthMap` in JS memory, and iterate through all rows to attach `month`. | Memory overhead, O(N) iteration, and high fragility: any component that forgets to build `monthMap` (e.g. `src/app/report/page.tsx#L269`) corrupts stock snapshot sorting! | Execute clean DDL migration: `ALTER TABLE public.report_header ADD COLUMN month smallint;`. Populate from parent `report` and update `get_or_create_report` RPC to insert `month` directly into `report_header`. |
| **BLOAT-01-04** | [`docs/TECHNICAL_MANUAL.md#L96-L98`](file:///d:/WebDev/report-submission/docs/TECHNICAL_MANUAL.md#L96-L98) | **Documentation Drift - Phantom Category Fallbacks**: Technical manual documents active dual-string fallbacks (`find(r => r.category === cat \|\| r.category === 'সহযোগী হয়েছে')` and `find(r => r.category === cat \|\| (cat === 'Committee Orientation' && x.category === 'Committee Orientation / Muallima Orientation'))`). | Inspection of `src/lib/report-utils.ts` and `src/lib/report-data-loader.ts` confirms these legacy fallbacks were already completely purged from code. Docs describe phantom polyfills that no longer exist. | Reconcile `docs/TECHNICAL_MANUAL.md` Chapters 2.3 and 3 to reflect canonical precomposed NFC category matching and purge references to obsolete dual-string fallbacks. |
| **BLOAT-01-05** | [`docs/KNOWN_ISSUES.md#L228`](file:///d:/WebDev/report-submission/docs/KNOWN_ISSUES.md#L228) | **Documentation Drift - Phantom Date Utilities**: `KNOWN_ISSUES.md` asserts that `date-utils.ts` exports `getDhakaDate()`, `getDhakaMonth()`, `getDhakaYear()`, `getDhakaDateObject()`, and `toDhakaIsoString()`. | Only `getDhakaDate()` and `getDhakaDateFallback()` exist in `src/lib/date-utils.ts`. The other 4 functions are phantom declarations. | Reconcile `docs/KNOWN_ISSUES.md` RS-50 entry to accurately list only live exports. |

---

## 3. 5-Layer Behavioral & Functional Defect Catalog

### Summary of Behavioral Defects

| # | Bug ID | Short Title | Exact Location | Severity | Layer | Blast Radius |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | **WEB-013** | Meeting Attendance 13x Arithmetic Inflation in SQL View & Single-Month City Loader | [`src/lib/report-data-loader.ts#L182-L191`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L182-L191) & `public.view_city_meeting_agg` | 🔴 CRITICAL | Layer 4 & 5 (DB View & Export) | High (City Reports, PDF, Excel) |
| 2 | **WEB-004** | Out-of-Order Stock Snapshot Resolution & Code Duplication in Report Overview | [`src/app/report/page.tsx#L250-L270`](file:///d:/WebDev/report-submission/src/app/report/page.tsx#L250-L270) | 🔴 CRITICAL | Layer 2 & 5 (Client State & UI) | High (Web Report Overview) |
| 3 | **WEB-011** | Custom Range Override Cross-Contamination via Under-Constrained Query | [`src/lib/report-data-loader.ts#L134-L140`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L134-L140) | 🟡 HIGH | Layer 3 & 4 (API & DB Query) | Medium (City Report Exports) |
| 4 | **WEB-004** | Unbounded Parameter Ingestion & NaN Propagation in `resolvePeriodConfig` | [`src/lib/report-utils.ts#L297-L299`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L297-L299) | 🟡 HIGH | Layer 2 & 3 (Client Config & URLs) | Medium (Period Selector & Routing) |
| 5 | **WEB-004** | Meeting Name and Comments Override Silently Dropped in City Reports | [`src/lib/report-data-loader.ts#L307-L308`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L307-L308) | 🟡 HIGH | Layer 5 (Export Engine) | Medium (PDF & Excel Custom Titles) |
| 6 | **WEB-008** | Month Array Typographical Drift between `report-utils.ts` and `i18n.ts` | [`src/lib/report-utils.ts#L8-L21`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L8-L21) vs [`src/lib/i18n.ts#L41-L54`](file:///d:/WebDev/report-submission/src/lib/i18n.ts#L41-L54) | 🟢 MEDIUM | Layer 1 & 2 (UI Rendering) | Low (Visual Polish & Orthography) |

---

### Detailed Defect Receipts & Root Cause Analysis

#### Defect 1: Meeting Attendance 13x Arithmetic Inflation in SQL View & Single-Month City Loader (`DEF-01-01` / `WEB-013`)
- **File & Line**: [`src/lib/report-data-loader.ts#L182-L191`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L182-L191), [`src/app/(admin)/city-report/page.tsx#L457-L468`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L457-L468), and PostgreSQL view `public.view_city_meeting_agg`.
- **Root Cause**:
  In PostgreSQL, the aggregation view `public.view_city_meeting_agg` was implemented with arithmetic summation over average columns:
  ```sql
  SELECT r.year, r.month, r.report_type, rm.category,
    sum(rm.city_count) AS city_count,
    sum(rm.city_avg_attendance) AS city_avg_attendance,
    sum(rm.thana_count) AS thana_count,
    sum(rm.thana_avg_attendance) AS thana_avg_attendance,
    sum(rm.ward_count) AS ward_count,
    sum(rm.ward_avg_attendance) AS ward_avg_attendance
  FROM public.report r
  JOIN public.report_meeting rm ON r.id = rm.report_id
  JOIN public.zone z ON r.zone_id = z.id
  WHERE z.zone_type IS DISTINCT FROM 'city'
  GROUP BY r.year, r.month, r.report_type, rm.category;
  ```
  In `report-data-loader.ts`:
  ```ts
  const rawMeeting = meetingRes.data || [];
  const computedMeeting = isMultiMonth
    ? sumRows(rawMeeting, [
        "city_count",
        "city_avg_attendance",
        "thana_count",
        "thana_avg_attendance",
        "ward_count",
        "ward_avg_attendance",
      ])
    : rawMeeting;
  ```
- **Failure Conditions**:
  1. **Single-Month City Reports (`isMultiMonth = false`)**: When an administrator views `/admin/city-report` or exports a single-month PDF/Excel for May 2026, `isMultiMonth` is `false`. The loader passes `rawMeeting` directly from `view_city_meeting_agg`. If 13 upazila zones each hold 1 meeting with an average attendance of 20, the view outputs `city_avg_attendance = 260`. The City Report displays **260 attendees per meeting instead of 20**!
  2. **Multi-Month City Reports (`isMultiMonth = true`)**: `sumRows(rawMeeting)` receives `rawMeeting` rows that *already* contain the 13x-inflated sums from `view_city_meeting_agg` for each constituent month. While `sumRows()` weights across months, its baseline input average is corrupted, leading to compounding mathematical errors.
- **Authoritative Invariant Broken**: `TECHNICAL_MANUAL.md` Chapter 2.3 & `ADR 014` (Weighted Mean Attendance Calculation: $\sum (\text{count} \times \text{avg}) / \sum \text{count}$).

---

#### Defect 2: Out-of-Order Stock Snapshot Resolution & Code Duplication in Report Overview (`DEF-01-02` / `WEB-004`)
- **File & Line**: [`src/app/report/page.tsx#L250-L270`](file:///d:/WebDev/report-submission/src/app/report/page.tsx#L250-L270)
- **Root Cause**:
  `src/app/report/page.tsx` bypassed the shared `loadReportDataBundle()` loader introduced in ADR 025 and retained an isolated, duplicate query implementation.
  In PostgreSQL, the `report_header` table does not possess a native `month` column (it links to parent `report_id`).
  In `src/lib/report-data-loader.ts#L488-L491`, ADR 025 resolved RS-03 by querying `monthlyReports.select("id, month")` and mapping `month: monthMap.get(h.report_id)` onto each header row before invoking `sumHeaderRows()`.
  However, `src/app/report/page.tsx` was never updated to use `monthMap`:
  ```ts
  const rawHeader = headerRes.data || [];
  setHeaderData(sumHeaderRows(rawHeader));
  ```
- **Failure Conditions**:
  When PostgREST returns multi-month `report_header` rows in non-chronological order (e.g. Month 3, Month 1, Month 2), `sumHeaderRows()` evaluates:
  ```ts
  const sorted = [...rows].sort((a, b) => (Number(a.month) || 0) - (Number(b.month) || 0));
  ```
  Because `h.month` is `undefined`, `(Number(undefined) || 0) = 0`. The sort comparator evaluates `0 - 0 = 0` and preserves arbitrary array arrival order.
  `sumHeaderRows()` selects `latest = sorted[sorted.length - 1]`, which is Month 2 instead of Month 3!
  The web UI at `/report` displays Month 2's inventory snapshot (`total_muallima`, `total_unit`), while the exported PDF/Excel (which uses `report-data-loader.ts`) displays Month 3.
- **Authoritative Invariant Broken**: `ADR 014` (Stock vs Flow snapshot selection) & `ADR 025` (Shared Loader single source of truth).

---

#### Defect 3: Custom Range Override Cross-Contamination via Under-Constrained Query (`DEF-01-03` / `WEB-011`)
- **File & Line**: [`src/lib/report-data-loader.ts#L134-L140`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L134-L140) vs [`src/app/(admin)/city-report/page.tsx#L398-L406`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L398-L406)
- **Root Cause**:
  In `report-data-loader.ts`, the override query for Case B (City Aggregation) filters by:
  ```ts
  supabase
    .from("city_report_override")
    .select("*")
    .eq("year", year)
    .eq("report_type", dbType)
    .eq("end_month", isMultiMonth ? (activePeriod?.endMonth || 0) : 0)
    .in("month", months)
  ```
  It queries `.in("month", months)` without pinning `.eq("month", activePeriod.overrideMonth)`!
  In `city_report_override`, multi-month overrides are canonically stored with `month = startMonth` and `end_month = endMonth`.
- **Failure Conditions**:
  Consider two custom ranges sharing the same end month:
  - Range A: March to June (`startMonth = 3, endMonth = 6`). An override is saved with `month = 3, end_month = 6`.
  - Range B: February to June (`startMonth = 2, endMonth = 6`).
  When generating an export for Range B, `months` is `[2, 3, 4, 5, 6]`.
  The query matches `.eq("end_month", 6)` and `.in("month", [2, 3, 4, 5, 6])`.
  The database returns the override from Range A (`month = 3`). In `report-data-loader.ts#L198-L202`, Range A's override is loaded into `overrideMap` and applied to Range B's export, corrupting the exported report!
  Furthermore, in `src/app/(admin)/city-report/page.tsx#L403-L405`, the query has redundant duplicate filters:
  ```ts
  .eq("month", overrideMonth)
  .eq("end_month", activePeriod.isMultiMonth ? activePeriod.endMonth : 0)
  .in("month", months)
  ```
  Chaining both `.eq("month", overrideMonth)` and `.in("month", months)` on the same query demonstrates severe query filter drift between web UI and server loader.
- **Authoritative Invariant Broken**: `TECHNICAL_MANUAL.md` §3.1 (`city_report_override` 7-column unique constraint & period isolation).

---

#### Defect 4: Unbounded Parameter Ingestion & NaN Propagation in `resolvePeriodConfig` (`DEF-01-04` / `WEB-004`)
- **File & Line**: [`src/lib/report-utils.ts#L297-L299`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L297-L299), [`L333-L336`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L333-L336), [`L339-L341`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L339-L341)
- **Root Cause**:
  In `resolvePeriodConfig()`, bounds checking is implemented for `quarterly`, `halfYearly`, and `custom`, but completely omitted for `monthly`:
  ```ts
  if (englishType === "monthly") {
    startMonth = input.month ? Number(input.month) : dhaka.month;
    endMonth = startMonth;
  }
  ```
- **Failure Conditions**:
  1. If an untrusted or malformed query parameter `?month=invalid` is parsed, `Number("invalid")` returns `NaN`. `startMonth` becomes `NaN`.
  2. `MONTHS_BN[startMonth - 1]` evaluates to `MONTHS_BN[NaN - 1] = undefined`.
  3. `labelBn` becomes `"undefined ২০২৬"`.
  4. `isFuture` evaluates `year > dhaka.year || (year === dhaka.year && NaN > dhaka.month)`, which evaluates to `false`. A malformed month string completely circumvents the Start-Month Future Lockout rule!
- **Authoritative Invariant Broken**: `ADR 022` §3.2 (Start-Month Future Lockout Governance).

---

#### Defect 5: Meeting Name and Comments Override Silently Dropped in City Reports (`DEF-01-05` / `WEB-004`)
- **File & Line**: [`src/lib/report-data-loader.ts#L307-L308`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L307-L308), [`L259`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L259)
- **Root Cause**:
  In `loadReportDataBundle()`, Case B (City Aggregation) iterates over `MEETING_CATEGORIES` to build the `meetings` array:
  ```ts
  const meetings = MEETING_CATEGORIES.map((cat) => {
    const item = computedMeeting.find((x: any) => x.category === cat) || {};
    return {
      category: cat,
      city_count: getVal("meetings", "city_count", item.city_count || 0, cat),
      // ...
      meeting_name: item.meeting_name || "",
      comments: item.comments || "",
    };
  });
  ```
  `getVal()` is only called for numeric columns (`city_count`, `city_avg_attendance`, etc.).
  `meeting_name` and `comments` bypass `overrideMap` and read directly from `item`.
  However, in PostgreSQL, `view_city_meeting_agg` only aggregates numeric columns and does NOT project `meeting_name` or `comments`. Thus `item.meeting_name` is always `undefined`.
- **Failure Conditions**:
  When a city admin uses `CorrectionButton` in `/city-report` to set a custom title for the "অন্যান্য" meeting row (e.g. `meeting_name = "কুরআন সেমিনার"`), the override is saved to `city_report_override`.
  When generating a PDF or Excel export, `report-data-loader.ts` lines 307-308 ignore the override, leaving `meeting_name: ""`.
  The PDF export falls back to printing generic `"অন্যান্য"` instead of `"কুরআন সেমিনার"`.
- **Authoritative Invariant Broken**: `TECHNICAL_MANUAL.md` Chapter 2.3 §5 (Custom Meeting Title replacement in exports).

---

#### Defect 6: Month Array Typographical Drift between `report-utils.ts` and `i18n.ts` (`DEF-01-06` / `WEB-008`)
- **File & Line**: [`src/lib/report-utils.ts#L8-L21`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L8-L21) vs [`src/lib/i18n.ts#L41-L54`](file:///d:/WebDev/report-submission/src/lib/i18n.ts#L41-L54)
- **Root Cause**:
  There are two independent arrays defining Bengali month names:
  1. `MONTHS_BN` in `report-utils.ts`:
     `["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]`
  2. `translations.bn.months` in `i18n.ts`:
     `["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]`
  `MONTHS_BN` uses the traditional spelling with `য-ফলা` (`জানুয়ারি`), while `i18n.ts` uses modern Bangla Academy spelling without `য-ফলা` (`জানুয়ারি`).
- **Failure Conditions**:
  Period titles formatted via `resolvePeriodConfig()` (which uses `MONTHS_BN`) output `"জানুয়ারি ২০২৬"`.
  Dates formatted via `formatMonthYear()` (which uses `i18n.ts`) output `"জানুয়ারি ২০২৬"`.
  When users navigate between the period selector and dashboard cards, the spelling of January and February visibly shifts back and forth.
- **Authoritative Invariant Broken**: UI Typographic Hierarchy & Consistent Localization.

---

## 4. Impeccable UI/UX, Mobile Ergonomics & Accessibility Review

While Segment 01 primarily comprises pure data calculation and loading utilities, it serves as the foundational data provider for all UI matrix forms, mobile inputs, and document exports.

### 4.1 Bangladeshi Mobile Voice Typing & Classifier Normalization
- **Voice Typing Classifiers**: Field workers in rural Bangladesh frequently use Android speech-to-text (Google Voice Typing in Bengali). Spoken numbers produce counting classifiers: `"১২ জন"`, `"১৫টি"`, `"১০টা"`, `"৫ খানা"`, `"মোট ২৫ জন"`.
- **Current Behavior in `parseBangladeshiNumber()`**:
  ```ts
  const enConverted = bnToEn(normalized);
  const separatorsStripped = enConverted.replace(UNICODE_SEPARATOR_REGEX, "");
  const classifiersStripped = separatorsStripped.replace(/(জন|টি|টা|খানা|খানি|টিই|জনই|জনশক্তি|টি\s*করে)$/g, "");
  const match = classifiersStripped.match(/-?\d+(?:\.\d+)?/);
  ```
- **Strengths**: Stripping `UNICODE_SEPARATOR_REGEX` (`[,،٬，_\s\u00A0\u202F]`) successfully prevents the catastrophic 150,000x headcount erasure caused by Arabic commas (`،`) and Islamic keyboard separators (ADR 028).
- **Weaknesses & Traps**:
  1. `UNICODE_SEPARATOR_REGEX` strips all whitespace `\s` *before* matching digits. If a user types two distinct numbers separated by a space (e.g. `"12 34"`), they are concatenated into `"1234"` instead of parsing the primary token or failing validation.
  2. The classifier regex only targets suffixes (`$`). If voice typing produces prefixes or spoken sentences (e.g. `"উপস্থিত ১২ জন"`), the digits `"12"` are extracted correctly by `match()`, but if voice typing produces `"৩ নম্বর ইউনিটে ১৫ জন"` (15 people in Unit 3), `match()` grabs `"3"` instead of the target metric `"15"`.

### 4.2 Dual Parsing Implementations (`toFiniteNumber` vs `parseBangladeshiNumber`)
- **Architectural Schism**: The codebase maintains two separate numeric parsers with conflicting contracts:
  - `toFiniteNumber(val)`: Uses `Number(en)`. Does NOT strip Bengali classifiers. Returns floating-point numbers (`12.5`). If passed `"১২ জন"`, it returns `0`!
  - `parseBangladeshiNumber(val)`: Strips classifiers, extracts integer token via regex, rounds floats via `Math.round()`, and clamps to non-negative integers (`col >= 0`).
- **Ergonomic Hazard**: When an admin enters an override in `CorrectionButton`, `parseBangladeshiNumber` parses it into an integer. But when `loadReportDataBundle()` loads that override via `getVal()`, it passes it through `toFiniteNumber()`. If the override string contained an unexpected suffix, `toFiniteNumber()` silently zeroes it out.

### 4.3 Timezone Calculations & Temporal Invariants
- `getDhakaDate()` in `src/lib/date-utils.ts` is exceptionally well-engineered:
  - Uses a cached `DHAKA_FORMATTER` singleton (`Intl.DateTimeFormat`) to prevent memory allocations on SSR.
  - Features an infallible mathematical UTC+6 projection fallback (`date.getTime() + 6 * 3600 * 1000`), ensuring 100% immunity against Vercel serverless timezone desynchronization during the critical 12:00 AM – 05:59 AM BST monthly boundary window.
  - Bangladesh Standard Time (BST) abolished Daylight Saving Time (DST) permanently in 2009; fixed UTC+6 math is mathematically immutable.

---

## 5. Cross-Segment Blast Radius & Cohesion Warnings

Modifications to Segment 01 have wide-reaching blast radius across the entire application:

```
┌────────────────────────────────────────────────────────────────────────┐
│               SEGMENT 01: DATA CALCULATION & DATA LOADER               │
│         (report-utils.ts, report-data-loader.ts, date-utils.ts)        │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
       Exports & Bundles               Period Configuration & Formulas
                    ▼                               ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  SEGMENT 06: Admin & Export Engines  │  │  SEGMENT 03: Form Ergonomics │
│  - /api/export/pdf (route.tsx)       │  │  - courses-form.tsx          │
│  - /api/export/excel (route.ts)      │  │  - personal-form.tsx         │
│  - /admin/city-report (page.tsx)     │  │  - meetings-form.tsx         │
│  (Directly consume ReportDataBundle) │  │  (Consume categories & toBn) │
└──────────────────────────────────────┘  └──────────────────────────────┘
                    │                               │
                    ▼                               ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│    SEGMENT 05: Canonical Routing     │  │  SEGMENT 02: Save Machine    │
│  - period-selector.tsx               │  │  - auto-save-field.tsx       │
│  - /report (overview page.tsx)       │  │  - report-context.tsx        │
│  (Consumes resolvePeriodConfig)      │  │  (Consumes parseBangladeshi) │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

1. **Impact on Segment 06 (Export Engines & City Report)**:
   - Fixing `view_city_meeting_agg` in PostgreSQL to compute true weighted averages directly corrects both `/admin/city-report` and the PDF/Excel exporters (`/api/export/*`).
   - Pinning `.eq("month", overrideMonth)` in `loadReportDataBundle()` prevents custom range override collisions in exported documents.
2. **Impact on Segment 05 (Routing & Report Overview Page)**:
   - Eliminating the duplicate querying in `src/app/report/page.tsx` and refactoring it to consume `loadReportDataBundle()` immediately resolves the out-of-order month snapshot bug (RS-03) and ensures 100% visual parity between the web dashboard and exported PDFs.
   - Tightening month bounds in `resolvePeriodConfig()` guarantees period selectors cannot generate `"undefined ২০২৬"` or bypass future-period locks.
3. **Impact on Segment 02 & 03 (Form Ergonomics & Save Machine)**:
   - Unifying `toFiniteNumber()` and `parseBangladeshiNumber()` into a single authoritative parsing contract ensures form inputs, autosave flushes, and aggregation calculations share identical rounding and classifier rules.

---

## 6. Competing Multi-Option Remediation Proposals (Rules 2 & 6)

In accordance with `AGENTS.md` Rules 2 and 6, every non-trivial defect must present competing architectural alternatives evaluated through the adversarial "Doubt Gate" without strawmen or trivial cons.

---

### Proposal 1: Remediation of Meeting Attendance Summation Defect (`DEF-01-01`)

#### Problem Statement:
PostgreSQL view `view_city_meeting_agg` performs raw `sum(rm.city_avg_attendance)` across zones, causing a **13x arithmetic inflation** on single-month City Reports and compounding errors in multi-month exports.

#### Competing Alternatives:

##### Option A: Clean PostgreSQL View Re-Architecture with SQL Weighted Means (Recommended)
- **Architecture**: Update `public.view_city_meeting_agg` DDL directly in Supabase to calculate the weighted mean in PostgreSQL:
  ```sql
  CREATE OR REPLACE VIEW public.view_city_meeting_agg WITH (security_invoker = true) AS
  SELECT 
    r.year, 
    r.month, 
    r.report_type, 
    rm.category,
    sum(rm.city_count) AS city_count,
    CASE 
      WHEN sum(rm.city_count) > 0 THEN round(sum(rm.city_count * rm.city_avg_attendance)::numeric / sum(rm.city_count)::numeric)
      ELSE 0 
    END AS city_avg_attendance,
    sum(rm.thana_count) AS thana_count,
    CASE 
      WHEN sum(rm.thana_count) > 0 THEN round(sum(rm.thana_count * rm.thana_avg_attendance)::numeric / sum(rm.thana_count)::numeric)
      ELSE 0 
    END AS thana_avg_attendance,
    sum(rm.ward_count) AS ward_count,
    CASE 
      WHEN sum(rm.ward_count) > 0 THEN round(sum(rm.ward_count * rm.ward_avg_attendance)::numeric / sum(rm.ward_count)::numeric)
      ELSE 0 
    END AS ward_avg_attendance
  FROM public.report r
  JOIN public.report_meeting rm ON r.id = rm.report_id
  JOIN public.zone z ON r.zone_id = z.id
  WHERE (z.zone_type IS DISTINCT FROM 'city')
  GROUP BY r.year, r.month, r.report_type, rm.category;
  ```
- **Trade-off Analysis**:
  - *Benefits*: Pushes aggregation to the database layer (Rule 7); eliminates arithmetic inflation at the root; automatically fixes single-month City Reports without modifying application code; preserves `security_invoker = true`.
  - *Real Risks & Failure Modes*: If a zone enters attendance with count = 0, `NULLIF` / `CASE` ensures division by zero defaults safely to 0.

##### Option B: Application-Layer Polyfill in `report-data-loader.ts` & `city-report/page.tsx`
- **Architecture**: Leave the broken SQL view as-is. In `report-data-loader.ts` and `city-report/page.tsx`, query raw `report_meeting` records for all 13 zones and calculate the weighted average in Node.js / browser JavaScript via `sumRows()`.
- **Trade-off Analysis**:
  - *Benefits*: Requires zero SQL migrations.
  - *Real Risks & Failure Modes*: Violates Rule 7 by inventing application-layer shims to avoid clean DDL; increases network payload size by fetching 13x more rows across the Pacific; leaves a known-broken view in PostgreSQL that will infect any future reporting tool or query.

##### Option C: Consolidated PostgreSQL Stored Function (`get_city_meeting_summary`)
- **Architecture**: Drop the view entirely and create a parameterized PostgreSQL RPC returning pre-aggregated multi-month JSON.
- **Trade-off Analysis**:
  - *Benefits*: Maximum performance; single database round-trip.
  - *Real Risks & Failure Modes*: High architectural overhead; less composable with PostgREST query builders; requires full RPC deployment.

#### Decision Recommendation:
**Adopt Option A**. It directly executes the Rule 7 mandate: fix the database view cleanly so that both SQL queries and application loaders receive mathematically correct data.

---

### Proposal 2: Remediation of Report Overview Duplicate Querying & Stock Snapshot Bug (`DEF-01-02`)

#### Problem Statement:
`src/app/report/page.tsx` duplicates ~100 lines of query and aggregation logic and fails to inject `month` into `report_header` rows, causing multi-month stock snapshots (`total_muallima`, `total_unit`) to resolve from arbitrary row order rather than the latest month.

#### Competing Alternatives:

##### Option A: Consolidate `report/page.tsx` onto `loadReportDataBundle()` (Recommended)
- **Architecture**: Refactor `src/app/report/page.tsx` to call `loadReportDataBundle()` directly. Delete the 100+ lines of duplicated child table queries and manual `sumRows()` / `sumHeaderRows()` loops.
- **Trade-off Analysis**:
  - *Benefits*: Eliminates 100+ lines of dead-weight duplication; guarantees 100% calculation parity between web view and PDF/Excel exports; automatically inherits RS-03 chronological month sorting and error handling.
  - *Real Risks & Failure Modes*: `report/page.tsx` must adapt its state setters (`setHeaderData`, `setCoursesData`, etc.) to receive the `ReportDataBundle` structure.

##### Option B: Local Patch in `src/app/report/page.tsx` (Status Quo Band-Aid)
- **Architecture**: Duplicate the `monthMap` logic from `report-data-loader.ts` into `src/app/report/page.tsx`:
  ```ts
  const monthMap = new Map((monthlyReports || []).map((r: any) => [r.id, r.month]));
  const rawHeader = (headerRes.data || []).map((h: any) => ({ ...h, month: monthMap.get(h.report_id) }));
  setHeaderData(sumHeaderRows(rawHeader));
  ```
- **Trade-off Analysis**:
  - *Benefits*: Surgical, localized edit.
  - *Real Risks & Failure Modes*: Violates DRY and Rule 7; preserves two divergent copies of the query and aggregation engine; future bug fixes will drift again.

##### Option C: Add `month` Column to `report_header` Table via DDL
- **Architecture**: Execute `ALTER TABLE public.report_header ADD COLUMN month smallint;` and update `get_or_create_report` RPC to store `month` directly on `report_header`.
- **Trade-off Analysis**:
  - *Benefits*: Permanently fixes the root cause at the database layer; eliminates `monthMap` in both `report-data-loader.ts` and `report/page.tsx`.
  - *Real Risks & Failure Modes*: Requires updating existing rows via `UPDATE report_header rh SET month = r.month FROM report r WHERE rh.report_id = r.id;`. Pairs ideally with Option A.

#### Decision Recommendation:
**Adopt Option A paired with Option C**. Add `month` to `report_header` in PostgreSQL (Option C) and unify `report/page.tsx` onto `loadReportDataBundle()` (Option A).

---

### Proposal 3: Remediation of Custom Range Override Query Collision (`DEF-01-03`)

#### Problem Statement:
`loadReportDataBundle()` queries `city_report_override` with `.in("month", months)` instead of pinning `.eq("month", activePeriod.overrideMonth)`. Overlapping custom ranges sharing an end month cross-contaminate and overwrite each other.

#### Competing Alternatives:

##### Option A: Pin Exact `.eq("month", overrideMonth).eq("end_month", endMonth)` (Recommended)
- **Architecture**: In `src/lib/report-data-loader.ts#L134-L140` and `src/app/(admin)/city-report/page.tsx#L398-L406`, standardize the query:
  ```ts
  supabase
    .from("city_report_override")
    .select("*")
    .eq("year", year)
    .eq("report_type", dbType)
    .eq("month", activePeriod.overrideMonth)
    .eq("end_month", isMultiMonth ? (activePeriod.endMonth || 0) : 0)
  ```
  Completely eliminate `.in("month", months)` from the override query.
- **Trade-off Analysis**:
  - *Benefits*: Matches the exact 7-column unique constraint `city_report_override_period_unique` (`year, month, end_month, report_type, section, field, category`); eliminates multi-row clashing across custom ranges; removes redundant query chaining in `city-report/page.tsx`.
  - *Real Risks & Failure Modes*: Assumes all historical overrides were saved with `month = startMonth`. (Confirmed by `CorrectionButton#L60`: `month: getOverrideMonthForPeriod(reportType, month)`).

##### Option B: In-Memory Disambiguation in TypeScript
- **Architecture**: Keep `.in("month", months)` in the database query, but filter the returned array in JavaScript:
  ```ts
  const overrides = (overrideRes.data || []).filter(o => o.month === activePeriod.overrideMonth);
  ```
- **Trade-off Analysis**:
  - *Benefits*: Tolerates sloppy database queries.
  - *Real Risks & Failure Modes*: Wastes database egress bandwidth; masks under-constrained SQL filtering.

#### Decision Recommendation:
**Adopt Option A**. It enforces precise query alignment with the underlying database constraint.

---

### Proposal 4: Remediation of Unvalidated Month Parameter in `resolvePeriodConfig` (`DEF-01-04`)

#### Problem Statement:
Passing malformed strings (`?month=invalid`) or out-of-range numbers to `resolvePeriodConfig()` causes `NaN` month propagation, `"undefined ২০২৬"` labels, and bypasses the Start-Month Future Lockout rule.

#### Competing Alternatives:

##### Option A: Strict Numeric Clamping & Fallback to Current Dhaka Month (Recommended)
- **Architecture**: Update `src/lib/report-utils.ts#L297-L299`:
  ```ts
  if (englishType === "monthly") {
    const rawMonth = Number(input.month);
    startMonth = Number.isInteger(rawMonth) && rawMonth >= 1 && rawMonth <= 12 
      ? rawMonth 
      : dhaka.month;
    endMonth = startMonth;
  }
  ```
  Apply identical clamping to `year`:
  ```ts
  const rawYear = Number(input.year);
  const year = Number.isInteger(rawYear) && rawYear >= 2020 && rawYear <= 2050 
    ? rawYear 
    : dhaka.year;
  ```
- **Trade-off Analysis**:
  - *Benefits*: Zero external dependencies; 100% resilient against URL query tampering; guarantees valid Bengali period labels (`MONTHS_BN[startMonth - 1]`); enforces the Start-Month Future Lockout rule under all input variations.
  - *Real Risks & Failure Modes*: None. Standard defensive programming.

##### Option B: External Schema Validation (Zod)
- **Architecture**: Re-install `zod` to validate all input objects before calling `resolvePeriodConfig`.
- **Trade-off Analysis**:
  - *Benefits*: Declarative schema syntax.
  - *Real Risks & Failure Modes*: Directly violates ADR 014 (which uninstalled `zod` under the Zero Dead-Weight Policy to minimize bundle size). Unnecessary for pure primitive clamping.

#### Decision Recommendation:
**Adopt Option A**. Lightweight, native, and completely bulletproof.

---

## 7. Action Plan & Next Steps for Dialectical Pair

1. **Submission to Adversarial Reviewer (Subagent 01B)**:
   - Deliver this comprehensive investigation report to Subagent 01B for adversarial stress-testing through the "Doubt Gate".
   - Specific adversarial focus: verify whether updating `view_city_meeting_agg` causes any performance regression on large multi-zone queries or unique key collisions on existing test rows.
2. **Post-Review Execution Readiness**:
   - Once vetted by Subagent 01B, prepare the prioritized migration DDL for `view_city_meeting_agg` and `report_header.month`.
   - Refactor `src/app/report/page.tsx` to consume `loadReportDataBundle()`.
   - Update `docs/TECHNICAL_MANUAL.md` and `docs/KNOWN_ISSUES.md` to reconcile documentation drift.

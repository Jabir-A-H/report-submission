# Architectural Critique & Adversarial Review — Segment 6: Export Pipeline & Interactive Documentation

**Reviewer**: Senior Engineering Manager & Principal Systems Architect (Agent 2)  
**Target Scope**: 
- `src/app/api/export/pdf/route.tsx`
- `src/app/api/export/excel/route.ts`
- `src/components/admin/reports/city-report-pdf.tsx`
- `src/app/help/page.tsx`
- `src/app/help/help-diagram-client.tsx`  
**Governing Invariants**: `docs/TECHNICAL_MANUAL.md`, `docs/KNOWN_ISSUES.md`, ADRs 007, 009, 012, 018, 019, 020, 021, 022, 023, and `AGENTS.md`.

---

## 1. Executive Summary & Architecture Scorecard

### Overall Status: C+ (Needs Stabilization Before Production Release)

The Export Pipeline and Interactive Documentation segment forms the primary tangible interface between the digital application and physical field operations. While the text-first rewrites in `src/app/help/` successfully eliminate confusing technical jargon (in accordance with ADR 019), and the PDF/Excel engines provide high visual fidelity, a rigorous adversarial review reveals **severe structural, layout budgeting, and data integrity regressions** that violate architectural decisions and compromise production field readiness.

### Core Critical Defects Identified:
1. **ADR 007 Page Budgeting Breach**: The PDF export engine violates the hard constraint of **exactly 2 Landscape A4 pages**. Page 2 is overloaded with both Maktab and Safar summary blocks, exceeding the 523 pt usable page height and causing a destructive spill onto an unwanted 3rd page whenever qualitative comments or signatures are present.
2. **City Override & Custom Range Amnesia**: Case B (City Aggregation) in both PDF and Excel export routes completely ignores `endMonth` parameters and fails to translate incoming English URL type tokens (`quarterly`, `halfYearly`) via `DB_TYPE_MAP`. Consequently, queries to `city_report_override` return zero rows, silently discarding all admin overrides and truncating custom ranges.
3. **Total Omission of City Remarks (Section 5)**: Qualitative city remarks saved under `section="comment"` in `city_report_override` are never extracted in Case B. PDF exports unconditionally display `"কোনো মন্তব্য যোগ করা হয়নি।"`, while Excel exports omit the comments section entirely.
4. **DCS Zone 1 Misrouting**: Exporting reports for Dhaka City South (`zone_id=1`) from `/report` routes into single-zone export (Case A) instead of city aggregation (Case B), generating a blank document filled with zeros and dashes.
5. **Dead Client Bundle Liability**: `src/components/admin/reports/city-report-pdf.tsx` is an orphaned, unreferenced prototype carrying a `'use client'` directive and an invalid `Helvetica` font declaration that renders Bengali text as broken squares.

---

### Segment 6 Executive Scorecard

| Category | Grade | Summary Assessment |
| :--- | :---: | :--- |
| **Architecture & Modularity** | **C+** | Monolithic route handlers (~1,110 and ~830 lines) duplicating ~255 lines of data-fetching logic; orphaned prototype component `city-report-pdf.tsx` retained in source tree. |
| **Data Integrity & Override Accuracy** | **C** | Case B export routes fail to map English type parameters to Bengali database keys, strip `endMonth` on custom ranges, and drop Section 5 city remarks. |
| **Layout Budgeting & Print Reliability** | **C+** | Page 2 exceeds usable A4 landscape vertical height (558 pt vs 523 pt limit), spilling onto Page 3; ASCII English numerals contaminate Bengali document headers. |
| **UX & Assistive Accessibility (Help)** | **B-** | High-quality Bengali documentation copy, but sticky stepper exhibits sub-44px touch targets (~32px), 6th column wrapping anomalies, missing ARIA semantics, and top-scroll desynchronization on mode switch. |
| **Serverless Deployment Readiness** | **C+** | Font asset `kalpurush.ttf` loaded via runtime `fs` path without `outputFileTracingIncludes` tracing in `next.config.mjs`; 0% automated test coverage for export routes. |

---

## 2. Adversarial Doubt Gate: Cross-Examination of Agent 1 Findings

Every finding submitted by Agent 1 was subjected to rigorous code inspection, architectural stress-testing, and mathematical validation against repo invariants.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             FINDINGS EVALUATION MATRIX                           │
├────┬───────────────────────────────────────────────────────┬──────────┬──────────┤
│ ID │ Finding Description                                   │ Severity │ Verdict  │
├────┼───────────────────────────────────────────────────────┼──────────┼──────────┤
│ 01 │ PDF Page 2 Vertical Budget Overflow Onto Page 3       │ CRITICAL │ CONFIRMED│
│ 02 │ Multi-Month & Custom Range Overrides Stripped         │ HIGH     │ CONFIRMED│
│ 03 │ City Qualitative Remarks (Section 5) Omitted          │ HIGH     │ CONFIRMED│
│ 04 │ DCS Zone 1 Misrouting to Empty Document               │ HIGH     │ CONFIRMED│
│ 05 │ Dead, Broken Client Component `city-report-pdf.tsx`   │ MEDIUM   │ CONFIRMED│
│ 06 │ Bengali Terminology Drift in Excel Export             │ MEDIUM   │ CONFIRMED│
│ 07 │ ASCII English Numerals in PDF Title `periodLabel`     │ LOW      │ CONFIRMED│
│ 08 │ Help Stepper Touch Targets Under 44px (~32px)         │ MEDIUM   │ CONFIRMED│
│ 09 │ Missing ARIA Tab Semantics in Help Stepper            │ LOW      │ CONFIRMED│
│ 10 │ Help Guide Mode Switcher Fails to Scroll to Top       │ LOW      │ CONFIRMED│
│ 11 │ Monolithic Export Handlers Lacking Test Seams         │ MEDIUM   │ CONFIRMED│
│ 12 │ Serverless Font Asset Tracing Risk in next.config     │ HIGH     │ CONFIRMED│
└────┴───────────────────────────────────────────────────────┴──────────┴──────────┘
```

---

### Detailed Finding Analysis

#### Finding 1: PDF Page 2 Vertical Budget Overflow Onto Page 3 (ADR 007 Violation)
- **Status**: **CONFIRMED & MATHEMATICALLY PROVEN**
- **Location**: [`src/app/api/export/pdf/route.tsx:566-711`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L566-L711)
- **Code Reality**: In `route.tsx`, Page 1 terminates at line 563 immediately after Table 3 (`ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন`). Page 2 contains Table 2 (`দাওয়াত ও সংগঠন`), Table 4 (`বৈঠকসমূহ`), Inline Maktab Stats Block (lines 654-674), Inline Safar Stats Block (lines 677-697), Comments Section (lines 700-705), and Signature Block (lines 707-710).
- **Mathematical Budget Proof**:
  - Landscape A4 Dimensions: `842.0 pt` width × `595.28 pt` height.
  - Page Padding (`styles.page`): `36 pt` top + `36 pt` bottom = `72 pt`.
  - **Maximum Usable Vertical Height**: `595.28 - 72.0 = 523.28 pt`.
  - **Actual Page 2 Element Heights**:
    - Table 2 (15 data rows @ ~16 pt + 1 header @ ~18 pt + 8 pt margin): `~266 pt`.
    - Table 4 (5 data rows @ ~16 pt + 2 header levels @ ~34 pt + 8 pt margin): `~122 pt`.
    - Maktab Stats Block (border, padding, title, grid row): `~45 pt`.
    - Safar Stats Block (border, padding, title, grid row): `~45 pt`.
    - Comments Container (`minHeight: 32 pt`, padding `5 pt`, label `8 pt`, margin `10 pt`): `~55 pt`.
    - Signature Block (`marginTop: 12 pt`, line, text): `~25 pt`.
    - **Total Page 2 Vertical Height**: `266 + 122 + 45 + 45 + 55 + 25 = 558 pt`!
  - `558 pt > 523.28 pt` — **Overflow by 34.72 pt**. Any multi-line qualitative comment causes the signature and comments to spill onto a completely blank 3rd page, violating the double-sided single-sheet printing invariant established in [ADR 007 §2.5](file:///d:/WebDev/report-submission/docs/ADR/007-authoritative-labeling-harmonization-and-2-page-landscape-pdf-architecture.md#L65-L77).
- **The Invariant Solution**: Re-anchor the layout to ADR 007 Section 2.5: **Move the Maktab Stats Block to Page 1 below the Personal Table**. Page 1 currently consumes only ~433 pt, leaving ~90 pt of unused vertical headroom. Moving Maktab (~45 pt) to Page 1 leaves Page 1 at ~478 pt (comfortably below 523 pt) and reduces Page 2 to `558 - 45 = 513 pt`, creating adequate headroom for multi-line comments.

---

#### Finding 2: Multi-Month & Custom Range Overrides Stripped
- **Status**: **CONFIRMED & STRENGTHENED**
- **Location**: [`src/app/api/export/pdf/route.tsx:926-954`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L926-L954) & [`src/app/api/export/excel/route.ts:488-515`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts#L488-L515)
- **Code Reality**:
  ```ts
  // src/app/api/export/pdf/route.tsx:929-953
  reportType = reportTypeParam || "মাসিক";
  const months = getMonthsForPeriod(reportType, month);
  ...
  supabase.from("city_report_override").select("*").eq("year", year).eq("report_type", reportType).in("month", months);
  ```
  1. Neither route maps `reportTypeParam` through `DB_TYPE_MAP`. When callers pass English URL tokens (`?type=quarterly`), `reportType` remains `"quarterly"`. However, rows in `city_report_override` store `report_type` in Bengali (`ত্রৈমাসিক`, `ষান্মাসিক`, `বার্ষিক`, `কাস্টম`). The query `.eq("report_type", "quarterly")` returns 0 rows, completely stripping all overrides!
  2. In Case B, `searchParams.get("endMonth")` is completely omitted. Calling `getMonthsForPeriod("custom", month)` without `endMonth` collapses custom multi-month spans down to a single month `[m]`.
- **Architectural Solution**: Both export handlers must standardize on [`resolvePeriodConfig`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L207-L299), which resolves `englishType`, `dbType`, `months`, `isMultiMonth`, and canonical `overrideMonth` in a single unified helper.

---

#### Finding 3: City Qualitative Remarks (Section 5) Omitted
- **Status**: **CONFIRMED**
- **Location**: [`src/app/api/export/pdf/route.tsx:759, 1074`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L759-L1074) & [`src/app/api/export/excel/route.ts:483-782`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts#L483-L782)
- **Code Reality**:
  - In `route.tsx`, `comment` is initialized to `null` at line 759. In Case B (lines 921-1074), `comment` is never assigned. Consequently, line 703 renders `"কোনো মন্তব্য যোগ করা হয়নি।"` for every city report, regardless of whether admins submitted remarks.
  - In `route.ts`, Case B terminates after Section 6 (Extras), completely omitting Section 7 (Comments).
  - In [`src/app/(admin)/city-report/page.tsx:1247-1253`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L1247-L1253), admins write city comments to `city_report_override` with `section="comment"`, `field="city_comment"`, and `category="মহানগরী মন্তব্য"`.
- **Fix**: In Case B data assembly, extract the qualitative override:
  ```ts
  const cityComment = overrideMap.get("comment:city_comment:মহানগরী মন্তব্য") || overrideMap.get("comment:city_comment:") || "";
  comment = { comment: cityComment };
  ```
  And render Section 7 in Excel Case B identically to Case A.

---

#### Finding 4: DCS Zone 1 Misrouting to Empty Document
- **Status**: **CONFIRMED**
- **Location**: [`src/app/report/page.tsx:389-415`](file:///d:/WebDev/report-submission/src/app/report/page.tsx#L389-L415)
- **Code Reality**:
  - When an admin views Dhaka City South (`zone_id = 1`) on `/report` and triggers PDF/Excel export, lines 393 and 409 construct URLs containing `zone_id=1`.
  - In `route.tsx:766` and `route.ts:92`, the presence of `zoneIdParam` routes the request into **Case A (Single Zone Export)**.
  - Case A queries the `report` table for `zone_id = 1`. Under [ADR 009](file:///d:/WebDev/report-submission/docs/ADR/009-zone-hierarchy-type-column-and-admin-site-restructure.md#L13-L27), DCS is the administrative city entity; it has no raw data rows in `report`.
  - The query returns zero rows, causing the exporter to output an empty document of zeros and dashes.
- **Fix**: In `route.tsx` and `route.ts`, intercept `targetZoneId === 1` (or `zone.zone_type === 'city'`) and redirect the execution flow to Case B (City Aggregation).

---

#### Finding 5: Dead, Broken Client Component `city-report-pdf.tsx`
- **Status**: **CONFIRMED**
- **Location**: [`src/components/admin/reports/city-report-pdf.tsx`](file:///d:/WebDev/report-submission/src/components/admin/reports/city-report-pdf.tsx)
- **Code Reality**:
  - Unreferenced in any route or component across the codebase (`git grep "CityReportPDF"` returns only its own definition).
  - Declares `'use client'`, creating bundle bloat if ever imported.
  - Declares `fontFamily: 'Helvetica'` (line 11) for Bengali table data, which renders unreadable question marks (`?`) or blank boxes in PDF viewers.
- **Fix**: Delete the file completely per **AGENTS.md Rule 1.5 & Rule 7 (Zero Dead-Weight Policy)**.

---

#### Finding 6: Bengali Terminology Drift in Excel
- **Status**: **CONFIRMED**
- **Location**: [`src/app/api/export/excel/route.ts:262-267, 296, 577-581, 614`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts#L262-L267)
- **Code Reality**:
  - Table headers use un-harmonized strings: `"মুয়াল্লিমা হ্রাস"` (should be `মুয়াল্লিমা ঘাটতি`), `"সনদপ্রাপ্তা মুয়াল্লিমা"` (should be `সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা`), `"বোর্ডে"`, `"কায়দায়"` (should be `বোর্ড`, `কায়দা`), `"শেষ করেছে"` (should be `কতজন নিয়ে সমাপ্ত`), `"সহীহ শিখেছে"` (should be `সহীহ শিখেছেন কতজন`).
- **Fix**: Align all header labels with [ADR 007 §2.1](file:///d:/WebDev/report-submission/docs/ADR/007-authoritative-labeling-harmonization-and-2-page-landscape-pdf-architecture.md#L21-L40).

---

#### Finding 7: ASCII English Numerals in PDF Title `periodLabel`
- **Status**: **CONFIRMED**
- **Location**: [`src/app/api/export/pdf/route.tsx:791, 851, 998-999`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L791-L792)
- **Code Reality**: `periodLabel` concatenates raw unformatted year variables `${year}` and `${targetYear}`, rendering titles such as `ডি সি এস রিপোর্ট - মার্চ 2026` instead of `ডি সি এস রিপোর্ট - মার্চ ২০২৬`.
- **Fix**: Wrap all year interpolations in `toBn(...)` or consume `resolvePeriodConfig(...).labelBn`.

---

#### Finding 8: Help Stepper Touch Targets Under 44px (~32px)
- **Status**: **CONFIRMED**
- **Location**: [`src/app/help/help-diagram-client.tsx:631-665`](file:///d:/WebDev/report-submission/src/app/help/help-diagram-client.tsx#L631-L665)
- **Code Reality**:
  - Buttons use `py-2 px-1.5` with `text-xs` (16px line-height), yielding a total height of ~32px.
  - In Admin mode (`steps.length === 5`), 5 step buttons + 1 "সমস্যা" button = 6 items placed into `grid-cols-5 sm:grid-cols-6`. On mobile screens (< 640px), the 6th button wraps onto a second row by itself, creating visual asymmetry and narrow touch targets that violate WCAG 2.1 AA (44×44px minimum).
- **Fix**: Implement a horizontal scroll snap container (`overflow-x-auto no-scrollbar flex`) with `min-h-[44px]` touch targets.

---

#### Finding 9: Missing ARIA Tab Semantics in Help Stepper
- **Status**: **CONFIRMED**
- **Location**: [`src/app/help/help-diagram-client.tsx:631-665`](file:///d:/WebDev/report-submission/src/app/help/help-diagram-client.tsx#L631-L665)
- **Code Reality**: The stepper container is a plain `<div>`, and the step items are generic `<button>` elements lacking `role="tablist"`, `role="tab"`, `aria-selected`, and `aria-controls`.
- **Fix**: Add WAI-ARIA tab pattern attributes to ensure screen readers announce active step positions.

---

#### Finding 10: Help Guide Mode Switcher Fails to Scroll to Top
- **Status**: **CONFIRMED**
- **Location**: [`src/app/help/help-diagram-client.tsx:595-625`](file:///d:/WebDev/report-submission/src/app/help/help-diagram-client.tsx#L595-L625)
- **Code Reality**: Clicking the Admin/User mode toggle sets `setActiveView` and `setSelectedStepIndex(0)`, but does not call `window.scrollTo`. If the user switches modes while scrolled down at Common Problems (Y = 1800px), they remain at Y = 1800px, causing the `IntersectionObserver` to immediately overwrite `selectedStepIndex(0)` with whatever element intersects the bottom detection zone.
- **Fix**: Invoke `window.scrollTo({ top: 0, behavior: "smooth" })` inside the toggle click handler.

---

#### Finding 11: Monolithic Export Handlers Lacking Test Seams
- **Status**: **CONFIRMED**
- **Location**: [`src/app/api/export/pdf/route.tsx`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx) (1,110 lines) & [`src/app/api/export/excel/route.ts`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts) (830 lines)
- **Code Reality**: Both route handlers intertwine auth verification, parameter resolution, database querying across 7 tables, data summation math, override resolution, and document rendering. Neither endpoint has any unit tests in `src/lib/*.test.ts`.
- **Fix**: Extract a shared data-fetching helper `fetchExportReportData(supabase, params)` in `src/lib/export-utils.ts` and add unit test coverage for override merging and period resolution.

---

#### Finding 12: Serverless Font Asset Tracing Risk in `next.config.mjs`
- **Status**: **CONFIRMED**
- **Location**: [`src/app/api/export/pdf/route.tsx:20-23`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L20-L23) & [`next.config.mjs`](file:///d:/WebDev/report-submission/next.config.mjs)
- **Code Reality**: `route.tsx` registers `Kalpurush` via `path.join(process.cwd(), "public/fonts/kalpurush.ttf")`. In Next.js serverless builds, files read dynamically from `process.cwd()` without explicit static imports or `outputFileTracingIncludes` can be excluded from the serverless deployment bundle, causing runtime `ENOENT` crashes.
- **Fix**: Add explicit tracing configuration to `next.config.mjs`:
  ```js
  experimental: {
    outputFileTracingIncludes: {
      "/api/export/pdf": ["./public/fonts/**/*"],
    },
  }
  ```

---

## 3. Cross-Segment Blast Radius Matrix

Every proposed modification was stress-tested across all 7 codebase segments to guarantee zero regressions under field conditions:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CROSS-SEGMENT BLAST RADIUS                                    │
├───────────────────────┬───────────────────────────────────┬──────────────┬──────────────────────┤
│ Segment               │ Coupling Mechanism                │ Blast Risk   │ Architectural Impact │
├───────────────────────┼───────────────────────────────────┼──────────────┼──────────────────────┤
│ 1. Auth & Onboarding  │ `/help` links to `/home?mode=...` │ ZERO         │ Safe navigation      │
│ 2. User Dashboard     │ Period query forwarding in Help   │ ZERO         │ Preserves state      │
│ 3. Report Viewer      │ `/report` download triggers       │ HIGH BENEFIT │ Fixes DCS export     │
│ 4. Submission Forms   │ Terminology harmonization         │ ZERO         │ Matches form labels  │
│ 5. Admin City Report  │ `city_report_override` parity     │ HIGH BENEFIT │ Restores overrides   │
│ 7. Database Integrity │ Singular table invariants         │ ZERO         │ Read-only queries    │
└───────────────────────┴───────────────────────────────────┴──────────────┴──────────────────────┘
```

### Detailed Segment Evaluations:

1. **Segment 1 (Auth & Onboarding)**:
   - *Impact*: Zero blast radius. Action links in `USER_STEPS` (`/home?mode=register`, `/home`) correctly preserve return query parameters and align with `src/middleware.ts` approval gating.
2. **Segment 2 (User Dashboard & Navigation)**:
   - *Impact*: Zero blast radius. Forwarding `periodQuery` in help footer links preserves `year`, `month`, and `type` context when users navigate back to `/`.
3. **Segment 3 (Report Viewer - `/report`)**:
   - *Impact*: **Critical Positive Correction**. Currently, clicking download on DCS (`zone_id=1`) yields an empty document. Adding city-zone interception in the export routes ensures admins downloading from `/report?zone_id=1` receive the full aggregated city document without breaking single-zone exports for regular zones (`zone_id > 1`).
4. **Segment 4 (Report Submission Forms - `/report/[section]`)**:
   - *Impact*: Zero blast radius. Harmonizing Excel headers (`সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা`, `বোর্ড`, `কতজন নিয়ে সমাপ্ত`) creates exact 1:1 linguistic parity between data entry forms and exported spreadsheets.
5. **Segment 5 (Admin City Report & Overrides - `/city-report`)**:
   - *Impact*: **Critical Positive Correction**. Aligning Case B parameter resolution with `resolvePeriodConfig` guarantees that manual corrections entered via `CorrectionButton` and Section 5 remarks appear accurately in both PDF and Excel exports.
6. **Segment 7 (Database Integrity & PostgreSQL Views)**:
   - *Impact*: Zero blast radius. The proposed improvements require zero DDL migrations, zero schema mutations, and preserve singular naming conventions (`people`, `zone`, `report`, `city_report_override`).

---

## 4. Synthesis & Architectural Improvement Plan

To resolve all identified defects cleanly without accumulating technical debt, the implementation work should be structured into three focused tracks:

### Track 1: Export Route Hardening & ADR 007 Page Budgeting (High Priority)
1. **Re-anchor PDF Page Layout to ADR 007**:
   - In [`src/app/api/export/pdf/route.tsx`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx), move the **Inline Maktab Stats Block (`মক্তব রিপোর্ট:`)** from Page 2 to Page 1 immediately below Table 3 (`ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন`).
   - Retain the **Inline Safar Stats Block (`সফর রিপোর্ট:`)** on Page 2 immediately below Table 4 (`বৈঠকসমূহ`).
   - This eliminates the 34.72 pt overflow on Page 2 and guarantees double-sided single-sheet printing.
2. **Standardize Case B Parameter Resolution**:
   - In both `route.tsx` and `route.ts`, consume `resolvePeriodConfig` to parse `reportType`, `month`, and `endMonth`.
   - Ensure `report_type` is translated to Bengali (`activePeriod.dbType`) before querying `city_report_override`.
3. **Restore Section 5 City Comments**:
   - In Case B of both export routes, extract the city comment from `city_report_override` (`section="comment"`, `field="city_comment"`, `category="মহানগরী মন্তব্য"`).
   - Render the extracted comment in `comment.comment` for PDF and as Section 7 in Excel.
4. **DCS Zone 1 Interception**:
   - In both export routes, check if `targetZoneId === 1` (or `zone.zone_type === 'city'`) and route execution into Case B (City Aggregation).
5. **Typography & Header Harmonization**:
   - Wrap year labels in `toBn(...)` in PDF title strings.
   - Update Excel table headers to match ADR 007 authoritative Bengali terminology.

### Track 2: Interactive Documentation & Mobile Accessibility (Medium Priority)
1. **Help Stepper Mobile Layout & Touch Targets**:
   - In [`src/app/help/help-diagram-client.tsx`](file:///d:/WebDev/report-submission/src/app/help/help-diagram-client.tsx), replace the rigid `grid-cols-5 sm:grid-cols-6` layout with a horizontal scroll-snap bar (`flex overflow-x-auto no-scrollbar gap-2`).
   - Ensure all stepper buttons meet the `min-h-[44px]` touch target threshold.
2. **WAI-ARIA Accessibility**:
   - Add `role="tablist"` to the stepper container, `role="tab"`, `aria-selected`, and `aria-controls` to the buttons, and `role="tabpanel"` to the step content cards.
3. **Smooth Scroll on Guide Mode Switch**:
   - In `setActiveView` click handlers, call `window.scrollTo({ top: 0, behavior: "smooth" })` to ensure the viewport resets cleanly.

### Track 3: Codebase Cleanliness & Build Infrastructure (Low Priority)
1. **Zero Dead-Weight Pruning**:
   - Permanently delete [`src/components/admin/reports/city-report-pdf.tsx`](file:///d:/WebDev/report-submission/src/components/admin/reports/city-report-pdf.tsx).
2. **Serverless Asset Tracing**:
   - Add `outputFileTracingIncludes` for `/api/export/pdf` in [`next.config.mjs`](file:///d:/WebDev/report-submission/next.config.mjs).
3. **Automated Export Tests**:
   - Add unit tests in `src/lib/report-utils.test.ts` verifying that `resolvePeriodConfig` correctly derives multi-month periods and override lookup keys for all report types (`monthly`, `quarterly`, `halfYearly`, `nineMonth`, `yearly`, `custom`).

---

## 5. Architectural Invariant Compliance Checklist

- [x] **Singular Table Naming**: Verified that all Supabase table queries strictly target singular tables (`people`, `zone`, `report`, `city_report_override`, `report_*`).
- [x] **Client Memoization**: Verified that `HelpDiagramClient` contains no unmemoized Supabase client instances.
- [x] **SSR Client Boundary**: Verified that `src/app/help/page.tsx` correctly wraps `HelpDiagramClient` inside a `<Suspense>` boundary to safeguard Next.js App Router streaming.
- [x] **Role Gating & Middleware Single Source of Truth**: Verified that export routes enforce session verification and active profile checking (`requesterProfile.active === true`).
- [x] **Rule 1 Zero Dead-Weight**: Explicitly scheduled orphaned `city-report-pdf.tsx` for deletion.

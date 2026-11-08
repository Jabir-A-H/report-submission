# Segment 06 Codebase & Architectural Audit: Document Export Pipeline, City Views & Help System

**Repository**: `talimul-quran-report-submission`  
**Standard**: 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`), Impeccable UI/UX Ergonomics, Pre-Production Agility & Zero Dead-Weight (`AGENTS.md` Rule 7), Adversarial Doubt-Driven Review (`Rules 2 & 6`)  
**Target Scope**:
- `src/app/api/export/pdf/route.tsx`
- `src/app/api/export/excel/route.ts`
- `src/components/admin/reports/city-report-pdf.tsx`
- `src/app/help/page.tsx`
- `src/app/help/help-diagram-client.tsx`
- `public/fonts/kalpurush.ttf`  
**Governing Invariants**: `docs/TECHNICAL_MANUAL.md`, `docs/KNOWN_ISSUES.md`, ADRs 007, 009, 010, 012, 018, 019, 020, 022, 023, 024, and `AGENTS.md`.

---

## 1. Executive Quality Scorecard

- **Health Grade**: **C+ (Pre-Production Blocker)**
- **Pre-Production Bloatware Count**: 4 high-severity bloatware patterns (~510 duplicated query/aggregation lines, 4 multi-clause fallback OR chains, 1 orphaned 148-line prototype component, and missing serverless font tracing).
- **Critical Behavioral Defects**: 4 critical/high defects (PDF Page 2 vertical overflow violating ADR 007; English period tokens dropping all overrides in Case B; omission of qualitative city remarks; and broken `/help` action links bouncing users to the dashboard).
- **Executive Summary**:
  Segment 06 governs the tangible deliverables of the application: physical A4 double-sided printed reports, Excel spreadsheets for offline administrative collation, and the public/authenticated user onboarding guide. While the text-first help documentation copy is culturally grounded and user-centric (ADR 019), the export pipeline suffers from critical regressions:
  1. Placing both Maktab and Safar summary blocks on Page 2 of the PDF export forces vertical content to ~558 pt, violating the 523.28 pt landscape A4 ceiling and pushing remarks/signatures onto an unwanted 3rd page (breaching ADR 007).
  2. Over ~500 lines of identical database queries, aggregation reducers, and override merging logic are duplicated verbatim between `pdf/route.tsx` and `excel/route.ts` instead of consuming a shared `report-data-loader.ts`.
  3. When callers request exports with English period tokens (e.g. `?type=quarterly`), Case B queries `.eq("report_type", "quarterly")` against `city_report_override` which stores Bengali strings (`"ত্রৈমাসিক"`), silently dropping 100% of admin corrections.
  4. The source tree retains dead prototype code (`city-report-pdf.tsx`) with an invalid `Helvetica` font declaration that renders Bengali glyphs as broken tofu.

---

## 2. Pre-Production Bloatware & Rule 7 Violations

Under `AGENTS.md` Rule 7, in active pre-production development with zero live field workers, application-layer polyfills and defensive shims written to support legacy prototypes or avoid database DDL are classified as architectural bloatware:

| # | File Location | Bloatware Pattern | Root Cause in Prototype | Zero-Dead-Weight Clean Remediation |
|:---:|:---|:---|:---|:---|
| **B06-01** | `src/app/api/export/pdf/route.tsx`<br>`src/app/api/export/excel/route.ts` | **~500 Lines of Duplicated Query & Aggregation Code**: Identical logic for auth gating, single-zone querying, multi-month `sumRows` math, and override merging is copy-pasted across both endpoints. | Rapid MVP iteration implemented PDF first, then duplicated the entire database pipeline into the Excel route handler. | Extract a clean, single-source data loader `loadReportDataBundle(supabase, params)` in `src/lib/report-data-loader.ts` per ADR 024 §2. Both routes focus strictly on layout rendering. |
| **B06-02** | `src/app/api/export/pdf/route.tsx:580, 626`<br>`src/app/api/export/excel/route.ts:345, 423` | **Multi-Clause String Fallback Polyfills**: Export routes execute 3-way and 4-way OR chains (`"Committee Orientation / Muallima Orientation"`, `"সহযোগী হয়েছেন"` vs `"সহযোগী হয়েছে"`) in row matchers. | Legacy test records had differing Bengali spellings; application patches were added instead of migrating database rows. | Execute a clean SQL migration (`UPDATE report_organizational SET category = ...; UPDATE report_meeting SET category = ...;`) to normalize historical rows; prune all OR chains to exact equality `x.category === cat`. |
| **B06-03** | `src/components/admin/reports/city-report-pdf.tsx` | **Orphaned Prototype Component with Helvetica Font**: 148-line unreferenced `'use client'` component containing hardcoded `fontFamily: 'Helvetica'` that renders Bengali text as broken squares (`?`). | Abandoned early prototype for client-side city PDF rendering; replaced by server-side `/api/export/pdf`. | Quarantine and permanently delete `city-report-pdf.tsx` under `AGENTS.md` Rule 4 and Rule 7. |
| **B06-04** | `next.config.mjs`<br>`src/app/api/export/pdf/route.tsx:20-23` | **Unbundled Dynamic Font Path Tracing**: `Font.register` reads `public/fonts/kalpurush.ttf` via `process.cwd()` without `outputFileTracingIncludes` configuration in `next.config.mjs`. | Local development filesystem masks serverless asset bundling omission. | Add `experimental.outputFileTracingIncludes` in `next.config.mjs` for `/api/export/pdf` to guarantee TTF inclusion in Vercel serverless builds. |

---

## 3. 5-Layer Behavioral Audit Findings Table

| # | Bug ID | Short Title | File Location | Urgency | Risk: Fix | Risk: No Fix | ROI | Blast Radius | Status |
|:---:|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **WEB-009** | PDF Page 2 Vertical Budget Overflow Onto Unwanted Page 3 | `src/app/api/export/pdf/route.tsx:566-711` | **CRITICAL** | Low | High | 10/10 | PDF Export Only | Confirmed |
| 2 | **WEB-004** | Case B Export Routes Drop All Overrides on English Period Tokens | `src/app/api/export/pdf/route.tsx:929-954`<br>`src/app/api/export/excel/route.ts:488-515` | **CRITICAL** | Low | High | 10/10 | PDF & Excel Case B | Confirmed |
| 3 | **WEB-004** | City Qualitative Remarks (Section 5) Omitted in Case B Exporters | `src/app/api/export/pdf/route.tsx:759, 1074`<br>`src/app/api/export/excel/route.ts:483-782` | **HIGH** | Low | High | 9/10 | PDF & Excel Case B | Confirmed |
| 4 | **WEB-006** | DCS Zone 1 Misrouted to Case A Generating Blank Document | `src/app/report/page.tsx:389-415`<br>`src/app/api/export/pdf/route.tsx:766`<br>`src/app/api/export/excel/route.ts:92` | **HIGH** | Low | High | 9/10 | DCS `/report` Downloads | Confirmed |
| 5 | **WEB-001** | Help Step 3 Action Link Bounces Users to Dashboard via Missing Params | `src/app/help/help-diagram-client.tsx:146, 671`<br>`src/app/report/[section]/page.tsx:43-48` | **HIGH** | Low | High | 8/10 | Help Page CTA | Confirmed |
| 6 | **WEB-001** | Dead, Broken Client Component `city-report-pdf.tsx` in Source Tree | `src/components/admin/reports/city-report-pdf.tsx:1-148` | **MEDIUM** | Low | Medium | 8/10 | Client Bundle Size | Confirmed |
| 7 | **WEB-009** | Missing Serverless Font Tracing & Unregistered Bold Variant for Kalpurush | `src/app/api/export/pdf/route.tsx:20-23`<br>`next.config.mjs` | **HIGH** | Low | High | 9/10 | Serverless PDF Engine | Confirmed |
| 8 | **WEB-009** | Bengali Terminology Drift in Excel Exporter Headers | `src/app/api/export/excel/route.ts:262, 296, 577, 614` | **MEDIUM** | Low | Medium | 8/10 | Excel Output | Confirmed |
| 9 | **WEB-003** | Help Stepper Mobile Touch Floor (< 44px) & 6th Column Wrap Anomaly | `src/app/help/help-diagram-client.tsx:631-665` | **MEDIUM** | Low | Medium | 7/10 | Help UI (Mobile) | Confirmed |
| 10 | **WEB-008** | Help Stepper Mode Switcher Desynchronizes Viewport Scroll | `src/app/help/help-diagram-client.tsx:595-625` | **LOW** | Low | Low | 6/10 | Help UI Navigation | Confirmed |
| 11 | **WEB-009** | Excel Exporter Column Auto-Width Distortion from Unmerged Header Titles | `src/app/api/export/excel/route.ts:796-808` | **LOW** | Low | Low | 6/10 | Excel Presentation | Confirmed |
| 12 | **WEB-009** | ASCII English Numerals in PDF Period Title String Interpolation | `src/app/api/export/pdf/route.tsx:791, 851, 998` | **LOW** | Low | Low | 6/10 | PDF Header Labels | Confirmed |

---

## 4. Deep Receipts & Remediation Plans

### Finding 1: PDF Page 2 Vertical Budget Overflow Onto Unwanted Page 3 (`WEB-009`)

- **Current Behavior**:
  In [`src/app/api/export/pdf/route.tsx:563-711`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L563-L711), Page 1 terminates at line 563 immediately after Table 3 (`ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন`). Page 2 contains Table 2 (`দাওয়াত ও সংগঠন`), Table 4 (`বৈঠকসমূহ`), Inline Maktab Stats Block (lines 654-674), Inline Safar Stats Block (lines 676-697), Comments Section (lines 700-705), and Signature Block (lines 707-710).

- **Behavioral Impact & Mathematical Proof**:
  - Landscape A4 dimensions: `841.89 pt` width × `595.28 pt` height.
  - Page padding (`styles.page`): `36 pt` top + `36 pt` bottom = `72 pt`.
  - **Maximum usable vertical height**: `595.28 - 72.0 = 523.28 pt`.
  - **Page 2 Actual Heights**:
    - Table 2 (15 data rows @ ~16.5 pt + 1 header @ ~18 pt + 8 pt margin): `~270 pt`.
    - Table 4 (5 data rows @ ~16.5 pt + 2 header rows @ ~33 pt + 8 pt margin): `~120 pt`.
    - Maktab Stats Block (padding, title, item row, margin): `~42 pt`.
    - Safar Stats Block (padding, title, item row, margin): `~42 pt`.
    - Comments Container (`minHeight: 32 pt`, padding, label, margin): `~42 pt` (up to `~60 pt` with multi-line notes).
    - Signature Container (`marginTop: 12 pt`, line, text): `~27 pt`.
    - **Total Page 2 Vertical Height**: `270 + 120 + 42 + 42 + 42 + 27 = 543 pt` (empty comments) to `561 pt` (standard comment).
  - `543 pt > 523.28 pt` — **Overflow by 19.72 pt to 37.72 pt**. React-PDF automatically creates a **Page 3** and moves the Signature block or Comments box onto it, completely violating the double-sided 1-sheet printing requirement.
  - Meanwhile, **Page 1 Actual Heights**:
    - Header Bar & 4-Card Stats Grid: `~118 pt`.
    - Table 1 (Courses - 11 total rows + headers): `~190 pt`.
    - Table 3 (Personal - 8 rows + header): `~140 pt`.
    - **Total Page 1 Height**: `118 + 190 + 140 = 448 pt`.
    - **Unused Page 1 White Space**: `523.28 - 448 = 75.28 pt`!

- **Authoritative Citation**:
  [ADR 007 §2.5](file:///d:/WebDev/report-submission/docs/ADR/007-authoritative-labeling-harmonization-and-2-page-landscape-pdf-architecture.md#L64-L77) and [ADR 024 §2](file:///d:/WebDev/report-submission/docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md#L32).

- **Actionable Remediation**:
  Rebalance the layout strictly as specified in ADR 007 §2.5: Move the **Inline Maktab Stats Block** (`মক্তব রিপোর্ট:`) to the bottom of Page 1 below Table 3. Leave the **Inline Safar Stats Block** (`সফর রিপোর্ট:`) on Page 2 below Table 4.
  - New Page 1 height: `448 + 42 = 490 pt` (`< 523.28 pt`, `33.28 pt` safe headroom).
  - New Page 2 height: `543 - 42 = 501 pt` (`< 523.28 pt`, `22.28 pt` safe headroom for comments).
  - Output is guaranteed to fit on exactly 2 landscape sheets.

---

### Finding 2: Case B Export Routes Drop All Overrides on English Period Tokens (`WEB-004`, `WEB-014`)

- **Current Behavior**:
  In [`src/app/api/export/pdf/route.tsx:929-954`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L929-L954) and [`src/app/api/export/excel/route.ts:488-515`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts#L488-L515):
  ```ts
  reportType = reportTypeParam || "মাসিক";
  const months = getMonthsForPeriod(reportType, month);
  ...
  supabase
    .from("city_report_override")
    .select("*")
    .eq("year", year)
    .eq("report_type", reportType)
    .in("month", months);
  ```

- **Behavioral Impact**:
  When an admin triggers an export from `/city-report` for a quarterly or custom report, or navigates to `/api/export/pdf?type=quarterly&year=2026&month=1`, `reportTypeParam` is `"quarterly"`. `reportType` becomes `"quarterly"`.
  However, in the Supabase database table `city_report_override`, the column `report_type` stores canonical Bengali strings (`"মাসিক"`, `"ত্রৈমাসিক"`, `"ষান্মাসিক"`, `"বার্ষিক"`, `"কাস্টম"`).
  The query `.eq("report_type", "quarterly")` matches **0 rows**. All admin corrections and overrides are silently stripped from the exported document, causing exported figures to disagree with the on-screen city report table.
  Furthermore, `searchParams.get("endMonth")` is completely omitted in Case B, breaking custom range period resolution.

- **Authoritative Citation**:
  [ADR 018 §1](file:///d:/WebDev/report-submission/docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md#L1-L20) and [ADR 024 §2](file:///d:/WebDev/report-submission/docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md#L33).

- **Actionable Remediation**:
  Both export routes must normalize period tokens through [`resolvePeriodConfig`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L207-L299):
  ```ts
  const endMonthParam = searchParams.get("endMonth") || searchParams.get("end_month");
  const activePeriod = resolvePeriodConfig({
    type: reportTypeParam || "monthly",
    year: Number(yearParam) || getDhakaDate().year,
    month: Number(monthParam) || getDhakaDate().month,
    endMonth: endMonthParam ? Number(endMonthParam) : undefined,
  });

  // Query overrides using the canonical Bengali DB string:
  supabase
    .from("city_report_override")
    .select("*")
    .eq("year", activePeriod.year)
    .eq("report_type", activePeriod.dbType)
    .in("month", activePeriod.months);
  ```

---

### Finding 3: City Qualitative Remarks (Section 5) Omitted in Case B Exporters (`WEB-004`)

- **Current Behavior**:
  In [`src/app/api/export/pdf/route.tsx:759, 1074`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L759-L1074), `comment` is initialized as `null`. In Case B (lines 921-1074), `comment` is never populated. At line 703, the PDF unconditionally prints `"কোনো মন্তব্য যোগ করা হয়নি।"` for all city exports.
  In [`src/app/api/export/excel/route.ts:483-782`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts#L483-L782), Case B stops after Section 6 (Extras) and never builds Section 7 (Comments).

- **Behavioral Impact**:
  Administrators input city-wide qualitative remarks in `/city-report` via `CorrectionButton` (saved in `city_report_override` with `section="comment"`, `field="city_comment"`, `category="মহানগরী মন্তব্য"`). When downloading official city executive reports for leadership, all comments are completely missing.

- **Authoritative Citation**:
  [ADR 012 §2.3](file:///d:/WebDev/report-submission/docs/ADR/012-route-group-simplification-submission-governance-and-city-report-parity.md#L30-L40) and [TECHNICAL_MANUAL.md §4.3](file:///d:/WebDev/report-submission/docs/TECHNICAL_MANUAL.md).

- **Actionable Remediation**:
  In Case B data assembly, resolve the city comment from `overrideMap`:
  ```ts
  const cityComment =
    overrideMap.get("comment:city_comment:মহানগরী মন্তব্য") ||
    overrideMap.get("comment:city_comment:") ||
    "";
  comment = { comment: cityComment };
  ```
  And render Section 7 in `excel/route.ts` Case B identically to Case A.

---

### Finding 4: DCS Zone 1 Misrouted to Case A Generating Blank Document (`WEB-006`, `WEB-011`)

- **Current Behavior**:
  When an admin views Dhaka City South (`zone_id = 1`) on `/report` and triggers PDF/Excel download, [`src/app/report/page.tsx:393, 409`](file:///d:/WebDev/report-submission/src/app/report/page.tsx#L393) constructs a URL with `zone_id=1`.
  In `pdf/route.tsx:766` and `excel/route.ts:92`, the presence of `zone_id` routes the request into **Case A (Single Zone Export)**.

- **Behavioral Impact**:
  Under ADR 009, Dhaka City South (`zone_id = 1`) is the synthetic city entity representing the collection of all zones; it possesses no data rows in the `report` table. Case A queries `.eq("zone_id", 1)` in `report`, returns 0 rows, and renders an empty document with zeros and dashes.

- **Authoritative Citation**:
  [ADR 009 §2](file:///d:/WebDev/report-submission/docs/ADR/009-zone-hierarchy-type-column-and-admin-site-restructure.md#L15-L28).

- **Actionable Remediation**:
  In export routing, intercept `targetZoneId === 1` and redirect execution to Case B (City Aggregation):
  ```ts
  if (targetZoneId === 1) {
    // Route to Case B City Aggregation
  }
  ```

---

### Finding 5: Help Step 3 Action Link Bounces Users to Dashboard via Missing Params (`WEB-001`, `WEB-003`)

- **Current Behavior**:
  In [`src/app/help/help-diagram-client.tsx:146`](file:///d:/WebDev/report-submission/src/app/help/help-diagram-client.tsx#L146):
  `actionLink: { href: "/report/header", labelBn: "ফরম পূরণে যান", labelEn: "Go to Form Entry" }`.
  At line 671:
  ```ts
  const targetHref =
    step.actionLink.href.startsWith("/") && !step.actionLink.href.startsWith("/home")
      ? `${step.actionLink.href}${periodQuery}`
      : step.actionLink.href;
  ```
  When a user visits bare `/help` (via bottom navigation or navbar), `periodQuery` is empty (`""`). The link points to `/report/header`.
  In [`src/app/report/[section]/page.tsx:43-48`](file:///d:/WebDev/report-submission/src/app/report/%5Bsection%5D/page.tsx#L43-L48):
  ```ts
  if (!hasValidParams) {
    router.replace("/");
    return;
  }
  ```

- **Behavioral Impact**:
  When a field worker reads Step 3 of the Help manual and clicks "ফরম পূরণে যান", they are navigated to `/report/header`. Because query parameters (`type`, `month`, `year`) are missing, `[section]/page.tsx` immediately rejects the transition and bounces the user back to the root dashboard (`/`). The user is left confused and unable to reach the form.

- **Authoritative Citation**:
  [ADR 024 §2 (RS-60)](file:///d:/WebDev/report-submission/docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md#L30).

- **Actionable Remediation**:
  Update Step 3's action link to route to `/` or link with default active Dhaka date parameters:
  ```ts
  actionLink: {
    href: "/report/header?type=monthly&month=" + currentMonth + "&year=" + currentYear,
    labelBn: "ফরম পূরণে যান",
    labelEn: "Go to Form Entry",
  }
  ```
  Or align with canonical `reportId` routing per ADR 024.

---

### Finding 6: Dead, Broken Client Component `city-report-pdf.tsx` in Source Tree (`WEB-001`, `WEB-002`)

- **Current Behavior**:
  [`src/components/admin/reports/city-report-pdf.tsx`](file:///d:/WebDev/report-submission/src/components/admin/reports/city-report-pdf.tsx) (148 lines) defines `CityReportPDF`. It declares `'use client'`, is unreferenced in any route or component (`git grep "CityReportPDF"` returns 0 usages), and hardcodes `fontFamily: 'Helvetica'` for Bengali table cells.

- **Behavioral Impact**:
  Orphaned dead code that increases bundle analysis complexity and violates `AGENTS.md` Rule 4 and Rule 7. If ever imported, `Helvetica` font would crash or display unreadable replacement glyphs (`?`) for Bengali strings.

- **Authoritative Citation**:
  `AGENTS.md` Rule 4 (Zero-Unilateral-Deletion / Safe Quarantine) and Rule 7 (Zero Dead-Weight).

- **Actionable Remediation**:
  Quarantine to `_discarded/city-report-pdf.tsx` and permanently remove from the active source tree.

---

### Finding 7: Serverless Font Asset Tracing Missing in `next.config.mjs` & Unregistered Bold Variant (`WEB-009`)

- **Current Behavior**:
  In [`src/app/api/export/pdf/route.tsx:20-23`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L20-L23):
  ```ts
  Font.register({
    family: "Kalpurush",
    src: path.join(process.cwd(), "public/fonts/kalpurush.ttf").replace(/\\/g, "/"),
  });
  ```
  `next.config.mjs` contains no `outputFileTracingIncludes` entry. Furthermore, `Font.register` registers only a single font file without specifying `fontWeight: 'bold'`, yet `styles` applies `fontWeight: 'bold'` to headers and titles.

- **Behavioral Impact**:
  In Vercel serverless functions or standalone Node deployments, dynamic `process.cwd()` filesystem reads are not traced automatically by Next.js NFT. In certain deployment containers, `public/fonts/kalpurush.ttf` is missing, causing runtime `ENOENT` crashes when PDF exports are invoked.
  Additionally, without an explicit bold font descriptor, `@react-pdf/renderer` employs synthetic pseudo-bolding which can cause glyph overlap in complex Bengali ligatures.

- **Authoritative Citation**:
  Next.js App Router Serverless File Tracing specification and `TECHNICAL_MANUAL.md §4.3`.

- **Actionable Remediation**:
  Add explicit tracing in `next.config.mjs`:
  ```js
  experimental: {
    outputFileTracingIncludes: {
      "/api/export/pdf": ["./public/fonts/**/*"],
    },
  }
  ```

---

### Finding 8: Bengali Terminology Drift in Excel Exporter Headers (`WEB-009`)

- **Current Behavior**:
  In [`src/app/api/export/excel/route.ts:262-267, 296, 577-581, 614`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts#L262-L267):
  Headers use un-harmonized strings: `"মুয়াল্লিমা হ্রাস"`, `"সনদপ্রাপ্তা মুয়াল্লিমা"`, `"বোর্ডে"`, `"কায়দায়"`, `"শেষ করেছে"`, `"সহীহ শিখেছে"`.

- **Behavioral Impact**:
  Linguistic desynchronization between data entry forms (`courses-form.tsx`, `report-header-form.tsx`), overview reports (`/report`), PDF exports, and Excel spreadsheets. Violates the master terminology lock established in ADR 007.

- **Authoritative Citation**:
  [ADR 007 §2.1](file:///d:/WebDev/report-submission/docs/ADR/007-authoritative-labeling-harmonization-and-2-page-landscape-pdf-architecture.md#L21-L38).

- **Actionable Remediation**:
  Update all Excel table headers:
  - `মুয়াল্লিমা হ্রাস` $\rightarrow$ `মুয়াল্লিমা ঘাটতি`
  - `সনদপ্রাপ্তা মুয়াল্লিমা` $\rightarrow$ `সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা`
  - `বোর্ডে` / `কায়দায়` $\rightarrow$ `বোর্ড` / `কায়দা`
  - `শেষ করেছে` $\rightarrow$ `কতজন নিয়ে সমাপ্ত`
  - `সহীহ শিখেছে` $\rightarrow$ `সহীহ শিখেছেন কতজন`

---

### Finding 9: Help Stepper Mobile Touch Floor (< 44px) & 6th Column Wrap Anomaly (`WEB-003`)

- **Current Behavior**:
  In [`src/app/help/help-diagram-client.tsx:631-665`](file:///d:/WebDev/report-submission/src/app/help/help-diagram-client.tsx#L631-L665):
  Buttons use `py-2 px-1.5` with `text-xs`, giving a total touch height of ~32px (below WCAG 2.1 AA 44×44px minimum).
  In Admin mode (5 steps + 1 problem button = 6 items), the container uses `grid-cols-5 sm:grid-cols-6`. On mobile screens (< 640px), the 6th button wraps onto a second line by itself. Container is a generic `<div>` lacking ARIA tab semantics.

- **Behavioral Impact**:
  High touch error rate for mobile users tapping narrow buttons; broken visual layout on small smartphones; screen readers do not announce stepper items as interactive tabs.

- **Actionable Remediation**:
  Refactor the stepper to a horizontal scroll container (`flex overflow-x-auto no-scrollbar gap-2`) with `min-h-[44px]` touch targets, and add `role="tablist"`, `role="tab"`, and `aria-selected` attributes.

---

### Finding 10: Help Stepper Mode Switcher Desynchronizes Viewport Scroll (`WEB-008`)

- **Current Behavior**:
  In [`src/app/help/help-diagram-client.tsx:595-625`](file:///d:/WebDev/report-submission/src/app/help/help-diagram-client.tsx#L595-L625), clicking the mode toggle updates `activeView` and resets `selectedStepIndex(0)`, but does not scroll the window.

- **Behavioral Impact**:
  If an admin scrolls down to Common Problems (Y = 1800px) and switches from Admin to User Guide, the viewport stays at Y = 1800px. The `IntersectionObserver` immediately overwrites `selectedStepIndex(0)` with the element currently intersecting the bottom of the viewport, disorienting the user.

- **Actionable Remediation**:
  Add `window.scrollTo({ top: 0, behavior: "smooth" })` inside the mode switch click handler.

---

### Finding 11: Excel Exporter Column Auto-Width Distortion from Unmerged Header Titles (`WEB-009`)

- **Current Behavior**:
  In [`src/app/api/export/excel/route.ts:796-808`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts#L796-L808), column width auto-adjustment iterates through all cells:
  `maxLength = Math.max(maxLength, cell.value ? String(cell.value).length : 0);`
  Section title rows (e.g. `worksheet.addRow(["২. গ্রুপ / কোর্স রিপোর্ট", "", ...])`) place text in Column 1 without merging across the table width, and comments place long multi-sentence strings in Column 2.

- **Behavioral Impact**:
  Column 2 (and other numeric columns) gets artificially stretched to maximum width (40), leaving empty white space in numeric data tables.

- **Actionable Remediation**:
  Merge section title rows across all table columns (`worksheet.mergeCells(...)`) and exclude merged header rows and qualitative comment rows from the column width auto-fit calculation.

---

### Finding 12: ASCII English Numerals in PDF Period Title String Interpolation (`WEB-009`)

- **Current Behavior**:
  In [`src/app/api/export/pdf/route.tsx:791, 851, 998-999`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L791-L792):
  `periodLabel` interpolates raw ASCII year integers `${year}` and `${targetYear}`, rendering strings like `মার্চ 2026` instead of `মার্চ ২০২৬`.

- **Behavioral Impact**:
  Breaks visual Bengali typography consistency on printed official PDF reports.

- **Actionable Remediation**:
  Pass year values through `toBn(year)` or consume `activePeriod.labelBn`.

---

## 5. Cross-Segment Blast Radius & Wire Analysis

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CROSS-SEGMENT BLAST RADIUS                                    │
├───────────────────────┬───────────────────────────────────┬──────────────┬──────────────────────┤
│ Segment               │ Coupling Mechanism                │ Blast Risk   │ Architectural Impact │
├───────────────────────┼───────────────────────────────────┼──────────────┼──────────────────────┤
│ 1. Auth & Onboarding  │ `/help` links to `/home?mode=...` │ ZERO         │ Preserves auth gate  │
│ 2. Root & Navigation  │ Period query forwarding in Help   │ ZERO         │ Preserves URL state  │
│ 3. Report Core State  │ `/report` download triggers       │ HIGH BENEFIT │ Fixes DCS export     │
│ 4. Section Forms      │ Terminology harmonization         │ ZERO         │ 1:1 label parity     │
│ 5. Admin & Overrides  │ `city_report_override` parity     │ HIGH BENEFIT │ Restores overrides   │
│ 7. Utilities & DB     │ `report-data-loader.ts` extract   │ HIGH BENEFIT │ Eliminates ~500 dup  │
└───────────────────────┴───────────────────────────────────┴──────────────┴──────────────────────┘
```

### Detailed Segment Interconnection Analysis:

1. **Segment 1 (Auth & Access Control)**:
   - Action links in `help-diagram-client.tsx` navigate to `/home?mode=register` and `/home`. These cleanly preserve query parameters and align with `middleware.ts` route protection.

2. **Segment 2 (Root Shell & Navigation)**:
   - Preserving `periodQuery` in help navigation links ensures users returning to `/` or `/report` do not lose active period selections.

3. **Segment 3 (Report Core State Machine - `/report`)**:
   - Intercepting `targetZoneId === 1` in export routes guarantees that admins clicking download while viewing Dhaka City South receive the aggregated city report rather than an empty sheet of dashes.

4. **Segment 4 (Report Section Forms - `/report/[section]`)**:
   - Updating Excel headers (`সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা`, `বোর্ড`, `কতজন নিয়ে সমাপ্ত`) establishes exact 1:1 linguistic fidelity between what field workers enter into form inputs and what administrators view in exported spreadsheets.

5. **Segment 5 (Admin Portal & Overrides - `/city-report`)**:
   - Normalizing incoming period tokens (`activePeriod.dbType`) in Case B ensures manual corrections made in `/city-report` via `CorrectionButton` and Section 5 qualitative remarks are 100% faithfully rendered in both PDF and Excel exports.

6. **Segment 7 (Infrastructure & Utilities - `report-data-loader.ts`)**:
   - Extracting `loadReportDataBundle()` into `src/lib/report-data-loader.ts` eliminates ~500 lines of duplicated code, creates a testable seam for unit tests in `src/lib/report-utils.test.ts`, and prevents future data-wiring divergence between export formats.

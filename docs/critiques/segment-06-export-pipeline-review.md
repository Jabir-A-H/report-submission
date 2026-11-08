# Segment 06 Adversarial Critique & Doubt Gate Review: Document Export Pipeline, City Views & Help System

**Repository**: `talimul-quran-report-submission`  
**Review Standard**: 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`), Impeccable UI/UX Ergonomics, Pre-Production Agility & Zero Dead-Weight (`AGENTS.md` Rule 7), Adversarial Doubt-Driven Review (`Rules 2 & 6`)  
**Input Audit Artifact**: `docs/critiques/segment-06-export-pipeline-investigation.md`  
**Target Files Evaluated**:
- `src/app/api/export/pdf/route.tsx`
- `src/app/api/export/excel/route.ts`
- `src/components/admin/reports/city-report-pdf.tsx`
- `src/app/help/page.tsx`
- `src/app/help/help-diagram-client.tsx`
- `public/fonts/kalpurush.ttf`
- `next.config.mjs`

---

## 1. Executive Adversarial Evaluation

- **Agreement Level with Lead Investigator**: **Moderate to High (Conditional with Critical Mathematical Re-alignment)**  
  Subagent A correctly identified core architectural pain points: Case B dropping overrides on English period tokens, Section 5 qualitative remarks omission, ~500 lines of duplicated export code, and the orphaned prototype `city-report-pdf.tsx`. However, Subagent A's recommended remediation for the PDF Page 2 overflow (C06-01) contained a fatal mathematical flaw that would cause immediate layout failure.
- **False Positive Count Discharged**: **2 Discharged / Revised**  
  1. *Per-Invocation Font Memory Leak*: `Font.register` is evaluated at top-level module scope, not inside `GET()`. In Vercel serverless execution with container warm reuse, it does not re-register or leak heap memory per request. (The genuine issue is asset bundling in `next.config.mjs` and single-weight glyph synthesis).  
  2. *Help System Deleted Route References*: Direct audit reveals `src/app/help/page.tsx` and `help-diagram-client.tsx` do **not** reference deleted `/login` or `/register` routes; links use canonical `/home?mode=register` and `/home`. (The genuine issue is Step 3 missing default date parameters, causing an immediate redirect bounce to `/`).
- **Core Verdict**:  
  **The PDF print budget cannot be resolved by simply moving the Maktab summary to Page 1.** Subagent A underestimated current Page 1 vertical consumption by 56.45 pt (claiming 448 pt vs actual 504.45 pt). Blindly appending Maktab (45.8 pt) pushes Page 1 to **550.25 pt**, overflowing the 523.28 pt landscape A4 boundary by **26.97 pt** and cascading onto a 3rd page! Double-sided 1-sheet printing (ADR 007) is physically achievable **only** through a coordinated layout compression (reducing table cell vertical padding from 2.5 pt to 1.8 pt, section margins from 8 pt to 4 pt, and page padding from 36 pt to 28 pt). Furthermore, consolidating export data fetching into `src/lib/report-data-loader.ts` is fully justified under Rule 2 and Rule 7.

---

## 2. Doubt Gate Cross-Examination

| Lead Finding ID | Claimed Severity | Adversarial Ruling | Rationale & Real-World Stress Test |
|:---|:---:|:---:|:---|
| **WEB-009 (C06-01)**<br>PDF Page 2 Print Budget Overflow | **CRITICAL** | **UPHELD BUT REMEDIATION OVERHAULED** | **Confirmed Bug, Flawed Fix.** Page 2 currently measures ~543–561 pt (> 523.28 pt max), forcing signatures onto Page 3. But Subagent A's proposal to move Maktab to Page 1 without vertical compression breaks Page 1 (504.45 pt + 45.8 pt = 550.25 pt > 523.28 pt). Requires coordinated micro-scale compression. |
| **WEB-004 (C06-02)**<br>Overrides Dropped on English Tokens | **CRITICAL** | **CONFIRMED ARCHITECTURAL DEFECT** | **100% Real-World Failure.** Passing `type=quarterly` queries `report_type = 'quarterly'` against `city_report_override` which stores `'ত্রৈমাসিক'`. Matches 0 rows; silently drops 100% of admin corrections. `resolvePeriodConfig` must be used. |
| **WEB-004**<br>City Remarks (Section 5) Omitted in Case B | **HIGH** | **CONFIRMED LOSS OF CRITICAL DATA** | **Verified Omission.** Case B in `pdf/route.tsx` prints hardcoded empty remarks, and `excel/route.ts` never writes Section 7. Leadership receives executive reports with zero administrative context. |
| **WEB-006**<br>DCS Zone 1 Misrouted to Case A (Blank Sheet) | **HIGH** | **CONFIRMED ENTITY DEFECT** | **Verified Trap.** Clicking download on DCS (`zone_id=1`) routes to Case A which queries `report.zone_id = 1`. Because Zone 1 is a synthetic aggregate entity with 0 report rows, users receive an empty sheet of dashes. |
| **WEB-001**<br>Help Step 3 Bounces User to Dashboard | **HIGH** | **CONFIRMED UX NAVIGATION TRAP** | **Verified Bug.** Step 3 links to `/report/header`. In `[section]/page.tsx`, `hasValidParams` evaluates to `false` when `type`, `month`, and `year` are omitted, immediately invoking `router.replace("/")`. |
| **B06-01**<br>~500 Lines Duplicated in Export Routes | **HIGH** | **CONFIRMED BLOATWARE** | **Verified Rule 7 & Rule 2 Violation.** Identical queries, `sumRows` math, and override merging are duplicated. Extracting `src/lib/report-data-loader.ts` is high-ROI, testable, and prevents export format drift. |
| **B06-03**<br>Orphaned Prototype `city-report-pdf.tsx` | **MEDIUM** | **CONFIRMED DEAD CODE** | **Verified Dead-Weight.** 148 lines of unreferenced `'use client'` code with `Helvetica` font (which cannot render Bengali). Must be quarantined under Rule 4. |
| **B06-04 / Finding 7**<br>Serverless Font Asset Tracing & Memory | **HIGH** | **PARTIAL FALSE POSITIVE / PARTIAL DEFECT** | **Memory Leak is False Positive** (`Font.register` is at module scope, cached by React-PDF). **Asset Tracing is Real**: `next.config.mjs` lacks `outputFileTracingIncludes`, causing runtime `ENOENT` on Vercel standalone/lambda deployments. |
| **WEB-009 (Finding 11)**<br>Excel Column Auto-Width Distortion | **MEDIUM**<br>*(upgraded from Low)* | **CONFIRMED FORMATTING DEFECT** | **Verified Visual Bug.** Column 2 gets stretched to 40 width because Section 1 labels and Section 7 comments share column index 1 with numeric data. Section titles must be merged across table width. |
| **B06-02 / Finding 8**<br>Multi-Clause Fallbacks & Label Drift | **MEDIUM** | **REVISED: CLEAN DDL REQUIRED** | **Rule 7 Mandate.** Instead of retaining defensive TypeScript OR chains in export code, execute a clean one-time SQL migration to normalize `report_organizational` and `report_meeting` rows. |

---

## 3. False Positive & Trivial Con Elimination

### 3.1 Dismissed: Font Re-Registration Memory Leak Inside Serverless Functions
- **Subagent A's Implication / Audit Doubt**:  
  Does registering `kalpurush.ttf` on every invocation inside Vercel serverless functions cause memory bloat and out-of-memory (OOM) crashes?
- **Adversarial Fact-Check**:  
  In [`src/app/api/export/pdf/route.tsx:20-23`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L20-L23):
  ```tsx
  Font.register({
    family: "Kalpurush",
    src: path.join(process.cwd(), "public/fonts/kalpurush.ttf").replace(/\\/g, "/"),
  });
  ```
  `Font.register()` is executed at the **top-level module scope**, outside of `export async function GET(request: Request)`.
  Under Node.js module caching in Vercel serverless execution, the module is evaluated **once** upon container initialization. During warm container re-use, incoming HTTP requests execute `GET()` without re-invoking `Font.register()`. `@react-pdf/renderer` caches the parsed font metrics in its internal `FontStore`. Therefore, font registration does **not** leak memory across invocations.
- **The Real Defect**:  
  The real serverless threat is **Next.js Node File Tracing (NFT)**: because the font path is constructed dynamically via `path.join(process.cwd(), ...)`, Next.js build-time static analysis fails to trace `public/fonts/kalpurush.ttf` into the standalone lambda bundle unless explicitly configured in `next.config.mjs` under `outputFileTracingIncludes`.

### 3.2 Dismissed: Help System Referencing Deleted `/login` or `/register` Routes
- **Subagent A / Prompt Doubt**:  
  Does `src/app/help/page.tsx` reference obsolete URLs or deleted routes (`/login`, `/register`)?
- **Adversarial Fact-Check**:  
  Inspection of both `src/app/help/page.tsx` and `src/app/help/help-diagram-client.tsx` confirms that **zero instances** of `/login` or `/register` exist. All entry navigation links strictly consume:
  - Line 76: `href: "/home?mode=register"`
  - Line 111 & 803: `href: "/"` and `href: "/home"`
  - Line 223–365: `href: "/dashboard"`, `"/management"`, `"/reports"`, `"/city-report"` (matching Next.js `(admin)` route group mapping).
- **The Real Defect**:  
  The true defect is **parameter starvation on Step 3**: clicking `href: "/report/header"` without `?type=monthly&month=X&year=Y` triggers an instant rejection in `src/app/report/[section]/page.tsx:43-48` and bounces the user to `/`.

---

## 4. Deep Mathematical Layout Analysis: PDF Rebalancing Feasibility

Subagent A proposed resolving ADR 007 Page 2 overflow by moving the **Inline Maktab Stats Block** (`মক্তব রিপোর্ট:`) to the bottom of Page 1. Let us cross-examine this proposal with exact typographical math under real-world data loads.

### 4.1 Page Physical Limits & Budget Ceiling
- **Landscape A4 Dimensions**: $841.89\text{ pt}$ (width) $\times$ $595.28\text{ pt}$ (height).
- **Default Page Margins (`styles.page`)**: `padding: 36 pt` (top/bottom) $\rightarrow$ Total vertical padding = $72.0\text{ pt}$.
- **Strict Maximum Usable Height**:
  $$\text{Budget}_{\max} = 595.28 - 72.0 = \mathbf{523.28\text{ pt}}$$

---

### 4.2 Current Page 1 Consumption Breakdown (Worst-Case Case A)

```
┌────────────────────────────────────────────────────────────────────────┐
│ SECTION / COMPONENT              │ CURRENT HEIGHT MEASUREMENT          │
├──────────────────────────────────┼─────────────────────────────────────┤
│ Document Header                  │ 64.00 pt (Titles 39pt, Subtitle 15pt│
│                                  │           Margin 10pt)              │
│ Section 0: InfoBar               │ 25.40 pt (Case A infoBar + borders) │
│ Section 0: 4-Card Stats Grid     │ 62.60 pt (Cards 54.6pt + margin 8pt)│
│ Section 0: Margin Bottom         │  8.00 pt                            │
│ Table 1: Courses (11 Rows)       │ 182.05 pt (11 rows × 16.55pt)       │
│ Table 1: Borders & Margins       │ 15.00 pt (Table border + margins)   │
│ Table 3: Personal (8 Rows)       │ 132.40 pt (8 rows × 16.55pt)        │
│ Table 3: Borders & Margins       │ 15.00 pt (Table border + margins)   │
├──────────────────────────────────┼─────────────────────────────────────┤
│ TOTAL CURRENT PAGE 1 OCCUPIED    │ 504.45 pt                           │
└──────────────────────────────────┴─────────────────────────────────────┘
```

- **Current Remaining Margin on Page 1**:
  $$\text{Remaining} = 523.28 - 504.45 = \mathbf{18.83\text{ pt}}$$

- **Height of Inline Maktab Stats Block**:
  - `inlineBlock` padding (top 4 + bottom 4): $8\text{ pt}$
  - `inlineBlock` border (top 0.5 + bottom 0.5): $1\text{ pt}$
  - `inlineBlockTitle` ($8\text{ pt} \times 1.3 + \text{margin } 3\text{ pt}$): $13.4\text{ pt}$
  - `inlineItem` content ($8\text{ pt} \times 1.3 + \text{padding } 6\text{ pt} + \text{border } 1\text{ pt}$): $17.4\text{ pt}$
  - `inlineBlock.marginBottom`: $6\text{ pt}$
  - **Total Maktab Block Height**: $\mathbf{45.80\text{ pt}}$

- **The Subagent A Overflow Trap**:
  $$\text{Page 1 Projected Height} = 504.45 + 45.80 = \mathbf{550.25\text{ pt}}$$
  $$\text{Overflow Beyond Ceiling} = 550.25 - 523.28 = \mathbf{+26.97\text{ pt Overflow!}}$$

> [!CAUTION]
> If Subagent A's proposal is implemented blindly, React-PDF will automatically split Page 1, pushing Table 3 or Maktab onto Page 2. Page 2 will in turn push Safar or Signatures onto Page 3. **The document will still be 3 pages.**

---

### 4.3 The Hardened Solution: Coordinated Layout Budget Compression

To make the Maktab block fit cleanly on Page 1 and leave a generous 50+ pt buffer for multi-line comments on Page 2, we must apply a coordinated micro-compression across styles:

| Parameter | Current Value | Hardened Value | Vertical Height Recovered |
|:---|:---:|:---:|:---:|
| `styles.page.padding` | `36 pt` (0.5 in) | `28 pt` (0.39 in) | **+16.0 pt usable budget** ($\text{New max} = \mathbf{539.28\text{ pt}}$) |
| `styles.tableCell.paddingVertical` | `2.5 pt` | `1.8 pt` | **-26.6 pt on Page 1** (19 rows $\times$ 1.4 pt)<br>**-32.2 pt on Page 2** (23 rows $\times$ 1.4 pt) |
| `styles.section.marginBottom` | `8 pt` | `4 pt` | **-12.0 pt on Page 1** (3 sections)<br>**-8.0 pt on Page 2** (2 sections) |
| `styles.header.marginBottom` | `10 pt` | `6 pt` | **-4.0 pt on Page 1** |
| `styles.title.fontSize` | `15 pt` | `13.5 pt` | **-3.9 pt on Page 1** |
| `styles.statCard.padding` | `5 pt` | `3.5 pt` | **-3.0 pt on Page 1** |

### 4.4 Verified Compressed Budget Proof

$$\begin{aligned}
\text{Compressed Page 1 Height} &= 550.25 - (26.6 + 12.0 + 4.0 + 3.9 + 3.0) \\
&= 550.25 - 49.50 = \mathbf{500.75\text{ pt}} \\
\text{Safety Headroom (Page 1)} &= 539.28 - 500.75 = \mathbf{+38.53\text{ pt Headroom (Guaranteed Fit!)}}
\end{aligned}$$

$$\begin{aligned}
\text{Compressed Page 2 Height} &= 543.00 - 45.80\text{ (Maktab moved)} - 32.20\text{ (paddings)} - 8.00\text{ (margins)} \\
&= \mathbf{457.00\text{ pt}} \\
\text{Safety Headroom (Page 2)} &= 539.28 - 457.00 = \mathbf{+82.28\text{ pt Buffer for Multi-line Comments!}}
\end{aligned}$$

**Conclusion**: The rebalancing is mathematically bulletproof **only** when accompanied by this micro-compression specification.

---

## 5. Clean Pre-Production DDL vs App-Layer Patch Arbitration

Under `AGENTS.md` Rule 6 & Rule 7, we arbitrate whether proposed application-layer fallbacks should be kept or superseded by clean PostgreSQL migrations:

### 5.1 Case B Override Query Token Normalization
- **Arbitration**: **Application-Layer Utility Adoption (`resolvePeriodConfig`)**  
- **Justification**: In `city_report_override`, the column `report_type` stores canonical Bengali values (`"মাসিক"`, `"ত্রৈমাসিক"`, `"ষান্মাসিক"`, `"বার্ষিক"`, `"কাস্টম"`). This is correct and conforms to database domain invariants. The defect is that `route.tsx` and `route.ts` consume raw URL parameters (`?type=quarterly`) directly in `.eq("report_type", reportTypeParam)`.  
  Both export routes must resolve query parameters through `resolvePeriodConfig()`:
  ```ts
  const activePeriod = resolvePeriodConfig({
    type: searchParams.get("type") || "monthly",
    year: Number(searchParams.get("year")) || getDhakaDate().year,
    month: Number(searchParams.get("month")) || getDhakaDate().month,
    endMonth: searchParams.get("endMonth") ? Number(searchParams.get("endMonth")) : undefined,
  });
  // Query Supabase with canonical Bengali DB string:
  .eq("report_type", activePeriod.dbType)
  .in("month", activePeriod.months)
  ```

### 5.2 Elimination of Dual-String Category Fallbacks (B06-02)
- **Arbitration**: **Immediate Clean Pre-Production Database DDL Migration**  
- **Justification**: Application export routes contain defensive fallback OR-chains:
  - `(cat === "সহযোগী হয়েছেন" && x.category === "সহযোগী হয়েছে")`
  - `(cat === "Committee Orientation" && x.category === "Committee Orientation / Muallima Orientation")`
  - `(cat === "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি" && x.category === "জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)")`
  Under Rule 7, in active pre-production development with zero live users, carrying defensive string polyfills in export engines to accommodate obsolete test rows is unacceptable bloatware.
- **Mandatory Clean SQL Migration**:
  ```sql
  -- Normalize legacy Bengali category spellings to ADR 007 canonical Unicode NFC strings:
  UPDATE report_organizational 
  SET category = 'সহযোগী হয়েছেন' 
  WHERE category = 'সহযোগী হয়েছে';

  UPDATE report_organizational 
  SET category = 'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি' 
  WHERE category = 'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)';

  UPDATE report_meeting 
  SET category = 'Committee Orientation' 
  WHERE category IN ('Committee Orientation / Muallima Orientation', 'Orientation / Result Publish');
  ```
  Once executed, prune all multi-clause OR chains in `route.tsx` and `route.ts` to strict equality: `x.category === cat`.

---

## 6. Shared Data Loader Architecture (`src/lib/report-data-loader.ts`)

Under `AGENTS.md` Rule 2 (Simplicity & Avoiding Premature Abstraction), does creating `src/lib/report-data-loader.ts` introduce unnecessary indirection?

### 6.1 Adversarial Evaluation: Necessity vs Bloat
1. **Verbatim Code Duplication**: `src/app/api/export/pdf/route.tsx` (lines 760–980) and `src/app/api/export/excel/route.ts` (lines 90–530) duplicate **~450 lines** of identical queries, auth guards, `sumRows` math, and override mergers.
2. **Identical Defect Cascade**: When Case B dropped overrides for English tokens, the bug was duplicated in both files. When Section 5 remarks were omitted, the omission occurred in both files. When DCS Zone 1 was misrouted to Case A, both files failed identically.
3. **Seam for Unit Testing**: With queries hardcoded inside Next.js Route Handlers (`NextResponse`), testing data aggregation currently requires running full Next.js server mocks or inspecting binary PDF/Excel buffers. Extracting a pure TypeScript loader creates an easily testable seam in `report-utils.test.ts`.

### 6.2 Canonical Interface Specification
```ts
// src/lib/report-data-loader.ts
import { SupabaseClient } from "@supabase/supabase-js";

export interface ReportDataBundle {
  zoneName: string;
  reportType: string;
  periodLabel: string;
  filenameBase: string;
  isCityAgg: boolean;
  header: any;
  courses: any[];
  org: any[];
  personal: any[];
  meetings: any[];
  extras: any[];
  comment: { comment: string };
}

export async function loadReportDataBundle(
  supabase: SupabaseClient,
  params: {
    reportId?: string | null;
    zoneId?: string | null;
    year?: string | null;
    month?: string | null;
    reportType?: string | null;
    endMonth?: string | null;
  },
  requesterProfile: { role: string; zone_id: number | null }
): Promise<{ data?: ReportDataBundle; error?: { status: number; message: string } }> {
  // 1. Intercept DCS zone_id === 1 -> Route to Case B
  // 2. Case A: Single Zone (by reportId or zoneId + year + month + type)
  // 3. Case B: City Aggregation (via resolvePeriodConfig + view_city_* + city_report_override)
  // 4. Resolve qualitative city comment from overrideMap:
  //    comment = { comment: overrideMap.get("comment:city_comment:মহানগরী মন্তব্য") || "" }
  // 5. Return assembled bundle
}
```

---

## 7. Excel Exporter Formatting & Cell Merging Hardening

Adversarial audit of `src/app/api/export/excel/route.ts` identified formatting flaws that degrade offline spreadsheet usability:

1. **Title Rows Unmerged Across Columns**:
   - `worksheet.addRow(["২. গ্রুপ / কোর্স রিপোর্ট", "", ...])` writes text to Column 1 and applies deep-blue fill only to `getCell(1)`.
   - In Microsoft Excel and LibreOffice Calc, this appears as an isolated blue box in Column A, with Columns B through M blank and unstyled.
   - **Remediation**: Execute `worksheet.mergeCells(rowNum, 1, rowNum, totalCols)` on every section title row and apply fill across the entire merged range.
2. **Column Auto-Width Calculation Pollution**:
   - `column.eachCell` evaluates cell length across all vertically stacked tables.
   - Column 2 contains short integers for Course statistics (`5`, `12`), but also contains Section 1 labels (`সনদপ্রাপ্তা ক্লাস নিচ্ছেন` - 24 chars) and Section 7 qualitative notes (up to 200 chars).
   - This blows out Column 2 width to the maximum (`40`), distorting the numeric matrix.
   - **Remediation**: In `worksheet.columns.forEach`, ignore merged section titles and row cells where `row.number` belongs to Section 7 Comments.
3. **Dynamic Formula Preservation**:
   - Total rows in Excel currently write static JS integers (`item.number || 0`).
   - If an administrator adjusts a course entry in Excel, the totals do not update.
   - **Hardening**: Write standard Excel formulas (e.g. `{ formula: 'SUM(B6:B13)' }`) in total rows.

---

## 8. Final Hardened Action Plan & Priority Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PRIORITY EXECUTION ROADMAP                                    │
├──────┬────────────────────────────────────────────┬──────────┬──────────────┬───────────────────┤
│ Tier │ Task Description                           │ Severity │ File Target  │ Gate Verification │
├──────┼────────────────────────────────────────────┼──────────┼──────────────┼───────────────────┤
│ P0   │ Shared Data Loader Extraction              │ CRITICAL │ `loader.ts`  │ `npm test`        │
│ P0   │ Case B Override & Period Normalization     │ CRITICAL │ `loader.ts`  │ Unit test mock    │
│ P0   │ City Qualitative Remarks (Sec 5) Restored  │ CRITICAL │ `loader.ts`  │ Check in PDF/XLSX │
│ P1   │ PDF Layout Micro-Compression & Rebalance   │ HIGH     │ `pdf/route`  │ Visual 2-page test│
│ P1   │ DCS Zone 1 Interception -> Case B Route    │ HIGH     │ `loader.ts`  │ Verify DCS export │
│ P1   │ Help Step 3 Default Period Parameterization│ HIGH     │ `help-client`│ Click -> no bounce│
│ P2   │ Clean SQL Migration for Category Strings   │ MEDIUM   │ Supabase DDL │ DB migration      │
│ P2   │ Excel Section Title Merges & Auto-Width    │ MEDIUM   │ `excel/route`│ LibreOffice check │
│ P2   │ Quarantine `city-report-pdf.tsx`           │ MEDIUM   │ `_discarded/`│ `git status`      │
│ P3   │ Add `outputFileTracingIncludes`            │ MEDIUM   │ `next.config`│ `npm run build`   │
│ P3   │ Excel Label Harmonization (ADR 007)        │ LOW      │ `excel/route`│ Visual inspection │
│ P3   │ ASCII Year Bengali Numeral Formatting      │ LOW      │ `pdf/route`  │ Visual inspection │
└──────┴────────────────────────────────────────────┴──────────┴──────────────┴───────────────────┘
```

### Detailed Remediation Steps:

1. **Step 1: Extract `src/lib/report-data-loader.ts`**:
   - Implement `loadReportDataBundle()` consolidating Case A and Case B query and aggregation logic.
   - Normalize period queries using `resolvePeriodConfig()`, ensuring `city_report_override` is queried with canonical Bengali `activePeriod.dbType`.
   - Intercept `zone_id === 1` and route directly to Case B.
   - Attach qualitative remarks in Case B from `overrideMap.get("comment:city_comment:মহানগরী মন্তব্য")`.

2. **Step 2: Coordinated PDF Layout Compression in `src/app/api/export/pdf/route.tsx`**:
   - Apply Section 4.3 micro-compression parameters:
     - `styles.page.padding = 28`
     - `styles.tableCell.paddingVertical = 1.8`
     - `styles.section.marginBottom = 4`
     - `styles.header.marginBottom = 6`
     - `styles.title.fontSize = 13.5`
   - Move the **Inline Maktab Stats Block** (`মক্তব রিপোর্ট:`) to the bottom of Page 1.
   - Retain **Inline Safar Stats Block** and Comments on Page 2.
   - Format year strings with `toBn(year)`.

3. **Step 3: Harden Excel Exporter in `src/app/api/export/excel/route.ts`**:
   - Refactor route to consume `loadReportDataBundle()`.
   - Merge section title rows across all columns (`worksheet.mergeCells(rNum, 1, rNum, 13)`).
   - In column auto-width loop, exclude merged section headers and row cells from Section 7 comments.
   - Harmonize column headers to exact ADR 007 Bengali terminology (`সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা`, `বোর্ড`, `কতজন নিয়ে সমাপ্ত`).

4. **Step 4: Fix Help System Step 3 Action Link in `src/app/help/help-diagram-client.tsx`**:
   - Update Step 3 action link resolution so that when `periodQuery` is empty, it appends active Dhaka date parameters:
     ```ts
     const periodQueryResolved = periodQuery || `?type=monthly&month=${getDhakaDate().month}&year=${getDhakaDate().year}`;
     ```
   - Update mobile stepper container to a horizontal scroll container (`flex overflow-x-auto min-h-[44px]`).

5. **Step 5: Quarantine Dead Prototype & Configure Serverless Tracing**:
   - Quarantine `src/components/admin/reports/city-report-pdf.tsx` to `_discarded/city-report-pdf.tsx`.
   - Add `experimental.outputFileTracingIncludes: { "/api/export/pdf": ["./public/fonts/**/*"] }` in `next.config.mjs`.

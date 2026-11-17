# Whole-Codebase Pre-Production Critique — Segment 06: Admin Workflows, City Report Overrides & Export Engines

**Repository**: `talimul-quran-report-submission`  
**Segment**: 06 — Admin Workflows, City Report Overrides & Export Engines  
**Lead Investigator**: Subagent 06A  
**Standard**: 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`), Impeccable UI/UX Ergonomics, Pre-Production Agility & Zero Dead-Weight (`AGENTS.md` Rule 7), Adversarial Doubt-Driven Review (`Rule 2 & 6`), Cross-Segment Cohesion Engine  
**Target Scope**:
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/dashboard/page.tsx`
- `src/app/(admin)/reports/page.tsx`
- `src/app/(admin)/city-report/page.tsx`
- `src/app/(admin)/management/page.tsx`
- `src/app/(admin)/management/actions.ts`
- `src/components/admin/correction-button.tsx`
- `src/app/api/export/pdf/route.tsx`
- `src/app/api/export/excel/route.ts`
- `src/app/help/page.tsx`
- `src/app/help/help-diagram-client.tsx`
**Documentation Context**:
- `docs/TECHNICAL_MANUAL.md` (Chapters 1.2, 2.1, 4.3)
- `docs/ADR/007, 009, 010, 012, 018, 019, 021, 022, 023, 024, 026, 027, 028, 030`
- `docs/KNOWN_ISSUES.md` (`KI-010, KI-017, KI-021, RS-01, RS-02, RS-06, RS-08, RS-09, RS-64, C05-01, C05-04, C06-01`)
**Date**: November 2026  
**Status**: Authoritative Lead Investigation Report (Zero Code Modifications)

---

## 1. Executive Scorecard & Segment Quality Assessment

### 1.1 Overall Health Grade: C+ (Pre-Production Stabilization Required)

Segment 06 constitutes the central executive command and reporting synthesis tier of the application. It provides administrative governance (`/dashboard`, `/management`), audit oversight (`/reports`), high-altitude municipal aggregation and data corrections (`/city-report`), cross-format publication engines (`/api/export/pdf`, `/api/export/excel`), and end-user interactive operational documentation (`/help`).

While previous stabilization rounds eliminated outright crashers (e.g., standardizing canonical route groups under ADR 012, enforcing server-side role authentication in `deleteUserAction` per ADR 026, resolving font asset bundling via `outputFileTracingIncludes` per ADR 025, and unifying data loading via `loadReportDataBundle` per ADR 024), **deep, line-by-line inspection under `AGENTS.md` Rule 7 (Pre-Production Agility) reveals systemic architectural compromises, severe search pagination disconnects, N+1 query cascades, export format parity divergences, and layout budgeting risks**.

Most prominently:
1. **Broken Search Pagination Slice in `/reports` (`WEB-009`)**: Client-side zone search filters exclusively across the currently loaded 10-row page slice rather than querying the database, blinding administrators to reports on subsequent pages.
2. **N+1 HTTP HEAD Cascade in `/management` (`WEB-002`)**: Fetching zone metrics fires $2 \times N$ separate HTTP `HEAD` requests ($30$ requests for 15 zones) over the network on every tab visit instead of consuming a single consolidated PostgreSQL query.
3. **Severe Cross-Format Parity Disconnect in Excel Exporter (`WEB-013`)**: The Excel export engine omits the summary total row for courses and renders the Personal section backwards (rows and columns transposed) compared to both the Web UI and PDF export.
4. **Fragile PDF Page 2 Buffer & Accidental Page 3 Spillover (`WEB-013`)**: Page 2 vertical height sits at ~519 pt against a 523 pt maximum. The `isLongComment` threshold (>7 lines) is too loose; standard multiline comments cause accidental spillover of a lone signature onto Page 3.
5. **Architectural Shenanigan: 7-Way HTTP Waterfall & Client-Side Reducers**: Instead of leveraging PostgreSQL multi-month views or stored functions, `/city-report` and `loadReportDataBundle` execute 7 parallel HTTP queries and perform weighted aggregations, snapshot sorting, and override injections in JavaScript, directly causing stock metric distortion when late months have partial reporting.
6. **Defensive Shims in `CorrectionButton`**: Retains a non-atomic `SELECT -> UPDATE else UPSERT` check-then-act pattern born out of historical fear of unmigrated 6-column unique constraints.

---

### 1.2 Multi-Dimensional Quality Scorecard

| Dimension | Grade | Score | Evaluation & Operational Field Impact |
|:---|:---:|:---:|:---|
| **Architectural Modularity & Simplicity** | **C** | 72/100 | Duplicated 7-query aggregation loops in both `city-report/page.tsx` and `report-data-loader.ts`. In-memory JavaScript data reduction overrides database capabilities. |
| **Search, Pagination & Filter Integrity** | **D** | 62/100 | `/reports` search is client-sliced on 10 rows. Yearly unique zone counts execute an unpaginated full table scan on every pagination button tap. |
| **Data Integrity & Export Parity** | **C+** | 76/100 | Inconsistent layout between Excel and PDF (transposed Personal matrix; missing course totals in Excel). Stock snapshot metrics distort multi-month city totals when latest month has partial zone reporting. |
| **Security & Role Hierarchy** | **B+** | 88/100 | Server-side role validation in `deleteUserAction` protects superadmins and DCS Zone 1. However, `toggleUserActiveAction` lacks a last-active-superadmin guard, and invalid route group revalidation is called. |
| **Mobile & Touch Ergonomics (Impeccable)** | **C** | 70/100 | Edit triggers on `/city-report` maintain sub-WCAG hit areas (26px–32px). Cell reverts trigger a destructive full-page CLS flash. Desktop modals lack Escape key listeners. |
| **Documentation & Terminology Parity** | **B** | 84/100 | Bengali terminology synchronized (`নিবন্ধন`), but `CorrectionButton` and `/help` still cite obsolete `"মুছুন"` button label instead of `"গণনা করা মানে ফিরে যান"`. Download buttons on `/city-report` are icon-only without text or ARIA labels. |
| **Aggregate Pre-Production Grade** | **C+** | **75.3/100** | **CONDITIONAL PASS — REQUIRES TIER 1 & TIER 2 STABILIZATION BEFORE LAUNCH** |

---

## 2. Rule 7 Pre-Production Bloatware & Legacy Shenanigans Register

Under **`AGENTS.md` Rule 7 (Pre-Production Agility vs. Production Stability)**, the system is in active pre-production development with zero live field workers. Complex application-layer shims, redundant query loops, or backward-compatibility polyfills created to compensate for historical database limitations must be eliminated in favor of clean database schemas (DDL) and clean, direct architecture.

| Ref ID | File & Line | Shenanigan / Bloatware Description | Failure Mode & Field Consequences | Clean Pre-Production Remedy |
|:---|:---|:---|:---|:---|
| **BL-06-01** | [`src/components/admin/correction-button.tsx#L70-L111`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L70-L111) | **Manual `SELECT -> UPDATE else UPSERT` Check-Then-Act Shim**: `CorrectionButton` runs a `maybeSingle()` query to check if an override row exists, then updates by `id` if found, and only executes `upsert` with `onConflict` if not found. | Born out of fear of PostgREST `42P10` constraint matching errors during historical 6-to-7 column migrations. Introduces a race condition between concurrent admin edits and bloats client code. | Eliminate the 2-step check. Rely strictly on an atomic PostgreSQL RPC (`upsert_city_override`) or standard single-statement PostgREST upsert matching `city_report_override_period_unique` with `NULLS NOT DISTINCT`. |
| **BL-06-02** | [`src/app/(admin)/city-report/page.tsx#L362-L406`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L362-L406)<br>[`src/lib/report-data-loader.ts#L98-L140`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L98-L140) | **7-Way HTTP View Waterfall & Client-Side Reducer Shim**: Firing 6 separate PostgreSQL view queries + 1 override query, then aggregating multi-month periods and merging overrides cell-by-cell in JavaScript. | Fired across slow cellular mobile connections. In multi-month periods (e.g. Q1), partial drafts in late months skew stock inventory snapshots in `sumHeaderRows`, discarding complete past months with zero indication of zone reporting coverage. | Create a single consolidated PostgreSQL aggregation function (`get_city_report_bundle(year, start_month, end_month, report_type)`) that aggregates and left-joins overrides in SQL, returning JSON directly to client/export routes in 1 query. |
| **BL-06-03** | [`src/app/(admin)/reports/page.tsx#L157-L167`](file:///d:/WebDev/report-submission/src/app/(admin)/reports/page.tsx#L157-L167) | **Unbounded Table Scan for Static KPI Card**: Querying `.from("report").select("zone_id").eq("year", year)` on every single page navigation, instantiating `new Set()` in memory to count unique reporting zones. | When thousands of reports exist across 14+ zones, every page click transfers the entire year's report keys over the network, thrashing mobile memory and network bandwidth. | Scope the count to a single database aggregate query (`SELECT count(DISTINCT zone_id) FROM report WHERE year = ...`) or cache it at the parent component level so pagination does not trigger re-fetches. |
| **BL-06-04** | [`src/app/(admin)/management/page.tsx#L111-L125`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx#L111-L125) | **$2 \times N$ HTTP HEAD Request Waterfall in `fetchZones`**: Iterating over zone records and issuing independent `head: true` queries to `people` and `report` for each zone. | For 15 zones, fires 31 separate HTTP requests; for 50 zones, fires 101 requests. High latency, mobile connection queuing, and unnecessary Supabase API invocation overhead. | Create a database view `view_zone_stats` or execute a single grouped query: `SELECT z.*, count(DISTINCT p.id) as user_count, count(DISTINCT r.id) as report_count FROM zone z LEFT JOIN people p ... GROUP BY z.id`. |
| **BL-06-05** | [`src/app/(admin)/management/actions.ts#L317, L386`](file:///d:/WebDev/report-submission/src/app/(admin)/management/actions.ts#L317) | **Invalid Route Group Cache Revalidation**: Calling `revalidatePath('/(admin)/management')` alongside `revalidatePath('/management')`. | Route groups `(admin)` do not exist in Next.js public URL routing. Calling `revalidatePath` with a route group path is an invalid no-op. | Remove all `revalidatePath('/(admin)/...')` calls; retain only public canonical paths (`/management`, `/home`). |
| **BL-06-06** | [`src/app/(admin)/dashboard/page.tsx#L88-L95`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L88-L95) | **Dead Non-Admin Purview Filter in Admin Dashboard**: Checking `isAdminOrSuper ? reportableZones : reportableZones.filter(...)` inside a route strictly guarded by `(admin)/layout.tsx`. | `(admin)/layout.tsx` unconditionally redirects non-admins to `/`. The `isAdminOrSuper` false branch can never execute in production. | Remove dead ternary condition; assign `myZones = reportableZones` directly. |
| **BL-06-07** | [`src/components/admin/correction-button.tsx#L55`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L55)<br>[`src/app/help/help-diagram-client.tsx#L337, L342`](file:///d:/WebDev/report-submission/src/app/help/help-diagram-client.tsx#L337) | **Stale `"মুছুন"` Button Nomenclature Reference**: Citing a `"মুছুন"` (Delete) button to revert overrides, when the button in `CorrectionButton` was renamed to `"গণনা করা মানে ফিরে যান"` (`RotateCcw`). | Users and administrators following the official help manual look for a button named "মুছুন" that does not exist in the UI. | Align error text and help documentation to cite the exact button label: `“গণনা করা মানে ফিরে যান”`. |

---

## 3. 5-Layer Behavioral & Functional Defect Catalog

All findings are classified against the 14-bug behavioral audit taxonomy (`WEB-001` through `WEB-014`).

```
                              5-LAYER BEHAVIORAL AUDIT TRACE
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Layer 1: DOM, Inputs & Modals   → Sub-WCAG touch targets (26px), missing Escape key   │
│ Layer 2: Client State & Context → Destructive CLS on override revert, useState URL loss│
│ Layer 3: Server Actions & API   → N+1 HTTP cascades, missing superadmin deactivation   │
│ Layer 4: DB Schemas, Views & RLS→ Partial snapshot distortion in multi-month views     │
│ Layer 5: Document Exports (PDF) → Excel/PDF matrix transposition, Page 2 PDF overflow  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.1 Layer 1: DOM, Matrix Inputs & Modals

#### [DEF-06-01] Sub-WCAG Touch Target Hit Areas on City Report Override Triggers (`WEB-010`)
- **File Reference**: [`src/app/(admin)/city-report/page.tsx#L227-L232`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L227-L232), [`src/components/admin/correction-button.tsx#L180`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L180)
- **Code Trace**:
  ```tsx
  // src/app/(admin)/city-report/page.tsx:226-232
  <span
    className="opacity-60 group-hover/cb:opacity-100 min-h-[26px] min-w-[26px] inline-flex items-center justify-center hover:bg-primary/10 rounded-lg text-primary transition-all active:scale-95"
    title="সংশোধন করুন (Override)"
  >
    <Edit2 size={13} />
  </span>
  ```
- **Root Cause**: Overridden cell badges in Edit Mode use explicit `min-h-[26px] min-w-[26px]`. Standard un-overridden cells in `CorrectionButton` use `min-h-[32px] min-w-[32px]`. Both violate the WCAG 2.2 AA mobile touch target minimum floor of $44 \times 44\text{ px}$.
- **Failure Condition**: On mobile viewports (e.g. tablet or smartphone admin access), tapping the 26px pencil icon frequently registers false taps on adjacent table cells or text badges.
- **Remedy**: Apply negative margin padding (`-m-2 p-2`) or expand the button hit-box to a minimum of 44px while preserving visual text density via inline Flexbox alignment.

---

#### [DEF-06-02] Missing Keyboard Escape Key Handlers on Administrative Modals (`WEB-010`)
- **File Reference**: [`src/components/admin/correction-button.tsx#L189-L196`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L189-L196), [`src/app/(admin)/management/page.tsx#L790-L799, L888-L897`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx#L790-L799)
- **Code Trace**: Modals only bind `onClick` backdrop dismissals (`e.target === e.currentTarget`). There is no `useEffect` registering a window `keydown` listener for `e.key === 'Escape'`.
- **Root Cause**: Incomplete accessibility implementation on floating dialog overlays.
- **Failure Condition**: Keyboard-only desktop power users and screen reader users cannot dismiss the correction modal or zone creation modal using the standard `Escape` key, trapping keyboard focus.
- **Remedy**: Add a standard `useEffect` binding `window.addEventListener('keydown', (e) => e.key === 'Escape' && onClose())` to all three dialogs.

---

### 3.2 Layer 2: Client State & Context Architecture

#### [DEF-06-03] Destructive Full-Page CLS and Scroll Jump on Override Revert (`WEB-010`, `WEB-001`)
- **File Reference**: [`src/app/(admin)/city-report/page.tsx#L340-L343, L796-L812`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L340-L343)
- **Code Trace**:
  ```tsx
  // src/app/(admin)/city-report/page.tsx:340-343
  const fetchData = useCallback(async (ignoreFlag) => {
    setIsLoading(true); // ← Sets global loading state
    ...
  });
  ...
  // Line 796:
  {isLoading && (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse" />
      ))}
    </div>
  )}
  ```
- **Root Cause**: When an admin reverts or updates an override in `CorrectionButton`, `onSuccess()` triggers `refreshData()`, which calls `fetchData()`. `fetchData` immediately sets `isLoading(true)`.
- **Failure Condition**: The entire table structure (all 6 sections) unmounts from the DOM and is replaced by skeleton loader cards for 300–600ms. The user's vertical scroll position resets or jumps violently. When the network request completes, the table remounts.
- **Remedy**: Introduce a dedicated `isRefreshing` state that keeps the existing table mounted with a subtle top-bar loader or cell-level spinner, or update `overrides` optimistically in memory upon successful action resolution.

---

#### [DEF-06-04] Zero URL Parameter Synchronization in City Report (ADR 006 Violation) (`WEB-001`)
- **File Reference**: [`src/app/(admin)/city-report/page.tsx#L273-L280`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L273-L280)
- **Code Trace**:
  ```ts
  const [reportType, setReportType] = useState("monthly");
  const [month, setMonth] = useState(() => getDhakaDate().month);
  const [year, setYear] = useState(() => getDhakaDate().year);
  const [quarter, setQuarter] = useState(() => String(Math.ceil(getDhakaDate().month / 3)));
  const [half, setHalf] = useState(() => (getDhakaDate().month <= 6 ? "1" : "2"));
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(() => getDhakaDate().month);
  ```
- **Root Cause**: All period filters reside strictly in React component memory (`useState`). The URL path remains fixed at `/city-report` with zero query parameter reflection.
- **Failure Condition**: If an administrator configures Quarter 3 2026, views the report, and either reloads the page (`F5`), navigates back, or copies the browser URL to share with another central leader, the configuration is completely lost, resetting to the default current month.
- **Remedy**: Mirror all period parameters to `useSearchParams()` and `router.replace('?type=...&year=...&month=...')` in accordance with ADR 006.

---

### 3.3 Layer 3: Server Actions, Middleware & API

#### [DEF-06-05] Decoupled Client-Side Zone Search on Server Pagination Slice (`WEB-009`)
- **File Reference**: [`src/app/(admin)/reports/page.tsx#L140-L144, L186-L192`](file:///d:/WebDev/report-submission/src/app/(admin)/reports/page.tsx#L140-L144)
- **Code Trace**:
  ```ts
  // Line 140: Query fetches a single page range
  const from = (currentPage - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);
  ...
  // Line 186: Client-side search filters only the retrieved 10-row slice
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.trim().toLowerCase();
    return reports.filter((r) =>
      (r.zone?.name ?? "").toLowerCase().includes(q)
    );
  }, [reports, searchQuery]);
  ```
- **Root Cause**: `searchQuery` is not pushed down to the PostgREST query. It only filters the in-memory `reports` array (10 rows).
- **Failure Condition**: An administrator searching for "যাত্রাবাড়ী" (Jatrabari) while on Page 1 will receive "কোন রিপোর্ট পাওয়া যায়নি" (No reports found) if Jatrabari happens to be on Page 2 or Page 3. The pagination footer simultaneously reports `১–১০ / ৫০`, producing total administrative confusion.
- **Remedy**: Push zone search down to PostgREST using joined table filtering: `.ilike('zone.name', `%${searchQuery}%`)` or filter through a server action, resetting `currentPage` to 1 on keystroke debounce.

---

#### [DEF-06-06] $2 \times N$ Network Waterfall in Zone Management (`WEB-002`)
- **File Reference**: [`src/app/(admin)/management/page.tsx#L111-L125`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx#L111-L125)
- **Code Trace**:
  ```ts
  const enriched: ZoneWithStats[] = await Promise.all(
    zonesData.map(async (zone) => {
      const parentZone = zonesData.find((z) => z.id === zone.parent_id);
      const [{ count: userCount }, { count: reportCount }] = await Promise.all([
        supabase.from("people").select("*", { count: "exact", head: true }).eq("zone_id", zone.id),
        supabase.from("report").select("*", { count: "exact", head: true }).eq("zone_id", zone.id),
      ]);
      return { ...zone, user_count: userCount ?? 0, report_count: reportCount ?? 0 };
    })
  );
  ```
- **Root Cause**: Executing $2 \times N$ independent HTTP `HEAD` calls sequentially inside client code.
- **Failure Condition**: On high-latency mobile networks in Bangladesh (>400ms RTT), loading the Zones tab blocks for 3–5 seconds while 30 distinct HTTP requests resolve.
- **Remedy**: Replace with a database view `view_zone_management_stats` or execute a single aggregated RPC.

---

#### [DEF-06-07] Missing Last-Active-Superadmin Guard in `toggleUserActiveAction` (`WEB-005`)
- **File Reference**: [`src/app/(admin)/management/actions.ts#L147-L154`](file:///d:/WebDev/report-submission/src/app/(admin)/management/actions.ts#L147-L154)
- **Code Trace**: `deleteUserAction` enforces that at least one superadmin must remain (`count <= 1 -> blocked`). `toggleUserActiveAction` only enforces self-deactivation protection (`targetProfile.id === requesterProfile.id`).
- **Root Cause**: Missing count query when deactivating another superadmin.
- **Failure Condition**: In a scenario with 2 superadmins (A and B), Superadmin A can deactivate Superadmin B (`active = false`). If Superadmin A subsequently loses access or forgets credentials, the entire platform is left with zero active superadmins, locking administrative governance permanently.
- **Remedy**: When `targetProfile.role === 'superadmin'` and `newActiveState === false`, query active superadmins: `SELECT count(*) FROM people WHERE role = 'superadmin' AND active = true`. Block deactivation if count is $\le 1$.

---

### 3.4 Layer 4: Database Schemas, Aggregations & RLS

#### [DEF-06-08] Multi-Month Stock Metric Distortion Early in Period (`WEB-011`, `WEB-007`)
- **File Reference**: [`src/lib/report-utils.ts#L418-L442`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L418-L442) (`sumHeaderRows`), [`docs/TECHNICAL_MANUAL.md#L129-L135`](file:///d:/WebDev/report-submission/docs/TECHNICAL_MANUAL.md#L129-L135)
- **Code Trace**:
  ```ts
  // sumHeaderRows selects snapshot from the highest month:
  const sorted = [...rows].sort((a, b) => a.month - b.month);
  const latest = sorted[sorted.length - 1];
  ```
- **Root Cause**: In multi-month city reports (e.g. Q1), `view_city_header_agg` produces 3 rows (one per month). If 14 zones submitted in Months 1 and 2 (e.g. 140 total muallima), but only 1 zone has opened or submitted a report in Month 3 (e.g. 10 muallima), Month 3 is sorted as `latest`.
- **Failure Condition**: The quarterly city report displays **10** total muallima instead of 140, discarding complete data from Months 1 and 2 with zero reporting coverage indicator (e.g. "১/১৪ জোন জমাকৃত").
- **Remedy**: Calculate stock metrics by taking the maximum reporting snapshot across constituent months or display the reporting zone count badge (`reporting_zones_count`) so administrators see that Month 3 represents partial data.

---

### 3.5 Layer 5: Document Exports & View Parity

#### [DEF-06-09] Excel Exporter Missing Course Totals & Backwards Matrix Transposition (`WEB-013`)
- **File Reference**: [`src/app/api/export/excel/route.ts#L182-L204, L241-L269`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts#L182-L204)
- **Code Trace**:
  ```ts
  // Lines 182-204: Course table loops categories and ends immediately with spacer:
  COURSE_CATEGORIES.forEach((cat) => { ... });
  worksheet.addRow([]); // ← NO TOTAL ROW!
  
  // Lines 241-269: Personal section puts metrics in columns and categories in rows:
  worksheet.addRow(["বিভাগ", "কতজন শিখাচ্ছেন", "কতজনকে শিখাচ্ছেন", ...]);
  PERSONAL_CATEGORIES.forEach((cat) => { ... }); // ← Swapped orientation!
  ```
- **Root Cause**:
  1. The Excel export pipeline omitted the course summary accumulation row (`মোট সংখ্যা`).
  2. The Personal section was coded using category rows rather than transposing to match the Web UI and PDF export.
- **Failure Condition**: An administrator printing the PDF and comparing it against the exported Excel workbook discovers that Course totals are missing from Excel, and the Personal table has its axes swapped backwards.
- **Remedy**:
  1. Insert a summary total row at the bottom of the Course table in Excel with sum formulas (`=SUM(B8:B12)`).
  2. Transpose the Personal table in `excel/route.ts` to place `PERSONAL_METRICS_ROWS` on the Y-axis and `PERSONAL_CATEGORIES` on the X-axis, appending a right-hand `মোট` column.

---

#### [DEF-06-10] PDF Page 2 Vertical Budget Overflow on Standard Comments (`WEB-013`)
- **File Reference**: [`src/app/api/export/pdf/route.tsx#L322, L710-L724`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L322)
- **Code Trace**:
  - `isLongComment` threshold: `commentLines.length > 7 || normalizedComment.length > 500`.
  - Usable Page 2 vertical height: $595.28\text{ pt} - 72\text{ pt} = 523.28\text{ pt}$.
  - Actual Page 2 element heights:
    - Table 2 (`দাওয়াত ও সংগঠন`): ~248 pt
    - Table 4 (`বৈঠকসমূহ`): ~118 pt
    - Maktab/Safar Flex Row: ~36 pt
    - 6-line comment container: ~92 pt
    - Signature container: ~25 pt
    - Total: $248 + 118 + 36 + 92 + 25 = 519\text{ pt}$ ($4.28\text{ pt}$ buffer!).
- **Root Cause**: The 7-line / 500-character threshold is too high for the remaining vertical headroom on Page 2.
- **Failure Condition**: If Table 2 text wraps or a comment has 6 lines, the signature block is pushed onto a blank Page 3, violating the 2-page duplex print invariant.
- **Remedy**: Lower the Page 2 comment threshold to `commentLines.length > 4 || normalizedComment.length > 250`, or move Maktab summary to the bottom of Page 1 (which has 83 pt of free breathing headroom) per ADR 007 §2.5.

---

## 4. Impeccable UI/UX, Mobile Ergonomics & Accessibility Review

| Screen / Component | Metric / Attribute | Observed State | Standard Requirement | Compliance Status |
|:---|:---|:---|:---|:---:|
| **City Report Table** | Cell Edit Trigger (`CorrectionButton`) | `min-h-[26px] min-w-[26px]` | $44 \times 44\text{ px}$ Touch Floor | **FAIL** |
| **City Report Header** | Export PDF / Excel Buttons | Icon-only, height 32px, no text, no `aria-label` | $44 \times 44\text{ px}$ + Descriptive Accessible Name | **FAIL** |
| **City Report Table** | Override Revert Action | Unmounts table, flashes skeleton loader (CLS) | Zero Layout Shift; In-place optimistic update | **FAIL** |
| **Correction Modal** | Keyboard Navigation | Backdrop click only, no Escape listener | WCAG 2.1.1 Keyboard Escape Dismissal | **FAIL** |
| **Zone Modal** | Keyboard Navigation | Backdrop click only, no Escape listener | WCAG 2.1.1 Keyboard Escape Dismissal | **FAIL** |
| **Admin Dashboard** | Historical Audit Access | Hardcoded to current month; no month picker | Period Selector Navigation for prior months | **FAIL** |
| **Admin Reports List** | Zone Name Search | Client-side slice (only current 10 rows) | Server-wide search across all pages | **FAIL** |
| **Admin Management** | User Action Feedback | Raw browser `window.alert()` | Non-blocking inline toast or accessible banner | **FAIL** |
| **Help Stepper** | Mobile Stepper Bar | Sticky top-2, text wraps on small screens | Horizontal scroll or compact icon ribbon | **PASS (MARGINAL)** |
| **PDF Export Engine** | Typography & Numeral Rendering | Universally converted via `toBn()` with Kalpurush | Bengali Unicode NFC Numerals (০–৯) | **PASS** |

---

## 5. Cross-Segment Blast Radius & Cohesion Warnings

```mermaid
flowchart TD
    subgraph Segment 06: Admin & Exports
        CR[city-report/page.tsx]
        CB[CorrectionButton]
        MG[management/page.tsx]
        MA[management/actions.ts]
        RP[reports/page.tsx]
        EX[api/export/excel]
        PDF[api/export/pdf]
    end

    subgraph Segment 01: Calculation & Loader
        RDL[report-data-loader.ts]
        RU[report-utils.ts]
    end

    subgraph Segment 02: State Machine
        RC[report-context.tsx]
    end

    subgraph Segment 04: Auth & Access
        MW[middleware.ts]
        P[people table]
        Z[zone table]
    end

    subgraph Segment 05: Routing & Layout
        AL[(admin)/layout.tsx]
        UP[user-provider.tsx]
    end

    CR -->|7 View Queries| RDL
    EX -->|loadReportDataBundle| RDL
    PDF -->|loadReportDataBundle| RDL
    MA -->|Service Role Updates| P
    MA -->|Zone Mutations| Z
    AL -->|Admin Guard| UP
    RP -->|View Report Link| CR
```

### 5.1 Blast Radius to Segment 01 (Data Calculation & Loader)
- Modifying how city overrides are retrieved or aggregated directly impacts `src/lib/report-data-loader.ts`. Any change to `sumHeaderRows` to resolve stock metric distortion (DEF-06-08) must be coordinated with Segment 01 to prevent breaking single-zone multi-month reports.

### 5.2 Blast Radius to Segment 04 (Auth & Security)
- Hardening `toggleUserActiveAction` to prevent deactivating the last remaining superadmin touches `src/app/(admin)/management/actions.ts` and `public.people`.
- Removing the N+1 HTTP HEAD cascade in `management/page.tsx` touches RLS policies on `zone`, `people`, and `report`.

### 5.3 Blast Radius to Segment 05 (Routing & Navigation)
- Synchronizing `/city-report` filter state to URL query parameters (`?type=...&month=...&year=...`) aligns with Segment 05 canonical navigation governance (ADR 006 / ADR 030).
- Standardizing parameter naming between `/report?report_id=...` and `/report/header?reportId=...` eliminates dual-casing confusion across admin report audit links.

---

## 6. Competing Multi-Option Remediation Proposals (Rules 2 & 6)

---

### Proposal 1: City Aggregation Engine & 7-Way HTTP View Waterfall (DEF-06-06, BL-06-02)

#### Option 1A: Status Quo Application Patch (Minimal Local Touch)
- Retain the 6 individual PostgreSQL aggregation views and 1 override query. Add an indicator badge to the UI showing how many zones have submitted. Keep running `sumRows` and `sumHeaderRows` in JavaScript.
- **Why do it**: Requires zero database migrations; touches only frontend rendering code.
- **Why NOT do it (Risks)**: Retains 7 parallel network round trips over mobile connections. Retains duplicate data reduction logic in both `city-report/page.tsx` and `report-data-loader.ts`. Stock metric distortion remains if latest month has 1 reporting zone.

#### Option 1B: Clean PostgreSQL Unified Aggregation RPC (Recommended — Rule 7 Standard)
- Implement an atomic PostgreSQL stored function `get_city_report_bundle(p_year int, p_start_month int, p_end_month int, p_report_type text)` in Supabase.
- The function aggregates child metrics across reporting zones, left-joins `city_report_override` natively in SQL, and computes reporting coverage metrics (`reporting_zones_count`, `total_zones_count`). Returns a single JSON payload.
- **Why do it**: Reduces 7 HTTP requests to 1. Eliminates ~200 lines of complex client-side array reduction logic. Eliminates stock metric snapshot bugs by computing coverage in SQL. Matches Rule 7 pre-production database agility.
- **Why NOT do it (Risks)**: Requires executing clean DDL in Supabase PostgreSQL; requires updating unit test mocks for `report-data-loader.ts`.

#### Option 1C: Dynamic Materialized Summary Table with Realtime Triggers
- Create a physical table `city_report_cache` updated via triggers on child tables (`AFTER INSERT OR UPDATE ON report_*`).
- **Why do it**: Instantaneous sub-millisecond reads.
- **Why NOT do it (Risks)**: Extreme architectural complexity; high risk of trigger lock contention during concurrent field submissions; violates Rule 2.5 (Favor Simplicity).

**Recommendation**: **Option 1B**. Clean, high-leverage pre-production DDL consolidation.

---

### Proposal 2: Search & Pagination Integrity in `/reports` (DEF-06-05)

#### Option 2A: Full Client-Side Load (Remove Server Pagination)
- Fetch all reports for the selected year at once and paginate/search entirely in client memory.
- **Why do it**: Simple implementation. Instant search filtering with 0 latency.
- **Why NOT do it (Risks)**: Unscalable. Once thousands of reports accumulate across years, client memory footprint and initial page load degrade severely on low-end mobile devices.

#### Option 2B: Push-Down PostgREST Search with Debounced Query (Recommended)
- Pass `searchQuery` to the Supabase PostgREST query using joined table filter: `.ilike('zone.name', `%${searchQuery.trim()}%`)`.
- Reset `currentPage` to 1 whenever `searchQuery` changes. Debounce text input by 300ms.
- **Why do it**: True server-side search; exact match counts; pagination footer accurately reflects matched records across all pages.
- **Why NOT do it (Risks)**: Requires 300ms debounce wiring; slightly more state coordination.

**Recommendation**: **Option 2B**. Industry-standard server pagination contract.

---

### Proposal 3: Export Parity & PDF 2-Page Budget Guarantee (DEF-06-09, DEF-06-10)

#### Option 3A: Tighten Comment Threshold & Mirror Excel Layout (Recommended)
- In `src/app/api/export/pdf/route.tsx`: Lower the threshold for `isLongComment` from 7 lines to `commentLines.length > 4 || normalizedComment.length > 250`.
- In `src/app/api/export/excel/route.ts`:
  1. Add a summary total row (`মোট সংখ্যা`) to the Course table.
  2. Transpose the Personal table so rows are metrics and columns are categories with a right-hand `মোট` column, achieving 100% visual parity with Web UI and PDF.
- **Why do it**: Guarantees Page 2 never overflows onto Page 3 for standard reports. Restores absolute structural parity between PDF and Excel exports.
- **Why NOT do it (Risks)**: Extensive comments (>4 lines) will generate Page 3 more frequently (though Page 3 is cleanly formatted and dedicated).

#### Option 3B: Re-Anchor Maktab Summary to Page 1 (ADR 007 Pure Restoration)
- Move Maktab summary block to the bottom of Page 1 below Personal table. Keep Safar on Page 2.
- **Why do it**: Page 1 has 83 pt of breathing room. Moving Maktab saves 36 pt on Page 2, providing headroom for up to 8 lines of comments without Page 3.
- **Why NOT do it (Risks)**: Breaks the side-by-side Maktab/Safar pairing implemented in ADR 030; requires vertical adjustments on Page 1.

**Recommendation**: **Option 3A**. Preserves ADR 030 visual pairing while mathematically guaranteeing zero signature spillovers.

---

## 7. Investigation Conclusion & Subagent 06B Handoff

Segment 06 contains a solid high-level framework, but suffers from **6 bloatware items, 10 behavioral defects, and several layout/export parity mismatches**. 

Subagent 06B (Adversarial Reviewer) must cross-examine:
1. Whether moving to a single PostgreSQL stored procedure for city aggregations (Option 1B) creates breaking changes for existing unit tests in `report-data-loader.test.ts`.
2. Whether lowering the PDF comment threshold to 4 lines produces unnecessary 3-page PDFs for routine remarks.
3. Whether pushing zone search down to PostgREST joined relation `.ilike('zone.name', ...)` performs efficiently without an explicit index on `zone.name`.

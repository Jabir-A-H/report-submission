# ADR 006: URL-Only Period State Simplification (Deprecating sessionStorage Restoration)

**Status**: Accepted  
**Date**: 2026-07-13  
**Author**: Engineering Team  
**Supersedes**: Portions of ADR 005 (Hybrid State Persistence pattern — sessionStorage restoration loop)

---

## Context

During UAT of the ADR 005 Hybrid State Persistence system, two critical regressions were discovered:

### Bug 1 — Report Section Links Shown Before Period Selection
When a user logged in fresh (no URL params), `UserDashboard` immediately set `isLoading = false` (since there was nothing to fetch) and rendered the section links grid. Each link used the null params from the URL, producing hrefs like `/report/header?type=null&month=null&year=null`. Users could click these links and attempt to use the system before selecting a period.

### Bug 2 — RPC 400 Error: `null value in column "year"`
When navigating to `/report/header?type=null&month=null&year=null`, the `SectionSwitcher` component evaluated `!typeParam || !monthParam || !yearParam` — all three were the **string `"null"`**, which is truthy. So the null-guard was bypassed. `parseInt("null") = NaN` was passed to `get_or_create_report` as `null`, violating the `NOT NULL` constraint on the `year` column in the `report` table.

### Bug 3 — Cannot Return to Period Selector After Clearing URL
The `sessionStorage` restoration `useEffect` in `UserDashboard` fired unconditionally whenever `!hasParams`. There was no escape hatch — manually clearing the URL triggered an immediate `router.replace()` back to the last stored period. Users who wanted to change their period by clearing the URL were permanently trapped in a restoration loop.

### Bug 4 — Broken "/report" Navigation Link
The "Report" tab in `bottom-nav.tsx` and `navbar.tsx` linked to `/report`, which has no Next.js page (`/report/[section]` pages exist, but no `/report` root). This caused 404 errors or unexpected fallbacks.

---

## Decision

### 1. Drop sessionStorage Restoration Loop Entirely

The `sessionStorage` key `"dashboard-period-params"` is no longer written or read during normal application operation. The restoration `useEffect` in `UserDashboard` is removed. The equivalent save in `SectionLayout` is also removed.

**Rationale**: The original problem (param loss when returning to Home) is better solved by having all navigation links carry the params forward, rather than having a background restore loop with no escape hatch.

### 2. URL Query Params Remain the Sole Source of Truth

`?type=...&month=...&year=...` parameters remain the authoritative period state. All components read from `useSearchParams()`. No other persistence mechanism is used.

### 3. All Navigation Links Carry Period Params Forward

All links that navigate "towards home" now carry the current `paramsStr` forward:
- `Navbar`: Home link = `/${periodQuery}`, Report link = `/report${periodQuery}` (overview report dashboard)
- `BottomNav`: Home tab = `/${periodQuery}`, Report tab = `/report${periodQuery}` (overview report dashboard)
- `SectionLayout`: Back-arrow link = `/${queryString}` (already correct)
- `UserDropdown` Help link = `/help${periodQuery}`
- `BottomNav` Help link = `/help${periodQuery}`

**Why "Report" tab goes to `/report`**: The `/report` page (`src/app/report/page.tsx`) acts as the aggregate monthly/multi-month overview dashboard. All links to the "Report" tab carry the exact English period parameters (`?type=...&month=...&year=...`) forward so the user immediately views the aggregate report for their current active period without re-selecting filters.

### 3.1 Overview Report (`/report`) Button-Triggered Filter Synchronization

On `src/app/report/page.tsx`, the UI filter selectors (`selectedZone`, `selectedMonth`, `selectedYear`, `selectedReportType`) are separated from the database query trigger:
- **UI State vs. Query State**: Changing dropdown selections in the filter card updates local form state but does **not** immediately trigger `loadReport()` or modify `searchParams`.
- **Button-Triggered Execution**: When the user clicks the **"ফিল্টার করুন"** (`handleApplyFilter`) button, `router.push("/report?zone_id=...&month=...&year=...&type=...")` updates the URL query parameters using standardized English keys (`monthly`, `quarterly`, `half_yearly`, `yearly`, `annual`).
- **Applied Parameters Store**: `loadReport()` and data aggregation logic derive their target parameters (`appliedZoneId`, `appliedMonth`, `appliedYear`, `appliedReportType`) strictly from `useSearchParams()`. As a result, both the URL query parameters and the report database query update simultaneously exactly upon button click.

### 4. Robust Null-String Param Guard

A shared validation function `isValidParam()` is used in both `UserDashboard` and `SectionSwitcher`:

```typescript
const isValidParam = (val: string | null) =>
  !!val && val !== "null" && val !== "undefined";
```

This prevents `parseInt("null") = NaN` from reaching the RPC. In `SectionSwitcher`, an additional `isNaN()` guard is added as a defense-in-depth layer before the RPC call.

### 5. Guard Against Section Grid Rendering Without Period

`UserDashboard` now renders the section links grid **only** when:
1. `hasParams` is true (valid params present), AND
2. `isLoading` is false, AND
3. No `error` is set

`isLoading` is initialized to `false` and only set to `true` when we have valid params and are actively fetching. The section grid is never rendered when `!hasParams`.

### 6. sessionStorage Force Purge on Logout (Retained as Defensive Cleanup)

The `SessionCleaner` component on `/login/page.tsx` is retained. Since sessionStorage is no longer actively written, this is now a defensive no-op, but it prevents any stale data that might exist from previous builds from being read.

---

## Consequences

### Positive
- **No restoration loop**: Clearing the URL params always brings the user back to the PeriodSelector. This is predictable and correct.
- **No RPC 400 errors**: The string "null" is caught before reaching the database.
- **Section links only show when ready**: The UX is now correct — period selector → select period → section links appear.
- **Simplified architecture**: Fewer moving parts; easier to reason about state flow.
- **Multi-tab safety preserved**: Each tab's URL remains independent; no shared storage race conditions.

### Negative / Mitigations
- **Params lost when navigating to non-period pages**: If a user navigates to `/admin/users`, `/admin/city-report`, etc., and then clicks Home, the params are not in those pages' URLs. **Mitigation**: Admin pages are a separate workflow; admin users navigate back to the admin dashboard, not the user dashboard. Regular users don't access admin pages.
- **Help page doesn't carry params in its own URL**: When a user opens `/help${periodQuery}`, the params are in the URL. The Navbar on the Help page reads `useSearchParams()` and builds `homeHref = `/${periodQuery}`` correctly, so clicking Home from Help preserves the period. ✅

---

## Migration Notes

- Remove any persisted `"dashboard-period-params"` from sessionStorage in browsers that have it from the previous build — handled by the existing `SessionCleaner` on `/login`.
- No database changes required.
- No new dependencies introduced.

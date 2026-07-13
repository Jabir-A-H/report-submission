# Known Issues & Bug Tracker

## Overview
This file tracks known bugs, temporary hacks, or design compromises made during development. Documenting these saves time when refactoring later.

## Active / Deferred Issues

### Mobile Touch Target Ergonomics Violations (<44px)
- **Date**: 2026-06-26
- **Description**: Nested category table action and delete buttons in `AutoSaveField` rows maintain small hit areas (~24px x 24px), violating WCAG 2.2 AA mobile touch target guidelines (minimum 44px x 44px).
- **Impact**: Medium (mobile usability friction & accidental taps)
- **Planned Fix**: Add `min-h-[44px] min-w-[44px]` touch padding wrappers.

---

### Supabase Free Tier: 2 Password Reset Emails Per Hour
- **Date**: 2026-06-13
- **Description**: Supabase's free tier enforces a hard limit of 2 password reset emails per hour per email address. This cannot be changed via the Dashboard on the free plan.
- **Impact**: Low (only affects testing; real users rarely reset passwords more than once).
- **Workaround**: Use Gmail `+` aliases (e.g., `user+test1@gmail.com`) to get fresh rate limits per alias. All emails still arrive at the same inbox.

---

## Resolved Historical Issues

### Section Links Visible Before Period Selection + RPC 400 Null Year Error (ADR 006)
- **Date**: 2026-07-13
- **Resolution Date**: 2026-07-13
- **Description**: Four interrelated bugs caused by the ADR 005 Hybrid State Persistence system:
  1. Section grid rendered with `type=null&month=null&year=null` links before period was selected.
  2. `parseInt("null") = NaN` bypassed null-guard and reached the RPC → DB NOT NULL constraint violation (400 error).
  3. `sessionStorage` restoration loop had no escape — clearing URL params immediately redirected back to last stored period.
  4. `bottom-nav.tsx`/`navbar.tsx` Report link went to `/report` (no page exists there).
- **Fix**: Removed sessionStorage restoration loop. URL params are sole source of truth (ADR 006). Added `isValidParam()` guard rejecting string `"null"`. Section grid only renders when `hasParams && !isLoading && !error`. All nav links carry period params forward. Report tab now links to `/${periodQuery}` (home dashboard). Help links carry `periodQuery` string for round-trip preservation.

---

### Report Pages Supabase Client Memoization Gap
- **Date**: 2026-07-13
- **Resolution Date**: 2026-07-13
- **Description**: `src/app/report/[section]/page.tsx` created the browser client inside the effect flow without memoization.
- **Fix**: `SectionSwitcher` now uses `useMemo(() => createClient(), [])` at component level, matching the established pattern.

---

### Unstable Client-Side Supabase Instantiation (`ReportProvider`)

- **Date**: 2026-06-25
- **Resolution Date**: 2026-06-25
- **Description**: `ReportProvider` instantiated `createClient()` directly inside the render body without `useMemo()`.
- **Fix**: Wrapped browser client creation in `useMemo(() => createClient(), [])` inside `report-context.tsx`.

---

### Secondary UI Components Unmemoized Supabase Client Instantiation
- **Date**: 2026-06-26
- **Resolution Date**: 2026-07-13
- **Description**: `admin-dashboard.tsx`, `bottom-nav.tsx`, `user-dropdown.tsx`, and `correction-button.tsx` were previously tracked as creating browser clients in unstable render paths.
- **Fix**: These components now use memoized browser client creation via `useMemo(() => createClient(), [])`; issue closed and replaced by remaining report-page consistency gap.

---

### Unmemoized State Mutators (`updateField`)
- **Date**: 2026-06-25
- **Resolution Date**: 2026-06-25
- **Description**: `updateField` inside `ReportProvider` caused child section re-render cascades.
- **Fix**: Wrapped `updateField` in `useCallback` and memoized context value object.

---

### Period Selector Race Condition on Rapid Click
- **Date**: 2026-06-25
- **Resolution Date**: 2026-06-25
- **Description**: In `user-dashboard.tsx`, rapid period clicking risked out-of-order state updates.
- **Fix**: Added `let ignore = false` cancellation trap inside `useEffect` initialization and cleanup.

---

### `checkEmailAvailability` Does Not Scale Beyond 1000 Users
- **Date**: 2026-06-12
- **Resolution Date**: 2026-06-25
- **Description**: Registration email validation invoked unpaginated `auth.admin.listUsers` HTTP requests.
- **Fix**: Verified database trigger `on_auth_user_created` keeps `public.people` synchronized. Eliminated `listUsers` HTTP call entirely, querying indexed `public.people` (ADR 003).

---

### Massive Client-Side Fallback for Report Creation
- **Date**: 2026-06-22
- **Description**: The system originally used a massive ~200-line client-side fallback in `user-dashboard.tsx` and `page.tsx` to insert seed rows into 7 child tables simultaneously when a new report was created.
- **Fix**: Replaced with atomic Postgres RPC function (`get_or_create_report`).

---

### Mobile Table Overflow & Inline Stats Visual Clutter (`page.tsx`)
- **Date**: 2026-07-12
- **Resolution Date**: 2026-07-12
- **Description**: Report tables originally forced unconstrained horizontal scrolling or squished multi-column cells across small mobile screens (`< 360px`), while inline Maktab and Safar stats blocks utilized prominent background colors (`bg-purple-500/5` / `bg-cyan-500/5`) that created double-box visual clutter below data tables.
- **Fix**: Implemented situation-based minimum-width thresholds (`table-fixed w-full min-w-[500px]` / `min-w-[520px]`) and proportional percentage column widths (`34% : 17% : 17% : 16% : 16%`, etc.) so the first 3 columns remain visible without scrolling on standard mobile portrait viewports (ADR 004). Replaced inline stats colored container backgrounds with clean, transparent border framing (`p-4 rounded-xl border border-border` & `px-3 py-2 rounded-lg border border-border/70`) while restoring normal `font-black text-sm sm:text-base` metric counts and a responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5` mobile layout.

---

### Form View Toggle Clutter & Nested Boxiness in Form Cards (`SectionLayout`, `CoursesForm`)
- **Date**: 2026-07-12
- **Resolution Date**: 2026-07-13
- **Description**: The `Form / Table` (`ভিউ`) toggle previously rendered as a large full-width bar inside form bodies, while complex forms (`courses-form.tsx`, `meetings-form.tsx`, `personal-form.tsx`, `report-header-form.tsx`) wrapped sub-sections in their own colored borders (`bg-muted/20 border border-border/40` or `bg-pink-500/5`), creating nested boxiness and vertical scroll fatigue across 8 open cards simultaneously.
- **Fix**: Lifted the layout toggle into the top-right corner of `SectionLayout` (`CompactViewToggle`) via `ViewModeContext` without prop drilling. Replaced inner box borders with flat uppercase section dividers (`border-t`), upgraded input grids to dynamic responsive columns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`), and collapsed all `CoursesForm` cards except the first category (`openCards: { [COURSE_CATEGORIES[0]]: true }`) by default (ADR 005).

---

### Dashboard Query Parameter Loss & Stale Session State (`UserDashboard`, `Navbar`)
- **Date**: 2026-07-12
- **Resolution Date**: 2026-07-13
- **Description**: Navigating from the Dashboard (`/?type=...&month=...&year=...`) to section or global pages (`/report/courses` or `/help`) and clicking "Home" resulted in period query parameter loss. Storing period filters purely in `localStorage` was rejected because it broke multi-tab side-by-side comparison (`Tab A` vs `Tab B`).
- **Fix**: Implemented Hybrid State Persistence (URL query strings as active tab truth + `sessionStorage ("dashboard-period-params")` as fallback memory when returning to `/` with clean URLs). Enforced Clean Session Guarantee via explicit force purging (`sessionStorage.removeItem("dashboard-period-params")`) on `/auth/logout` (`user-dropdown`, `bottom-nav`) and initial `/login` mount (`SessionCleaner`) (ADR 005).


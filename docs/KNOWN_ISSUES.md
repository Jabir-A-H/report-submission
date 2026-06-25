# Known Issues & Bug Tracker

## Overview
This file tracks known bugs, temporary hacks, or design compromises made during development. Documenting these saves time when refactoring later.

## Active / Deferred Issues

### Secondary UI Components Unmemoized Supabase Client Instantiation
- **Date**: 2026-06-26
- **Description**: In `admin-dashboard.tsx`, `bottom-nav.tsx`, `user-dropdown.tsx`, and `correction-button.tsx`, `createClient()` is invoked directly in the render body without `useMemo()`. Every state update recreates the Supabase browser client reference.
- **Impact**: Medium (performance & WebSocket memory overhead)
- **Planned Fix**: Wrap browser client creation in `useMemo(() => createClient(), [])`.

---

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

### Unstable Client-Side Supabase Instantiation (`ReportProvider`)
- **Date**: 2026-06-25
- **Resolution Date**: 2026-06-25
- **Description**: `ReportProvider` instantiated `createClient()` directly inside the render body without `useMemo()`.
- **Fix**: Wrapped browser client creation in `useMemo(() => createClient(), [])` inside `report-context.tsx`.

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

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

### Admin Route Grouping (`(admin)`), Submission Lock (`is_submitted`), & Full-Field City Parity (ADR 012)
- **Date**: 2026-07-17
- **Resolution Date**: 2026-07-17
- **Description**: The admin area previously suffered from 7 fragmented legacy `/admin/*` routes with duplication and nav collisions. Furthermore, the dashboard Current Month Report Condition panel counted draft reports as completed without a formal submission mechanism (`is_submitted`), and `/city-report` only allowed numeric overrides without support for qualitative remarks (`city_comment`) or a clean View/Edit mode switcher.
- **Fix**: Migrated all admin pages (`/dashboard`, `/reports`, `/city-report`, `/management`) into `src/app/(admin)/*` (`(admin)` route group), completely eliminating the `/admin/` URL prefix per zero backward compatibility. Added `is_submitted (BOOLEAN DEFAULT false)` to `public.report` and added the **"রিপোর্ট জমা সম্পন্ন হয়েছে (Report Submission Done)"** checkbox (`CommentsForm`) to authoritative lock and track completion on the dashboard. Upgraded `CorrectionButton` with `isText={true}` `<textarea>` support to store string overrides in `city_report_override`, added Section 5 (**৫. মন্তব্য ও বিশেষ পর্যালোচনা / Comments**) to `CityReportPage`, and added the **`[ 👁️ ভিউ মোড / ⚡ এডিট মোড ]`** toggle to cleanly switch between inspecting and editing.

### WEB-006 & Accidental DCS Zone Report in DB (`report.id = 36`, ADR 009)
- **Date**: 2026-07-16
- **Resolution Date**: 2026-07-17
- **Description**: `src/app/report/[section]/page.tsx` had no role check, allowing superadmins to visit `/report/header?type=monthly&month=7&year=2026` and accidentally create a DCS zone report (`id=36`).
- **Fix**: Enforced `SectionSwitcher` role guard (`if (role === 'admin' || role === 'superadmin') router.replace('/dashboard')`). Excluded DCS (`zone_type = 'city'`) across city aggregation views and route handlers.

### Save Override Failure (`42P10`) & Edit Report Display Enhancements (ADR 010)
- **Date**: 2026-07-17
- **Resolution Date**: 2026-07-17
- **Description**: Admins could not save city-level override corrections in `/admin/city-report`; PostgREST threw `42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification`. The `city_report_override` table lacked a unique constraint matching `(year, month, report_type, section, field, category)`. Additionally, the page had a friction-causing override toggle button, and overridden cells only displayed the new value (`value`) without revealing what the original aggregated zone total (`computedValue`) was prior to override.
- **Fix**: Added Postgres constraint `ALTER TABLE public.city_report_override ADD CONSTRAINT city_report_override_unique_key UNIQUE NULLS NOT DISTINCT (year, month, report_type, section, field, category)` via Supabase. Updated `CorrectionButton.tsx` to use check-then-update/insert logic backed by matching composite `onConflict` keys, and added a `Trash2` ("মুছুন") button to revert overrides. Renamed `/admin/city-report` title and nav items to **এডিট রিপোর্ট** (`Edit Report` / `এডিট`) with override mode enabled permanently (`isEditing = true` + `⚡ ওভাররাইড মোড সক্রিয়` badge). Updated `NumericCell` to render comparative dual values `[ <s>computedValue</s> newValue ]` inside the amber badge whenever `isOverridden` is true.

### Authoritative Labeling Drift, Table Mode Structure & PDF Page Overflow (ADR 007)
- **Date**: 2026-07-13
- **Resolution Date**: 2026-07-13
- **Description**: Minor terminology drift existed between application UI/PDF outputs and original Bengali spreadsheet templates (`docs/Talimul_Report_2026`). Furthermore, `courses-form.tsx`, `organizational-form.tsx`, `personal-form.tsx`, and `meetings-form.tsx` table entry modes lacked structural parity with `/report` view tables (generic `ক্যাটাগরি` headings, un-transposed columns, un-split combined categories, unbounded column widths), and PDF export tables frequently overflowed onto an unwanted 3rd sheet without visual color parity.
- **Fix**: Synchronized all labels (`দায়িত্বশীলার নাম`, `সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা`, `ইউনিট সংখ্যা`, `কতজন নিয়ে সমাপ্ত`, `সহীহ শিখেছেন কতজন`, `সহযোগী হয়েছেন`) with dual-string fallback lookups (`find(r => r.category === cat || r.category === 'সহযোগী হয়েছে')`). Split the `জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)` category into dedicated `: কতটি` and `: কতজন` rows with fallback lookups. Split `Committee Orientation / Muallima Orientation` into two separate individual rows (`Committee Orientation` and `Muallima Orientation`), and engineered dedicated `meeting_name (varchar(255))` custom title storage on the `অন্যান্য` row (`updateField('meeting_name', customName, 'meeting', 'report_meeting', 'অন্যান্য')`) with dynamic word replacement (`cat === "অন্যান্য" && customTitle ? customTitle : cat`). Standardized exact domain top-left headings (`বিভাগ/ধরন`, `দাওয়াত ও সংগঠন`, `ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন`, `বৈঠকসমূহ`) and bounded sticky left column widths (`w-48` / `w-52`) across all entry forms. Implemented two-layered table headers (`গ্রুপ / কোর্স` & `শিক্ষার্থী অবস্থান`) in `CoursesForm` table mode and transposed row-based metrics (`PERSONAL_METRICS_ROWS`) in `PersonalForm` table mode. Engineered strict 2-Page Landscape A4 PDF budgeting (`ReportPDFDocument`) placing Section 0, Section 1, Section 3, and Maktab summary on Page 1, and Section 2, Section 4, Safar summary, and Section 5 on Page 2, guaranteeing double-sided single-sheet printing without overflow.

---

### Overview Report (`/report`) Header Placeholder Flicker (`জমাকৃত রিপোর্ট দেখার প্যানেল`)
- **Date**: 2026-07-13
- **Resolution Date**: 2026-07-13
- **Description**: `src/app/report/page.tsx` previously used a static ternary fallback (`: "জমাকৃত রিপোর্ট দেখার প্যানেল"`) whenever `reportInfo` evaluated to `null`. This caused the header to briefly flash "Submitted Report Viewing Panel" during initial page mount while `loadReport()` queried the database, or persistently whenever viewing an empty (`!reportInfo`) period.
- **Fix**: Replaced static fallback with instant dynamic header resolution (`activeZoneName — activeReportTypeBn রিপোর্ট — displayPeriodLabel`). The page now resolves the active zone (`userZoneName` / `zones` lookup) and period label (`searchParams`) immediately upon mount, ensuring accurate title context across loading and empty states without placeholder text.

---

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

### Unauthenticated Protected Route Access Rendering Error Text (`ব্যবহারকারী চিহ্নিত করা যায়নি।`) & Fragmented Auth Entry (ADR 008)
- **Date**: 2026-07-14
- **Resolution Date**: 2026-07-14
- **Description**: When opening direct protected URLs such as `/report/personal?type=monthly&month=7&year=2026` without an active login session, client components set a local error state (`setError("ব্যবহারকারী চিহ্নিত করা যায়নি।")`) instead of redirecting the user to authenticate. Additionally, separate `/login` and `/register` routes fragmented onboarding and created redundant top-level navigation, while prominent theme/language toggles cluttered header dropdowns and absolute form input icons overlapped placeholder text on smaller viewports.
- **Fix**: Consolidated `/login` and `/register` into a single dynamic portal page at `/home` (`AuthPortalClient`). Replaced the side-by-side 50-50 layout on `/home` with a vertical scrolling layout containing hero headings, a focused auth card (without top segmented tabs, using bottom toggle links (`অ্যাকাউন্ট নেই? নিবন্ধন করুন` / `অ্যাকাউন্ট আছে? লগ-ইন করুন`)), and rich platform feature cards right below. Added `!pl-12 !pr-4` to all form inputs with absolute icons to eliminate overlap with placeholders. Updated `middleware.ts` and client guards (`/report/[section]/page.tsx`, `UserDashboard`) to uniformly redirect unauthenticated visitors to `/home`. Finally, encapsulated prominent theme and language toggles inside `<details>` accordions (`UserDropdown`, `BottomNav`) and inline expanded footer items (`AppearanceFooterToggle`).

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


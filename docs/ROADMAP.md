# Project Roadmap

## Phase 1: MVP (Completed)
- [x] Initialize Next.js + Supabase workspace.
- [x] Define PostgreSQL tables and aggregation views.
- [x] Implement Auth with Admin Approval Gate (`active = false`).
  - [x] Registration with live on-blur validation (email & user_id uniqueness).
  - [x] Supabase silent email collision detection (`identities.length === 0`).
  - [x] Login via Email or User ID (server-side resolution).
  - [x] Middleware-enforced route protection and active status check.
- [x] Build User Dashboard & 7 Report Sections.
- [x] Build real-time Auto-Save system.
- [x] Build Admin Dashboard (Users, Zones, Overrides).
- [x] Implement City Report Aggregation View.
- [x] Develop custom, condensed PDF/Excel Export logic.
- [x] Transition Docs Suite to Master Manual + Living Trackers structure (`TECHNICAL_MANUAL.md` & `ADR/`).

## Phase 2: Core Reliability & Stabilization (Completed)
1. [x] **Fix Supabase Client Instability (`src/components/report/report-context.tsx`)**: Wrapped inline `createClient()` inside `ReportProvider` with `useMemo()`.
2. [x] **Memoize Mutator Callbacks (`src/components/report/report-context.tsx`)**: Wrapped `updateField` mutator in `useCallback()` to eliminate unnecessary child matrix re-renders.
3. [x] **Resolve Period Selection Race Conditions (`src/components/dashboard/user-dashboard.tsx`)**: Added cancellation flags (`let ignore = false`) to `useEffect` report initialization.
4. [x] **Eliminate Registration API Scaling Cap (`src/app/auth/register/actions.ts`)**: Migrated registration email validation from `admin.listUsers()` (1000-user cap) to query synchronized `public.people` (ADR 003).

## Phase 3: Secondary Polish & Mobile Usability Hardening (Active Focus)
1. [x] **Report Page UI/UX Refactor & Responsive Table Hardening (`src/app/report/page.tsx`)**: Implemented situation-based minimum-width overflow thresholds (`table-fixed w-full min-w-[500px]` / `min-w-[520px]`) with proportional column allocations across Sections 2, 3, and 4 so small mobile screens display critical first 3 columns clearly without horizontal scrolling disruptions while wider viewports expand across all columns (ADR 004).
2. [x] **Transparent, Border-Framed Inline Stats (`মক্তব রিপোর্ট:` & `সফর রিপোর্ট:`)**: Replaced tinted background boxes with clean, border-framed (`p-4 rounded-xl border border-border text-xs sm:text-sm` & `px-3 py-2 rounded-lg border border-border/70`) transparent cards, preserving normal font sizes (`font-black text-sm sm:text-base` for counts) and a responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5` layout (ADR 004).
3. [x] **Mobile Navigation & Filter Accessibility (`RootLayout`, `BottomNav`, `Navbar`, `UserDropdown`)**: Wrapped top and bottom navigation in `<Suspense>` to preserve URL search query parameters across period/zone filters. Implemented a 3-tab thumb-friendly mobile bottom navigation (`হোম`, `রিপোর্ট`, `প্রোফাইল`) with slide-up profile menu, consolidated download dropdown with click-outside accessibility, and moved `সাহায্য` (`/help`) inside `UserDropdown` to declutter the navbar.
4. [x] **Round 2 UI/UX Refinements & Compact Layout Architecture (ADR 005)**: Implemented Context-powered top-right compact view mode toggle (`CompactViewToggle` in `SectionLayout`), single-open collapsible accordions on `CoursesForm` (`openCards: { [COURSE_CATEGORIES[0]]: true }`), flat UI card dividers instead of inner box borders across all forms, dynamic responsive grid columns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`), Bismillah heading on `UserDashboard` with `zone(name)` query, top-right floating period pill on desktop (`md:`), and Hybrid State Persistence with explicit session purging (`sessionStorage.removeItem("dashboard-period-params")`) on `/auth/logout` and `/login` (`SessionCleaner`).
5. [x] **Complete Supabase Browser Client Memoization Consistency**: Memoized browser client usage in `src/app/report/[section]/page.tsx` via `useMemo(() => createClient(), [])` in `SectionSwitcher`.
6. [x] **Period State Simplification & Bug Fix (ADR 006)**: Removed `sessionStorage` restoration loop from `UserDashboard`. URL query params are now the sole source of truth for period state. Fixed section grid visibility guard (only shown when `hasParams && !isLoading && !error`). Added `isValidParam()` null-string guard in `UserDashboard` and `SectionSwitcher` to prevent RPC 400 errors from `"null"` string params. Fixed Report nav tab link in `BottomNav`/`Navbar` to navigate to home dashboard with params instead of broken `/report`. All navigation links (Home, Report, Help) now carry period params forward.
8. [x] **Authoritative Labeling Harmonization, Two-Layered/Transposed Forms & 2-Page Landscape PDF Budgeting (ADR 007)**: Synchronized UI and PDF labels across all 7 sections (`দায়িত্বশীলার নাম`, `সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা`, `ইউনিট সংখ্যা`, `কতজন নিয়ে সমাপ্ত`, `সহীহ শিখেছেন কতজন`, `সহযোগী হয়েছেন`, `Committee Orientation / Muallima Orientation`) with dual-string backward-compatible database record fallbacks. Implemented a two-layered table header (`গ্রুপ / কোর্স` & `শিক্ষার্থী অবস্থান`) in `CoursesForm` (`viewMode === 'table'`) and a transposed table mode in `PersonalForm` (`viewMode === 'table'`) displaying 7 horizontal metric rows and 3 category columns. Engineered strict 2-Page Landscape A4 page budgeting (`ReportPDFDocument`) placing Section 0, Section 1, Section 3, and Maktab summary on Page 1, and Section 2, Section 4, Safar summary, and Section 5 (`মন্তব্য ও স্বাক্ষর`) on Page 2, guaranteeing double-sided single-sheet printing without overflow onto a 3rd sheet.
9. [x] **Meetings Section Orientation Split & Interactive 'অন্যান্য' Custom Row Architecture**: Split `Committee Orientation` and `Muallima Orientation` into distinct dedicated database and UI rows across `MEETING_CATEGORIES`. Seeded all existing 25 reports (`report_meeting`) and updated `get_or_create_report` RPC with the 5th `অন্যান্য` row (`ON CONFLICT DO NOTHING`). Engineered interactive custom meeting name storage inside the `report_meeting` table (`meeting_name` column via `updateField('meeting_name', customName, 'meeting', 'report_meeting', 'অন্যান্য')`), formatted dynamically across `/report`, `/admin/city-report`, PDF export (`route.tsx`), and Excel export (`route.ts`) such that when `meeting_name` is provided, the inserted custom name directly replaces the word `অন্যান্য`.
10. [ ] **Mobile Touch Ergonomics (WCAG Lints)**: Expand touch target padding on nested table rows in `auto-save-field.tsx` (`min-h-[44px] min-w-[44px]`).
11. [x] **Mashq Category Split (`: কতটি` / `: কতজন`), Standardized Table Entry Top-Left Headings & Compact Column Widths (`w-48` / `w-52`)**: Split the `জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)` category into two individual rows (`: কতটি` and `: কতজন`) across all form entries, report overviews, and PDF/Excel exports (`route.tsx`, `route.ts`) with dual-string fallback lookups (`find(r => r.category === cat || r.category === legacyMashq)`). Standardized top-left heading cells on all section table entries (`courses-form.tsx`, `organizational-form.tsx`, `personal-form.tsx`, `meetings-form.tsx`) to match exact domain titles (`বিভাগ/ধরন`, `দাওয়াত ও সংগঠন`, `ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন`, `বৈঠকসমূহ`), and enforced compact `w-48` (192px) sticky left column widths on Courses, Organizational, and Meetings tables (`w-52` / 208px on Personal) to eliminate horizontal layout stretching on desktop and optimize touch/scroll experience across mobile viewports.
12. [x] **Unified Home Dynamic Portal & Collapsible Settings Architecture (ADR 008)**: Consolidated `/login` and `/register` into a unified interactive dual-mode (`Login` / `Register`) portal at `/home` (`AuthPortalClient`). Deleted `/login` and `/register` page routes entirely. Centralized unauthenticated redirects across `middleware.ts`, `UserDashboard`, and `/report/[section]` to seamlessly route unauthenticated visitors to `/home`. Replaced the side-by-side 50-50 split on `/home` with a centered vertical scrolling layout featuring hero headings at the top, a focused auth card (without top segmented tabs, using bottom link mode toggles and `!pl-12 !pr-4` input padding to prevent icon overlap), and rich platform feature cards (`প্ল্যাটফর্মের মূল বৈশিষ্ট্যসমূহ`) below. Encapsulated prominent theme and language controls inside compact `<details>` accordion components (`UserDropdown`, `BottomNav`) and inline expanded footer selectors (`AppearanceFooterToggle`).

## Phase 4: Post-Stabilization Feature Expansion
- [ ] **Signature Upload**: Add an option for users/admins to upload a handwritten signature image for PDF exports.
- [ ] **Custom JWT Claims (Performance)**: Store `role` and `active` as custom claims in the Supabase JWT via database hooks.
- [ ] **Realtime Pending Page Tracking**: Auto-refresh `/pending-approval` once an admin approves the account.
- [ ] **Google One Tap & Magic Links**: Implement passwordless auth options.
- [ ] **Enhanced Admin Charts & Audit Logs**: Add visual trend charts and audit tracking.
- [ ] **Mobile App Native Wrapper**: Capacitor or React Native wrapper for mobile deployment.

## Phase 5: Long-Term Enterprise Scale & Hierarchical Aggregation (1,000+ Grassroots Users)
- [ ] **4-Tier Organizational Schema Expansion**: Evolve database from 2-tier (City ➔ Zone) to 4-tier (City ➔ Zone ➔ Thana ➔ Ward/Unit) to support ~1,000 grassroots users.
- [ ] **Bottom-Up Postgres Rollup Views**: Implement automated SQL aggregation views (`view_thana_agg`, `view_zone_agg`, `view_city_agg`) so lower-level ward/thana reports automatically calculate upward without manual data entry.
- [ ] **Hierarchical Row Level Security (RLS)**: Enforce granular data isolation (Ward managers see only their Ward, Thana managers see Wards under their Thana, Zone managers see Thanas under their Zone).
- [ ] **Excel/CSV Bulk User Onboarding**: Build an admin upload tool in `/admin/users` to import and provision grassroots user accounts in bulk via spreadsheet.
- [ ] **Production Infrastructure & Domain Setup**:
  - [ ] Connect custom production domain name (e.g., `.org` / `.bd`).
  - [ ] Integrate Resend SMTP for reliable password recovery & transactional notifications (3,000 free emails/mo).
  - [ ] Configure automated GitHub Actions ping or evaluate Supabase Pro ($25/mo) for guaranteed 99.9% SLA uptime and daily automated cloud backups with 7-day Point-in-Time Recovery (PITR).

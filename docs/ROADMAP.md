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
4. [ ] **Secondary Component Memoization**: Wrap render-loop `createClient()` calls inside `admin-dashboard.tsx`, `bottom-nav.tsx`, `user-dropdown.tsx`, and `correction-button.tsx` with `useMemo`.
5. [ ] **Mobile Touch Ergonomics (WCAG Lints)**: Expand touch target padding on nested table rows in `auto-save-field.tsx` (`min-h-[44px] min-w-[44px]`).

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

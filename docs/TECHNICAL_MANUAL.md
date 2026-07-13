# 📊 Report Submission System: Authoritative Technical Manual & System Specification

**Version**: 2.0.0  
**Stack**: Next.js 15+ (App Router), React 19, Tailwind CSS v4, Supabase (PostgreSQL, Auth, Edge Functions), TypeScript 5.x  
**Orientation**: Mobile-First, Dual-Language (Bengali & English), Enterprise-Grade Monitoring & Consolidated Analytics  

---

## Table of Contents
1. [Executive Summary & Architecture Overview](#chapter-1-executive-summary--architecture-overview)
2. [Domain Model & Core Vocabulary](#chapter-2-domain-model--core-vocabulary)
3. [Database Schema, Views & Zero-Cost Operations](#chapter-3-database-schema-views--zero-cost-operations)
4. [Application Flows, Route Governance & API Services](#chapter-4-application-flows-route-governance--api-services)
5. [Mobile Design System & UI/UX Architecture (`/mobile-design`)](#chapter-5-mobile-design-system--uiux-architecture-mobile-design)
6. [Developer Conventions & Governance](#chapter-6-developer-conventions--governance)
7. [Appendices & Reference Mapping](#chapter-7-appendices--reference-mapping)

---

## Chapter 1: Executive Summary & Architecture Overview

### 1.1 System Purpose
The Report Submission System (রিপোর্ট সাবমিশন সিস্টেম) is an enterprise-ready, high-fidelity reporting and analytics platform engineered specifically for organizational monitoring, monthly zone assessments, and consolidated city-wide data aggregation. It replaces legacy manual spreadsheets and monolithic web prototypes with a zero-latency, highly secure, mobile-first web application.

### 1.2 High-Level Architecture Flow
```text
Browser / Client (Next.js)
       │
       │  Every HTTP Request
       ▼
middleware.ts
       │  Calls supabase.auth.getUser() + inspects people.active
       │  Routes public/protected paths, enforces admin approval gate
       ▼
Next.js App Router
       │
       ├─ Server Components  →  read data via SSR Supabase client (anon key)
       ├─ Server Actions      →  mutate data; admin ops use service role key
       ├─ Client Components   →  interactive UI (forms with on-blur validation, auto-save)
       │
       ▼
Supabase Edge / API Layer
       │
       ├─ Auth (Email/Password & Custom User ID via Server Actions)
       ├─ PostgreSQL (Tables, Triggers, RLS Policies, Aggregation Views)
       └─ Edge Functions / API Routes (Excel & Landscape PDF Export Generation)
```

### 1.3 Route Protection & Middleware Governance
The application relies on `src/middleware.ts` as the **single source of truth** for authentication and authorization enforcement:
- **Public Paths** (no auth required): `/home` (landing page), `/login`, `/register`, `/forgot-password`, `/update-password` (guarded by session check in page component), `/pending-approval`, `/auth/*`.
- **Protected Paths** (including `/` and `/report/*`): Middleware executes `supabase.auth.getUser()`. If unauthenticated, visitors on `/` are thrown to `/home`; all others go to `/login`.
- **Approval Gate (`active = false`)**: If a session exists but the corresponding user profile in the `people` table has `active = false` (or is missing entirely as an orphaned auth account), middleware silently intercepts navigation and redirects to `/pending-approval`.
- **API Paths (`/api/*`)**: Return a structured `401 JSON` payload instead of 307 redirects.
- **Search Parameter Sanitization**: Middleware clears URL search query parameters (`url.search = ""`) prior to redirecting to prevent session pollution and credential leakage.
- **Pending Approval Trap Prevention**: The `/pending-approval` page's "Return to Login" button uses a `<form method="post" action="/auth/logout">` rather than a Next.js `<Link>`. This prevents inescapable SSR middleware redirect loops.

### 1.4 Supabase Client Strategy
The codebase enforces three distinct client factory patterns across `src/utils/supabase/`:
1. **SSR Server Client (`@/utils/supabase/server`)**: Uses `ANON_KEY`. Employed in Server Components and Middleware.
2. **SSR Browser Client (`@/utils/supabase/client`)**: Uses `ANON_KEY`. Employed in Client Components needing direct database reads or optimistic auto-save mutations. *Must always be wrapped in `useMemo(() => createClient(), [])` inside component bodies to prevent WebSocket leaks.*
3. **Admin Client (`createClient` from `@supabase/supabase-js`)**: Uses `SERVICE_ROLE_KEY`. Restricted strictly to inline instantiation inside `'use server'` actions (`actions.ts`) and API route handlers (`route.ts`) to bypass RLS for user ID resolution, uniqueness checks, and admin overwrites. *Never exposed to the browser.*

---

## Chapter 2: Domain Model & Core Vocabulary

### 2.1 Organizational Hierarchy
- **City**: The overarching operational unit. Consolidated city reports aggregate metrics from all underlying zones.
- **Zones (`zones`)**: ~14 geographical partitions. Each zone represents an independent reporting territory.
- **Zone Managers (`role = 'user'`)**: Standard authenticated users assigned to a specific `zone_id`. They log in to enter report metrics exclusively for their zone.
- **Administrators (`role = 'admin' | 'superadmin'`)**: Platform operators with global read access across all zones, user account approval privileges, zone management rights, and official override authorities.

### 2.2 Reporting Lifecycles & Periods
Reports are submitted periodically across 5 supported temporal categories:
- `'মাসিক'` (Monthly) — *Primary operational focus.*
- `'ত্রৈমাসিক'` (Quarterly - Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
- `'ষান্মাসিক'` (Half-Yearly - H1: Jan-Jun, H2: Jul-Dec)
- `'নয়-মাসিক'` (Nine-Month - M9: Jan-Sep)
- `'বার্ষিক'` (Yearly - Annual: Jan-Dec)

### 2.3 The 7 Report Sections & Layout Architecture (`src/app/report/page.tsx`)
Every report corpus contains ~250+ individual metrics divided into 7 structural domains, structured for zero mobile squishing and crystal-clear visual hierarchy (ADR 004):
1. **মূল তথ্য (Header / Basic Info - `report_headers`)**: General unit numbers, responsible manager identities, and muallima (teacher) counts rendered inside a responsive summary grid with collapsible sub-sections (`grid-cols-2 max-[320px]:grid-cols-1 lg:grid-cols-4`).
2. **গ্রুপ / কোর্স রিপোর্ট (Courses - `report_courses`)**: 13-column educational group statistics, enrolled student counts, and attendance averages (`overflow-x-auto`).
3. **দাওয়াত ও সংগঠন (Organizational - `report_organizational`)**: Dawah outreach metrics, organizational distribution, and monetary collections (`min-w-[500px]` with `34% : 17% : 17% : 16% : 16%` proportional allocations ensuring the first 3 columns occupy 100% of phone viewports cleanly).
4. **ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন (Personal - `report_personal`)**: Transposed row-based metrics (`PERSONAL_METRICS_ROWS`) with equal `16%` column allocations (`min-w-[500px]`).
5. **বৈঠকসমূহ (Meetings - `report_meetings`)**: Meeting frequencies and attendance across city, thana, and ward echelons (`min-w-[520px]` with `10%` equal attendance columns).
6. **মক্তব ও সফর রিপোর্ট (Maktab & Travel - `report_extras`)**: Maktab educational metrics (`মক্তব রিপোর্ট:`) positioned below Section 1 and travel/tour audits (`সফর রিপোর্ট:`) below Section 4. Rendered as transparent, border-framed cards (`p-4 rounded-xl border border-border` with inner tiles `px-3 py-2 rounded-lg border border-border/70`) without background tints (`bg-transparent`) or double boxiness.
7. **মন্তব্য রিপোর্ট (Comments - `report_comments`)**: Free-text textual feedback and qualitative observations inside a clean `rounded-xl border border-border` container (`মন্তব্য:`).

---

## Chapter 3: Database Schema, Views & Zero-Cost Operations

### 3.1 Core Entity Definitions
The database resides on managed Supabase PostgreSQL. Core application tables reside in the `public` schema:
- **`people`**: User profiles linked 1:1 to `auth.users.id` via `supabase_uid` (`ON DELETE CASCADE`). Synchronized automatically upon account creation via trigger `on_auth_user_created`. Enforces unique custom `user_id` strings (e.g. `'sumona'`). Contains `active` boolean (approval gate).
- **`zones`**: Geographical zone registries.
- **`report`**: Root report headers identifying `zone_id`, `year`, `month`, and `report_type`. Enforces `UNIQUE (zone_id, month, year, report_type)` mathematical constraint.
- **Child Tables (`report_headers`, `report_courses`, `report_organizational`, `report_personal`, `report_meetings`, `report_extras`, `report_comments`)**: Contain metric payloads. Linked via `report_id` foreign key (`ON DELETE CASCADE`).
- **`city_report_overrides`**: Records admin corrections (`year`, `month`, `report_type`, `section`, `field`, `value`).

### 3.2 Atomic Report Initialization (`get_or_create_report` RPC)
To eliminate client-side race conditions and reduce network overhead from 8 requests to 1, report creation is executed via Postgres RPC function `get_or_create_report(p_zone_id, p_year, p_month, p_report_type)`:
- **Atomicity**: Wraps root `report` insertion and 7 seed child table insertions (handling 50+ categories) inside a single Postgres transaction.
- **Month Forcing**: If `p_report_type !== 'মাসিক'`, the SQL function forces `p_month := 1`, ensuring consistent database storage for all quarterly/annual entries.
- **Concurrency Safety**: Employs `ON CONFLICT DO NOTHING` against the root unique constraint.

### 3.3 High-Speed Aggregation Engine (Postgres Views)
City-wide totals are computed at the database storage layer via 6 specialized views (`view_city_header_agg`, `view_city_course_agg`, `view_city_organizational_agg`, `view_city_personal_agg`, `view_city_meeting_agg`, `view_city_extra_agg`).
- **Override Injection**: Views dynamically left-join `city_report_overrides` via `COALESCE(override.value, SUM(child.field))` to serve official corrections transparently.
- **Non-Monthly Aggregation**: For quarterly/yearly periods, the frontend or export API queries constituent monthly records within the target months span (e.g. Jan-Mar) and executes client-side reduction.

### 3.4 Row Level Security (RLS) & Security Definers
- Standard users retain `SELECT`, `INSERT`, `UPDATE` rights exclusively where `zone_id = auth.uid() mapped zone`.
- To prevent infinite RLS policy recursion on `people`, admin privileges are evaluated via `SECURITY DEFINER` SQL function `is_admin()`.

### 3.5 Zero-Cost Backup Strategy
In addition to daily Supabase managed backups, GitHub Actions cron workflow `.github/workflows/backup.yml` executes an automated, encrypted `pg_dump` of the PostgreSQL database and commits it to a secure private repository.

---

## Chapter 4: Application Flows, Route Governance & API Services

### 4.1 Authentication & Onboarding
- **Live Registration Validation**: `src/components/auth/register-form-client.tsx` executes real-time `onBlur` server actions (`checkEmailAvailability`, `checkUserIdAvailability`). Queries indexed `public.people` directly to verify availability without API scaling caps (ADR 003).
- **Silent Email Collision Guard**: In `actions.ts`, if `supabase.auth.signUp()` returns `identities.length === 0`, registration is halted with a Bangla warning to prevent email enumeration attacks.
- **PKCE Password Recovery**: `/forgot-password` generates recovery links pointing to `/auth/callback?next=/update-password`. Route handler `src/app/auth/callback/route.ts` executes `exchangeCodeForSession()`, establishing SSR session cookies reliably.

### 4.2 Admin Flow & Overrides
- **User Governance (`/admin/users`)**: Admins toggle user approval via explicit green **অনুমোদন করুন** (Approve -> `active=true`) and amber **নিষ্ক্রিয় করুন** (Deactivate -> `active=false`) action buttons.
- **Inline City Overrides (`/admin/city-report`)**: Admins click any aggregated numeric field to trigger inline adjustments, inserting records directly into `city_report_overrides`.

### 4.3 Export Services (Landscape PDF & Excel)
Export generation is handled via Next.js API route handlers (`/api/export/excel` and `/api/export/pdf`):
- **Landscape Orientation**: Engineered in Landscape orientation to display comprehensive multi-column data cleanly across a maximum of **two A4 pages**.
- **Universal Typography**: Uses universally compatible **Kalpurush** font binaries to prevent `@react-pdf/renderer` rendering crashes.

---

## Chapter 5: Mobile Design System & UI/UX Architecture (`/mobile-design`)

### 5.1 Mobile-First & Touch-First Philosophy
The interface adheres strictly to the `/mobile-design` guidelines (*Mobile-First · Touch-First · Platform-Respectful*):
- **Responsive Matrix Breakpoints**: On desktop displays (`>= 1024px`), report sections render as sticky tabular data grids. On mobile and tablet devices (`< 1024px`), inputs transform automatically into step-by-step swipeable cards.
- **Touch Ergonomics**: All interactive elements (buttons, inputs, dropdowns, nav steppers) enforce a minimum touch target area of **44x44px** with generous inter-element spacing to eliminate accidental taps.
- **Fixed Bottom Navigation**: Mobile views utilize a fixed bottom navigation bar (`src/components/layout/bottom-nav.tsx`) providing thumb-friendly route switching without hidden hamburger menus.

### 5.2 Theme System & HSL Color Tokens
The suite supports 4 curated visual themes: **Light**, **Dark**, **Solarized Light**, and **Solarized Dark**.
- **Token Contracts**: All styling rules utilize semantic HSL CSS variables (`--primary`, `--background`, `--card`, `--muted`) defined in `src/app/globals.css`. Hardcoded hex or RGB values are strictly prohibited.
- **Glassmorphism & Depth**: Elevated cards and modals utilize custom `.glass-panel` (20px backdrop blur) and `.light-catch` border utilities.

### 5.3 Zero-Refresh Dual-Language Engine
Users toggle seamlessly between Bengali (বাংলা - default) and English via `UserDropdown`. Language switching updates global UI string dictionaries dynamically via React Context without route pushes or page refreshes.

### 5.4 Dynamic Table Sizing & Inline Statistics Architecture (ADR 004)
To ensure optimal readability across both compact mobile phone screens (`< 360px–390px`) and widescreen displays without horizontal squishing, all report sections implement a dual-behavior overflow and card design (`src/app/report/page.tsx`):
- **Dynamic Minimum Width Thresholds (`min-w-[px]`)**: Tables inside `overflow-x-auto` wrappers enforce exact minimum widths (`min-w-[500px]` for Section 2 and Section 3; `min-w-[520px]` for Section 4) with strict proportional column allocations (`w-[34%] : w-[17%] : w-[17%] : w-[16%] : w-[16%]`). On compact mobile viewports (`< 500px`), the critical first 3 columns occupy exactly 100% of the screen width (`340px`), allowing users to inspect categories, numeric counts (`সংখ্যা`), and growth (`বৃদ্ধি`) without scrolling, while secondary financial/comment columns sit cleanly in the horizontal scroll. On wider screens (`> 500px`), `w-full` expands smoothly across all columns without horizontal scrollbars.
- **Transparent Border-Framed Inline Statistics**: Inline Maktab (`মক্তব রিপোর্ট:`) and Safar (`সফর রিপোর্ট:`) summaries eliminate background tints (`bg-transparent`), matching the exact curvature and border of primary data tables (`p-4 rounded-xl border border-border text-xs sm:text-sm`). Inner metric items render in individual border boxes (`px-3 py-2 rounded-lg border border-border/70`) with normal bold font sizing (`font-black text-sm sm:text-base` for counts and `font-semibold text-muted-foreground` for labels). On mobile (`grid-cols-1`), each item sits on its own row (`flex items-center justify-between py-0.5`), preventing multi-line wrapping.
- **Opaque Navigation & Filter Persistence**: Top (`Navbar`) and bottom (`BottomNav`) navigation bars use solid opaque backgrounds (`bg-card border-border opacity-100`) and are wrapped in `<Suspense>` (`RootLayout`) so `useSearchParams()` preserves active reporting filters (`zone_id`, `month`, `year`, `report_type`) across tab switching. Mobile users navigate via a 3-tab layout (`হোম`, `রিপোর্ট`, `প্রোফাইল`), while `সাহায্য` (`/help`) resides inside `UserDropdown`.

### 5.5 Hybrid State Persistence, Compact Header View Toggle, and Flat Accordion Architecture (ADR 005)
During the Round 2 UI/UX refinement cycle, three architectural enhancements were implemented across the reporting suite:
- **Hybrid State Persistence with Clean Session Guarantee (`Force Purge`)**: To ensure multi-tab safety (`Tab A` viewing July while `Tab B` edits August without storage race conditions or data corruption), URL query parameters (`?type=...&month=...&year=...`) remain the active source of truth. When valid period parameters exist on the Dashboard (`UserDashboard`) or within Section pages (`SectionLayout`), they are saved to `sessionStorage` (`"dashboard-period-params"`). When a user navigates back to Home (`/`) with a clean URL (`!hasParams`), the dashboard intercepts and immediately issues `router.replace(/?${savedParams})`. To guarantee 100% clean sessions across user logins, explicit session purging (`sessionStorage.removeItem("dashboard-period-params")`) runs right before `fetch("/auth/logout")` inside `user-dropdown.tsx` and `bottom-nav.tsx`, as well as on `/login/page.tsx` mount via `<SessionCleaner />`.
- **Context-Powered Compact Header View Toggle (`ViewModeContext`)**: The `Form / Table` (`LayoutList` / `Table2`) switcher is lifted out of individual form bodies directly into the top-right corner of the secondary navigation bar (`SectionLayout`), replacing the redundant `LayoutGrid` button (`flex justify-end min-w-[80px] md:min-w-[110px]`). Using `ViewModeContext` exported by `view-mode-toggle.tsx`, table-heavy forms (`CoursesForm`, `OrganizationalForm`, `PersonalForm`, `MeetingsForm`) provide their view state without prop drilling. If `CompactViewToggle` is rendered above a non-toggleable section (`ReportHeaderForm`, `ExtraForm`, `CommentForm`), it gracefully returns `null`.
- **Flat UI Card Design & Single-Open Accordions (`CoursesForm`)**: Inner box borders and background tints (`bg-muted/20 border border-border/40`) inside cards are eliminated across courses, meetings, personal, and header forms in favor of flat uppercase section dividers (`border-t border-border/40`). Input grids utilize dynamic multi-breakpoint responsive columns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`). Furthermore, all 8 course categories on `CoursesForm` render as collapsible accordions with rotating `ChevronDown` indicators, where **only the first category (`COURSE_CATEGORIES[0]`) is open by default (`openCards: { [COURSE_CATEGORIES[0]]: true }`)**, eliminating vertical scroll fatigue.
- **Form Primitive Expansion (`AutoSaveField`)**: The shared input primitive now supports three explicit presentation modes: (1) default stacked label-input layout, (2) inline compact row layout (`inline`, optional `inputWidth`) used by flat cards, and (3) dense table-cell mode (`tableMode`) used by horizontal matrix tables. Control heights were tightened (`h-[46px]` for standard inputs and `min-h-[110px]` for textareas) to reduce vertical bloat while preserving readability.
- **Section Layout Footer Navigation Upgrade (`SectionLayout`)**: Section footer actions now surface localized previous/next section names instead of generic labels, improving step awareness during sequential report entry. The extra outer `premium-card` shell around section content was removed so section components own card rendering directly (`max-w-4xl` clean container flow).
- **Extra & Comment Section Card Refinement**: `ExtrasForm` is now explicitly split into two cards (`মক্তব রিপোর্ট` and `সফর রিপোর্ট`) with dedicated category arrays (`MOKTOB_CATEGORIES`, `SAFAR_CATEGORIES`) while preserving the same data table mapping (`report_extra`). `CommentsForm` was visually aligned to the same flat card system (`rounded-2xl`, compact heading row) for consistency with other sections.
- **Global Card Motion Policy Adjustment (`globals.css`)**: `.premium-card` hover lift and aggressive shadow escalation were removed from the global utility class. Card elevation remains stable by default, and motion emphasis is now applied selectively at component level to avoid excessive hover movement in dense dashboard/report interfaces.

---

## Chapter 6: Developer Conventions & Governance

### 6.1 Coding Standards
- **Next.js App Router**: Server Components by default. React 19 `"use client"` restricted strictly to interactive forms or context providers.
- **TypeScript**: Strict type checking enforced across all Supabase query returns.
- **ESLint 9 Flat Config**: Maintained in `eslint.config.mjs`. Enforces standard Next.js Core Web Vitals, `eqeqeq`, and `no-console`.

### 6.2 Git Conventional Commits
Changelogs and versioning rely on strict commit prefixes:
- `feat:` (New features), `fix:` (Bug fixes), `docs:` (Documentation), `style:` (CSS tweaks), `refactor:` (Structural code changes), `chore:` (Tooling/Dependencies).

---

## Chapter 7: Appendices & Reference Mapping

### 7.1 Deprecated Legacy Migration Mapping
Historical documentation describing the migration from the legacy Python/Flask system (`models.py`, `LEGACY_MAPPING.md`, `MIGRATION_PLAN.md`) is archived in `docs/archive/`.

### 7.2 File Path Index
- `src/middleware.ts` — Route governance & auth approval gate.
- `src/app/auth/register/actions.ts` — Registration server actions & uniqueness checks.
- `src/app/report/page.tsx` — Report document layout, dynamic responsive table overflow thresholds (`min-w-[500px]`), and transparent border-framed inline statistics (ADR 004).
- `src/components/dashboard/user-dashboard.tsx` — User report matrix dashboard, Bismillah heading, and `sessionStorage` period parameter restoration (ADR 005).
- `src/components/report/section-layout.tsx` — Secondary top navigation bar with `CompactViewToggle` top-right slot (ADR 005).
- `src/components/report/auto-save-field.tsx` — Shared report field primitive with `inline` and `tableMode` rendering paths.
- `src/components/report/view-mode-toggle.tsx` — `ViewModeContext`, `ViewModeProvider`, and `CompactViewToggle` definitions (ADR 005).
- `src/components/report/sections/courses-form.tsx` — Courses form layout with single-open collapsible accordions and flat UI dividers (ADR 005).
- `src/components/report/sections/extras-form.tsx` — Split Maktab/Safar cards with dedicated category groups.
- `src/components/report/sections/comments-form.tsx` — Flat comment card aligned to section UI architecture.
- `src/components/auth/session-cleaner.tsx` — Client component enforcing force purge (`sessionStorage.removeItem`) on `/login` mount (ADR 005).
- `src/app/globals.css` — Global semantic tokens and reusable card/input utility classes.
- `docs/ROADMAP.md` — Active engineering tracking & sprint sequencing.
- `docs/KNOWN_ISSUES.md` — Living technical debt & bug repository.
- `docs/ADR/` — Formal Architecture Decision Records (`001` through `005`).

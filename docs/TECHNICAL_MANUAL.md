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

### 2.3 The 7 Report Sections
Every report corpus contains ~250+ individual metrics divided into 7 structural domains:
1. **মূল তথ্য (Header / Basic Info - `report_headers`)**: General unit numbers, responsible manager identities, and muallima (teacher) counts.
2. **গ্রুপ / কোর্স রিপোর্ট (Courses - `report_courses`)**: Educational group statistics, enrolled student counts, and attendance averages.
3. **দাওয়াত ও সংগঠন (Organizational - `report_organizational`)**: Dawah outreach metrics, organizational distribution, and monetary funding collections.
4. **ব্যক্তিগত উদ্যোগে তালিমুল কুরআন (Personal - `report_personal`)**: Personal Quranic instruction initiatives.
5. **বৈঠকসমূহ (Meetings - `report_meetings`)**: Meeting frequencies and average attendance across city, thana, and ward echelons.
6. **মক্তব ও সফর রিপোর্ট (Maktab & Travel - `report_extras`)**: Maktab educational metrics and travel/tour audits.
7. **মন্তব্য রিপোর্ট (Comments - `report_comments`)**: Free-text textual feedback and qualitative observations.

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
- `src/components/dashboard/user-dashboard.tsx` — User report matrix dashboard & RPC trigger.
- `src/components/report/report-context.tsx` — Optimistic auto-save state provider.
- `docs/ROADMAP.md` — Active engineering tracking & sprint sequencing.
- `docs/KNOWN_ISSUES.md` — Living technical debt & bug repository.
- `docs/ADR/` — Formal Architecture Decision Records.

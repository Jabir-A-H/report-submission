# 📊 Report Submission System: Authoritative Technical Manual & System Specification

**Version**: 2.0.0  
**Stack**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Supabase (PostgreSQL, Auth, Edge Functions), TypeScript 5.x  
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
- **Public Paths** (no auth required): `/home` (unified dynamic portal & landing page), `/auth/*`, `/forgot-password`, `/update-password` (guarded by session check in page component), `/pending-approval`. Note: `/login` and `/register` have been consolidated into `/home` (ADR 008). `/home` employs a centered vertical scrolling layout without any topbar header. The hero section displays simply `তা'লীমুল কুরআন বিভাগ` without top pills or paragraph subtitles, followed immediately by `AuthPortalClient` (Login/Register box), and rich platform feature cards (`প্ল্যাটফর্মের মূল বৈশিষ্ট্যসমূহ`) below. Mode switching (`login` vs `register`) is driven cleanly by the bottom toggle link (`অ্যাকাউন্ট নেই? নিবন্ধন করুন` / `অ্যাকাউন্ট আছে? লগ-ইন করুন`), removing top segmented tabs. All form inputs containing absolute icons (`Mail`, `Lock`, `User`, `Tag`, `MapPin` with `pointer-events-none`) enforce `!pl-12 !pr-4` (`!pl-12 !pr-8` for select) to prevent placeholder/text collision. Finally, the bottom footer row on `/home` embeds the `সাহায্য (Help)` link (`/help`) along with `AppearanceFooterToggle` (`ভাষা: [বাংলা | EN]` and `থিম: [লাইট | ডার্ক...]`) directly inline.
- **Protected Paths** (including `/` and `/report/*`): Middleware executes `supabase.auth.getUser()`. If unauthenticated, all visitors are uniformly redirected to `/home` (with search parameters cleared). Legacy or direct attempts to access `/login` or `/register` are intercepted by middleware and redirected to `/home` (`/home?mode=register` for `/register`). If an authenticated user hits `/home`, middleware redirects them to `/`. Furthermore, client-side guards on `/report/[section]` and `/report` explicitly run `router.replace('/home')` if `!user` is encountered after `getUser()`.
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

### 2.3 The 7 Report Sections & Layout Architecture (`src/app/report/page.tsx` & Section Entry Forms)
Every report corpus contains ~250+ individual metrics divided into 7 structural domains, structured for zero mobile squishing, crystal-clear visual hierarchy, and exact terminology alignment with official sheet templates (ADR 004, ADR 007):
1. **মূল তথ্য (Header / Basic Info - `report_headers`)**: General unit numbers (`ইউনিট সংখ্যা`), responsible manager identities (`দায়িত্বশীলার নাম`), and muallima counts (`সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা`, `প্রশিক্ষণপ্রাপ্ত মুয়াল্লিমা`, `মুয়াল্লিমা সহ ইউনিট`) rendered inside a responsive summary grid with collapsible sub-sections (`grid-cols-2 max-[320px]:grid-cols-1 lg:grid-cols-4`).
2. **গ্রুপ / কোর্স রিপোর্ট (Courses - `report_courses`)**: Educational group statistics, enrolled student counts, and attendance averages (`overflow-x-auto`). In both the overview report view (`/report`) and the section table entry mode (`courses-form.tsx` when `viewMode === 'table'`), the table features a structured **two-layered header**: Row 1 groups primary categories (`গ্রুপ / কোর্স` & `শিক্ষার্থী অবস্থান`), Row 2 splits sub-metrics (`সংখ্যা | বৃদ্ধি | ঘাটতি` and `বোর্ড | কায়দা | আমপারা | কুরআন`), and the top-left heading displays exactly `বিভাগ/ধরন` (compact sticky width on both `<th>` and `<td>`). Incorporates exact labels `কতজন নিয়ে সমাপ্ত` and `সহীহ শিখেছেন কতজন`. When in Card View (`viewMode === 'card'`), utilizes an interactive **dropdown accordion (`openCards` state)** with animated chevrons (`ChevronDown`) where the first category is expanded by default (`[COURSE_CATEGORIES[0]]: true`).
3. **দাওয়াত ও সংগঠন (Organizational - `report_organizational`)**: Dawah outreach metrics, organizational distribution, and monetary collections. In table entry mode (`organizational-form.tsx`), the top-left heading displays `দাওয়াত ও সংগঠন` with a compact sticky left column on both `<th>` and `<td>` elements (preventing horizontal over-stretching while ensuring clean truncation handling). Employs exact label `সহযোগী হয়েছেন` (with dual-string fallback lookups (`find(r => r.category === cat || r.category === 'সহযোগী হয়েছে')`)) and splits the Mashq category (`জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)`) into two dedicated rows (`জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি` and `জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতজন`) across all forms, reports (`/report`, `/admin/city-report`), and exports (`route.tsx`, `route.ts`). Includes dual-string fallback lookups (`find(r => r.category === cat || (cat === 'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি' && r.category === 'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)'))`) to guarantee backwards compatibility with legacy un-split records.
4. **ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন (Personal - `report_personal`)**: Both the overview report view (`/report`) and the table entry mode (`personal-form.tsx` when `viewMode === 'table'`) feature a **transposed row-based tabular architecture**. The exact 7 metrics (`PERSONAL_METRICS_ROWS`: `কতজন শিখাচ্ছেন`, `কতজনকে শিখাচ্ছেন`, `দাওয়াতপ্রাপ্ত ওলামা`, `সহযোগী হয়েছেন`, `সক্রিয় সহযোগী হয়েছেন`, `কর্মী হয়েছেন`, `রুকন হয়েছেন`) render as horizontal rows (`<tr>`), while the 3 personal tiers (`PERSONAL_CATEGORIES`: `রুকন`, `কর্মী`, `সক্রিয় সহযোগী`) render as vertical columns (`<th>`) with computed horizontal row totals (`মোট`). The top-left heading displays `ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন` with a standardized sticky left column on both `<th>` and `<td>` elements. When in Card View (`viewMode === 'card'`), features an interactive **dropdown accordion architecture (`openCards` state)** matching the Courses section.
5. **বৈঠকসমূহ (Meetings - `report_meetings`)**: Meeting frequencies and attendance across city, thana, and ward echelons. In both the overview report view (`/report`), the section table entry mode (`meetings-form.tsx` when `viewMode === 'table'`), `/admin/city-report`, and PDF/Excel exports (`route.tsx` & `route.ts`), the table features a structured **double-layered header**: Row 1 groups the major echelons (`বৈঠকসমূহ | মহানগরী | থানা | ওয়ার্ড | মন্তব্য`) where the top-left heading displays exactly `বৈঠকসমূহ` (fixed sticky column on both `<th>` and `<td>`), and Row 2 splits the sub-metrics under each echelon (`কতটি | গড় উপস্থিতি`). The 5 categories are: `কমিটি বৈঠক হয়েছে`, `মুয়াল্লিমাদের নিয়ে বৈঠক`, `Committee Orientation`, `Muallima Orientation`, and `অন্যান্য`. The `Committee Orientation` and `Muallima Orientation` rows are split into dedicated individual rows (with dual-string fallbacks (`find(r => r.category === cat || (cat === 'Committee Orientation' && x.category === 'Committee Orientation / Muallima Orientation'))`) ensuring legacy combined records remain readable without data migration). The `report_meeting` database table features two distinct text fields: `comments (text)` for normal qualitative remarks on all rows, and `meeting_name (varchar(255))` specifically for custom meeting titles on the `অন্যান্য` ("Others") row (`updateField('meeting_name', customName, 'meeting', 'report_meeting', 'অন্যান্য')`), dynamically formatted across `/report`, `/admin/city-report`, PDF (`route.tsx`), and Excel (`route.ts`) exports such that when `meeting_name` is provided, the inserted custom name directly replaces the word `অন্যান্য` (`cat === "অন্যান্য" && customTitle ? customTitle : cat`); if no name is given, it displays `অন্যান্য`. When in Card View (`viewMode === 'card'`), implements the **dropdown accordion (`openCards` state)** where `meeting_name` and metrics collapse cleanly under the interactive category header button.
6. **মক্তব ও সফর রিপোর্ট (Maktab & Travel - `report_extras`)**: Maktab educational metrics (`মক্তব রিপোর্ট:`) positioned below Section 1 and travel/tour audits (`সফর রিপোর্ট:`) below Section 4. Rendered as transparent, border-framed cards (`p-4 rounded-xl border border-border` with inner tiles `px-3 py-2 rounded-lg border border-border/70`) without background tints (`bg-transparent`) or double boxiness.
7. **মন্তব্য রিপোর্ট (Comments - `report_comments`)**: Free-text textual feedback and qualitative observations inside a clean `rounded-xl border border-border` container (`মন্তব্য:`).

**Note on Centralization:** To prevent terminology drift and ensure absolute consistency across all report forms, city-aggregation views, and PDF/Excel export endpoints, all category string arrays (e.g., `ORG_CATEGORIES`, `COURSE_CATEGORIES`, `MEETING_CATEGORIES`) and aggregation helpers (`sumRows`, `sumHeaderRows`, `getMonthsForPeriod`) have been strictly centralized into a single source of truth: `src/lib/report-utils.ts`. 

---

## Chapter 3: Database Schema, Views & Zero-Cost Operations

### 3.1 Core Entity Definitions
The database resides on managed Supabase PostgreSQL. Core application tables reside in the `public` schema:
- **`people`**: User profiles linked 1:1 to `auth.users.id` via `supabase_uid` (`ON DELETE CASCADE`). Synchronized automatically upon account creation via trigger `on_auth_user_created`. Enforces unique custom `user_id` strings (e.g. `'sumona'`). Contains `active` boolean (approval gate).
- **`zone`**: Geographical zone registries with hierarchical type classification (`zone_type`, `parent_id`).
  - **Schema Migration Staging (`ADR-009`)**: The DDL migrations `ALTER TABLE zone ADD COLUMN IF NOT EXISTS zone_type TEXT NOT NULL DEFAULT 'zone';` and `ALTER TABLE zone ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES zone(id);` are staged for execution when the application hierarchy is ported down one level (`Zone → Thana`). Per user adoption governance (`Staged Rollout Strategy`), this database migration is **deliberately deferred** until current users get completely accustomed to and confident with the newly established 2-tier system (`City → Zone`).
  - **Frontend Schema-Resilience & Fallback Protocol**: To guarantee zero downtime or `42703 (undefined_column)` Postgres query failures while the database remains unmigrated, all frontend queries (`fetchZones`, `fetchUsers` in `ManagementPage`) utilize `select("*")` instead of hardcoded column lists. Furthermore, `addZone()` includes an automatic `42703 error trap` that falls back to inserting `{ name }` if `zone_type` / `parent_id` do not exist in the live database table yet.
  - `zone_type TEXT NOT NULL DEFAULT 'zone'` — Classifies the zone's level in the organizational hierarchy. Current values: `'city'` (aggregates data from child zones; no data entry), `'zone'` (active reporting unit; users submit zone reports). Future values (TBD): `'thana'`, `'ward'`, `'unit'`. Column is free-text intentionally — new values can be added without schema migration.
  - `parent_id INTEGER REFERENCES zone(id)` — Self-referential foreign key linking child zones to their parent. DCS (`id=1`) has `parent_id = NULL` (root). All current reporting zones (ids 2–14) have `parent_id = 1` (child of DCS). Future thana/ward zones will set `parent_id` to their respective parent zone id.
  - **DCS Identity & Pragmatic Pollution Fix**: Zone `id=1` (`ডি সি এস` — Dhaka City South) is the city-level administrative entity. It is NOT a data-entry zone. Because the `zone_type` schema migration is deferred, the city report is computed by aggregating all zones but pragmatically excluding DCS via a hardcoded `WHERE r.zone_id != 1` (or similar) in all `view_city_*_agg` views. This prevents DCS data from inflating city totals instantly without requiring the full hierarchy down-port yet. Once ADR-009 is fully executed, this will be upgraded to use `WHERE z.zone_type != 'city'`.
  - **Zone Deletion Guard**: Zone deletion must check both `user_count > 0` (existing guard) AND `child_zone_count > 0` (blocks deletion if child zones exist via `parent_id`) to prevent FK constraint violations.
- **`report`**: Root report headers identifying `zone_id`, `year`, `month`, and `report_type`. Enforces `UNIQUE (zone_id, month, year, report_type)` mathematical constraint.
- **Child Tables (`report_headers`, `report_courses`, `report_organizational`, `report_personal`, `report_meetings`, `report_extras`, `report_comments`)**: Contain metric payloads. Linked via `report_id` foreign key (`ON DELETE CASCADE`).
- **`city_report_override`**: Records admin corrections (`year`, `month`, `report_type`, `section`, `field`, `value`, `category`). Enforces `UNIQUE NULLS NOT DISTINCT (year, month, report_type, section, field, category)` database constraint to guarantee idempotent `upsert` and check-then-update operations.

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
- **Unified Dynamic Portal (`/home`)**: Consolidated `/login` and `/register` into a centered vertical scrolling portal page without any top header bar. The hero section displays simply `তা'লীমুল কুরআন বিভাগ` (without top pills or paragraph subtitles), followed directly by `AuthPortalClient` and rich platform feature cards. Mode switching (`login` vs `register`) is handled cleanly by bottom toggle links (`অ্যাকাউন্ট নেই? নিবন্ধন করুন` / `অ্যাকাউন্ট আছে? লগ-ইন করুন`), eliminating redundant top tabs. All form inputs with absolute icons (`Mail`, `Lock`, `User`, `Tag`, `MapPin`) enforce `!pl-12 !pr-4` (`!pl-12 !pr-8` for select) to prevent placeholder/text overlap. The bottom footer row embeds the `সাহায্য (Help)` link (`/help`) alongside `AppearanceFooterToggle` (`ভাষা: [বাংলা | EN]` and `থিম: [লাইট | ডার্ক...]`) directly inline.
- **Live Registration Validation**: `src/components/auth/register-form-client.tsx` executes real-time `onBlur` server actions (`checkEmailAvailability`, `checkUserIdAvailability`). Queries indexed `public.people` directly to verify availability without API scaling caps (ADR 003).
- **Silent Email Collision Guard**: In `actions.ts`, if `supabase.auth.signUp()` returns `identities.length === 0`, registration is halted with a Bangla warning to prevent email enumeration attacks.
- **PKCE Password Recovery**: `/forgot-password` generates recovery links pointing to `/auth/callback?next=/update-password`. Route handler `src/app/auth/callback/route.ts` executes `exchangeCodeForSession()`, establishing SSR session cookies reliably.

### 4.2 Admin Flow & Route Grouping (`src/app/(admin)/*` per ADR-009 & ADR-012)

The admin area is organized inside the Next.js route group **`src/app/(admin)/*`** to deliver **4 clean, purposeful top-level URLs** (`/dashboard`, `/reports`, `/city-report`, `/management`) without the legacy `/admin/` prefix. Per our active development and zero backward compatibility policy, all routes directly serve the unified experience without redirect layers:
- **Desktop Top Bar (`Navbar`)**: When logged in as an `admin` or `superadmin` (`profile.role`), the header displays the 4 core admin links (**ড্যাশবোর্ড**, **জমাকৃত রিপোর্ট**, **সিটি রিপোর্ট**, **ব্যবস্থাপনা**) right inside the top bar alongside `UserDropdown`.
- **Mobile Bottom Bar (`BottomNav`)**: When `isAdmin` is true, the bottom bar automatically transforms into a 5-tab admin layout (`grid-cols-5`) right at the bottom of the screen: **ড্যাশবোর্ড** (`/dashboard`), **জমাকৃত** (`/reports`), **সিটি** (`/city-report`), **ব্যবস্থাপনা** (`/management`), and **প্রোফাইল** (toggles slide-up panel with Theme, Language, Help, and Logout). To prevent UI layout shift while waiting for slow database role checks, the nav utilizes eager evaluation (`pathname.startsWith(...)`) for known admin paths, rendering the admin layout instantly on those routes.
- **Clean Shell (`src/app/(admin)/layout.tsx`)**: Acts as a server component enforcing role verification (`redirect('/')` if not admin) and wrapping `{children}` without duplicate sidebar columns.

**Admin Route Map:**

| Route | Purpose |
|:---|:---|
| `/dashboard` | Dashboard landing — Current Month Report Condition panel (strictly verifying `report.is_submitted`) + 3 navigation cards |
| `/reports` | Paginated, filtered list of all submitted zone reports |
| `/city-report` | Aggregated city-wide report + View/Edit Mode toggle (**`[ 👁️ ভিউ মোড / ⚡ এডিট মোড ]`**) + full-field override editing (titled "সিটি রিপোর্ট") |
| `/management` | Tab 1: User management · Tab 2: Zone management |

- **Current Month Report Condition Panel (`/dashboard`)**: At the top of the Admin Dashboard landing page (`src/app/(admin)/dashboard/page.tsx`), an authoritative real-time summary panel displays the current month's (`month`, `year`) reporting status across all active zones assigned to the logged-in admin (`reportableZones`). It strictly verifies that `report.is_submitted === true` when calculating completed vs. pending zone submissions (`submittedCount` vs `pendingCount`), ensuring unsubmitted drafts are not counted. It highlights **মোট জোন / এলাকা** (`totalZonesCount`), **রিপোর্ট জমা হয়েছে** (`submittedCount`), and **এখনও অপেক্ষমাণ** (`pendingCount`) inside three vibrant KPI summary cards with a dynamic progress bar (`completionPercentage%`).
- **User Governance (`/management` → Users tab)**: Admins toggle user approval via **অনুমোদন করুন** (Approve → `active=true`) and **নিষ্ক্রিয় করুন** (Deactivate → `active=false`) action buttons. Also features instant text search (Name/Email/ID/Zone) combined with multi-filter dropdowns (**স্ট্যাটাস ফিল্টার**: All/Active/Pending; **রোল ফিল্টার**: All/Normal/Admin; **জোন ফিল্টার**: All/Specific Zone).
- **Zone Management (`/management` → Zones tab)**: Add/delete zones using a full-width responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`). Each zone card displays its **এলাকার ধরন (`zone_type`)** badge (`সিটি / নগর`, `জোন পর্যায়`, `থানা পর্যায়`, `ওয়ার্ড / হালকা`) and its **অধীনস্থ (`parent_id` / hierarchy)** parent zone. Clicking the interactive `[X] জন ইউজার দেখুন` button pops open the **Assigned Users Quick Modal (`selectedZoneForUsers`)**, listing every assigned user with avatar and status, plus a direct jump link to pre-filter the Users tab by that exact zone. The `+ নতুন জোন যোগ করুন` button is aligned opposite the `মোট জোন` badge, launching a centered **Floating Modal Dialog** (`floating type`).
- **404 / Unknown Route Governance (`/not-found.tsx` & `/[...not-found]/page.tsx`)**: Intercepts any unmatched or broken URL and redirects immediately to `/` using `"use client"` `useEffect` + `useRouter().replace("/")` (preventing App Router / Turbopack `Failed to execute 'measure' on 'Performance': 'NotFound' cannot have a negative time stamp` errors from synchronous `NEXT_REDIRECT` mid-render interruptions). Once redirected to `/`, role verification directs admins to `/dashboard`, normal users to `<UserDashboard />`, and guests to `/home`.
- **Full-Field City Report Parity & View/Edit Toggle (`/city-report`)**: Titled **সিটি রিপোর্ট** (`City Report`), this page provides a top-header toggle (`[ 👁️ ভিউ মোড / ⚡ এডিট মোড ]`). In View Mode, all correction triggers are hidden cleanly. In Edit Mode, admins can adjust or override any numeric cell across meetings or safars, as well as enter city-level qualitative remarks inside Section 5 (**৫. মন্তব্য ও বিশেষ পর্যালোচনা / Comments**) via the upgraded `CorrectionButton` (`isText={true}`, `<textarea>` support storing text strings in `city_report_override`). Overrides apply cleanly over `view_city_*_agg` views. `CorrectionButton` uses a context-driven localized state refresh (`ctx.refreshData()`) to update UI metrics cleanly without resorting to jarring full-page browser reloads (`window.location.reload()`).
- **Admin Role Guard**: `src/app/report/[section]/page.tsx` redirects to `/dashboard` if `role === 'admin' || role === 'superadmin'` — preventing admins from submitting zone-level report data. (WEB-006 fix, ADR-009.)
- **DCS City View in `/report`**: When an admin selects DCS (`zone_type='city'`) in the `/report` zone dropdown, the page queries `view_city_*_agg` views and renders read-only aggregated data — not the DCS zone's own report. Override capability is only available via `/city-report`.


### 4.3 Export Services (Landscape PDF & Excel - `src/app/api/export/pdf/route.tsx`)
Export generation is handled via Next.js API route handlers (`/api/export/excel` and `/api/export/pdf`), engineered with strict page budgeting and visual parity (ADR 007):
- **Strict 2-Page Landscape A4 Budgeting (`@react-pdf/renderer`)**: Engineered in Landscape orientation (`842 pt x 595 pt` with `0.5 inch` / `36 pt` uniform padding) to display comprehensive multi-column data across **exactly two sheets** (guaranteeing double-sided single-sheet printing capability):
  - **Page 1 Budget**: Holds Section 0 (`Header Container` with `#f8fafc` background + `4 Summary Stats Cards`), Section 1 (`১. গ্রুপ / কোর্স রিপোর্ট` with `two-layered table header` in Purple theme `#faf5ff` / `#6b21a8`), Section 3 (`৩. ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন` with `transposed 7-row table` in Pink theme `#fdf2f8` / `#9d174d`), and inline **Maktab Summary Block (`মক্তব রিপোর্ট:`)** at the bottom.
  - **Page 2 Budget**: Holds Section 2 (`২. দাওয়াত ও সংগঠন` across all 14 categories in Blue theme `#eff6ff` / `#1e40af`), Section 4 (`৪. বৈঠকসমূহ` across city/thana/ward in Cyan theme `#ecfeff` / `#155e75`), inline **Safar Summary Block (`সফর রিপোর্ট:`)**, and Section 5 (`মন্তব্য ও স্বাক্ষর` comment text box and right-aligned signature line).
- **Dual-String Backward-Compatible Lookups**: In `ReportPDFDocument`, category matching logic handles historical data alongside official Bengali sheet terminology seamlessly without data migration scripts (`find(r => r.category === cat || (cat === 'সহযোগী হয়েছেন' && r.category === 'সহযোগী হয়েছে'))`).
- **Universal Typography (`toBn()`)**: Uses universally compatible **Kalpurush** font binaries to prevent `@react-pdf/renderer` rendering crashes and converts all English digits (`0-9`) into standard Bengali numerals (`০-৯`) across every table cell and card total.

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
- **Dynamic Minimum Width Thresholds**: Tables inside overflow wrappers enforce dynamic minimum widths with strict proportional column allocations. On compact mobile viewports, the critical first 3 columns occupy exactly the full screen width, allowing users to inspect categories, numeric counts (`সংখ্যা`), and growth (`বৃদ্ধি`) without scrolling, while secondary financial/comment columns sit cleanly in the horizontal scroll. On wider screens, the table expands smoothly across all columns without horizontal scrollbars.
- **Transparent Border-Framed Inline Statistics**: Inline Maktab (`মক্তব রিপোর্ট:`) and Safar (`সফর রিপোর্ট:`) summaries eliminate background tints, matching the exact curvature and border style of primary data tables. Inner metric items render in individual border boxes with distinct visual hierarchy for counts and labels. On mobile, each item sits on its own row, preventing multi-line wrapping.
- **Opaque Navigation & Filter Persistence**: Top (`Navbar`) and bottom (`BottomNav`) navigation bars use solid opaque backgrounds (`bg-card border-border opacity-100`) and are wrapped in `<Suspense>` (`RootLayout`) so `useSearchParams()` preserves active reporting filters (`zone_id`, `month`, `year`, `report_type`) across tab switching. Mobile users navigate via a 3-tab layout (`হোম`, `রিপোর্ট`, `প্রোফাইল`), while `সাহায্য` (`/help`) resides inside `UserDropdown`. To eliminate navigation redundancy, all duplicate `অ্যাডমিন ড্যাশবোর্ড` links inside the slide-up profile panel (`BottomNav`) and desktop profile menu (`UserDropdown`) are stripped out when administrative tabs (`/admin` `ড্যাশবোর্ড`) exist directly on the primary navigation bars.
- **Mobile Management KPI Ribbon & Collapsible Filter Drawer**: On `/admin/management` (`User Governance`), the 4-column user stats grid (`grid-cols-2 lg:grid-cols-4`) transitions into a compact horizontal 4-in-1 KPI Ribbon (`sm:hidden flex items-center justify-between p-3 bg-card border border-border/80 rounded-2xl text-xs font-bold divide-x`) on small screens (`সক্রিয়`, `অপেক্ষমাণ`, `অ্যাডমিন`, `মোট`). The secondary filter dropdowns (`Status`, `Role`, `Zone`) collapse under an interactive `[ফিল্টার অপশন]` toggle (`isMobileFiltersExpanded`), while the text search bar (`Search input`) remains permanently visible at the top, preserving over 330px of vertical viewport space above the fold.

### 5.5 Period State Architecture: URL-Only Source of Truth (ADR 005 → ADR 006)
During the Round 2 UI/UX refinement cycle (ADR 005), a Hybrid State Persistence system was implemented using URL params + `sessionStorage` as a restoration fallback. This was subsequently superseded by ADR 006 after UAT revealed critical regressions in the restoration loop. The current state architecture is:

- **URL Query Parameters as Sole Source of Truth**: `?type=...&month=...&year=...` parameters on the Dashboard (`/`), Overview Report (`/report`), and Section pages (`/report/[section]`) remain the **only** active period state store. No `sessionStorage` writes or reads occur during normal app operation.
- **Standardized English Period Parameters**: To prevent URL percent-encoding bloat (`?report_type=%E0%A6%AE%E0%A6%BE%E0%A6%B8%E0%A6%BF%E0%A6%95`), URL parameters `type` and `report_type` strictly use short English strings (`monthly`, `quarterly`, `halfYearly`, `nineMonth`, `yearly`). Bidirectional maps (`DB_TYPE_MAP`, `URL_TO_ENGLISH_MAP`) in `ReportViewer`, `PeriodSelector`, `UserDashboard`, and export endpoints (`/api/export/excel`, `/api/export/pdf`) transparently translate between clean English URL values and exact database/display Bengali strings (`মাসিক`, `ত্রৈমাসিক`, `ষান্মাসিক`, `নয়-মাসিক`, `বার্ষিক`).
- **Overview Report Button-Triggered Filter Synchronization (`/report`)**: On `src/app/report/page.tsx`, UI dropdown selections (`selectedZone`, `selectedMonth`, `selectedYear`, `selectedReportType`) are decoupled from database queries until explicit user confirmation. Clicking **"ফিল্টার করুন"** (`handleApplyFilter`) pushes standardized English parameters (`?zone_id=...&month=...&year=...&type=...`) to `searchParams`. The data fetching callback `loadReport()` derives its target parameters strictly from `searchParams` (`appliedZoneId`, `appliedMonth`, `appliedYear`, `appliedReportType`), guaranteeing that the URL parameters and reported period data update simultaneously without premature or intermediate queries.
- **Instant Dynamic Header Resolution (`/report`)**: To prevent layout flicker or temporary display of placeholder text (`"জমাকৃত রিপোর্ট দেখার প্যানেল"`) during page mount or while `loadReport()` is fetching `reportInfo`, `src/app/report/page.tsx` computes its header (`activeZoneName — activeReportTypeBn রিপোর্ট — displayPeriodLabel`) dynamically from active `searchParams`, initial user profile state (`userZoneName`), and `zones` lookup even when `reportInfo === null`. This guarantees the header instantly displays accurate zone and period context across loading and empty (`!reportInfo`) states.
- **Period Propagation via Navigation Links**: All navigation links carry the current `paramsStr` forward. Specifically:
  - `Navbar`: Home link = `/${periodQuery}` (dashboard), Report link = `/report${periodQuery}` (overview report dashboard)
  - `BottomNav`: Home tab = `/${periodQuery}` (dashboard), Report tab = `/report${periodQuery}` (overview report dashboard)
  - `UserDropdown` Help link = `/help${periodQuery}` (Help page carries params in its own URL, allowing back-navigation to home with period preserved via Navbar)
  - `BottomNav` Help link = `/help${periodQuery}` (same as above)
  - `SectionLayout` back-arrow link = `/${queryString}` (always correct — built from `searchParams`)
  - `SectionLayout` Prev/Next section buttons = `/report/${section}${queryString}` (always carry params)
- **Robust Null-String Param Guard**: `isValidParam()` helper used in both `UserDashboard` and `SectionSwitcher` rejects the string `"null"` and `"undefined"` (which can appear when Next.js serializes `null` query values). This prevents `parseInt("null") = NaN` from reaching the RPC.
- **Section Grid Visibility Guard**: `UserDashboard` only renders the report section links grid when `hasParams && !isLoading && !error`. Before a period is selected, only the `PeriodSelector` card is shown.
- **Defensive Logout Cleanup (`SessionCleaner`)**: The `SessionCleaner` component on `/home/page.tsx` is retained as a defensive no-op to purge any stale data upon landing at the unauthenticated portal.
- **Context-Powered Compact Header View Toggle (`ViewModeContext`)**: The `Form / Table` (`LayoutList` / `Table2`) switcher is lifted out of individual form bodies directly into the top-right corner of the secondary navigation bar (`SectionLayout`), replacing the redundant `LayoutGrid` button (`flex justify-end min-w-[80px] md:min-w-[110px]`). Using `ViewModeContext` exported by `view-mode-toggle.tsx`, table-heavy forms (`CoursesForm`, `OrganizationalForm`, `PersonalForm`, `MeetingsForm`) provide their view state without prop drilling. If `CompactViewToggle` is rendered above a non-toggleable section (`ReportHeaderForm`, `ExtraForm`, `CommentForm`), it gracefully returns `null`.
- **Flat UI Card Design & Single-Open Accordions (`CoursesForm`)**: Inner box borders and background tints (`bg-muted/20 border border-border/40`) inside cards are eliminated across courses, meetings, personal, and header forms in favor of flat uppercase section dividers (`border-t border-border/40`). Input grids utilize dynamic multi-breakpoint responsive columns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`). Furthermore, all 8 course categories on `CoursesForm` render as collapsible accordions with rotating `ChevronDown` indicators, where **only the first category (`COURSE_CATEGORIES[0]`) is open by default (`openCards: { [COURSE_CATEGORIES[0]]: true }`)**, eliminating vertical scroll fatigue.
- **Form Primitive Expansion (`AutoSaveField`)**: The shared input primitive now supports three explicit presentation modes: (1) default stacked label-input layout, (2) inline compact row layout (`inline`, optional `inputWidth`) used by flat cards, and (3) dense table-cell mode (`tableMode`) used by horizontal matrix tables. Control heights were tightened (`h-[46px]` for standard inputs and `min-h-[110px]` for textareas) to reduce vertical bloat while preserving readability. To prevent wiping out user keystrokes during rapid typing caused by context render cascades, the internal `useEffect` decouples local state from upstream props by specifically evaluating the primitive value of `getInitialValue`, thereby immunizing the component from non-mutative sibling re-renders.
- **Extra & Comment Section Card Refinement**: `ExtrasForm` is now explicitly split into two cards (`মক্তব রিপোর্ট` and `সফর রিপোর্ট`) with dedicated category arrays (`MOKTOB_CATEGORIES`, `SAFAR_CATEGORIES`) while preserving the same data table mapping (`report_extra`). `CommentsForm` was visually aligned to the same flat card system (`rounded-2xl`, compact heading row) for consistency with other sections.
- **Global Card Motion Policy Adjustment (`globals.css`)**: `.premium-card` hover lift and aggressive shadow escalation were removed from the global utility class. Card elevation remains stable by default, and motion emphasis is now applied selectively at component level to avoid excessive hover movement in dense dashboard/report interfaces.
- **Collapsible Appearance Settings Accordions**: `UserDropdown` and `BottomNav` encapsulate `ThemeToggle` and `LanguageToggle` within native `<details className="group ...">` accordions triggered by `⚙️ থিম ও ভাষা (Appearance)`, preventing visual clutter on top navigation bars (ADR 008).


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
- `middleware.ts` — Route governance, auth approval gate, and unauthenticated redirects (`/home`). No role-based routing — role checks are done at the page/component level.
- `src/app/home/page.tsx` — Unified dynamic authentication & landing portal (ADR 008).
- `src/app/home/actions.ts` — Unified login & registration server actions (`login`, `register`, live uniqueness checks).
- `src/app/page.tsx` — Role-based root. Admins redirect to `/dashboard`; users render `<UserDashboard />`.
- `src/app/not-found.tsx` — Standard 404 client redirect (`useRouter().replace("/")` inside `useEffect`) to `/`.
- `src/app/[...not-found]/page.tsx` — Catch-all unmatched route handler client redirecting (`useRouter().replace("/")` inside `useEffect`) to `/`.
- `src/app/(admin)/layout.tsx` — Admin shell: server container enforcing role verification and wrapping `{children}` without separate sidebars (`(admin)` route group).
- `src/app/(admin)/dashboard/page.tsx` — Admin dashboard landing (`/dashboard`): Current Month Report Condition panel (strictly verifying `is_submitted`) + 3 navigation cards.
- `src/app/(admin)/reports/page.tsx` — Paginated, filtered zone report list (`/reports` via `useMemo` client). Each row links to `/report?zone_id=...&report_id=...`.
- `src/app/(admin)/city-report/page.tsx` — Aggregated city report viewer (`/city-report`) titled "সিটি রিপোর্ট" (`City Report`) with View / Edit Mode toggle switcher, full-field numeric override editing, and Section 5 qualitative comment overrides (`textarea` modal via `CorrectionButton` with `isText={true}`).
- `src/app/(admin)/management/page.tsx` — Merged Users + Zones management page (`/management`: `নতুন জোন` button, compact mobile KPI ribbon, collapsible filters, and click-outside `if unchanged` modal closure - ADR 011).
- `src/app/(admin)/management/actions.ts` — Server actions for management (`deleteUserAction` with role verification and cascade removal).
- `src/components/layout/navbar.tsx` — Desktop navigation bar (`hidden md:block`). Dynamically displays 4 admin links on desktop (`/dashboard`, `/reports`, `/city-report`, `/management`) for admins or inside `showAdminNav`.
- `src/components/layout/bottom-nav.tsx` — Mobile navigation bar (`md:hidden`). Dynamically displays 5 tabs for admins (`grid-cols-5`: Dashboard, Submitted, City, Management, Profile slide-up) and 3 tabs (`grid-cols-3`) for normal users.
- `src/components/auth/auth-portal-client.tsx` — Minimalist single-purpose dual-mode (`Login` / `Register`) auth card component driven by bottom toggle links without top tabs.
- `src/components/layout/appearance-footer-toggle.tsx` — Inline expanded bottom footer controls for language (`ভাষা: [বাংলা | EN]`) and theme (`থিম: [লাইট | ডার্ক...]`) selection.
- `src/app/report/page.tsx` — Report document layout, dynamic responsive table overflow thresholds (`min-w-[500px]`), transparent border-framed inline statistics (ADR 004). Admins see aggregated city data when DCS zone is selected.
- `src/app/report/[section]/page.tsx` — Zone report data-entry forms. Role guard: admin/superadmin → redirect to `/dashboard` (WEB-006 fix, ADR-009).
- `src/components/dashboard/user-dashboard.tsx` — User report matrix dashboard, Bismillah heading, period selector, and section links grid. URL params are sole period state source of truth (ADR 006).
- `src/components/report/section-layout.tsx` — Secondary top navigation bar with `CompactViewToggle` top-right slot (ADR 005).
- `src/components/report/auto-save-field.tsx` — Shared report field primitive with `inline` and `tableMode` rendering paths.
- `src/components/report/view-mode-toggle.tsx` — `ViewModeContext`, `ViewModeProvider`, and `CompactViewToggle` definitions (ADR 005).
- `src/components/report/sections/courses-form.tsx` — Courses form layout with single-open collapsible accordions and flat UI dividers (ADR 005).
- `src/components/report/sections/extras-form.tsx` — Split Maktab/Safar cards with dedicated category groups.
- `src/components/report/sections/comments-form.tsx` — Flat comment card aligned to section UI architecture.
- `src/components/auth/session-cleaner.tsx` — Client component enforcing force purge (`sessionStorage.removeItem`) on `/home` mount (ADR 005).
- `src/app/globals.css` — Global semantic tokens and reusable card/input utility classes.
- `docs/ROADMAP.md` — Active engineering tracking & sprint sequencing.
- `docs/KNOWN_ISSUES.md` — Living technical debt & bug repository.
- `docs/ADR/` — Formal Architecture Decision Records (`001` through `012`).

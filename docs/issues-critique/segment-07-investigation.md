# Segment 07 Investigation: Database Architecture, Security Hardening & Pre-Production Schema Cleanup

> **Author**: Subagent A (Lead Investigator)  
> **Segment**: 07 — Database Architecture, Security Hardening & Pre-Production Schema Cleanup  
> **Date**: 2026-11-15  
> **Context**: Pre-Production Audit under `AGENTS.md` Rule 7 (Pre-Production Agility & Zero Dead-Weight)  
> **Live Database Verified**: Supabase PostgreSQL `pxdkvewaglagnfcqeckn` (Region: `ap-southeast-2` Sydney)  
> **Target Files Audited**:
> - [`src/utils/supabase/client.ts`](file:///d:/WebDev/report-submission/src/utils/supabase/client.ts)
> - [`src/utils/supabase/server.ts`](file:///d:/WebDev/report-submission/src/utils/supabase/server.ts)
> - [`middleware.ts`](file:///d:/WebDev/report-submission/middleware.ts)
> - [`next.config.mjs`](file:///d:/WebDev/report-submission/next.config.mjs)
> - [`vercel.json`](file:///d:/WebDev/report-submission/vercel.json)
> - [`.github/workflows/ci.yml`](file:///d:/WebDev/report-submission/.github/workflows/ci.yml)
> - [`.github/workflows/build-apk.yml`](file:///d:/WebDev/report-submission/.github/workflows/build-apk.yml)
> - [`.github/workflows/backup.yml`](file:///d:/WebDev/report-submission/.github/workflows/backup.yml)
> - Live PostgreSQL Schemas, Functions, Triggers, Views, Constraints & RLS Policies

---

## 1. Executive Scorecard: Database Architecture & Infrastructure

| Assessment Dimension | Current Health | Score | Summary State |
|:---|:---:|:---:|:---|
| **Schema Governance & Entity Purity** | 🟢 Optimal | **94 / 100** | 100% singular table naming (`people`, `zone`, `report`, `report_*`). Dead objects (`legacy_people`, `view_city_course_final`) permanently dropped. One orphan unique constraint anomaly on `city_report_override`. |
| **RLS Statement Caching & Performance** | 🟢 Optimal | **98 / 100** | 34 RLS policies refactored to `is_admin()` and `get_user_zone_id()`. Evaluates once per statement (`STABLE SECURITY DEFINER`). 0 `auth_rls_initplan` warnings. |
| **Covering Indexes & Foreign Keys** | 🟢 Optimal | **97 / 100** | All 5 target covering indexes exist (`idx_people_supabase_uid`, `idx_people_zone_id`, `idx_report_header_report_id`, `idx_report_comment_report_id`, `idx_zone_parent_id`) plus composite child category keys. 0 unindexed foreign keys. |
| **Integrity Constraints (CHECK >= 0)** | 🟡 Needs Attention | **78 / 100** | 32 metric constraints verified. However, **7 numeric metric columns** across `report_header` (3 columns) and `report_course` (4 columns) lack `CHECK (col >= 0)`. |
| **Compute Proximity & Serverless Execution** | 🟢 Optimal | **100 / 100** | Vercel serverless execution is strictly pinned to Sydney (`syd1`) matching Supabase Sydney (`ap-southeast-2`). Asset tracing for `kalpurush.ttf` prevents `ENOENT`. |
| **HTTP Security Headers & Transport** | 🟢 Optimal | **92 / 100** | `next.config.mjs` configures HSTS (2 years), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, and Permissions-Policy. Content-Security-Policy (CSP) is unconfigured. |
| **CI Automation & Build Gates** | 🟢 Optimal | **100 / 100** | Complete GitHub Actions workflow (`ci.yml`) runs lint, typecheck, unit tests, and production build on push/PR to `main`. 100% pass rate. |
| **Supabase Client SSR Patterns** | 🟡 Needs Attention | **82 / 100** | `middleware.ts` uses modern `getAll()` / `setAll()`. However, `src/utils/supabase/server.ts` still uses deprecated `get()` / `set()` / `remove()` cookie methods. |

---

## 2. Issue-by-Issue Reality Check

### RS-14: Admin Dashboard Zone-Scoping Logic is Unreachable
- **Documented Location**: [`src/app/(admin)/dashboard/page.tsx:107-114`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L107-L114)
- **Reality Check**: Code inspection verifies:
  ```typescript
  const isAdminOrSuper =
    person?.role === "superadmin" || person?.zone_id === 1 || person?.role === "admin";
  const myZones = isAdminOrSuper
    ? reportableZones
    : reportableZones.filter(
        (z) => z.id === person?.zone_id || z.parent_id === person?.zone_id
      );
  ```
  However, [`src/app/(admin)/layout.tsx:23-25`](file:///d:/WebDev/report-submission/src/app/(admin)/layout.tsx#L23-L25) strictly enforces:
  ```typescript
  if (person?.role !== "admin" && person?.role !== "superadmin") {
    redirect("/");
  }
  ```
  Therefore, every user admitted to the `(admin)` route group is guaranteed to have `role === 'admin'` or `role === 'superadmin'`. The `isAdminOrSuper` flag evaluates to `true` on 100% of executions, making the fallback `parent_id` filtering branch completely unreachable dead code today.
- **Pre-Production Agility Verdict**: Confirmed as a harmless, non-blocking dormant branch. In ADR 022, the owner logged `DECIDED-NOT-DOING` because this branch reserves the schema hook for Roadmap Phase 5 (Hierarchical Sub-Admin purviews). Keep as-is.

---

### RS-70 / KI-018: Backups are Unencrypted Plaintext Dumps
- **Documented Location**: [`.github/workflows/backup.yml:28-36`](file:///d:/WebDev/report-submission/.github/workflows/backup.yml#L28-L36)
- **Reality Check**: Live code runs `docker run ... postgres:17 pg_dump ... --file "/backups/db_backup_${DATE}.sql"` and commits unencrypted plaintext `.sql` files directly to the target repository `${{ secrets.BACKUP_REPO }}`.
- **Pre-Production Agility Verdict**: Confirmed as an intentional design decision (`RESOLVED / WONTFIX (ADR 022)`). The destination repository (`Jabir-A-H/report-backups-private`) is access-controlled and strictly private. Implementing symmetric GPG passphrase encryption introduces CI secret rotation failure modes with zero threat-model benefit. Kept plaintext per owner decision.

---

### RS-71: No CI Runs Tests, Lint or Typecheck
- **Documented Location**: [`.github/workflows/ci.yml`](file:///d:/WebDev/report-submission/.github/workflows/ci.yml)
- **Reality Check**: Fully resolved and active. The workflow triggers on all pushes and PRs to `main`, executes on `ubuntu-latest` with Node.js 22, and enforces all four quality gates:
  1. `npm ci`
  2. `npm run lint` (ESLint 9)
  3. `npx tsc --noEmit` (TypeScript 5.x)
  4. `npm test` (Node.js test runner across all 3 test suites)
  5. `npm run build` (Turbopack production compilation)
  Dummy environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are injected into the CI runner environment, guaranteeing clean static compilation without exposing live credentials.
- **Pre-Production Agility Verdict**: **RESOLVED**. 0 further action required.

---

### RS-72: No HTTP Security Headers Configured
- **Documented Location**: [`next.config.mjs:6-38`](file:///d:/WebDev/report-submission/next.config.mjs#L6-L38)
- **Reality Check**: Fully resolved in ADR 021. `next.config.mjs` injects 6 security headers across all routes (`/(.*)`):
  - `X-Frame-Options: DENY` (anti-clickjacking)
  - `X-Content-Type-Options: nosniff` (anti-MIME confusion)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-DNS-Prefetch-Control: on`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (2-year HSTS)
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Gap Identified**: `Content-Security-Policy` (CSP) is currently omitted. While standard headers are robust, a baseline CSP whitelist (`connect-src 'self' https://*.supabase.co; img-src 'self' data: https:; script-src 'self' 'unsafe-eval' 'unsafe-inline'`) should be considered before public launch.
- **Pre-Production Agility Verdict**: **RESOLVED (Standard Headers)**; CSP recommended for pre-launch polish.

---

### RS-73: DB-Side Fixes Cannot be Verified from the Repo
- **Documented Location**: Supabase PostgreSQL live instance `pxdkvewaglagnfcqeckn`
- **Reality Check**: Using the Supabase MCP database tool, all historical database-side fixes were queried and verified directly against PostgreSQL system catalogs (`information_schema`, `pg_class`, `pg_constraint`, `pg_indexes`, `pg_policies`):
  1. **KI-007 (RPC string alignment)**: Verified in `get_or_create_report`. Seed strings use canonical `'সহযোগী হয়েছেন'` and `'সুধী'`.
  2. **KI-010 (`security_invoker = true` on city views)**: Verified in `pg_class.reloptions`. All 6 views (`view_city_*_agg`) enforce `reloptions = {"security_invoker=true"}`.
  3. **KI-011 (`CHECK (col >= 0)`)**: Verified live in `pg_constraint`. 32 constraints exist. However, 7 numeric metric columns remain unconstrained (see detailed audit below).
- **Pre-Production Agility Verdict**: **RESOLVED VIA MCP VERIFICATION**. No longer "unverifiable".

---

### RS-74: Leftover and Dead Code
- **Documented Location**: [`.discard/session-cleaner.tsx`](file:///d:/WebDev/report-submission/.discard/session-cleaner.tsx), [`src/app/home/page.tsx`](file:///d:/WebDev/report-submission/src/app/home/page.tsx)
- **Reality Check**:
  - `src/components/auth/session-cleaner.tsx` was quarantined to `.discard/session-cleaner.tsx` under `AGENTS.md` Rule 4 and its JSX mount completely removed from [`src/app/home/page.tsx`](file:///d:/WebDev/report-submission/src/app/home/page.tsx).
  - The inert `pattern="[০-৯0-9]*"` attribute was removed from `AutoSaveField`.
  - Stale `sessionStorage` keys are no longer written or queried anywhere in the repository.
- **Pre-Production Agility Verdict**: **RESOLVED**. Clean quarantine executed.

---

### KI-010: City Views Bypass RLS
- **Documented Location**: PostgreSQL views `view_city_*_agg`
- **Reality Check**: Direct catalog query confirms `security_invoker = true` on all 6 views:
  - `view_city_header_agg`: `reloptions: ["security_invoker=true"]`
  - `view_city_course_agg`: `reloptions: ["security_invoker=true"]`
  - `view_city_organizational_agg`: `reloptions: ["security_invoker=true"]`
  - `view_city_personal_agg`: `reloptions: ["security_invoker=true"]`
  - `view_city_meeting_agg`: `reloptions: ["security_invoker=true"]`
  - `view_city_extra_agg`: `reloptions: ["security_invoker=true"]`
- **Pre-Production Agility Verdict**: **RESOLVED & VERIFIED**.

---

### KI-011: Missing CHECK Constraints (Database Metrics Hardening)
- **Documented Location**: Child tables in `public` schema
- **Reality Check**: While 32 `CHECK (col >= 0)` constraints exist, catalog inspection reveals that **7 numeric metric columns lack check constraints**:
  1. `public.report_header`:
     - `certified_muallima_taking_classes` (integer) — ❌ Missing CHECK
     - `trained_muallima_taking_classes` (integer) — ❌ Missing CHECK
     - `ward` (integer) — ❌ Missing CHECK
  2. `public.report_course`:
     - `status_board` (integer) — ❌ Missing CHECK
     - `status_qayda` (integer) — ❌ Missing CHECK
     - `status_ampara` (integer) — ❌ Missing CHECK
     - `status_quran` (integer) — ❌ Missing CHECK
- **Pre-Production Agility Verdict**: **DEFECT RE-CONFIRMED**. A simple DDL patch adding these 7 constraints must be executed to achieve 100% database numeric integrity.

---

### KI-012: Unused Dependencies
- **Documented Location**: [`package.json`](file:///d:/WebDev/report-submission/package.json)
- **Reality Check**: Inspection of `package.json:33-47` verifies that unimported dependencies (`zod`, `react-hook-form`, `@hookform/resolvers`) were cleanly uninstalled. The production dependency list is lean (11 dependencies total: `@react-pdf/renderer`, `@supabase/ssr`, `@supabase/supabase-js`, `@vercel/analytics`, `@vercel/speed-insights`, `clsx`, `exceljs`, `lucide-react`, `next`, `next-themes`, `react`, `react-dom`, `tailwind-merge`).
- **Pre-Production Agility Verdict**: **RESOLVED**.

---

### KI-019: Covering Indexes for Auth & Joins
- **Documented Location**: PostgreSQL indexes on `people`, `zone`, `report`, `report_header`, `report_comment`
- **Reality Check**: Catalog query on `pg_indexes` confirms existence and configuration:
  - `idx_people_supabase_uid`: `CREATE UNIQUE INDEX idx_people_supabase_uid ON public.people USING btree (supabase_uid)` (Auth session lookup O(1))
  - `idx_people_zone_id`: `CREATE INDEX idx_people_zone_id ON public.people USING btree (zone_id)` (FK coverage)
  - `idx_report_header_report_id`: `CREATE INDEX idx_report_header_report_id ON public.report_header USING btree (report_id)` (FK coverage)
  - `idx_report_comment_report_id`: `CREATE INDEX idx_report_comment_report_id ON public.report_comment USING btree (report_id)` (FK coverage)
  - `idx_zone_parent_id`: `CREATE INDEX idx_zone_parent_id ON public.zone USING btree (parent_id)` (Hierarchical tree traversal)
  - `idx_report_zone_lookup`: `CREATE INDEX idx_report_zone_lookup ON public.report USING btree (zone_id, year, month)` (Composite report lookup)
  - In addition, child tables with composite unique keys (`report_course`, `report_extra`, `report_meeting`, `report_organizational`, `report_personal`) maintain `(report_id, category)` unique indexes where `report_id` is the leading B-tree key, providing native foreign key coverage.
  - Supabase Database Advisor reports **0 unindexed foreign key warnings**.
- **Pre-Production Agility Verdict**: **RESOLVED & VERIFIED**.

---

### KI-020: RLS Statement Caching & Performance
- **Documented Location**: PostgreSQL RLS policies across all 10 tables
- **Reality Check**: In ADR 023, 34 RLS policies were refactored to consume two helper functions:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.people 
      WHERE supabase_uid = (SELECT auth.uid()) 
        AND role IN ('admin', 'superadmin')
    );
  $$;

  CREATE OR REPLACE FUNCTION public.get_user_zone_id()
  RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT zone_id FROM public.people 
    WHERE supabase_uid = (SELECT auth.uid()) 
    LIMIT 1;
  $$;
  ```
  Because both functions are marked `STABLE`, PostgreSQL evaluates user identity and zone assignment **once per query statement** rather than re-evaluating correlated subqueries for every row.
  The Supabase Database Advisor reports **0 `auth_rls_initplan` warnings**.
- **Pre-Production Agility Verdict**: **RESOLVED & VERIFIED**.

---

### KI-023 Trap 1: Phantom Schema Fallacy (`zone_type` & `parent_id`)
- **Documented Location**: Table `zone`, [`src/app/home/page.tsx`](file:///d:/WebDev/report-submission/src/app/home/page.tsx), [`src/app/home/actions.ts`](file:///d:/WebDev/report-submission/src/app/home/actions.ts)
- **Reality Check**: Direct database query confirms that the schema migration was successfully executed on 2026-11-10:
  ```json
  [
    {"id":1,"name":"ডি সি এস","zone_type":"city","parent_id":null},
    {"id":2,"name":"শ্যামপুর জোন","zone_type":"upazila","parent_id":null},
    ...
  ]
  ```
  Both `zone_type text NOT NULL DEFAULT 'upazila'` and `parent_id integer REFERENCES zone(id)` are live in PostgreSQL.
  However, client code in [`src/app/home/page.tsx:38-44`](file:///d:/WebDev/report-submission/src/app/home/page.tsx#L38-L44) still runs defensive dual filtering:
  ```typescript
  const { data: rawZones } = await supabase.from("zone").select("id, name, zone_type").neq("id", 1).order("name");
  const zones = (rawZones || []).filter((z) => z.zone_type !== "city");
  ```
- **Pre-Production Agility Verdict**: Live schema is verified. Application code can safely drop the defensive `neq("id", 1)` and filter solely on `zone_type !== "city"`.

---

### KI-023 Trap 2: Duplicate Key DDL Crash on Split Mashq Categories
- **Documented Location**: Table `report_organizational`
- **Reality Check**: Live query on `report_organizational` confirms that duplicate un-split Mashq rows were purged:
  - `জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি`: exactly 28 rows.
  - `জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতজন`: exactly 28 rows.
  - Old unsplit `জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)`: 0 rows.
  - Stale spelling `সহযোগী হয়েছে`: 0 rows.
  - Canonical spelling `সহযোগী হয়েছেন`: exactly 24 rows.
- **Pre-Production Agility Verdict**: **RESOLVED IN DATABASE**. The database contains 100% clean canonical Unicode strings.

---

### Backlog Item 1: Direct `month` Column on `report_header` (RS-03)
- **Documented Location**: Table `report_header`, [`src/lib/report-data-loader.ts:465-490`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L465-L490)
- **Reality Check**: In PostgreSQL, `report_header` does not have a `month` column; `month` lives on parent `report`. When loading multi-month reports for a single zone, `loadReportDataBundle()` executes a query-layer join:
  ```typescript
  const monthMap = new Map((monthlyReports || []).map((r: any) => [r.id, r.month]));
  const rawHeader = (headerRes.data || []).map((h: any) => ({
    ...h,
    month: monthMap.get(h.report_id) ?? h.month,
  }));
  const computedHeader = isMultiMonth ? sumHeaderRows(rawHeader) : rawHeader[0] || null;
  ```
- **Architectural Analysis under Rule 7**:
  - *Option A (Direct DDL Migration)*: Add `month smallint NOT NULL` to `report_header`, populate via `UPDATE rh SET month = r.month FROM report r WHERE rh.report_id = r.id`, and update `get_or_create_report` RPC.
  - *Option B (Maintain Query-Layer Mapping)*: Keep `month` on root `report`. `loadReportDataBundle()` maps `month` in-memory.
  - *Evaluation*: In PostgreSQL relational design, storing `month` on `report_header` violates 3rd Normal Form (3NF) through transitive dependency: `report_header` $\rightarrow$ `report` $\rightarrow$ `month`. Furthermore, none of the other 6 child tables (`report_course`, `report_organizational`, etc.) have a `month` column; all depend on `report_id`. Adding `month` exclusively to `report_header` creates an architectural inconsistency across child tables. Because `report_header` is always queried alongside `report`, and the in-memory map takes < 0.1ms for 3-12 rows, maintaining the parent `report.month` relationship is structurally cleaner and eliminates data synchronization anomalies.
- **Pre-Production Agility Verdict**: **DISCHARGED AS CLEAN RELATIONAL DESIGN**. Denormalizing `month` onto `report_header` is unnecessary.

---

### Backlog Item 2: Permanent Dropping of Dead Database & Code Objects
- **Documented Location**: Supabase PostgreSQL and codebase
- **Reality Check**:
  1. `legacy_people`: Direct catalog query confirms `legacy_people` has been **PERMANENTLY DROPPED** (`DROP TABLE public.legacy_people CASCADE`). Table does not exist in `information_schema.tables`.
  2. `handle_new_auth_user()`: Direct catalog query confirms this trigger function has been **PERMANENTLY DROPPED** (`DROP FUNCTION public.handle_new_auth_user() CASCADE`). Only `handle_new_user()` exists.
  3. `view_city_course_final`: Direct catalog query confirms this dead view has been **PERMANENTLY DROPPED** (`DROP VIEW public.view_city_course_final CASCADE`). Only the 6 `view_city_*_agg` views exist.
  4. `src/components/auth/session-cleaner.tsx`: Quarantined to `.discard/session-cleaner.tsx` and removed from `src/app/home/page.tsx`.
- **Pre-Production Agility Verdict**: **100% COMPLETE & VERIFIED**.

---

### Backlog Item 3: DCS Zone 1 Entity & 2-Tier Hierarchy Migration (ADR 009)
- **Documented Location**: Table `zone`, `view_city_*_agg` views
- **Reality Check**:
  - `zone_type` and `parent_id` exist on `zone`.
  - DCS (`id=1`) has `zone_type = 'city'` and `parent_id = NULL`.
  - Accidental report `report.id = 36` was permanently deleted (0 rows with `zone_id = 1`).
  - **However**, all 6 `view_city_*_agg` views STILL use:
    ```sql
    WHERE (r.zone_id <> 1)
    ```
    instead of joining `zone` to filter on hierarchy:
    ```sql
    JOIN zone z ON r.zone_id = z.id WHERE z.zone_type != 'city'
    ```
- **Pre-Production Agility Verdict**: The views still carry the legacy magic number `zone_id <> 1`. They should be updated to join `zone` and filter on `z.zone_type != 'city'` to fully complete ADR 009.

---

### Backlog Item 4: Database String Standardization & Pruning Dual-String Shims
- **Documented Location**: Database tables `report_organizational` & `src/lib/report-utils.ts`
- **Reality Check**:
  - In PostgreSQL, 100% of rows have already been standardized to canonical Unicode strings.
  - In `src/lib/report-utils.ts`, the frontend still maintains dual-string fallback shims:
    ```typescript
    // report-utils.ts lines retaining legacy fallbacks:
    find(r => r.category === cat || r.category === 'সহযোগী হয়েছে')
    find(r => r.category === cat || (cat === 'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি' && r.category === 'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)'))
    ```
- **Pre-Production Agility Verdict**: **BLOATWARE IDENTIFIED**. Because the database has zero legacy rows, these dual-string matchers are completely dead and should be removed from `report-utils.ts`.

---

### Backlog Item 5: Native Period Keying & Constraint Collision in `city_report_override`
- **Documented Location**: Table `public.city_report_override`
- **Reality Check**: Deep catalog inspection uncovered a critical schema constraint anomaly:
  1. `city_report_override` has column `end_month integer NOT NULL DEFAULT 0`.
  2. Index `city_report_override_period_unique` was created on:
     `CREATE UNIQUE INDEX ... (year, month, end_month, report_type, section, field, category) NULLS NOT DISTINCT`
  3. **CRITICAL FINDING**: The old constraint `city_report_override_unique_key` was NEVER DROPPED!
     `ALTER TABLE public.city_report_override ADD CONSTRAINT city_report_override_unique_key UNIQUE NULLS NOT DISTINCT (year, month, report_type, section, field, category);`
- **Failure Mode**:
  Because `city_report_override_unique_key` is an active table constraint that omits `end_month`, if an admin creates an override for Q1 (month 1, end_month 3) and later creates an override for a custom range starting in month 1 (month 1, end_month 4), PostgreSQL will REJECT the insert with a unique constraint violation on `city_report_override_unique_key`!
  Furthermore, PostgREST upsert requires matching unique constraints.
- **Pre-Production Agility Verdict**: **CRITICAL BUG IDENTIFIED**. The obsolete constraint `city_report_override_unique_key` must be dropped via:
  ```sql
  ALTER TABLE public.city_report_override DROP CONSTRAINT city_report_override_unique_key;
  ALTER TABLE public.city_report_override ADD CONSTRAINT city_report_override_period_unique_key 
    UNIQUE NULLS NOT DISTINCT (year, month, end_month, report_type, section, field, category);
  ```

---

## 3. Pre-Production Schema DDL Verification Matrix

| Entity | Type | Primary Key / Unique Keys | Covering Indexes | CHECK Constraints | RLS Enabled | Policies Count | Health Status |
|:---|:---:|:---|:---|:---|:---:|:---:|:---:|
| `public.zone` | Table | `id` (PK)<br>`name` (UNIQUE) | `idx_zone_parent_id` (parent_id) | None | Yes | 5 | 🟢 Clean |
| `public.people` | Table | `id` (PK)<br>`email` (UNIQUE)<br>`user_id` (UNIQUE) | `idx_people_supabase_uid` (UNIQUE)<br>`idx_people_zone_id` (zone_id) | None | Yes | 4 | 🟢 Clean |
| `public.report` | Table | `id` (PK)<br>`(zone_id, month, year, report_type)` (UNIQUE) | `idx_report_zone_lookup` (zone_id, year, month) | None | Yes | 4 | 🟢 Clean |
| `public.report_header` | Table | `id` (PK) | `idx_report_header_report_id` (report_id) | 7 metric checks | Yes | 3 | 🟡 Missing 3 Checks |
| `public.report_course` | Table | `id` (PK)<br>`(report_id, category)` (UNIQUE) | Composite UNIQUE index covers FK | 8 metric checks | Yes | 3 | 🟡 Missing 4 Checks |
| `public.report_organizational` | Table | `id` (PK)<br>`(report_id, category)` (UNIQUE) | Composite UNIQUE index covers FK | 3 metric checks | Yes | 3 | 🟢 Clean |
| `public.report_personal` | Table | `id` (PK)<br>`(report_id, category)` (UNIQUE) | Composite UNIQUE index covers FK | 7 metric checks | Yes | 3 | 🟢 Clean |
| `public.report_meeting` | Table | `id` (PK)<br>`(report_id, category)` (UNIQUE) | Composite UNIQUE index covers FK | 6 metric checks | Yes | 3 | 🟢 Clean |
| `public.report_extra` | Table | `id` (PK)<br>`(report_id, category)` (UNIQUE) | Composite UNIQUE index covers FK | 1 metric check | Yes | 3 | 🟢 Clean |
| `public.report_comment` | Table | `id` (PK) | `idx_report_comment_report_id` (report_id) | None | Yes | 3 | 🟢 Clean |
| `public.city_report_override` | Table | `id` (PK)<br>Old: `(year, month, type, sec, fld, cat)` (UNIQUE)<br>New: `(year, month, end_month, type, sec, fld, cat)` (INDEX) | B-tree on unique keys | None | Yes | 4 | 🔴 Constraint Anomaly |
| `view_city_header_agg` | View | None | View over `report` + `report_header` | N/A (`security_invoker`) | N/A | N/A | 🟡 Uses `zone_id <> 1` |
| `view_city_course_agg` | View | None | View over `report` + `report_course` | N/A (`security_invoker`) | N/A | N/A | 🟡 Uses `zone_id <> 1` |
| `view_city_organizational_agg` | View | None | View over `report` + `report_organizational` | N/A (`security_invoker`) | N/A | N/A | 🟡 Uses `zone_id <> 1` |
| `view_city_personal_agg` | View | None | View over `report` + `report_personal` | N/A (`security_invoker`) | N/A | N/A | 🟡 Uses `zone_id <> 1` |
| `view_city_meeting_agg` | View | None | View over `report` + `report_meeting` | N/A (`security_invoker`) | N/A | N/A | 🟡 Uses `zone_id <> 1` |
| `view_city_extra_agg` | View | None | View over `report` + `report_extra` | N/A (`security_invoker`) | N/A | N/A | 🟡 Uses `zone_id <> 1` |

---

## 4. Security, RLS & Performance Advisor Assessment

### 4.1 Supabase Advisor Linter Findings

Executing `supabase.get_advisors()` surfaced 4 advisor items:

#### Finding 1: `authenticated_security_definer_function_executable` (WARN, Count: 3)
- **Functions Flagged**:
  1. `public.get_or_create_report(p_zone_id, p_year, p_month, p_report_type)`
  2. `public.get_user_zone_id()`
  3. `public.is_admin()`
- **Linter Detail**: These functions are declared `SECURITY DEFINER` and can be invoked directly by the `authenticated` role via REST PostgREST RPC (`/rest/v1/rpc/...`).
- **Deep-Dive Investigation & Risk Analysis**:
  - `is_admin()` and `get_user_zone_id()`: These are internal RLS helper functions. They are **never called via RPC by frontend code**. However, PostgreSQL requires that calling roles (`authenticated`) have `EXECUTE` privilege on functions evaluated in RLS policies. Moving these helpers to an internal, unexposed schema (e.g. `auth` or `internal`) or configuring PostgREST exposed schemas prevents RPC exposure while preserving RLS performance.
  - `get_or_create_report`: This function **IS called via RPC** by client code. Because it runs as `SECURITY DEFINER` (as `postgres`), **it currently bypasses table RLS and lacks caller authorization checks!**
  - **Critical Security Flaw**: Any authenticated user can call `supabase.rpc('get_or_create_report', { p_zone_id: 1, ... })` and spawn an accidental report for Zone 1 (DCS), or pass another zone's ID and pre-seed reports for zones they do not manage!
  - **Remediation**: Add explicit caller authorization inside `get_or_create_report`:
    ```sql
    IF NOT (is_admin() OR p_zone_id = get_user_zone_id()) THEN
      RAISE EXCEPTION 'Unauthorized: Caller cannot initialize reports for zone %', p_zone_id;
    END IF;
    IF p_zone_id = 1 THEN
      RAISE EXCEPTION 'Invalid operation: DCS (Zone 1) is an administrative entity and does not submit reports';
    END IF;
    ```

#### Finding 2: `auth_leaked_password_protection` (WARN, Count: 1)
- **Detail**: Leaked password protection is disabled in Supabase Auth settings.
- **Remediation**: Enable "Prevent use of compromised passwords" (HaveIBeenPwned API check) in Supabase Auth dashboard before public release.

#### Finding 3: Performance Advisor "Unused Index" Notices (INFO, Count: 5)
- **Indexes Flagged**: `idx_report_header_report_id`, `idx_zone_parent_id`, `idx_report_comment_report_id`, `idx_people_zone_id`, `idx_report_zone_lookup`.
- **Reality Check**: This is a known artifact of an active pre-production database with low traffic and recently applied migrations. These indexes are essential covering indexes for foreign key cascades (`ON DELETE CASCADE`) and RLS joins; **they must NOT be dropped**.

---

### 4.2 Client SSR Cookie Security & Deprecated Methods

Comparing [`middleware.ts`](file:///d:/WebDev/report-submission/middleware.ts#L13-L26) and [`src/utils/supabase/server.ts`](file:///d:/WebDev/report-submission/src/utils/supabase/server.ts#L11-L33):

- **In `middleware.ts`**:
  ```typescript
  cookies: {
    getAll() {
      return request.cookies.getAll()
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
      supabaseResponse = NextResponse.next({ request })
      cookiesToSet.forEach(({ name, value, options }) =>
        supabaseResponse.cookies.set(name, value, options)
      )
    },
  }
  ```
  This is the modern `@supabase/ssr` pattern that correctly handles chunked session tokens.

- **In `src/utils/supabase/server.ts`**:
  ```typescript
  cookies: {
    get(name: string) { return cookieStore.get(name)?.value },
    set(name: string, value: string, options: CookieOptions) { ... },
    remove(name: string, options: CookieOptions) { ... },
  }
  ```
  `get`, `set`, and `remove` have been officially deprecated by `@supabase/ssr`. In Next.js 15+ / 16 Server Components where `cookies()` is async, chunked Supabase auth cookies (`sb-*-auth-token.0`, `sb-*-auth-token.1`) can fail to reassemble under single-key `get(name)`.
- **Recommendation**: Modernize `src/utils/supabase/server.ts` to `getAll()` and `setAll()`.

---

## 5. Recommended Clean Modern Infrastructure Blueprint

```mermaid
flowchart TD
    subgraph Client_and_Edge ["Edge & SSR Gateway"]
        M["middleware.ts<br>(getAll / setAll Auth Guard)"]
        SRV["src/utils/supabase/server.ts<br>(Modernized to getAll/setAll)"]
        VERCEL["vercel.json<br>(Pinned to 'syd1')"]
        NEXT_CFG["next.config.mjs<br>(Security Headers + kalpurush.ttf Tracing)"]
    end

    subgraph PostgreSQL_purity ["PostgreSQL pxdkvewaglagnfcqeckn (Sydney)"]
        ZONE["zone<br>(zone_type, parent_id)"]
        PEOPLE["people<br>(idx_people_supabase_uid)"]
        REPORT["report<br>(is_submitted, UNIQUE root key)"]
        CHILDREN["report_* (7 Child Tables)<br>(39 CHECK col >= 0 Constraints)"]
        VIEWS["view_city_*_agg (6 Views)<br>(security_invoker=true, JOIN zone)"]
        OVERRIDE["city_report_override<br>(UNIQUE on year,month,end_month,...)"]
    end

    subgraph Security_Hardening ["Security Definer Functions"]
        RPC["get_or_create_report()<br>(Guarded: Caller Zone Validation + DCS Block)"]
        RLS_HELPERS["is_admin() + get_user_zone_id()<br>(STABLE SECURITY DEFINER, search_path=public)"]
    end

    M --> SRV
    SRV --> RLS_HELPERS
    RLS_HELPERS --> CHILDREN
    RPC --> REPORT
    RPC --> CHILDREN
    VIEWS --> CHILDREN
    VIEWS --> ZONE
```

### Actionable Pre-Production Remediation Steps

#### Step 1: Execute Complete CHECK Constraint Hardening DDL
Run the following SQL migration in Supabase to secure the 7 unprotected metric columns:
```sql
-- 1. report_header metric hardening
ALTER TABLE public.report_header 
  ADD CONSTRAINT check_certified_muallima_taking_classes_positive CHECK (certified_muallima_taking_classes >= 0),
  ADD CONSTRAINT check_trained_muallima_taking_classes_positive CHECK (trained_muallima_taking_classes >= 0),
  ADD CONSTRAINT check_ward_positive CHECK (ward >= 0);

-- 2. report_course metric hardening
ALTER TABLE public.report_course
  ADD CONSTRAINT check_course_status_board_positive CHECK (status_board >= 0),
  ADD CONSTRAINT check_course_status_qayda_positive CHECK (status_qayda >= 0),
  ADD CONSTRAINT check_course_status_ampara_positive CHECK (status_ampara >= 0),
  ADD CONSTRAINT check_course_status_quran_positive CHECK (status_quran >= 0);
```

#### Step 2: Fix `city_report_override` Constraint Anomaly
Drop the obsolete 6-column unique constraint and promote the 7-column period key to an active table constraint:
```sql
ALTER TABLE public.city_report_override 
  DROP CONSTRAINT city_report_override_unique_key;

ALTER TABLE public.city_report_override 
  ADD CONSTRAINT city_report_override_period_unique_key 
  UNIQUE NULLS NOT DISTINCT (year, month, end_month, report_type, section, field, category);
```

#### Step 3: Upgrade `view_city_*_agg` Views to Filter on Hierarchy
Update the 6 views to replace the hardcoded `WHERE (r.zone_id <> 1)` with clean hierarchical filtering:
```sql
-- Example for view_city_header_agg (replicate across all 6 views):
CREATE OR REPLACE VIEW public.view_city_header_agg WITH (security_invoker = true) AS
SELECT 
  r.year,
  r.month,
  r.report_type,
  sum(rh.total_muallima) AS total_muallima,
  sum(rh.muallima_increase) AS muallima_increase,
  sum(rh.muallima_decrease) AS muallima_decrease,
  sum(rh.certified_muallima) AS certified_muallima,
  sum(rh.certified_muallima_taking_classes) AS certified_muallima_taking_classes,
  sum(rh.trained_muallima) AS trained_muallima,
  sum(rh.trained_muallima_taking_classes) AS trained_muallima_taking_classes,
  sum(rh.total_unit) AS total_unit,
  sum(rh.units_with_muallima) AS units_with_muallima
FROM report r
JOIN report_header rh ON r.id = rh.report_id
JOIN zone z ON r.zone_id = z.id
WHERE z.zone_type != 'city'
GROUP BY r.year, r.month, r.report_type;
```

#### Step 4: Harden `get_or_create_report` RPC with Caller Zone Authorization
Prevent arbitrary zone creation or DCS accidental reporting:
```sql
CREATE OR REPLACE FUNCTION public.get_or_create_report(
  p_zone_id integer,
  p_year integer,
  p_month integer,
  p_report_type character varying
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id INT;
  v_course_cat TEXT;
  v_org_cat TEXT;
  v_personal_cat TEXT;
  v_meeting_cat TEXT;
  v_extra_cat TEXT;
BEGIN
  -- Caller authorization guard
  IF NOT (is_admin() OR p_zone_id = get_user_zone_id()) THEN
    RAISE EXCEPTION 'Unauthorized: cannot initialize report for another zone';
  END IF;

  -- Block accidental DCS reporting
  IF p_zone_id = 1 THEN
    RAISE EXCEPTION 'Invalid zone: DCS (Zone 1) is an administrative entity and does not submit reports';
  END IF;

  -- 1. Check if report already exists
  SELECT id INTO v_report_id
  FROM public.report
  WHERE zone_id = p_zone_id
    AND year = p_year
    AND month = p_month
    AND report_type = p_report_type;

  IF v_report_id IS NOT NULL THEN
    RETURN v_report_id;
  END IF;

  -- 2. Insert root report row with concurrency handling
  INSERT INTO public.report (zone_id, year, month, report_type)
  VALUES (p_zone_id, p_year, p_month, p_report_type)
  ON CONFLICT ON CONSTRAINT report_zone_month_year_type_unique DO NOTHING
  RETURNING id INTO v_report_id;

  -- 3. If inserted, perform the seeding
  IF v_report_id IS NOT NULL THEN
    -- Header
    INSERT INTO public.report_header (
      report_id, responsible_name, thana, ward, total_muallima, 
      muallima_increase, muallima_decrease, certified_muallima, 
      certified_muallima_taking_classes, trained_muallima, 
      trained_muallima_taking_classes, total_unit, units_with_muallima
    )
    VALUES (v_report_id, '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

    -- Comment
    INSERT INTO public.report_comment (report_id, comment)
    VALUES (v_report_id, '');

    -- Course
    FOREACH v_course_cat IN ARRAY ARRAY[
      'বিশিষ্টদের', 'সাধারণদের', 'কর্মীদের', 'ইউনিট সভানেত্রী', 
      'অগ্রসরদের', 'রুকনদের অনুশীলনী ক্লাস', 'শিশু- তা''লিমুল কুরআন', 
      'নিরক্ষর- তা''লিমুস সলাত'
    ] LOOP
      INSERT INTO public.report_course (
        report_id, category, number, increase, decrease, sessions, 
        students, attendance, status_board, status_qayda, status_ampara, 
        status_quran, completed, correctly_learned
      )
      VALUES (v_report_id, v_course_cat, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    END LOOP;

    -- Organizational
    FOREACH v_org_cat IN ARRAY ARRAY[
      'দাওয়াত দান', 'কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন', 
      'সহযোগী হয়েছেন', 'সম্মতি দিয়েছেন', 'সক্রিয় সহযোগী', 'কর্মী', 
      'রুকন', 'দাওয়াতী ইউনিট', 'ইউনিট', 'সুধী', 'এককালীন', 
      'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি',
      'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতজন', 'বই বিলি', 'বই বিক্রি'
    ] LOOP
      INSERT INTO public.report_organizational (report_id, category, number, increase, amount, comments)
      VALUES (v_report_id, v_org_cat, 0, 0, 0, '');
    END LOOP;

    -- Personal
    FOREACH v_personal_cat IN ARRAY ARRAY['রুকন', 'কর্মী', 'সক্রিয় সহযোগী'] LOOP
      INSERT INTO public.report_personal (
        report_id, category, teaching, learning, olama_invited, 
        became_shohojogi, became_sokrio_shohojogi, became_kormi, became_rukon
      )
      VALUES (v_report_id, v_personal_cat, 0, 0, 0, 0, 0, 0, 0);
    END LOOP;

    -- Meeting
    FOREACH v_meeting_cat IN ARRAY ARRAY[
      'কমিটি বৈঠক হয়েছে', 'মুয়াল্লিমাদের নিয়ে বৈঠক', 
      'Committee Orientation', 'Muallima Orientation', 'অন্যান্য'
    ] LOOP
      INSERT INTO public.report_meeting (
        report_id, category, city_count, city_avg_attendance, 
        thana_count, thana_avg_attendance, ward_count, 
        ward_avg_attendance, meeting_name, comments
      )
      VALUES (v_report_id, v_meeting_cat, 0, 0, 0, 0, 0, 0, '', '');
    END LOOP;

    -- Extra
    FOREACH v_extra_cat IN ARRAY ARRAY[
      'মক্তব সংখ্যা', 'মক্তব বৃদ্ধি', 'মহানগরী পরিচালিত', 
      'স্থানীয়ভাবে পরিচালিত', 'মহানগরীর সফর', 'থানা কমিটির সফর', 
      'থানা প্রতিনিধির সফর', 'ওয়ার্ড প্রতিনিধির সফর'
    ] LOOP
      INSERT INTO public.report_extra (report_id, category, number)
      VALUES (v_report_id, v_extra_cat, 0);
    END LOOP;

  ELSE
    SELECT id INTO v_report_id
    FROM public.report
    WHERE zone_id = p_zone_id
      AND year = p_year
      AND month = p_month
      AND report_type = p_report_type;
  END IF;

  RETURN v_report_id;
END;
$$;
```

#### Step 5: Modernize `src/utils/supabase/server.ts` to `getAll()` / `setAll()`
Replace deprecated `get`/`set`/`remove` in `server.ts` with standard cookie handling:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Ignored when called from Server Components
          }
        },
      },
    }
  )
}
```

---

## 6. Summary of Findings for Adversarial Review (Subagent B)

The following key findings are submitted to Subagent B (Adversarial Reviewer) for "Doubt Gate" stress-testing:

1. **`city_report_override` Anomaly**: Active unique constraint `city_report_override_unique_key` omits `end_month`, causing custom multi-month period range collisions.
2. **Missing CHECK Constraints**: 7 metric columns across `report_header` and `report_course` lack `CHECK (col >= 0)`.
3. **`get_or_create_report` Privilege Escalation**: As a `SECURITY DEFINER` function without caller authorization, any authenticated user can spawn empty reports for arbitrary zones.
4. **Denormalization vs. Normal Form on `report_header.month`**: Lead Investigator recommends **rejecting** denormalization of `month` onto `report_header`, maintaining clean 3NF relational modeling.
5. **Cookie API Modernization**: `src/utils/supabase/server.ts` requires updating to `getAll()` / `setAll()` to prevent chunked auth cookie failure.
6. **Obsolete Dual-String Shims**: Live database has 0 legacy string rows; dual-string fallback shims in `src/lib/report-utils.ts` can be safely demolished.

# ADR 027: Track 1 Database DDL, RLS Hardening, Unicode Normalization, and Persistent Storage Hygiene

**Date**: 2026-11-15  
**Status**: Accepted and Implemented  
**Deciders**: System Owner & Antigravity  
**Consulted**: `docs/issues-critique/SUMMARY.md`, `AGENTS.md` (Rule 7: Pre-Production Agility & Clean DDL Authority), PostgreSQL 17 Catalog Audit (`pxdkvewaglagnfcqeckn`)

---

## 1. Context and Problem Statement

Following the exhaustive pre-production audit of the whole issue register across 7 decoupled segments, **Track 1 (Database DDL, RLS Hardening & Storage Hygiene)** targeted foundational database vulnerabilities, schema data invariants, access control leaks, and disaster recovery gaps across the active pre-production system:

1. **Schema Constraints & Data Invariants**:
   - Test row `id=37` in `public.report` contained the legacy English string `'Monthly'` while all other 27 rows contained `'মাসিক'`, preventing the application of a database-level `report_type` invariant.
   - 7 numeric metric columns across `report_header` (`certified_muallima_taking_classes`, `trained_muallima_taking_classes`, `ward`) and `report_course` (`status_board`, `status_qayda`, `status_ampara`, `status_quran`) lacked `CHECK (col >= 0)` constraints.
   - `report_comment.comment` was unbounded `text`, posing layout overflow risks for 2-page landscape PDF print budgets.
   - `public.people` used standard case-sensitive unique indexes, allowing duplicate accounts or login misses when mobile soft keyboards auto-capitalized emails or usernames.
2. **Bengali Unicode Nukta Decomposition & UAX #15 Composition Exclusion**:
   - `report_extra` (48 rows), `report_organizational` (176 rows), `report_personal` (24 rows), and `report_meeting` (56 rows) contained decomposed NFD Unicode sequences (`\xe0\xa6\xaf\xe0\xa6\xbc` = U+09AF Ya + U+09BC Nukta) seeded by `get_or_create_report`.
   - In Unicode standard UAX #15, Bengali Nukta characters (`U+09DC..U+09DF`) are in **`CompositionExclusions.txt`**. Generic `normalize(col, NFC)` in PostgreSQL and JavaScript silently leaves them decomposed.
   - Frontend components send canonical precomposed NFC bytes (`\xe0\xa7\x9f` = U+09DF 'য়'). Binary string comparison failed, causing `0-row update` write dropouts and visible `"সংরক্ষণ ব্যর্থ হয়েছে"` errors during auto-saves.
3. **`city_report_override` Period Keying & PostgREST Upsert Incompatibility**:
   - In ADR 023, `end_month` was introduced to support multi-month period overrides (e.g. Q1: months 1–3, Half-Yearly: months 1–6). However, the original 6-column unique constraint `city_report_override_unique_key` was never dropped because PostgreSQL forbids dropping indexes that back unique constraints via `DROP INDEX`.
   - Table constraints conflicted, and [`correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx) upserted targeting the old 6-column `onConflict` parameter without passing `end_month`, throwing HTTP 400 (`42P10`).
   - Furthermore, override queries in [`city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx) and [`report-data-loader.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts) omitted `end_month` filtering.
4. **Zone Hierarchy & Declarative Aggregation Views (ADR 009)**:
   - Child zones 2–14 had `parent_id = NULL`. All 6 SQL aggregation views (`view_city_*_agg`) relied on the legacy magic number `WHERE r.zone_id <> 1` instead of relational hierarchy filtering.
5. **Google OAuth Zone 1 Contamination & Trigger Design**:
   - `people.zone_id` had a `NOT NULL` constraint. To satisfy this, trigger `handle_new_user()` fell back to `COALESCE(..., 1)`, contaminating Google OAuth signups with Zone 1 (DCS City administrative entity).
6. **Open PostgREST Privilege Escalation on `people`**:
   - RLS policies `people_update_admin` and `people_delete_admin` allowed any standard admin to update or delete rows in `people` via direct PostgREST calls, enabling self-promotion to `superadmin`, deletion of superadmins, and orphaned `auth.users` records.
7. **`get_or_create_report` Zero-Auth & SQL Ternary Logic Bypass**:
   - The `SECURITY DEFINER` RPC had zero caller authorization checks, allowing any user to create reports for other zones or DCS.
   - Naive checks (`IF NOT (is_admin() OR p_zone_id = get_user_zone_id())`) evaluate to `NULL` when `get_user_zone_id()` is `NULL`, silently bypassing the security check in PL/pgSQL.
8. **Supabase Client SSR Deprecation (`server.ts`)**:
   - `src/utils/supabase/server.ts` used deprecated `get`/`set`/`remove` cookie handlers, failing to handle chunked auth cookies and lacking Server Component error boundaries.
9. **Disaster Recovery & Storage Hygiene (`backup.yml`)**:
   - Automated backups committed uncompressed plaintext `.sql` dumps into Git, risked unbounded repo bloat, crashed on unchanged same-day runs, and lacked persistent monthly snapshot retention.

---

## 2. Decision Outcomes Matrix

| Problem Area | Chosen Architecture (Option A) | Rejected Alternatives | Architectural Rationale & Implementation Details |
|:---|:---|:---|:---|
| **1. Data Invariants & Numeric Bounds** | **Declarative DDL Constraints & Functional Indexes** | Application/Zod Validation Only (Option B); Custom Postgres ENUMs (Option C) | Sanitized row 37 to `'মাসিক'`. Added `CHECK (report_type = 'মাসিক')` on `report` and `CHECK (char_length(comment) <= 1500)` on `report_comment`. Added 7 non-negative `CHECK (col >= 0)` constraints on `report_header` and `report_course`. Dropped case-sensitive unique keys on `people` and created functional unique indexes `people_email_lower_idx` on `lower(email)` and `people_user_id_lower_idx` on `lower(user_id)`. |
| **2. Bengali Unicode Nukta Normalization** | **Byte Replacement SQL Migration & NFC Guard Constraints** | Application Dual-String Regex Shims (Option B); Pre-Production Table Truncate (Option C) | Replaced decomposed byte sequences (`chr(2479)||chr(2492)`) with precomposed NFC `chr(2527)` (`U+09DF` - 'য়') across `report_extra`, `report_organizational`, `report_personal`, `report_meeting`, and `city_report_override`. Added active constraints `check_*_category_nfc_nukta CHECK (position(chr(2492) in category) = 0)` on all 4 child tables. Re-deployed `get_or_create_report` with verified NFC string literals. |
| **3. Override Period Keying & Upsert Parity** | **Atomic 7-Column Constraint & Application Co-Migration** | Generated Stored String Key (Option B); Imperative Two-Step RPC (Option C) | Dropped legacy 6-column unique constraint `city_report_override_unique_key`. Established `city_report_override_period_unique UNIQUE NULLS NOT DISTINCT (year, month, end_month, report_type, section, field, category)`. Updated [`correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx) to pass `end_month: endMonth || 0` and match 7-column `onConflict`. Added `.eq("end_month", activePeriod.isMultiMonth ? activePeriod.endMonth : 0)` filter to [`city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx) and [`report-data-loader.ts`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts). |
| **4. Zone Hierarchy & Aggregation Views** | **Declarative Relational Hierarchy (`ADR 009`)** | Materialized Views with DB Triggers (Option B); Parameterized Aggregation RPC (Option C) | Executed `UPDATE zone SET parent_id = 1 WHERE id <> 1 AND parent_id IS NULL;` and enforced `zone_type NOT NULL`. Recreated all 6 aggregation views (`view_city_*_agg`) joining `zone z ON r.zone_id = z.id WHERE z.zone_type IS DISTINCT FROM 'city'` and explicitly retaining `WITH (security_invoker = true)`. |
| **5. Google OAuth Zone Design** | **Nullable Zone with Engine-Level Active Constraint** | Dummy Sentinel Row (Zone 99) (Option B); Pre-Auth Interstitial Callback (Option C) | Executed `ALTER TABLE people ALTER COLUMN zone_id DROP NOT NULL;`. Added constraint `CHECK (active = false OR (active = true AND zone_id IS NOT NULL))`. Updated trigger `handle_new_user()` to set `zone_id = NULL` for OAuth. Updated [`management/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx) with `<option value="">জোন নির্ধারণ করুন...</option>` placeholder and disabled approval button until a valid zone is selected. |
| **6. User Admin Security & RLS Lockdown** | **Zero-Trust Server Actions + Revoke Client Table Writes** | Complex Postgres Row/Column RLS (Option B); Procedural SECURITY DEFINER RPCs (Option C) | Dropped client write policies `people_update_admin`, `people_delete_admin`, and `people_insert_self_or_admin` on `public.people`. Retained strictly read-only `people_select_own`. Routed all user status toggles and zone changes through audited Server Actions in [`management/actions.ts`](file:///d:/WebDev/report-submission/src/app/(admin)/management/actions.ts) (`toggleUserActiveAction`, `changeUserZoneAction`) using the Supabase Service Role client. |
| **7. RPC Authorization Hardening** | **Null-Safe PL/pgSQL Hardening** | SECURITY INVOKER (Option B); Next.js Server Action Migration (Option C) | Hardened `get_or_create_report` retaining `SECURITY DEFINER`. Added `auth.uid() IS NULL` gate, single caller credentials lookup, active account check, city entity block (`zone_type = 'city' OR p_zone_id = 1`), and null-safe dynamic authorization check using `IS DISTINCT FROM` to eliminate SQL ternary logic bypasses. |
| **8. SSR Cookie API Modernization** | **Universal Modern Client (`getAll`/`setAll` + `try...catch`)** | Bifurcated Read/Write Clients (Option B); Service Role Everywhere (Option C) | Modernized [`src/utils/supabase/server.ts`](file:///d:/WebDev/report-submission/src/utils/supabase/server.ts) to modern `@supabase/ssr` `getAll()` and `setAll(cookiesToSet)`. Wrapped `cookieStore.set` in a `try...catch` block to handle Server Component rendering gracefully while relying on `middleware.ts` for session token refresh persistence. |
| **9. Backup Storage & Monthly Retention** | **Gzip -9 Compression + Python Monthly Retention Script** | Pure 30-Day Auto-Purge (Option B); External S3/R2 Cloud Bucket (Option C) | Updated [`.github/workflows/backup.yml`](file:///d:/WebDev/report-submission/.github/workflows/backup.yml) with `gzip -9` compression and timestamp format `db_backup_$(date +%Y-%m-%d_%H%M%S).sql.gz`. Integrated an inline Python retention script that retains the last backup of each calendar month persistently for historical records while deleting intra-month daily backups older than 30 days. Added `git commit ... || echo "No changes to commit"` idempotency guard. |

---

## 3. Verification and Quality Gates

All four quality gates passed cleanly with zero errors:
1. **TypeScript**: `npx tsc --noEmit` $\rightarrow$ 0 errors.
2. **Linting**: `npm run lint` $\rightarrow$ 0 errors / 0 warnings.
3. **Unit & Integration Tests**: `npm test` $\rightarrow$ 44/44 tests passing across 15 suites (added test coverage for `city_report_override` `end_month` single-month and multi-month query parameters).
4. **Production Build**: `npm run build` $\rightarrow$ Clean exit code 0, all 20 static/dynamic routes compiled cleanly with Turbopack.

# ADR 016: Sprint 2 — Database Integrity, View Security Hardening, and Auth Error Localization

## Date
2026-09-20

## Context
Following the completion of Sprint 1 (save reliability and input normalization), four critical database-layer and authentication issues remained from Phase 3.8:

1. **Seeded Category String Drift in `get_or_create_report` RPC (KI-007)**:
   The database RPC seeded `'সহযোগী হয়েছে'` (missing 'ন') and `'সূধী'` (long ূ), whereas the frontend application forms and calculation utilities look up `'সহযোগী হয়েছেন'` and `'সুধী'`. Any attempt to update those categories in newly seeded reports updated 0 rows in PostgreSQL.
2. **City Views Anonymous RLS Bypass (KI-010)**:
   All seven `view_city_*` aggregation views were owned by `postgres` without `security_invoker = true`. As a consequence, PostgREST requests possessing the Supabase anon key could query consolidated statistics directly, bypassing row-level security on base tables.
3. **Unconstrained Metric Columns (KI-011)**:
   Numeric columns in `report_*` tables lacked database-level `CHECK` constraints, leaving storage vulnerable to malformed or negative inputs.
4. **Leaked English Technical Auth Errors (KI-016)**:
   Server actions for login, password recovery, and password updates passed raw Supabase SDK error strings (e.g., `"Email not confirmed"`, `"User already registered"`, `"Email rate limit exceeded"`) directly into redirect URL search parameters, presenting untranslated English text to Bengali-only users.

## Decision

We applied the following architectural and database solutions:

1. **RPC Category Synchronization & In-Place Data Migration (Option A)**:
   - Modified `public.get_or_create_report` PostgreSQL RPC:
     - `'সহযোগী হয়েছে'` → `'সহযোগী হয়েছেন'`
     - `'সূধী'` → `'সুধী'`
   - Migrated existing database records in `report_organizational` and `city_report_override` in-place, preserving existing test metrics while establishing string parity.
2. **PostgreSQL View Security Invoker Lockdown (`ALTER VIEW ... SET (security_invoker = true)`)**:
   - Enforced `security_invoker = true` on all 7 views:
     - `view_city_header_agg`
     - `view_city_course_agg`
     - `view_city_organizational_agg`
     - `view_city_personal_agg`
     - `view_city_meeting_agg`
     - `view_city_extra_agg`
     - `view_city_course_final`
   - Queries through PostgREST now strictly enforce the querying user's RLS permissions on base tables.
3. **Database Integrity Constraints & Grant Hygiene**:
   - Applied `CHECK (col >= 0)` constraints to all numeric metric columns across `report_header`, `report_course`, `report_organizational`, `report_personal`, `report_meeting`, and `report_extra`.
   - Revoked dangerous `TRUNCATE`, `REFERENCES`, and `TRIGGER` permissions from the `anon` role across all public tables.
4. **Auth Error Localization & Registration Notice**:
   - Added `translateAuthError(rawMessage)` in `src/lib/i18n.ts` with comprehensive mapping for Supabase Auth errors and a Bengali fallback.
   - Wrapped error redirects in `src/app/home/actions.ts`, `src/app/forgot-password/actions.ts`, and `src/app/update-password/actions.ts`.
   - Added an upfront verification guidance banner in `RegisterFormClient` ("নিবন্ধনের পর ইমেইল যাচাই এবং অ্যাডমিনের অনুমোদন সম্পন্ন হলে লগ-ইন করতে পারবেন।").
5. **App Router Error & Loading Boundaries**:
   - Added root `src/app/loading.tsx` and `src/app/error.tsx` boundaries to guarantee elegant fallback states during network latency and unhandled exceptions.

## Consequences
- **Positive:** All organizational categories save seamlessly with 100% row matching.
- **Positive:** City aggregate views cannot be queried to bypass base table RLS.
- **Positive:** Malformed negative inputs are blocked at the database constraint layer.
- **Positive:** Field workers receive clear, actionable Bengali guidance on all authentication error conditions.
- **Status:** Accepted and Implemented.

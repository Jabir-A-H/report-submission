# Segment 07 Review: Database Architecture, Security Hardening & Pre-Production Schema Cleanup

> **Target Codebase**: `talimul-quran-report-submission`  
> **Auditor**: Subagent B (Adversarial Reviewer)  
> **Standard**: Adversarial "Doubt Gate" (`AGENTS.md` Rules 2 & 6), Pre-Production Agility (`AGENTS.md` Rule 7), Zero Dead-Weight Policy  
> **Live Database Verified**: Supabase PostgreSQL `pxdkvewaglagnfcqeckn` (Region: `ap-southeast-2` Sydney, PostgreSQL 17.6)  
> **Scope**: Adversarial Cross-Examination of Subagent A's Investigation ([`docs/issues-critique/segment-07-investigation.md`](file:///d:/WebDev/report-submission/docs/issues-critique/segment-07-investigation.md)) covering RS-14, RS-70–74, KI-010–012, KI-018–020, KI-023 traps 1 & 2, and Backlog Items 1–5.

---

## 1. Adversarial Scorecard & Sanity Check

| Issue / Proposal | Subagent A Position | Subagent B Adversarial Finding | Sanity Verdict |
|:---|:---|:---|:---:|
| **Dropping Dead Objects via `DROP ... CASCADE` (Backlog Item 2)** | Celebrates permanent dropping of `legacy_people`, `handle_new_auth_user()`, and `view_city_course_final` via `DROP ... CASCADE`. | **POSTGRESQL COLLATERAL DAMAGE RISK**: In PostgreSQL, `DROP ... CASCADE` silently and destructively severs all incoming foreign keys, rules, views, and triggers without prompt or confirmation. Furthermore, `handle_new_user` vs `handle_new_auth_user` naming similarity presented extreme operational risk: an accidental typo running `DROP FUNCTION handle_new_user() CASCADE` would have permanently severed the `on_auth_user_created` trigger on `auth.users`, catastrophically breaking all user signups! **The safe engineering standard is `DROP ... RESTRICT` preceded by explicit `pg_depend` inspection.** | **ACCEPTED REALITY; CONDEMN CASCADE METHODOLOGY** |
| **Plaintext Backup Workflow (RS-70 / KI-018)** | Confirms plaintext `.sql` backups in private repo as settled design decision under ADR 022 (`DECIDED-NOT-DOING` for GPG encryption). | **UPHELD ADR 022; IDENTIFIED 2 UNNOTICED RUNTIME PITFALLS**: Subagent A correctly respects the system owner's decision not to introduce GPG secret rotation friction for private repo backups. However, Subagent A missed two operational vulnerabilities in [`.github/workflows/backup.yml`](file:///d:/WebDev/report-submission/.github/workflows/backup.yml): (1) `git commit` crashes with exit code 1 on same-day manual triggers if the working tree has no changes; (2) daily uncompressed text `.sql` dumps in Git history cause unbounded repo bloat. | **UPHELD AS SETTLED DESIGN (WITH CI HARDENING)** |
| **`get_or_create_report` RPC Privilege Escalation & Guard Proposal** | Identified that `get_or_create_report` is `SECURITY DEFINER` without caller checks, enabling any user to spawn reports for other zones or DCS. Proposes: `IF NOT (is_admin() OR p_zone_id = get_user_zone_id())`. | **VULNERABILITY CONFIRMED, BUT SUBAGENT A'S PROPOSED FIX HAS A FATAL SQL THREE-VALUED LOGIC FLAW**: In PostgreSQL PL/pgSQL, if an unapproved user or unassigned account has `zone_id IS NULL`, `get_user_zone_id()` returns `NULL`. The expression `false OR (2 = NULL)` evaluates to `NULL`. The negation `NOT (NULL)` evaluates to `NULL`. In PL/pgSQL, `IF NULL THEN` is **never taken**! Thus, an unauthorized user with a null `zone_id` **bypasses the guard completely**! Furthermore, Subagent A hardcoded `IF p_zone_id = 1 THEN ...`, re-introducing the exact magic-number antipattern they condemned elsewhere. | **CRITICAL DEFECT CONFIRMED; REVISE FIX TO NULL-SAFE & HIERARCHICAL** |
| **`city_report_override` Constraint Migration (Backlog Item 5)** | Identifies active constraint `city_report_override_unique_key` omits `end_month`. Recommends dropping it and adding `city_report_override_period_unique_key`. | **CONFIRMED DEFECT, BUT SUBAGENT A MISSED CATASTROPHIC CLIENT BLAST RADIUS**: In [`src/components/admin/correction-button.tsx:106`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L106), PostgREST upsert explicitly passes `{ onConflict: 'year,month,report_type,section,field,category' }`. If the DB constraint is replaced without an atomic code patch in `CorrectionButton`, PostgREST will immediately throw `42P10: ON CONFLICT specification does not match any unique constraint`, **breaking 100% of override saves**! Furthermore, `CorrectionButton` does not pass `end_month`, meaning overrides still default to `0` and continue to collide! | **CRITICAL DEFECT CONFIRMED; MANDATE CO-MIGRATION OF CODE & DDL** |
| **Missing Numeric CHECK Constraints (KI-011 / RS-73)** | Found 7 numeric columns across `report_header` (3) and `report_course` (4) lacking `CHECK (col >= 0)`. | **VERIFIED & CONFIRMED SAFE**: Direct database query against PostgreSQL 17 system catalogs confirmed 0 rows currently have negative values or NULLs in these 7 columns. Adding `CHECK (col >= 0)` carries 0 risk of table lock failures or row rejections on existing data. | **ACCEPTED & READY FOR EXECUTION** |
| **SSR Cookie API Modernization (`server.ts`)** | Recommends replacing deprecated `get`/`set`/`remove` in [`src/utils/supabase/server.ts`](file:///d:/WebDev/report-submission/src/utils/supabase/server.ts) with `getAll`/`setAll`. | **VERIFIED WITH CRITICAL ERROR-HANDLING CAVEAT**: In Next.js Server Components, calling `cookieStore.set()` throws an unhandled error. The `try...catch` wrapper in `setAll` is non-negotiable. Without it, reading Supabase in Server Components (`page.tsx`, `layout.tsx`) will crash whenever Supabase refreshes an expiring JWT. | **ACCEPTED WITH MANDATORY TRY-CATCH GUARD** |
| **`view_city_*_agg` Hierarchy Upgrade (ADR 009 / Backlog Item 3)** | Recommends updating all 6 views from `WHERE r.zone_id <> 1` to `JOIN zone z ON r.zone_id = z.id WHERE z.zone_type != 'city'`. | **VERIFIED WITH CRITICAL SECURITY OPTION WARNING**: Running `CREATE OR REPLACE VIEW` without explicitly appending `WITH (security_invoker = true)` defaults to `security_invoker = false` (security definer), which would silently re-introduce KI-010 and bypass RLS! | **ACCEPTED WITH MANDATORY SECURITY_INVOKER PRESERVATION** |

---

## 2. False-Positive Discharge Table

The following table categorizes database, infrastructure, and linter warnings that were investigated and authoritatively discharged as harmless in pre-production or deliberate design invariants:

| Issue / Warning | Documented Assertion | Live Database Reality | Adversarial Verdict & Technical Justification |
|:---|:---|:---|:---|
| **Supabase Performance Advisor: "Unused Index" (5 Notices)** | `idx_report_header_report_id`, `idx_zone_parent_id`, `idx_report_comment_report_id`, `idx_people_zone_id`, `idx_report_zone_lookup` flagged as unused. | The PostgreSQL query planner selects sequential scans because tables currently hold < 50 rows in pre-production. | **DISCHARGED (FALSE POSITIVE)**<br>These indexes are critical covering indexes for foreign key cascading (`ON DELETE CASCADE`) and RLS filtering. Dropping them based on low pre-production traffic would guarantee full table lock sequential scans once production data arrives. |
| **Supabase Security Advisor: `authenticated_security_definer_function_executable` on RLS Helpers** | Functions `public.is_admin()` and `public.get_user_zone_id()` are flagged as callable by `authenticated` users via REST PostgREST RPC. | Both functions take 0 arguments and inspect strictly `(SELECT auth.uid())` for the requesting session. | **DISCHARGED (BENIGN LINTER ARTIFACT)**<br>PostgreSQL RLS evaluation requires that the executing role (`authenticated`) possess `EXECUTE` privileges on policy helper functions. Neither function accepts inputs, mutates state, or permits horizontal privilege escalation. Moving them to private schemas is optional; their presence in `public` is harmless. |
| **Supabase Security Advisor: `auth_leaked_password_protection` (Disabled)** | Flagged as security risk: Compromised password detection (HaveIBeenPwned API) is disabled. | In pre-production, developers and test accounts use standard mock passwords for rapid login testing. | **DISCHARGED (PRE-PRODUCTION CONVENIENCE)**<br>Enabling third-party API lookups on test accounts during development impedes automated workflows. This is a one-click dashboard toggle to be activated immediately before production launch. |
| **RS-14: Admin Dashboard Zone-Scoping Logic is Unreachable** | [`src/app/(admin)/dashboard/page.tsx:107-114`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L107-L114) fallback branch `z.parent_id === person?.zone_id` is unreachable dead code. | [`src/app/(admin)/layout.tsx:23-25`](file:///d:/WebDev/report-submission/src/app/(admin)/layout.tsx#L23-L25) restricts entry to `admin` and `superadmin`, so `isAdminOrSuper` is always true. | **DISCHARGED (INTENTIONAL ARCHITECTURAL RESERVATION)**<br>Formally resolved in ADR 022 as `DECIDED-NOT-DOING`. This branch is the pre-wired hook for Roadmap Phase 5 (Hierarchical Sub-Admin purviews). Pruning it now would create redundant re-work when Phase 5 commences. |
| **Missing Content-Security-Policy (CSP) in `next.config.mjs`** | Subagent A flagged the omission of CSP headers as a security gap. | [`next.config.mjs`](file:///d:/WebDev/report-submission/next.config.mjs) already configures 6 core security headers: HSTS (2 years), X-Frame-Options (DENY), nosniff, Referrer-Policy, DNS prefetch, and Permissions-Policy. | **DISCHARGED (PREMATURE OPTIMIZATION)**<br>In Next.js App Router with React Server Components, Turbopack chunks, inline font stylesheets, and Vercel Analytics/Speed Insights, an aggressive CSP easily causes hydration breakage or script blocks. The existing 6 headers satisfy pre-production standards; CSP should be calibrated in staging. |
| **RS-70 / KI-018: Plaintext Backup Workflow** | Automated database backup in `.github/workflows/backup.yml` dumps unencrypted `.sql` text. | Owner decision in ADR 022: Backup destination repo `Jabir-A-H/report-backups-private` is access-controlled and strictly private. | **DISCHARGED (SETTLED DESIGN / WONTFIX)**<br>GPG symmetric encryption adds key-management friction and CI secret failure modes with negligible threat-model reduction for a private internal destination. |

---

## 3. Database Migration & Security Risk Matrix

### 3.1 The PostgreSQL `DROP ... CASCADE` vs `RESTRICT` Dilemma
In PostgreSQL, `DROP TABLE ... CASCADE` or `DROP FUNCTION ... CASCADE` recursively cascades deletions through the `pg_depend` system catalog.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   DANGER: DROP FUNCTION ... CASCADE                    │
│                                                                        │
│   Developer types: DROP FUNCTION handle_new_user() CASCADE;            │
│                         │                                              │
│                         ▼                                              │
│   PostgreSQL pg_depend matches: Trigger on_auth_user_created           │
│                         │                                              │
│                         ▼ (SILENT DROP)                                │
│   Trigger on auth.users is PERMANENTLY DESTROYED!                      │
│   Consequence: 100% of new user registrations silently fail to         │
│   create people profiles!                                              │
└────────────────────────────────────────────────────────────────────────┘
```

**Adversarial Protocol for Safe Object Retirement**:
1. **Never use `CASCADE` on production or shared schemas**.
2. **Execute pre-drop dependency query**:
   ```sql
   SELECT 
     classid::regclass AS object_type, 
     objid::regclass AS dependent_object, 
     deptype 
   FROM pg_depend 
   WHERE refobjid = 'public.target_object'::regclass;
   ```
3. **Execute strict `RESTRICT` drop**:
   ```sql
   -- If any view, trigger, or foreign key depends on it, Postgres immediately halts
   DROP TABLE IF EXISTS public.target_table RESTRICT;
   DROP FUNCTION IF EXISTS public.target_function() RESTRICT;
   DROP VIEW IF EXISTS public.target_view RESTRICT;
   ```

---

### 3.2 The SQL Three-Valued Logic Flaw in `get_or_create_report`
Subagent A's proposed authorization guard inside `get_or_create_report` suffers from a classic SQL ternary boolean evaluation flaw:

```sql
-- SUBAGENT A'S DEFECTIVE PROPOSAL:
IF NOT (is_admin() OR p_zone_id = get_user_zone_id()) THEN
  RAISE EXCEPTION 'Unauthorized';
END IF;
```

**The Vulnerability Proof**:
1. An unapproved or newly registered user has `zone_id = NULL` in `public.people`.
2. The user executes: `supabase.rpc('get_or_create_report', { p_zone_id: 2, ... })`.
3. Inside the RPC:
   - `is_admin()` returns `false`.
   - `get_user_zone_id()` returns `NULL`.
   - `p_zone_id = get_user_zone_id()` $\rightarrow$ `2 = NULL` $\rightarrow$ `NULL`.
   - `false OR NULL` $\rightarrow$ `NULL`.
   - `NOT (NULL)` $\rightarrow$ `NULL`.
   - In PL/pgSQL: `IF NULL THEN` is evaluated as **FALSE**!
   - **The IF block is bypassed! The unauthorized caller creates the report!**
4. Furthermore, if `auth.uid()` is null (an anonymous unauthenticated caller), the same bypass occurs!

**The Adversarially Hardened & Null-Safe Guard**:
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
  v_caller_zone INT;
  v_is_adm BOOLEAN;
  v_is_city_zone BOOLEAN;
  v_course_cat TEXT;
  v_org_cat TEXT;
  v_personal_cat TEXT;
  v_meeting_cat TEXT;
  v_extra_cat TEXT;
BEGIN
  -- 1. Ensure authenticated session
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required' USING ERRCODE = '42501';
  END IF;

  v_is_adm := COALESCE(public.is_admin(), false);
  v_caller_zone := public.get_user_zone_id();

  -- 2. Strict null-safe authorization check
  IF NOT (v_is_adm OR (v_caller_zone IS NOT NULL AND v_caller_zone = p_zone_id)) THEN
    RAISE EXCEPTION 'Unauthorized: Caller cannot initialize reports for zone %', p_zone_id USING ERRCODE = '42501';
  END IF;

  -- 3. Dynamic hierarchical check (No hardcoded magic numbers like zone_id = 1)
  SELECT (zone_type = 'city') INTO v_is_city_zone
  FROM public.zone
  WHERE id = p_zone_id;

  IF COALESCE(v_is_city_zone, false) THEN
    RAISE EXCEPTION 'Invalid operation: City entity (%) does not submit reports', p_zone_id USING ERRCODE = '22023';
  END IF;

  -- 4. Check existing report
  SELECT id INTO v_report_id
  FROM public.report
  WHERE zone_id = p_zone_id
    AND year = p_year
    AND month = p_month
    AND report_type = p_report_type;

  IF v_report_id IS NOT NULL THEN
    RETURN v_report_id;
  END IF;

  -- 5. Insert root report row
  INSERT INTO public.report (zone_id, year, month, report_type)
  VALUES (p_zone_id, p_year, p_month, p_report_type)
  ON CONFLICT ON CONSTRAINT report_zone_month_year_type_unique DO NOTHING
  RETURNING id INTO v_report_id;

  -- 6. Seed child rows if inserted
  IF v_report_id IS NOT NULL THEN
    INSERT INTO public.report_header (
      report_id, responsible_name, thana, ward, total_muallima, 
      muallima_increase, muallima_decrease, certified_muallima, 
      certified_muallima_taking_classes, trained_muallima, 
      trained_muallima_taking_classes, total_unit, units_with_muallima
    ) VALUES (v_report_id, '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

    INSERT INTO public.report_comment (report_id, comment)
    VALUES (v_report_id, '');

    FOREACH v_course_cat IN ARRAY ARRAY[
      'বিশিষ্টদের', 'সাধারণদের', 'কর্মীদের', 'ইউনিট সভানেত্রী', 
      'অগ্রসরদের', 'রুকনদের অনুশীলনী ক্লাস', 'শিশু- তা''লিমুল কুরআন', 
      'নিরক্ষর- তা''লিমুস সলাত'
    ] LOOP
      INSERT INTO public.report_course (
        report_id, category, number, increase, decrease, sessions, 
        students, attendance, status_board, status_qayda, status_ampara, 
        status_quran, completed, correctly_learned
      ) VALUES (v_report_id, v_course_cat, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    END LOOP;

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

    FOREACH v_personal_cat IN ARRAY ARRAY['রুকন', 'কর্মী', 'সক্রিয় সহযোগী'] LOOP
      INSERT INTO public.report_personal (
        report_id, category, teaching, learning, olama_invited, 
        became_shohojogi, became_sokrio_shohojogi, became_kormi, became_rukon
      ) VALUES (v_report_id, v_personal_cat, 0, 0, 0, 0, 0, 0, 0);
    END LOOP;

    FOREACH v_meeting_cat IN ARRAY ARRAY[
      'কমিটি বৈঠক হয়েছে', 'মুয়াল্লিমাদের নিয়ে বৈঠক', 
      'Committee Orientation', 'Muallima Orientation', 'অন্যান্য'
    ] LOOP
      INSERT INTO public.report_meeting (
        report_id, category, city_count, city_avg_attendance, 
        thana_count, thana_avg_attendance, ward_count, 
        ward_avg_attendance, meeting_name, comments
      ) VALUES (v_report_id, v_meeting_cat, 0, 0, 0, 0, 0, 0, '', '');
    END LOOP;

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

---

### 3.3 The `city_report_override` PostgREST Upsert Trap
Subagent A proposed running:
```sql
ALTER TABLE public.city_report_override DROP CONSTRAINT city_report_override_unique_key;
ALTER TABLE public.city_report_override ADD CONSTRAINT city_report_override_period_unique_key 
  UNIQUE NULLS NOT DISTINCT (year, month, end_month, report_type, section, field, category);
```

**The PostgREST Collision Crash**:
In [`src/components/admin/correction-button.tsx:96-108`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L96-L108):
```typescript
const { error } = await supabase
  .from('city_report_override')
  .upsert({
    year,
    month: overrideMonth,
    section,
    field,
    category: category || null,
    value: valueToSave,
    report_type: reportType
  }, { onConflict: 'year,month,report_type,section,field,category' })
```
If PostgreSQL drops `city_report_override_unique_key`, PostgREST's query engine rejects the request with HTTP 400 (`ON CONFLICT specification does not match any unique constraint or exclusion constraint`).
**Required Co-Migration**:
The application component `CorrectionButton` MUST be updated simultaneously to pass `end_month: endMonth || 0` and update `onConflict` to `'year,month,end_month,report_type,section,field,category'`.

---

## 4. Cross-Segment Blast Radius Analysis

Modifications in Segment 07 directly affect the operational stability of all other segments:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEGMENT 07 INFRASTRUCTURE BLAST RADIUS               │
├─────────────────┬──────────────────────────────────────────────────────┤
│ Target Segment  │ Blast Radius & Failure Mode if Uncoordinated         │
├─────────────────┼──────────────────────────────────────────────────────┤
│ Seg 01 (Agg)    │ Changing city_report_override constraint without     │
│                 │ updating CorrectionButton breaks override upserts.   │
│                 │ Updating views without security_invoker = true leaks │
│                 │ unaggregated draft rows across zone boundaries.      │
├─────────────────┼──────────────────────────────────────────────────────┤
│ Seg 02 (Save)   │ Revoking EXECUTE from authenticated on is_admin() or │
│                 │ get_user_zone_id() immediately crashes updateField   │
│                 │ .select('id') verification with 42501 permission     │
│                 │ denied on every auto-save keystroke!                 │
├─────────────────┼──────────────────────────────────────────────────────┤
│ Seg 03 (Input)  │ Adding 7 CHECK (col >= 0) constraints will cause DB  │
│                 │ write rejections if client numeral converters ever   │
│                 │ produce negative values or invalid ASCII minuses.    │
├─────────────────┼──────────────────────────────────────────────────────┤
│ Seg 04 (Auth)   │ Modifying public.handle_new_user() without testing   │
│                 │ auth.users trigger causes OAuth and email signups    │
│                 │ to hang or fail silently. Modifying server.ts        │
│                 │ cookie handling breaks session persistence.          │
├─────────────────┼──────────────────────────────────────────────────────┤
│ Seg 05 (Routing)│ Hardening get_or_create_report with caller checks    │
│                 │ will crash /report?reportId=... if an admin cannot   │
│                 │ initialize reports for managed zones, or if a worker │
│                 │ URL defaults to an unassigned zone.                  │
├─────────────────┼──────────────────────────────────────────────────────┤
│ Seg 06 (UI/PDF) │ Font tracing outputFileTracingIncludes kalpurush.ttf │
│                 │ in next.config.mjs is essential; missing it crashes  │
│                 │ PDF export with ENOENT on Vercel Serverless.         │
└─────────────────┴──────────────────────────────────────────────────────┘
```

---

## 5. Final Hardened Pre-Production Action Plan

The following ordered, two-stage plan defines the exact implementation steps required to achieve 100% database integrity and security hardening without collateral damage:

### Stage 1: Atomic Database DDL Migration (Execute via Supabase SQL)

```sql
-- =========================================================================
-- STAGE 1: PRE-PRODUCTION SCHEMA HARDENING & DDL UPGRADE
-- =========================================================================

BEGIN;

-- 1. Numeric Metric Integrity: Add 7 CHECK constraints (Safe: 0 existing rows violate)
ALTER TABLE public.report_header 
  ADD CONSTRAINT check_certified_muallima_taking_classes_positive CHECK (certified_muallima_taking_classes >= 0),
  ADD CONSTRAINT check_trained_muallima_taking_classes_positive CHECK (trained_muallima_taking_classes >= 0),
  ADD CONSTRAINT check_ward_positive CHECK (ward >= 0);

ALTER TABLE public.report_course
  ADD CONSTRAINT check_course_status_board_positive CHECK (status_board >= 0),
  ADD CONSTRAINT check_course_status_qayda_positive CHECK (status_qayda >= 0),
  ADD CONSTRAINT check_course_status_ampara_positive CHECK (status_ampara >= 0),
  ADD CONSTRAINT check_course_status_quran_positive CHECK (status_quran >= 0);

-- 2. Override Unique Constraint Migration
-- Keep old constraint until application layer is ready, OR add new unique constraint first:
ALTER TABLE public.city_report_override 
  ADD CONSTRAINT city_report_override_period_unique_key 
  UNIQUE NULLS NOT DISTINCT (year, month, end_month, report_type, section, field, category);

-- 3. Upgrade all 6 view_city_*_agg views with hierarchical filtering & security_invoker = true
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

CREATE OR REPLACE VIEW public.view_city_course_agg WITH (security_invoker = true) AS
SELECT 
  r.year,
  r.month,
  r.report_type,
  rc.category,
  sum(rc.number) AS number,
  sum(rc.increase) AS increase,
  sum(rc.decrease) AS decrease,
  sum(rc.sessions) AS sessions,
  sum(rc.students) AS students,
  sum(rc.attendance) AS attendance,
  sum(rc.status_board) AS status_board,
  sum(rc.status_qayda) AS status_qayda,
  sum(rc.status_ampara) AS status_ampara,
  sum(rc.status_quran) AS status_quran,
  sum(rc.completed) AS completed,
  sum(rc.correctly_learned) AS correctly_learned
FROM report r
JOIN report_course rc ON r.id = rc.report_id
JOIN zone z ON r.zone_id = z.id
WHERE z.zone_type != 'city'
GROUP BY r.year, r.month, r.report_type, rc.category;

CREATE OR REPLACE VIEW public.view_city_organizational_agg WITH (security_invoker = true) AS
SELECT 
  r.year,
  r.month,
  r.report_type,
  ro.category,
  sum(ro.number) AS number,
  sum(ro.increase) AS increase,
  sum(ro.amount) AS amount
FROM report r
JOIN report_organizational ro ON r.id = ro.report_id
JOIN zone z ON r.zone_id = z.id
WHERE z.zone_type != 'city'
GROUP BY r.year, r.month, r.report_type, ro.category;

CREATE OR REPLACE VIEW public.view_city_personal_agg WITH (security_invoker = true) AS
SELECT 
  r.year,
  r.month,
  r.report_type,
  rp.category,
  sum(rp.teaching) AS teaching,
  sum(rp.learning) AS learning,
  sum(rp.olama_invited) AS olama_invited,
  sum(rp.became_shohojogi) AS became_shohojogi,
  sum(rp.became_sokrio_shohojogi) AS became_sokrio_shohojogi,
  sum(rp.became_kormi) AS became_kormi,
  sum(rp.became_rukon) AS became_rukon
FROM report r
JOIN report_personal rp ON r.id = rp.report_id
JOIN zone z ON r.zone_id = z.id
WHERE z.zone_type != 'city'
GROUP BY r.year, r.month, r.report_type, rp.category;

CREATE OR REPLACE VIEW public.view_city_meeting_agg WITH (security_invoker = true) AS
SELECT 
  r.year,
  r.month,
  r.report_type,
  rm.category,
  sum(rm.city_count) AS city_count,
  sum(rm.city_avg_attendance) AS city_avg_attendance,
  sum(rm.thana_count) AS thana_count,
  sum(rm.thana_avg_attendance) AS thana_avg_attendance,
  sum(rm.ward_count) AS ward_count,
  sum(rm.ward_avg_attendance) AS ward_avg_attendance
FROM report r
JOIN report_meeting rm ON r.id = rm.report_id
JOIN zone z ON r.zone_id = z.id
WHERE z.zone_type != 'city'
GROUP BY r.year, r.month, r.report_type, rm.category;

CREATE OR REPLACE VIEW public.view_city_extra_agg WITH (security_invoker = true) AS
SELECT 
  r.year,
  r.month,
  r.report_type,
  re.category,
  sum(re.number) AS number
FROM report r
JOIN report_extra re ON r.id = re.report_id
JOIN zone z ON r.zone_id = z.id
WHERE z.zone_type != 'city'
GROUP BY r.year, r.month, r.report_type, re.category;

COMMIT;
```

---

### Stage 2: Application Code Synchronization (Implementation Phase)

1. **Modernize Cookie Handler** in [`src/utils/supabase/server.ts`](file:///d:/WebDev/report-submission/src/utils/supabase/server.ts):
   - Replace `get`/`set`/`remove` with `getAll()` and `setAll(cookiesToSet)`.
   - Ensure `setAll` wraps `cookieStore.set` inside `try { ... } catch { /* ignore in Server Components */ }`.
2. **Update Override Upsert Contract** in [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx):
   - Pass `end_month: endMonth || 0` in payload.
   - Update `onConflict: 'year,month,end_month,report_type,section,field,category'`.
   - Update `handleDelete` query to include `end_month`.
   - Drop old constraint `city_report_override_unique_key` via DDL only after this code change lands.
3. **Idempotency Safeguard for Backups** in [`.github/workflows/backup.yml`](file:///d:/WebDev/report-submission/.github/workflows/backup.yml):
   - Change `git commit -m ...` to `git diff --staged --quiet || git commit -m "Automated backup for $(date +%Y-%m-%d)"`.
   - Prevents workflow crashes when manually triggered or when database dump is unchanged.

# Pre-Production Architectural Re-Evaluation & Adversarial Critique Summary

**Repository**: `Jabir-A-H/report-submission` (`Talimul Quran Report Submission`)  
**Audit Scope**: Complete documentation suite (`docs/report-submission-issue-register.md` [RS-01 through RS-74], `docs/KNOWN_ISSUES.md`, `docs/ROADMAP.md`, `docs/pre-production-schema-cleanup-backlog.md`, `docs/TECHNICAL_MANUAL.md`).  
**Audit Architecture**: 15 Autonomous Agents (1 Master Prompt Architect + 7 Lead Investigators + 7 Adversarial Reviewers).  
**Evaluation Standard**: Pre-Production Agility (`AGENTS.md` Rule 7), Adversarial Doubt Gate (`AGENTS.md` Rules 2 & 6), Impeccable Design Standards, 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`).  
**Execution Standard**: Critique Only — Zero Source Code Modifications in `src/`.  
**Date**: 2026-11-15  

---

## 1. Executive Synthesis & Operating Posture

The entire documentation suite of reported issues was historically drafted under the implicit assumption of a **live, multi-tenant production system**. This led to:
1. **Application-Layer Shims & Polyfills**: Writing fragile in-memory joins (`monthMap`), redundant query loops, defensive fallback catch blocks (e.g. `42703` column catches), and composite URL serializers instead of executing clean database DDL.
2. **False Assumptions & Bloatware**: Inventing complex in-app password reset modals, client-side numeric warning heuristics, and multi-layer section badges that violate clean design and domain invariants.
3. **Hidden Real-World Field Hazards**: Underestimating Bangladeshi mobile reality—specifically Carrier-Grade NAT (CGNAT) gateway throttling locking out field workers, non-ASCII Arabic/Indic comma truncations (`"১،৫০,০০০"` $\rightarrow$ `1`), and soft-keyboard unmount timing races.

Under **`AGENTS.md` Rule 7 (Pre-Production Agility & Zero Dead-Weight)**, because the platform is in active pre-production development with zero live external dependencies, we have **authoritative DDL agility**. We do not need to preserve legacy fallbacks.

---

## 2. Master Issue Register Re-Evaluation Scorecard

The following table synthesizes the findings of all 7 segments, categorizing every documented issue:

| Issue ID | Documented Topic | Segment | Pre-Production Status | Adversarial Determination & Architectural Ruling |
|:---|:---|:---:|:---:|:---|
| **RS-01** | Overrides on non-monthly city views under wrong month key | Seg 01 | **PARTIAL DEFECT** | Fixed for fixed quarters via start month; broken for custom ranges. Requires exact-match period query. |
| **RS-02** | Empty override value silently becomes 0 | Seg 01 | **DISCHARGED FALSE POSITIVE** | Numeric inputs reject `""` with explicit Bengali error; comment keys never touch numeric sums. |
| **RS-03 / KI-005** | Multi-month header snapshot picks arbitrary row | Seg 01 | **TRUE DEFECT (ACTIVE ON /report)** | `/report/page.tsx` bypassed `loadReportDataBundle()` and sorts rows by `0 - 0 = 0`. Consolidate loader. |
| **RS-04** | City snapshot uses latest month's partial data without indicator | Seg 01 | **TRUE ARCHITECTURAL DEFECT** | If Month 3 has 1 zone reporting, city stock collapses 93% with zero warning. Requires coverage badge. |
| **RS-05** | View `view_city_course_final` dropped; manual joins in code | Seg 01 | **CLEAN ARCHITECTURE** | Dropping obsolete view was correct. Loader consolidates queries cleanly. |
| **RS-06** | Comments cannot be overridden for city report | Seg 01 | **CONFIRMED RESOLVED** | `isText={true}` support in `CorrectionButton` fully operational. |
| **RS-07** | Reasonableness bounds on numeric inputs | Seg 01 | **CONFIRMED WONTFIX (ADR 022)** | Arbitrary client bounds rejected. PostgreSQL `CHECK (col >= 0)` provides true data integrity. |
| **RS-10** | Non-monthly reports created via URL tampering | Seg 05 | **CRITICAL LEAKY GUARD** | `user-dashboard.tsx` still passes URL `type` to RPC. Live DB has row 37 with `'Monthly'`. Add DB CHECK. |
| **RS-14** | Admin dashboard zone-scoping unreachable branch | Seg 07 | **DORMANT HOOK (ADR 022)** | Reserved for Phase 5 hierarchical sub-admin purview. Harmless, keep as-is. |
| **RS-20 / KI-008** | Per-field save error tracking | Seg 02 | **CRITICAL CROSS-REPORT BUG** | `failedFields` is not scoped by `reportId`. Retrying errors in Month 7 clobbers Month 6 data into Month 7! |
| **RS-21** | `.select('id')` save check vs RLS evaluation | Seg 02 | **DISCHARGED FALSE POSITIVE** | RLS policies are symmetric. Verified clean in live database. |
| **RS-22** | Empty form blank shield on network drop | Seg 02 | **CONFIRMED RESOLVED** | Loading gate and Bengali error card prevent blank rendering. |
| **RS-23 / C03-01** | Keystroke focus loss & remounts on mobile | Seg 02 | **CONFIRMED RESOLVED (Track 3)** | Decoupled refs prevent keyboard collapse. |
| **RS-24** | Functional Retry All queue | Seg 02 | **TRUE CONCURRENCY HAZARD** | Retrying static snapshot while user edits field causes stale writes. |
| **RS-25 / KI-009** | Unmount dirty flush & mobile task-kill | Seg 02 | **SUBSTANTIALLY HARDENED** | Section navigation 100% safe; mobile task-kill requires `fetch` `keepalive: true`. |
| **RS-26** | PostgREST chaining order | Seg 02 | **DISCHARGED FALSE POSITIVE** | Chaining order does not alter SQL AST. |
| **RS-27 / Backlog 4** | NFD vs NFC Unicode mismatch in `report_extra` | Seg 01 | **CRITICAL ACTIVE DEFECT** | 48 DB rows and RPC seed NFD bytes; TypeScript uses NFC. 100% save failures in Section 6! |
| **RS-30** | Bengali numeral flipping & keystroke clobber | Seg 03 | **CONFIRMED RESOLVED** | Active typing shield operational; empty placeholder in card mode is intentional UX. |
| **RS-31** | Admin override input parity | Seg 03 | **CONFIRMED RESOLVED** | `CorrectionButton` uses `inputMode="numeric"`, `toBn`, and comma stripping. |
| **RS-32** | Non-digit sanitization & data inflation | Seg 03 | **CRITICAL BANGALORE SEPARATOR BUG** | Arabic commas (`\u060C`) truncate numbers (`"১،৫০,০০০"` $\rightarrow$ `1`). `toFiniteNumber` wipes comma numbers to 0. |
| **RS-33** | Average attendance field decimals | Seg 03 | **CONFIRMED WONTFIX (ADR 022)** | Deliberate domain invariant. Discrete human beings; DB enforces `INTEGER`. |
| **RS-34** | `enterKeyHint="next"` on mobile inputs | Seg 03 | **CONFIRMED RESOLVED (DOC DRIFT)** | Already live across all 3 modes in `auto-save-field.tsx`. |
| **RS-40 / RS-41** | Email verification & admin password reset | Seg 04 | **CONFIRMED WONTFIX (ADR 022)** | Password resets strictly email-bound. Admins delete broken unapproved profiles for clean re-registration. |
| **RS-42** | Login input normalization & case insensitivity | Seg 04 | **PARTIAL DEFECT** | Email not lowercased in `login()`; DB index `people_user_id_key` lacks `lower(user_id)`. |
| **RS-43** | Registration dropdown offers city / DCS entity | Seg 04 | **CRITICAL DB TRIGGER LEAK** | Web UI excludes Zone 1, but trigger `handle_new_user()` defaults OAuth users to Zone 1! |
| **RS-44 / KI-023** | Public availability check CGNAT lockout | Seg 04 | **CRITICAL INVERTED FAILURE UX** | Throttling returns `available: false`, marking field `taken` and blocking signup. Must fail-open (`unverified`). |
| **RS-45 / C05-04** | Privilege escalation & self-deletion in RLS | Seg 04 | **CRITICAL RLS BYPASS** | `people_update_admin` / `people_delete_admin` allow any admin to delete superadmins via PostgREST. |
| **RS-46** | `/home?message=` phishing & raw string leak | Seg 04 | **PARTIAL LEAK ON RECOVERY** | `/home` sanitized; `/forgot-password` and `/update-password` leak raw strings. Wrap in `sanitizeAuthMessage()`. |
| **RS-47** | Forgot password identical success messaging | Seg 04 | **CONFIRMED RESOLVED** | Clear guidance, spam folder notice, 2/hr limit warning. |
| **RS-48** | Supabase cookie loss on middleware redirects | Seg 04, 05 | **CRITICAL RUNTIME PROOF** | `NextResponse.redirect()` creates detached response, dropping refreshed auth cookies. Session thrashing. |
| **RS-50** | Asia/Dhaka timezone parity (UTC+6) | Seg 03 | **CONFIRMED RESOLVED (NEEDS HARDENING)** | Parity works. Replace per-call `Intl` instantiation with singleton + mathematical UTC+6 fallback. |
| **RS-51** | `<html lang>` FOIC & hydration | Seg 03 | **CONFIRMED RESOLVED (Reloads)** | Reload FOIC eliminated. Language toggle needs `router.refresh()` for Server Components. |
| **RS-52** | Hardcoded Bengali strings on admin dashboard | Seg 03 | **CONFIRMED DEFECT** | English mode broken in `(admin)/dashboard` (hardcoded `BN_MONTHS`, unconditional `toBn()`, hardcoded `"টি"`). |
| **RS-60** | Period/report state fragile across 3 pages | Seg 05 | **ARCHITECTURAL DEBT** | Composite period params discard `repId`. Replace with canonical `/report/[section]?reportId=42`. |
| **RS-62 / RS-63** | Section completion badges & in-app tours | Seg 06 | **DISCHARGED BLOATWARE (ADR 022)** | Intrusive UI rejected. Clean dashboard cards and text-first `/help` are authoritative. |
| **RS-65** | Help manual integrity | Seg 06 | **MINOR DOC DRIFT** | Cites `"সাইন আপ করুন"` instead of `"নিবন্ধন করুন"`. Trivial sync. |
| **RS-66** | Form accessibility & accessible label binding | Seg 06 | **CONFIRMED DEFECT IN SECTIONS** | Auth forms compliant; all 7 section forms lack `id` and `<label htmlFor>` bindings. |
| **RS-67** | Quadruplicate client auth network flooding | Seg 05 | **CONFIRMED ARCHITECTURAL DEFECT** | `Navbar`, `BottomNav`, and `UserDropdown` make 6 redundant queries per page mount. Wrap in `<UserProvider>`. |
| **RS-70 / KI-018** | Backups are unencrypted plaintext dumps | Seg 07 | **CONFIRMED WONTFIX (ADR 022)** | Private access-controlled repository. GPG encryption rejected per owner decision. |
| **RS-71** | CI runs tests, lint, and typecheck | Seg 07 | **CONFIRMED RESOLVED** | GitHub Actions `ci.yml` enforces all 4 quality gates on push/PR. |
| **RS-72** | HTTP security headers configured | Seg 07 | **CONFIRMED RESOLVED (CSP PENDING)** | 6 standard security headers active in `next.config.mjs`. Baseline CSP recommended. |
| **RS-73** | DB-side fixes verification | Seg 07 | **VERIFIED VIA SUPABASE MCP** | Live schema catalog inspection confirmed all DB constraints, views, and functions. |
| **RS-74** | SessionCleaner retention | Seg 05 | **CONFIRMED BLOATWARE** | Quarantined in `.discard/`. 0 occurrences in `src/`. Ready for permanent removal. |
| **C04-02 / C04-04** | Live computed row totals in PersonalForm | Seg 06 | **CONFIRMED ERGONOMIC NEED** | Add computed `মোট` column in table mode, but compute from `data.personal` on blur/save to avoid re-renders. |
| **C06-01** | PDF 2-page print guarantee | Seg 06 | **CRITICAL LINE-BREAK VULNERABILITY** | Character limits fail when 15 newlines (`\n`) force Page 3. Enforce 3-layer guard (chars, newlines, clamp). |
| **KI-006** | Course attendance averaging | Seg 01 | **DISCHARGED FALSE POSITIVE** | Course metric is labeled `উপস্থিতি` (count), not average. SQL view correctly executes `sum()`. |
| **KI-010** | `security_invoker = true` on city views | Seg 07 | **CONFIRMED RESOLVED** | All 6 SQL aggregation views verified with `security_invoker = true`. |
| **KI-011** | Metric `CHECK (col >= 0)` constraints | Seg 07 | **PARTIAL DDL DEFECT** | 32 constraints active; 7 numeric metric columns in `report_header` & `report_course` lack checks. |
| **KI-021** | Period override unique key & custom ranges | Seg 01, 07 | **CRITICAL DB & QUERY DEFECT** | Unique index `city_report_override_unique_key` lacks `end_month`, and query loader uses loose `.in("month")`. |

---

## 3. The Top 10 High-Impact Adversarial Findings

1. **`failedFields` Cross-Report Data Corruption (Segment 02)**:
   In `report-context.tsx`, `failedFields` is a flat object not keyed by `reportId` and never wiped on report change. If a field worker experiences a network failure in June 2026, navigates to July 2026, and taps "Retry All", June's failed numbers are **destructively written into July's report**!
   - *Fix*: Key `failedFields` by `${reportId}:${table}:${category || ''}:${name}` and clear/filter on `loadReport()`.

2. **Bangladeshi Mobile Keyboard Separator Truncation (Segment 03)**:
   Android phones in Bangladesh with Arabic or Islamic keyboard layouts insert Arabic commas `،` (`U+060C`) or thousand separators `٬` (`U+066C`). In `AutoSaveField`, `replace(/[,\s]/g, "")` only strips ASCII `,`. JavaScript's `parseFloat("1،50،000")` parses `"1"` and **aborts at `،`**, silently saving `1` instead of `150,000` (a 150,000x headcount error)! Furthermore, `toFiniteNumber("1,50,000")` evaluates to `0` because it does not strip commas before `Number()`.
   - *Fix*: Centralize in `parseBangladeshiNumber()` stripping all Unicode separators (`[,،٬，_\s\u00A0\u202F]`) and colloquial counting words (`জন`, `টি`).

3. **Carrier-Grade NAT (CGNAT) Inverted Failure UX (Segment 04)**:
   Mobile carriers in Bangladesh share public IPs across entire districts. The 10 req/min rate limit on `/home/actions.ts:checkEmailAvailability` trips rapidly. When throttled, it returns `{ available: false }`. The client form treats this as "username/email taken" and blocks registration! Subagent A's compound key `${ip}:${email}` was proven flawed by Subagent B because attackers testing distinct emails bypass compound limiters.
   - *Fix*: Decouple throttling from validation: fail-open with status `'unverified'`, raise ceiling to 60 req/min, and let PostgreSQL atomic unique constraints handle final validation on submission.

4. **Open PostgreSQL RLS Privilege Escalation (Segment 04)**:
   PostgreSQL policy `people_update_admin` has `qual: is_admin()` with no `with_check` restrictions. Any standard admin can issue a direct PostgREST `PATCH /rest/v1/people` to promote themselves or others to `'superadmin'`. Furthermore, `people_delete_admin` allows any admin to delete superadmins via PostgREST.
   - *Fix*: Staged migration: move all admin user mutations in `management/page.tsx` to Server Actions using the admin client, then tighten or drop direct table write policies on `people`.

5. **Google OAuth Zone 1 Contamination Trap (Segment 04)**:
   Database trigger `handle_new_user()` defaults OAuth signups to `zone_id = 1` (DCS entity). However, `people.zone_id` has a `NOT NULL` constraint in PostgreSQL. Setting `zone_id = NULL` in the trigger without altering table DDL will crash OAuth signups with PostgreSQL error `23502`.
   - *Fix*: Execute `ALTER TABLE public.people ALTER COLUMN zone_id DROP NOT NULL;` first, update trigger to set `zone_id = NULL`, and add UI guards in `/management` to prevent activating users without a zone.

6. **Unchecked Submission Gate during In-Flight Flushes (Segment 02)**:
   In `comments-form.tsx`, checking "রিপোর্ট সাবমিশন সম্পন্ন হয়েছে" has ZERO check on `isSaving` (`pendingSavesCount > 0`) or `failedFields`. If a worker leaves an input and immediately checks submit while a 3G request is in flight, `is_submitted = true` commits first; if the field save drops, the report is finalized with missing data.
   - *Fix*: Disable the submission checkbox whenever `isSaving === true` or `Object.keys(failedFields).length > 0`.

7. **PDF 2-Page Print Guarantee: The Line-Break Trap (Segment 06)**:
   A character limit of 1500 does NOT guarantee 2 pages. In `@react-pdf/renderer`, 15 manual newlines (`\n`) take up 190 pt with only 400 characters, pushing the signature block onto Page 3 and ruining official double-sided printouts.
   - *Fix*: 3-layer guard: client validation (`maxLength={1200}` + max 10 line-breaks), PostgreSQL CHECK constraint, and `@react-pdf/renderer` `<Text numberOfLines={17}>` clamp.

8. **Middleware Cookie Dropping on Redirects (Segment 04, 05)**:
   In `middleware.ts`, `NextResponse.redirect(url)` creates a fresh, detached response object. Refreshed session tokens set by `@supabase/ssr` `setAll` into `supabaseResponse` are discarded, causing token revocation and random logouts on mobile.
   - *Fix*: Implement `redirectWithCookies(request, url, supabaseResponse)` copying all cookie headers across every redirect.

9. **Unicode NFD/NFC Silent Wipeout in `report_extra` (Segment 01)**:
   PostgreSQL table `report_extra` has 48 rows stored in decomposed NFD (`e0a6afe0a6bc`), and RPC `get_or_create_report` seeds NFD bytes. TypeScript code uses composed NFC (`e0a79f`). Form updates match 0 rows in PostgreSQL, leaving 100% of Section 6 data displayed as 0!
   - *Fix*: Run SQL migration normalizing all strings in `report_extra` to NFC, update the RPC seed strings, and wrap client keys in `.normalize('NFC')`.

10. **Mobile Viewport Clearance & Bottom Nav Clipping (Segment 06)**:
    `BottomNav` (64px) + fixed stepper bar (76px) block 140px. `SectionLayout` only has `pb-24` (96px). On a standard 360px mobile viewport, 44px of the form bottom is clipped behind the nav bars.
    - *Fix*: Update `SectionLayout` padding to `pb-40 md:pb-24`.

---

## 4. Master Pre-Production DDL Migration Script

Under `AGENTS.md` Rule 7, the following clean DDL script addresses all database-layer defects atomically without application-layer workarounds:

```sql
-- ==============================================================================
-- TALIMUL QURAN REPORT SUBMISSION: PRE-PRODUCTION MASTER DDL MIGRATION
-- Atomic execution for Supabase PostgreSQL (Region: ap-southeast-2)
-- ==============================================================================

BEGIN;

-- 1. Unicode NFC Normalization for report_extra & Seed RPC
UPDATE public.report_extra
SET category = normalize(category, NFC)
WHERE category <> normalize(category, NFC);

-- 2. Report Type Invariant & Row Cleanup
UPDATE public.report
SET report_type = 'মাসিক'
WHERE report_type = 'Monthly' OR report_type IS NULL;

ALTER TABLE public.report
DROP CONSTRAINT IF EXISTS report_type_check;

ALTER TABLE public.report
ADD CONSTRAINT report_type_check CHECK (report_type = 'মাসিক');

-- 3. Metric Non-Negative Constraints (CHECK >= 0)
ALTER TABLE public.report_header
ADD CONSTRAINT check_header_total_members_nonneg CHECK (total_members >= 0),
ADD CONSTRAINT check_header_total_muallima_nonneg CHECK (total_muallima >= 0),
ADD CONSTRAINT check_header_total_unit_nonneg CHECK (total_unit >= 0);

ALTER TABLE public.report_course
ADD CONSTRAINT check_course_total_unit_nonneg CHECK (total_unit >= 0),
ADD CONSTRAINT check_course_running_unit_nonneg CHECK (running_unit >= 0),
ADD CONSTRAINT check_course_attendance_nonneg CHECK (attendance >= 0),
ADD CONSTRAINT check_course_candidate_nonneg CHECK (candidate >= 0);

-- 4. PDF 2-Page Print Budget Comment Constraint
ALTER TABLE public.report_comment
DROP CONSTRAINT IF EXISTS check_comment_char_length;

ALTER TABLE public.report_comment
ADD CONSTRAINT check_comment_char_length CHECK (char_length(comment) <= 1500);

-- 5. Case-Insensitive Unique Indexes for User Identity
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_lower_user_id 
ON public.people (lower(user_id));

CREATE UNIQUE INDEX IF NOT EXISTS idx_people_lower_email 
ON public.people (lower(email));

-- 6. Google OAuth Nullable Zone & Trigger Update
ALTER TABLE public.people 
ALTER COLUMN zone_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.people (
    supabase_uid,
    name,
    email,
    user_id,
    zone_id,
    role,
    active
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'নতুন ব্যবহারকারী'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_id', split_part(NEW.email, '@', 1)),
    NULLIF(CAST(NEW.raw_user_meta_data->>'zone_id' AS INTEGER), 1), -- Never assign Zone 1
    'user',
    false
  );
  RETURN NEW;
END;
$$;

-- 7. Multi-Month Period Override Constraints
-- Drop legacy 6-column unique index that omitted end_month
ALTER TABLE public.city_report_override
DROP CONSTRAINT IF EXISTS city_report_override_unique_key;

-- Ensure end_month defaults to 0 for single-month overrides
ALTER TABLE public.city_report_override
ALTER COLUMN end_month SET DEFAULT 0;

-- Apply comprehensive 7-column unique constraint
ALTER TABLE public.city_report_override
DROP CONSTRAINT IF EXISTS city_report_override_period_unique_key;

ALTER TABLE public.city_report_override
ADD CONSTRAINT city_report_override_period_unique_key 
UNIQUE (zone_id, month, end_month, report_type, section, field, category);

-- 8. Zone Hierarchy Clean-up & Views NULL Safety
UPDATE public.zone
SET parent_id = 1
WHERE id <> 1 AND parent_id IS NULL;

-- Recreate SQL views with strict security_invoker and NULL-safe zone_type filtering
CREATE OR REPLACE VIEW public.view_city_header_agg WITH (security_invoker = true) AS
SELECT r.year, r.month, r.report_type,
       sum(h.total_members) AS total_members,
       sum(h.total_muallima) AS total_muallima,
       sum(h.total_unit) AS total_unit,
       sum(h.certified_muallima) AS certified_muallima,
       count(DISTINCT r.zone_id) AS reporting_zones_count
FROM report r
JOIN report_header h ON h.report_id = r.id
JOIN zone z ON z.id = r.zone_id
WHERE (z.zone_type IS DISTINCT FROM 'city')
GROUP BY r.year, r.month, r.report_type;

CREATE OR REPLACE VIEW public.view_city_course_agg WITH (security_invoker = true) AS
SELECT r.year, r.month, r.report_type, rc.course_name,
       sum(rc.total_unit) AS total_unit,
       sum(rc.running_unit) AS running_unit,
       sum(rc.attendance) AS attendance,
       sum(rc.candidate) AS candidate
FROM report r
JOIN report_course rc ON rc.report_id = r.id
JOIN zone z ON z.id = r.zone_id
WHERE (z.zone_type IS DISTINCT FROM 'city')
GROUP BY r.year, r.month, r.report_type, rc.course_name;

CREATE OR REPLACE VIEW public.view_city_organizational_agg WITH (security_invoker = true) AS
SELECT r.year, r.month, r.report_type, ro.category,
       sum(ro.target) AS target,
       sum(ro.regular_meeting) AS regular_meeting,
       sum(ro.monthly_meeting) AS monthly_meeting
FROM report r
JOIN report_organizational ro ON ro.report_id = r.id
JOIN zone z ON z.id = r.zone_id
WHERE (z.zone_type IS DISTINCT FROM 'city')
GROUP BY r.year, r.month, r.report_type, ro.category;

CREATE OR REPLACE VIEW public.view_city_personal_agg WITH (security_invoker = true) AS
SELECT r.year, r.month, r.report_type, rp.category,
       sum(rp.learning_total) AS learning_total,
       sum(rp.memorization_total) AS memorization_total
FROM report r
JOIN report_personal rp ON rp.report_id = r.id
JOIN zone z ON z.id = r.zone_id
WHERE (z.zone_type IS DISTINCT FROM 'city')
GROUP BY r.year, r.month, r.report_type, rp.category;

CREATE OR REPLACE VIEW public.view_city_meeting_agg WITH (security_invoker = true) AS
SELECT r.year, r.month, r.report_type, rm.meeting_type,
       sum(rm.total_unit) AS total_unit,
       sum(rm.total_attendance) AS total_attendance,
       CASE 
         WHEN sum(rm.total_unit) > 0 THEN round(sum(rm.total_attendance)::numeric / sum(rm.total_unit)::numeric)
         ELSE 0 
       END AS city_avg_attendance
FROM report r
JOIN report_meeting rm ON rm.report_id = r.id
JOIN zone z ON z.id = r.zone_id
WHERE (z.zone_type IS DISTINCT FROM 'city')
GROUP BY r.year, r.month, r.report_type, rm.meeting_type;

CREATE OR REPLACE VIEW public.view_city_extra_agg WITH (security_invoker = true) AS
SELECT r.year, r.month, r.report_type, rx.category,
       sum(rx.extra_val) AS extra_val
FROM report r
JOIN report_extra rx ON rx.report_id = r.id
JOIN zone z ON z.id = r.zone_id
WHERE (z.zone_type IS DISTINCT FROM 'city')
GROUP BY r.year, r.month, r.report_type, rx.category;

COMMIT;
```

---

## 5. Prioritized Implementation Tracks

Following our standard multi-agent implementation workflow, the remaining technical debt is structured into four sequential, independent tracks:

### Track 1: Database DDL, RLS Hardening & Storage Hygiene
- **Goal**: Execute the atomic DDL script above in Supabase PostgreSQL; resolve NFC/NFD mismatch; apply non-negative and report-type constraints; drop orphan constraint; update views to `IS DISTINCT FROM 'city'`.
- **Files touched**: Supabase PostgreSQL live instance via Supabase MCP tool; `src/utils/supabase/server.ts` (modern `getAll`/`setAll` with Server Component `try...catch`).

### Track 2: Core Save Machine, Concurrency & Numeral Normalization
- **Goal**: Eliminate `failedFields` cross-report contamination; disable submission checkbox while saving or failed; implement `parseBangladeshiNumber()` in `report-utils.ts` to defend against Arabic commas and voice typing; update `toFiniteNumber()` to prevent comma zero-wiping; add keepalive to unmount fetch.
- **Files touched**: [`src/components/report/report-context.tsx`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx), [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts), [`src/components/report/auto-save-field.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx), [`src/components/report/sections/comments-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx).

### Track 3: Auth Security, Middleware Cookie Forwarding & Server Actions
- **Goal**: Fix cookie dropping in `middleware.ts` redirects (`redirectWithCookies`); fix CGNAT lockout by decoupling throttling from validation (`status: 'unverified'`); lowercase login email; migrate direct client `people` updates in `management/page.tsx` to Server Actions (`toggleUserActiveAction`, `changeUserZoneAction`); wrap `/forgot-password` and `/update-password` messages in `sanitizeAuthMessage()`.
- **Files touched**: [`middleware.ts`](file:///d:/WebDev/report-submission/middleware.ts), [`src/app/home/actions.ts`](file:///d:/WebDev/report-submission/src/app/home/actions.ts), [`src/components/auth/register-form-client.tsx`](file:///d:/WebDev/report-submission/src/components/auth/register-form-client.tsx), [`src/app/(admin)/management/actions.ts`](file:///d:/WebDev/report-submission/src/app/(admin)/management/actions.ts), [`src/app/(admin)/management/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx), [`src/app/forgot-password/page.tsx`](file:///d:/WebDev/report-submission/src/app/forgot-password/page.tsx), [`src/app/update-password/page.tsx`](file:///d:/WebDev/report-submission/src/app/update-password/page.tsx).

### Track 4: Canonical Navigation, Viewport Ergonomics & PDF Line Budget
- **Goal**: Cut over sub-section navigation to canonical `?reportId=42`; introduce memoized `<UserProvider>` eliminating quadruplicate auth queries across `Navbar`, `BottomNav`, and `UserDropdown`; fix mobile bottom 44px clipping in `SectionLayout`; enforce 3-layer PDF 2-page print guarantee (1,200 char limit, 10 line-breaks, `<Text numberOfLines={17}>`); add accessible labels across section forms; add computed `মোট` total in `PersonalForm` derived on blur.
- **Files touched**: [`src/app/report/[section]/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/[section]/page.tsx), [`src/components/layout/section-layout.tsx`](file:///d:/WebDev/report-submission/src/components/layout/section-layout.tsx), [`src/components/layout/navbar.tsx`](file:///d:/WebDev/report-submission/src/components/layout/navbar.tsx), [`src/components/layout/bottom-nav.tsx`](file:///d:/WebDev/report-submission/src/components/layout/bottom-nav.tsx), [`src/components/layout/user-dropdown.tsx`](file:///d:/WebDev/report-submission/src/components/layout/user-dropdown.tsx), [`src/app/api/export/pdf/route.tsx`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx), [`src/components/report/sections/personal-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/personal-form.tsx).

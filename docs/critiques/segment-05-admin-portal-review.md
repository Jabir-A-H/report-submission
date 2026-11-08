# Segment 05 Adversarial Critique & Doubt Gate Review: Admin Portal, User Governance & Override System

**Repository**: `talimul-quran-report-submission`  
**Role**: Subagent B (Adversarial Reviewer)  
**Standard**: AGENTS.md Rule 2 (Multi-Option Planning & Doubt Gate), Rule 6 (Clean Architecture Standards), Rule 7 (Pre-Production Database Agility & Zero Dead-Weight), AUDIT_PROMPTS.md §4.2  
**Target Files Evaluated**:
- [`src/app/(admin)/layout.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/layout.tsx)
- [`src/app/(admin)/dashboard/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/dashboard/page.tsx)
- [`src/app/(admin)/reports/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx)
- [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx)
- [`src/app/(admin)/management/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx)
- [`src/app/(admin)/management/actions.ts`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/actions.ts)
- [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx)

---

## 1. Executive Adversarial Evaluation

- **Agreement Level with Lead Investigator**: **Moderate to High (82%)**  
- **False Positive Count Discharged / Nuanced**: **3 findings re-evaluated or debunked** (Service Role Key Bundle Leak debunked; DCS Cascade Data Loss debunked; Superadmin Deletion Severity re-scoped from active zero-day P0 emergency to pre-production P1 integrity invariant).
- **Core Verdict**:  
  Subagent A accurately isolated the most debilitating operational defects in the admin portal: the fatal period token mismatch that makes secondary controls disappear (`C05-01`), the decoupled pagination search that masks zone reports (`C05-03`), and the 50-request N+1 query cascade in zone management (`C05-05`). However, Subagent A misdiagnosed the live database state:
  1. In `city_report_override`, the legacy 6-column unique index (`city_report_override_unique_key`) was **never dropped** in PostgreSQL; it coexists with the ADR 023 7-column index, meaning PostgREST currently fails with `23505` duplicate key violations rather than `42P10` syntax errors.
  2. In `zone`, the columns `zone_type` and `parent_id` **do not exist at all** in the live database (`pxdkvewaglagnfcqeckn`), rendering Subagent A's call to delete the `42703` polyfill impossible without first applying the missing DDL.
  3. `actions.ts` runs strictly on the Node.js server under `'use server'` with private environment variables, completely disproving any risk of service role credential leakage to client bundles.

---

## 2. Doubt Gate Cross-Examination

The table below subjects Subagent A's findings to adversarial stress testing against live database schema inspections and pre-production operational realities:

| Finding ID | Lead Severity | Adversarial Ruling | Rationale & Real-World Stress Test |
|---|:---:|:---:|---|
| **C05-01** (Period Token Mismatch) | **P0** | **CONFIRMED P0** | **Fatal UX Blocker**: `<select>` sets English tokens (`"quarterly"`), but conditional checks expect Bengali (`"ত্রৈমাসিক"`). Upon selection, quarter/half/custom controls vanish immediately. Field admins cannot view or submit period aggregates. |
| **C05-02** (Override Upsert Index) | **P0** | **CONFIRMED P0 (Nuanced)** | **Schema Inconsistency**: Database inspection confirms both `city_report_override_unique_key` (6-col) and `city_report_override_period_unique` (7-col) exist simultaneously. Custom range overrides with identical start months fail with `23505` unique violations. Dropping the legacy index triggers PostgREST `42P10` unless `CorrectionButton` passes `end_month`. |
| **C05-04** (Admin Deleting Superadmin) | **P0** | **DOWNGRADED TO P1** | **Pre-Production Realism**: With only 2 trusted test administrator accounts and zero hostile users, this is an architectural authorization omission, not an exploited zero-day breach. Must be fixed cleanly before opening multi-admin testing, but is not blocking daily development. |
| **C05-03** (Decoupled Client Search) | **P1** | **CONFIRMED P1** | **Data Invisibility**: `reports` array holds only 10 rows. Searching for a zone whose report sits on page 2 returns 0 results ("No reports found"), misleading admins into believing a zone has defaulted. |
| **C05-05** (N+1 HTTP HEAD Cascade) | **P1** | **CONFIRMED P1** | **Connection Starvation**: 14 zones $\times$ 2 queries = 28 concurrent HTTP HEAD requests on mount. Exceeds browser 6-connection pool limit; over Bangladesh 3G/4G cellular networks, this triggers request queuing, latency spikes, and gateway timeouts. |
| **C05-06** (Self-Deactivation Guard) | **P1** | **CONFIRMED P1** | **Irreversible Lockout**: `toggleActive` allows an admin to deactivate their own account. `middleware.ts` traps them in an unescapable `/pending-approval` redirect loop on the next navigation. |
| **C05-08** (Zero URL Sync in City Report) | **P2** | **CONFIRMED P2** | **ADR 006 Violation**: All period state lives in React `useState`. Page reload or link sharing resets to Dhaka current month, discarding selected quarters or years. |
| **C05-09** (Child Zone Deletion Guard) | **P2** | **CONFIRMED P2 (Prerequisite Dependent)** | **Conditional Defect**: In the live database, `zone` has no `parent_id` column. Once the DDL is executed, deleting a parent zone without this check will crash with a PostgreSQL foreign key constraint violation (`zone_parent_id_fkey`). |
| **C05-15** (Redundant Yearly Stats Query) | **P2** | **CONFIRMED P2** | **Bandwidth Waste**: Every page turn (Page 1 $\rightarrow$ 2) re-downloads all report rows for the entire year to calculate unique active zones. |
| **B05-01** (Defensive Schema Polyfill `42703`) | Bloatware | **RE-SCOPED: BLOCKED BY DDL** | Subagent A urged deleting the `42703` try/catch block. However, SQL inspection reveals `zone_type` and `parent_id` **do not exist** in `zone` table. Deleting the polyfill before running DDL crashes all zone creation. |
| **B05-02** (Hardcoded DCS Filter `z.id !== 1`) | Bloatware | **RE-SCOPED: BLOCKED BY DDL** | Filter `z.id !== 1` cannot be removed until `zone.zone_type` is added and populated with `'city'` for ID 1. Removing it prematurely exposes DCS in reportable lists. |

---

## 3. False Positive & Trivial Con Elimination

### 3.1 Debunking the Service Role Bundle Leak Suspicion
- **Investigation**: Does `src/app/(admin)/management/actions.ts` leak `SUPABASE_SERVICE_ROLE_KEY` to client browser bundles?
- **Adversarial Verification**:
  1. The file begins with `'use server'` at line 1. Under Next.js App Router specifications, all exports from `'use server'` modules are compiled into private server RPC endpoints. Neither the source code nor the runtime execution is exposed to the browser.
  2. `process.env.SUPABASE_SERVICE_ROLE_KEY` lacks the `NEXT_PUBLIC_` prefix. Next.js environment variable bundlers strictly prevent non-public environment variables from being inlined into client JavaScript chunks.
  3. Client bundles only receive an opaque action dispatch stub (e.g. `deleteUserAction = createServerReference(...)`).
- **Verdict**: **100% FALSE POSITIVE**. The credential is secure. The vulnerability is strictly logic-based: missing target role validation in the server action.

### 3.2 Debunking the DCS Cascading Data Loss Fear
- **Investigation**: If we execute `DELETE FROM report WHERE id = 36` (the historical DCS test report), will foreign key cascades destroy child table test data belonging to legitimate zones?
- **Adversarial Verification**:
  1. Database introspection of `information_schema.referential_constraints` confirms all 7 child tables (`report_personal`, `report_organizational`, `report_meeting`, `report_header`, `report_extra`, `report_course`, `report_comment`) define `FOREIGN KEY (report_id) REFERENCES report(id) ON DELETE CASCADE`.
  2. In PostgreSQL, `ON DELETE CASCADE` is strictly scoped to rows where `child.report_id = old_parent.id`. It has zero impact on rows where `report_id != 36`.
  3. Live database query `SELECT * FROM report WHERE id = 36` and `WHERE zone_id = 1` confirms report 36 and DCS reports are already absent from the database.
- **Verdict**: **DISCHARGED**. Cascades operate safely and isolate deletions to the targeted report record only.

### 3.3 Reality-Checking Superadmin Governance in Pre-Production (`C05-04`)
- **Investigation**: Subagent A classified standard admins deleting superadmins as a P0 Critical Vulnerability ("system takeover").
- **Adversarial Verification**:
  1. The project is in active pre-production development (`AGENTS.md` Rule 7) with only two internal developers holding admin credentials and no self-registration endpoint for untrusted public users.
  2. There is no active threat actor or public attack vector capable of invoking `deleteUserAction`.
  3. Elevating this to P0 (immediate system-halting blocker) conflates live production SOC response with pre-production architectural hardening.
- **Verdict**: **DOWNGRADED TO P1**. It is a mandatory structural integrity invariant that must be resolved prior to user onboarding, but does not block development of other features.

---

## 4. Clean Pre-Production DDL vs App-Layer Patch Arbitration

Under `AGENTS.md` Rule 6 & Rule 7, we arbitrate whether to write defensive application patches or execute clean PostgreSQL DDL migrations:

### Arbitration 1: `zone` Table Schema Evolution vs Defensive `42703` Catch Block
- **The Conflict**: `src/app/(admin)/management/page.tsx:196-205` catches `error.code === "42703"` (undefined column) when inserting `zone_type` and `parent_id`. Subagent A proposed deleting this catch block.
- **Database Reality**: Live inspection shows `zone` has only `id` and `name`.
- **Ruling**: **Execute Clean DDL First, Then Eradicate Bloatware**. Under Rule 7, we do NOT tolerate application shims for unmigrated schemas. The database must be brought into canonical alignment:
  ```sql
  -- DDL Migration: Add zone hierarchy columns to public.zone
  ALTER TABLE public.zone 
    ADD COLUMN IF NOT EXISTS zone_type text NOT NULL DEFAULT 'zone',
    ADD COLUMN IF NOT EXISTS parent_id integer REFERENCES public.zone(id) ON DELETE SET NULL;

  -- Set DCS (id=1) as city-level entity
  UPDATE public.zone SET zone_type = 'city' WHERE id = 1;
  UPDATE public.zone SET zone_type = 'zone' WHERE id != 1;

  -- Covering index for parent_id lookups
  CREATE INDEX IF NOT EXISTS idx_zone_parent_id ON public.zone(parent_id);
  ```
  Once this DDL is executed, lines 196–205 of `management/page.tsx` can be completely purged, and `z.id !== 1` checks can be replaced with `z.zone_type !== 'city'`.

### Arbitration 2: Dual Index Collision in `city_report_override`
- **The Conflict**: ADR 023 §2.2 created `city_report_override_period_unique` (7 columns including `end_month`). However, `city_report_override_unique_key` (6 columns) was never dropped.
- **Database Reality**:
  ```sql
  -- Current pg_indexes on city_report_override:
  -- 1. city_report_override_pkey (id)
  -- 2. city_report_override_unique_key (year, month, report_type, section, field, category)
  -- 3. city_report_override_period_unique (year, month, end_month, report_type, section, field, category)
  ```
  Because both exist, any insert with identical `year, month, report_type, section, field, category` but different `end_month` fails against `city_report_override_unique_key` with error `23505`.
- **Ruling**: **Drop Legacy Index via DDL & Update PostgREST onConflict Specification**:
  ```sql
  -- Drop obsolete 6-column unique index to allow custom multi-month ranges
  DROP INDEX IF EXISTS public.city_report_override_unique_key;
  ```
  In `CorrectionButton`:
  ```ts
  // Must match exactly the 7 columns of city_report_override_period_unique
  { onConflict: 'year,month,end_month,report_type,section,field,category' }
  ```

---

## 5. Final Hardened Action Plan & Priority Matrix

### Priority Matrix

| Phase | Finding / Action | Nature | Target Files / DDL | Risk |
|:---:|:---|:---:|:---|:---:|
| **P0** | **C05-01**: Fix Period Token Mismatch | Bug Fix | [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx) | Low |
| **P0** | **C05-02**: Index Alignment & Custom Range Persistence | DDL + Fix | Supabase DDL + [`correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx) + [`city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx) | Low |
| **P1** | **C05-04**: Strict 2-Tier Role Hierarchy Guard | Security Fix | [`src/app/(admin)/management/actions.ts`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/actions.ts) | Low |
| **P1** | **C05-03**: Server-Side Zone Search on Reports | Architectural Fix | [`src/app/(admin)/reports/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx) | Low |
| **P1** | **C05-05**: Eradicate N+1 Query Cascade in `fetchZones` | Perf Optimization | [`src/app/(admin)/management/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx) | Low |
| **P1** | **C05-06**: Prevent Admin Self-Deactivation | Safety Fix | [`src/app/(admin)/management/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx) | Low |
| **P2** | **B05-01 / B05-02**: Execute Missing Zone DDL & Purge Fallbacks | DDL + Cleanup | Supabase DDL + [`management/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx) + [`dashboard/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/dashboard/page.tsx) | Low |
| **P2** | **C05-15**: Decouple Yearly Stats from Table Pagination | Perf Optimization | [`src/app/(admin)/reports/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx) | Low |
| **P3** | **B05-05**: Consolidate Duplicate `toBn` Functions | Clean Refactor | [`dashboard/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/dashboard/page.tsx), [`reports/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx) | Low |
| **P3** | **UI/UX Ergonomics**: 44px Touch Targets & Modal Escape Trap | A11y / UI | [`city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx), [`correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx) | Low |

---

### Step-by-Step Remediation Directives

#### Step 1: Database DDL Hardening (Supabase)
Execute the unified migration in Supabase SQL editor:
```sql
-- 1. Drop the legacy 6-column override index that blocks custom ranges
DROP INDEX IF EXISTS public.city_report_override_unique_key;

-- 2. Add zone hierarchy columns to public.zone
ALTER TABLE public.zone 
  ADD COLUMN IF NOT EXISTS zone_type text NOT NULL DEFAULT 'zone',
  ADD COLUMN IF NOT EXISTS parent_id integer REFERENCES public.zone(id) ON DELETE SET NULL;

-- 3. Populate zone types
UPDATE public.zone SET zone_type = 'city' WHERE id = 1;
UPDATE public.zone SET zone_type = 'zone' WHERE id != 1;

-- 4. Index parent_id
CREATE INDEX IF NOT EXISTS idx_zone_parent_id ON public.zone(parent_id);
```

#### Step 2: Fix Fatal Period Token Mismatch in City Report (`C05-01`)
In [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx):
1. Initialize `reportType` to `"monthly"`:
   ```tsx
   const [reportType, setReportType] = useState("monthly");
   ```
2. Update conditional checks to English tokens:
   ```tsx
   {reportType === "monthly" && (...)}
   {reportType === "quarterly" && (...)}
   {reportType === "halfYearly" && (...)}
   {reportType === "custom" && (...)}
   {(reportType === "nineMonth" || reportType === "yearly") && (...)}
   ```
3. Pass `dbType` (from `resolvePeriodConfig`) to Supabase queries:
   ```tsx
   .eq("report_type", activePeriod.dbType)
   ```

#### Step 3: Hardened 2-Tier Role Guard in Server Action (`C05-04`)
In [`src/app/(admin)/management/actions.ts`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/actions.ts):
```ts
export async function deleteUserAction(supabaseUid: string | null, peopleId: number) {
  const requesterSupabase = await createServerClient()
  const { data: { user } } = await requesterSupabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Fetch requester profile
  const { data: requesterProfile } = await requesterSupabase
    .from('people')
    .select('id, role')
    .eq('supabase_uid', user.id)
    .single()

  if (!requesterProfile || (requesterProfile.role !== 'admin' && requesterProfile.role !== 'superadmin')) {
    return { success: false, error: 'Forbidden' }
  }

  // 2. Fetch target profile
  const { data: targetPerson } = await requesterSupabase
    .from('people')
    .select('id, role, supabase_uid')
    .eq('id', peopleId)
    .single()

  if (!targetPerson) return { success: false, error: 'User not found' }

  // 3. Strict Self-Deletion Guard
  if (targetPerson.id === requesterProfile.id || targetPerson.supabase_uid === user.id) {
    return { success: false, error: 'নিজের অ্যাকাউন্ট ডিলিট করা যাবে না।' }
  }

  // 4. Strict 2-Tier Role Hierarchy Guard
  if (targetPerson.role === 'superadmin') {
    return { success: false, error: 'সুপারএডমিন অ্যাকাউন্ট ডিলিট করা যাবে না।' }
  }
  if (targetPerson.role === 'admin' && requesterProfile.role !== 'superadmin') {
    return { success: false, error: 'অ্যাডমিন অ্যাকাউন্ট মুছতে শুধুমাত্র সুপারএডমিনের অনুমতি রয়েছে।' }
  }

  // 5. Execute deletion via service role
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (targetPerson.supabase_uid) {
    const { error } = await adminSupabase.auth.admin.deleteUser(targetPerson.supabase_uid)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await adminSupabase.from('people').delete().eq('id', targetPerson.id)
    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}
```

#### Step 4: Align Override Upsert & Delete with 7-Column Composite (`C05-02`)
In [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx):
1. Accept `endMonth?: number` in props and pass it from `activePeriod.endMonth`.
2. Target the 7-column composite key:
   ```ts
   .upsert({
     year,
     month: overrideMonth,
     end_month: endMonth || 0,
     section,
     field,
     category: category || null,
     value: valueToSave,
     report_type: reportType
   }, { onConflict: 'year,month,end_month,report_type,section,field,category' })
   ```
3. Include `end_month` in the delete query:
   ```ts
   .delete()
   .eq('year', year)
   .eq('month', overrideMonth)
   .eq('end_month', endMonth || 0)
   .eq('report_type', reportType)
   .eq('section', section)
   .eq('field', field)
   ```

#### Step 5: Eliminate N+1 HEAD Requests in Zone Management (`C05-05`)
In [`src/app/(admin)/management/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx):
Derive `user_count` directly from the `usersData` state in memory, and fetch report counts in a single batch query:
```ts
const { data: reportCounts } = await supabase
  .from('report')
  .select('zone_id');

const reportCountMap = new Map<number, number>();
(reportCounts || []).forEach(r => {
  reportCountMap.set(r.zone_id, (reportCountMap.get(r.zone_id) || 0) + 1);
});

const userCountMap = new Map<number, number>();
(usersData || []).forEach(u => {
  userCountMap.set(u.zone_id, (userCountMap.get(u.zone_id) || 0) + 1);
});

const enriched: ZoneWithStats[] = zonesData.map(zone => ({
  ...zone,
  user_count: userCountMap.get(zone.id) || 0,
  report_count: reportCountMap.get(zone.id) || 0,
}));
```

#### Step 6: Server-Side Zone Search & Pagination Decoupling (`C05-03`, `C05-15`)
In [`src/app/(admin)/reports/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx):
1. Query matching zone IDs on the server when `searchQuery` is provided, passing `.in("zone_id", matchingZoneIds)` to the report query.
2. Separate the annual KPI calculation (`allCount` and `yearReports`) into an independent `useEffect` that fires only when `filterYear` changes, avoiding redundant table scans on pagination clicks.
3. Migrate audit links from legacy `/report?zone_id=X&report_id=Y` to canonical `/report/header?reportId=Y`.

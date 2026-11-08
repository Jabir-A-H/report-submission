# Segment 05 Codebase & Architectural Audit: Admin Portal, User Governance & Override System

**Repository**: `talimul-quran-report-submission`  
**Role**: Subagent A (Lead Investigator)  
**Standard**: 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`), Impeccable UI/UX Ergonomics, Pre-Production Agility & Zero Dead-Weight (`AGENTS.md` Rule 7), Adversarial Doubt-Driven Review (`Rule 2 & 6`)  
**Target Files**:
- [`src/app/(admin)/layout.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/layout.tsx)
- [`src/app/(admin)/dashboard/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/dashboard/page.tsx)
- [`src/app/(admin)/reports/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx)
- [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx)
- [`src/app/(admin)/management/page.tsx`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx)
- [`src/app/(admin)/management/actions.ts`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/actions.ts)
- [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx)

---

## 1. Executive Quality Scorecard

- **Health Grade**: **D+ (46/100)**
- **Pre-Production Bloatware Count**: 5 distinct patterns
- **Critical Behavioral Defects**: 4 critical blockers (C05-01, C05-02, C05-03, C05-04)
- **Executive Summary**:  
  Segment 05 serves as the administrative control center of the platform, governing user access, zone hierarchies, city-level metric overrides, and report audits. While routing groups (`(admin)`) and RLS caching have been stabilized, severe behavioral regressions and architectural bloatware prevent production deployment. Most critically, an English-vs-Bengali period token mismatch in `/city-report` causes secondary period selectors to completely vanish upon selection (`C05-01`). Simultaneously, `CorrectionButton` upserts against an obsolete 6-column composite, violating the 7-column PostgreSQL unique index (`city_report_override_period_unique` from ADR 023) and corrupting multi-month custom ranges (`C05-02`). In user governance, `deleteUserAction` lacks target-role authorization, allowing standard admins to permanently delete superadmin accounts (`C05-04`). Furthermore, the report audit table decouples client-side filtering from server pagination, rendering search results for zones beyond the first 10 rows invisible (`C05-03`), and `fetchZones` executes an N+1 HTTP HEAD cascade (50+ requests) directly from mobile browsers (`C05-05`).

---

## 2. Pre-Production Bloatware & Rule 7 Violations

Under `AGENTS.md` Rule 7, in active pre-production development with zero live field workers, application-layer shims and defensive polyfills written to tolerate unmigrated schemas or historical test records are classified as architectural bloatware:

| # | File Location | Bloatware Pattern | Root Cause in Prototype | Zero-Dead-Weight Clean Remediation |
|:---:|:---|:---|:---|:---|
| **B05-01** | [`src/app/(admin)/management/page.tsx:196-205`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L196-L205) | **Defensive Schema Polyfill (`42703`)**: Try/catch fallback inserting into `zone` without `zone_type` or `parent_id` when PostgreSQL returns undefined column error. | Defensive coding to tolerate obsolete local/staging databases that had not applied ADR 009 schema migrations. | Apply DDL migration (`ALTER TABLE zone ADD COLUMN IF NOT EXISTS zone_type text, ADD COLUMN IF NOT EXISTS parent_id integer REFERENCES zone(id)`) and purge the 10-line fallback catch block entirely. |
| **B05-02** | [`src/app/(admin)/dashboard/page.tsx:103, 108`](file:///d:/WebDev/report-submission/src/app/%28admin%29/dashboard/page.tsx#L103) | **Hardcoded Magic Entity Exclusion (`z.id !== 1`)**: Explicitly filtering DCS by `z.id !== 1` and `person?.zone_id === 1` across dashboard queries. | DCS was seeded as row ID 1 in early prototypes without a formal `zone_type` enum. | Rely strictly on the structured schema hierarchy: filter by `z.zone_type !== 'city'` and `person?.role === 'superadmin'`. Eliminate all hardcoded magic ID `1` checks. |
| **B05-03** | [`src/app/(admin)/city-report/page.tsx:1063, 1159`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L1063) | **Dual-String Category Fallbacks**: Multi-clause regex/string checks in `.find()` searching for both old and new spelling variants (`"সহযোগী হয়েছেন"` vs `"সহযোগী হয়েছে"`, split Mashq strings, and merged meeting titles). | Historical test reports submitted with differing string literals across UI iterations. | Execute a one-time SQL normalization migration on `report_organizational` and `report_meeting` rows, then reduce application lookups to standard single-clause `r.category === cat`. |
| **B05-04** | [`src/app/(admin)/reports/page.tsx:504, 583`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx#L504) | **Redundant Query Parameter Baggage**: Hyperlinks emitting legacy snake_case parameters (`/report?zone_id=${report.zone_id}&report_id=${report.id}`). | Pre-canonical URL routing prototype where report views required redundant zone pointers. | Modernize links to conform to ADR 024 canonical entity routing: `/report/header?reportId=${report.id}`. `report.id` is the primary key; `zone_id` is redundant. |
| **B05-05** | [`src/app/(admin)/dashboard/page.tsx:63-66`](file:///d:/WebDev/report-submission/src/app/%28admin%29/dashboard/page.tsx#L63-L66), [`src/app/(admin)/reports/page.tsx:66-72`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx#L66-L72) | **Duplicate Local Number Conversion Utilities**: Copy-pasting local `toBn` and `toBengaliNum` implementations instead of consuming shared libraries. | Fragmented component authoring without shared utility discipline. | Delete local implementations and import canonical `toBn` directly from [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts). |

---

## 3. 5-Layer Behavioral Audit Findings Table

The findings below map systematically across the 14 Web Behavioral Bug Categories (`WEB-001`–`WEB-014`):

| # | Bug ID | Short Title | File Location | Urgency | Risk: Fix | Risk: No Fix | ROI | Blast Radius | Status |
|:---:|:---|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **C05-01** (WEB-011) | Period Token Mismatch Vanishes Controls | [`city-report/page.tsx:270, 615-731`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L270) | **P0 (Immediate)** | LOW | CRITICAL | High | Segment 05 | **CONFIRMED** |
| 2 | **C05-02** (WEB-012) | Override Upsert Violates ADR 023 Index | [`correction-button.tsx:96-107, 127-142`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L96) | **P0 (Immediate)** | LOW | CRITICAL | High | Segment 05, 06 | **CONFIRMED** |
| 3 | **C05-04** (WEB-006) | Privilege Escalation: Admin Deleting Superadmin | [`management/actions.ts:26-32`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/actions.ts#L26-L32) | **P0 (Immediate)** | LOW | CRITICAL | High | Segment 01, 05 | **CONFIRMED** |
| 4 | **C05-03** (WEB-004) | Decoupled Client Search on Paginated Slice | [`reports/page.tsx:116-149, 186-192`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx#L116-L149) | **P1 (High)** | LOW | HIGH | High | Segment 05 | **CONFIRMED** |
| 5 | **C05-05** (WEB-013) | N+1 HTTP HEAD Query Cascade in `fetchZones` | [`management/page.tsx:105-120`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L105-L120) | **P1 (High)** | LOW | HIGH | High | Segment 05 | **CONFIRMED** |
| 6 | **C05-06** (WEB-006) | Missing Self-Deactivation Guard in Management | [`management/page.tsx:132-144`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L132-L144) | **P1 (High)** | LOW | HIGH | High | Segment 01, 05 | **CONFIRMED** |
| 7 | **C05-08** (WEB-011) | Zero URL State Sync in City Report | [`city-report/page.tsx:264-288`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L264-L288) | **P2 (Medium)** | LOW | MEDIUM | High | Segment 05 | **CONFIRMED** |
| 8 | **C05-09** (WEB-014) | Missing Child Zone Deletion Guard | [`management/page.tsx:231-249`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L231-L249) | **P2 (Medium)** | LOW | MEDIUM | Medium | Segment 05 | **CONFIRMED** |
| 9 | **C05-15** (WEB-013) | Redundant Yearly Stats Query on Page Turn | [`reports/page.tsx:151-167`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx#L151-L167) | **P2 (Medium)** | LOW | MEDIUM | Medium | Segment 05 | **CONFIRMED** |
| 10 | **C05-10** (UI-001) | Sub-WCAG Touch Target (26px) & Missing Escape | [`city-report/page.tsx:225`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L225), [`correction-button.tsx:185`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L185) | **P3 (Low)** | LOW | LOW | Medium | Segment 05 | **CONFIRMED** |
| 11 | **C05-11** (WEB-008) | Hardcoded Bengali Numerals in English Locale | [`city-report/page.tsx:242`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L242), [`management/page.tsx:564`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L564) | **P3 (Low)** | LOW | LOW | Medium | Segment 05 | **CONFIRMED** |
| 12 | **C05-12** (UI-002) | Outdated Button Label Reference in Modal Copy | [`correction-button.tsx:53, 261`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L53) | **P3 (Low)** | LOW | LOW | Low | Segment 05 | **CONFIRMED** |
| 13 | **C05-13** (WEB-014) | Non-Idempotent Zone Creation on Fast Enter | [`management/page.tsx:176, 937`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L176) | **P3 (Low)** | LOW | LOW | Medium | Segment 05 | **CONFIRMED** |

---

## 4. Deep Receipts & Remediation Plans

### Finding 1: [C05-01] Period Type Select Value Mismatch Vanishing Secondary Controls (`WEB-011`)
- **Current Behavior**:  
  In [`src/app/(admin)/city-report/page.tsx:270`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L270), `reportType` initializes to Bengali `"মাসিক"`.  
  In line 615, the dropdown maps over `REPORT_TYPES`:
  ```tsx
  <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
    {REPORT_TYPES.map((rt) => (
      <option key={rt.value} value={rt.value}>{rt.label}</option>
    ))}
  </select>
  ```
  `REPORT_TYPES` in [`src/lib/report-utils.ts:20-27`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L20-L27) defines `value` in English (`"monthly"`, `"quarterly"`, `"halfYearly"`, `"nineMonth"`, `"yearly"`, `"custom"`). Once an option is clicked, `reportType` is set to `"quarterly"`.  
  Lines 628–731 then evaluate:
  ```tsx
  {reportType === "মাসিক" && (...)}
  {reportType === "ত্রৈমাসিক" && (...)}
  {reportType === "ষান্মাসিক" && (...)}
  {reportType === "কাস্টম" && (...)}
  {(reportType === "নয়-মাসিক" || reportType === "বার্ষিক") && (...)}
  ```
  Because `reportType === "quarterly"`, every check evaluates to `false`.
- **Behavioral Impact**:  
  All secondary period selectors (quarter selector, half selector, custom start/end month dropdowns) immediately vanish from the screen. If the user clicks "মাসিক" again, `reportType` becomes `"monthly"` (not `"মাসিক"`), causing even the month selector to disappear. The user is permanently locked out of period navigation.
- **Authoritative Citation**:  
  `docs/TECHNICAL_MANUAL.md §4.2`; ADR 006 (Period State Governance).
- **Actionable Remediation**:  
  Standardize `reportType` state on English tokens (`"monthly"`, `"quarterly"`, etc.) and update the conditional checks to match:
  ```tsx
  const [reportType, setReportType] = useState("monthly");
  ...
  {reportType === "monthly" && (...)}
  {reportType === "quarterly" && (...)}
  {reportType === "halfYearly" && (...)}
  {reportType === "custom" && (...)}
  {(reportType === "nineMonth" || reportType === "yearly") && (...)}
  ```
  Or embed the canonical `<PeriodSelector />` component from [`src/components/dashboard/period-selector.tsx`](file:///d:/WebDev/report-submission/src/components/dashboard/period-selector.tsx).

---

### Finding 2: [C05-02] Override Upsert & Delete Violates ADR 023 Index & Corrupts Custom Ranges (`WEB-012`, `WEB-004`)
- **Current Behavior**:  
  ADR 023 §2.2 added `end_month` to `city_report_override` and established the unique index:
  ```sql
  CREATE UNIQUE INDEX city_report_override_period_unique ON public.city_report_override 
    USING btree (year, month, end_month, report_type, section, field, category) NULLS NOT DISTINCT;
  ```
  In [`src/components/admin/correction-button.tsx:96-107`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L96-L107), upsert targets the obsolete 6-column composite:
  ```ts
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
  `end_month` is omitted from both the payload and the `onConflict` clause.  
  In lines 127–142, `handleDelete` deletes overrides using only `year, month, report_type, section, field, category`, completely omitting `end_month`.  
  In [`src/app/(admin)/city-report/page.tsx:396-401`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L396-L401), `fetchData` queries overrides without `.eq('end_month', activePeriod.endMonth)`.
- **Behavioral Impact**:  
  1. PostgREST throws a 42P10 error (`ON CONFLICT specification does not match any constraint`) on production database schemas where the old unique index has been replaced.  
  2. For custom ranges, `end_month` defaults to 0. If two custom ranges share a start month (e.g., March–May and March–August), saving an override on one overwrites the other.  
  3. Clicking delete on March–May wipes overrides for March–August simultaneously.
- **Authoritative Citation**:  
  `docs/ADR/023-database-hardening-rls-optimization-and-schema-agility.md §2.2`.
- **Actionable Remediation**:  
  1. Add `endMonth?: number` to `CorrectionButtonProps` and thread it from `activePeriod.endMonth`.
  2. In `CorrectionButton.handleSave`:
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
  3. In `CorrectionButton.handleDelete`:
     ```ts
     .delete()
     .eq('year', year)
     .eq('month', overrideMonth)
     .eq('end_month', endMonth || 0)
     .eq('report_type', reportType)
     .eq('section', section)
     .eq('field', field)
     ```
  4. In `CityReportPage.fetchData`:
     ```ts
     .from("city_report_override")
     .select("*")
     .eq("year", activePeriod.year)
     .eq("report_type", dbType)
     .eq("month", overrideMonth)
     .eq("end_month", activePeriod.endMonth || 0)
     ```

---

### Finding 3: [C05-04] Privilege Escalation on User Deletion via Service-Role Bypass (`WEB-006`)
- **Current Behavior**:  
  In [`src/app/(admin)/management/actions.ts:26-32`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/actions.ts#L26-L32):
  ```ts
  if (requesterProfile.role !== 'admin' && requesterProfile.role !== 'superadmin') {
    return { success: false, error: 'Forbidden' }
  }
  if (supabaseUid && supabaseUid === user.id) {
    return { success: false, error: 'নিজের অ্যাকাউন্ট ডিলিট করা যাবে না।' }
  }
  ```
  The function verifies that the requester is an admin or superadmin, but **never queries the target account's role**.  
  Furthermore, the self-deletion guard is keyed strictly on `supabaseUid && supabaseUid === user.id`. If a requester passes `supabaseUid = null` with their own `peopleId`, line 30 evaluates to `false` and line 47 executes `adminSupabase.from('people').delete().eq('id', peopleId)`, deleting their own identity.
- **Behavioral Impact**:  
  Any standard administrator can delete a superadmin account or another administrator using the service-role client (`adminSupabase.auth.admin.deleteUser(supabaseUid)`). A compromised standard admin account can eliminate all administrators and superadmins, causing an unrecoverable system takeover.
- **Authoritative Citation**:  
  ADR 024 §2 (Issue C05-04 Governance Rule); `docs/TECHNICAL_MANUAL.md §2.2`.
- **Actionable Remediation**:  
  Prior to invoking deletion, query the target record in `people` using the server client:
  ```ts
  // 1. Fetch target profile
  const { data: targetPerson, error: targetError } = await requesterSupabase
    .from('people')
    .select('id, role, supabase_uid')
    .eq('id', peopleId)
    .single();

  if (targetError || !targetPerson) {
    return { success: false, error: 'User not found' };
  }

  // 2. Strict Self-Deletion Guard
  if (targetPerson.supabase_uid === user.id || targetPerson.id === requesterProfile.id) {
    return { success: false, error: 'নিজের অ্যাকাউন্ট ডিলিট করা যাবে না।' };
  }

  // 3. Strict 2-Tier Role Hierarchy Guard
  if (targetPerson.role === 'superadmin') {
    return { success: false, error: 'সুপারএডমিন অ্যাকাউন্ট ডিলিট করা অনুমোদিত নয়।' };
  }
  if (targetPerson.role === 'admin' && requesterProfile.role !== 'superadmin') {
    return { success: false, error: 'অ্যাডমিন অ্যাকাউন্ট মুছতে শুধুমাত্র সুপারএডমিনের অনুমতি রয়েছে।' };
  }
  ```

---

### Finding 4: [C05-03] Decoupled Client-Side Zone Search on Server-Paginated Report Slice (`WEB-004`)
- **Current Behavior**:  
  In [`src/app/(admin)/reports/page.tsx:140-149`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx#L140-L149), `fetchReports` issues a server-paginated query bounded by `range(from, to)` (fetching 10 or 25 records):
  ```ts
  const from = (currentPage - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);
  const { data, count } = await query;
  setReports((data as unknown as ReportRow[]) ?? []);
  ```
  Then, lines 186–192 perform purely in-memory filtering:
  ```ts
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.trim().toLowerCase();
    return reports.filter((r) =>
      (r.zone?.name ?? "").toLowerCase().includes(q)
    );
  }, [reports, searchQuery]);
  ```
- **Behavioral Impact**:  
  `reports` contains only the active 10-row page slice. If an admin searches for "যাত্রাবাড়ী জোন" and that report resides on Page 2 or Page 3 of the database query, `filteredReports` returns an empty array. The UI displays "কোনো রিপোর্ট পাওয়া যায়নি" (No reports found), misleading administrators into believing a zone has failed to submit its report.
- **Authoritative Citation**:  
  `docs/TECHNICAL_MANUAL.md §4.3`; `AUDIT_PROMPTS.md §1.1`.
- **Actionable Remediation**:  
  Execute zone name searches on the server. Because Supabase PostgREST foreign table filtering syntax can be brittle, execute a fast subquery for matching zones:
  ```ts
  let matchingZoneIds: number[] | null = null;
  if (searchQuery.trim()) {
    const { data: matched } = await supabase
      .from('zone')
      .select('id')
      .ilike('name', `%${searchQuery.trim()}%`);
    matchingZoneIds = (matched || []).map(z => z.id);
  }
  ...
  if (matchingZoneIds !== null) {
    query = query.in('zone_id', matchingZoneIds);
  }
  ```
  Reset `currentPage` to 1 whenever `searchQuery` changes.

---

### Finding 5: [C05-05] N+1 HTTP HEAD Query Cascade in `fetchZones` (`WEB-013`)
- **Current Behavior**:  
  In [`src/app/(admin)/management/page.tsx:105-120`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L105-L120):
  ```ts
  const enriched: ZoneWithStats[] = await Promise.all(
    zonesData.map(async (zone) => {
      const [{ count: userCount }, { count: reportCount }] = await Promise.all([
        supabase.from("people").select("*", { count: "exact", head: true }).eq("zone_id", zone.id),
        supabase.from("report").select("*", { count: "exact", head: true }).eq("zone_id", zone.id),
      ]);
      return { ...zone, user_count: userCount ?? 0, report_count: reportCount ?? 0 };
    })
  );
  ```
- **Behavioral Impact**:  
  For 25 zones, this fires **50 concurrent HTTP HEAD requests** directly from the mobile browser. Mobile browsers enforce a pool limit of ~6 TCP connections per origin. Firing 50 simultaneous requests causes severe connection starvation, latency spikes, and socket timeouts over spotty 3G/4G cellular connections in Bangladesh.  
  Moreover, `fetchUsers()` in line 88 already loads all users (`usersData`) into memory, rendering the 25 user-count network requests completely redundant.
- **Authoritative Citation**:  
  `docs/TECHNICAL_MANUAL.md §1.2`; `AGENTS.md` Rule 2.
- **Actionable Remediation**:  
  1. Derive `user_count` by reducing the existing in-memory `usersData` array:
     ```ts
     const userCountsByZone = new Map<number, number>();
     usersData.forEach((u) => {
       userCountsByZone.set(u.zone_id, (userCountsByZone.get(u.zone_id) || 0) + 1);
     });
     ```
  2. For `report_count`, query an aggregated PostgreSQL database view (`view_zone_report_counts`) in 1 single HTTP request, or query `supabase.from('report').select('zone_id')` and count client-side.

---

### Finding 6: [C05-06] Missing Self-Deactivation Guard in Management Portal (`WEB-006`)
- **Current Behavior**:  
  In [`src/app/(admin)/management/page.tsx:132-144`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L132-L144):
  ```ts
  async function toggleActive(user: Person) {
    setUserActionLoading(user.id);
    const { error } = await supabase
      .from("people")
      .update({ active: !user.active })
      .eq("id", user.id);
    ...
  }
  ```
  `ManagementPage` never captures the authenticated administrator's ID. An admin can click "নিষ্ক্রিয় করুন" on their own card.
- **Behavioral Impact**:  
  The moment `active` is set to `false`, `middleware.ts` intercepts the account on the next navigation and immediately traps the administrator in a `/pending-approval` redirect loop, locking them out of the portal.
- **Authoritative Citation**:  
  `docs/TECHNICAL_MANUAL.md §2.2`; ADR 003.
- **Actionable Remediation**:  
  Capture `currentUserId` during initial auth initialization:
  ```ts
  const { data: { user: authUser } } = await supabase.auth.getUser();
  setCurrentUserId(authUser?.id || null);
  ```
  In the user card rendering (line 603), disable the toggle button if `user.supabase_uid === currentUserId`, displaying a tooltip: `"নিজের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না"`.

---

### Finding 7: [C05-08] Zero URL Parameter Synchronization in City Report (`WEB-011`)
- **Current Behavior**:  
  In [`src/app/(admin)/city-report/page.tsx:270-277`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L270-L277), all period state (`reportType`, `month`, `year`, `quarter`, `half`, `startMonth`, `endMonth`) is isolated entirely in local React component `useState`.
- **Behavioral Impact**:  
  Violates ADR 006 ("URL Query Params Remain the Sole Source of Truth"). If an administrator configures Quarter 3 of 2025 and shares the URL with a supervisor or reloads the browser, the page resets to Month 10 of 2026 (the Dhaka date fallback). Browser Back/Forward buttons do not restore prior period selections.
- **Authoritative Citation**:  
  `docs/ADR/006-url-only-period-state-simplification.md`.
- **Actionable Remediation**:  
  Initialize period state from `useSearchParams()` and push updates to the URL via `router.replace` upon change, or replace the inline selector with `<PeriodSelector />`.

---

### Finding 8: [C05-09] Missing Child Zone Deletion Guard Causing PostgreSQL Foreign Key Crash (`WEB-014`)
- **Current Behavior**:  
  In [`src/app/(admin)/management/page.tsx:231-237`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L231-L237):
  ```ts
  async function deleteZone(zoneId: number) {
    const zone = zonesWithStats.find((z) => z.id === zoneId);
    if (zone && (zone.user_count > 0 || zone.report_count > 0)) {
      setZoneError(`এই জোনে ${zone.user_count} জন ইউজার ও ${zone.report_count} টি রিপোর্ট আছে। আগে এগুলো সরিয়ে নিন।`);
      setConfirmDeleteZone(null);
      return;
    }
  ```
  The guard checks `user_count` and `report_count`, but does **not** check whether child zones exist (`parent_id === zoneId`).
- **Behavioral Impact**:  
  If a parent zone has 0 users and 0 reports but has subordinate thanas or wards assigned to it via `parent_id`, clicking delete bypasses the client check and triggers a raw PostgreSQL foreign key error (`zone_parent_id_fkey`), displaying an unhelpful generic error.
- **Authoritative Citation**:  
  `docs/TECHNICAL_MANUAL.md §2.1 (Line 116)`.
- **Actionable Remediation**:  
  Add child zone verification before deletion:
  ```ts
  const childZoneCount = zonesWithStats.filter((z) => z.parent_id === zoneId).length;
  if (zone && (zone.user_count > 0 || zone.report_count > 0 || childZoneCount > 0)) {
    setZoneError(`এই জোনে ${zone.user_count} জন ইউজার, ${zone.report_count} টি রিপোর্ট এবং ${childZoneCount} টি অধীনস্থ জোন যুক্ত আছে।`);
    setConfirmDeleteZone(null);
    return;
  }
  ```

---

### Finding 9: [C05-15] Redundant Yearly Statistics Queries on Report Pagination (`WEB-013`)
- **Current Behavior**:  
  In [`src/app/(admin)/reports/page.tsx:151-167`](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx#L151-L167), `fetchReports` calculates global counts (`allCount`) and queries all reports for the current year (`yearReports`) to count unique active zones:
  ```ts
  const { data: yearReports } = await supabase
    .from("report")
    .select("zone_id")
    .eq("year", currentReportingYear);
  ```
  `fetchReports` is triggered inside `useEffect([fetchReports])` which fires on every `currentPage` change.
- **Behavioral Impact**:  
  Every time an administrator pages through records (Page 1 -> Page 2 -> Page 3), the application re-downloads every single report row for the entire year from Supabase. In a multi-year archive with hundreds of reports, this floods the network with redundant payload downloads on every pagination click.
- **Authoritative Citation**:  
  `docs/TECHNICAL_MANUAL.md §1.2`.
- **Actionable Remediation**:  
  Decouple global KPI metrics into a separate `useEffect` hook that executes once on component mount and only re-executes when `filterYear` changes.

---

### Finding 10: [C05-10] Sub-WCAG Touch Targets (26px) & Missing Modal Keyboard Trap (`UI-001`)
- **Current Behavior**:  
  In [`src/app/(admin)/city-report/page.tsx:225`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L225), the override edit button uses `min-h-[26px] min-w-[26px]`.  
  In [`src/components/admin/correction-button.tsx:185-192`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L185-L192) and [`src/app/(admin)/management/page.tsx:894-904`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L894-L904), modals listen for backdrop clicks but have no `keydown` event listener for `Escape`.
- **Behavioral Impact**:  
  Tapping a 26px button on mobile devices frequently triggers accidental taps on adjacent table rows. Keyboard users are trapped inside modals with no `Escape` key escape hatch.
- **Authoritative Citation**:  
  WCAG 2.5.5 (44px Minimum Touch Target); ADR 011 (Modal Governance).
- **Actionable Remediation**:  
  Expand touch target to `min-h-[44px] min-w-[44px]` using transparent padding (`p-2.5`), and attach standard `keydown` `Escape` handlers to all modal containers.

---

### Finding 11: [C05-11] Hardcoded Bengali Numerals & Strings in English Mode (`WEB-008`)
- **Current Behavior**:  
  In [`src/app/(admin)/city-report/page.tsx:242`](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L242), `NumericCell` unconditionally calls `toBn(value)`. Secondary labels ("কোয়ার্টার", "ষান্মাসিক", "শুরু মাস", "শেষ মাস") and user action strings ("ভূমিকা", "জোন", "নিষ্ক্রিয় করুন") are hardcoded Bengali strings.
- **Behavioral Impact**:  
  When an administrator switches the interface to English (`app-language = "en"`), the admin views display mismatched Bengali digits and untranslated Bengali buttons.
- **Authoritative Citation**:  
  `docs/TECHNICAL_MANUAL.md §4.4`; `src/lib/i18n.ts`.
- **Actionable Remediation**:  
  Format digits conditionally via `language === "bn" ? toBn(n) : String(n)` and bind all action labels to the `t` dictionary.

---

### Finding 12: [C05-12] Copywriting Inconsistency in CorrectionButton Error Message (`UI-002`)
- **Current Behavior**:  
  In [`src/components/admin/correction-button.tsx:53`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L53):
  ```ts
  setError("মন্তব্য মুছে ফেলতে 'মুছুন' বোতাম ব্যবহার করুন।")
  ```
  However, the button in line 261 is labeled:
  ```tsx
  <span>গণনা করা মানে ফিরে যান</span>
  ```
- **Behavioral Impact**:  
  The user is instructed to click a button named "মুছুন" that does not exist in the UI, causing cognitive confusion.
- **Actionable Remediation**:  
  Update copy to: `"মন্তব্য মুছে ফেলতে 'গণনা করা মানে ফিরে যান' বোতাম ব্যবহার করুন।"`.

---

### Finding 13: [C05-13] Non-Idempotent Zone Creation on Rapid Enter Keypresses (`WEB-014`)
- **Current Behavior**:  
  In [`src/app/(admin)/management/page.tsx:937`](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L937):
  ```tsx
  onKeyDown={(e) => e.key === "Enter" && addZone()}
  ```
  `addZone` (line 176) checks `if (!newZoneName.trim()) return;` but does **not** check `addLoading`.
- **Behavioral Impact**:  
  Rapidly pressing Enter or double-clicking the submit button sends concurrent insert queries, creating duplicate zone rows.
- **Actionable Remediation**:  
  Add `if (!newZoneName.trim() || addLoading) return;` at the entry point of `addZone()`.

---

## 5. Cross-Segment Blast Radius & Wire Analysis

```
                       SEGMENT 05 DATA-WIRING & BLAST RADIUS MAP
                                  ┌────────────────────────┐
                                  │   Segment 05: Admin    │
                                  │  Portal & Management   │
                                  └───────────┬────────────┘
                                              │
           ┌───────────────────┬──────────────┼──────────────┬──────────────────┐
           │                   │              │              │                  │
           ▼                   ▼              ▼              ▼                  ▼
    ┌─────────────┐     ┌─────────────┐┌─────────────┐┌─────────────┐     ┌─────────────┐
    │ Segment 01  │     │ Segment 02  ││ Segment 03  ││ Segment 06  │     │ Segment 07  │
    │ Auth & Role │     │ Postgres    ││ Report Core ││ Export      │     │ Mobile UX   │
    │ Hierarchy   │     │ Schema DDL  ││ Navigation  ││ Engine      │     │ Utilities   │
    └─────────────┘     └─────────────┘└─────────────┘└─────────────┘     └─────────────┘
```

1. **Wiring to Segment 01 (Authentication & Role Hierarchy)**:
   - **Protection Against Superadmin Account Deletion**: Patching `deleteUserAction` (`C05-04`) enforces a strict two-tier role gate across the entire identity layer. Standard administrators are strictly restricted to managing `role = 'user'`.
   - **Self-Lockout Prevention**: Implementing the `currentUserId` guard in `toggleActive` (`C05-06`) prevents administrators from deactivating themselves, avoiding irreversible `/pending-approval` redirection loops in [`src/middleware.ts:89`](file:///d:/WebDev/report-submission/middleware.ts#L89).
   - **Admin Layout Access Control**: [`src/app/(admin)/layout.tsx:23`](file:///d:/WebDev/report-submission/src/app/%28admin%29/layout.tsx#L23) should redirect unauthorized users to canonical `/home` or `/report` rather than bare `/`.

2. **Wiring to Segment 02 & Database DDL (PostgreSQL Schema & Indexes)**:
   - **ADR 023 Index Fulfillment**: Aligning `CorrectionButton` with the 7-column composite (`year, month, end_month, report_type, section, field, category`) fulfills the deferred commitment in ADR 023 §3 and eliminates 42P10 database errors.
   - **Purging Defensive Polyfill (`B05-01`)**: Eradicating the `42703` catch block in `management/page.tsx` enforces clean database migrations for `zone_type` and `parent_id`.

3. **Wiring to Segment 03 (Report Core & Routing Navigation)**:
   - **Canonical Link Migration (`B05-04`)**: Modernizing report audit links from `/report?zone_id=X&report_id=Y` to `/report/header?reportId=Y` integrates Segment 05 with the canonical entity routing architecture defined in ADR 024.
   - **DCS Zone 1 Segregation**: Ensuring DCS (`zone_id = 1`) redirects cleanly to `/city-report` stops single-zone report entry forms from being polluted with city-wide aggregation data.

4. **Wiring to Segment 06 (Document Export Pipeline — PDF & Excel)**:
   - **Custom Range Override Parity**: When `CorrectionButton` persists `end_month`, the export engines in [`src/app/api/export/pdf/route.tsx:929`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L929) and [`src/app/api/export/excel/route.ts:488`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts#L488) must filter overrides by `end_month`. Otherwise, custom multi-month PDF exports will fail to reflect administrator overrides.

5. **Wiring to Segment 07 (Build Pipeline & Utilities)**:
   - **Utility Consolidation (`B05-05`)**: Purging local `toBn` functions in `dashboard/page.tsx` and `reports/page.tsx` enforces single-source-of-truth utility discipline through [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts).

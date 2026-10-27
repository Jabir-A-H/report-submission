# Codebase Critique: Segment 5 — Admin & Management Portal

**Target Scope**:
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/dashboard/page.tsx`
- `src/app/(admin)/reports/page.tsx`
- `src/app/(admin)/city-report/page.tsx`
- `src/app/(admin)/management/page.tsx`
- `src/app/(admin)/management/actions.ts`
- `src/components/admin/correction-button.tsx`
- `src/components/dashboard/period-selector.tsx`
- `src/components/dashboard/user-dashboard.tsx`

**Reviewer**: Senior Engineering Manager & Principal Systems Architect (Agent 2)  
**Investigator**: Agent 1  
**Target Repository**: `report-submission`  
**Date**: October 2026  
**Status**: Authoritative Synthesized Architecture Review

---

## 1. Executive Summary & Scorecard

### 1.1 Architectural Health Overview
Segment 5 constitutes the executive control tower of the `report-submission` platform. It governs administrative monitoring, city-wide metric aggregation, manual override governance, report audits, and user/zone access registries. While past architectural evolutions successfully streamlined administrative routing (ADR 012 collapsed fragmented `/admin/*` routes into clean route groups `(admin)`) and hardened the database tier (ADR 023 introduced statement-cached RLS and foreign key covering indexes), adversarial examination reveals severe functional breakages and systemic architectural drift.

Most alarmingly, an English-versus-Bengali value mismatch in the inline period selector of `/city-report` completely breaks all multi-month and custom period configurations, causing secondary scope controls to vanish. Simultaneously, `CorrectionButton` continues to upsert overrides against an obsolete 6-column composite, directly violating the ADR 023 database unique index (`city_report_override_period_unique`) and corrupting custom date range overrides. Furthermore, the report audit table decouples client-side filtering from server pagination—blinding administrators to reports residing beyond the first 10 rows—while the user deletion server action lacks target-role validation, permitting standard administrators to permanently delete superadmin accounts.

### 1.2 Executive Scorecard

| Category | Score / Grade | Verdict & Field Impact |
| :--- | :---: | :--- |
| **Control Flow & Selector State** | **F (22/100)** | Critical type mismatch vanishes secondary selectors; zero URL synchronization violates ADR 006. |
| **Data Integrity & Override Governance** | **D- (34/100)** | Violates ADR 023 unique index; custom range overrides collide and wipe sibling ranges on delete. |
| **Security & Role Hierarchy** | **C- (55/100)** | Admin can delete Superadmin; admins can deactivate their own accounts and self-lockout. |
| **Network & Database Efficiency** | **D+ (48/100)** | N+1 HTTP HEAD cascade (2*N requests) in `fetchZones`; redundant yearly queries on pagination clicks. |
| **Search & Pagination Correctness** | **D (38/100)** | Client-side search filters only the current 10-row page slice; hides cross-page zone reports. |
| **Mobile & Touch Ergonomics** | **C+ (68/100)** | Sub-WCAG touch targets (26px) on edit buttons; modals lack Escape key listeners. |
| **Internationalization (i18n)** | **C (60/100)** | Hardcoded Bengali labels and unconditional `toBn()` numerals ignore active English locale. |
| **Overall Segment 5 Rating** | **D+ (46/100)** | **PRE-PRODUCTION BLOCKER**: Cannot release administrative portal until C05-01, C05-02, C05-03, and C05-04 are resolved. |

---

## 2. Adversarial Doubt Gate: Cross-Examination of Agent 1 Findings

We cross-examined all 14 findings submitted by Agent 1 against live application code, `docs/TECHNICAL_MANUAL.md`, `docs/KNOWN_ISSUES.md`, and authoritative ADRs (006, 009, 012, 018, 021, 022, 023). In addition, Agent 2 uncovered 1 previously overlooked architectural defect (`C05-15`).

```
                              CRITIQUE FINDING VERDICT MATRIX
┌──────────┬──────────┬─────────────────────────────────────────────────────────────┬───────────────────────────┐
│ Finding  │ Severity │ Description                                                 │ Architecture Gate Verdict │
├──────────┼──────────┼─────────────────────────────────────────────────────────────┼───────────────────────────┤
│ C05-01   │ CRITICAL │ Period Type Value Mismatch Breaks Secondary Controls        │ VERIFIED & CONFIRMED      │
│ C05-02   │ HIGH     │ Override Upsert Violates ADR 023 Index & Corrupts Custom    │ VERIFIED & EXPANDED       │
│ C05-03   │ HIGH     │ Client-Side Search Decoupled from Server Pagination Slice   │ VERIFIED & CONFIRMED      │
│ C05-04   │ HIGH     │ Unchecked Admin Deletion of Superadmin in Server Action     │ VERIFIED & CONFIRMED      │
│ C05-05   │ MEDIUM   │ N+1 HTTP Query Cascade in `fetchZones` (2*N Requests)       │ VERIFIED & CONFIRMED      │
│ C05-06   │ MEDIUM   │ Lack of Self-Deactivation Guard in User Management          │ VERIFIED & CONFIRMED      │
│ C05-07   │ MEDIUM   │ Missing DCS Aggregated City View on `/report`               │ REBUTTED (SCOPE CREEP)    │
│ C05-08   │ MEDIUM   │ Zero URL State Synchronization in `CityReportPage`          │ VERIFIED & CONFIRMED      │
│ C05-09   │ MEDIUM   │ Missing Child Zone Deletion Guard                           │ VERIFIED & CONFIRMED      │
│ C05-10   │ LOW      │ Touch Target Deficits (26px) & Missing Escape Key in Modals │ VERIFIED & CONFIRMED      │
│ C05-11   │ LOW      │ Hardcoded Bengali Numerals & Strings in English Mode        │ VERIFIED & CONFIRMED      │
│ C05-12   │ LOW      │ Outdated Button Label Reference in `CorrectionButton`       │ VERIFIED & CONFIRMED      │
│ C05-13   │ LOW      │ Double-Action on Enter in Zone Creation Form                │ VERIFIED & CONFIRMED      │
│ C05-14   │ LOW      │ Legacy Ending Month Hardcoding in `UserDashboard`           │ VERIFIED & CONFIRMED      │
│ C05-15   │ MEDIUM   │ Redundant Stat Re-Queries on Page Pagination in `/reports`  │ NEW FINDING (AGENT 2)     │
└──────────┴──────────┴─────────────────────────────────────────────────────────────┴───────────────────────────┘
```

---

### Detailed Finding Breakdown

#### [C05-01] CRITICAL: Period Type Value Mismatch Breaks Secondary Controls in `CityReportPage`
- **File Reference**: [src/app/(admin)/city-report/page.tsx:270, 615-731](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L270-L731)
- **Investigation Finding**: Agent 1 noted that changing report type dropdown passes English values (`rt.value = "quarterly"`), but JSX conditionally renders secondary selectors using Bengali strings (`reportType === "ত্রৈমাসিক"`), making secondary period selectors vanish.
- **Adversarial Verification**: **CONFIRMED & CRITICAL**.
  - In [src/app/(admin)/city-report/page.tsx:270](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L270), the initial state is set to Bengali: `const [reportType, setReportType] = useState("মাসিক");`.
  - In line 615, the dropdown maps over `REPORT_TYPES`:
    ```tsx
    <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
      {REPORT_TYPES.map((rt) => (
        <option key={rt.value} value={rt.value}>{rt.label}</option>
      ))}
    </select>
    ```
  - In [src/lib/report-utils.ts:20-27](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L20-L27), `REPORT_TYPES` defines values in English:
    `[{ value: "monthly", label: "মাসিক" }, { value: "quarterly", label: "ত্রৈমাসিক" }, { value: "halfYearly", label: "ষান্মাসিক" }, { value: "nineMonth", label: "নয়-মাসিক" }, { value: "yearly", label: "বার্ষিক" }, { value: "custom", label: "কাস্টম রেঞ্জ" }]`.
  - Once the administrator selects any option (e.g. "ত্রৈমাসিক"), `e.target.value` is `"quarterly"`.
  - Lines 628–731 then evaluate:
    ```tsx
    {reportType === "মাসিক" && (...)}
    {reportType === "ত্রৈমাসিক" && (...)}
    {reportType === "ষান্মাসিক" && (...)}
    {reportType === "কাস্টম" && (...)}
    {(reportType === "নয়-মাসিক" || reportType === "বার্ষিক") && (...)}
    ```
  - Because `reportType` holds `"quarterly"`, **every single condition evaluates to `false`**.
  - **Catastrophic Impact**: All secondary period selectors (Quarter 1–4, Half 1–2, Custom Start/End Month, Month dropdown) disappear completely from the DOM. The admin cannot select which quarter or custom range to view, locking the city report permanently into month 1 or whatever default was loaded.
  - **Architectural Remedy**: Replace the hand-rolled inline selector entirely with the shared `<PeriodSelector />` component from `src/components/dashboard/period-selector.tsx`, or standardize `reportType` on canonical English keys (`monthly`, `quarterly`, etc.) consistent with `PeriodSelector`.

---

#### [C05-02] HIGH: Override Upsert Violates ADR 023 Index & Corrupts Custom Ranges in `CorrectionButton`
- **File Reference**: [src/components/admin/correction-button.tsx:96-107, 127-140](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L96-L107), [src/app/(admin)/city-report/page.tsx:396-401](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L396-L401)
- **Investigation Finding**: Agent 1 noted that `onConflict` targets obsolete columns without `end_month`, failing against `city_report_override_period_unique` and wiping sibling range overrides on delete.
- **Adversarial Verification**: **CONFIRMED & CRITICAL INTEGRITY DEFECT**.
  - ADR 023 §2.2 officially migrated the database to support overlapping custom ranges:
    ```sql
    ALTER TABLE public.city_report_override ADD COLUMN IF NOT EXISTS end_month integer NOT NULL DEFAULT 0;
    CREATE UNIQUE INDEX city_report_override_period_unique ON public.city_report_override 
      USING btree (year, month, end_month, report_type, section, field, category) NULLS NOT DISTINCT;
    ```
  - In [src/components/admin/correction-button.tsx:96-107](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L96-L107), the upsert executes:
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
  - **PostgreSQL / PostgREST Violation**: PostgREST upsert requires the `onConflict` parameter to match the exact columns of an existing unique constraint or unique index. Because `city_report_override_period_unique` contains 7 columns (including `end_month`), passing the obsolete 6-column list causes PostgREST to return a database error (`ON CONFLICT specification does not match any constraint`).
  - Furthermore, `end_month` is omitted from the insert payload, falling back to database default `0`.
  - In `handleDelete` (lines 127–140), `end_month` is completely omitted from the `.delete()` query. If two custom ranges share a start month (e.g. `March–May` vs `March–August`), deleting an override for `March–May` **deletes both overrides** simultaneously!
  - In [src/app/(admin)/city-report/page.tsx:396-401](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L396-L401), `fetchData` queries `city_report_override` without filtering by `end_month`, causing custom ranges sharing a start month to collide and overwrite each other in client state.
  - **Architectural Remedy**: 
    1. Pass `endMonth: number` through `CityReportContext` into `CorrectionButton`.
    2. Include `end_month: endMonth || 0` in both `upsert` and `delete` operations.
    3. Update `onConflict` to `'year,month,end_month,report_type,section,field,category'`.
    4. In `CityReportPage`, filter override queries by `.eq('end_month', activePeriod.endMonth)`.

---

#### [C05-03] HIGH: Client-Side Search Decoupled from Server Pagination Slice in `/reports`
- **File Reference**: [src/app/(admin)/reports/page.tsx:117-144, 186-192](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx#L117-L144)
- **Investigation Finding**: Agent 1 noted that `searchQuery` filters only the 10 rows of the current page slice, hiding matching reports situated on other pages.
- **Adversarial Verification**: **CONFIRMED & HIGH UX DEFECT**.
  - `fetchReports` issues a server-paginated query:
    ```ts
    const from = (currentPage - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);
    const { data, count } = await query;
    setReports(data ?? []);
    ```
  - Then, lines 186–192 perform purely in-memory filtering:
    ```ts
    const filteredReports = useMemo(() => {
      if (!searchQuery.trim()) return reports;
      const q = searchQuery.trim().toLowerCase();
      return reports.filter((r) =>
        (r.zone?.name ?? "").toLowerCase().includes(q)
      );
    }, [reports, searchQuery]);
    ```
  - `reports` holds **strictly 10 or 25 records** (the active page slice).
  - If Dhaka City has 14 zones and the administrator is on Page 1 looking for "যাত্রাবাড়ী" (situated on Page 2), the table shows "কোনো রিপোর্ট পাওয়া যায়নি" (No reports found), even though the report exists.
  - Meanwhile, the pagination bar continues to calculate `totalPages = Math.ceil(totalCount / perPage)` based on the unfiltered count, creating an impossible UI state where 0 rows are shown but 14 pages are listed.
  - **Architectural Remedy**: Server-side zone search. Since PostgREST cannot filter directly on joined foreign tables via standard `.ilike('zone.name')` without foreign table resource embedding or sub-filters, execute a fast lookup: `supabase.from('zone').select('id').ilike('name', `%${searchQuery}%`)`, and inject `.in('zone_id', matchingIds)` into the server query while resetting `currentPage` to 1.

---

#### [C05-04] HIGH: Unchecked Admin Deletion of Superadmin in Server Action
- **File Reference**: [src/app/(admin)/management/actions.ts:26-32](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/actions.ts#L26-L32)
- **Investigation Finding**: Agent 1 noted that `deleteUserAction` allows an `admin` to delete a `superadmin` account due to missing target-role hierarchy validation.
- **Adversarial Verification**: **CONFIRMED & CRITICAL SECURITY HOLE**.
  - In [src/app/(admin)/management/actions.ts:26-32](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/actions.ts#L26-L32):
    ```ts
    if (requesterProfile.role !== 'admin' && requesterProfile.role !== 'superadmin') {
      return { success: false, error: 'Forbidden' }
    }
    if (supabaseUid && supabaseUid === user.id) {
      return { success: false, error: 'নিজের অ্যাকাউন্ট ডিলিট করা যাবে না।' }
    }
    ```
  - The function verifies that the **requester** is an admin or superadmin, and prevents self-deletion.
  - **However, it never inspects the TARGET account's role!**
  - If a standard `admin` sends `deleteUserAction(superadminUid, superadminPeopleId)`, the action connects using `process.env.SUPABASE_SERVICE_ROLE_KEY` and permanently wipes the `superadmin` account from `auth.users` and `people`!
  - In any multi-tiered governance structure, role modification and account deletion must enforce:
    1. A `superadmin` account can NEVER be deleted via standard admin portal endpoints (or can only be deleted by another superadmin with strict confirmation).
    2. An `admin` CANNOT delete another `admin` or a `superadmin`. Standard `admin` can only delete standard `user` accounts.
  - **Architectural Remedy**: Prior to invoking `adminSupabase.auth.admin.deleteUser`, query the target row in `people`. If `target.role === 'superadmin'`, reject with `Forbidden`. If `target.role === 'admin'` and `requesterProfile.role !== 'superadmin'`, reject with `Forbidden`.

---

#### [C05-05] MEDIUM: N+1 HTTP Query Cascade in `fetchZones`
- **File Reference**: [src/app/(admin)/management/page.tsx:105-120](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L105-L120)
- **Investigation Finding**: Agent 1 noted that `fetchZones` fires `2 * N` concurrent browser HTTP requests for counts, despite user rows already residing in memory from `fetchUsers`.
- **Adversarial Verification**: **CONFIRMED & PERFORMANCE BOTTLENECK**.
  - In [src/app/(admin)/management/page.tsx:105-120](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L105-L120):
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
  - For 20 zones, this initiates **40 concurrent HTTP HEAD requests** directly from the mobile browser.
  - Mobile browsers enforce a pool limit of ~6 concurrent TCP connections per origin. Firing 40 simultaneous requests saturates the connection pool, inducing request starvation, high packet latency, and socket dropouts over flaky 3G/4G cellular connections in Bangladesh.
  - **Systemic Redundancy**: `fetchUsers()` (line 88) ALREADY loads all users into memory (`usersData`). `user_count` per zone can be computed in O(N) memory without a single network call!
  - **Architectural Remedy**: 
    1. Compute `user_count` by reducing existing `usersData` in memory.
    2. For `report_count`, query a single lightweight database view (e.g. `view_zone_report_counts` with `GROUP BY zone_id`) or batch query `report` grouped by `zone_id`.

---

#### [C05-06] MEDIUM: Lack of Self-Deactivation Guard in User Management
- **File Reference**: [src/app/(admin)/management/page.tsx:132-144, 603-624](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L132-L144)
- **Investigation Finding**: Agent 1 noted that admins can deactivate their own account, instantly locking themselves out into `/pending-approval`.
- **Adversarial Verification**: **CONFIRMED & OPERATIONAL RISK**.
  - In `toggleActive(user)`:
    ```ts
    const { error } = await supabase
      .from("people")
      .update({ active: !user.active })
      .eq("id", user.id);
    ```
  - `ManagementPage` never captures the authenticated user's ID (`supabase.auth.getUser()`).
  - An administrator viewing the user list can click "নিষ্ক্রিয় করুন" on their own card.
  - The moment `active` is toggled to `false`, subsequent authentication checks in `src/app/home/page.tsx:28` immediately trap the admin in a `/pending-approval` redirect loop.
  - **Architectural Remedy**: Load `currentUserId` during initial auth state check. If `user.supabase_uid === currentUserId`, disable the toggle button with tooltip: "নিজের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না".

---

#### [C05-07] REBUTTED (SCOPE CREEP): Missing DCS Aggregated City View on `/report`
- **File Reference**: [src/app/report/page.tsx:184-250](file:///d:/WebDev/report-submission/src/app/report/page.tsx#L184-L250)
- **Investigation Finding**: Agent 1 claimed `/report/page.tsx` is missing DCS aggregation and should implement a full city aggregation engine when `zone_id = 1`.
- **Adversarial Gate Analysis**: **REBUTTED AS ACADEMIC OVER-ENGINEERING & ARCHITECTURAL SCOPE CREEP**.
  - `src/app/report/page.tsx` belongs to **Segment 3** (Report Submission & View Engine), NOT Segment 5.
  - Under ADR 009 and ADR 012, the architecture deliberately separated:
    1. `/city-report`: The authoritative, dedicated city-wide aggregated report (with View/Edit mode toggles, Section 5 city comments, PDF/Excel export, and override controls).
    2. `/report`: The single-zone data entry and overview portal for field workers and zone administrators.
  - Implementing full city aggregation inside `/report/page.tsx` would duplicate 6 Postgres aggregation views, override mapping logic, and view/edit controls directly into the zone report page, violating DRY and single-responsibility principles.
  - The real underlying issue noted in ADR 009 is **zone identity pollution**: DCS (`zone_id = 1`, `zone_type = 'city'`) should never be treated as an entry zone.
  - **Authoritative Resolution**: Exclude `id = 1` and `zone_type = 'city'` from the zone dropdown in `/report/page.tsx`. If an administrator attempts to visit `/report?zone_id=1`, issue an automatic 307 redirect to `/city-report`. Do NOT duplicate city aggregation logic in `/report`.

---

#### [C05-08] MEDIUM: Zero URL State Synchronization in `CityReportPage`
- **File Reference**: [src/app/(admin)/city-report/page.tsx:264-288](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L264-L288)
- **Investigation Finding**: Agent 1 noted that `CityReportPage` keeps period state purely in local `useState`, failing to read or synchronize URL parameters.
- **Adversarial Verification**: **CONFIRMED & ADR 006 VIOLATION**.
  - ADR 006 explicitly decrees:
    > *"URL Query Params Remain the Sole Source of Truth. `?type=...&month=...&year=...` parameters remain the authoritative period state. All components read from `useSearchParams()`. No other persistence mechanism is used."*
  - `CityReportPage` isolates its period parameters (`reportType`, `month`, `year`, `quarter`, `half`, `startMonth`, `endMonth`) completely in component state.
  - If an admin configures Quarter 3 of 2025 and shares the URL with a supervisor, the supervisor opens `/city-report` and sees Month 10 of 2026 (the Dhaka date fallback).
  - Furthermore, clicking browser Back/Forward does not navigate through previously viewed periods.
  - **Architectural Remedy**: Initialize period state from `useSearchParams()`, update URL via `router.replace` upon period changes, or consolidate by embedding `<PeriodSelector />`.

---

#### [C05-09] MEDIUM: Missing Child Zone Deletion Guard in `ManagementPage`
- **File Reference**: [src/app/(admin)/management/page.tsx:231-248](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L231-L248)
- **Investigation Finding**: Agent 1 noted that `deleteZone` checks `user_count` and `report_count`, but fails to check whether child zones exist (`parent_id = zoneId`), resulting in PostgreSQL FK errors.
- **Adversarial Verification**: **CONFIRMED & SPECIFICATION COMPLIANCE FAILURE**.
  - `docs/TECHNICAL_MANUAL.md §2.1 (Line 116)` explicitly mandates:
    > *"Zone Deletion Guard: Zone deletion must check both `user_count > 0` (existing guard) AND `child_zone_count > 0` (blocks deletion if child zones exist via `parent_id`) to prevent FK constraint violations."*
  - In [src/app/(admin)/management/page.tsx:233](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L233):
    ```ts
    if (zone && (zone.user_count > 0 || zone.report_count > 0)) {
      setZoneError(`এই জোনে ${zone.user_count} জন ইউজার ও ${zone.report_count} টি রিপোর্ট আছে। আগে এগুলো সরিয়ে নিন।`);
      return;
    }
    ```
  - If a parent zone has 0 users and 0 reports, but has child thanas/wards linked via `parent_id`, clicking delete bypasses the client check and triggers a raw PostgreSQL exception: `Key (id)=(X) is still referenced from table "zone" (violates foreign key constraint "zone_parent_id_fkey")`.
  - **Architectural Remedy**: Add `childZoneCount = zonesWithStats.filter(z => z.parent_id === zoneId).length` check before deletion.

---

#### [C05-10] LOW: Touch Target Deficits & Missing Escape Key in Modals
- **File Reference**: [src/app/(admin)/city-report/page.tsx:225](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L225), [src/components/admin/correction-button.tsx:180-280](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L180-L280), [src/app/(admin)/management/page.tsx:894-1002](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L894-L1002)
- **Investigation Finding**: Sub-WCAG touch targets (26px) on edit buttons and missing Escape key event listeners in administrative modals.
- **Adversarial Verification**: **CONFIRMED & ACCESSIBILITY DEFICIT**.
  - The override edit icon button in `CityReportPage` line 225 uses `min-h-[26px] min-w-[26px]`. On mobile screens, tapping this small icon frequently triggers accidental taps on adjacent table cells or text.
  - Modals in `CorrectionButton`, `AddZoneModal`, and `AssignedUsersModal` close on backdrop click, but none bind an `Escape` key listener (`keydown`), trapping keyboard users.
  - **Architectural Remedy**: Expand hit targets to `min-h-[44px] min-w-[44px]` (via invisible padding) per WCAG 2.5.5, and attach standard Escape key handlers.

---

#### [C05-11] LOW: Hardcoded Bengali Numerals & Strings in English Mode
- **File Reference**: [src/app/(admin)/city-report/page.tsx:242, 650-730](file:///d:/WebDev/report-submission/src/app/%28admin%29/city-report/page.tsx#L242), [src/app/(admin)/management/page.tsx:564-647](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L564-L647)
- **Investigation Finding**: Cell formatting unconditionally calls `toBn(value)` and secondary labels are hardcoded Bengali strings, ignoring `useLanguage()`.
- **Adversarial Verification**: **CONFIRMED & I18N DEFECT**.
  - In `city-report/page.tsx:242`: `<span>{isText ? (...) : toBn(value)}</span>`. Numbers are forcibly converted to Bengali numerals even when the application language is set to English (`language === "en"`).
  - Secondary labels ("কোয়ার্টার", "ষান্মাসিক", "শুরু মাস", "শেষ মাস", "সময়সীমা") and user management actions ("ভূমিকা", "জোন", "নিষ্ক্রিয় করুন", "অনুমোদন করুন", "মুছে ফেলুন") are hardcoded Bengali strings.
  - **Architectural Remedy**: Gate numeral formatting through `language === "bn" ? toBn(n) : String(n)` and bind strings to `t` dictionary.

---

#### [C05-12] LOW: Outdated Button Label Reference in `CorrectionButton`
- **File Reference**: [src/components/admin/correction-button.tsx:53, 261](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L53)
- **Investigation Finding**: Error message tells the user to click the "'মুছুন'" button, but the button is actually labelled `"গণনা করা মানে ফিরে যান"`.
- **Adversarial Verification**: **CONFIRMED & COPYWRITING INCONSISTENCY**.
  - In line 53: `setError("মন্তব্য মুছে ফেলতে 'মুছুন' বোতাম ব্যবহার করুন।")`.
  - In line 261: `<button ...><span>গণনা করা মানে ফিরে যান</span></button>`.
  - The user receives an error instructing them to click a button that does not exist in the modal.
  - **Architectural Remedy**: Update error string to: `"মন্তব্য মুছে ফেলতে 'গণনা করা মানে ফিরে যান' বোতাম ব্যবহার করুন।"`.

---

#### [C05-13] LOW: Double-Action on Enter in Zone Creation Form
- **File Reference**: [src/app/(admin)/management/page.tsx:176-180, 937](file:///d:/WebDev/report-submission/src/app/%28admin%29/management/page.tsx#L176-L180)
- **Investigation Finding**: In the Add Zone modal, pressing Enter repeatedly triggers concurrent inserts, creating duplicate zones due to missing `addLoading` guard at the top of `addZone`.
- **Adversarial Verification**: **CONFIRMED & IDEMPOTENCY DEFECT**.
  - Line 937: `onKeyDown={(e) => e.key === "Enter" && addZone()}`.
  - Line 176: `async function addZone() { if (!newZoneName.trim()) return; ... }`.
  - Because `addLoading` is not checked at the start of `addZone()`, double-tapping Enter during network latency submits duplicate inserts. Because `zone.name` has no database unique constraint, duplicate zones are created.
  - **Architectural Remedy**: Add `if (!newZoneName.trim() || addLoading) return;` at the entry of `addZone()`.

---

#### [C05-14] LOW: Legacy Ending Month Hardcoding in `UserDashboard`
- **File Reference**: [src/components/dashboard/user-dashboard.tsx:84-106](file:///d:/WebDev/report-submission/src/components/dashboard/user-dashboard.tsx#L84-L106)
- **Investigation Finding**: `getEndingMonthForPeriod` hardcodes `quarterly -> 3` and `halfYearly -> 6`, assuming all quarterly reports are Q1 and all half-yearly reports are H1, and completely ignoring `custom`.
- **Adversarial Verification**: **CONFIRMED & LOGIC DEFECT**.
  - In `src/components/dashboard/user-dashboard.tsx:84-106`:
    ```ts
    const getEndingMonthForPeriod = (reportType: string): number => {
      switch (reportType) {
        case "quarterly": case "ত্রৈমাসিক": return 3;
        case "halfYearly": case "ষান্মাসিক": return 6;
        case "nineMonth": case "নয়-মাসিক": return 9;
        case "yearly": case "বার্ষিক": return 12;
        default: return 1;
      }
    };
    ```
  - If a user selects Q2 (April–June) or Q3 (July–September), `getEndingMonthForPeriod` returns `3`. For H2 (July–December), it returns `6`.
  - For `custom`, it falls into `default: return 1`.
  - This logic is obsolete. The canonical `resolvePeriodConfig()` in `src/lib/report-utils.ts` already calculates precise `endMonth` and `isFuture` status based on exact period bounds.
  - **Architectural Remedy**: Replace `getEndingMonthForPeriod` with `resolvePeriodConfig({ type: selectedType, month: selectedMonth, quarter, half, year: selectedYear })`.

---

#### [C05-15] MEDIUM: Redundant Stat Re-Queries on Page Pagination in `/reports` (Agent 2 Discovery)
- **File Reference**: [src/app/(admin)/reports/page.tsx:151-167](file:///d:/WebDev/report-submission/src/app/%28admin%29/reports/page.tsx#L151-L167)
- **Adversarial Verification**: **AGENT 2 ARCHITECTURAL DISCOVERY**.
  - In `fetchReports`:
    ```ts
    // Stats: total reports (unfiltered) and unique reporting zones
    const { count: allCount } = await supabase
      .from("report")
      .select("*", { count: "exact", head: true });
    setTotalReports(allCount ?? 0);

    const currentReportingYear = filterYear > 0 ? filterYear : getDhakaDate().year;
    const { data: yearReports } = await supabase
      .from("report")
      .select("zone_id")
      .eq("year", currentReportingYear);

    if (yearReports) {
      const unique = new Set(yearReports.map((r: { zone_id: number }) => r.zone_id));
      setUniqueZones(unique.size);
    }
    ```
  - `fetchReports` is listed in `useEffect([fetchReports])` which fires whenever `currentPage` changes.
  - When an administrator flips from Page 1 to Page 2, Page 3, Page 4:
    - The client re-executes the global count query (`allCount`).
    - The client re-downloads **every single `zone_id` report row for the entire year** (`yearReports`).
  - If there are 300 reports in the year, paging through 5 pages re-downloads all 300 rows 5 separate times!
  - **Architectural Remedy**: Decouple global KPI statistics (`totalReports`, `uniqueZones`) from the paginated report table query. Execute stats calculation once on initial mount and when `filterYear` changes, not on page index changes.

---

## 3. Cross-Segment Blast Radius & Architectural Cohesion

```
                       CROSS-SEGMENT DEPENDENCY & BLAST RADIUS MAP
                                  ┌────────────────────────┐
                                  │   Segment 5: Admin     │
                                  │  & Management Portal   │
                                  └───────────┬────────────┘
                                              │
           ┌───────────────────┬──────────────┼──────────────┬──────────────────┐
           │                   │              │              │                  │
           ▼                   ▼              ▼              ▼                  ▼
    ┌─────────────┐     ┌─────────────┐┌─────────────┐┌─────────────┐     ┌─────────────┐
    │  Segment 1  │     │  Segment 2  ││  Segment 3  ││  Segment 6  │     │  Segment 7  │
    │  Auth &     │     │  Postgres   ││  Report View││  Export     │     │  UI/Mobile  │
    │  Hierarchy  │     │  & Indexes  ││  & Submiss. ││  Pipeline   │     │  Shell      │
    └─────────────┘     └─────────────┘└─────────────┘└─────────────┘     └─────────────┘
```

1. **Segment 1 (Authentication, Sessions & Role Hierarchy)**:
   - **Protection against Superadmin Deletion**: Resolving `C05-04` by introducing target-role validation inside `deleteUserAction` enforces role hierarchy across the entire system.
   - **Preventing Irreversible Admin Lockout**: Enforcing the self-deactivation guard (`C05-06`) ensures admins cannot mistakenly transition their own profile into `active = false`, which would immediately trigger `/pending-approval` redirection in `src/app/home/page.tsx:28`.
   - **Admin Layout Role Gating**: `src/app/(admin)/layout.tsx` must be augmented to check `person?.active !== false`, preventing deactivated accounts from remaining in the administrative shell.

2. **Segment 2 (Database Schema, Covering Indexes & RLS)**:
   - **Fulfilling ADR 023 Line 90 Commitment**: ADR 023 introduced `city_report_override_period_unique` with `end_month`. Aligning `CorrectionButton` (`C05-02`) fulfills the documented deferred commitment and eliminates database upsert rejections.
   - **Database Connection Pool Preservation**: Eliminating the N+1 HTTP HEAD cascade in `fetchZones` (`C05-05`) prevents socket pool exhaustion on Supabase PostgreSQL.

3. **Segment 3 (Report Submission & View Engine)**:
   - **Preserving Route Separation**: Rebutting `C05-07` stops architectural pollution from entering `src/app/report/page.tsx`. By handling DCS (`zone_id = 1`) via redirection to `/city-report`, Segment 3 remains purely focused on zone data entry without duplicating city aggregation views.

4. **Segment 6 (Export Pipeline — PDF & Excel)**:
   - **CRITICAL SYNC REQUIREMENT**: Both PDF (`src/app/api/export/pdf/route.tsx`) and Excel (`src/app/api/export/excel/route.ts`) export endpoints read from `city_report_override`.
   - When Segment 5 updates `city_report_override` to persist and delete using `end_month` for custom ranges, the export pipeline in Segment 6 must be verified to ensure its SQL queries filter by `.eq('end_month', endMonth)`. Failure to coordinate will cause custom range exports to either miss overrides or aggregate overrides from conflicting custom ranges.

5. **Segment 7 (UI/UX, Navigation & Mobile Shell)**:
   - **Component Consolidation**: Consolidating `CityReportPage` to use `<PeriodSelector />` eliminates 150 lines of duplicate UI, guarantees unified responsive behavior on mobile viewports (<640px), and aligns period state with ADR 006.

---

## 4. Root Causes & Anti-Patterns Identified

1. **Inline Re-implementation of Shared Components (DRY Violation)**:
   - Rather than consuming the shared `<PeriodSelector />` from `src/components/dashboard/period-selector.tsx`, `CityReportPage` copy-pasted and modified the selector inline. In doing so, it used English option values with Bengali equality checks (`C05-01`), omitted URL parameter synchronization (`C05-08`), and hardcoded Bengali text (`C05-11`).
2. **Premature Client-Side Slicing on Server-Paginated Queries**:
   - In `reports/page.tsx`, implementing client-side `.filter()` over a 10-row server `.range()` slice reflects a fundamental architectural antipattern: pagination and filtering must either be 100% server-side or 100% client-side; they cannot be arbitrarily split.
3. **Asymmetric Security Validation in Server Actions**:
   - `deleteUserAction` validated the caller's role but failed to validate the target's role. Administrative actions with irreversible destructive impact must validate both ends of the authorization relationship (`requester_role >= target_role`).
4. **Disconnected Schema Evolution**:
   - When ADR 023 added `end_month` to `city_report_override` and updated the unique index, the application-layer UI component (`CorrectionButton`) was not updated simultaneously, leaving a live defect where custom range overrides fail or wipe sibling records.

---

## 5. Actionable Remediation Roadmap

### Phase 1: Critical & Security Blockers (Immediate Pre-Production Gates)
- [ ] **Fix C05-01 (Period Type Value Mismatch)**:
  - In `src/app/(admin)/city-report/page.tsx`, replace the inline period selector with `<PeriodSelector />` or standardize `reportType` state on canonical English keys (`monthly`, `quarterly`, `halfYearly`, `nineMonth`, `yearly`, `custom`).
- [ ] **Fix C05-02 (ADR 023 Index & Override Alignment)**:
  - In `src/components/admin/correction-button.tsx`, accept `endMonth` as a prop.
  - In `handleSave`, include `end_month: endMonth || 0` and update `onConflict` to `'year,month,end_month,report_type,section,field,category'`.
  - In `handleDelete`, include `.eq('end_month', endMonth || 0)`.
  - In `src/app/(admin)/city-report/page.tsx:396-401`, filter overrides query by `.eq('end_month', activePeriod.endMonth || 0)`.
- [ ] **Fix C05-04 (Admin Deleting Superadmin)**:
  - In `src/app/(admin)/management/actions.ts`, fetch target profile before deletion.
  - Reject if `target.role === 'superadmin'` or if `target.role === 'admin' && requesterProfile.role !== 'superadmin'`.
- [ ] **Fix C05-03 (Server-Side Zone Search in `/reports`)**:
  - In `src/app/(admin)/reports/page.tsx`, perform zone search on the server by querying matching zone IDs first and filtering via `.in('zone_id', matchingZoneIds)`, resetting page index to 1.

### Phase 2: Performance & Network Hardening (Sprint Execution)
- [ ] **Fix C05-05 (N+1 Query Elimination in `fetchZones`)**:
  - In `src/app/(admin)/management/page.tsx`, derive `user_count` by reducing `usersData` in memory.
  - Query zone report counts via a single aggregated database view or batch query.
- [ ] **Fix C05-15 (Stat Re-Query Decoupling in `/reports`)**:
  - In `src/app/(admin)/reports/page.tsx`, decouple `allCount` and `yearReports` queries from pagination changes.
- [ ] **Fix C05-06 (Self-Deactivation Guard)**:
  - In `src/app/(admin)/management/page.tsx`, identify `currentUserId` and disable the status toggle for the active user.
- [ ] **Fix C05-08 (URL Synchronization in `CityReportPage`)**:
  - Initialize period state from `useSearchParams()` and sync URL via `router.replace` on changes.
- [ ] **Fix C05-09 (Child Zone Deletion Guard)**:
  - In `deleteZone()`, check `zonesWithStats.some(z => z.parent_id === zoneId)` and alert the admin if child zones exist.

### Phase 3: UX, Accessibility & i18n Hygiene (Polish)
- [ ] **Fix C05-10 (WCAG Touch Targets & Escape Key)**:
  - Expand `CorrectionButton` trigger minimum hit target to 44x44px and attach `Escape` key event listeners to modals.
- [ ] **Fix C05-11 (Localization Parity)**:
  - Bind secondary period labels and management action strings to `t` translation dictionary; gate numeral conversion on `language === "bn"`.
- [ ] **Fix C05-12 (Button Copy Inconsistency)**:
  - Update `CorrectionButton` error message to reference "গণনা করা মানে ফিরে যান".
- [ ] **Fix C05-13 (Idempotent Zone Creation)**:
  - Add `if (addLoading) return;` at the start of `addZone()` in `ManagementPage`.
- [ ] **Fix C05-14 (Consolidate Period End Logic)**:
  - In `src/components/dashboard/user-dashboard.tsx`, replace `getEndingMonthForPeriod` with `resolvePeriodConfig()`.

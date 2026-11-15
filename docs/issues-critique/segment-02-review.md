# Segment 02 Adversarial Review: Save Reliability, Lifecycle & State Machine

**Repository**: `Jabir-A-H/report-submission` (`Talimul Quran Report Submission`)  
**Auditor**: Subagent B (Adversarial Reviewer)  
**Target Domain**: Segment 02 — Save Reliability, Lifecycle & State Machine  
**Evaluation Standard**: Pre-Production Agility (`AGENTS.md` Rule 7), Adversarial "Doubt Gate" (`AGENTS.md` Rules 2 & 6), Field Worker Reality Orientation (3G CGNAT mobile networks, virtual soft keyboards, low-end Android devices)  
**Date**: 2026-11-15  

---

## 1. Adversarial Scorecard & Sanity Check

| Issue / Primitive | Subagent A Claim | Adversarial Doubt & Reality Check | Final Score / Sanity Verdict |
|:---|:---|:---|:---:|
| **RS-20 / KI-008** (Per-Field Error Tracking) | **Verified Resolved** via granular `failedFields` hash map. | **PARTIALLY SOUND WITH CRITICAL VULNERABILITY**: Granular error tracking prevents field B from clobbering field A's error, BUT `failedFields` is **not scoped by `reportId`** and is **never cleared on report change**. | ⚠️ **CONDITIONAL PASS**<br>(Cross-Report Contamination Bug Found) |
| **RS-21** (`.select('id')` Save Check vs RLS) | **False Positive / Verified Clean** (Current RLS policies are 100% symmetric). | **SOUND TODAY, BRITTLE ARCHITECTURAL COUPLING TOMORROW**: Current policies match, but `.select('id')` relies on `RETURNING id`, which evaluates under `SELECT` RLS. If report locking (`is_submitted = true`) restricts `SELECT`, valid updates falsely fail. | ⚠️ **ARCHITECTURAL WARNING**<br>(Coupled to SELECT RLS) |
| **RS-22** (Empty Form Blank Shield) | **Verified Resolved** via loading gate & Bengali error card. | **VERIFIED SOUND**: Form mounting is strictly gated on `!data || Object.keys(data).length === 0`. Transient network drops never render blank input fields. | ✅ **CONFIRMED RESOLVED** |
| **RS-23 / C03-01** (Keyboard Focus Collapse & Remounts) | **Verified Resolved** via mutable refs and decoupling `data`/`t` from `useEffect`. | **VERIFIED SOUND**: Keystroke blurs update context without re-triggering `fetchActiveReport` or setting `isLoading(true)`. Virtual keyboards stay open on mobile. | ✅ **CONFIRMED RESOLVED** |
| **RS-24** (Functional Retry All Queue) | **Verified Resolved**; iterates over `failedFields` and re-invokes `updateField`. | **SOUND IN ISOLATION, RACING UNDER CONCURRENCY**: `retryAllFailed` iterates over a static snapshot of `failedFields`. If a user manually edits a field while retry is sequentially awaiting 3G requests, stale snapshot values overwrite new edits. | ⚠️ **CONCURRENCY HAZARD** |
| **RS-25 / C04-01 / KI-009** (Unmount Flush & Mobile Exit) | **Hardened (95%)**; `dirtyRef` + unmount cleanup + `visibilitychange`. | **SUBSTANTIALLY SOUND, MOBILE TASK-KILL EDGE CASE**: Section tab transitions and accordion toggles are 100% safe. However, forceful mobile task-kill or camera launch during an unblurred edit drops in-flight `fetch` due to lack of `keepalive: true`. | 🟡 **SUBSTANTIALLY HARDENED**<br>(Keepalive Wrapper Needed) |
| **RS-26** (PostgREST Query Chaining Order) | **False Positive / Verified Clean**; chaining order does not alter SQL `WHERE`. | **VERIFIED SOUND**: PostgREST filter parameters serialize into URL query strings independent of builder chain order. | ✅ **FALSE POSITIVE CONFIRMED** |
| **KI-023 Trap 5 / Provider Placement** | Subagent A recommends moving `<ReportProvider>` to `report/layout.tsx`. | **ADVERSARIAL REJECTION (FALSE POSITIVE)**: Moving `<ReportProvider>` out of `RootLayout` creates artificial architectural churn. `UserDashboard` on `/` requires `useReport()`. Provider has ZERO mount side effects (~1KB heap). | ❌ **PROPOSAL REJECTED**<br>(Root Placement is Optimal) |
| **Submission Gate Integrity** (Unchecked Submit) | *Not evaluated by Subagent A.* | **CRITICAL DEFECT DETECTED**: `CommentsForm` allows checking `is_submitted = true` while saves are in flight (`pendingSavesCount > 0`) or while `failedFields` are present. Workers can submit incomplete reports. | 🚨 **CRITICAL NEW FINDING** |

---

## 2. False-Positive Discharge Table

| Issue / Proposal | Subagent A Assessment | Adversarial Reviewer Determination | Justification & Pre-Production Decision |
|:---|:---|:---|:---|
| **RS-26**: Chaining `.eq('category')` after `.select('id')` | Flagged as verify-first. | **DISCHARGED AS 100% FALSE POSITIVE** | In PostgREST / `@supabase/postgrest-js`, calling `.select('id')` and `.eq('category', ...)` returns a `PostgrestFilterBuilder`. The resulting HTTP query string `?report_id=eq.X&select=id&category=eq.Y` is parsed by PostgREST into PostgreSQL AST with zero syntax or semantic divergence. |
| **RS-21**: `.select('id')` false failure in live database | Flagged as risk in issue register. | **DISCHARGED AS FALSE POSITIVE IN PRE-PRODUCTION** | Direct SQL inspection of `pg_policies` on `pxdkvewaglagnfcqeckn` confirms that `report` and all 7 child tables have 100% identical `qual` expressions across `SELECT`, `UPDATE`, and `INSERT`. Authorized updates never report false failures today. |
| **Subagent A Recommendation 5.2.2**: Move `<ReportProvider>` to `src/app/report/layout.tsx` | Recommended once `user-dashboard.tsx` is decoupled. | **DISCHARGED AS ARCHITECTURAL PURISM / HIGH-RISK CHURN** | `<ReportProvider>` has **ZERO `useEffect` hooks, ZERO mount side effects, and ZERO background network polling**. Its memory footprint is ~1 KB. Hoisting at `RootLayout` enables `UserDashboard` (`/`) and `SectionSwitcher` (`/report/[section]`) to seamlessly share the exact same report cache. Moving it breaks `/`, forces duplicate data loaders, and violates `AGENTS.md` Rule 2 ("Favor simple, robust, high-density solutions over speculative abstraction layers"). |
| **RS-24**: Passive Error Dismissal | Documented as defect in RS register. | **DISCHARGED AS RESOLVED** | In [`src/components/report/auto-save-indicator.tsx#L30`](file:///d:/WebDev/report-submission/src/components/report/auto-save-indicator.tsx#L30), the button actively invokes `retryAllFailed()`, which executes sequential database writes for every entry in `failedFields`. |

---

## 3. Edge Case Mobile Network & Lifecycle Failure Scenarios

### Scenario 1: Cross-Report Data Contamination via Un-namespaced `failedFields` (CRITICAL)
- **Field Condition**: Field worker in Zone 4 edits their **June 2026** report on a spotty 3G cellular connection in rural Bangladesh.
- **The Failure Sequence**:
  1. User enters `"45"` into `report_header.total_members`.
  2. Mobile connection drops (CGNAT gateway timeout). PostgREST write fails.
  3. `updateField` populates [`report-context.tsx#L148-L158`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L148-L158):
     ```typescript
     failedFields["report_header::total_members"] = {
       name: "total_members",
       value: "45",
       section: "header",
       table: "report_header",
       error: "সংরক্ষণ ব্যর্থ হয়েছে"
     }
     ```
     *Notice: `failedFields` does NOT record `reportId`, and the key has NO report scoping!*
  4. Worker decides to switch to **July 2026** report from the dashboard (`/`).
  5. `loadReport(newReportId)` loads July's report.
  6. **`loadReport` NEVER CLEARS `failedFields`!** (Inspect [`report-context.tsx#L51-L84`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L51-L84)).
  7. July's report opens. The top indicator detects `Object.keys(failedFields).length > 0` and flashes:  
     `"১টি ফিল্ড সংরক্ষণ ব্যর্থ হয়েছে — আবার চেষ্টা করুন"`
  8. Worker assumes this failure belongs to July's report and taps **"আবার চেষ্টা করুন"** (Retry All).
  9. `retryAllFailed()` executes:
     ```typescript
     await updateField("total_members", "45", "header", "report_header")
     ```
  10. `updateField` uses the **currently active `reportId` (July)**!
  11. **Disaster**: June's failed number `"45"` is destructively written into July's report header in PostgreSQL!
- **Adversarial Fix**:
  1. Namespace `failedFields` keys with `reportId`: `${reportId}:${table}:${category || ''}:${name}`.
  2. In `loadReport(id)` and `setReportId(id)`, explicitly wipe or filter `failedFields` so that errors from Report A cannot cross-contaminate Report B.
  3. In `FailedFieldInfo`, store `reportId: number` and guard `retryAllFailed` with `if (item.reportId === currentReportId)`.

---

### Scenario 2: Unchecked Submission Gate during In-Flight Network Flushes (CRITICAL)
- **Field Condition**: Mobile worker rapidly completes Section 6 (`extras`), immediately navigates to Section 7 (`comments`), and checks the submission box.
- **The Failure Sequence**:
  1. In `extras-form.tsx`, worker enters `"12"`. Without blurring, worker taps "পরবর্তী পাতা" (Next).
  2. Next.js App Router unmounts `ExtrasForm`.
  3. `AutoSaveField` unmount cleanup invokes `persistRef.current()`, calling `updateField("extra_val", "12", ...)`.
  4. `setPendingSavesCount(c => c + 1)` increments. The PostgREST PATCH is sent over a high-latency 3G link (RTT ~1200ms).
  5. `CommentsForm` mounts. Worker immediately checks "রিপোর্ট সাবমিশন সম্পন্ন হয়েছে" (`report-submission-checkbox`).
  6. Look at [`src/components/report/sections/comments-form.tsx#L13-L18`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx#L13-L18):
     ```typescript
     const handleSubmissionToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
       const checked = e.target.checked;
       if (reportId) {
         await updateField("is_submitted", checked, "comment", "report");
       }
     };
     ```
  7. **There is ZERO check on `isSaving` (`pendingSavesCount > 0`) or `failedFields`!**
  8. `is_submitted: true` arrives and commits to PostgreSQL FIRST.
  9. 500ms later, the in-flight `extras` save fails due to a network packet drop, registering in `failedFields`.
  10. **Result**: The report is marked submitted and finalized in the database while Section 6 is missing data!
- **Adversarial Fix**:
  In `CommentsForm`, disable the submission checkbox when `isSaving` is `true` or `Object.keys(failedFields).length > 0`:
  ```tsx
  <input 
    type="checkbox" 
    checked={isSubmitted} 
    disabled={isSaving || Object.keys(failedFields).length > 0}
    onChange={handleSubmissionToggle} 
  />
  ```
  Render an explicit helper text: *"সকল তথ্য সঠিকভাবে সংরক্ষিত হওয়ার পর সাবমিট করুন"* when saves are in-flight or failed.

---

### Scenario 3: Rapid Double-Edit Out-of-Order Execution & Stale Error State
- **Field Condition**: Worker enters `"10"`, blurs, immediately re-focuses, types `"20"`, and blurs again on high-latency mobile edge.
- **The Failure Sequence**:
  1. Keystroke 1 (`"10"`) blurs $\rightarrow$ Request 1 sent (`PATCH value=10`).
  2. Keystroke 2 (`"20"`) blurs $\rightarrow$ Request 2 sent (`PATCH value=20`).
  3. Cellular handover causes Request 2 to arrive at Supabase before Request 1, or Request 1 experiences TCP retransmission.
  4. Request 2 commits `value = 20`.
  5. Request 1 arrives 400ms later and commits `value = 10`! Stale data clobbers fresh data.
  6. Alternatively, Request 1 fails with network timeout $\rightarrow$ `setFailedFields` records `value = "10"` as failed, even though Request 2 actually succeeded with `"20"`. The user sees a red error ring on a field that already has their desired `"20"` in the database.
- **Adversarial Fix**:
  Maintain a per-field monotonic timestamp / sequence counter (`saveTimestampsRef.current[fieldKey] = Date.now()`). When a save promise resolves or rejects, discard the result if `requestTime < saveTimestampsRef.current[fieldKey]`.

---

### Scenario 4: Mobile OS Task-Kill & Keepalive Gap during Virtual Keyboard Dismissal
- **Field Condition**: User types on Android Gboard, presses Android hardware "Back" button to close keyboard, and immediately switches to phone or camera.
- **The Failure Sequence**:
  1. On Android Chrome, dismissing the keyboard via the hardware back button **does NOT fire `blur`**. The `<input>` remains focused (`isFocused === true`).
  2. When the user switches apps, `visibilitychange` fires.
  3. `AutoSaveField`'s listener ([`auto-save-field.tsx#L125-L127`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L125-L127)) correctly triggers `persistRef.current()`.
  4. PostgREST `fetch()` is initiated.
  5. Android OS aggressively suspends Chrome or terminates the background tab to allocate RAM to the camera app.
  6. Standard `fetch()` calls without `keepalive: true` are terminated immediately upon process suspension.
- **Adversarial Fix**:
  Configure the Supabase browser client with a fetch wrapper that detects `document.visibilityState === 'hidden'` and injects `{ keepalive: true }` into the fetch options.

---

### Scenario 5: Future PostgREST `.select('id')` Failure on Submission Locking
- **Field Condition**: Pre-production or future migration introduces a workflow rule: *"Submitted reports are locked and cannot be viewed by field workers until unlocked by admin"* (`SELECT USING (is_submitted = false OR is_admin())`).
- **The Failure Sequence**:
  1. Worker checks `is_submitted = true` in `CommentsForm`.
  2. `updateField` runs:
     ```typescript
     supabase.from('report').update({ is_submitted: true }).eq('id', reportId).select('id')
     ```
  3. PostgreSQL executes the `UPDATE` successfully.
  4. PostgREST evaluates `RETURNING id` under the user's `SELECT` RLS policy.
  5. Because `is_submitted` is now `true`, the `SELECT` policy rejects the row! PostgreSQL returns `0` rows in `RETURNING`.
  6. PostgREST returns HTTP 200 with body `[]`.
  7. Client code evaluates `updated && updated.length > 0` $\rightarrow$ `false`!
  8. Client registers `failedFields["report::is_submitted"]` and reports failure!
  9. Worker is stuck in a permanent error loop, unable to clear the error.
- **Architectural Lesson**:
  Save confirmation should ideally inspect the command status or use `Prefer: count=exact` rather than coupling write verification exclusively to `SELECT` projections.

---

## 4. Cross-Segment Blast Radius Analysis

```
                                  ┌────────────────────────┐
                                  │     REPORT CONTEXT     │
                                  │ (updateField & State)  │
                                  └───────────┬────────────┘
                                              │
         ┌───────────────────┬────────────────┴───────────────────┬───────────────────┐
         ▼                   ▼                                    ▼                   ▼
┌─────────────────┐ ┌─────────────────┐                  ┌─────────────────┐ ┌─────────────────┐
│   SEGMENT 01    │ │   SEGMENT 03    │                  │   SEGMENT 05    │ │   SEGMENT 06    │
│  (Calculations) │ │(Input Normal.)  │                  │  (Root & Nav)   │ │ (Section Forms) │
└─────────────────┘ └─────────────────┘                  └─────────────────┘ └─────────────────┘
```

### 4.1 Impact on Segment 01 (Calculation Engines & Aggregation)
- **State Data Types**: In `report-context.tsx#L99-L123`, `setData` updates local context state optimistically. In `AutoSaveField#L97`, numeric fields pass strings:
  ```typescript
  const valueToSave = isNaN(parsed) ? "0" : String(Math.max(0, Math.round(parsed)));
  updateField(name, valueToSave, section, table, category);
  ```
  `nextData[name] = valueToSave` puts a **string** (`"15"`) into `data` in memory.
- **Blast Risk**: If any calculation helper (such as horizontal personal row sums in `personal-form.tsx` or city report loaders) performs naive addition (`row.col1 + row.col2`), JavaScript will evaluate `"15" + "10" = "1510"`!
- **Mitigation Requirement**: Segment 01 functions MUST strictly use `toFiniteNumber()` / `Number(val) || 0` when summing rows from `ReportContext`.

### 4.2 Impact on Segment 03 (Input Systems & Numeral Normalization)
- **Active Keystroke Preservation**: `AutoSaveField` checks `if (!isFocused && isMountedRef.current)` before syncing `localValue` with `currentVal`. If `ReportContext` is modified to trigger full data resets, this active typing shield is bypassed, clobbering keystrokes.
- **Bengali Digit Normalization**: `persist()` normalizes Bengali digits (`"১৫"` $\rightarrow$ `"15"`) before invoking `updateField`. `failedFields` stores normalized ASCII values, ensuring retry payloads are safe.

### 4.3 Impact on Segment 05 (Routing, Navigation & Fallback Demolition)
- **User Dashboard Coupling**: `src/components/dashboard/user-dashboard.tsx` is directly bound to `useReport()`. Any change to `ReportProvider` placement or `loadReport` signature breaks the application's root entry route `/`.
- **Canonical `reportId` URL Migration**: When Segment 05 implements `/report/[section]?reportId=42`, `SectionSwitcher` can eliminate period parameter parsing (`typeParam`, `monthParam`, `yearParam`) and rely solely on `reportId`.

### 4.4 Impact on Segment 06 (UI/UX Hierarchy & Section Forms)
- **CommentsForm Submission**: `CommentsForm` directly imports `useReport()` and calls `updateField("is_submitted", checked, "comment", "report")`. Hardening the submission gate (disabling checkbox while saving or failed) directly impacts Section 7's layout.
- **AutoSaveIndicator Density**: The indicator in `SectionLayout` is the sole visual indicator of save health during cross-section navigation.

---

## 5. Final Hardened Pre-Production Action Plan

Under `AGENTS.md` Rule 7, we eliminate application-layer shims and implement clean, high-density fixes:

### Priority 1: Namespace & Scope `failedFields` by `reportId` (CRITICAL)
- **Target File**: [`src/components/report/report-context.tsx`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx)
- **Action**:
  1. Update `FailedFieldInfo` interface to include `reportId: number`.
  2. Prefix `fieldKey` with `reportId`:
     ```typescript
     const fieldKey = `${reportId}:${table}:${category || ''}:${name}`
     ```
  3. In `loadReport(id: number)`, clear `failedFields` or filter out keys belonging to other reports:
     ```typescript
     setFailedFields(prev => {
       const filtered: Record<string, FailedFieldInfo> = {};
       for (const [k, v] of Object.entries(prev)) {
         if (v.reportId === id) filtered[k] = v;
       }
       return filtered;
     });
     ```
  4. In `retryAllFailed`, ensure updates only target the active `reportId`.

### Priority 2: Submission Gate Guard in `CommentsForm` (CRITICAL)
- **Target File**: [`src/components/report/sections/comments-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx)
- **Action**:
  1. Consume `isSaving` and `failedFields` from `useReport()`.
  2. Disable the `#report-submission-checkbox` when `isSaving` is true or `Object.keys(failedFields).length > 0`.
  3. Render an informative message when disabled:
     - If saving: `"তথ্য সংরক্ষণাধীন রয়েছে... অনুগ্রহ করে অপেক্ষা করুন"`
     - If failed: `"সংরক্ষণ ব্যর্থ হয়েছে এমন ফিল্ডগুলো পুনরায় চেষ্টা করে সংরক্ষণ সম্পন্ন করুন"`

### Priority 3: Per-Field Monotonic Save Sequencing
- **Target File**: [`src/components/report/report-context.tsx`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx)
- **Action**:
  1. Add a `latestSaveSeqRef = useRef<Record<string, number>>({})`.
  2. On each `updateField` call, increment sequence `const seq = (latestSaveSeqRef.current[fieldKey] || 0) + 1; latestSaveSeqRef.current[fieldKey] = seq;`.
  3. When PostgREST response returns, verify `if (latestSaveSeqRef.current[fieldKey] !== seq) return;` to discard out-of-order responses from race conditions.

### Priority 4: Keepalive Fetch Wrapper for Mobile Exit Resilience
- **Target File**: [`src/utils/supabase/client.ts`](file:///d:/WebDev/report-submission/src/utils/supabase/client.ts)
- **Action**:
  1. Wrap the default `fetch` passed to `createBrowserClient` with `keepalive: true` when `typeof document !== 'undefined' && document.visibilityState === 'hidden'`.

### Priority 5: Zero Dead-Weight Cleanup
- **Target File**: [`src/app/report/[section]/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/[section]/page.tsx#L6)
- **Action**:
  1. Remove unused `ReportProvider` from the import list on line 6.
  2. Retain `<ReportProvider>` at `src/app/layout.tsx` to preserve `UserDashboard` stability.

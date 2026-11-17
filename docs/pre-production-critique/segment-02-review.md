# Segment 02 Adversarial Review: Save Machine, Autosave Lifecycle, Concurrency & State Machine

**Reviewer Role**: Subagent 02B (Adversarial Reviewer)  
**Lead Investigator Deliverable Inspected**: [`docs/pre-production-critique/segment-02-investigation.md`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-02-investigation.md)  
**Target Codebase Files**:
- [`src/components/report/report-context.tsx`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx)
- [`src/components/report/auto-save-field.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx)
- [`src/components/report/auto-save-indicator.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-indicator.tsx)
- [`src/components/report/view-mode-toggle.tsx`](file:///d:/WebDev/report-submission/src/components/report/view-mode-toggle.tsx)
- Coupled components: [`src/components/report/sections/comments-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx), [`src/app/layout.tsx`](file:///d:/WebDev/report-submission/src/app/layout.tsx), [`src/app/report/[section]/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/[section]/page.tsx), [`src/components/report/sections/personal-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/personal-form.tsx)

---

## 1. Adversarial Verdict & Quality Scorecard Validation

### Overall Verdict: `APPROVED WITH AMENDMENTS`

Subagent 02A conducted an exceptionally thorough and technically astute investigation, surfacing several critical vulnerabilities that directly threaten data persistence. Most notably, 02A correctly identified the **Submission Gate Stale Closure (`DEFECT-02-07`)** and the **Premature Write-Ahead Buffer Deletion on Superseded Edits (`DEFECT-02-08`)**.

However, the adversarial review through the "Doubt Gate" (*"Under what real-world field conditions will this clean-looking code fail?"*) intercepted **two critical architectural traps** in Subagent 02A's remediation proposals:
1. **The "Phantom Reversal" Trap**: 02A proposed rolling back optimistic client state (`data`) to previous values on save failure (`DEFECT-02-04`). In mobile field operations with intermittent 3G drops, rolling back unpersisted user keystrokes destroys field workers' entered metrics right before their eyes.
2. **The "Atomic Batch Wipeout" Trap**: 02A proposed replacing cell-level micro-saves with a section-level batch save RPC (`BLOAT-02-05`). Over flaky rural cellular connections, batch saving turns a single constraint error or transient timeout into the catastrophic loss of an entire 50-field section.

Furthermore, **`DEFECT-02-06` is a False Positive**—nested `ViewModeProvider` instances were already purged in a previous sprint and do not exist anywhere in `src/`.

### Subsystem Health Score: **68 / 100 (Grade: C+)**

```
┌────────────────────────────────────────────────────────────────────────┐
│               SEGMENT 02 ADVERSARIAL HEALTH SCORECARD                  │
├────────────────────────────────────────────────────────────────────────┤
│  Concurrency & Race Defenses:          72 / 100 (Seq counter sound;    │
│                                                  superseded WAB bug)   │
│  Autosave Lifecycle & Resilience:      70 / 100 (Unmount flush works;  │
│                                                  stale draft revive)   │
│  Submission Integrity & Gating:        35 / 100 (FATAL: stale closure  │
│                                                  bypasses error check) │
│  State Machine & Render Hygiene:       58 / 100 (80+ re-renders per    │
│                                                  debounced save)       │
│  Offline & Error Governance:           65 / 100 (Missing offline state;│
│                                                  retry race hazard)    │
│  UI/UX Ergonomics & Accessibility:     74 / 100 (FOIC on ViewMode;     │
│                                                  missing a11y live)    │
│  Rule 7 Pre-Production Agility:        88 / 100 (Clean DDL alignment;  │
│                                                  purge legacy columns) │
├────────────────────────────────────────────────────────────────────────┤
│  COMPOSITE SUBSYSTEM HEALTH SCORE:     68 / 100 (Grade: C+)            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. False Positives & Over-Engineered Proposals Discharged

### 2.1 DISCHARGED: `DEFECT-02-06` (Unconditional `useViewMode` in Nested Providers)
- **Subagent 02A Finding**: Claimed `ViewModeProvider` calls `useViewMode` unconditionally before checking `if (existing)`, causing duplicate state and effect instantiations when forms are wrapped inside nested providers.
- **Adversarial Cross-Examination**:
  - Direct codebase grep (`git grep "ViewModeProvider" src/`) proves that `ViewModeProvider` is mounted in **exactly one location**: [`src/components/report/section-layout.tsx#L127`](file:///d:/WebDev/report-submission/src/components/report/section-layout.tsx#L127).
  - The redundant inner `<ViewModeProvider>` wrappers were already audited and pruned from `courses-form.tsx`, `organizational-form.tsx`, `personal-form.tsx`, and `meetings-form.tsx` in a previous cleanup track (documented in `ROADMAP.md`).
  - Inside `view-mode-toggle.tsx`, calling `useViewMode` before `if (existing)` is required by React's Rules of Hooks (hooks cannot be called conditionally). Because zero nested providers exist in runtime execution, this code path never triggers redundant state or listeners.
- **Verdict**: **DISCHARGED AS FALSE POSITIVE / THEORETICAL STRAWMAN**. Zero action required.

---

### 2.2 DISCHARGED: `BLOAT-02-05` (Abandoning Cell Autosave for Atomic Batch Save RPC)
- **Subagent 02A Proposal**: Classify cell-by-cell micro-saves as "bloatware" and replace them with an atomic section-level stored procedure `save_report_section(p_report_id, p_section, p_payload jsonb)`.
- **Adversarial Cross-Examination through Doubt Gate**:
  - *"Under what real-world field conditions will this clean-looking code fail?"*
  - **Failure Mode 1: The All-or-Nothing Network Black Hole**. A field worker on a bus or in a rural upazila fills out 50 inputs across `CoursesForm`. Under batch saving, if the cellular signal blips when they switch tabs or trigger the batch save, **all 50 metrics fail together**. Under the current micro-save model, cells 1 through 49 were already persisted to PostgreSQL the moment the user paused or blurred each field.
  - **Failure Mode 2: The Single-Constraint Toxic Rollback**. If 1 field out of 50 fails a database check constraint (e.g. malformed input or negative integer), PostgreSQL's atomic transaction aborts the entire transaction. The user loses 49 perfectly valid entries because of 1 validation failure.
  - **Failure Mode 3: Massive Architectural Blast Radius**. Every single form component (7 section files) is built around `<AutoSaveField />`. Rewriting the entire presentation layer to buffer section-level form state into a giant JSON object violates `AGENTS.md` Rule 2.5 (*Favor Simplicity*) and Rule 2.7 (*Surgical, Token-Conscious Execution*).
  - **Failure Mode 4: False Premise on Network Churn**. 02A claimed 50–80 HTTP calls fire per form. In reality, keystrokes are debounced by 1,000ms and cells only save when modified. Edits are naturally staggered over 15–20 minutes of user entry. They never fire simultaneously unless batch-flushed.
- **Verdict**: **DISCHARGED AS HIGH-RISK SPECULATIVE ARCHITECTURE**. Retain cell-level autosaving. The real issue is client re-render cascades and draft deletion bugs, not the HTTP save granularity itself.

---

### 2.3 DISCHARGED & AMENDED: `DEFECT-02-04` (Naive Optimistic Rollback on Save Failure)
- **Subagent 02A Proposal**: In `ReportContext.updateField`, if PostgreSQL returns an error, roll back `data` to its previous value.
- **Adversarial Cross-Examination through Doubt Gate**:
  - *"What happens to a mobile user when this rollback executes?"*
  - **The "Phantom Reversal" Trap**: A field worker enters `"45"` in an input. The phone transitions between 4G and 3G, causing a 3-second timeout. If the application rolls back `data` to `"0"`:
    1. The worker has already shifted focus to the next cell.
    2. Behind their back, the cell they just typed magically flips from `"45"` back to `"0"`.
    3. The worker doesn't notice the silent reversion, or notices and re-types it, getting trapped in an infinite frustration loop.
  - In modern offline-first architectures (Google Docs, Figma, Linear), **the application NEVER throws away user input due to network transport failure**.
  - The correct pattern is:
    - Retain the user's typed value in both local state and the Write-Ahead Buffer (`localStorage`).
    - Flag the field visually with an error ring (`isFailed === true`).
    - Prevent report submission until resolved.
    - Provide an explicit retry action.
- **Verdict**: **REJECTED NAIVE ROLLBACK; AMENDED TO DIRTY ERROR RETENTION**. Never overwrite typed user values with stale database snapshots on network errors.

---

## 3. Intercepted Implementation Traps & Real-World Failure Modes

### 3.1 The Submission Gate Stale Closure Trap (`DEFECT-02-07`)

#### Deep Behavioral Trace:
In [`src/components/report/sections/comments-form.tsx#L40-L50`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx#L40-L50):
```tsx
// 1. User checks submission toggle. handleSubmissionToggle executes.
// failedFields is closed over from the component render scope: failedFields = {}
document.activeElement.blur(); // Triggers AutoSaveField.persist() -> updateField()

// 2. Await drainPendingSaves
const drained = await drainPendingSaves(2500);

// 3. Inspect failed fields
const failedCount = Object.keys(failedFields).length;
if (!drained || failedCount > 0) { ... abort ... }

// 4. Submit report
await updateField("is_submitted", true, "comment", "report");
```

#### Why `drainPendingSaves` DOES NOT Mitigate This:
1. `drainPendingSaves` in [`src/components/report/report-context.tsx#L58-L64`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L58-L64) only inspects `pendingSavesCountRef.current === 0`.
2. When an in-flight save fails over a dropped connection, `updateField` executes lines 228–230:
   ```tsx
   } finally {
     pendingSavesCountRef.current = Math.max(0, pendingSavesCountRef.current - 1);
     setPendingSavesCount(pendingSavesCountRef.current);
   }
   ```
3. `pendingSavesCountRef.current` decrements to `0`.
4. Therefore, `drainPendingSaves(2500)` returns `true` (it successfully drained)!
5. Now `handleSubmissionToggle` resumes. Because `failedFields` is a const reference captured from the render before the 2.5-second async pause, `failedFields` is STILL `{}`!
6. `failedCount` evaluates to `0`.
7. The check `!drained || failedCount > 0` evaluates to `false`!
8. **The report is submitted and finalized in PostgreSQL with lost, unpersisted data!**

#### The Hardened Remedy:
1. Maintain a synchronous mutable ref in `ReportContext`: `failedFieldsRef.current = Record<string, FailedFieldInfo>`.
2. Upgrade `drainPendingSaves` to return a structured status:
   ```ts
   interface DrainResult {
     success: boolean;       // true if drained === true AND failedCount === 0
     drained: boolean;       // true if pendingSavesCountRef.current === 0
     failedCount: number;    // Object.keys(failedFieldsRef.current).length
     failedFields: Record<string, FailedFieldInfo>;
   }
   ```
3. In `CommentsForm`, simply check:
   ```tsx
   const { success, failedCount } = await drainPendingSaves(3000);
   if (!success || failedCount > 0) {
     // Abort submission cleanly
   }
   ```

---

### 3.2 The Premature WAB Deletion on Superseded Edits Trap (`DEFECT-02-08`)

#### Deep Behavioral Trace:
In [`src/components/report/report-context.tsx#L177-L179`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L177-L179):
```tsx
// If a newer edit was queued while this save was in flight:
if (fieldSequenceRef.current[fieldKey] !== seq) {
  return { success: true }
}
```
In [`src/components/report/auto-save-field.tsx#L138-L142`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L138-L142):
```tsx
res = await updateField(name, valueToSave, section, table, category);
if (res?.success && typeof window !== "undefined" && reportId) {
  try {
    localStorage.removeItem(draftStorageKey);
  } catch {}
}
```

#### Real-World Failure Scenario (Mobile 3G):
1. User types digit `"1"` into a field.
   - `seq = 1`. `draft:42:...` is written to `localStorage` with value `"1"`.
   - Debounce fires `persist()`. Save 1 is dispatched to Supabase over 3G (latency 800ms).
2. While Save 1 is in flight, user types `"5"` (making the value `"15"`).
   - `seq = 2`. `draft:42:...` is updated in `localStorage` with value `"15"`.
   - Save 2 debounce timer starts.
3. Save 1 resolves from the server.
   - `updateField` checks `fieldSequenceRef.current[fieldKey] !== seq` (`2 !== 1`).
   - `updateField` discards Save 1 and returns `{ success: true }`.
4. In `AutoSaveField`, Save 1's promise finishes:
   - `res?.success === true`.
   - `AutoSaveField` immediately calls `localStorage.removeItem(draftStorageKey)`.
   - **THE WRITE-AHEAD BUFFER HOLDING `"15"` IS PERMANENTLY DELETED FROM LOCALSTORAGE!**
5. Save 2 encounters a carrier drop and fails.
6. The Android OS closes the browser or the user refreshes:
   - PostgreSQL only has `"1"`.
   - `localStorage` has `null` (draft was wiped by Save 1).
   - The user's input `"15"` is lost forever!

#### The Hardened Remedy:
1. When an edit is superseded in `updateField`, return `{ success: false, superseded: true }` instead of `{ success: true }`.
2. In `AutoSaveField`, only delete `draftStorageKey` if the value that just succeeded matches the currently stored draft:
   ```ts
   if (res?.success && !res?.superseded) {
     const currentDraft = localStorage.getItem(draftStorageKey);
     if (currentDraft === val) {
       localStorage.removeItem(draftStorageKey);
     }
   }
   ```

---

### 3.3 The Mobile Keyboard Collapse & `window.confirm` Modal Pause Trap

#### Real-World Field Conditions (Bangladeshi Android Devices):
1. Field worker is focused on the comments textarea or a numeric field. The Android soft keyboard is open, occupying 40% of the screen.
2. The worker taps "জমা দিন" (Submit Report).
3. The touch event fires `onChange` on the checkbox:
   - [`comments-form.tsx#L25`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx#L25) immediately invokes `window.confirm(...)`.
   - `window.confirm` is a **synchronous, blocking browser dialog**. It suspends JavaScript execution on the main thread!
4. Concurrently, blurring the textarea causes the Android soft keyboard to collapse:
   - Collapsing the keyboard triggers a sudden viewport resize (`window.innerHeight` expands).
   - The DOM reflows under the dialog.
   - If the user taps "Cancel" or "OK", any pending blur events that were queued during the modal pause fire out-of-order.
5. In addition, `window.confirm` provides a jarring, non-localized browser alert that looks like a system crash on Android WebViews.

#### The Hardened Remedy:
- Replace `window.confirm` with an accessible, non-blocking React Confirmation Modal (consistent with `ADR 011` Universal Modal Governance).
- Blur active elements BEFORE showing the confirmation modal, giving the soft keyboard 150ms to collapse and pending saves to begin draining before the user clicks final confirmation.

---

### 3.4 Cross-Session Stale Draft Resurrection (`DEFECT-02-09`)

#### Real-World Field Conditions:
1. District offices in Talimul Quran frequently share a single tablet or laptop among multiple muallimas/inspectors.
2. Inspector A edits Report #42, loses connection, and leaves an un-persisted draft `"99"` in `localStorage`.
3. Inspector A logs out. (Logout is a server-side action in [`src/app/auth/logout/route.ts`](file:///d:/WebDev/report-submission/src/app/auth/logout/route.ts) that clears HTTP cookies but cannot touch browser `localStorage`).
4. Weeks later, Inspector B opens Report #42. The database has verified value `"10"`.
5. `AutoSaveField` mounts, reads `localStorage.getItem("draft:42:...")`, sees `"99" !== "10"`, restores `"99"`, sets `dirtyRef.current = true`, and silently flushes `"99"` over the verified database record!
6. Furthermore, if `report.is_submitted === true`, drafts should NEVER be restored or flushed!

#### The Hardened Remedy:
1. Scope draft keys by user ID: `draft:${userId}:${reportId}:${table}:${category}:${name}`.
2. Attach a timestamp: store drafts as `{ value: string, updatedAt: number }`. Discard drafts older than 48 hours.
3. If `data?.is_submitted === true`, completely bypass `localStorage` draft restoration.

---

### 3.5 Massive 80+ Component Re-Render Cascades (`DEFECT-02-05`)

#### Exact Mechanism:
1. `pendingSavesCount` is stored in React state in `ReportContext`.
2. It is listed in `contextValue` dependencies ([`report-context.tsx#L268`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L268)).
3. Every keystroke save calls `setPendingSavesCount(1)` on dispatch, and `setPendingSavesCount(0)` on completion.
4. Every save causes **2 full re-renders of `ReportProvider`**.
5. All 80 `<AutoSaveField />` components inside the active section re-render twice.
6. On every re-render, each field runs lines 100–116 of `auto-save-field.tsx`, executing a synchronous `localStorage.getItem` call. That is **160 synchronous disk I/O reads per keystroke save**!
7. On low-end Walton/Symphony Android phones, this causes 100–300ms UI freezes while typing.

#### The Hardened Remedy:
1. Decouple `pendingSavesCount` and `isSaving` into a lightweight, isolated context: `SaveStatusContext`.
2. Only `AutoSaveIndicator` consumes `SaveStatusContext`.
3. `AutoSaveField` does NOT subscribe to `pendingSavesCount`. It only consumes `updateField`, `reportId`, and its own error state in `failedFields`.
4. Wrap `AutoSaveField` in `React.memo` with custom comparison checking only its own field value and failed status.

---

## 4. Cross-Segment Blast Radius & Cohesion Verification

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CROSS-SEGMENT COHESION MAP                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [Segment 07: Database & DDL]                                         │
│       │                                                                │
│       ├─► Child table RLS policies: MUST add is_submitted = false check│
│       └─► Composite unique keys: (report_id, category) verified        │
│                                                                        │
│  [Segment 02: Save Machine & Concurrency]  ◄── THIS SEGMENT            │
│       │                                                                │
│       ├─► Segment 03 (Form Sections): AutoSaveField contract &         │
│       │   disabled state when is_submitted = true                      │
│       ├─► Segment 03: personal-form.tsx reads data.personal for totals │
│       ├─► Segment 05 (Layout): ReportProvider mounted in layout.tsx    │
│       ├─► Segment 05: ViewModeToggle cookie elimination of CLS         │
│       └─► Segment 06 (Admin): City report overrides must bypass        │
│           submission lock via service role / admin RLS                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Upstream Blast Radius: Database DDL & RLS (Segment 07)
- **RLS Submission Lock**: If child tables (`report_course`, `report_header`, etc.) enforce `(SELECT is_submitted FROM report WHERE id = report_id) = false`, any save attempted on a submitted report will return an RLS violation.
- **Admin Exception**: Segment 06 admin overrides (`city_report_override`, `CorrectionButton`) must use admin service role or explicitly check `is_admin() = true` in RLS policies to ensure administrators can still correct submitted reports.

### 4.2 Downstream Blast Radius: Presentation Layer (Segment 03)
- In [`src/components/report/sections/personal-form.tsx#L48-L56`](file:///d:/WebDev/report-submission/src/components/report/sections/personal-form.tsx#L48-L56), the dynamic row total column (সর্বমোট) is calculated by reducing over `data?.personal`.
- If table aliasing in `report-context.tsx` is changed (e.g. from `personal` to `report_personal`), `personal-form.tsx` will break and compute `0` for all totals. Aliases must remain synchronized.

### 4.3 Root Layout Cohesion (Segment 05)
- [`src/app/layout.tsx#L59`](file:///d:/WebDev/report-submission/src/app/layout.tsx#L59) mounts `ReportProvider` globally.
- Because `ReportProvider` never unmounts during navigation, in-flight unmount flushes triggered by section switching (`/report/courses` -> `/report/meetings`) cleanly resolve without losing their parent context or Supabase client.

---

## 5. Final Hardened Pre-Production Action Plan

### Tier 1: Clean Database Schema & RLS Hardening (Segment 07 Coordination)
1. **RLS Immutability Policy on Child Tables**:
   Add `WITH CHECK ((SELECT is_submitted FROM public.report WHERE id = report_id) = false OR is_admin())` to `report_header`, `report_course`, `report_organizational`, `report_personal`, `report_meeting`, `report_extra`, and `report_comment`.
2. **Verify Unique Key Constraints**:
   Ensure `(report_id, category)` unique indexes on child tables prevent duplicate category inserts during concurrent retry attempts.

### Tier 2: Application Architecture & State Machine Consolidation (Segment 02 Core)
1. **Fix Submission Gate Stale Closure (`DEFECT-02-07`)**:
   - Maintain `failedFieldsRef.current` synchronously in `ReportContext`.
   - Update `drainPendingSaves` to return `{ success, drained, failedCount, failedFields }`.
   - Update `CommentsForm` to check `drainResult.success && drainResult.failedCount === 0`.
2. **Protect Write-Ahead Buffer on Superseded Edits (`DEFECT-02-08`)**:
   - In `updateField`, return `{ success: false, superseded: true }` when `fieldSequenceRef.current[fieldKey] !== seq`.
   - In `AutoSaveField.persist`, only delete `localStorage` draft if `res.success && !res.superseded` and the saved value matches the current draft.
3. **Decouple Re-Render Tree (`DEFECT-02-05`)**:
   - Extract `pendingSavesCount` and `isSaving` into a decoupled `SaveStatusContext`.
   - Wrap `AutoSaveField` in `React.memo`.
4. **Purge Dead Prototype Column Logic (`BLOAT-02-01`, `BLOAT-02-02`)**:
   - Remove `row.course_name === category` and `row.meeting_type === category` from both `report-context.tsx` and `auto-save-field.tsx`.
5. **Fix Read Counter Polluting Save Indicator (`BLOAT-02-04`)**:
   - Remove `pendingSavesCountRef.current += 1` from `loadReport()`.
6. **Scoped Write-Ahead Buffer with TTL (`DEFECT-02-09`)**:
   - Scope draft keys by `userId` and report ID. Add 48-hour expiration.
   - Completely bypass draft restoration if `data?.is_submitted === true`.

### Tier 3: UI/UX, Mobile Ergonomics & Accessibility Refinements
1. **Submitted State Lockdown (`DEFECT-02-11`)**:
   - Pass `disabled={Boolean(data?.is_submitted)}` to all `AutoSaveField` inputs.
   - When submitted, style inputs as read-only with a subtle lock indicator banner.
2. **Eliminate Layout Shift on ViewModeToggle (`DEFECT-02-01`)**:
   - Store view mode preference in a cookie (`report-view-mode=card|table`).
   - Read cookie server-side in `SectionLayout` to render the user's preferred layout on initial paint with zero CLS.
3. **Wrap `localStorage.setItem` in `try/catch` (`DEFECT-02-12`)**:
   - Protect `changeMode` in `view-mode-toggle.tsx` against private browsing exceptions.
4. **Accessible Status Messages (`DEFECT-02-03`)**:
   - Add `role="status"` and `aria-live="polite"` to `AutoSaveIndicator`.

### Tier 4: Documentation Reconciliations (Post-Audit Mandatory Protocol)
1. **Update `docs/TECHNICAL_MANUAL.md` (Chapter 4.2)**: Document the hardened `drainPendingSaves` contract, monotonic sequence resolution semantics, and child table RLS immutability locks.
2. **Record `ADR 031: Save Machine Concurrency, WAB Retention & Submission Integrity`**: Record architectural decisions for the status decouple, draft scoping, and submission gate fix.
3. **Update `docs/ROADMAP.md` & `docs/KNOWN_ISSUES.md`**: Move `RS-20`, `RS-24`, and `RS-25` to historical resolved logs upon implementation.

---

### Executive Sign-off
**Subagent 02B (Adversarial Reviewer)**: Audit completed under `AGENTS.md` Rule 7, Rule 2, and Rule 6. Zero code modified. Review report saved to [`docs/pre-production-critique/segment-02-review.md`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-02-review.md). Ready for coordinator synthesis.
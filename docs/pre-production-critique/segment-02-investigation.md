# Segment 02 Investigation Report: Save Machine, Autosave Lifecycle, Concurrency & State Machine

**Target Files Audited**:
- [`src/components/report/report-context.tsx`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx)
- [`src/components/report/auto-save-field.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx)
- [`src/components/report/auto-save-indicator.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-indicator.tsx)
- [`src/components/report/view-mode-toggle.tsx`](file:///d:/WebDev/report-submission/src/components/report/view-mode-toggle.tsx)
- Coupled context files: [`src/components/report/sections/comments-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx), [`src/app/report/[section]/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/[section]/page.tsx), [`src/components/report/section-layout.tsx`](file:///d:/WebDev/report-submission/src/components/report/section-layout.tsx)

**Target Documentation Audited**:
- `docs/TECHNICAL_MANUAL.md` (Chapter 4.2 & 4.4)
- `docs/ADR/005-hybrid-state-persistence-and-compact-view-toggle-architecture.md`
- `docs/ADR/015-sprint-1-save-integrity-and-input-normalization.md`
- `docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md`
- `docs/ADR/020-track-1-quick-wins-and-input-normalization.md`
- `docs/ADR/026-behavioral-stability-unmount-dirty-flush-role-hierarchy-and-foic-elimination.md`
- `docs/ADR/028-track-2-core-save-machine-concurrency-and-numeral-normalization.md`
- `docs/KNOWN_ISSUES.md` (`KI-008`, `KI-009`, `KI-014`, `RS-20`, `RS-24`, `RS-25`)

---

## 1. Executive Scorecard & Segment Quality Assessment

### Overall Letter Grade: C+

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEGMENT 02 ARCHITECTURAL SCORECARD                  │
├────────────────────────────────────────────────────────────────────────┤
│  Concurrency & Race Defenses:          B- (Monotonic seq counter works, │
│                                           superseded WAB deletion bug) │
│  Autosave Lifecycle & Resilience:      C+ (Unmount flush works, but     │
│                                           no rollback on fail)         │
│  State Machine & Context Hygiene:      D+ (80+ component re-render     │
│                                           cascades, load count poll)   │
│  Submission Integrity & Pre-Flight:    F  (Stale closure bypasses       │
│                                           failed save checks!)         │
│  Offline & Error Governance:           C- (Indicator missing offline    │
│                                           state, retry values stale)   │
│  UI/UX Ergonomics & Accessibility:     C  (FOIC on view mode, missing   │
│                                           a11y live regions, <44px hit)│
│  Rule 7 Pre-Production Agility:        D  (Cell-by-cell HTTP churn     │
│                                           compensating for missing RPC)│
└────────────────────────────────────────────────────────────────────────┘
```

### Executive Summary
Segment 02 contains several sophisticated, well-intentioned client-side concurrency safeguards implemented across Tracks 1–4 (notably the per-field monotonic sequence counter `fieldSequenceRef`, composite error scoping `${reportId}:${table}:${category}:${name}`, and the `dirtyRef` unmount flush). However, exhaustive line-by-line inspection reveals that the save machine has become an over-engineered, brittle client-side fortress built to compensate for the lack of atomic server-side transactions.

Most critically, the investigation uncovered a **catastrophic silent submission bypass (`CRIT-02-01`)**: `CommentsForm` checks `failedFields` through a stale lexical closure after awaiting `drainPendingSaves(2500)`. If an in-flight save fails during the drain, the submission proceeds regardless, finalizing incomplete reports with missing data. Furthermore, superseded sequence resolutions return `{ success: true }`, which prematurely wipes the `localStorage` Write-Ahead Buffer (`CRIT-02-02`), and failed updates never roll back optimistic state in `ReportContext` (`CRIT-02-03`). The entire client also re-renders 80+ input fields on every debounced keystroke save because `AutoSaveField` is unmemoized and consumes global context (`PERF-02-01`).

Under **`AGENTS.md` Rule 7 (Pre-Production Agility)**, the team must recognize that running ~80 individual HTTP PATCH calls over unstable Bangladeshi 3G networks is a design anti-pattern. A single atomic section-save RPC (`save_report_section`) can replace dozens of complex client synchronization refs while providing ironclad PostgreSQL ACID guarantees.

---

## 2. Rule 7 Pre-Production Bloatware & Legacy Shenanigans Register

| Ref ID | File & Line | Description | Real-World Failure Mode | Clean Pre-Production DDL/Architecture Remedy |
|:---|:---|:---|:---|:---|
| **BLOAT-02-01** | [`report-context.tsx#L153-L154`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L153-L154) | Dead prototype column checks `course_name === category` and `meeting_type === category` in optimistic `setData` mapper. | Unreachable code that masks the canonical database column contract. If PostgreSQL child tables used `course_name`, the subsequent query `.eq('category', category)` ([line 168](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L168)) would fail anyway. | Purge both dual-column clauses. Enforce strict canonical `row.category === category` across all 5 child tables. |
| **BLOAT-02-02** | [`auto-save-field.tsx#L60-L61`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L60-L61) | Dead prototype column checks `item.course_name === category` and `item.meeting_type === category` in `getInitialValue()`. | Same as BLOAT-02-01. Redundant branching executed across 80+ fields on every context state update. | Purge both prototype conditions; match purely on `item.category === category`. |
| **BLOAT-02-03** | [`report-context.tsx#L81-L90`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L81-L90), [`#L143-L147`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L143-L147) | Inconsistent table-to-property aliasing (`courses:report_course(*)` vs `meeting:report_meeting(*)` vs `extra:report_extra(*)`). | Forces complex `if/else` translation chains (`if (table === 'report_course') arrayKey = 'courses'`) across both `report-context.tsx` and `auto-save-field.tsx`. | Standardize PostgREST select query aliases on exact table suffixes or exact singular table names matching database DDL. |
| **BLOAT-02-04** | [`report-context.tsx#L75-L76`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L75-L76), [`#L109-L110`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L109-L110) | `loadReport()` increments `pendingSavesCountRef.current += 1`. | Causes `AutoSaveIndicator` to flash "সংরক্ষণ হচ্ছে..." (Saving...) when simply reading data, and pollutes save concurrency drain loops. | Remove save counter incrementing from `loadReport`. Load operations already have dedicated `isLoading` state in `SectionSwitcher`. |
| **BLOAT-02-05** | Entire Save Machine (`report-context.tsx` & `auto-save-field.tsx`) | Cell-by-cell micro-optimistic HTTP PATCH calls over cellular networks. | Firing 50–80 independent HTTP calls per form section over 3G cellular connections causes network starvation, battery drain, and out-of-order execution risk. | Replace client-side micro-saves with section-level atomic updates or a dedicated PostgreSQL stored procedure `save_report_section`. |

---

## 3. 5-Layer Behavioral & Functional Defect Catalog (`WEB-001`–`WEB-014`)

### 3.1 Layer 1: DOM & Matrix UI Defect Catalog

#### `DEFECT-02-01` (`WEB-010`): Flash of Incorrect View (FOIC) & Cumulative Layout Shift (CLS) on `ViewModeToggle`
- **Location**: [`src/components/report/view-mode-toggle.tsx#L15-L23`](file:///d:/WebDev/report-submission/src/components/report/view-mode-toggle.tsx#L15-L23)
- **Root Cause**: `useViewMode` hardcodes initial state to `useState<ViewMode>(defaultMode)` (`"card"`). A post-mount `useEffect` reads `localStorage.getItem("report-view-mode")` and calls `setViewMode("table")`.
- **Failure Conditions**: Any user who previously selected Table View visits a section form (`CoursesForm`, `OrganizationalForm`, `PersonalForm`, `MeetingsForm`). The browser first renders and paints 8 large Card accordions, then switches after hydration to a 900px-wide data table.
- **Impact**: High visual jank, layout shift (CLS), and wasted render cycles on mobile and tablet devices.

#### `DEFECT-02-02` (`WEB-011`): Mobile Touch Target Floor Violations (< 44px) on Form Inputs
- **Location**: [`src/components/report/auto-save-field.tsx#L234`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L234), [`#L272`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L272)
- **Root Cause**: `tableMode` inputs enforce `h-9` (36px). Inline inputs enforce `h-10` (40px). Both fall below the WCAG 2.2 AA touch target minimum of 44px x 44px.
- **Failure Conditions**: Mobile field workers entering numeric data on 360px–390px screens experience accidental touch misses or focus jumps to adjacent cells.
- **Impact**: High friction for non-tech-savvy field workers operating in mobile field conditions.

#### `DEFECT-02-03` (`WEB-012`): Screen Reader Blind Spot in `AutoSaveIndicator`
- **Location**: [`src/components/report/auto-save-indicator.tsx#L11-L53`](file:///d:/WebDev/report-submission/src/components/report/auto-save-indicator.tsx#L11-L53)
- **Root Cause**: None of the indicator containers contain `aria-live="polite"`, `role="status"`, or accessible status text.
- **Failure Conditions**: Visually impaired users or screen reader operators receive zero feedback when data is actively saving, successfully persisted, or when a network save fails.
- **Impact**: Accessibility compliance violation (WCAG 4.1.3 Status Messages).

---

### 3.2 Layer 2: Client State & Context Defect Catalog

#### `DEFECT-02-04` (`WEB-008`): Stale Optimistic State Retention on Database Save Failure (Zero Rollback)
- **Location**: [`src/components/report/report-context.tsx#L132-L160`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L132-L160), [`#L181-L206`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L181-L206)
- **Root Cause**: `updateField` mutates `data` optimistically via `setData(prev => ...)`. If PostgreSQL returns an error (or updates 0 rows), `updateField` registers `failedFields`, but **never rolls back `data` to its previous value**.
- **Failure Conditions**:
  1. User edits a field from `"10"` to `"25"`. Optimistic `setData` updates memory to `"25"`.
  2. The network fails or PostgreSQL rejects the write (`CHECK col >= 0`).
  3. `data` in `ReportContext` retains `"25"`.
  4. In `AutoSaveField`, `getInitialValue()` now returns `"25"`.
  5. Because `localValue === getInitialValue()`, `val !== initial` evaluates to `false` in `persist()`.
  6. The client assumes the field is clean and refuses to auto-save future attempts until manual page reload!
- **Impact**: Silent state desynchronization between client memory and database storage.

#### `DEFECT-02-05` (`WEB-005`): Massive 80+ Component Re-Render Cascades on Every Debounced Save
- **Location**: [`src/components/report/report-context.tsx#L248-L279`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L248-L279), [`src/components/report/auto-save-field.tsx#L33`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L33)
- **Root Cause**: `pendingSavesCount` is tracked in React state and included in `contextValue` dependencies. Every save increments `pendingSavesCount` from 0 to 1, then decrements from 1 to 0. `AutoSaveField` consumes `useReport()` and is NOT wrapped in `React.memo`.
- **Failure Conditions**: In `CoursesForm` (8 categories × ~10 fields = ~80 inputs), typing in a single field causes all 80 `AutoSaveField` components to re-render twice per save. Furthermore, each re-render fires [`useEffect#L100-L116`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L100-L116) which performs a synchronous `localStorage.getItem` call.
- **Impact**: Severe UI jank, frame drops, and battery drain on low-spec Android devices (e.g. Walton, Symphony).

#### `DEFECT-02-06` (`WEB-005`): Unconditional `useViewMode` Execution in Nested Providers
- **Location**: [`src/components/report/view-mode-toggle.tsx#L40-L45`](file:///d:/WebDev/report-submission/src/components/report/view-mode-toggle.tsx#L40-L45)
- **Root Cause**: `ViewModeProvider` calls `const { viewMode, changeMode } = useViewMode(defaultMode)` unconditionally before checking `if (existing)`.
- **Failure Conditions**: When `SectionLayout` wraps forms in `ViewModeProvider` and an inner component also renders `ViewModeProvider`, state and listeners are created and discarded every render.
- **Impact**: Unnecessary memory allocation and redundant effect executions.

---

### 3.3 Layer 3: Server Actions, Concurrency & API Defect Catalog

#### `DEFECT-02-07` (`WEB-002` / `WEB-007`): Critical Stale Closure in Submission Gate Bypassing Failed Field Checks
- **Location**: [`src/components/report/sections/comments-form.tsx#L11`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx#L11), [`#L40-L50`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx#L40-L50)
- **Root Cause**: In `handleSubmissionToggle`, `failedFields` is destructured from `useReport()` at render time. The handler forces `activeElement.blur()` and awaits `drainPendingSaves(2500)`. If an in-flight save fails during this 2.5-second drain, `ReportContext` updates its state, but `handleSubmissionToggle` evaluates the **stale `failedFields` from its lexical closure** (`Object.keys(failedFields).length`).
- **Failure Conditions**:
  1. Field worker is editing a comment or metric.
  2. Worker clicks "রিপোর্ট সাবমিশন সম্পন্ন হয়েছে" (Submit Report).
  3. Pre-flight blur fires `persist()`, queuing an HTTP save.
  4. Network drops during the 2,500ms drain; `updateField` registers a failure in `failedFields`.
  5. In `CommentsForm`, `failedCount` still evaluates to `0` because `failedFields` is stale.
  6. The report is submitted (`is_submitted = true`) with missing, un-saved data!
- **Impact**: **CRITICAL DATA CORRUPTION**. Final reports submitted with silently dropped edits.

#### `DEFECT-02-08` (`WEB-004`): Premature Write-Ahead Buffer Deletion on Superseded Edits
- **Location**: [`src/components/report/report-context.tsx#L177-L179`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L177-L179), [`src/components/report/auto-save-field.tsx#L138-L142`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L138-L142)
- **Root Cause**: When a newer edit has already been dispatched (`fieldSequenceRef.current[fieldKey] !== seq`), `updateField` returns `{ success: true }`. In `AutoSaveField`, `persist()` checks `res?.success` and immediately calls `localStorage.removeItem(draftStorageKey)`.
- **Failure Conditions**:
  1. User types `"1"` (seq 1, draft = `"1"`). Save 1 dispatches.
  2. User types `"15"` (seq 2, draft = `"15"`).
  3. Save 1 resolves. `updateField` sees seq 2 exists, discards Save 1 response, and returns `{ success: true }`.
  4. `AutoSaveField` sees `res?.success === true` and **deletes draft `"15"` from `localStorage`**!
  5. Save 2 encounters a network drop and fails.
  6. The user closes the tab or the browser task-kills the page. The local draft is gone, and the database has `"0"`.
- **Impact**: Permanent data loss on rapid mobile input over unstable connections.

#### `DEFECT-02-09` (`WEB-004`): Cross-Session & Cross-User Stale Draft Resurrection in Write-Ahead Buffer
- **Location**: [`src/components/report/auto-save-field.tsx#L37`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L37), [`#L105-L112`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L105-L112)
- **Root Cause**: `draftStorageKey` (`draft:${reportId}:${table}:${category}:${name}`) contains no timestamp, expiration TTL, or user ID.
- **Failure Conditions**:
  1. Worker edits Report #42 in June, loses connection, and abandons an un-persisted draft `"99"`.
  2. Admin or another worker updates Report #42 in database to `"15"`.
  3. Months later, worker opens Report #42.
  4. `AutoSaveField` checks `localStorage.getItem(draftStorageKey)`. Since draft `"99"` !== currentVal `"15"`, it restores `"99"` and sets `dirtyRef.current = true`.
  5. Upon unmount or idle, `"99"` silently overwrites the database!
- **Impact**: Accidental retroactive corruption of historical reports.

#### `DEFECT-02-10` (`WEB-002`): Stale Values Dispatched by `retryAllFailed()`
- **Location**: [`src/components/report/report-context.tsx#L240-L246`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L240-L246), [`src/components/report/auto-save-field.tsx#L152-L171`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L152-L171)
- **Root Cause**: `failedFields` stores the value that failed when `updateField` was called. When the user modifies the input locally after an error, `handleChange` updates `localValue` but does not update `failedFields`.
- **Failure Conditions**: Field fails with value `"10"`. User notices red error ring, edits input to `"20"`, but clicks "আবার চেষ্টা করুন" (Retry All) in the top indicator before the 1000ms debounce expires. `retryAllFailed()` dispatches the old failed value `"10"`, clobbering the user's fresh edit `"20"`.
- **Impact**: User frustration and clobbered inputs during recovery workflows.

---

### 3.4 Layer 4: Database Schemas & RLS Defect Catalog

#### `DEFECT-02-11` (`WEB-006`): Zero Immutability Lock on Submitted Reports in Child Tables
- **Location**: [`src/components/report/auto-save-field.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx), PostgreSQL RLS policies
- **Root Cause**: Once `report.is_submitted === true`, `AutoSaveField` does NOT disable its inputs or check submission status. Furthermore, PostgreSQL RLS policies on child tables (`report_course`, `report_meeting`, etc.) do not verify `(SELECT is_submitted FROM report WHERE id = report_id) = false`.
- **Failure Conditions**: A field worker submits their monthly report. They navigate back to `/report/courses?reportId=42`. All inputs remain active and editable. Keystrokes continue saving to Supabase without warning or un-submitting the report.
- **Impact**: Invalidation of official submitted reports after managerial review has commenced.

---

### 3.5 Layer 5: Document Exports & Storage Quota Defect Catalog

#### `DEFECT-02-12` (`WEB-009`): Unhandled `localStorage.setItem` Exception in `view-mode-toggle.tsx`
- **Location**: [`src/components/report/view-mode-toggle.tsx#L27`](file:///d:/WebDev/report-submission/src/components/report/view-mode-toggle.tsx#L27)
- **Root Cause**: `localStorage.setItem("report-view-mode", mode)` is invoked without `try/catch`.
- **Failure Conditions**: On iOS Safari in private browsing mode or inside locked WebView containers with disabled local storage, calling `setItem` throws `QuotaExceededError` or `SecurityError`.
- **Impact**: Entire view-mode switcher crashes with an unhandled runtime error.

---

## 4. Impeccable UI/UX, Mobile Ergonomics & Accessibility Review

| Ergonomic Dimension | Current Implementation | Impeccable Standard | Verdict |
|:---|:---|:---|:---|
| **Touch Target Area** | `tableMode`: `h-9` (36px); `inline`: `h-10` (40px) | Minimum 44px x 44px touch floor (WCAG 2.2 AA) | **FAIL**: Fails mobile standard; requires transparent hitboxes or touch padding. |
| **Keyboard Traversal** | `enterKeyHint="next"` and `inputMode="numeric"` properly set | Seamless mobile keypad navigation | **PASS**: Form inputs trigger standard numeric keypads on Android/iOS. |
| **Visual Save Feedback** | 4-state indicator at top of page, red ring on failed inputs | Clear, non-deceptive state transition | **NEEDS IMPROVEMENT**: Red error ring persists even while user is actively typing new valid data. |
| **Layout Shift (CLS)** | `ViewModeToggle` switches from Card to Table post-mount | Zero CLS during SSR/CSR hydration | **FAIL**: Severe layout shift for table-preferring users. |
| **Screen Reader Parity** | Silent DOM changes in `AutoSaveIndicator` | `aria-live="polite"` on status updates | **FAIL**: Screen readers do not announce autosave outcomes. |
| **Offline Awareness** | Indicator shows idle message when disconnected | Clear offline status indicator | **FAIL**: No offline indicator; users unaware of connection drops. |

---

## 5. Cross-Segment Blast Radius & Cohesion Warnings

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CROSS-SEGMENT BLAST RADIUS MATRIX                   │
├────────────────────────────────────────────────────────────────────────┤
│  Segment 01 (Aggregation & Data Loader):                               │
│  - Modifying table aliases or category contracts affects               │
│    loadReportDataBundle() and sumRows().                               │
│                                                                        │
│  Segment 03 (Form Ergonomics & Matrix Inputs):                         │
│  - Refactoring AutoSaveField props (e.g. adding disabled or hitboxes) │
│    directly touches all 7 section form components.                     │
│                                                                        │
│  Segment 05 (Routing, Layout & Providers):                             │
│  - ReportProvider is mounted at RootLayout (src/app/layout.tsx).       │
│    Any structural changes to provider exports impact user-dashboard    │
│    and SectionSwitcher.                                                │
│                                                                        │
│  Segment 06 (Admin Workflows & Overrides):                             │
│  - If a submitted report is locked in PostgreSQL, admin override       │
│    workflows in /city-report must remain permitted via service role    │
│    or administrative RLS exceptions.                                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Competing Multi-Option Remediation Proposals (Rules 2 & 6)

### 6.1 Issue A: Submission Gate Integrity & Stale Closure (`DEFECT-02-07`)

#### Option 1: Ref-Based Synchronous Failed Field Lookup (Minimal Application Patch)
- **Architecture**: In `ReportContext`, mirror `failedFields` into a mutable ref `failedFieldsRef.current`. Expose `getFailedFields()` or `hasFailedFields()` from context. In `CommentsForm`, query `hasFailedFields()` after `drainPendingSaves(2500)` resolves.
- **Pros**: Localized fix; zero schema or API mutations.
- **Cons & Risks**: Does not solve underlying cell-by-cell save fragmentation.
- **Doubt Gate Cross-Examination**: *"Will this fail if a save takes 2,600ms?"* Yes. If a high-latency 3G connection exceeds the 2,500ms drain timeout, `drainPendingSaves` returns `false`, which aborts submission properly.

#### Option 2: Pre-Flight Drain Gate Returns Authoritative Status (Recommended)
- **Architecture**: Upgrade `drainPendingSaves` in `ReportContext` to return `{ success: boolean; drained: boolean; failedCount: number; errors: FailedFieldInfo[] }`. Inside the drain loop, inspect both `pendingSavesCountRef` and `failedFieldsRef`. If any save fails or times out, the gate returns explicit failure details.
- **Pros**: Clean API contract; eliminates stale closures across any future forms invoking pre-flight checks.
- **Cons & Risks**: Requires minor prop signature update on `drainPendingSaves`.

---

### 6.2 Issue B: Write-Ahead Buffer Concurrency Corruption (`DEFECT-02-08`, `DEFECT-02-09`)

#### Option 1: Versioned Local Drafts with TTL & Value-Match Deletion (Application Hardening)
- **Architecture**:
  1. Store drafts as JSON: `draft:${reportId}:${table}:${category}:${name}` -> `{ value: string, timestamp: number, userId: string }`.
  2. Only delete `localStorage` key if the value returned from a successful server save **matches the current draft value**. If newer keystrokes exist, keep the draft.
  3. Discard drafts older than 48 hours or belonging to a different user.
- **Pros**: Preserves offline keystrokes during rapid typing; prevents cross-user pollution on shared devices.
- **Cons & Risks**: Adds JSON serialization overhead to localStorage operations.

#### Option 2: Pure In-Memory Ref Buffer with Unmount Flush Only (Simplicity Over Abstract Offline)
- **Architecture**: Purge `localStorage` write-ahead buffer entirely. Rely on React state, `dirtyRef`, and synchronous unmount/`visibilitychange` flush.
- **Pros**: Drastically simplifies `AutoSaveField`; removes 80+ `localStorage.getItem` synchronous calls on every render.
- **Cons & Risks**: Keystrokes are lost if Android OS abruptly kills the browser process while the user is typing without unmounting.

---

### 6.3 Issue C: Cell-by-Cell HTTP Overhead vs. Atomic Transaction RPC (Rule 7 Scrutiny)

#### Option 1: Keep Cell-by-Cell Micro-Saves with React Memoization & Optimistic Rollback
- **Architecture**: Retain individual cell updates. Wrap `AutoSaveField` in `React.memo`. Separate `isSaving` into an isolated Context (e.g. `SaveStatusContext`) so indicator updates do not re-render input fields. Add optimistic rollback in `updateField`.
- **Pros**: Familiar UX; individual cells indicate their own save state.
- **Cons & Risks**: Continues generating 50–80 HTTP PATCH calls per form over 3G; complex client state machine remains.

#### Option 2: Atomic PostgreSQL Section Save RPC `save_report_section` (Clean Rule 7 Architectural Remedy)
- **Architecture**:
  1. Create PostgreSQL stored function `save_report_section(p_report_id, p_section, p_payload jsonb)`.
  2. In client, buffer dirty changes locally within each section form.
  3. When user pauses for 1500ms, switches tabs, or clicks Next, send a single JSON payload to `save_report_section`.
  4. PostgreSQL validates all rows, checks non-negative constraints, and updates child tables atomically in one transaction.
- **Pros**:
  - Replaces 80 HTTP calls with **1 single atomic call**.
  - 100% ACID guarantee: no partial saves, no out-of-order sequence clobbering.
  - Eliminates 80% of client-side save state machinery (`fieldSequenceRef`, `failedFields` composite key tracking, `drainPendingSaves`).
  - Eliminates network congestion on rural 3G cellular connections.
- **Cons & Risks**: Requires updating section form submission handlers and testing JSON serialization.

---

## 7. Recommended Action Matrix for Lead Investigator

| Priority | Action Item | Target Files | Layer | Expected Impact |
|:---|:---|:---|:---|:---|
| **P0 (Critical)** | Fix submission gate stale closure by returning status from `drainPendingSaves` and checking `failedFieldsRef`. | `comments-form.tsx`, `report-context.tsx` | Layer 3 | Eliminates silent finalization of incomplete reports. |
| **P0 (Critical)** | Do not return `{ success: true }` on superseded edits in `updateField()`; prevent premature WAB draft wiping. | `report-context.tsx`, `auto-save-field.tsx` | Layer 3 | Eliminates data loss during rapid mobile typing. |
| **P1 (High)** | Implement optimistic state rollback in `ReportContext` on save failure. | `report-context.tsx` | Layer 2 | Prevents client memory from retaining failed values. |
| **P1 (High)** | Lock all `AutoSaveField` inputs when `data?.is_submitted === true`. | `auto-save-field.tsx` | Layer 1 / 4 | Enforces submission immutability across all sections. |
| **P2 (Medium)** | Memoize `AutoSaveField` and decouple `pendingSavesCount` from input re-render tree. | `report-context.tsx`, `auto-save-field.tsx` | Layer 2 | Eliminates 80+ input re-renders on every save keystroke. |
| **P2 (Medium)** | Purge dead prototype column checks (`course_name`, `meeting_type`). | `report-context.tsx`, `auto-save-field.tsx` | Layer 4 | Rule 7 Zero Dead-Weight compliance. |
| **P3 (Ergonomic)** | Fix FOIC in `ViewModeToggle` via server cookie or pre-hydration script; add `aria-live` to indicator. | `view-mode-toggle.tsx`, `auto-save-indicator.tsx` | Layer 1 / 5 | Eliminates layout shift and satisfies WCAG a11y. |

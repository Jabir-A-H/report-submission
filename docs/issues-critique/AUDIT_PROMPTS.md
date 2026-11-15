# Master Prompt Architecture & Execution Suite: Whole-Issue-Register Pre-Production Re-Evaluation

**Repository**: `Jabir-A-H/report-submission` (`Talimul Quran Report Submission`)  
**Mission**: Authoritative Re-Evaluation of ALL Documented Issues Across the Documentation Suite under Pre-Production Agility (`AGENTS.md` Rule 7)  
**Standard**: 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`), Impeccable UI/UX Ergonomics, Anti-Slop Frontend Taste, Adversarial Doubt-Driven Review (`Rule 2 & 6`), Zero Dead-Weight Policy  
**Architecture**: 2-Agent Dialectical Engine per Segment (Agent 1: Lead Investigator + Agent 2: Adversarial Reviewer)  
**Target Docs Evaluated**:
1. `docs/report-submission-issue-register.md` (RS-01 through RS-74)
2. `docs/KNOWN_ISSUES.md` (KI-001 through KI-023, Track 1–4, Active/Deferred, Historical Fixes)
3. `docs/ROADMAP.md` (Phases 1–5, Tiers 1–16)
4. `docs/pre-production-schema-cleanup-backlog.md` (Items 1–5)
5. `docs/TECHNICAL_MANUAL.md` (System Specifications & Architectural Invariants)

---

## 1. Executive Directive & Audit Philosophy

### 1.1 The Pre-Production Agility Imperative (`AGENTS.md` Rule 7)
The Talimul Quran Report Submission platform is in **active pre-production development with ZERO live field workers**. Under `AGENTS.md` Rule 7:
> *"Implement clean architectural fixes and schema migrations directly. Do NOT write complex application-layer shims, redundant query loops, or backward-compatibility polyfills to support obsolete prototypes, old test rows, past schemas, legacy URL params, etc."*

Historical issue registers and reviews frequently operated under the false assumption of a live production system, resulting in:
1. **Application-Layer Shims**: Frontend fallbacks (e.g. `try...catch` query column fallbacks, `zone_id != 1` magic number filters, dual-string category matchers) written to avoid touching database DDL or modifying PostgreSQL views.
2. **Defensive In-Memory Reshaping**: Storing parent metadata in JavaScript loops (e.g. mapping parent `month` onto `report_header` rows in memory) instead of adding clean foreign key columns or native table schema columns in PostgreSQL.
3. **Ghost URL & State Polyfills**: Preserving legacy route rewrites (`/login`, `/register`) or parameter resolvers for broken, non-canonical URLs instead of adopting strict database row pointers (`/report/[section]?reportId=42`).
4. **Timid Quarantine vs. Decisive Demolition**: Maintaining dead tables (`legacy_people`) behind `deny_all` RLS policies or keeping defunct client components (`session-cleaner.tsx`) out of fear of breaking obsolete prototypes.

**Every prompt in this suite instructs agents to aggressively distinguish between genuine operational bugs and pre-production bloatware.** Clean database DDL, schema migrations, and authoritative single-source-of-truth architectures ALWAYS supersede application-layer workarounds.

---

### 1.2 The 2-Agent Dialectical Engine
Every segment is investigated and cross-examined by an asymmetric agent pair:

```
┌────────────────────────────────────────────────────────────────────────┐
│                     AGENT 1: LEAD INVESTIGATOR                         │
│  - Exhaustive reality check: Compare documented issues vs. live code   │
│  - Trace 5-layer behavioral flows (DOM -> Context -> RPC -> DB -> PDF)│
│  - Filter out obsolete backward-compatibility shims & bloatware        │
│  - Propose clean, modern pre-production DDL & component architectures  │
│  - Output: docs/issues-critique/segment-0X-investigation.md            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     AGENT 2: ADVERSARIAL REVIEWER                      │
│  - Relentless "Doubt Gate": "Under what field conditions will it fail?"│
│  - Eliminate false positives, theoretical nitpicks, and desktop lint   │
│  - Stress-test proposed DDL, schema migrations, and edge conditions    │
│  - Evaluate cross-segment blast radius & breaking API contracts        │
│  - Output: docs/issues-critique/segment-0X-review.md                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 1.3 Core Operating Rules for All Agents
1. **CRITIQUE ONLY — ZERO SOURCE CODE MODIFICATIONS**:
   Under NO circumstances should any subagent edit, mutate, create, or delete any source files under `src/`, `public/`, or configuration files during these audit runs. All analysis, findings, proposals, and trade-off matrices must be strictly persisted to markdown files in `docs/issues-critique/`.
2. **File Citing Discipline**:
   Every claim, bug report, or proposed refactor must cite exact file paths and line ranges using standard markdown links with `file:///` scheme (e.g. [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L45-L70)).
3. **No Strawman Trade-offs**:
   Never cite standard development artifacts (e.g. "creates a new migration", "adds a column", "requires updating tests") as reasons to keep a hacky application-layer shim.
4. **Field Worker Reality Orientation**:
   Evaluate all findings against real field conditions in Bangladesh: spotty 3G/4G cellular connections, carrier-grade NAT (CGNAT) gateways, mobile soft virtual keyboards on low-end Android smartphones, and dense tabular data entry.

---

## 2. Master Segmentation & Coverage Matrix

All documented issues, roadmap tasks, and backlog items are partitioned into 7 cohesive functional segments:

| Seg # | Domain Title | Documented Issues Covered | Primary Code & Schema Targets |
|:---:|:---|:---|:---|
| **01** | **Data Integrity, Aggregation & Calculation Engines** | RS-01, RS-02, RS-03, RS-04, RS-05, RS-06, RS-07, RS-27, KI-005, KI-006, KI-017, KI-021, C07-01, C06-02, Backlog Items 1, 4, 5 | `src/lib/report-utils.ts`<br>`src/lib/report-data-loader.ts`<br>`src/app/(admin)/city-report/page.tsx`<br>`src/components/admin/correction-button.tsx`<br>`src/app/api/export/pdf/route.tsx`<br>`src/app/api/export/excel/route.ts`<br>PostgreSQL views `view_city_*_agg`<br>Table `city_report_override` |
| **02** | **Save Reliability, Lifecycle & State Machine** | RS-20, RS-21, RS-22, RS-23, RS-24, RS-25, RS-26, KI-008, KI-009, C03-01, C04-01, KI-023 trap 5 | `src/components/report/report-context.tsx`<br>`src/components/report/auto-save-field.tsx`<br>`src/components/report/auto-save-indicator.tsx`<br>`src/app/report/[section]/page.tsx`<br>`src/app/report/layout.tsx`<br>`src/app/layout.tsx` |
| **03** | **Input Systems, Numeral Normalization & Localization** | RS-30, RS-31, RS-32, RS-33, RS-34, KI-014, RS-50, RS-51, RS-52, KI-015, C02-02, C05-01 | `src/lib/date-utils.ts`<br>`src/lib/i18n.ts`<br>`src/components/report/auto-save-field.tsx`<br>`src/components/admin/correction-button.tsx`<br>`src/components/providers/language-provider.tsx`<br>`src/app/layout.tsx`<br>`src/app/(admin)/dashboard/page.tsx`<br>`src/app/(admin)/city-report/page.tsx` |
| **04** | **Authentication, Access Control & Role Governance** | RS-40, RS-41, RS-42, RS-43, RS-44, RS-45, RS-46, RS-47, RS-48, KI-013, KI-016, C05-04, KI-023 trap 3, OAuth trigger resilience | `middleware.ts`<br>`src/app/home/actions.ts`<br>`src/app/home/page.tsx`<br>`src/components/auth/auth-portal-client.tsx`<br>`src/components/auth/register-form-client.tsx`<br>`src/components/auth/google-sign-in-button.tsx`<br>`src/app/pending-approval/page.tsx`<br>`src/app/(admin)/management/actions.ts`<br>`src/lib/rate-limit.ts`<br>Trigger `handle_new_user` |
| **05** | **Routing, Canonical Navigation & Fallback Demolition** | RS-10, RS-60, KI-023 trap 1, Canonical `reportId` migration (`?reportId=42`), URL rewrite demolition, SessionCleaner elimination | `middleware.ts`<br>`src/app/page.tsx`<br>`src/app/report/page.tsx`<br>`src/app/report/[section]/page.tsx`<br>`src/components/dashboard/user-dashboard.tsx`<br>`src/components/report/section-layout.tsx`<br>`src/components/layout/navbar.tsx`<br>`src/components/layout/bottom-nav.tsx` |
| **06** | **UI/UX Hierarchy, Design Taste, Mobile Ergonomics & Accessibility** | RS-61, RS-62, RS-63, RS-65, RS-66, Mobile Touch Ergonomics (<44px), Section Forms ergonomics (C04-02 computed totals, view modes), C06-01 (PDF Page 2 print budget), C06-05 (Dead prototype quarantine), `/help` page | `src/components/report/sections/*`<br>`src/app/report/page.tsx`<br>`src/app/api/export/pdf/route.tsx`<br>`src/app/help/page.tsx`<br>`src/app/globals.css`<br>`src/components/report/view-mode-toggle.tsx` |
| **07** | **Database Architecture, Security Hardening & Pre-Production Schema Cleanup** | RS-14, RS-70, RS-71, RS-72, RS-73, RS-74, KI-010, KI-011, KI-012, KI-018, KI-019, KI-020, KI-023 traps 1 & 2, Backlog Items 1–5 | `src/utils/supabase/*`<br>`next.config.mjs`<br>`vercel.json`<br>`.github/workflows/*`<br>PostgreSQL Schema, Indexes, Triggers, Views & RLS Policies (`pxdkvewaglagnfcqeckn`) |

---

## 3. High-Precision Segment Audit Prompts

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 01: DATA INTEGRITY, AGGREGATION & CALCULATION ENGINES              -->
<!-- ========================================================================= -->
```

### Segment 01 — Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 01: Data Integrity, Aggregation & Calculation Engines in `talimul-quran-report-submission`.

Your mission is to perform an exhaustive, code-verified audit re-evaluating ALL documented calculation, aggregation, and override issues across:
- `docs/report-submission-issue-register.md`: RS-01, RS-02, RS-03, RS-04, RS-05, RS-06, RS-07, RS-27
- `docs/KNOWN_ISSUES.md`: KI-005, KI-006, KI-017, KI-021, C07-01, C06-02
- `docs/pre-production-schema-cleanup-backlog.md`: Items 1, 4, and 5
- `docs/TECHNICAL_MANUAL.md`: Chapters 2 & 3

Target Files & Schemas:
- `src/lib/report-utils.ts`
- `src/lib/report-data-loader.ts`
- `src/lib/report-utils.test.ts`
- `src/lib/report-data-loader.test.ts`
- `src/app/(admin)/city-report/page.tsx`
- `src/components/admin/correction-button.tsx`
- `src/app/api/export/pdf/route.tsx`
- `src/app/api/export/excel/route.ts`
- Supabase SQL: `view_city_*_agg` views, `city_report_override`, `report_header`

CORE AUDIT DIRECTIVES (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. **Header Snapshot Stock Metric Resolution (RS-03 / Backlog Item 1)**:
   - Inspect `sumHeaderRows()` and `loadReportDataBundle()`. Notice that `report_header` lacks a `month` column in PostgreSQL; `month` lives on parent `report`.
   - In Track 2 (ADR 025), a query-layer shim was implemented to map `month` from parent reports into `rawHeader` in memory.
   - Evaluate under Rule 7: Is this application-layer mapping an unneeded polyfill? Would executing a clean DDL migration (`ALTER TABLE report_header ADD COLUMN month smallint NOT NULL;`) and updating `get_or_create_report` RPC be mathematically cleaner, eliminating memory joins forever?
2. **Override Period Keying & Custom Range Collisions (RS-01, RS-06, KI-021 / Backlog Item 5)**:
   - Trace how overrides are stored and queried in `city_report_override`. ADR 018 mapped multi-month overrides to `month = months[0]`. ADR 023 added `end_month`.
   - Trace `CorrectionButton`, `city-report/page.tsx`, and `loadReportDataBundle()`. Are custom ranges (e.g. months 2 to 5) colliding with quarterly ranges (months 1 to 3) or single-month overrides?
   - Verify if "Revert to calculated" (`RotateCcw`) cleanly deletes records or leaves orphaned rows.
3. **Empty Override Zero-Clobbering (RS-02)**:
   - Verify `CorrectionButton` validation and `city-report/page.tsx:getVal`. Does clearing a field or submitting whitespace ever store `0` or replace real aggregates with `0`?
4. **City Snapshot Zone Coverage Indicator (RS-04)**:
   - In multi-month city views, does the UI or export indicate how many zones have submitted data vs. how many are pending? Early in a quarter, does `view_city_header_agg` present partial data as if it were the full city total?
5. **Arithmetic Safety & Numeral Casting (C07-01)**:
   - Audit `sumRows()`, `toFiniteNumber()`, and accumulator loops in `report-utils.ts`.
   - Is string concatenation (`"5" + 3 = "53"`) 100% prevented across all metric keys?
   - Are Bengali digits (`"১২"`) safely parsed without NaN wipes? Are text fields (`meeting_name`, `comments`) properly protected?
6. **Dual-String Backward-Compatibility Shims (Backlog Item 4 / RS-27)**:
   - Check if `report-utils.ts` or export routes still maintain dual-string matchers (e.g. `'সহযোগী হয়েছেন'` vs `'সহযোগী হয়েছে'`, or old unsplit Mashq strings).
   - In active pre-production, can all historical test rows be standardized to canonical Unicode NFC strings via a single SQL query, allowing complete deletion of dual-string shims?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your investigation to `docs/issues-critique/segment-01-investigation.md` containing:
1. Executive Scorecard for Calculation & Data Integrity.
2. Issue-by-Issue Reality Check (RS-01–07, RS-27, KI-005, KI-006, KI-017, KI-021, C07-01, C06-02).
3. Pre-Production Bloatware & Shims Catalog (with proposed DDL replacements).
4. 5-Layer Behavioral Trace (Input $\rightarrow$ Context $\rightarrow$ Aggregator $\rightarrow$ View $\rightarrow$ Export).
5. Recommended Clean Modern Architecture.
```

### Segment 01 — Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 01: Data Integrity, Aggregation & Calculation Engines in `talimul-quran-report-submission`.

Your mission is to cross-examine Subagent A's investigation in `docs/issues-critique/segment-01-investigation.md` using the "Doubt Gate" (`AGENTS.md` Rule 2 & 6, `doubt-driven-development`):

1. **Cross-Examine the `report_header.month` DDL Proposal**:
   - Subagent A proposes adding `month` to `report_header`.
   - Adversarial Doubt: Does adding `month` violate normal form (denormalization of parent `report.month`)?
   - If `month` is added to `report_header`, what happens if a report is somehow updated or re-keyed? Does it introduce data synchronization anomalies between `report.month` and `report_header.month`?
   - Is the query-layer attachment in `loadReportDataBundle()` actually lightweight and harmless, or does it impose measurable overhead?
2. **Stress-Test Custom Range Override Storage**:
   - If `city_report_override` relies on `(year, month, end_month, report_type, section, field, category)`, under what real-world user interactions will this fail?
   - What happens if an admin enters an override on a Custom Range (e.g. Feb–May), and later views Q1 (Jan–Mar)? Does the override leak into Q1?
3. **Verify Arithmetic Boundary Conditions in `sumRows`**:
   - Test Subagent A's claims against extreme edge cases: `null`, `undefined`, boolean `false`, negative strings `"-5"`, Bengali decimals `"১২.৫"`, extremely large integers, and non-numeric comments.
4. **Discharge False Positives**:
   - Identify any issues flagged by Subagent A that are already resolved, purely cosmetic, or invalid for pre-production.
5. **Cross-Segment Blast Radius**:
   - If calculation helpers or DDL schemas change, what breaks in Segment 04 (Section Forms), Segment 05 (City Report UI), or Segment 06 (PDF/Excel Exporters)?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your critique to `docs/issues-critique/segment-01-review.md` containing:
1. Adversarial Scorecard & Sanity Check.
2. False-Positive Discharge Table.
3. Stress-Test Findings & Hidden Failure Modes.
4. Cross-Segment Blast Radius Analysis.
5. Final Hardened Pre-Production Action Plan.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 02: SAVE RELIABILITY, LIFECYCLE & STATE MACHINE                    -->
<!-- ========================================================================= -->
```

### Segment 02 — Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 02: Save Reliability, Lifecycle & State Machine in `talimul-quran-report-submission`.

Your mission is to perform an exhaustive, code-verified audit re-evaluating ALL save reliability, concurrency, and state machine lifecycle issues across:
- `docs/report-submission-issue-register.md`: RS-20, RS-21, RS-22, RS-23, RS-24, RS-25, RS-26
- `docs/KNOWN_ISSUES.md`: KI-008, KI-009, C03-01, C04-01, KI-023 trap 5
- `docs/TECHNICAL_MANUAL.md`: Chapters 3 & 4

Target Files:
- `src/components/report/report-context.tsx`
- `src/components/report/auto-save-field.tsx`
- `src/components/report/auto-save-indicator.tsx`
- `src/app/report/[section]/page.tsx`
- `src/app/report/layout.tsx`
- `src/app/layout.tsx`

CORE AUDIT DIRECTIVES (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. **Form Unmount & Keyboard Focus Collapse Render Loop (C03-01 / RS-23)**:
   - In Track 3 (ADR 026), `useEffect` in `report/[section]/page.tsx` was decoupled from `data` and `t` to prevent keystroke auto-save blurs from resetting state and collapsing mobile virtual keyboards.
   - Trace live code: Does `page.tsx` or `ReportContext` have ANY lingering state transitions or re-renders that could cause `SectionSwitcher` or forms to unmount while the user is actively typing?
2. **Unmount Dirty-State Persistence Flush (C04-01 / RS-25)**:
   - When a field worker switches section tabs (Previous/Next) or navigates away while an input has unblurred edits, does `AutoSaveField` flush the pending edit synchronously?
   - Trace `dirtyRef`, `latestValueRef`, and the unmount cleanup in `AutoSaveField`. Does it call `updateField`? Is `updateField` an async call that might be cancelled if the component unmounts before PostgREST responds?
3. **Save Verification via `.select('id')` vs RLS Policies (RS-21)**:
   - `updateField` appends `.select('id')` to verify that an update actually matched a row (the KI-008 fix).
   - Trace PostgREST behavior: If RLS SELECT policy is narrower than UPDATE policy, will genuine writes report a false failure? Compare SELECT and UPDATE policies on `report` and all 7 child tables.
4. **Granular Per-Field Error Tracking & Retry Queue (RS-20, RS-24)**:
   - Inspect `failedFields: Record<string, FailedFieldInfo>` and `pendingSavesCount`.
   - If field A fails and field B succeeds 500ms later, does field B clobber field A's error banner?
   - When the user taps "Retry All" in `AutoSaveIndicator`, does it actually retry writes with the latest typed values or does it submit stale context values?
5. **Load-Gated Error Recovery & Empty Form Shield (RS-22)**:
   - Trace `loadReport()`. When a network drop occurs during report loading, does `page.tsx` render an empty form with blanks (which could cause field workers to panic and overwrite real data with zeros), or does it render the Bengali retry error card?
6. **ReportProvider Lifecycle & Placement (KI-023 trap 5 / RS-23)**:
   - Check where `<ReportProvider>` is mounted. Is it at root `layout.tsx`, `report/layout.tsx`, or inside `page.tsx`?
   - If `<ReportProvider>` is hoisted or moved, does `user-dashboard.tsx` or any sibling component crash?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your investigation to `docs/issues-critique/segment-02-investigation.md` containing:
1. Executive Scorecard for Save Reliability & State Machine.
2. Issue-by-Issue Reality Check (RS-20–26, KI-008, KI-009, C03-01, C04-01).
3. Lifecycle & Race Condition Analysis (Unmount flush, blurred auto-save, tab switching).
4. Pre-Production Bloatware vs. True Resilient Primitives.
5. Recommended State Machine Architecture.
```

### Segment 02 — Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 02: Save Reliability, Lifecycle & State Machine in `talimul-quran-report-submission`.

Your mission is to cross-examine Subagent A's investigation in `docs/issues-critique/segment-02-investigation.md` using the "Doubt Gate":

1. **Stress-Test Unmount Flush under Real Mobile Field Conditions**:
   - Subagent A examines `dirtyRef` flush on unmount.
   - Adversarial Doubt: In React 19 / Next.js 16 App Router, when `router.push()` or `<Link>` triggers a route transition, does synchronous unmount cleanup guarantee that asynchronous PostgREST HTTP calls finish before the browser unloads or navigates?
   - What happens on low-end Android Chrome when the user switches apps or gets a phone call (`visibilitychange`)? Can `fetch` with `keepalive: true` or `navigator.sendBeacon` be needed, or does Supabase JS client handle this?
2. **Cross-Examine `.select('id')` Save Check**:
   - Test whether PostgREST's `.select('id')` return count check can false-fail under high-latency mobile networks or database connection pool throttling.
3. **Challenge Retry Queue Mechanics**:
   - If the user edits field A to "10" (which fails), then edits field A to "20" (which also fails), what is stored in `failedFields`? Does tapping retry replay "10" or "20"?
4. **Evaluate Cross-Segment Blast Radius**:
   - If `updateField` signature or `ReportContext` state structure changes, what breaks in the 7 section forms (Segment 06) or the root shell (Segment 05)?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your critique to `docs/issues-critique/segment-02-review.md` containing:
1. Adversarial Scorecard & Sanity Check.
2. False-Positive Discharge Table.
3. Mobile Network & Virtual Keyboard Failure Scenarios.
4. Cross-Segment Blast Radius Analysis.
5. Final Hardened Pre-Production Action Plan.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 03: INPUT SYSTEMS, NUMERAL NORMALIZATION & LOCALIZATION           -->
<!-- ========================================================================= -->
```

### Segment 03 — Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 03: Input Systems, Numeral Normalization & Localization in `talimul-quran-report-submission`.

Your mission is to perform an exhaustive, code-verified audit re-evaluating ALL numeral normalization, input sanitization, timezone parity, and localization issues across:
- `docs/report-submission-issue-register.md`: RS-30, RS-31, RS-32, RS-33, RS-34, RS-50, RS-51, RS-52
- `docs/KNOWN_ISSUES.md`: KI-014, KI-015, C02-02, C05-01
- `docs/TECHNICAL_MANUAL.md`: Chapters 4 & 5

Target Files:
- `src/lib/date-utils.ts`
- `src/lib/date-utils.test.ts`
- `src/lib/i18n.ts`
- `src/components/report/auto-save-field.tsx`
- `src/components/admin/correction-button.tsx`
- `src/components/providers/language-provider.tsx`
- `src/app/layout.tsx`
- `src/app/(admin)/dashboard/page.tsx`
- `src/app/(admin)/city-report/page.tsx`

CORE AUDIT DIRECTIVES (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. **Bengali Numeral Flipping & Active Typing Shield (RS-30, KI-014)**:
   - In Track 1 (ADR 020), `AutoSaveField` was updated with `isFocused` and language reactivity.
   - Trace live code: When a field worker types Bengali digits ("১৫"), does the input remain in Bengali upon blur, or does it flip to English ASCII ("15")?
   - When another field in the matrix auto-saves, does background context synchronization clobber the user's active keystrokes?
2. **Non-Digit Sanitization & Data Inflation Traps (RS-32)**:
   - Trace `persist()` in `AutoSaveField` and `CorrectionButton`.
   - ADR 020 replaced naive regex stripping (`/[^\d]/g`) with float parsing and integer rounding (`parseFloat` + `Math.round`) to prevent 10x-100x data inflation on decimal points (`12.5` becoming `125`).
   - Does this parsing cleanly handle all user inputs? What happens if a user enters commas (`"১,২০০"`), negative signs, or non-Bengali characters?
3. **Admin Override Input Parity (RS-31, RS-02)**:
   - Inspect `CorrectionButton` input attributes: Is it `type="text" inputMode="numeric"`? Does it normalize Bengali numerals before saving to `city_report_override`?
   - Does `city-report/page.tsx` safely display Bengali badges without `NaN`?
4. **Universal Asia/Dhaka Timezone Parity (RS-50, KI-015)**:
   - Audit `src/lib/date-utils.ts` and all consumer files.
   - Are there ANY remaining instances of raw `new Date()` or un-timezoned date calculations in server components, client components, or API routes?
   - Does Dhaka time (UTC+6) correctly govern month transitions during the 6-hour midnight window?
5. **Locale Synchronization & FOIC Prevention (RS-51, C02-02)**:
   - In Track 3 (ADR 026), `RootLayout` was converted to an async Server Component reading the `app-language` cookie and passing `initialLanguage` to `<html lang>` and `LanguageProvider`.
   - Does page reload ever produce a visible Flash of Incorrect Content / Language?
6. **Hardcoded Strings & Translation Token Parity (RS-52, C05-01)**:
   - Check `src/app/(admin)/dashboard/page.tsx` and `(admin)/city-report/page.tsx`.
   - Are there any hardcoded Bengali strings that fail to translate in English mode?
   - In `city-report/page.tsx`, are period selector options comparing English canonical tokens (`"quarterly"`) or raw Bengali strings (`"ত্রৈমাসিক"`)?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your investigation to `docs/issues-critique/segment-03-investigation.md` containing:
1. Executive Scorecard for Numerals, Inputs & Localization.
2. Issue-by-Issue Reality Check (RS-30–34, RS-50–52, KI-014, KI-015, C02-02, C05-01).
3. Numeral Conversion & Sanitization Proof (Bengali $\leftrightarrow$ ASCII).
4. Timezone & Localization Integrity Matrix.
5. Recommended Pre-Production Architecture.
```

### Segment 03 — Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 03: Input Systems, Numeral Normalization & Localization in `talimul-quran-report-submission`.

Your mission is to cross-examine Subagent A's investigation in `docs/issues-critique/segment-03-investigation.md` using the "Doubt Gate":

1. **Stress-Test Numeral Parsing Against Real-World Bangladeshi Keyboards**:
   - Subagent A asserts that `bnToEn` + `parseFloat` + `Math.round` is secure.
   - Adversarial Doubt: What happens when mobile users use voice typing, Bijoy keyboard converters, or paste numbers formatted with Bengali comma separators (`"১,৫০,০০০"`)?
   - Does `parseFloat("১,৫০,০০০")` truncate at the first comma and save `"1"` instead of `"150000"`?
2. **Cross-Examine Timezone Boundary Calculations**:
   - Under what hosting or local browser conditions could `getDhakaDate()` fail or throw `RangeError`? Does Vercel Node runtime always support `Intl.DateTimeFormat` with `timeZone: "Asia/Dhaka"`?
3. **Discharge False Positives**:
   - Is strict integer rounding (RS-33) actually a defect or a deliberate domain decision confirmed in ADR 022?
4. **Evaluate Cross-Segment Blast Radius**:
   - If numeral helpers in `report-utils.ts` or `date-utils.ts` are altered, what breaks in Segment 01 (Calculation Engines) or Segment 06 (Export Pipeline)?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your critique to `docs/issues-critique/segment-03-review.md` containing:
1. Adversarial Scorecard & Sanity Check.
2. False-Positive Discharge Table.
3. Edge Case Keyboard & Locale Vulnerabilities.
4. Cross-Segment Blast Radius Analysis.
5. Final Hardened Pre-Production Action Plan.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 04: AUTHENTICATION, ACCESS CONTROL & ROLE GOVERNANCE              -->
<!-- ========================================================================= -->
```

### Segment 04 — Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 04: Authentication, Access Control & Role Governance in `talimul-quran-report-submission`.

Your mission is to perform an exhaustive, code-verified audit re-evaluating ALL authentication, access control, user approval, and privilege governance issues across:
- `docs/report-submission-issue-register.md`: RS-40, RS-41, RS-42, RS-43, RS-44, RS-45, RS-46, RS-47, RS-48
- `docs/KNOWN_ISSUES.md`: KI-013, KI-016, C05-04, KI-023 trap 3, Supabase 2 emails/hr limit
- `docs/TECHNICAL_MANUAL.md`: Chapters 1 & 4

Target Files:
- `middleware.ts`
- `src/app/home/actions.ts`
- `src/app/home/page.tsx`
- `src/components/auth/auth-portal-client.tsx`
- `src/components/auth/register-form-client.tsx`
- `src/components/auth/google-sign-in-button.tsx`
- `src/app/forgot-password/page.tsx`
- `src/app/forgot-password/actions.ts`
- `src/app/update-password/page.tsx`
- `src/app/update-password/actions.ts`
- `src/app/pending-approval/page.tsx`
- `src/app/(admin)/management/actions.ts`
- `src/lib/rate-limit.ts`
- PostgreSQL Triggers & Functions: `handle_new_user`, `is_admin()`, RLS on `people`

CORE AUDIT DIRECTIVES (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. **Privilege Escalation & Self-Deletion Governance (C05-04)**:
   - In Track 3 (ADR 026), `deleteUserAction` in `src/app/(admin)/management/actions.ts` was hardened to block standard admins from deleting admins/superadmins and block self-deletion.
   - Trace live code: Can a compromised or rogue admin account elevate their own role to superadmin, activate dormant accounts, or delete the last remaining superadmin?
2. **Carrier-Grade NAT (CGNAT) Rate-Limiting Trap (KI-023 trap 3 / RS-44)**:
   - In Bangladesh, mobile field workers on mobile operators (Grameenphone, Banglalink, Robi) share carrier-grade NAT public IP gateways.
   - Trace `rate-limit.ts` and `src/app/home/actions.ts`: Are public availability checks and login attempts rate-limited purely by IP? If so, does one user's registration lock out all other workers on that mobile tower? Is a compound key (`${ip}:${email}`) implemented?
3. **Login Normalization & Case Insensitivity (RS-42)**:
   - Trace login resolution in `home/actions.ts`. Does it safely handle mobile keyboard auto-capitalization and trailing spaces?
   - Is the query using wildcard-escaped `.ilike('user_id', ...)` to prevent SQL wildcard collisions (`_` or `%`) from crashing with `PGRST116`?
4. **City / DCS Registration Exclusion (RS-43)**:
   - Trace `home/page.tsx` and `register()` action. Is Zone 1 (`id === 1` or `zone_type === 'city'`) completely excluded from registration dropdowns both in UI and on the server?
5. **Supabase Cookie Handling on Middleware Redirects (RS-48)**:
   - Trace `middleware.ts`. When Supabase SSR client refreshes session tokens inside `setAll`, does `NextResponse.redirect()` properly preserve and forward the refreshed auth cookies, or are they silently dropped?
6. **Message Parameter Phishing & Sanitization (RS-46)**:
   - Inspect `sanitizeAuthMessage()` in `src/lib/i18n.ts` and `home/page.tsx`. Does `/home?message=` sanitize untrusted query strings against arbitrary text rendering?
7. **Google OAuth Profile Trigger Resilience (ADR 017 / KI-023)**:
   - Inspect PostgreSQL trigger `handle_new_user()` on `auth.users`. When a user signs in via Google OAuth, does it safely generate a unique `user_id` and default `zone_id` without crashing?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your investigation to `docs/issues-critique/segment-04-investigation.md` containing:
1. Executive Scorecard for Auth, Access Control & Role Governance.
2. Issue-by-Issue Reality Check (RS-40–48, KI-013, KI-016, C05-04, KI-023 trap 3).
3. Attack Surface & Threat Model Analysis (CGNAT lockout, privilege escalation, cookie drops).
4. Pre-Production Bloatware vs. Clean Server-Side Guards.
5. Recommended Pre-Production Architecture.
```

### Segment 04 — Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 04: Authentication, Access Control & Role Governance in `talimul-quran-report-submission`.

Your mission is to cross-examine Subagent A's investigation in `docs/issues-critique/segment-04-investigation.md` using the "Doubt Gate":

1. **Stress-Test Rate Limiting on Carrier Networks**:
   - Subagent A evaluates the compound key (`${ip}:${email}`).
   - Adversarial Doubt: For public availability checks (`checkEmailAvailability`), an attacker targeting an unknown email doesn't have an established email. If IP rate-limiting is too relaxed, enumeration occurs; if too strict, mobile users are blocked. What is the mathematically sound threshold?
2. **Cross-Examine Middleware Cookie Forwarding**:
   - Subagent A raises cookie loss on `NextResponse.redirect()`.
   - Adversarial Doubt: Next.js App Router middleware executes before route handlers. Does `@supabase/ssr` token refresh in middleware actually drop tokens on redirects in live execution, or does Next.js 16 forward response cookies? What exact proof validates this?
3. **Challenge In-App Admin Password Reset (RS-41)**:
   - Subagent A may recommend adding an in-app admin password reset modal.
   - Adversarial Doubt: In ADR 022, the owner explicitly decided against this to avoid building custom credential management. Does pre-production agility justify keeping password resets strictly through Supabase Auth email recovery?
4. **Evaluate Cross-Segment Blast Radius**:
   - If user profile creation or role resolution changes, what breaks in Segment 05 (Admin Portal) or Segment 02 (Report State Machine)?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your critique to `docs/issues-critique/segment-04-review.md` containing:
1. Adversarial Scorecard & Sanity Check.
2. False-Positive Discharge Table.
3. Security & Operational Edge Case Scenarios.
4. Cross-Segment Blast Radius Analysis.
5. Final Hardened Pre-Production Action Plan.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 05: ROUTING, CANONICAL NAVIGATION & FALLBACK DEMOLITION           -->
<!-- ========================================================================= -->
```

### Segment 05 — Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 05: Routing, Canonical Navigation & Fallback Demolition in `talimul-quran-report-submission`.

Your mission is to perform an exhaustive, code-verified audit re-evaluating ALL routing, navigation state, URL parameters, and legacy fallback shims across:
- `docs/report-submission-issue-register.md`: RS-10, RS-60
- `docs/KNOWN_ISSUES.md`: KI-023 trap 1 (Phantom Schema Fallacy), Roadmap Tier 11 (Canonical `reportId` URL Navigation)
- `docs/pre-production-schema-cleanup-backlog.md`: Item 3 (DCS Zone 1 & 2-Tier Hierarchy)
- `docs/TECHNICAL_MANUAL.md`: Chapters 1 & 4

Target Files:
- `middleware.ts`
- `src/app/page.tsx`
- `src/app/report/page.tsx`
- `src/app/report/[section]/page.tsx`
- `src/components/dashboard/user-dashboard.tsx`
- `src/components/report/section-layout.tsx`
- `src/components/layout/navbar.tsx`
- `src/components/layout/bottom-nav.tsx`
- `src/components/layout/user-dropdown.tsx`

CORE AUDIT DIRECTIVES (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. **Canonical `reportId` Sub-Section Navigation (RS-60, Roadmap Tier 11)**:
   - Currently, `/report/[section]` reconstructs "which report" from `type`/`month`/`year` parameters, re-calling `get_or_create_report` RPC on page loads.
   - Trace live code: When a field worker enters a report from the dashboard, should the entry point resolve the database row ONCE and navigate onward with the canonical database ID (`/report/[section]?reportId=42`)?
   - Under Rule 7 (pre-production), do we need complex fallback resolvers for broken, bare URLs, or should direct canonical entity routing be strictly enforced?
2. **Single-Month Editing Boundary Enforcement (RS-10)**:
   - In Track 4 (ADR 021), `report/[section]/page.tsx` hardcoded `dbReportType = "মাসিক"` to prevent URL parameter tampering (`?type=quarterly`) from writing invalid non-monthly rows.
   - Does this guard fully prevent corrupt rows? Can non-monthly editing still occur?
3. **Demolition of Legacy URL Rewrites & Redirects in Middleware**:
   - Inspect `middleware.ts`. Are there legacy redirects from `/login` or `/register` to `/home`?
   - In pre-production where no external links or search engine indexes exist, why keep legacy route redirects? Should any unknown route simply 404 or redirect directly to `/home`?
4. **Demolition of SessionCleaner and Storage Shims**:
   - Inspect whether `session-cleaner.tsx` or any `sessionStorage` restoration loops linger in the codebase.
5. **DCS Zone 1 Entity & 2-Tier Hierarchy Governance (Backlog Item 3 / ADR 009)**:
   - In database schema reconciliation (2026-11-10), `zone_type` and `parent_id` were added to the `zone` table.
   - Are frontend components still using defensive `zone_id === 1` checks instead of checking `zone.zone_type === 'city'`?
   - Have the 6 SQL views (`view_city_*_agg`) been updated to filter on `WHERE z.zone_type != 'city'`?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your investigation to `docs/issues-critique/segment-05-investigation.md` containing:
1. Executive Scorecard for Routing & Navigation Architecture.
2. Issue-by-Issue Reality Check (RS-10, RS-60, Roadmap Tier 11, Backlog Item 3).
3. Pre-Production Bloatware & Legacy Fallback Shims Catalog.
4. Canonical Routing Architecture Blueprint (`/report/[section]?reportId=42`).
5. Recommended Pre-Production Modern Architecture.
```

### Segment 05 — Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 05: Routing, Canonical Navigation & Fallback Demolition in `talimul-quran-report-submission`.

Your mission is to cross-examine Subagent A's investigation in `docs/issues-critique/segment-05-investigation.md` using the "Doubt Gate":

1. **Stress-Test Canonical `reportId` URL Navigation**:
   - Subagent A proposes enforcing `/report/[section]?reportId=42` and removing period param resolution from section pages.
   - Adversarial Doubt: What happens if a field worker refreshes the browser while on `/report/header?reportId=42`?
   - How does the page verify authorization? Can a user in Zone A simply change `reportId=42` to `reportId=43` and view or edit Zone B's report?
   - What RLS policies or server-side checks guard against cross-zone report tampering via ID tampering?
2. **Cross-Examine Bare URL Demolition**:
   - Subagent A recommends removing fallback resolvers for bare `/report/[section]` URLs.
   - Adversarial Doubt: What if a user bookmarks `/report/header` or navigates via browser history? Does showing an immediate 404 or redirecting to `/` provide acceptable UX, or does it cause confusion?
3. **Discharge False Positives**:
   - Evaluate whether Subagent A flagged intentional multi-month aggregate viewing on `/report` as a routing defect.
4. **Evaluate Cross-Segment Blast Radius**:
   - If section navigation switches to `reportId`, what changes in `ReportContext` (Segment 02), the Stepper navigation (Segment 06), and the Admin Reports table (Segment 07)?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your critique to `docs/issues-critique/segment-05-review.md` containing:
1. Adversarial Scorecard & Sanity Check.
2. False-Positive Discharge Table.
3. ID Tampering & Cross-Zone Security Scenarios.
4. Cross-Segment Blast Radius Analysis.
5. Final Hardened Pre-Production Action Plan.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 06: UI/UX HIERARCHY, DESIGN TASTE, MOBILE ERGONOMICS & A11Y        -->
<!-- ========================================================================= -->
```

### Segment 06 — Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 06: UI/UX Hierarchy, Design Taste, Mobile Ergonomics & Accessibility in `talimul-quran-report-submission`.

Your mission is to perform an exhaustive, code-verified audit re-evaluating ALL mobile ergonomics, typography, touch target, export budgeting, and UI/UX issues across:
- `docs/report-submission-issue-register.md`: RS-61, RS-62, RS-63, RS-65, RS-66, WONTFIX touch targets
- `docs/KNOWN_ISSUES.md`: Mobile Touch Target Ergonomics (<44px), C06-01 (PDF Page 2 Height Budget), C06-05 (Dead prototype), Help page rewrite
- `docs/ROADMAP.md`: Phase 3.5 & Tier 11 section form ergonomics (C04-02 computed totals, view mode toggles)
- `docs/TECHNICAL_MANUAL.md`: Chapters 2, 4, & 5

Target Files:
- `src/components/report/sections/report-header-form.tsx`
- `src/components/report/sections/courses-form.tsx`
- `src/components/report/sections/organizational-form.tsx`
- `src/components/report/sections/personal-form.tsx`
- `src/components/report/sections/meetings-form.tsx`
- `src/components/report/sections/extras-form.tsx`
- `src/components/report/sections/comments-form.tsx`
- `src/app/report/page.tsx`
- `src/app/api/export/pdf/route.tsx`
- `src/app/help/page.tsx`
- `src/app/globals.css`
- `src/components/report/view-mode-toggle.tsx`

CORE AUDIT DIRECTIVES (impeccable & design-taste-frontend standards):
1. **Mobile Touch Target Floor (WCAG 2.2 AA — 44px x 44px)**:
   - Audit all inputs, buttons, chevrons, and mode switchers across mobile viewports (320px–420px).
   - In `KNOWN_ISSUES.md`, enforcing 44px on `tableMode` (`h-9` / 36px) was marked `RESOLVED / WONTFIX` to preserve matrix density.
   - Re-evaluate: Does Card View (`viewMode === 'card'`) satisfy 44px minimum touch targets? Do stepper buttons (Previous/Next) and header icon buttons meet the 44px hit-box floor without visual bloat?
2. **Section Forms Ergonomics & Live Computed Totals (C04-02, C04-04)**:
   - Inspect `personal-form.tsx`. In table mode, does it render live computed horizontal row totals (`মোট`) so workers can verify arithmetic before saving?
   - Inspect `courses-form.tsx`, `organizational-form.tsx`, and `meetings-form.tsx`. Are accordion expansions smooth, anti-slop, and ergonomically sound?
3. **PDF Export 2-Page Print Budget Rebalance (C06-01 / KI-023 trap 4)**:
   - In Track 3 (ADR 026), Page 2 was rebalanced with side-by-side Maktab and Safar blocks (`width: 49.2%`), saving ~44 pt.
   - Trace `pdf/route.tsx`: When Section 5 (`comments`) contains extensive multi-line text, does the document strictly stay within 2 landscape A4 pages, or does it spill signatures onto an unwanted Page 3?
4. **Dead Prototype Quarantine & Pruning (C06-05)**:
   - Confirm that dead prototype `src/components/admin/reports/city-report-pdf.tsx` was quarantined to `.discard/` under Rule 4. Are there any other orphaned UI components lingering in the tree?
5. **Help Page Manual Integrity & Verification (RS-65, ADR 019)**:
   - Review `src/app/help/page.tsx`. Does it accurately describe live application buttons (`“যান”`, `“সম্পাদনা করুন”`, `“রিপোর্ট জমা সম্পন্ন হয়েছে”`) without AI hallucinated claims or technical jargon?
6. **Registration Label Binding (RS-66)**:
   - Confirm all form labels across auth and section forms are bound via accessible `htmlFor` and matching `id`.

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your investigation to `docs/issues-critique/segment-06-investigation.md` containing:
1. Executive Scorecard for UI/UX, Design Taste & Accessibility.
2. Issue-by-Issue Reality Check (RS-61, RS-62, RS-63, RS-65, RS-66, C06-01, C06-05, C04-02).
3. Mobile Touch & Viewport Ergonomics Audit (320px–420px).
4. PDF Typographical Height Budget Proof (pt calculation).
5. Recommended Clean Modern UI/UX Architecture.
```

### Segment 06 — Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 06: UI/UX Hierarchy, Design Taste, Mobile Ergonomics & Accessibility in `talimul-quran-report-submission`.

Your mission is to cross-examine Subagent A's investigation in `docs/issues-critique/segment-06-investigation.md` using the "Doubt Gate":

1. **Stress-Test 44px Touch Targets Against Reporting Matrix Density**:
   - Subagent A evaluates WCAG 44px touch targets.
   - Adversarial Doubt: If every cell in a 12-row x 4-column matrix is forced to 44px on a 360px mobile screen, how many vertical screen heights must the worker scroll? Does strict WCAG padding ruin the visual cohesiveness and data-entry speed that field workers require?
2. **Mathematical Verification of PDF 2-Page Guarantee**:
   - Cross-examine the typographical point budget in `pdf/route.tsx`.
   - What is the maximum character limit for Section 5 comments before signatures are pushed onto Page 3? Does the system enforce a database `CHECK (length(comments) <= X)` constraint, or can a verbose comment break the 2-page print guarantee?
3. **Discharge False Positives**:
   - Did Subagent A flag desktop layout quirks that are completely irrelevant to mobile-first field workers?
4. **Evaluate Cross-Segment Blast Radius**:
   - If form layouts or input containers are altered, what breaks in Segment 02 (Save State Machine & Focus Loss) or Segment 03 (Numeral Input Handlers)?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your critique to `docs/issues-critique/segment-06-review.md` containing:
1. Adversarial Scorecard & Sanity Check.
2. False-Positive Discharge Table.
3. Mobile Ergonomics vs. Density Trade-Off Matrix.
4. Cross-Segment Blast Radius Analysis.
5. Final Hardened Pre-Production Action Plan.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 07: DATABASE ARCHITECTURE, SECURITY & SCHEMA CLEANUP              -->
<!-- ========================================================================= -->
```

### Segment 07 — Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 07: Database Architecture, Security Hardening & Pre-Production Schema Cleanup in `talimul-quran-report-submission`.

Your mission is to perform an exhaustive, code-verified audit re-evaluating ALL database schema, RLS policies, indexes, security headers, infrastructure, and dead-object cleanup issues across:
- `docs/report-submission-issue-register.md`: RS-14, RS-70, RS-71, RS-72, RS-73, RS-74
- `docs/KNOWN_ISSUES.md`: KI-010, KI-011, KI-012, KI-018, KI-019, KI-020, KI-023 traps 1 & 2
- `docs/pre-production-schema-cleanup-backlog.md`: Items 1, 2, 3, 4, 5
- `docs/TECHNICAL_MANUAL.md`: Chapters 1 & 3

Target Files & Infrastructure:
- `src/utils/supabase/client.ts`
- `src/utils/supabase/server.ts`
- `next.config.mjs`
- `vercel.json`
- `.github/workflows/ci.yml`
- `.github/workflows/build-apk.yml`
- `.github/workflows/backup.yml`
- Supabase PostgreSQL: `pxdkvewaglagnfcqeckn` tables, views, RLS, indexes, and triggers

CORE AUDIT DIRECTIVES (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. **Permanent Dropping of Dead Database & Code Objects (Backlog Item 2)**:
   - Verify whether `legacy_people`, `handle_new_auth_user`, and `view_city_course_final` have been permanently dropped via DDL (`DROP ... CASCADE`).
   - Confirm that dead components (like `session-cleaner.tsx`) have been quarantined or purged under Rule 4.
2. **RLS Statement Caching & Performance (KI-020, ADR 023)**:
   - In ADR 023, 34 RLS policies were refactored with `STABLE SECURITY DEFINER` helper functions (`is_admin()`, `get_user_zone_id()`) with pinned `SET search_path = public`.
   - Inspect live schema: Are there any remaining unindexed foreign keys or per-row `auth.uid()` subqueries triggering Supabase Performance Advisor warnings?
3. **Covering Indexes for Auth & Joins (KI-019, ADR 023)**:
   - Confirm existence of `idx_people_supabase_uid`, `idx_people_zone_id`, `idx_report_header_report_id`, `idx_report_comment_report_id`, and `idx_zone_parent_id`.
4. **Database CHECK >= 0 Constraints & Column Types (KI-011, RS-73)**:
   - Confirm that all metric columns across `report_header`, `report_course`, `report_organizational`, `report_personal`, `report_meeting`, and `report_extra` enforce `CHECK (col >= 0)`.
5. **Serverless Compute Proximity & Font Tracing (ADR 025)**:
   - Inspect root `vercel.json`: Is serverless execution pinned to Sydney (`syd1`) matching Supabase (`ap-southeast-2`)?
   - Inspect `next.config.mjs`: Is `outputFileTracingIncludes` configured for `kalpurush.ttf` to prevent `ENOENT` crashes in production serverless exports?
6. **HTTP Security Headers & CI Automation (RS-71, RS-72)**:
   - Inspect `next.config.mjs` headers: Are HSTS, X-Frame-Options, X-Content-Type-Options, and CSP/Permissions-Policy strictly configured?
   - Inspect `.github/workflows/ci.yml`: Does CI run lint, typecheck, tests, and build on PRs to `main`?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your investigation to `docs/issues-critique/segment-07-investigation.md` containing:
1. Executive Scorecard for Database Architecture & Infrastructure.
2. Issue-by-Issue Reality Check (RS-14, RS-70–74, KI-010–012, KI-018–020, Backlog Items 1–5).
3. Pre-Production Schema DDL Verification Matrix.
4. Security, RLS & Performance Advisor Assessment.
5. Recommended Clean Modern Infrastructure Blueprint.
```

### Segment 07 — Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 07: Database Architecture, Security Hardening & Pre-Production Schema Cleanup in `talimul-quran-report-submission`.

Your mission is to cross-examine Subagent A's investigation in `docs/issues-critique/segment-07-investigation.md` using the "Doubt Gate":

1. **Stress-Test Dropping Legacy Objects (`DROP ... CASCADE`)**:
   - Subagent A recommends dropping dead tables, views, and functions.
   - Adversarial Doubt: In PostgreSQL, does `DROP TABLE legacy_people CASCADE` or `DROP FUNCTION handle_new_auth_user() CASCADE` risk dropping any unexpected dependent views, triggers, or foreign keys? What exact DDL commands guarantee zero collateral damage?
2. **Cross-Examine Plaintext Backup Workflow (RS-70 / KI-018)**:
   - In ADR 022, the owner decided against backup encryption (`DECIDED-NOT-DOING`) because the backup destination repository is private.
   - Adversarial Doubt: Does Subagent A accept this decision, or are they attempting to re-litigate a settled design choice?
3. **Discharge False Positives**:
   - Identify any database or infrastructure warnings that are harmless in pre-production.
4. **Evaluate Cross-Segment Blast Radius**:
   - If database schemas, views, or RLS helper functions are modified, what breaks across Segments 01 through 06?

CRITICAL CONSTRAINT: CRITIQUE ONLY — ZERO IMPLEMENTATION. Do not modify any files in `src/`.

Output your critique to `docs/issues-critique/segment-07-review.md` containing:
1. Adversarial Scorecard & Sanity Check.
2. False-Positive Discharge Table.
3. Database Migration & Security Risk Matrix.
4. Cross-Segment Blast Radius Analysis.
5. Final Hardened Pre-Production Action Plan.
```

---

## 4. Execution Protocol & Verification Rubric

### 4.1 Investigator (Agent 1) Quality Rubric
Before submitting findings, Agent 1 must verify:
- [ ] Every single documented issue assigned to the segment is individually addressed with current code citations.
- [ ] Live code was read directly (no guessing from file names or obsolete memory).
- [ ] Clear distinction made between real operational bugs and pre-production bloatware shims.
- [ ] 5-layer behavioral trace covers route reachability, async flow, state machine, DB round trip, and export output.
- [ ] Zero lines of source code in `src/` were edited or modified.

### 4.2 Adversarial Reviewer (Agent 2) Quality Rubric
Before concluding review, Agent 2 must verify:
- [ ] Every claim by Agent 1 was subjected to the "Under what field conditions will this fail?" test.
- [ ] False positives and purely theoretical lints were discharged with concrete technical justifications.
- [ ] Cross-segment blast radius was comprehensively analyzed across dependent modules.
- [ ] Competing alternatives were evaluated (Minimal Application Patch vs. Clean Schema/DDL Migration vs. Architectural Consolidation).
- [ ] Output provides a clear, hardened, prioritized action plan for pre-production implementation.

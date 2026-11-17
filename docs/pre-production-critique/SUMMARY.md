# Pre-Production Whole-Codebase Audit & Adversarial Synthesis

**Repository**: `talimul-quran-report-submission`  
**Standard**: 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`), Impeccable UI/UX Ergonomics, Pre-Production Agility & Zero Dead-Weight (`AGENTS.md` Rule 7), Adversarial Doubt Gate (`Rule 2 & 6`), Cross-Segment Cohesion Engine  
**Pipeline**: 15 Autonomous Agents (1 Master Prompt Architect + 7 Lead Investigators + 7 Adversarial Reviewers)  
**Execution Posture**: Strict Read-Only Audit — Zero Code Modifications in `src/`  
**Date**: 2026-11-16  
**Artifact Destination**: [`docs/pre-production-critique/`](file:///d:/WebDev/report-submission/docs/pre-production-critique/)  

---

## 1. Executive Synthesis & The Rule 7 Paradigm Shift

The entire documentation suite of reported issues, roadmaps, and bug trackers was historically drafted under defensive assumptions: preserving legacy prototypes, accommodating unconstrained test rows, avoiding database schema changes (DDL), and building fragile application-layer polyfills.

Under **`AGENTS.md` Rule 7 (Pre-Production Agility & DDL Authority)**:
> *"The platform is in active pre-production development and has NOT yet launched to live field workers.*  
> *When a defect or feature requires a database schema change, index addition, or RLS rewrite, **implement the clean DDL directly in Supabase**. Never invent complex application-layer shims, redundant query loops, or data-packing hacks to bypass a needed schema change.*  
> *Immediately DROP dead tables, orphaned functions, and obsolete views. Delete obsolete client components and unimported dependencies.*  
> *Never compromise architecture for backward compatibility: Do NOT maintain legacy shims, fallback polyfills, redundant param mappings, or dead data migrations solely to support outdated URLs, old test rows, or past schemas."*

Across 7 decoupled segments, the 14-agent dialectical audit re-evaluated the live codebase and all documented plans. The adversarial reviewers stress-tested every proposal through the **Doubt Gate** (*"Under what real-world field conditions will this clean-looking code fail?"*), exposing critical hidden hazards, intercepting dangerous implementation traps, and establishing a unified, production-grade roadmap.

---

## 2. Segment Scorecard & Quality Assessment

| Segment | Domain | Lead Investigator (A) | Adversarial Reviewer (B) | Subsystem Health Score | Key Behavioral Verdict |
|:---:|:---|:---|:---|:---:|:---|
| **01** | Data Calculation, Aggregation & Loader | [`01A`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-01-investigation.md) | [`01B`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-01-review.md) | **76 / 100** (Grade: B) | **CRITICAL MATH FIX**: Fix 13x attendance inflation in `view_city_meeting_agg`; add `month` to `report_header` via DDL; pin override queries. |
| **02** | Save Machine, Concurrency & State | [`02A`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-02-investigation.md) | [`02B`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-02-review.md) | **68 / 100** (Grade: C+) | **CRITICAL SAVE FIX**: Eliminate submission gate stale closure; stop premature write-ahead buffer wiping on superseded edits; intercept batch save wipeout trap. |
| **03** | Form Ergonomics & Section Presentation | [`03A`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-03-investigation.md) | [`03B`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-03-review.md) | **64 / 100** (Grade: C) | **CRITICAL ERGONOMICS**: Eliminate screen reader SQL column name leaks; enforce comments 1,500-char `maxLength`; add `readOnly` submission lock; intercept Report 23 duplicate key crash. |
| **04** | Auth, Access Control, Security & Zones | [`04A`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-04-investigation.md) | [`04B`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-04-review.md) | **76 / 100** (Grade: C+) | **CRITICAL AUTH FIX**: Fix Logout 405 Method Error (`POST` followed by `POST` on `/home`); patch PKCE open redirect; harden rate limiting against CGNAT mobile gate lockouts. |
| **05** | Routing, Canonical Navigation & Layout | [`05A`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-05-investigation.md) | [`05B`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-05-review.md) | **62.7 / 100** (Grade: C+) | **CRITICAL ROUTING**: Fix `report_id` vs `reportId` param mismatch across UI & exports; eliminate 248px mobile padding void; add iOS safe-area insets; defuse `ReportProvider` eviction trap. |
| **06** | Admin Workflows, Overrides & Exports | [`06A`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-06-investigation.md) | [`06B`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-06-review.md) | **76.5 / 100** (Grade: C+) | **CRITICAL EXPORT FIX**: Fix search pagination 10-row slice; consolidate 30 HTTP calls via `view_zone_stats`; rebalance PDF Page 2 (move Maktab to Page 1, freeing 44 pt); transpose Excel Personal table. |
| **07** | Database Schemas, DDL, Infra & Docs | [`07A`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-07-investigation.md) | [`07B`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-07-review.md) | **76 / 100** (Grade: B) | **CRITICAL INFRA & UNICODE**: Atomic ESM migration for `postcss.config.js` to prevent build crash; standardize 438 decomposed Nukta bytes; fix Tiro Bangla CSS selector `.lang-bn body`. |

---

## 3. Top 10 Critical Adversarial Interceptions & Field Reality Traps

The 7 Adversarial Reviewers stress-tested all preliminary findings against real-world mobile field conditions in Bangladesh (CGNAT carrier gateways, spotty 3G cellular, Islamic/Arabic keyboard layouts, low-end Android touch screens). The following traps were intercepted before any broken code was written:

1. **The PostCSS CommonJS Scope Crash (Segment 07)**:
   Subagent 07A recommended adding `"type": "module"` directly to `package.json`. Doing so immediately crashes Next.js 16 and Turbopack builds with `ReferenceError: module is not defined in ES module scope` because `postcss.config.js` uses CommonJS (`module.exports = { ... }`). The review mandates an atomic coupled migration: converting `postcss.config.js` to ESM (`export default { ... }`) alongside `package.json`.

2. **The DDL Duplicate Key Collision Trap (Segment 03)**:
   Subagent 03A proposed an immediate SQL `UPDATE` on `report_extra` replacing decomposed Nuktas with canonical `\u09df`. Empirical database inspection revealed that **Report 23 in `report_extra` already contains both decomposed and precomposed rows for the same categories (`'ওয়ার্ড প্রতিনিধির সফর'` and `'ওয়ার্ড প্রতিনিধির সফর'`)**. Running a direct update crashes PostgreSQL with unique constraint violation `23505`. An idempotent deduplication step must precede the normalization update.

3. **The "Atomic Batch Wipeout" Trap (Segment 02)**:
   Subagent 02A proposed replacing cell-level autosaves with an atomic batch RPC (`save_report_section`). On unstable rural 3G cellular connections in Bangladesh, batch saving turns a single transient packet drop or constraint failure into the **catastrophic loss of an entire 50-field section**. Continuous cell autosave must be retained; the true fix is decoupling indicator re-renders into a lightweight context.

4. **The "Phantom Reversal" Optimistic Rollback Trap (Segment 02)**:
   Subagent 02A proposed rolling back in-memory values to database snapshots on save error. In the field, rolling back values while a field worker is typing or navigating cells causes inputs to magically vanish before their eyes. The hardened remedy preserves dirty inputs in memory and the write-ahead buffer, flags the field as failed, blocks submission, and provides a clear retry button.

5. **The Carrier-Grade NAT (CGNAT) Conference Lockout Trap (Segment 04)**:
   Subagent 04A proposed a strict 30-attempt IP rate limit on login. In Bangladesh, mobile operators (Grameenphone, Banglalink, Robi) route thousands of devices through shared carrier gateways (`100.64.0.0/10`). If 30 field workers attend an administrative training workshop, an IP-level login gate would lock out the entire conference! The limiter was hardened to track only *failed* attempts and dual-keyed per account.

6. **The Sticky Column Truncation Trap (Segment 03)**:
   Subagent 03A proposed shrinking the sticky left column to `w-36 truncate` (144px). In `ORG_CATEGORIES`, rows 99 and 100 share an identical 51-character prefix: `"জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : "`, differing only in the last word (`"কতটি"` vs `"কতজন"`). Truncating at 144px turns both rows into `"জনশক্তির সহীহ্ কু..."`, making it impossible for field workers to distinguish unit counts from participant headcounts!

7. **The Razor-Thin PDF Margin & Page 1 Space Rebalancing (Segment 06)**:
   Page 2 vertical height currently sits at ~519 pt against a 523 pt maximum budget (a razor-thin buffer of 4.28 pt). Lowering comment line thresholds does not protect against Kalpurush font-metric line wrapping. The review discovered that **Page 1 has >120 pt of empty vertical space**. Moving the Maktab Summary Box to the bottom of Page 1 reclaims **44 pt on Page 2**, permanently eliminating unwanted Page 3 signature spillover.

8. **The Historical `ReportProvider` Eviction Trap (Segment 05)**:
   In previous sprints (`KI-023`), evicting `<ReportProvider>` from `RootLayout` crashed `UserDashboard` because it called `useReport()`. A strict 2-Phase protocol was mandated: Phase A completely decouples `UserDashboard` from `ReportContext` (managing scalar `reportId` locally), and only then does Phase B move `<ReportProvider>` to `src/app/report/layout.tsx`.

9. **The Mobile Touch Gesture Lockout (`disabled` vs `readOnly`) (Segment 03)**:
   Subagent 03A proposed setting `disabled={isSubmitted}` on all inputs. In mobile browsers, HTML `disabled` swallows touch-scroll gestures (trapping user swipes) and lowers text contrast below readable levels in outdoor sunlight. The review mandated `readOnly={isSubmitted}`, allowing fluid touch scrolling while preventing accidental edits.

10. **The Screen Reader SQL Column Name Announcer Leak (Segment 03)**:
    In all 4 matrix table views, `AutoSaveField` was passed `label=""` to hide visual labels in cells, causing `aria-label` to fall back to `name`. Visually impaired Bengali users were subjected to raw PostgreSQL column names like `"বিশিষ্টদের status_board"`, `"দাওয়াত দান amount"`, and `"রুকন became_shohojogi"`.

---

## 4. Master Consolidated Action Plan (4 Sequenced Tracks)

To systematically remediate all 14 segments under `AGENTS.md` Rule 7 without regressions, the implementation is organized into four sequential, independent tracks:

### Track 1: Database DDL, View Mathematics & Storage Hygiene
1. **Fix Meeting Attendance Aggregation**: Deploy updated `view_city_meeting_agg` with `COALESCE` null protection and weighted average attendance calculation: `round(sum(rm.total_attendance)::numeric / sum(rm.total_unit)::numeric)`.
2. **Add `month` to `report_header`**: Execute `ALTER TABLE public.report_header ADD COLUMN month smallint;` and update `get_or_create_report` RPC to write `month` directly, eliminating header snapshot desynchronization.
3. **Report 23 Extra Deduplication**: Run idempotent SQL deduplication script on `report_extra` to merge duplicate rows before standardizing Unicode Nuktas to canonical `\u09df`.
4. **Create `view_zone_stats`**: Consolidate the 30 HTTP HEAD calls in `/management` into a single declarative SQL view with `security_invoker = true`.
5. **Enforce Atomic Upsert on Overrides**: Transition `CorrectionButton` to direct 7-column `.upsert()` with `onConflict: "zone_id,month,end_month,report_type,section,field,category"`.

### Track 2: Core Save Machine, Concurrency & State Decoupling
1. **Fix Submission Gate Stale Closure**: Update `drainPendingSaves` to return `{ success, failedCount }` via synchronous `failedFieldsRef.current`, blocking submission if any save drops during the drain.
2. **Protect Write-Ahead Buffer (WAB)**: Update `updateField` to return `{ success: false, superseded: true }` on superseded edits so `AutoSaveField` never wipes unpersisted local drafts.
3. **Decouple Save Status Context**: Split `pendingSavesCount` and `isSaving` into a dedicated `SaveStatusContext`, eliminating ~80 re-renders per keystroke in matrix tables.
4. **Two-Phase `ReportProvider` Route Scoping**: Decouple `UserDashboard` from `ReportContext`, then move `<ReportProvider>` exclusively to `src/app/report/layout.tsx`.

### Track 3: Auth Security, Middleware & Route Governance
1. **Fix Logout 405 Method Error**: Update `src/app/auth/logout/route.ts` to inspect `content-type`: return JSON `{ success: true }` for client fetch callers and HTTP 303 (See Other) for standard HTML forms.
2. **Sanitize PKCE Open Redirect**: Whitelist canonical application paths (`/`, `/dashboard`, `/reports`, `/city-report`, `/management`, `/update-password`, `/report`) in `auth/callback/route.ts`.
3. **Harden Rate Limiting for CGNAT**: Track only *failed* login attempts (`login:failed:ip`, 60/15m) and dual-key per account (`login:failed:ip:account`, 5/15m); add dual limiter to `forgotPassword`.
4. **Purge Dummy Auth Sink**: Remove `unregistered-auth-sink@report.internal` and return immediately from Server Action.
5. **Dual-Tolerance Parameter Parsing**: Support both `reportId` and `report_id` across `report/page.tsx`, `pdf/route.tsx`, and `excel/route.ts`.

### Track 4: Matrix Ergonomics, Viewport Clearance & Export Parity
1. **Screen Reader Accessible Composite Labels**: Pass localized column titles to table mode inputs (`${tc(category)} — ${columnTitle}`).
2. **Comments 1,500-Character Guard**: Add `maxLength={1500}`, visual counter (`{toBn(len)} / ১৫০০`), and line-break collapse.
3. **Submission `readOnly` Banner**: Render non-destructive banner across all forms when `is_submitted === true`, setting `readOnly` on inputs with an accessible "সম্পাদনা আনলক করুন" toggle.
4. **Mobile Viewport Clearance & Safe Areas**: Remove `pb-20` from `<main>`, add `env(safe-area-inset-bottom)` to `BottomNav`, and calibrate `SectionLayout` to `calc(10rem + safe-area)`.
5. **Rebalance PDF Page 2**: Move Maktab Summary Box to the bottom of Page 1 (reclaiming 44 pt on Page 2) and wrap signatures in `<View wrap={false}>`.
6. **Excel Exporter Parity**: Transpose Personal table (7 metrics Y-axis $\times$ 3 categories X-axis) and add Excel `=SUM(...)` formulas for Course and Personal totals.
7. **Replace Decomposed Nukta Bytes**: Standardize 438 occurrences of decomposed `\u09bc` across 32 source files to canonical precomposed `\u09df`.
8. **ESM Migration & Tiro Bangla CSS**: Atomic coupled migration of `postcss.config.js` to ESM + `package.json` `"type": "module"`; fix `globals.css` selector to `html[lang="bn"] body`.

---

## 5. Verification Gates & Execution Protocol

Before any code changes are proposed or executed in future implementation turns, the following invariants are locked:
1. **Strict Quality Gates**: Every proposed fix must verify all four quality gates:
   - `npm test` $\rightarrow$ 100% pass rate across all suites.
   - `npx tsc --noEmit` $\rightarrow$ 0 type errors.
   - `npm run lint` $\rightarrow$ 0 errors / 0 warnings.
   - `npm run build` $\rightarrow$ Clean Turbopack compilation exit code `0`.
2. **Zero Dead-Weight**: Quarantining replaced files to `.discard/` with zero unilateral deletion.
3. **Documentation Sync**: Immediate reconciliation of `TECHNICAL_MANUAL.md`, `ROADMAP.md`, `KNOWN_ISSUES.md`, and new ADRs (`ADR 031+`).

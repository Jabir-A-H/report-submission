# ADR 031: Track 1 Pre-Production Database DDL, View Mathematics, and Client Query Consolidation

**Date**: 2026-11-17  
**Status**: Accepted and Implemented  
**Deciders**: System Owner & Antigravity  
**Consulted**: `docs/pre-production-critique/SUMMARY.md`, `AGENTS.md` (Rules 2 & 6: Multi-Option Planning & Adversarial Doubt Gate; Rule 7: Pre-Production Agility & Clean DDL Authority)

---

## 1. Context and Problem Statement

Following the 15-agent whole-codebase pre-production audit across 7 decoupled segments (`docs/pre-production-critique/`), **Track 1** targeted critical mathematical errors, schema data invariants, excessive network query cascades, and Unicode composition drifts across the active pre-production system:

1. **Meeting Attendance 13x Arithmetic Inflation in SQL View & Loader (`WEB-013`)**:
   - `public.view_city_meeting_agg` performed arithmetic summation over average attendance: `sum(rm.city_avg_attendance)`.
   - On single-month City Reports, this caused a **13x arithmetic inflation** (e.g. 20 attendees displayed as 260) by summing zone averages rather than computing a weighted average.
   - When any zone omitted counts or averages, PostgreSQL ternary logic (`NULL * count`) caused entire rows to evaluate to `NULL` in arithmetic expressions.

2. **Stock Snapshot Desynchronization & Client Month Shaping (`WEB-004`)**:
   - `report_header` lacked a native `month` column.
   - `loadReportDataBundle()` had to query parent `report(id, month)`, build an in-memory `monthMap`, and manually decorate rows.
   - In `src/app/report/page.tsx`, 167 lines of duplicated queries completely omitted `monthMap`, causing `sumHeaderRows()` to sort by `0 - 0 = 0`, resolving stock metrics (`total_muallima`, `total_unit`) from arbitrary row arrival order rather than the latest month.

3. **Management Page Network Cascade ($2 \times N$ HTTP Calls) (`WEB-002`)**:
   - In [`src/app/(admin)/management/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx), `fetchZoneStats` ran a loop over all zones, firing two HTTP `HEAD` calls with `count: "exact"` per zone (30 HTTP calls per page load).
   - On mobile connections in Bangladesh, this saturated HTTP/1.1 connection pools and delayed dashboard responsiveness.

4. **Non-Atomic Check-Then-Act in `CorrectionButton` (`BL-06-01`)**:
   - In [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx), saving an override executed a `SELECT` query to test for existing rows, followed conditionally by `UPDATE` or `UPSERT`.
   - This exposed the operation to concurrent race conditions and threw PostgREST HTTP 400 errors when constraint parameters mismatched.

5. **Report 23 Duplicate Key Collision & Unicode Nukta Disparity (`DEF-07-02`)**:
   - Under Unicode standard UAX #15, Bengali Nukta characters (`U+09DC..U+09DF`) are in `CompositionExclusions.txt`. JavaScript `.normalize('NFC')` leaves decomposed sequences (`\u09AF\u09BC`) untouched.
   - In `report_extra`, Report 23 already contained both decomposed and precomposed rows for the same categories (`'ওয়ার্ড প্রতিনিধির সফর'` and `'ওয়ার্ড প্রতিনিধির সফর'`), causing unique constraint violation `23505` on direct update.
   - In client code, category constants in `report-utils.ts` held decomposed bytes while PostgreSQL child tables were locked with `CHECK (position(chr(2492) in category) = 0)`, causing `0-row update` silent dropouts.

6. **PostCSS CommonJS Scope Crash with `"type": "module"` (`BLOAT-07-04`)**:
   - Node 22 test runner emitted `[MODULE_TYPELESS_PACKAGE_JSON]` warnings during `npm test`.
   - Adding `"type": "module"` naively to `package.json` crashed Next.js 16 and Turbopack builds because `postcss.config.js` was written in CommonJS (`module.exports = { ... }`).

7. **Tiro Bangla Typography Selector Invalidation (`DEFECT-07-01`)**:
   - In `src/app/globals.css`, the selector `.lang-bn body` never matched because `<body>` is never a descendant of class `.lang-bn` (the app sets attribute `lang="bn"` on `<html>`).
   - The browser fell back to unoptimized system fonts on mobile devices.

---

## 2. Decision Outcomes Matrix

| Problem Area | Chosen Architecture (Option A) | Rejected Alternatives | Architectural Rationale & Implementation Details |
|:---|:---|:---|:---|
| **1. Meeting Attendance Aggregation** | **Weighted Average SQL View with `COALESCE` & Fallback** | Client-Side Weighted Mean Post-Processing (Option B); Imperative RPC (Option C) | Re-created `view_city_meeting_agg` with `round(sum(COALESCE(count, 0) * COALESCE(avg, 0))::numeric / sum(COALESCE(count, 0))::numeric)` and fallback to `avg()` when count is 0, retaining `WITH (security_invoker = true)`. Fixed 13x attendance inflation at the storage tier. |
| **2. Header Month Alignment & Snapshot Parity** | **Native `report_header.month` Column + Atomic RPC Update** | Client `monthMap` In-Memory Shaping (Option B); Database View Joining `report` (Option C) | Added `month smallint NOT NULL` to `report_header` via DDL, backfilled existing rows, and updated `get_or_create_report` RPC to insert `month` directly. Refactored `report/page.tsx` to consume `loadReportDataBundle()`, eliminating 167 lines of duplicate queries and guaranteeing latest-month stock sorting. |
| **3. Management Stats Consolidation** | **Declarative SQL View `view_zone_stats`** | Batched PostgREST In-Filters (Option B); Periodic Cron Aggregation Table (Option C) | Deployed `view_zone_stats` with `security_invoker = true` joining `zone` with user counts from `people` and report counts from `report`. Replaced 30 HTTP HEAD calls with a single declarative `.from('view_zone_stats').select('*')` query in `management/page.tsx`. |
| **4. Override Mutation Atomicity** | **Atomic 7-Column `.upsert()` with `NULLS NOT DISTINCT`** | Two-Step Stored Procedure (Option B); Keep Check-Then-Act with Mutex (Option C) | Updated `CorrectionButton` to execute a single atomic `.upsert()` targeting `onConflict: "year,month,end_month,report_type,section,field,category"`. Guaranteed `end_month: endMonth || 0` is passed in payload. |
| **5. Unicode Nukta Normalization & Report 23 Safety** | **CTE Metric Merging & Canonical Precomposed NFC `\u09df`** | Regex Normalizer at PostgREST Gateway (Option B); Pre-Production Table Truncate (Option C) | Migrated `report_extra` duplicates by merging numbers (`GREATEST(d.number, p.number)`) before deleting duplicates and standardizing to precomposed `\u09df`. Aligned category constants in `report-utils.ts`, test fixtures in `report-utils.test.ts`, and implemented bidirectional `tc()` normalization. |
| **6. Build Tooling & ESM Migration** | **Coupled Atomic ESM Migration (`postcss.config.js` + `package.json`)** | Retaining CommonJS with Suppressed Warnings (Option B); Renaming to `.mjs` (Option C) | Converted `postcss.config.js` to pure ESM (`export default { ... }`) and added `"type": "module"` to `package.json`. Eliminated Node 22 test runner warnings while compiling cleanly in Turbopack. |
| **7. Bengali Typography Activation** | **Modern Attribute Selectors `html[lang="bn"] body, :lang(bn) body`** | Dynamic React Class Injection (Option B); Inline Body Style Injection (Option C) | Replaced dead `.lang-bn body` selector in `src/app/globals.css`. Google's `Tiro Bangla` serif font now activates immediately during SSR based on the language cookie with zero FOIF. |

---

## 3. Verification and Quality Gates

All four quality gates passed cleanly with zero errors:
1. **TypeScript Type Safety**: `npx tsc --noEmit` $\rightarrow$ 0 errors.
2. **ESLint Static Analysis**: `npm run lint` $\rightarrow$ 0 errors / 0 warnings.
3. **Unit & Integration Test Suite**: `npm test` $\rightarrow$ 71/71 tests passing across 22 test suites (541ms).
4. **Production Build Compilation**: `npm run build` $\rightarrow$ Clean exit code `0`, all 18 routes compiled and verified with Turbopack.

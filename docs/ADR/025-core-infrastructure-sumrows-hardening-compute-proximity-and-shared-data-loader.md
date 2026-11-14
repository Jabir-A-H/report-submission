# ADR 025: Core Infrastructure Hardening, Compute Proximity, Font Asset Tracing, and Shared Report Data Loader

**Date**: 2026-11-14  
**Status**: Accepted and Implemented  
**Deciders**: System Owner & Antigravity  
**Consulted**: `docs/codebase-critique/SUMMARY.md`, `docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md`, `AGENTS.md` (Rule 7: Pre-Production Agility)

---

## 1. Context and Problem Statement

Following the completion of Track 1 (Bloatware and Dead-Weight Code Pruning), four core infrastructure, performance, and data-pipeline vulnerabilities remained in the pre-production reporting engine:

1. **Arithmetic String Concatenation in `sumRows()` (`src/lib/report-utils.ts`)**:
   In `sumRows()`, row values were accumulated via `(existing[k] || 0) + (row[k] || 0)`. When initial rows or database payloads emitted numbers as strings (e.g. `"5"`), JavaScript executed string concatenation (`"5" + 3 = "53"`), resulting in 10x–100x data inflation. Furthermore, truthy zero strings (`"0" || 0 === "0"`) produced `"00"`, and naive numeric coercion (`Number(val) || 0`) silently wiped legitimate Bengali numerals (`"১২"`) to `0` and crashed string methods on text keys (`meeting_name`, `comments`).
2. **Transatlantic Compute Latency Cascade (`vercel.json`)**:
   Supabase PostgreSQL is hosted in Sydney (`ap-southeast-2`), while Vercel defaulted Serverless Functions to Washington D.C. (`iad1`). Every multi-query SSR page and export endpoint incurred ~1,510ms latency across 5 sequential round-trips from Bangladesh (`Asia/Dhaka`).
3. **Serverless Font Asset Tracing Crash in PDF Exports (`next.config.mjs`)**:
   In `src/app/api/export/pdf/route.tsx`, `Font.register` loaded `public/fonts/kalpurush.ttf` dynamically via `process.cwd()`. Next.js AST bundlers (`@vercel/nft`) failed to trace dynamic filesystem reads, stripping the font from the serverless Lambda zip and throwing `ENOENT` 500 crashes in production.
4. **Export Route Query & Aggregation Duplication (~500 lines)**:
   `src/app/api/export/pdf/route.tsx` and `src/app/api/export/excel/route.ts` duplicated ~500 lines of identical database queries, period resolution, override lookups, and aggregation math, causing cross-format calculation drift whenever fixes were applied to only one exporter.

---

## 2. Decision Outcomes Matrix

| Problem Area | Chosen Architecture (Option A) | Rejected Alternatives | Architectural Rationale & Implementation Details |
|:---|:---|:---|:---|
| **1. `sumRows` Arithmetic** | **Hardened Utility Layer (`toFiniteNumber`)** | Zod Ingestion Schemas (Option B); Dedicated Domain Reducers (Option C) | Added `toFiniteNumber(val: unknown): number` with `bnToEn()` normalization, boolean defense (`true`/`false` $\rightarrow$ 0), and `Number.isFinite()` checks. Added `NON_NUMERIC_KEYS` guard. Deduplicated text accumulators via regex token splitting (`/\r?\n\|,\s*/`) and `Set`. |
| **2. Regional Proximity** | **Root `vercel.json` with `["syd1"]`** | Route-level `preferredRegion` (Option B); Edge Runtime (Option C) | Created root `vercel.json` pinning all Node.js serverless lambdas to Sydney (`syd1`), co-locating compute directly with the Supabase PostgreSQL host. Peering latency drops from ~220ms to < 2ms per query. (Edge runtime disqualified as `@react-pdf/renderer` and `exceljs` require Node `fs`, `stream`, `zlib`). |
| **3. Font Asset Tracing** | **Next.js `outputFileTracingIncludes`** | Base64 Font Inlining (Option B); Remote CDN Fetch (Option C) | Added `outputFileTracingIncludes: { "/api/export/pdf": ["./public/fonts/kalpurush.ttf"] }` in `next.config.mjs`. Ensures the 314 KB TTF file is bundled into the lambda container with 0ms cold-start penalty, avoiding Base64 bundle bloat (420 KB) and CDN network fragility. |
| **4. Export Pipeline** | **Shared `loadReportDataBundle()` Loader** | PostgreSQL View/RPC Consolidation (Option B); React Context / RSC (Option C) | Extracted `src/lib/report-data-loader.ts` exporting a standardized `ReportDataBundle` contract. Handles Case A (Single Zone) and Case B (City Aggregation with canonical Bengali period override resolution). Eliminates ~586 duplicated lines across PDF and Excel routes. |

---

## 3. Adversarial Doubt Gate Remediations

During adversarial audit by the **Track 2 Adversarial Reviewer**, one subtle edge case was identified:
- **Header Snapshot Chronological Month Resolution (RS-03)**:
  `report_header` table does not contain a native `month` column (it references parent `report_id`). In multi-month single-zone aggregation, querying `report` with `.select("id")` resulted in `rawHeader` rows having `h.month === undefined`. `sumHeaderRows` evaluated `(Number(a.month) || 0) - (Number(b.month) || 0)` as `0 - 0 = 0`, causing stock snapshot metrics (`total_muallima`, `total_unit`) to resolve from whichever row PostgreSQL returned last rather than the chronological latest month of the period.
- **Surgical Remedy (Track 2 Fixer Agent)**:
  Updated `monthlyReports` query to select `"id, month"`, constructed a `monthMap`, and enriched `rawHeader` rows with `month: monthMap.get(h.report_id)` prior to invoking `sumHeaderRows(rawHeader)`. Added automated unit test in `src/lib/report-data-loader.test.ts`.

---

## 4. Verification and Quality Gates

All 4 quality gates verified and passing locally:
1. **TypeScript**: `npx tsc --noEmit` $\rightarrow$ 0 errors.
2. **Linting**: `npm run lint` $\rightarrow$ 0 errors / 0 warnings.
3. **Unit Tests**: `npm test` $\rightarrow$ 43/43 tests passing across 3 test suites (`report-utils.test.ts`, `date-utils.test.ts`, `report-data-loader.test.ts`).
4. **Production Build**: `npm run build` $\rightarrow$ Clean exit code 0, all 18 routes compiled with Turbopack.

# ADR 024: Canonical Report Routing, Export Data Loader, Compute Proximity, and Pre-Production Architecture Reconciliation

**Date**: 2026-11-07  
**Status**: Accepted and Planned  
**Deciders**: System Owner & Antigravity  
**Consulted**: `docs/report-submission-issue-register.md`, `docs/codebase-critique/SUMMARY.md`, `docs/pre-production-cleanup-plan.md`, `AGENTS.md`  

---

## 1. Context and Problem Statement

Following the completion of the 15-agent whole-codebase audit (`docs/codebase-critique/`), eight architectural and policy issues remained across previous audit registers and remediation tracks:
1. **Fragile Sub-Section URL Routing (RS-60)**: Passing 3-tuple query parameters (`?type=monthly&month=X&year=Y`) triggered 7 sequential RPC and auth round-trips on every tab change, dropping mobile focus and risking state desynchronization.
2. **Per-Zone Header Snapshot Missing Month (RS-03)**: `report_header` lacks a `month` column, leaving multi-month per-zone inventory calculations unstable in `sumHeaderRows`.
3. **PDF Page 2 Print Budget Overflow (C06-01)**: Placing both Maktab and Safar blocks on Page 2 exceeded the 523.28 pt landscape A4 ceiling (~558 pt), pushing remarks onto an unwanted 3rd page and violating ADR 007.
4. **Export Route Query Duplication (~500 lines)**: `excel/route.ts` and `pdf/route.tsx` duplicated ~255 lines of identical database querying and override-merging branches, causing export drift when bugs were patched in one format only.
5. **Transatlantic Compute Latency Cascade**: Lack of `vercel.json` caused Vercel serverless functions to execute in Washington DC (`iad1`), adding ~440ms–1.2s round-trip transit delay to Supabase Sydney (`ap-southeast-2`).
6. **Privilege Escalation on User Deletion (C05-04)**: Standard admins could delete superadmin accounts or self-delete in `deleteUserAction` via the service-role key.
7. **Section Forms Ergonomics (C04-02 / C04-04)**: `personal-form.tsx` lacked live computed row totals during data entry; `organizational-form.tsx` required holistic review regarding its two view modes (`table` and `card`).
8. **Language Flash / FOIC (C02-02)**: `RootLayout` hardcoded `<html lang="bn">`, and `LanguageProvider` switched to English client-side after mount via `localStorage`, causing a visible language jump on reload.

On 2026-11-07, an interactive confirmation and holistic code review was conducted with the system owner. This ADR formally records the decisions, technical trade-offs, and architecture.

---

## 2. Decision Outcomes Matrix

| Issue ID | Area | Decision | Architectural Rationale & Implementation Details |
|:---|:---|:---|:---|
| **RS-60** | **Section Navigation** | **Canonical `reportId` URL Navigation** | Transition sub-section links to `/report/[section]?reportId=42`. `SectionSwitcher` switches components in-memory when `reportId` matches context. If bare URLs are accessed without `reportId`, an automated fallback resolver initializes the active monthly report and replaces the URL. |
| **RS-03** | **Header Snapshot Month** | **Query-Layer Month Attachment (Backlog DDL queued)** | Attach parent `month` in the data-fetching layer for now; clean DDL migrations (adding `month` directly to `report_header` and dropping dead objects) are documented in `docs/pre-production-schema-cleanup-backlog.md` for later evaluation. |
| **C06-01** | **PDF Print Budget** | **Move Maktab Summary to Page 1 Bottom** | Anchors strictly to ADR 007 §2.5: Page 1 holds Section 0, 1, 3, and Maktab summary (~478 pt); Page 2 holds Section 2, 4, Safar summary, and Section 5 Comments/Signatures (~513 pt). Guarantees double-sided single-sheet printing. |
| **Pipeline** | **Export Architecture** | **Shared `report-data-loader.ts`** | Extract query, aggregation, and override merging branches into `src/lib/report-data-loader.ts`. Both `excel/route.ts` and `pdf/route.tsx` consume `loadReportDataBundle()` and focus 100% on document rendering. |
| **Compute** | **Compute Proximity** | **Pin Vercel Functions to `syd1`** | Add root `vercel.json` with `"regions": ["syd1"]`, co-locating serverless execution with Supabase Sydney (`ap-southeast-2`). Peering latency drops from ~220ms to < 2ms. |
| **C05-04** | **User Governance** | **Strict 2-Tier Role Hierarchy Guard** | In `deleteUserAction`, enforce: standard admins can only delete `user` accounts; superadmins can delete `user` and `admin`; superadmins can only be deleted by another superadmin; self-deletion is blocked. |
| **C04-02 / C04-04** | **Section Forms** | **Personal Totals Added; Org Form Kept As-Is** | In `personal-form.tsx` table mode, add a read-only live computed `মোট` (Total) badge column. In `organizational-form.tsx`, retain existing 2 view modes (`table` and `card`) without forcing accordions, preventing unnecessary click friction. |
| **C02-02** | **Root Shell & i18n** | **Server-Side Cookie Read in `RootLayout`** | Read `app-language` cookie on the server in `RootLayout`, passing `initialLanguage` to `LanguageProvider` and `<html lang={lang}>`. Eliminates Flash of Incorrect Content (FOIC) and aligns SSR metadata. |

---

## 3. Pre-Production Schema & Dead-Weight Backlog

During the review, past architectural compromises were examined against `AGENTS.md` Rule 7 (Pre-Production Agility & Zero Dead-Weight). A dedicated backlog was established in [`docs/pre-production-schema-cleanup-backlog.md`](file:///d:/WebDev/report-submission/docs/pre-production-schema-cleanup-backlog.md) for future execution:
1. **Direct `month` column on `report_header`**: Add `month smallint NOT NULL` via DDL and update the RPC.
2. **Permanent dropping of dead objects**: Drop `legacy_people`, `handle_new_auth_user`, `view_city_course_final`, and prune `session-cleaner.tsx`.
3. **DCS Zone 1 hierarchy migration**: Add `zone_type` and `parent_id` to `zone`, update views to `WHERE z.zone_type != 'city'`, and eliminate `zone_id === 1` magic number checks.
4. **Database category string cleanup**: Standardize historical test rows to canonical Unicode NFC strings and prune dual-string TypeScript shims.

---

## 4. Verification and Safety Invariants
- **No Application Code Changes in This Turn**: This session strictly establishes decisions and updates project documentation.
- **Quality Gates Maintained**: All 4 quality gates remain verified and passing:
  - Lint: `npm run lint` (0 errors)
  - TypeScript: `npx tsc --noEmit` (0 errors)
  - Tests: `npm test` (24/24 passing)
  - Build: `npm run build` (Clean exit code 0)

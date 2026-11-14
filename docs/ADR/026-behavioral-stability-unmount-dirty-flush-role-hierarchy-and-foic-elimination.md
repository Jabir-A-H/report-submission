# ADR 026: Form Lifecycle Stability, Unmount Dirty-State Flush, Role Hierarchy Enforcement, and Zero-FOIC Architecture

**Date**: 2026-11-14  
**Status**: Accepted and Implemented  
**Deciders**: System Owner & Antigravity  
**Consulted**: `docs/critiques/SUMMARY.md`, `docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md`, `AGENTS.md` (Rule 7: Pre-Production Agility)

---

## 1. Context and Problem Statement

Following the completion of Track 1 (Bloatware Pruning) and Track 2 (Core Infrastructure), six high-priority behavioral, ergonomic, and access-control vulnerabilities remained in the active pre-production codebase:

1. **Active Input Focus-Loss & Form Remount Loop (`src/app/report/[section]/page.tsx`)**:
   `page.tsx` included in-memory `data`, `reportId`, and `t` in its route loader `useEffect` dependency array. Every keystroke auto-save blur mutated `data` in `ReportProvider`, causing the effect to re-run, fire `setIsLoading(true)`, unmount the active section form, collapse the mobile virtual soft keyboard, and drop active input focus.
2. **Unmount Dirty-State Dropping (`src/components/report/auto-save-field.tsx`)**:
   `AutoSaveField` flushed on `visibilitychange` and `beforeunload`, but lacked a cleanup flush on React component unmount. When a mobile field worker typed into a field and immediately tapped the next section tab (or collapsed a card) before blurring, client-side navigation unmounted the field and dropped the in-flight edit.
3. **City Report Inline Period Selector Mismatch (`src/app/(admin)/city-report/page.tsx`)**:
   `<select>` mapped `REPORT_TYPES` with canonical English values (`"quarterly"`, `"halfYearly"`, `"custom"`), but downstream JSX checks evaluated against raw Bengali strings (`reportType === "ত্রৈমাসিক"`). Consequently, selecting any multi-month period caused the respective Quarter, Half-Year, or Custom Range selector dropdown to completely vanish from the UI.
4. **Privilege Escalation on User Deletion (`src/app/(admin)/management/actions.ts`)**:
   `deleteUserAction` verified that the caller had an `admin` or `superadmin` role, but never queried the target account's role. A standard admin could delete superadmins via the service role key bypass. Furthermore, omitting `supabaseUid` bypassed self-deletion checks, and deleting the final superadmin risked total organizational lockout.
5. **PDF Page 2 Print Budget Squeeze & Orphaned Prototype (`src/app/api/export/pdf/route.tsx`)**:
   Stacking Section 2, Section 4, Maktab Block, Safar Block, Comments, and Signature on Page 2 consumed ~500 pt of vertical height against a 523.28 pt landscape A4 ceiling. Multiline Section 5 remarks broke the page, spilling the signature onto an unwanted Page 3 and violating ADR 007's 2-page print guarantee. Additionally, `city-report-pdf.tsx` lingered as an unreferenced client prototype with hardcoded `Helvetica` font (rendering Bengali text as tofu).
6. **Flash of Incorrect Content (FOIC) on SSR (`src/app/layout.tsx` & `language-provider.tsx`)**:
   `RootLayout` hardcoded `<html lang="bn">`, while `LanguageProvider` defaulted to `"bn"` and read `localStorage` only on client mount. English-preferring users experienced a visible language flicker/jump and layout shift (CLS) on every page refresh.

---

## 2. Decision Outcomes Matrix

| Problem Area | Chosen Architecture (Option A) | Rejected Alternatives | Architectural Rationale & Implementation Details |
|:---|:---|:---|:---|
| **1. Focus-Loss Render Loop** | **Decouple Route Loader Dependencies** | Soft Background SWR (Option B); Separate Route Guard Wrapper (Option C) | Removed `data`, `reportId`, and `t` from `useEffect` dependencies, pinning exclusively to routing primitives (`[typeParam, monthParam, yearParam, hasValidParams, supabase, router, setReportId, loadReport, loadError]`). Synchronized mutable refs (`lastLoadedKeyRef`, `tRef`, `dataRef`) outside render to prevent redundant re-fetches and guarantee 100% keyboard focus stability on mobile. |
| **2. Unmount Dirty-State Flush** | **Ref-Based Synchronous Unmount Flush** | Debounced 500ms `onChange` Save (Option B); Global Form State Lifting (Option C) | Maintained `dirtyRef`, `latestValueRef`, and `persistRef`. In `useEffect` unmount cleanup, synchronously executed `if (dirtyRef.current) persistRef.current()`. Guarantees zero dropped keystrokes when switching section tabs or collapsing cards, backed by `isMountedRef` to prevent unmounted state update warnings. |
| **3. Period Selector Mismatch** | **Canonical English State Tokens** | Change Handler Token Normalization (Option B); Changing `REPORT_TYPES` to Bengali (Option C) | Standardized state on canonical English tokens (`useState("monthly")`) matching `REPORT_TYPES[rt.value]`. Updated downstream conditional blocks to evaluate `"monthly"`, `"quarterly"`, `"halfYearly"`, `"custom"`, and `"nineMonth"` / `"yearly"`. Retains seamless integration with `resolvePeriodConfig()` and export APIs. |
| **4. User Deletion Hierarchy** | **Authoritative Target Lookup & 2-Tier Role Matrix** | PostgreSQL Database Trigger (Option B); Client-Passed Target Role (Option C) | Looked up target profile (`id, role, supabase_uid`) from `people` using service role client: <br>1. Strictly blocked self-deletion checking both `supabase_uid === user.id` and `id === requesterProfile.id`.<br>2. Blocked `admin` from deleting other `admin` or `superadmin` accounts.<br>3. Blocked deletion of the last remaining superadmin (`count <= 1`).<br>4. Dispatched deletion via `auth.admin.deleteUser` to cascade and eliminate orphaned auth rows. |
| **5. PDF Page 2 Print Budget** | **Side-by-Side Summary Blocks (Page 2) & Quarantine** | Maktab to Page 1 Bottom (Option A2); Global Font Shrinking (Option B) | Placed Maktab Summary and Safar Summary side-by-side in a 2-column flex row (`width: "49.2%"`, `marginBottom: 6`) on Page 2, saving ~44 pt of vertical height and expanding comment headroom to ~100 pt without risking Page 1 overflow. Safely quarantined dead prototype `city-report-pdf.tsx` to `.discard/` under Rule 4. |
| **6. Zero FOIC & Locale Sync** | **Async `RootLayout` Server Cookie Resolution** | Inline Blocking `<head>` Script (Option B); URL Subpath Routing (Option C) | Converted `RootLayout` into an `async` Server Component that reads `app-language` via `await cookies()`. Passed `initialLanguage` to `<html lang={initialLanguage}>` and `<LanguageProvider initialLanguage={initialLanguage}>`. Synchronized `document.cookie` (`SameSite=Lax`, 1-year max-age) and `localStorage` on language change, achieving 0ms FOIC and zero hydration mismatches. |

---

## 3. Verification and Quality Gates

All 4 quality gates verified and passing locally:
1. **TypeScript**: `npx tsc --noEmit` $\rightarrow$ 0 errors.
2. **Linting**: `npm run lint` $\rightarrow$ 0 errors / 0 warnings.
3. **Unit Tests**: `npm test` $\rightarrow$ 43/43 tests passing across 3 test suites (`report-utils.test.ts`, `date-utils.test.ts`, `report-data-loader.test.ts`).
4. **Production Build**: `npm run build` $\rightarrow$ Clean exit code 0, all 18 routes compiled with Turbopack.

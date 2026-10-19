# Report-Submission Issue Register (AI-ready)

This file consolidates every issue, retraction and decision from the full review of `Jabir-A-H/report-submission`. It supersedes `report-submission-audit-findings.md` and `report-submission-usability-options.md`, which predate several fixes and corrections.

## 0. How to use this file

**Baseline:** code at commit `b7ed652` (Sprint 2 / ADR 016), 2026-09-20. The ADR 014 and ADR 015 commits are also included. Line numbers are approximate and drift; locate by function or symbol name.

**Product context:** a monthly report system for about 20-30 field workers, mobile-first, Bengali-first. Next.js 16, React 19, Supabase (Auth/Postgres/RLS), Tailwind v4, Vercel. Maintained solo by the owner.

**Status vocabulary**
| Status | Meaning |
|---|---|
| `OPEN-BUG` | Code-verified defect. Safe to implement a fix. |
| `VERIFY-FIRST` | Plausible defect that depends on DB schema/policy/behavior not visible in the repo. Run the verification step before changing code. |
| `OPEN-DECISION` | Not clearly a bug. The owner must choose between options. Do not implement without confirmation. |
| `PARTIAL` | Partly fixed. The remainder is listed. |
| `RESOLVED` | Fixed in the baseline (kept for context and regression guarding). |
| `DEFERRED` | Owner chose to postpone. |
| `DECIDED-NOT-DOING` | Owner decided against it. |
| `RETRACTED` | An earlier claim was wrong (see section 5). Do not act on it. |

**Severity:** `High` = wrong numbers, silent data loss, or an access/support dead-end for real users. `Medium` = degraded reliability or usability with a workaround. `Low` = cosmetic, hygiene or rare edge case.

**Confidence:** `code-verified` means read directly in repo files. `inferred` means reasoned from code plus documentation. `unverifiable-here` means it depends on database or hosting state that this review could not see.

**Blind spot:** none of the following are in the repo, so every claim about them is unverified: the `get_or_create_report` RPC, RLS policies, view definitions (`view_city_*_agg`), CHECK constraints, unique indexes, Supabase Auth settings, and hosting regions. Section 7 lists how to check them. `AGENTS.md` prefers the Supabase MCP server over custom scripts for this.

## 1. Agent operating constraints

From the repo's `AGENTS.md` and the owner's feedback during the review:
- Never commit, and never run destructive git commands (`git checkout`, `restore`, `reset --hard`), without explicit permission. The owner reviews with `git diff` / `git show`.
- Prefer the Supabase MCP server over custom Node/Python scripts when it covers the need.
- After a work session, update docs in this order: `TECHNICAL_MANUAL.md`, `ROADMAP.md`, `KNOWN_ISSUES.md`, then a new ADR if the change is architectural.
- Pre-flight before finishing: `eslint`, `tsc --noEmit` and `npm run build` must pass clean.
- Source-of-truth order: `TECHNICAL_MANUAL.md` > `docs/ADR/*` > `ROADMAP.md` > `KNOWN_ISSUES.md` > live code.
- Review lesson: three claims in earlier drafts were wrong because they came from grep hits and not full-file reads (section 5). Read the entire file before asserting what it does or doesn't do. Grep is for locating, not concluding.
- The owner wants recommendations justified by the code, with alternatives and industry practice, and no generic "optimize everything" advice.

## 2. Index

| ID | Title | Sev | Status |
|---|---|---|---|
| RS-01 | Overrides on non-monthly city views saved under the wrong month key | High | RESOLVED (ADR 018) |
| RS-02 | Empty override value silently becomes 0 | Med | RESOLVED (ADR 020) |
| RS-03 | Per-zone multi-month header snapshot may pick an arbitrary row | High | VERIFY-FIRST |
| RS-04 | City snapshot uses the latest month's partial data, with no coverage indicator | Med | VERIFY-FIRST |
| RS-05 | Non-monthly periods are hardcoded to start in January (KI-017) | Med | PLANNED (ADR 022) |
| RS-06 | Overrides are absolute, unaudited replacements, and can duplicate | Med | PLANNED (ADR 022) |
| RS-07 | No reasonableness checks on entered numbers | Low | DECIDED-NOT-DOING (ADR 022) |
| RS-08 | Admin "reports" list includes reports that were only opened | Med | RESOLVED (ADR 021) |
| RS-09 | Admin "unique zones" stat uses an unordered `limit(1000)` | Low | RESOLVED (ADR 021) |
| RS-10 | Non-monthly report rows can be created by URL | Low | RESOLVED (ADR 021) |
| RS-11 | Multiple users can share one zone and silently co-edit | Med | DECIDED-NOT-DOING (ADR 022) |
| RS-12 | Reassigning a zone mid-month orphans the in-progress report | Med | DECIDED-NOT-DOING (ADR 022) |
| RS-13 | Submission state is cosmetic and self-reported | Med | DECIDED-NOT-DOING (ADR 022) |
| RS-14 | Admin dashboard zone-scoping logic is unreachable | Low | DECIDED-NOT-DOING (ADR 022) |
| RS-20 | Global `saveError` is cleared by any later success; no rollback | High | RESOLVED (ADR 018) |
| RS-21 | `.select('id')` save check may false-fail if RLS SELECT differs from UPDATE | High | VERIFY-FIRST |
| RS-22 | `loadReport` swallows errors and shows an empty form | High | RESOLVED (ADR 018) |
| RS-23 | Nested `ReportProvider` per section page; remount per navigation | Med | RESOLVED (ADR 018) |
| RS-24 | Autosave "retry" button only dismisses the error | Low | RESOLVED (ADR 018) |
| RS-25 | `beforeunload` flush is best-effort on mobile | Low | PARTIAL |
| RS-26 | `.eq('category')` appended after `.select()` | Low | VERIFY-FIRST |
| RS-27 | Category lists live in both code and DB seed (drift risk) | Med | RESOLVED (ADR 020 / ADR 022) |
| RS-30 | Digits typed in Bengali flip to ASCII after save | Med | RESOLVED (ADR 020) |
| RS-31 | Admin override input still `type="number"` (Bengali digits untouched) | Med | RESOLVED (ADR 020) |
| RS-32 | Non-digit characters are not sanitized before saving | Low | RESOLVED (ADR 020) |
| RS-33 | Average-attendance fields may need decimal input | Low | DECIDED-NOT-DOING (ADR 022) |
| RS-34 | No `enterKeyHint` on numeric fields | Low | PLANNED (ADR 022) |
| RS-40 | Email-verification flow gaps (resend, expiry, re-register) | Med | DECIDED-NOT-DOING (ADR 022) |
| RS-41 | No recovery via `user_id`; admins cannot reset passwords | High | DECIDED-NOT-DOING (ADR 022) |
| RS-42 | Login input not normalized (trim, case, mobile keyboard attrs) | High | RESOLVED (ADR 020) |
| RS-43 | Registration dropdown offers the city/DCS zone | Med | RESOLVED (ADR 020) |
| RS-44 | Public availability checks allow account enumeration | Low | RESOLVED (ADR 021) |
| RS-45 | No in-app way to promote a second admin | Low | DEFERRED (Phase 4 / ADR 022) |
| RS-46 | `/home?message=` renders arbitrary text | Low | RESOLVED (ADR 020) |
| RS-47 | Forgot-password gives identical success for a mistyped email | Low | RESOLVED (ADR 020) |
| RS-48 | Supabase cookie handling inconsistencies | Low | VERIFY-FIRST |
| RS-50 | KI-015 timezone fix incomplete | Med | RESOLVED (ADR 021) |
| RS-51 | `<html lang>` and language flash | Low | RESOLVED (ADR 021) |
| RS-52 | Hard-coded Bengali strings on the admin dashboard | Low | RESOLVED (ADR 021) |
| RS-60 | Period/report state is fragile across three pages | Med | PLANNED (ADR 022) |
| RS-61 | Pinch-zoom disabled; very small text | Med | RESOLVED (ADR 020) |
| RS-62 | Dashboard section-completion badges | Low | DECIDED-NOT-DOING |
| RS-63 | No in-app onboarding | Low | DECIDED-NOT-DOING (ADR 022) |
| RS-64 | Download filenames percent-encoded | Low | RESOLVED (ADR 020) |
| RS-65 | Help page content is placeholder and contains false claims | Med | RESOLVED (ADR 019) |
| RS-66 | Register form labels not bound to inputs | Low | RESOLVED (ADR 020) |
| RS-67 | Redundant auth/profile calls and unpinned hosting region | Med | VERIFY-FIRST |
| RS-70 | Backups are unencrypted plaintext dumps (KI-018) | High | DECIDED-NOT-DOING (ADR 022) |
| RS-71 | No CI runs tests, lint or typecheck | Med | PLANNED (ADR 022) |
| RS-72 | No security headers configured | Low | RESOLVED (ADR 021) |
| RS-73 | DB-side fixes cannot be verified from the repo | High | VERIFY-FIRST |
| RS-74 | Leftover/dead code | Low | RESOLVED (ADR 020) |

## 3. Issues

### A. Data correctness and integrity

#### RS-01: Overrides on non-monthly city views saved under the wrong month key
- **Status/Sev/Conf:** RESOLVED (ADR 018) · High · code-verified
- **Resolution:** Implemented `getOverrideMonthForPeriod(reportType, selectedMonth)` in `src/lib/report-utils.ts` and normalized `correction-button.tsx` and `(admin)/city-report/page.tsx` to save and read non-monthly overrides under `monthsRange[0]` (`1`). Existing `.in("month", monthsRange)` query filters now match writes seamlessly with zero DB schema changes. 12 unit tests in `report-utils.test.ts`. See `docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md`.
- **Where:** `src/app/(admin)/city-report/page.tsx` (month state defaults to the current month; the month `<select>` is `disabled` when `reportType !== "মাসিক"`; the override fetch uses `.in("month", getMonthsForPeriod(reportType, month))`), `src/components/admin/correction-button.tsx` (`handleSave` looks up and writes with the page's `month`), `src/app/api/export/pdf/route.tsx` and `src/app/api/export/excel/route.ts` (same `.in("month", months)` override query).
- **Evidence:** `getMonthsForPeriod` returns the fixed ranges Jan-Mar, Jan-Jun, Jan-Sep and Jan-Dec for non-monthly types (see RS-05). The page sends the current month, which the user cannot change for non-monthly types.
- **Impact:** in October, an override on a quarterly, half-yearly or nine-month view is saved but never displayed or exported. Yearly works only because its range includes October. If the month changes between edits, duplicate rows are created for the same logical cell, and `overrideMap` keeps whichever row is returned last.
- **Fix options:**
  - **A:** store non-monthly overrides under a canonical month (1, matching `get_or_create_report`'s normalization), read them with a matching filter, and migrate or dedupe existing rows.
  - **B:** key overrides by (year, report_type) and drop `month` for non-monthly types.
- **Accept when:** create an override on a Quarterly view in any month, reload, and see it in the UI, PDF and Excel; exactly one row exists per (year, type, section, field, category).
- **Related:** RS-05, RS-06.

#### RS-02: Empty override value silently becomes 0
- **Status/Sev/Conf:** RESOLVED (ADR 020) · Medium · code-verified
- **Where:** `correction-button.tsx` `handleSave` (no validation), city-report `getVal` (`Number(ov)`).
- **Impact:** clearing the numeric field and confirming stores `""`. `Number("")` is 0, so the real aggregate is replaced by 0 and marked overridden. Text overrides can similarly be stored as an empty overridden value.
- **Fix:** block Confirm when a numeric value is empty or non-finite, and point the user to "delete override" for reverting.

#### RS-03: Per-zone multi-month header snapshot may pick an arbitrary row
- **Status/Sev/Conf:** VERIFY-FIRST · High · code-verified call sites, unverifiable schema
- **Where:** `src/lib/report-utils.ts` `sumHeaderRows` (sorts by `Number(row.month)`). Per-zone call sites feed it raw `report_header` rows with no ordering and no month attached: `src/app/report/page.tsx` (`.in("report_id", reportIds)` then `sumHeaderRows`), `src/app/api/export/pdf/route.tsx`, `src/app/api/export/excel/route.ts`. The city path uses the `view_city_header_agg` views, whose rows carry `month`, and the unit tests only use rows with `month`.
- **Evidence:** the manual says child tables are linked by `report_id`. The `month` lives on `report`. If `report_header` has no `month` column, every row sorts as month 0, and "latest" becomes whichever row the DB returns last (usually the most recently created, not the latest month).
- **Impact:** a zone's quarterly, half-yearly or yearly view and exports can show an earlier month's "stock" figures (`total_muallima`, `certified_*`, `trained_*`, `total_unit`, `units_with_muallima`) if months were opened out of order. This undermines the KI-005 fix for the per-zone path.
- **Verify:** `information_schema.columns` for `report_header`.
- **Fix:** select `report(id, month)` alongside, attach `month` to each header row before `sumHeaderRows`, and add a test with month-less rows.

#### RS-04: City snapshot uses the latest month's partial data, with no coverage indicator
- **Status/Sev/Conf:** VERIFY-FIRST · Medium · inferred
- **Where:** city-report page, exports, and `sumHeaderRows` over `view_city_header_agg`.
- **Evidence:** `get_or_create_report` creates a zone's report row when its period is opened, even without data. Early in a month, the latest month's city aggregate covers only zones that have started. There is no "N of M zones", no as-of label, and no completeness note on the city page, PDF or Excel (grep for coverage text found none).
- **Impact:** yearly or half-yearly "total" snapshot figures can be understated or partial early in a period.
- **Options:** carry forward each zone's last known value in the view; show a coverage indicator ("N of M zones reporting, as of month X"); restrict to reports that are submitted. The convention in accounting for balances is a closing balance at period end, per entity.
- **Verify:** view definitions; whether they filter on `is_submitted` or non-null data.

#### RS-05: Non-monthly periods are hardcoded to start in January (KI-017)
- **Status/Sev/Conf:** PLANNED (ADR 022) · Medium · code-verified
- **Where:** `getMonthsForPeriod` in `report-utils.ts` ignores `selectedMonth` for every non-monthly type: quarterly is always Jan-Mar, half-yearly Jan-Jun, nine-month Jan-Sep, yearly Jan-Dec.
- **Decision (ADR 022):** Support standard calendar quarters (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec), half-yearly (H1: Jan-Jun, H2: Jul-Dec), 9-month cumulative (Jan-Sep), and Annual (Jan-Dec), PLUS a flexible Custom Range selector (Start Month to End Month). Overrides continue to be canonically mapped to `monthsRange[0]` per ADR 018.
- **Tracked as:** KI-017 (scheduled for implementation).
- **Related:** RS-01.

#### RS-06: Overrides are absolute, unaudited replacements, and can duplicate
- **Status/Sev/Conf:** PLANNED (ADR 022) · Medium · inferred
- **Where:** `correction-button.tsx` and the `city_report_override` table.
- **Decision (ADR 022):** Add an explicit "গণনা করা মানে ফিরে যান" (Revert to calculated) button in the override modal so admins can immediately clear an override and restore the zone aggregate total without manual deletion. No DDL schema changes.

#### RS-07: No reasonableness checks on entered numbers
- **Status/Sev/Conf:** DECIDED-NOT-DOING (ADR 022) · Low · code-verified (absence)
- **Decision (ADR 022):** Owner decided against artificial bounds or soft warnings; numeric inputs remain completely unconstrained without warning callouts.

#### RS-08: Admin "reports" list includes reports that were only opened
- **Status/Sev/Conf:** RESOLVED (ADR 021) · Medium · code-verified
- **Resolution:** Updated `src/app/(admin)/reports/page.tsx` to project `is_submitted`, added UI filter toggle pills ("সকল রিপোর্ট" / "শুধু জমাকৃত") with `.eq("is_submitted", true)` query gating, and rendered distinct visual status badges ("জমাকৃত" in green vs "খসড়া" in amber) across both desktop tables and mobile cards. See `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`.
- **Where:** `src/app/(admin)/reports/page.tsx`.

#### RS-09: Admin "unique zones" stat uses an unordered `limit(1000)`
- **Status/Sev/Conf:** RESOLVED (ADR 021) · Low · code-verified
- **Resolution:** Scoped the unique reported zones query dynamically to the reporting year (`.eq("year", currentReportingYear)`). Eliminates the 1,000-row table scan limit and slashes payload size to < 3 KB with zero DDL migrations. See `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`.
- **Where:** `src/app/(admin)/reports/page.tsx`.

#### RS-10: Non-monthly report rows can be created by URL
- **Status/Sev/Conf:** RESOLVED (ADR 021) · Low · code-verified
- **Resolution:** In `src/app/report/[section]/page.tsx`, enforced `dbReportType = "মাসিক"` and `targetMonth = selectedMonth` regardless of URL query parameters prior to calling `get_or_create_report`. Prevents accidental creation of isolated non-monthly rows while preserving multi-month viewing and exporting on `/report`. See `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`.
- **Where:** `src/app/report/[section]/page.tsx`.

#### RS-11: Multiple users can share one zone and silently co-edit
- **Status/Sev/Conf:** DECIDED-NOT-DOING (ADR 022) · Medium · inferred
- **Decision (ADR 022):** Keep as-is. Multiple approved workers may share a zone; no registration blocks or edit collision warnings.

#### RS-12: Reassigning a zone mid-month orphans the in-progress report
- **Status/Sev/Conf:** DECIDED-NOT-DOING (ADR 022) · Medium · inferred
- **Decision (ADR 022):** Keep as-is. Operational zone reassignments remain unconstrained.

#### RS-13: Submission state is cosmetic and self-reported
- **Status/Sev/Conf:** DECIDED-NOT-DOING (ADR 022) · Medium · code-verified
- **Decision (ADR 022):** Keep as-is. The submission checkbox remains purely an advisory progress marker for the admin dashboard. Field worker inputs will NOT be locked.

#### RS-14: Admin dashboard zone-scoping logic is unreachable
- **Status/Sev/Conf:** DECIDED-NOT-DOING (ADR 022) · Low · code-verified
- **Decision (ADR 022):** Harmless unreachable branch; keep as-is.
- **Where:** `(admin)/dashboard/page.tsx`: `isAdminOrSuper` is true for role admin, role superadmin or `zone_id === 1`. The admin layout admits only admin or superadmin, so the `parent_id` scoped branch never runs and every admin sees all zones.
- **Impact:** harmless today. It matters if hierarchical zones and hierarchical RLS (roadmap Phase 5) are built.

### B. Save reliability and state

#### RS-20: Global `saveError` is cleared by any later success; no rollback
- **Status/Sev/Conf:** RESOLVED (ADR 018) · High · code-verified
- **Resolution:** Replaced global `saveError` with per-field failure registry `failedFields` (`Record<string, FailedFieldInfo>` keyed by `table:category:name`) and atomic `pendingSavesCount` in `ReportContext`. In `AutoSaveField`, failed fields display non-destructive visual error rings (`border-destructive`) without wiping user-typed data. Added `retryFailedField` and `retryAllFailed`. See `docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md`.
- **Where:** `src/components/report/report-context.tsx` `updateField`: the success branch calls `setSaveError(null)`. The error is a single global string, and the optimistic value stays in `data` after a failure.
- **Impact:** field A fails (network blip), the error appears, field B then saves successfully, and the error disappears. A's value is still shown but unsaved, so the original silent-loss problem returns. `isSaving` is also a single boolean, so overlapping saves can show "saved" early.
- **Fix:** track failures per field key (`table:category:name`), clear only that field on its own success, mark the field visibly, and roll back or flag the optimistic value. Consider a retry queue.

#### RS-21: `.select('id')` save check may false-fail if RLS SELECT differs from UPDATE
- **Status/Sev/Conf:** VERIFY-FIRST · High · inferred
- **Where:** `updateField` appends `.select('id')` to detect 0-row updates (the KI-008 fix).
- **Evidence:** with `.select()`, PostgREST returns only rows that also pass the table's SELECT policy. If any of the seven tables (`report`, `report_header`, `report_course`, `report_organizational`, `report_personal`, `report_meeting`, `report_extra`, plus `report_comment`) has a SELECT policy narrower than its UPDATE policy, genuine saves will be reported as failures. The manual describes the RLS as zone-scoped for all operations but that is not proof per table.
- **Verify:** edit one existing value in every section, including category-keyed ones, and confirm the saved state appears; compare policies per table.

#### RS-22: `loadReport` swallows errors and shows an empty form
- **Status/Sev/Conf:** RESOLVED (ADR 018) · High · code-verified
- **Resolution:** Updated `loadReport` in `ReportContext` to return `{ success: boolean; error?: any }` and track `loadError`. In `src/app/report/[section]/page.tsx`, gated form rendering so forms NEVER mount when data is uninitialized (`!data || Object.keys(data).length === 0`), and rendered an explicit Bengali error card with a Retry button upon load failure. See `docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md`.
- **Where:** `report-context.tsx` `loadReport` only sets state on success and returns nothing. `src/app/report/[section]/page.tsx` calls `setReportId(repId)` first, then `await loadReport(repId)`, and does not check the outcome.
- **Impact:** a transient failure in the select shows the section form with no data and no error. Users see blanks and may re-enter or panic. Edits still write to the real report id.
- **Fix:** return success or failure from `loadReport`; show a retryable error; do not render forms until data loads.

#### RS-23: Nested `ReportProvider` per section page; remount per navigation
- **Status/Sev/Conf:** RESOLVED (ADR 018) · Medium · code-verified structure, inferred behavior
- **Resolution:** Removed the redundant nested `<ReportProvider>` in `src/app/report/[section]/page.tsx` so the page inherits the root provider from `src/app/layout.tsx`. Added in-memory report check to bypass redundant 7-table fetches when navigating between section tabs, preserving background save operations. See `docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md`.
- **Evidence:** `src/app/layout.tsx` already wraps the app in `ReportProvider`, and `report/[section]/page.tsx` wraps its own. The effect runs getUser, people, RPC and select sequentially (about four round trips) with a full-screen spinner. If the page remounts when the `[section]` param changes (very likely in the App Router), this repeats on every Next/Previous. A save failing after navigation sets state on an unmounted provider, so the error is never shown.
- **Verify:** press Next and watch for the spinner and network calls.
- **Fix options:** hoist report loading to a shared layout for `/report/[section]`; use one provider and a shared save queue; await pending saves before navigating.

#### RS-24: Autosave "retry" button only dismisses the error
- **Status/Sev/Conf:** RESOLVED (ADR 018) · Low · code-verified
- **Resolution:** Updated `AutoSaveIndicator` to display active failure count and wired the Retry button to `retryAllFailed()` from `ReportContext` to trigger re-attempts on all unpersisted field values. See `docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md`.
- **Where:** `auto-save-indicator.tsx` button calls `clearSaveError`, which only does `setSaveError(null)`. It does not retry the save.
- **Fix:** retry the last failed write, or relabel the button as "dismiss".

#### RS-25: `beforeunload` flush is best-effort on mobile
- **Status/Sev/Conf:** PARTIAL · Low · code-verified
- **Context:** KI-009 is resolved with `visibilitychange` plus `beforeunload` in `auto-save-field.tsx`. `visibilitychange` is reliable. An async Supabase write started in `beforeunload` is not guaranteed to complete on mobile browsers. `navigator.sendBeacon` or a keepalive request is the more robust option if loss is observed.

#### RS-26: `.eq('category')` appended after `.select()`
- **Status/Sev/Conf:** VERIFY-FIRST · Low · code-verified
- **Where:** `updateField` builds `update().eq('report_id').select('id')` and then adds `.eq('category', category)`. Test that the category filter applies correctly and that only one row is updated.

#### RS-27: Category lists live in both code and the DB seed (drift risk)
- **Status/Sev/Conf:** RESOLVED (ADR 020 / ADR 022) · Medium · code-verified
- **Resolution:** Category lists centralized in `src/lib/constants.ts` and aliases harmonized across forms, PDF and Excel exports per ADR 007 and ADR 020.

### C. Digits and inputs

#### RS-30: Digits typed in Bengali flip to ASCII after save
- **Status/Sev/Conf:** RESOLVED (ADR 020) · Medium · code-verified
- **Where:** `src/components/report/auto-save-field.tsx`. `getInitialValue()` returns the stored value unformatted. `persist()` normalizes with `bnToEn` before `updateField(name, normalised, …)`, which stores the ASCII value in context. The `useEffect(() => setLocalValue(currentVal), [currentVal])` sync then overwrites what the user typed.
- **Impact:** typing "১৫" shows "১৫" until blur, then "15". Every editable number shows ASCII digits, while the rest of the app (dashboard, PDFs, labels) uses `toBn()`. It also reads as "did it save correctly?".
- **Fix:** apply `toBn()` when reading numeric values into the input and keep `bnToEn` on the write path. Decide whether Bengali digits should depend on UI language, since `toBn` is applied unconditionally elsewhere.

#### RS-31: Admin override input still `type="number"`
- **Status/Sev/Conf:** RESOLVED (ADR 020) · Medium · code-verified
- **Where:** `correction-button.tsx` (numeric input around line 210). Its `toBn` only converts for display, and there is no input normalization. KI-014 touched only `AutoSaveField`.
- **Fix:** reuse the same `bnToEn` plus text/`inputMode` approach and validate (see RS-02).

#### RS-32: Non-digit characters are not sanitized before saving
- **Status/Sev/Conf:** RESOLVED (ADR 020) · Low · code-verified
- **Evidence:** inputs are now `type="text"`; `bnToEn` converts only Bengali digits. A pasted "1,234" or stray letters reach a numeric column and fail. Retrying the same value fails again with a generic message. The `pattern` attribute is inert because there is no form validation flow.
- **Fix:** strip or validate to digits before persist and show a specific inline message.

#### RS-33: Average-attendance fields may need decimal input
- **Status/Sev/Conf:** DECIDED-NOT-DOING (ADR 022) · Low · inferred
- **Decision (ADR 022):** Attendance fields remain strictly rounded whole integers across forms, DB, and exports to maintain schema stability and prevent floating-point rounding drifts.

#### RS-34: No `enterKeyHint` on numeric fields
- **Status/Sev/Conf:** PLANNED (ADR 022) · Low · code-verified
- **Decision (ADR 022):** Add `enterKeyHint="next"` to form numeric inputs so mobile touch keyboards render a "Next" key for rapid field traversal.

### D. Authentication, access and admin tooling

#### RS-40: Email-verification flow gaps
- **Status/Sev/Conf:** DECIDED-NOT-DOING (ADR 022) · Medium · code-verified
- **Decision (ADR 022):** Keep email verification flow as-is. The existing self-service reset on `/home` is sufficient; no in-app resend action required.

#### RS-41: No recovery via `user_id`; admins cannot reset passwords
- **Status/Sev/Conf:** DECIDED-NOT-DOING (ADR 022) · High · code-verified
- **Decision (ADR 022):** Keep password recovery as-is. Users recover passwords via their registered email on `/home`. No in-app admin password reset modal will be added.

#### RS-42: Login input not normalized
- **Status/Sev/Conf:** RESOLVED (ADR 020) · High · code-verified
- **Where:** `src/app/home/actions.ts` `login` uses `formData.get('email')` untrimmed, and looks up `people.user_id` with an exact, case-sensitive match. The input in `auth-portal-client.tsx` has no `autoCapitalize="none"`, `autoCorrect="off"`, `autoComplete="username"` or `spellCheck={false}`. Registration trims the user ID, so the two paths disagree.
- **Impact:** mobile keyboards commonly capitalize the first letter or append a space after a suggestion, and the user sees only "invalid credentials". The registration check uses exact equality, so "Karim" and "karim" can both register unless the DB has a case-insensitive unique index.
- **Fix:** trim in login; normalize case (lowercase on register, or match with `ilike`); add the input attributes; consider a unique index on `lower(user_id)`.
- **Note:** a legacy fallback maps an unknown ID to `<id>@report.local`.

#### RS-43: Registration dropdown offers the city/DCS zone
- **Status/Sev/Conf:** RESOLVED (ADR 020) · Medium · code-verified
- **Where:** `src/app/home/page.tsx` loads all zones (`select("id, name")`). The admin dashboard and reports page treat `id === 1` or `zone_type === 'city'` as non-reportable.
- **Impact:** a user can register against the city entity, and the admin dashboard treats `zone_id === 1` as admin-like. Admin approval is the only guard.
- **Fix:** exclude it from the registration list and optionally validate in `register`.

#### RS-44: Public availability checks allow account enumeration
- **Status/Sev/Conf:** RESOLVED (ADR 021) · Low · code-verified
- **Resolution:** Implemented an in-memory sliding-window rate limiter (`src/lib/rate-limit.ts`) with automated periodic key cleanup. Enforced a 10 requests / 60 seconds threshold per client IP on `checkEmailAvailability` and `checkUserIdAvailability` in `src/app/home/actions.ts`. See `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`.
- **Where:** `src/app/home/actions.ts` and `src/lib/rate-limit.ts`.

#### RS-45: No in-app way to promote a second admin
- **Status/Sev/Conf:** DEFERRED (Phase 4 / ADR 022) · Low · code-verified
- **Decision (ADR 022):** Postponed until the 3-tier organizational hierarchy upgrade (Roadmap Phase 4 / ADR 009). Administrative role assignment remains managed directly in the database.

#### RS-46: `/home?message=` renders arbitrary text
- **Status/Sev/Conf:** RESOLVED (ADR 020) · Low-Med · code-verified
- **Where:** `home/page.tsx` passes `message` to `auth-portal-client.tsx`, which renders it (only two values are translated). React escapes it, so this is not XSS, but a crafted link can show fake text such as "account suspended, call this number".
- **Fix:** pass error codes and map them to known messages.

#### RS-47: Forgot-password gives identical success for a mistyped email
- **Status/Sev/Conf:** RESOLVED (ADR 020) · Low · code-verified
- **Evidence:** `resetPasswordForEmail` hides whether an address exists (correct for security), so a mistyped address looks identical to success. Add guidance on the success screen to re-check the address and the spam folder.

#### RS-48: Supabase cookie handling inconsistencies
- **Status/Sev/Conf:** VERIFY-FIRST · Low · code-verified, impact inferred
- **Evidence:** `src/utils/supabase/server.ts` still uses the older `get/set/remove` cookie API (the `getAll/setAll` API is now recommended; check against installed `@supabase/ssr ^0.9`). `middleware.ts` uses `getAll/setAll`, but its redirect responses (`NextResponse.redirect`) do not copy refreshed auth cookies. Practical impact is low because refresh-token reuse tolerance covers short windows.

### E. Time and locale

#### RS-50: KI-015 timezone fix incomplete
- **Status/Sev/Conf:** RESOLVED (ADR 021) · Medium · code-verified
- **Resolution:** Created `src/lib/date-utils.ts` exporting `getDhakaDate()`, `getDhakaMonth()`, `getDhakaYear()`, `getDhakaDateObject()`, and `toDhakaIsoString()` using `timeZone: "Asia/Dhaka"` (UTC+6). Replaced all raw `new Date()` fallback calculations across 10 files (server, client, and export API routes), backed by automated unit tests in `src/lib/date-utils.test.ts`. See `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`.
- **Where:** `src/lib/date-utils.ts` and 10 consumer files.

#### RS-51: `<html lang>` and language flash
- **Status/Sev/Conf:** RESOLVED (ADR 021) · Low · code-verified
- **Resolution:** Added `document.documentElement.lang = savedLang` inside `LanguageProvider`'s initial mount `useEffect`, ensuring screen readers and browser accessibility engines immediately receive the user's selected language without FOIC. See `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`.
- **Where:** `src/components/providers/language-provider.tsx`.

#### RS-52: Hard-coded Bengali strings on the admin dashboard
- **Status/Sev/Conf:** RESOLVED (ADR 021) · Low · code-verified
- **Resolution:** Aligned `getServerLanguage()` in `src/lib/i18n.ts` to read the `app-language` cookie. Added translation tokens (`counterSuffix`, `zonesSubmitted`, `statusCol`, `draft`, etc.) in `i18n.ts` and replaced all hardcoded Bengali strings in `src/app/(admin)/dashboard/page.tsx` with dynamic `{t.labels.*}` references. See `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`.
- **Where:** `src/lib/i18n.ts` and `src/app/(admin)/dashboard/page.tsx`.

### F. UX, accessibility and performance

#### RS-60: Period/report state is fragile across three pages
- **Status/Sev/Conf:** PLANNED (ADR 022) · Medium · code-verified
- **Evidence:** `user-dashboard.tsx`, `report/[section]/page.tsx` and `report/page.tsx` each rebuild "which report" from `type`/`month`/`year`, and invalid params silently `router.replace("/")`. There is no smart default (a blank picker on each fresh visit). The report row is created as soon as a period is resolved on the dashboard, before any section opens. `report/page.tsx` already supports `report_id` directly.
- **Decision (ADR 022):**
  - **Adopt `reportId` as the canonical URL parameter for field workers** (`/report/[section]?reportId=42`).
  - Keep entry points (`/` or `/report`) as the resolver that calls `get_or_create_report` once and navigates onward with the ID.
  - Keep admin and export multi-month aggregations on `zone_id` + year + period type.
  - Fallback navigation when URL lacks `reportId` will be resolved in implementation planning.
- **Related:** RS-22, RS-23, RS-10, RS-50.

#### RS-61: Pinch-zoom disabled; very small text
- **Status/Sev/Conf:** RESOLVED (ADR 020) · Medium · code-verified
- **Where:** `src/app/layout.tsx` viewport had `maximumScale: 1, userScalable: false`.
- **Evidence:** about 60 uses of `text-[9px]`, `text-[10px]` and `text-[11px]` (37, 22 and 1 respectively), and a courses table view with `min-w-[900px]`. `globals.css` already forces `font-size: 16px !important` on inputs, so the lock is not needed to prevent iOS auto-zoom. It conflicts with WCAG 1.4.4 and Lighthouse.
- **Fix:** remove the zoom lock; raise the smallest text sizes where they carry meaning.

#### RS-62: Dashboard section-completion badges
- **Status/Sev/Conf:** DECIDED-NOT-DOING · Low · code-verified
- **Context:** each dashboard card shows only an icon, name and an edit button. The owner decided not to build this because it needs the same per-section data detection as a system-derived completion tracker (RS-13 option B), which is not being built, and the effort is not justified for a small user base. Revisit together with RS-13 if completeness tracking is taken up.

#### RS-63: No in-app onboarding
- **Status/Sev/Conf:** DECIDED-NOT-DOING (ADR 022) · Low
- **Decision (ADR 022):** Keep as-is. Continue relying on the comprehensive text-first visual operational guide at `/help` (ADR 019). No intrusive onboarding overlays or walkthrough tours.

#### RS-64: Download filenames percent-encoded
- **Status/Sev/Conf:** RESOLVED (ADR 020) · Low · code-verified
- **Where:** PDF and Excel routes set `Content-Disposition: attachment; filename="${encodeURIComponent(filename)}"`. Some browsers show `%E0%A6…` names for Bengali zone names.
- **Fix:** use `filename*=UTF-8''…` with an ASCII fallback.

#### RS-65: Help page content is placeholder and contains false claims
- **Status/Sev/Conf:** RESOLVED (ADR 019) · Medium · code-verified
- **Context:** `src/app/help/page.tsx` was rewritten in ADR 019 into an authoritative text-first manual matching live labels with 4-step user guide, 5-step admin guide, 9-point troubleshooting, and WhatsApp coordinator contact.

#### RS-66: Register form labels not bound to inputs
- **Status/Sev/Conf:** RESOLVED (ADR 020) · Low · code-verified
- **Where:** `register-form-client.tsx`: every label has `htmlFor`, but the inputs have no matching `id` (pre-existing; the new confirm-password field inherited it). Tapping a label does not focus the field.

#### RS-67: Redundant auth/profile calls and unpinned hosting region
- **Status/Sev/Conf:** VERIFY-FIRST · Medium · inferred
- **Evidence:** a page load can run `getUser` and a `people` query in middleware, the page or layout, the navbar, the user dropdown and the bottom nav, each separately. The section page adds getUser, people, RPC and select (RS-23). There is no `vercel.json`, so the function region is the default; Supabase's region is not in the repo.
- **Impact:** if the app region is far from Supabase or from Dhaka, sequential round trips cost seconds on mobile.
- **Verify:** Vercel function region and Supabase region.
- **Fix options:** pin the function region near the database; share one profile fetch via context or a server layout.

### G. Operations, security and hygiene

#### RS-70: Backups are unencrypted plaintext dumps (KI-018)
- **Status/Sev/Conf:** DECIDED-NOT-DOING (ADR 022) · High · code-verified
- **Decision (ADR 022):** Keep as-is. Automated database dumps in `.github/workflows/backup.yml` remain unencrypted `.sql` dumps in the private backup repository.

#### RS-71: No CI runs tests, lint or typecheck
- **Status/Sev/Conf:** PLANNED (ADR 022) · Medium · code-verified
- **Decision (ADR 022):** Add `.github/workflows/ci.yml` running lint (`npm run lint`), TypeScript checking (`npx tsc --noEmit`), unit tests (`npm test`), and build (`npm run build`) on every push and PR to `main`.

#### RS-72: No security headers configured
- **Status/Sev/Conf:** RESOLVED (ADR 021) · Low · code-verified
- **Resolution:** Configured global security response headers in `next.config.mjs`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `X-DNS-Prefetch-Control: on`. See `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`.
- **Where:** `next.config.mjs`.

#### RS-73: DB-side fixes cannot be verified from the repo
- **Status/Sev/Conf:** VERIFY-FIRST · High · unverifiable-here
- **Evidence:** KI-007 (RPC string alignment), KI-010 (`security_invoker` on city views) and KI-011 (`CHECK >= 0`) were described in ADR 016 but there are no SQL files in the repo. Confirm in the Supabase dashboard (see section 7).

#### RS-74: Leftover and dead code
- **Status/Sev/Conf:** RESOLVED (ADR 020) · Low · code-verified
- **Evidence:** `SessionCleaner` (used in `home/page.tsx`) removes a `sessionStorage` key (`dashboard-period-params`) left over from the ADR-006 era; the Bengali pass-through branch in `translateAuthError` is unreachable for Supabase's English errors; the `pattern` attribute on numeric inputs is inert (RS-32); the admin dashboard's non-admin scoping branch is unreachable (RS-14).

## 4. Previously tracked items (`docs/KNOWN_ISSUES.md`) and current status

| ID | Topic | Status at baseline | Notes |
|---|---|---|---|
| KI-005 | Snapshot over-counting in header aggregation | RESOLVED (ADR 014) | Per-zone path may still mis-pick the "latest" row, see RS-03. |
| KI-006 | Weighted attendance averages | RESOLVED (ADR 014) | |
| KI-007 | RPC seed strings vs frontend | RESOLVED (ADR 016) | DB-side, unverified (RS-73). Root cause remains (RS-27). |
| KI-008 | Silent autosave failures | RESOLVED (ADR 015) | Holes: RS-20, RS-21, RS-22, RS-24. |
| KI-009 | Flush on exit | RESOLVED (ADR 015) | Best-effort on mobile, RS-25. |
| KI-010 | City views bypass RLS | RESOLVED (ADR 016) | DB-side, unverified (RS-73). |
| KI-011 | No CHECK constraints | RESOLVED (ADR 016) | DB-side, unverified (RS-73). |
| KI-012 | Unused dependencies | RESOLVED (ADR 014) | |
| KI-013 | Password confirmation on register | RESOLVED (ADR 015) | Server-validated, no live match indicator. |
| KI-014 | Bengali numeral input | RESOLVED (ADR 015) | Follow-ups: RS-30, RS-31, RS-32, RS-33. |
| KI-015 | Timezone parity | RESOLVED (ADR 015, ADR 021) | Universal Dhaka time parity across all 10 entry points via src/lib/date-utils.ts (RS-50). |
| KI-016 | Auth error localization | RESOLVED (ADR 016) | Applied in login, register, forgotPassword and updatePassword. |
| KI-017 | Quarter ranges hardcoded to January | PLANNED (ADR 022) | RS-05: calendar quarters, halves, 9M, annual, custom range. |
| KI-018 | Backup encryption | DECIDED-NOT-DOING (ADR 022) | RS-70: repo is private; plaintext dumps retained. |
| WONTFIX | Sub-44px touch targets in table mode | WONTFIX | Dense table mode is deliberate. |
| Roadmap Tier 4 | Root `loading.tsx`/`error.tsx` | RESOLVED (ADR 016) | Reviewed, no issues. |

## 5. Retractions and verified non-issues

Do not act on these. They were claimed earlier in the review and are wrong or already handled:
- **"No prev/next navigation between sections"** is wrong. `src/components/report/section-layout.tsx` has a fixed bottom stepper (Previous/Next through the seven sections) and a dashboard link. The earlier miss was caused by searching file names, not reading the page's imports.
- **"Courses section is a 24-field flat list"** is wrong. `courses-form.tsx` has 8 collapsible category cards (the first open by default), each with 12 fields grouped under four labeled headings, plus a user-toggleable dense table view. The "24" came from grep counting two parallel render paths.
- **"The submission checkbox is unlabeled or easy to miss"** is overstated. It is clearly labeled with helper text; the real issue is that it is self-reported and unverified (RS-13).
- **"The Finish button submits the report"** is only a user-misreading risk. It only navigates; it has no hidden effect.
- **"Admin user list lacks search/filter"** is wrong. `management/page.tsx` has `filteredUsers` and a "Search & Filter Options" panel.
- **Zone deletion is unguarded** is wrong. It is blocked while users or reports exist.
- **Deleting a user leaves orphaned auth accounts** is wrong. `deleteUserAction` deletes the auth user and cascades to `people`.
- **Export routes allow cross-zone access** is wrong. Both routes check `report.zone_id` or the requested zone against the requester's zone for non-admins, and return 403.
- **Middleware gating, `error.tsx` and the `translateAuthError` mapping** were reviewed and held up.
- **Duplicate courses fields** (the "24") also explains why grep counts of `type="number"` (62) overstate the number of distinct visible fields.

## 6. Owner decisions log

- Help page is AI-generated placeholder content, to be rewritten (or labeled demo) later (RS-65).
- Submission checkbox and Finish button are admin-tracking and closure affordances only, and do not measure completeness (RS-13). The owner has not chosen an option.
- Dashboard completion badges: not pursuing (RS-62).
- Proposed `reportId`-based URLs for the field-worker flow (RS-60); aggregate admin views keep period parameters.
- KI-017 needs an organizational answer on reporting convention.
- Preferred review style: justified, code-grounded suggestions with alternatives and industry context.

## 7. Verification checklist (run before or alongside fixes)

Prefer the Supabase MCP server for database checks.
1. **Schema:** columns of `report_header` (is there a `month`?), `city_report_override` (created_by, reason, defaults), and indexes on `report` and `city_report_override` (RS-03, RS-06).
2. **RLS parity:** for each of `report`, `report_header`, `report_course`, `report_organizational`, `report_personal`, `report_meeting`, `report_extra`, `report_comment`, compare SELECT and UPDATE policies. Then edit one existing value in each section as a normal user and confirm the saved state (RS-21).
3. **Cross-zone check:** as a zone A user, open a zone B `reportId`; expect no data (RS-60).
4. **Views:** confirm `security_invoker = true` on `view_city_*_agg`; read their definitions for `is_submitted` or zone coverage filtering (RS-04, RS-73).
5. **Constraints:** confirm the `CHECK (col >= 0)` constraints exist (RS-73).
6. **`get_or_create_report`:** read its body for atomicity and category seeding, and whether it accepts non-monthly types for regular users (RS-10, RS-27).
7. **Auth settings:** whether "Confirm email" is on; behavior when re-registering an unconfirmed email (RS-40).
8. **Hosting:** Vercel function region and Supabase project region (RS-67).
9. **Manual UX tests:**
   - quarterly override persistence, in a month outside Jan-Mar (RS-01);
   - clearing an override value (RS-02);
   - pressing Next and watching for a spinner (RS-23);
   - a Bengali keyboard digit typed in a field, then blur (RS-30);
   - login with a leading capital or trailing space (RS-42);
   - a zone that opens months out of order, then its quarterly view (RS-03).
10. **After any fix:** run lint, `tsc --noEmit`, `npm test` and `npm run build`; update docs per section 1.

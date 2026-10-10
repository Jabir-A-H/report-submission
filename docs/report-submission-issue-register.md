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
| RS-01 | Overrides on non-monthly city views saved under the wrong month key | High | OPEN-BUG |
| RS-02 | Empty override value silently becomes 0 | Med | OPEN-BUG |
| RS-03 | Per-zone multi-month header snapshot may pick an arbitrary row | High | VERIFY-FIRST |
| RS-04 | City snapshot uses the latest month's partial data, with no coverage indicator | Med | VERIFY-FIRST |
| RS-05 | Non-monthly periods are hardcoded to start in January (KI-017) | Med | OPEN-DECISION |
| RS-06 | Overrides are absolute, unaudited replacements, and can duplicate | Med | OPEN-DECISION |
| RS-07 | No reasonableness checks on entered numbers | Low | OPEN-DECISION |
| RS-08 | Admin "reports" list includes reports that were only opened | Med | OPEN-BUG |
| RS-09 | Admin "unique zones" stat uses an unordered `limit(1000)` | Low | OPEN-BUG |
| RS-10 | Non-monthly report rows can be created by URL | Low | OPEN-BUG |
| RS-11 | Multiple users can share one zone and silently co-edit | Med | OPEN-DECISION |
| RS-12 | Reassigning a zone mid-month orphans the in-progress report | Med | OPEN-DECISION |
| RS-13 | Submission state is cosmetic and self-reported | Med | OPEN-DECISION |
| RS-14 | Admin dashboard zone-scoping logic is unreachable | Low | OPEN-DECISION |
| RS-20 | Global `saveError` is cleared by any later success; no rollback | High | OPEN-BUG |
| RS-21 | `.select('id')` save check may false-fail if RLS SELECT differs from UPDATE | High | VERIFY-FIRST |
| RS-22 | `loadReport` swallows errors and shows an empty form | High | OPEN-BUG |
| RS-23 | Nested `ReportProvider` per section page; remount per navigation | Med | VERIFY-FIRST |
| RS-24 | Autosave "retry" button only dismisses the error | Low | OPEN-BUG |
| RS-25 | `beforeunload` flush is best-effort on mobile | Low | PARTIAL |
| RS-26 | `.eq('category')` appended after `.select()` | Low | VERIFY-FIRST |
| RS-27 | Category lists live in both code and DB seed (drift risk) | Med | OPEN-DECISION |
| RS-30 | Digits typed in Bengali flip to ASCII after save | Med | OPEN-BUG |
| RS-31 | Admin override input still `type="number"` (Bengali digits untouched) | Med | OPEN-BUG |
| RS-32 | Non-digit characters are not sanitized before saving | Low | OPEN-BUG |
| RS-33 | Average-attendance fields may need decimal input | Low | VERIFY-FIRST |
| RS-34 | No `enterKeyHint` on numeric fields | Low | OPEN-DECISION |
| RS-40 | Email-verification flow gaps (resend, expiry, re-register) | Med | PARTIAL |
| RS-41 | No recovery via `user_id`; admins cannot reset passwords | High | OPEN-DECISION |
| RS-42 | Login input not normalized (trim, case, mobile keyboard attrs) | High | OPEN-BUG |
| RS-43 | Registration dropdown offers the city/DCS zone | Med | OPEN-BUG |
| RS-44 | Public availability checks allow account enumeration | Low | OPEN-BUG |
| RS-45 | No in-app way to promote a second admin | Low | OPEN-DECISION |
| RS-46 | `/home?message=` renders arbitrary text | Low | OPEN-BUG |
| RS-47 | Forgot-password gives identical success for a mistyped email | Low | OPEN-BUG |
| RS-48 | Supabase cookie handling inconsistencies | Low | VERIFY-FIRST |
| RS-50 | KI-015 timezone fix incomplete | Med | OPEN-BUG |
| RS-51 | `<html lang>` and language flash | Low | OPEN-BUG |
| RS-52 | Hard-coded Bengali strings on the admin dashboard | Low | OPEN-BUG |
| RS-60 | Period/report state is fragile across three pages | Med | OPEN-DECISION |
| RS-61 | Pinch-zoom disabled; very small text | Med | OPEN-BUG |
| RS-62 | Dashboard section-completion badges | Low | DECIDED-NOT-DOING |
| RS-63 | No in-app onboarding | Low | OPEN-DECISION |
| RS-64 | Download filenames percent-encoded | Low | OPEN-BUG |
| RS-65 | Help page content is placeholder and contains false claims | Med | DEFERRED |
| RS-66 | Register form labels not bound to inputs | Low | OPEN-BUG |
| RS-67 | Redundant auth/profile calls and unpinned hosting region | Med | VERIFY-FIRST |
| RS-70 | Backups are unencrypted plaintext dumps (KI-018) | High | DEFERRED |
| RS-71 | No CI runs tests, lint or typecheck | Med | OPEN-DECISION |
| RS-72 | No security headers configured | Low | OPEN-DECISION |
| RS-73 | DB-side fixes cannot be verified from the repo | High | VERIFY-FIRST |
| RS-74 | Leftover/dead code | Low | OPEN-BUG |

## 3. Issues

### A. Data correctness and integrity

#### RS-01: Overrides on non-monthly city views saved under the wrong month key
- **Status/Sev/Conf:** OPEN-BUG · High · code-verified
- **Where:** `src/app/(admin)/city-report/page.tsx` (month state defaults to the current month; the month `<select>` is `disabled` when `reportType !== "মাসিক"`; the override fetch uses `.in("month", getMonthsForPeriod(reportType, month))`), `src/components/admin/correction-button.tsx` (`handleSave` looks up and writes with the page's `month`), `src/app/api/export/pdf/route.tsx` and `src/app/api/export/excel/route.ts` (same `.in("month", months)` override query).
- **Evidence:** `getMonthsForPeriod` returns the fixed ranges Jan-Mar, Jan-Jun, Jan-Sep and Jan-Dec for non-monthly types (see RS-05). The page sends the current month, which the user cannot change for non-monthly types.
- **Impact:** in October, an override on a quarterly, half-yearly or nine-month view is saved but never displayed or exported. Yearly works only because its range includes October. If the month changes between edits, duplicate rows are created for the same logical cell, and `overrideMap` keeps whichever row is returned last.
- **Fix options:**
  - **A:** store non-monthly overrides under a canonical month (1, matching `get_or_create_report`'s normalization), read them with a matching filter, and migrate or dedupe existing rows.
  - **B:** key overrides by (year, report_type) and drop `month` for non-monthly types.
- **Accept when:** create an override on a Quarterly view in any month, reload, and see it in the UI, PDF and Excel; exactly one row exists per (year, type, section, field, category).
- **Related:** RS-05, RS-06.

#### RS-02: Empty override value silently becomes 0
- **Status/Sev/Conf:** OPEN-BUG · Medium · code-verified
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
- **Status/Sev/Conf:** OPEN-DECISION · Medium · code-verified
- **Where:** `getMonthsForPeriod` in `report-utils.ts` ignores `selectedMonth` for every non-monthly type: quarterly is always Jan-Mar, half-yearly Jan-Jun, nine-month Jan-Sep, yearly Jan-Dec.
- **Impact:** Q2, Q3, Q4 and H2 can never be produced. This is correct only if the organization's convention is cumulative year-to-date checkpoints.
- **Decision needed:** which convention does the organization use?
  - **A:** confirm cumulative year-to-date, then rename labels and hide the month picker for those types.
  - **B:** true rolling quarters and halves, which requires computing ranges from `selectedMonth` and handling cross-year logic in `sumHeaderRows`.
- **Tracked as:** KI-017 (deferred pending org confirmation).
- **Related:** RS-01.

#### RS-06: Overrides are absolute, unaudited replacements, and can duplicate
- **Status/Sev/Conf:** OPEN-DECISION · Medium · inferred
- **Where:** `correction-button.tsx` and the `city_report_override` table.
- **Evidence:** an override stores a replacement `value` (string). There is no stored computed value at override time, so if a zone edits its report afterwards the city number stays frozen with no stale flag. The client writes no author or reason (the DB may default them; verify). Saving does select-then-update, then falls back to `upsert` with `onConflict: 'year,month,report_type,section,field,category'`. A standard Postgres unique index treats NULL `category` values as distinct, so header-level overrides (null category) may not conflict. Concurrent saves can create duplicates, and `maybeSingle()` errors if two rows match.
- **Options:** store the computed value at override time and flag drift; add reason and created_by; enforce uniqueness with `NULLS NOT DISTINCT` (PG15+) or a `coalesce(category,'')` index; treat adjustments as deltas rather than replacements.
- **Verify:** actual columns and indexes on `city_report_override`.

#### RS-07: No reasonableness checks on entered numbers
- **Status/Sev/Conf:** OPEN-DECISION · Low · code-verified (absence)
- **Evidence:** no cross-field validation exists in `src/components/report`. Examples that nothing prevents: `units_with_muallima` > `total_unit`; `*_taking_classes` > the corresponding certified or trained count; `total_muallima` not equal to last month's total plus increase minus decrease.
- **Constraint:** hard DB CHECKs would break per-field autosave because intermediate states are legitimately inconsistent. Prefer soft inline warnings or an admin-side anomaly list.

#### RS-08: Admin "reports" list includes reports that were only opened
- **Status/Sev/Conf:** OPEN-BUG · Medium · code-verified
- **Where:** `src/app/(admin)/reports/page.tsx` selects `id, zone_id, month, year, report_type, zone` from `report` with no submission or data filter and does not select `is_submitted`. The admin dashboard card describes the page as the list of "submitted reports".
- **Impact:** a zone that merely opened a month (which creates the row) appears as a report. Drafts and submitted reports are indistinguishable.
- **Options:** add an `is_submitted` badge and filter; or default to submitted only; or show a last-updated indicator. Depends on RS-13's outcome for what "submitted" means.

#### RS-09: Admin "unique zones" stat uses an unordered `limit(1000)`
- **Status/Sev/Conf:** OPEN-BUG · Low · code-verified
- **Where:** `reports/page.tsx` (`select("zone_id").limit(1000)`).
- **Impact:** at about 30 zones times 12 months, the cap is reached in under three years and the stat becomes wrong. Use a count of distinct zone_ids server-side (view or RPC).

#### RS-10: Non-monthly report rows can be created by URL
- **Status/Sev/Conf:** OPEN-BUG · Low · code-verified
- **Where:** `src/app/report/[section]/page.tsx` and `user-dashboard.tsx` accept any `type` URL param and call `get_or_create_report` (non-monthly types use `p_month: 1`). `PeriodSelector monthlyOnly` only hides the selector.
- **Impact:** a stale link or crafted URL creates a non-monthly row with seeded categories that users can fill. Exports and aggregation read only monthly rows, so that data is invisible in all aggregates.
- **Fix:** force monthly for non-admin flows, or guard in the RPC.

#### RS-11: Multiple users can share one zone and silently co-edit
- **Status/Sev/Conf:** OPEN-DECISION · Medium · inferred
- **Evidence:** registration and `changeZone` in `management/page.tsx` do not enforce one active user per zone. Reports are keyed by (zone, year, month, type), not by user, so two users edit the same row with no presence indicator or conflict warning.
- **Options:** enforce one active user per zone; support multi-user zones with a presence indicator (Supabase Realtime presence); or confirm it never happens organizationally and do nothing.

#### RS-12: Reassigning a zone mid-month orphans the in-progress report
- **Status/Sev/Conf:** OPEN-DECISION · Medium · inferred
- **Evidence:** `changeZone` exists in `management/page.tsx`. The report belongs to the zone, so after a move the next load calls `get_or_create_report` for the new zone and returns a fresh empty report. Nothing warns the admin.
- **Options:** warn at reassignment if the old zone has a non-empty report for the period; offer to migrate the report row; or document as an operational gotcha.
- **Note:** zone deletion is guarded (blocked while users or reports exist), so only reassignment is affected.

#### RS-13: Submission state is cosmetic and self-reported
- **Status/Sev/Conf:** OPEN-DECISION · Medium · code-verified
- **Evidence:**
  - Autosave writes every field immediately and unconditionally.
  - `is_submitted` is written only by the checkbox in `src/components/report/sections/comments-form.tsx` (`updateField("is_submitted", …, "comment", "report")`). It is clearly labeled in-app ("রিপোর্ট জমা সম্পন্ন হয়েছে (Report Submission Done)", plus helper text saying to tick it once all sections are filled).
  - It is read only in `src/app/(admin)/dashboard/page.tsx`, to compute submitted/pending zones and the completion percentage. It does not lock editing, and exports, aggregation, middleware and autosave do not read it.
  - The "সম্পন্ন করুন" (Finish) button in `section-layout.tsx` only does `router.push` to the dashboard and does not touch `is_submitted`.
  - Nothing verifies that the other six sections have data, so ticking it from Comments counts as 100% on the admin dashboard.
- **Owner's description:** an admin-tracking signal for people who have gone through the steps, not a measure of completeness.
- **Options:**
  - **A:** keep it cosmetic, but relabel honestly ("I have filled all sections" and a neutral "back to dashboard" for the Finish button).
  - **B:** compute completion from actual data and remove the manual checkbox.
  - **C:** make submission a real state that locks or timestamps the report.
  - **D:** leave as-is.
- **Industry note:** tax and application wizards reserve "Submit/Finish" for the action that actually changes state; lightweight tools often rely on self-reported checkboxes and move to computed status once the number is acted on.
- **Related:** RS-08, RS-62.

#### RS-14: Admin dashboard zone-scoping logic is unreachable
- **Status/Sev/Conf:** OPEN-DECISION · Low · code-verified
- **Where:** `(admin)/dashboard/page.tsx`: `isAdminOrSuper` is true for role admin, role superadmin or `zone_id === 1`. The admin layout admits only admin or superadmin, so the `parent_id` scoped branch never runs and every admin sees all zones.
- **Impact:** harmless today. It matters if hierarchical zones and hierarchical RLS (roadmap Phase 5) are built.

### B. Save reliability and state

#### RS-20: Global `saveError` is cleared by any later success; no rollback
- **Status/Sev/Conf:** OPEN-BUG · High · code-verified
- **Where:** `src/components/report/report-context.tsx` `updateField`: the success branch calls `setSaveError(null)`. The error is a single global string, and the optimistic value stays in `data` after a failure.
- **Impact:** field A fails (network blip), the error appears, field B then saves successfully, and the error disappears. A's value is still shown but unsaved, so the original silent-loss problem returns. `isSaving` is also a single boolean, so overlapping saves can show "saved" early.
- **Fix:** track failures per field key (`table:category:name`), clear only that field on its own success, mark the field visibly, and roll back or flag the optimistic value. Consider a retry queue.

#### RS-21: `.select('id')` save check may false-fail if RLS SELECT differs from UPDATE
- **Status/Sev/Conf:** VERIFY-FIRST · High · inferred
- **Where:** `updateField` appends `.select('id')` to detect 0-row updates (the KI-008 fix).
- **Evidence:** with `.select()`, PostgREST returns only rows that also pass the table's SELECT policy. If any of the seven tables (`report`, `report_header`, `report_course`, `report_organizational`, `report_personal`, `report_meeting`, `report_extra`, plus `report_comment`) has a SELECT policy narrower than its UPDATE policy, genuine saves will be reported as failures. The manual describes the RLS as zone-scoped for all operations but that is not proof per table.
- **Verify:** edit one existing value in every section, including category-keyed ones, and confirm the saved state appears; compare policies per table.

#### RS-22: `loadReport` swallows errors and shows an empty form
- **Status/Sev/Conf:** OPEN-BUG · High · code-verified
- **Where:** `report-context.tsx` `loadReport` only sets state on success and returns nothing. `src/app/report/[section]/page.tsx` calls `setReportId(repId)` first, then `await loadReport(repId)`, and does not check the outcome.
- **Impact:** a transient failure in the select shows the section form with no data and no error. Users see blanks and may re-enter or panic. Edits still write to the real report id.
- **Fix:** return success or failure from `loadReport`; show a retryable error; do not render forms until data loads.

#### RS-23: Nested `ReportProvider` per section page; remount per navigation
- **Status/Sev/Conf:** VERIFY-FIRST · Medium · code-verified structure, inferred behavior
- **Evidence:** `src/app/layout.tsx` already wraps the app in `ReportProvider`, and `report/[section]/page.tsx` wraps its own. The effect runs getUser, people, RPC and select sequentially (about four round trips) with a full-screen spinner. If the page remounts when the `[section]` param changes (very likely in the App Router), this repeats on every Next/Previous. A save failing after navigation sets state on an unmounted provider, so the error is never shown.
- **Verify:** press Next and watch for the spinner and network calls.
- **Fix options:** hoist report loading to a shared layout for `/report/[section]`; use one provider and a shared save queue; await pending saves before navigating.

#### RS-24: Autosave "retry" button only dismisses the error
- **Status/Sev/Conf:** OPEN-BUG · Low · code-verified
- **Where:** `auto-save-indicator.tsx` button calls `clearSaveError`, which only does `setSaveError(null)`. It does not retry the save.
- **Fix:** retry the last failed write, or relabel the button as "dismiss".

#### RS-25: `beforeunload` flush is best-effort on mobile
- **Status/Sev/Conf:** PARTIAL · Low · code-verified
- **Context:** KI-009 is resolved with `visibilitychange` plus `beforeunload` in `auto-save-field.tsx`. `visibilitychange` is reliable. An async Supabase write started in `beforeunload` is not guaranteed to complete on mobile browsers. `navigator.sendBeacon` or a keepalive request is the more robust option if loss is observed.

#### RS-26: `.eq('category')` appended after `.select()`
- **Status/Sev/Conf:** VERIFY-FIRST · Low · code-verified
- **Where:** `updateField` builds `update().eq('report_id').select('id')` and then adds `.eq('category', category)`. Test that the category filter applies correctly and that only one row is updated.

#### RS-27: Category lists live in both code and the DB seed (drift risk)
- **Status/Sev/Conf:** OPEN-DECISION · Medium · inferred
- **Evidence:** category constants live in `src/lib/report-utils.ts` (for example `COURSE_CATEGORIES`, 8 entries), while rows are pre-seeded by the RPC. Autosave only runs UPDATE (a code comment in `updateField` says an insert-if-missing is not implemented). KI-007 was exactly this string drift, and the PDF route's meeting mapping still contains legacy category aliases ("Committee Orientation / Muallima Orientation", "Orientation / Result Publish"). Adding or renaming a category in code requires a DB seed change and a backfill of existing reports, and no automated check exists. A missing row now surfaces as a save failure.
- **Options:** make the DB the source of categories; add a CI/consistency check between constants and seeded data; make autosave upsert-capable.

### C. Digits and inputs

#### RS-30: Digits typed in Bengali flip to ASCII after save
- **Status/Sev/Conf:** OPEN-BUG · Medium · code-verified
- **Where:** `src/components/report/auto-save-field.tsx`. `getInitialValue()` returns the stored value unformatted. `persist()` normalizes with `bnToEn` before `updateField(name, normalised, …)`, which stores the ASCII value in context. The `useEffect(() => setLocalValue(currentVal), [currentVal])` sync then overwrites what the user typed.
- **Impact:** typing "১৫" shows "১৫" until blur, then "15". Every editable number shows ASCII digits, while the rest of the app (dashboard, PDFs, labels) uses `toBn()`. It also reads as "did it save correctly?".
- **Fix:** apply `toBn()` when reading numeric values into the input and keep `bnToEn` on the write path. Decide whether Bengali digits should depend on UI language, since `toBn` is applied unconditionally elsewhere.

#### RS-31: Admin override input still `type="number"`
- **Status/Sev/Conf:** OPEN-BUG · Medium · code-verified
- **Where:** `correction-button.tsx` (numeric input around line 210). Its `toBn` only converts for display, and there is no input normalization. KI-014 touched only `AutoSaveField`.
- **Fix:** reuse the same `bnToEn` plus text/`inputMode` approach and validate (see RS-02).

#### RS-32: Non-digit characters are not sanitized before saving
- **Status/Sev/Conf:** OPEN-BUG · Low · code-verified
- **Evidence:** inputs are now `type="text"`; `bnToEn` converts only Bengali digits. A pasted "1,234" or stray letters reach a numeric column and fail. Retrying the same value fails again with a generic message. The `pattern` attribute is inert because there is no form validation flow.
- **Fix:** strip or validate to digits before persist and show a specific inline message.

#### RS-33: Average-attendance fields may need decimal input
- **Status/Sev/Conf:** VERIFY-FIRST · Low · inferred
- **Evidence:** `city_avg_attendance`, `thana_avg_attendance` and `ward_avg_attendance` in `meetings-form.tsx` use `inputMode="numeric"`, which often has no decimal key. `sumRows` rounds the weighted aggregate to an integer, suggesting whole numbers.
- **Verify:** whether users ever enter fractions. If yes, use `inputMode="decimal"` for those fields.

#### RS-34: No `enterKeyHint` on numeric fields
- **Status/Sev/Conf:** OPEN-DECISION · Low · code-verified
- **Evidence:** `enterKeyHint` appears nowhere in `auto-save-field.tsx`. Adding `enterKeyHint="next"` plus focus chaining would speed up entry in dense sections. Optional.

### D. Authentication, access and admin tooling

#### RS-40: Email-verification flow gaps
- **Status/Sev/Conf:** PARTIAL · Medium · code-verified
- **Resolved:** the registration form now shows the verification notice (Sprint 2).
- **Remaining:** no "resend confirmation" action anywhere. `auth/callback/route.ts` redirects an expired link to `/home?mode=login&message=…` with "try again", but no path exists to get a new email. Re-registering with the same email hits the `identities.length === 0` check and returns "already registered". Supabase's behavior for an unconfirmed existing account is uncertain, so test it. `pending-approval/page.tsx` lists email verification as a step.
- **Options:**
  - **A:** add a resend action (`supabase.auth.resend({ type: 'signup', email })`).
  - **B:** drop email verification, since admin approval already gates access.
  - **C:** admin-side resend.
- **Verify:** whether "Confirm email" is enabled in Supabase Auth.

#### RS-41: No recovery via `user_id`; admins cannot reset passwords
- **Status/Sev/Conf:** OPEN-DECISION · High · code-verified
- **Evidence:** daily login is by `user_id`, but `forgot-password` accepts only an email. The only admin actions are `deleteUserAction` (`management/actions.ts`), the `active` toggle and `changeZone`, with no reset-password, edit-email or resend-verification action. The Help page (RS-65) tells users an admin can reset their account.
- **Impact:** a user who forgets which email they registered with is locked out, with no self-service path and no in-app admin remedy, so the owner must use the Supabase dashboard.
- **Options:**
  - **A:** add an admin server action gated by role, for example `auth.admin.generateLink({ type: 'recovery' })` or `updateUserById`.
  - **B:** add a "forgot user ID" flow.
  - **C:** security-question fallback (heavy).
  - **D:** document the manual Supabase steps for a small pilot.

#### RS-42: Login input not normalized
- **Status/Sev/Conf:** OPEN-BUG · High · code-verified
- **Where:** `src/app/home/actions.ts` `login` uses `formData.get('email')` untrimmed, and looks up `people.user_id` with an exact, case-sensitive match. The input in `auth-portal-client.tsx` has no `autoCapitalize="none"`, `autoCorrect="off"`, `autoComplete="username"` or `spellCheck={false}`. Registration trims the user ID, so the two paths disagree.
- **Impact:** mobile keyboards commonly capitalize the first letter or append a space after a suggestion, and the user sees only "invalid credentials". The registration check uses exact equality, so "Karim" and "karim" can both register unless the DB has a case-insensitive unique index.
- **Fix:** trim in login; normalize case (lowercase on register, or match with `ilike`); add the input attributes; consider a unique index on `lower(user_id)`.
- **Note:** a legacy fallback maps an unknown ID to `<id>@report.local`.

#### RS-43: Registration dropdown offers the city/DCS zone
- **Status/Sev/Conf:** OPEN-BUG · Medium · code-verified
- **Where:** `src/app/home/page.tsx` loads all zones (`select("id, name")`). The admin dashboard and reports page treat `id === 1` or `zone_type === 'city'` as non-reportable.
- **Impact:** a user can register against the city entity, and the admin dashboard treats `zone_id === 1` as admin-like. Admin approval is the only guard.
- **Fix:** exclude it from the registration list and optionally validate in `register`.

#### RS-44: Public availability checks allow account enumeration
- **Status/Sev/Conf:** OPEN-BUG · Low · code-verified
- **Where:** `checkEmailAvailability` and `checkUserIdAvailability` in `home/actions.ts` are public server actions using the service-role client with no rate limiting.
- **Fix:** rate limit, or return a generic result.

#### RS-45: No in-app way to promote a second admin
- **Status/Sev/Conf:** OPEN-DECISION · Low · code-verified
- **Evidence:** no application code writes `people.role`. Promotion requires direct DB or dashboard edits.
- **Options:** a superadmin-only promotion action, or document the manual procedure for a designated backup person.

#### RS-46: `/home?message=` renders arbitrary text
- **Status/Sev/Conf:** OPEN-BUG · Low-Med · code-verified
- **Where:** `home/page.tsx` passes `message` to `auth-portal-client.tsx`, which renders it (only two values are translated). React escapes it, so this is not XSS, but a crafted link can show fake text such as "account suspended, call this number".
- **Fix:** pass error codes and map them to known messages.

#### RS-47: Forgot-password gives identical success for a mistyped email
- **Status/Sev/Conf:** OPEN-BUG (copy) · Low · code-verified
- **Evidence:** `resetPasswordForEmail` hides whether an address exists (correct for security), so a mistyped address looks identical to success. Add guidance on the success screen to re-check the address and the spam folder.

#### RS-48: Supabase cookie handling inconsistencies
- **Status/Sev/Conf:** VERIFY-FIRST · Low · code-verified, impact inferred
- **Evidence:** `src/utils/supabase/server.ts` still uses the older `get/set/remove` cookie API (the `getAll/setAll` API is now recommended; check against installed `@supabase/ssr ^0.9`). `middleware.ts` uses `getAll/setAll`, but its redirect responses (`NextResponse.redirect`) do not copy refreshed auth cookies. Practical impact is low because refresh-token reuse tolerance covers short windows.

### E. Time and locale

#### RS-50: KI-015 timezone fix incomplete
- **Status/Sev/Conf:** OPEN-BUG · Medium · code-verified
- **Done:** `Intl.DateTimeFormat` with `timeZone: "Asia/Dhaka"` in `period-selector.tsx` and `user-dashboard.tsx`.
- **Remaining `new Date()` uses (local device or server UTC):**
  - `src/app/report/[section]/page.tsx` (future-period guard) can disagree with the dashboard on month boundaries.
  - `src/app/(admin)/dashboard/page.tsx` (server UTC) shows the previous month's stats for roughly the first 6 hours of each month in Dhaka.
  - `src/app/report/page.tsx` (default month and year), `src/app/(admin)/city-report/page.tsx` (default month and year), `src/app/(admin)/reports/page.tsx` (year list).
  - `src/app/api/export/pdf/route.tsx` and `src/app/api/export/excel/route.ts` (default year and month), `src/components/admin/reports/city-report-pdf.tsx` (generated date).
- **Fix:** one shared "Dhaka now" helper used everywhere, with tests around month boundaries.

#### RS-51: `<html lang>` and language flash
- **Status/Sev/Conf:** OPEN-BUG · Low · code-verified
- **Evidence:** `LanguageProvider` starts as `"bn"` and loads the saved language in an effect (a flash for English users); `document.documentElement.lang` is only set on toggle; `layout.tsx` hard-codes `lang="bn"`. Language toggling re-runs the section page's load effect (`t` is in its dependencies).

#### RS-52: Hard-coded Bengali strings on the admin dashboard
- **Status/Sev/Conf:** OPEN-BUG · Low · code-verified
- **Where:** `(admin)/dashboard/page.tsx` (for example "টি", "জমাকৃত", "০%/১০০%" and Bengali fallback descriptions). Move to `i18n.ts`.

### F. UX, accessibility and performance

#### RS-60: Period/report state is fragile across three pages
- **Status/Sev/Conf:** OPEN-DECISION · Medium · code-verified
- **Evidence:** `user-dashboard.tsx`, `report/[section]/page.tsx` and `report/page.tsx` each rebuild "which report" from `type`/`month`/`year`, and invalid params silently `router.replace("/")`. There is no smart default (a blank picker on each fresh visit). The report row is created as soon as a period is resolved on the dashboard, before any section opens. `report/page.tsx` already supports `report_id` directly.
- **Agreed direction (owner's proposal, evaluated):**
  - **Use `reportId` as the canonical URL parameter for the field-worker flow** (dashboard to the seven sections). This is viable because `monthlyOnly` and `get_or_create_report` give exactly one row per (zone, year, month) for regular users.
  - Keep the dashboard root `/` as the resolver that computes a default period (current month in Asia/Dhaka), mints or fetches the id, then links onward with the id only.
  - **Keep admin and export aggregate views on `zone_id` + year + month range + type.** They are computed aggregates with no single row (see RS-05).
  - Replace silent redirects with an explicit "report not found" message.
  - **Verify RLS blocks cross-zone `reportId` access before relying on it.** Previously the zone came only from the session, so a user could not construct another zone's URL. Also add the same explicit zone-ownership check the export routes already use.
  - A `reportId` link is permanently tied to one month, so keep bare `/` as the perpetual "current period" entry.
- **Accept when:** after resolution, section links carry a single id; opening another zone's id as a regular user yields a clear forbidden or not-found state and no data.
- **Related:** RS-22, RS-23, RS-10, RS-50.

#### RS-61: Pinch-zoom disabled; very small text
- **Status/Sev/Conf:** OPEN-BUG · Medium · code-verified
- **Where:** `src/app/layout.tsx` viewport has `maximumScale: 1, userScalable: false`.
- **Evidence:** about 60 uses of `text-[9px]`, `text-[10px]` and `text-[11px]` (37, 22 and 1 respectively), and a courses table view with `min-w-[900px]`. `globals.css` already forces `font-size: 16px !important` on inputs, so the lock is not needed to prevent iOS auto-zoom. It conflicts with WCAG 1.4.4 and Lighthouse.
- **Fix:** remove the zoom lock; raise the smallest text sizes where they carry meaning.

#### RS-62: Dashboard section-completion badges
- **Status/Sev/Conf:** DECIDED-NOT-DOING · Low · code-verified
- **Context:** each dashboard card shows only an icon, name and an edit button. The owner decided not to build this because it needs the same per-section data detection as a system-derived completion tracker (RS-13 option B), which is not being built, and the effort is not justified for a small user base. Revisit together with RS-13 if completeness tracking is taken up.

#### RS-63: No in-app onboarding
- **Status/Sev/Conf:** OPEN-DECISION · Low
- **Evidence:** the only onboarding is the Help page (RS-65). At this scale human onboarding plus a help document is the industry norm. Options are a dismissible first-login tour or contextual hints. Optional.

#### RS-64: Download filenames percent-encoded
- **Status/Sev/Conf:** OPEN-BUG · Low · code-verified
- **Where:** PDF and Excel routes set `Content-Disposition: attachment; filename="${encodeURIComponent(filename)}"`. Some browsers show `%E0%A6…` names for Bengali zone names.
- **Fix:** use `filename*=UTF-8''…` with an ASCII fallback.

#### RS-65: Help page content is placeholder and contains false claims
- **Status/Sev/Conf:** DEFERRED · Medium · code-verified
- **Context:** the owner confirmed `src/app/help/page.tsx` is AI-generated placeholder content to be rewritten (or marked as demo) after production readiness.
- **Known false or stale statements:**
  - The auto-save FAQ says no data is lost if the connection drops, which contradicts real behavior (see RS-20, RS-22).
  - The password FAQ says an admin can reset the account, but no such feature exists (RS-41).
  - It references an "অনুমোদন (Approval)" tab that does not exist (approval is a toggle inside Management).
  - The steps tell users to select a report type, but `monthlyOnly` hides that control.
  - It tells users to watch for the green saved signal, which is only reliable once RS-20 is fixed.

#### RS-66: Register form labels not bound to inputs
- **Status/Sev/Conf:** OPEN-BUG · Low · code-verified
- **Where:** `register-form-client.tsx`: every label has `htmlFor`, but the inputs have no matching `id` (pre-existing; the new confirm-password field inherited it). Tapping a label does not focus the field.

#### RS-67: Redundant auth/profile calls and unpinned hosting region
- **Status/Sev/Conf:** VERIFY-FIRST · Medium · inferred
- **Evidence:** a page load can run `getUser` and a `people` query in middleware, the page or layout, the navbar, the user dropdown and the bottom nav, each separately. The section page adds getUser, people, RPC and select (RS-23). There is no `vercel.json`, so the function region is the default; Supabase's region is not in the repo.
- **Impact:** if the app region is far from Supabase or from Dhaka, sequential round trips cost seconds on mobile.
- **Verify:** Vercel function region and Supabase region.
- **Fix options:** pin the function region near the database; share one profile fetch via context or a server layout.

### G. Operations, security and hygiene

#### RS-70: Backups are unencrypted plaintext dumps (KI-018)
- **Status/Sev/Conf:** DEFERRED · High · code-verified
- **Where:** `.github/workflows/backup.yml` runs plain `pg_dump` with no encryption step and commits the file to a second GitHub repo using a PAT. `docs/TECHNICAL_MANUAL.md` was corrected to note this (KI-018), but `README.md` line 26 still says "encrypted `pg_dump`".
- **Impact:** a plaintext dump of the whole database (emails, zone data, all submissions) is committed daily; "private repo" is access control, not encryption.
- **Options:**
  - **A:** add symmetric encryption (`gpg --symmetric` or `age`) before commit, with the passphrase in a secret.
  - **B:** use an encrypted storage destination or Supabase PITR.
  - **C:** fix the README now.
- **Note:** encrypting going forward does not remove earlier plaintext dumps from git history, so consider purging history and rotating credentials.

#### RS-71: No CI runs tests, lint or typecheck
- **Status/Sev/Conf:** OPEN-DECISION · Medium · code-verified
- **Evidence:** the only workflow is `backup.yml`. Tests exist only for `report-utils` (`npm test` runs `node --test src/lib/report-utils.test.ts`). The pre-flight gates in `AGENTS.md` are not enforced automatically.
- **Option:** a GitHub Actions workflow running lint, `tsc --noEmit`, tests and build on push and PR.

#### RS-72: No security headers configured
- **Status/Sev/Conf:** OPEN-DECISION · Low · code-verified
- **Evidence:** `next.config.mjs` is empty. Consider CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, and so on.

#### RS-73: DB-side fixes cannot be verified from the repo
- **Status/Sev/Conf:** VERIFY-FIRST · High · unverifiable-here
- **Evidence:** KI-007 (RPC string alignment), KI-010 (`security_invoker` on city views) and KI-011 (`CHECK >= 0`) were described in ADR 016 but there are no SQL files in the repo. Confirm in the Supabase dashboard (see section 7).

#### RS-74: Leftover and dead code
- **Status/Sev/Conf:** OPEN-BUG · Low · code-verified
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
| KI-015 | Timezone parity | RESOLVED (ADR 015) | Incomplete, RS-50. |
| KI-016 | Auth error localization | RESOLVED (ADR 016) | Applied in login, register, forgotPassword and updatePassword. |
| KI-017 | Quarter ranges hardcoded to January | OPEN (deferred) | RS-05. |
| KI-018 | Backup encryption | OPEN (deferred) | RS-70. |
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

# ADR 028: Track 2 Core Save Machine, Concurrency Hardening, and Numeral Normalization

**Date**: 2026-11-16  
**Status**: Accepted and Implemented  
**Deciders**: System Owner & Antigravity  
**Consulted**: `docs/issues-critique/SUMMARY.md`, `AGENTS.md` (Rules 2 & 6: Multi-Option Planning & Adversarial Doubt Gate; Rule 7: Pre-Production Agility)

---

## 1. Context and Problem Statement

Following the completion of Track 1 (Database DDL, RLS Hardening & Storage Hygiene), **Track 2** addresses high-impact vulnerabilities in the client save state machine, concurrency management, numeral processing, and localization parity across the reporting system:

1. **`failedFields` Cross-Report Data Corruption (`RS-20 / KI-008`)**:
   - In [`src/components/report/report-context.tsx`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx), `failedFields` was a flat dictionary keyed by `${table}:${category || ''}:${name}`, entirely omitting `reportId`.
   - `loadReport(newId)` never wiped or reset `failedFields`.
   - If a mobile worker experienced a network failure while editing Month 6 (`reportId = 41`), navigated to Month 7 (`reportId = 42`), and tapped "পুনরায় চেষ্টা করুন" (Retry All), the retry handler invoked `updateField` targeting the active `reportId = 42`. Month 6's failed numbers were destructively written into Month 7's database records.
   - In-flight requests for Report 41 resolving after the user navigated to Report 42 contaminated state across reports.

2. **Unchecked Submission Gate during In-Flight Flushes (`Segment 02`)**:
   - In [`src/components/report/sections/comments-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx), toggling `is_submitted: true` performed zero checks on `isSaving` (`pendingSavesCount > 0`) or `failedFields`.
   - A field worker editing a comment could immediately check "রিপোর্ট সাবমিশন সম্পন্ন হয়েছে"; the submission commit raced with the in-flight comment save. If the field save dropped on 3G, the report was permanently marked as finalized with missing data.
   - Unblurred inputs were lost or raced with the submission toggle.

3. **Out-of-Order Execution on Rapid Edits (`RS-24 / Segment 02`)**:
   - When a user edited a field from `"10"` to `"20"` in rapid succession, high network latency on mobile connections could cause the older request (`"10"`) to arrive at Supabase after the newer request (`"20"`), silently clobbering the correct value in PostgreSQL.
   - Stale errors from superseded requests caused false error rings on successfully saved inputs.

4. **Bangladeshi Mobile Keyboard Separator Truncation (`RS-32 / KI-014`)**:
   - In Bangladesh, field workers using Android phones with Islamic or multilingual keyboard layouts (Gboard, Ridmik) frequently input Arabic commas `،` (`U+060C`), Arabic thousand separators `٬` (`U+066C`), or Fullwidth commas `，` (`U+FF0C`).
   - In [`src/components/report/auto-save-field.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx) and [`src/components/admin/correction-button.tsx`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx), `replace(/[,\s]/g, "")` only stripped ASCII comma `U+002C`.
   - JavaScript's `parseFloat("1،50،000")` parsed `"1"`, encountered `،`, and halted, saving `1` instead of `150,000` (a catastrophic **150,000× headcount erasure**).
   - Voice typing (Google Bengali Speech-to-Text) injected colloquial counting words like `"১২ জন"` or `"১৫টি"`, which either broke input masks or failed to parse.

5. **`toFiniteNumber` Comma-Blindness Bug in Aggregation and Overrides (`RS-32, RS-01, RS-05`)**:
   - In [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts), `toFiniteNumber(val)` ran `Number(en)` without stripping commas.
   - Because `Number("1,500") === NaN`, any formatted number or override containing a thousands separator was silently zeroed out in `sumRows()` and PDF exports.

6. **Timezone Runtime Overhead & Crash Surface (`RS-50 / KI-015`)**:
   - [`src/lib/date-utils.ts`](file:///d:/WebDev/report-submission/src/lib/date-utils.ts) instantiated `new Intl.DateTimeFormat` on every invocation of `getDhakaDate()`, causing severe CPU/memory overhead on SSR.
   - Relied on non-null assertions `parts.find(...)!.value`, causing unhandled exceptions in environments lacking full ICU schemas.

7. **Admin Dashboard Localization Parity (`RS-52`)**:
   - [`src/app/(admin)/dashboard/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx) hardcoded a local `BN_MONTHS` array, duplicated `toBn()`, executed unconditional `toBn()` on all KPI cards and dates, and hardcoded the Bengali `"টি"` classifier even when English was selected.

---

## 2. User Invariant & Architectural Constraints

- **Strict Language Policy**: The project owner explicitly mandated: **"no, the only languages are bangla and english. besides this, do all the recommended ones."**
- **Digit Restriction**: Supported **ONLY** Bengali numerals (`০-৯`) and English numerals (`0-9`). Eastern Arabic (`٠-٩`) and Persian (`۰-৯`) digits were deliberately excluded from digit mapping.
- **Punctuation Invariance**: Defensive stripping of all South Asian and Islamic keyboard punctuation marks (`،`, `٬`, `，`, `_`, non-breaking spaces) was retained to protect Bengali and English numeral input from truncation.

---

## 3. Decision Outcomes Matrix

| Problem Area | Chosen Architecture | Rejected Alternatives | Architectural Rationale & Implementation Details |
|:---|:---|:---|:---|
| **1. `failedFields` Scoping & Lifecycle** | **Composite Keying + Lifecycle Reset + In-Flight Guard** | Minimal Key Scoping Only (Option A); Component-Local Error State (Option B) | Keyed `failedFields` by `${reportId}:${table}:${category \|\| ''}:${name}`. Reset `failedFields` and pending counts on `loadReport(id)`. Maintained `activeReportIdRef.current = id`. In `updateField()`, if `targetReportId !== activeReportIdRef.current` upon promise settlement, the response is silently dropped, eliminating cross-report contamination. |
| **2. Submission Gate Integrity** | **Two-Phase Pre-Flight Drain + Confirmation Modal** | Simple Disabled Checkbox (Option A); Server RPC Completeness Check (Option B) | Pre-flight drain: forces `document.activeElement?.blur()` to trigger dirty unblurred saves, drains in-flight saves up to 2,500ms via `drainPendingSaves(2500)`, and aborts with an alert if any field failed (`failedFields > 0`). Requires intentional confirmation dialog before toggling `is_submitted: true`. |
| **3. Concurrency on Rapid Edits** | **Monotonic Sequence Counter per Field** | Client Global 1500ms Debounce (Option A); Client AbortController per Field (Option B) | Maintained `fieldSequenceRef.current[fieldKey] = ++seq`. Upon save resolution, if `fieldSequenceRef.current[fieldKey] !== seq`, the response is discarded because a newer edit was already dispatched. Fixed optimistic state mapping for `report_course` (`course_name`) and `report_meeting` (`meeting_type`). |
| **4. Numeral Normalization & Voice Typing** | **Centralized `parseBangladeshiNumber()` in `report-utils.ts`** | Native HTML5 `<input type="number">` (Option A); Local Regex Patch (Option B); Database Trigger Cleansing (Option C) | Exported `UNICODE_SEPARATOR_REGEX = /[,،٬，_\s\u00A0\u202F]/g`. Strips Unicode separators and Bengali classifiers (`জন`, `টি`, `টা`, `খানা`, `খানি`, etc.), extracts primary numeric token, parses float, and clamps to non-negative integer `Math.max(0, Math.round(num))`. Integrated into both `AutoSaveField` and `CorrectionButton`. |
| **5. `toFiniteNumber` Comma-Blindness** | **Unified Unicode Stripping with Float Preservation** | ASCII-only Comma Strip (Option A); Caller-Guaranteed Primitives (Option B) | Updated `toFiniteNumber(val)` to strip all Unicode separators and normalize via `bnToEn()`, returning `0` for booleans/null/undefined/empty and preserving valid floats (`"12.5"` and `"১২.৫"` evaluate to `12.5`, `"1,500"` evaluates to `1500`). Eliminates silent zeroing across all multi-month and city aggregations. |
| **6. Mobile Unmount & Draft Safety** | **1,000ms Idle Typing Debounce + `localStorage` Write-Ahead Buffer** | Full IndexedDB Offline Engine (Option A) | Added 1,000ms idle typing debounce timer in `AutoSaveField` to persist before blur. Added synchronous `localStorage` Write-Ahead Buffer (`draft:${reportId}:${fieldKey}`) wrapped in `try/catch` for private browsing, automatically restored on mount and cleared upon HTTP save confirmation. Maintained unmount/`visibilitychange` flush. |
| **7. Timezone Hardening & Admin Localization** | **Cached `Intl` Singleton + Mathematical UTC+6 Fallback + i18n Months** | Per-Call `Intl` Allocation (Option A); External Date Library (Option B); Ad-Hoc Ternaries (Option C) | Cached module-level `DHAKA_FORMATTER` singleton; parameterized `getDhakaDate(date: Date = new Date())`; safe part loop without non-null assertions; infallible mathematical UTC+6 fallback. Added localized `months` arrays to `i18n.ts`, created `formatLocaleNumber` and `formatMonthYear`, and achieved 100% English/Bengali parity on the admin dashboard. |

---

## 4. Verification and Quality Gates

All four mandatory pre-flight quality gates passed cleanly with zero errors:
1. **TypeScript**: `npx tsc --noEmit` $\rightarrow$ 0 errors.
2. **Linting**: `npm run lint` $\rightarrow$ 0 errors, 0 warnings.
3. **Unit & Integration Tests**: `npm test` $\rightarrow$ 58/58 tests passing across 18 suites (added 14 unit tests covering `parseBangladeshiNumber`, `toFiniteNumber`, and boundary dates for Dhaka timezone).
4. **Production Build**: `npm run build` $\rightarrow$ Clean compilation exit code 0, all 20 static/dynamic routes validated.

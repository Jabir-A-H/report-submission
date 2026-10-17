# ADR 018: High-Severity Reliability Hardening (RS-01, RS-20, RS-22, RS-23, RS-24)

- **Status**: Accepted and Implemented
- **Date**: 2026-10-17

## Context

A comprehensive audit of the production reporting system identified three high-severity failure modes affecting field workers and city administrators:

1. **RS-01 (Override Key Mismatch on Non-Monthly Views)**: In `/city-report`, the month dropdown is disabled when `reportType !== 'মাসিক'`. The page and correction button previously used the current calendar month (e.g. month 10 in October) to write overrides to `city_report_override`. When reading back data, `getMonthsForPeriod('ত্রৈমাসিক', 10)` returned `[1, 2, 3]`, which did not match month 10. Consequently, overrides saved on quarterly, half-yearly, and nine-month views were completely omitted from the UI and from PDF/Excel exports.
2. **RS-20 (Global Autosave Error Overwrite & Silent Data Loss)**: `ReportProvider` stored `saveError` as a single global string and `isSaving` as a single boolean. When field worker edits Field A and connectivity drops, an error was raised. When field worker then edited Field B 1 second later and connectivity restored, Field B's success cleared `saveError` globally and turned the indicator green ("সংরক্ষিত"). Because Field A's optimistic value was never rolled back, the user saw Field A as saved when it was never written to the server.
3. **RS-22 (Swallowed `loadReport` Failures and Blank Form Renders)**: `loadReport` in `report-context.tsx` returned `void` and silently ignored Supabase fetch errors. When transient mobile network errors occurred, `report/[section]/page.tsx` rendered the forms with empty `data = {}`. Workers saw blanks, panicked, and typing into any field triggered autosave overwriting valid database rows with zeros/blanks.
4. **RS-23 & RS-24 (Nested Provider Remounts & Inert Retry Action)**: `src/app/report/[section]/page.tsx` nested a second `<ReportProvider>` inside the page component, shadowing the root provider in `layout.tsx` and tearing down state on every tab navigation. Furthermore, `AutoSaveIndicator`'s retry button previously only dismissed `saveError` without retrying writes.

## Decision

1. **RS-01: Period-Start Keying (`getOverrideMonthForPeriod`)**:
   - Implemented `getOverrideMonthForPeriod(reportType, selectedMonth)` in `src/lib/report-utils.ts`:
     - For monthly reports, returns `selectedMonth`.
     - For non-monthly reports, returns `getMonthsForPeriod(reportType, selectedMonth)[0] || 1` (the period's start month).
   - Updated `CorrectionButton` (`handleSave` and `handleDelete`) and `CityReportPage` context to normalize to `getOverrideMonthForPeriod(reportType, month)`.
   - Because queries in `city-report/page.tsx`, `pdf/route.tsx`, and `excel/route.ts` already filter with `.in("month", monthsRange)`, the period-start month is naturally included in `monthsRange`. Zero schema changes or query hacks required; fully compatible with future rolling quarters (RS-05).
   - Added unit test coverage in `src/lib/report-utils.test.ts`.

2. **RS-20: Non-Destructive Per-Field Failure Tracking & Active Save Counter**:
   - Replaced scalar `saveError` with `failedFields: Record<string, FailedFieldInfo>` keyed by `${table}:${category || ''}:${name}`.
   - Preserved user input on failure (non-destructive state): user-typed values remain visible and editable rather than being wiped.
   - Updated `updateField`:
     - Increments/decrements concurrent save counter `pendingSavesCount` (so `isSaving = pendingSavesCount > 0` never terminates prematurely).
     - On write success, deletes only that field's key from `failedFields`.
     - On write error, registers the field in `failedFields`.
     - Returns `{ success: boolean; error?: any }`.
   - Updated `AutoSaveField` to detect `isFailed = Boolean(failedFields[fieldKey])`:
     - Applies visual error ring (`border-destructive bg-destructive/10 text-destructive focus:border-destructive ring-1 ring-destructive/40`) and warning badges directly to the failed input.
   - Updated `AutoSaveIndicator` (and resolved RS-24):
     - Displays failed field count (`toBn(failedCount) + "টি ফিল্ড সংরক্ষণ ব্যর্থ হয়েছে"`).
     - "আবার চেষ্টা করুন" button invokes `retryAllFailed()` to actually re-attempt failed writes rather than merely clearing the banner.

3. **RS-22: Load-Gated Error Screen with Retry**:
   - Updated `loadReport` in `report-context.tsx` to return `{ success: boolean; error?: any }` and expose `loadError: string | null`.
   - In `src/app/report/[section]/page.tsx`, gated form rendering:
     - If `loadReport` fails, displays a dedicated, reassuring Bengali error card:
       *"রিপোর্ট ডেটা লোড করতে সমস্যা হয়েছে। আপনার পূর্বের ডেটা সুরক্ষিত আছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।"*
       with a prominent "পুনরায় চেষ্টা করুন (Retry)" button.
     - Section forms are never mounted with empty `data = {}`, completely preventing worker panic and accidental destructive overwrites.

4. **RS-23: Section Navigation Transition Cache & Root Provider Deduping**:
   - Removed the redundant nested `<ReportProvider>` in `src/app/report/[section]/page.tsx`, allowing the persistent root `<ReportProvider>` from `src/app/layout.tsx` to manage report state.
   - In `SectionSwitcher`, checked if `reportId === repId && data && Object.keys(data).length > 0 && !loadError`. When moving between section tabs (`/report/header` → `/report/courses`), in-memory report data is reused immediately without redundant 7-table join queries, eliminating tab-switching latency and unmounted save drops.

## Consequences

### Positive
- **Complete Elimination of Silent Save Loss**: Failed field writes are never masked by unrelated successful writes; failed inputs are visually identifiable.
- **True Autosave Retry**: Clicking retry actually re-saves failed rows.
- **Accidental Zero Overwrites Prevented**: Report forms cannot render until data is confirmed loaded from PostgreSQL.
- **Override Consistency**: City overrides on quarterly and yearly views appear immediately and export correctly.
- **Fast Section Navigation**: Tab switching between the 7 report sections is instantaneous (0 network round-trips for cached data).
- **Zero Schema Migrations**: All fixes implemented cleanly in application layer and client state with 0 database DDL required.

### Verification
- `npm test`: 12/12 unit tests passing.
- `npx tsc --noEmit`: 0 type errors.
- `npm run lint`: 0 lint errors.
- `npm run build`: Production build cleanly compiled with Turbopack (exit code 0).

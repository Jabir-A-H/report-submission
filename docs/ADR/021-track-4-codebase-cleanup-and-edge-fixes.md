# ADR 021: Track 4 Codebase Cleanup, Edge Fixes, and Security Hardening

- **Status**: Accepted and Implemented
- **Date**: 2026-10-19

## Context

Following the completion of Track 1 (ADR 020), an audit of Track 4 issues in [`docs/report-submission-issue-register.md`](../../docs/report-submission-issue-register.md) identified key reliability, security, and edge-case defects across timezone calculations, admin reporting lists, report editing boundaries, account enumeration vectors, locale switching, and security headers:

1. **Timezone Discrepancy on Boundary Hours (RS-50 / KI-015)**:
   - Several components and route handlers relied directly on `new Date()`, running in UTC on Vercel/Node.js serverless runtimes.
   - For the first 6 hours of every month (between 12:00 AM and 05:59 AM BST, `Asia/Dhaka`), UTC is still on the previous month. This caused server views (`(admin)/dashboard`, `(admin)/reports`, `/api/export/*`) to calculate statistics and period defaults for the wrong month.

2. **Admin Reports List Lack of Draft Filtering & 1000-Row Limit (RS-08, RS-09)**:
   - `src/app/(admin)/reports/page.tsx` loaded all rows from `report` without checking `is_submitted`. Because `get_or_create_report` automatically mints report rows as soon as a zone opens a period, empty drafts and fully submitted reports were indistinguishable.
   - The "Reported Zones" KPI card queried `.select("zone_id").limit(1000)` and ran `new Set()` on all returned rows in browser memory. This capped accuracy at 1,000 rows (approx. 2.7 years for 30 zones) while causing wasteful payload sizes.

3. **Accidental Non-Monthly Report Editing Rows (RS-10)**:
   - The data entry editor route `src/app/report/[section]/page.tsx` accepted any `?type=` query parameter and invoked `get_or_create_report`. If a user manually navigated to or followed a link with `?type=quarterly`, an isolated non-monthly report row was created in the database.
   - Field workers must only submit monthly data; multi-month periods (quarterly, yearly) are dynamic read-only aggregates generated in `src/app/report/page.tsx` and export routes.

4. **Public Account Enumeration on Live Validation (RS-44)**:
   - `checkEmailAvailability` and `checkUserIdAvailability` in `src/app/home/actions.ts` were public server actions using `createAdminClient` without throttling or rate limiting, exposing user existence to automated scraping.

5. **`<html lang>` Desynchronization & Hardcoded Admin Strings (RS-51, RS-52)**:
   - `LanguageProvider` saved preferences to `localStorage` and a cookie named `app-language`, but `getServerLanguage()` in `i18n.ts` read `NEXT_LOCALE`. On initial page load, `document.documentElement.lang` was not updated until the language toggle was clicked.
   - Admin dashboard cards contained hardcoded Bengali characters ("টি", "০%", "১০০%", "টি জোন জমাকৃত") that did not translate when switching to English.

6. **Missing Standard HTTP Security Headers (RS-72)**:
   - `next.config.mjs` was an empty configuration, lacking basic defense-in-depth security headers like `X-Frame-Options` (clickjacking), `X-Content-Type-Options` (MIME sniffing), and HSTS.

---

## Decision

### 1. Centralized Asia/Dhaka Timezone Utility (RS-50)
- Created `src/lib/date-utils.ts` exporting `getDhakaDate()` returning `{ month, year, day }` via standard `Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka" })`.
- Replaced all raw `new Date()` month/year fallback calculations across:
  - `src/app/(admin)/dashboard/page.tsx`
  - `src/app/(admin)/reports/page.tsx`
  - `src/app/(admin)/city-report/page.tsx`
  - `src/app/report/[section]/page.tsx`
  - `src/app/report/page.tsx`
  - `src/app/api/export/pdf/route.tsx`
  - `src/app/api/export/excel/route.ts`
  - `src/components/admin/reports/city-report-pdf.tsx`
  - `src/components/dashboard/period-selector.tsx`
  - `src/components/dashboard/user-dashboard.tsx`
- Added comprehensive unit tests in `src/lib/date-utils.test.ts` using `node:test` and `node:assert/strict`.

### 2. Admin Reports Draft Filtering & Dynamic Active Zone Calculation (RS-08, RS-09)
- **Draft Status & Filtering (RS-08)**:
  - Added `is_submitted: boolean` to `ReportRow` and query projection.
  - Added `showSubmittedOnly` state and server-side filter `.eq("is_submitted", true)`.
  - Added filter toggle pills ("সকল রিপোর্ট" / "শুধু জমাকৃত") in the filter panel.
  - Added visual status badges ("জমাকৃত" / green vs "খসড়া" / amber) to both the desktop table and responsive mobile cards.
- **Efficient Active Zone Aggregation (RS-09)**:
  - Scoped the unique zone query dynamically to the reporting year (`.eq("year", currentReportingYear)`).
  - Eliminates the `limit(1000)` arbitrary cap while restricting payload size to < 3 KB without requiring DDL migrations.

### 3. Enforced Single-Month Editing Boundary (RS-10)
- In `src/app/report/[section]/page.tsx`, enforced `dbReportType = "মাসিক"` and `targetMonth = selectedMonth` regardless of URL parameters before calling `get_or_create_report`.
- Prevents field workers from accidentally generating detached non-monthly report rows, while leaving the multi-month consolidated viewer (`src/app/report/page.tsx`) fully operational.

### 4. Sliding-Window Rate Limiter for Availability Checks (RS-44)
- Created `src/lib/rate-limit.ts` providing an in-memory sliding-window limiter with automated timestamp cleanup.
- Configured a 10 requests / 60 seconds threshold per client IP (derived from `x-forwarded-for`) in `checkEmailAvailability` and `checkUserIdAvailability`.

### 5. Language Synchronization & Admin i18n Normalization (RS-51, RS-52)
- Added `document.documentElement.lang = savedLang` inside `LanguageProvider`'s initial mount `useEffect`.
- Aligned cookie keys: updated `getServerLanguage()` to read `app-language`.
- Added `counterSuffix`, `zonesSubmitted`, `statusCol`, `draft`, `allReportsToggle`, and `submittedOnlyToggle` to `translations` in `src/lib/i18n.ts` for both Bengali and English.
- Replaced hardcoded strings in `src/app/(admin)/dashboard/page.tsx` with dynamic `{t.labels.*}` properties.

### 6. Standard Security Response Headers (RS-72)
- Configured `headers()` in `next.config.mjs`:
  - `X-Frame-Options: DENY` (anti-clickjacking)
  - `X-Content-Type-Options: nosniff` (anti-MIME-sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin` (URL privacy)
  - `X-DNS-Prefetch-Control: on` (network optimization)
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS)
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (least-privilege hardware sandbox)

---

## Verification & Quality Gates

All four Rule 3 verification gates pass cleanly:
1. `npm test`: 19/19 unit tests passing (100% green).
2. `npx tsc --noEmit`: 0 TypeScript compiler errors.
3. `npm run lint`: 0 ESLint warnings or errors.
4. `npm run build`: Turbopack production compilation clean, exit code 0 across all 18 routes.

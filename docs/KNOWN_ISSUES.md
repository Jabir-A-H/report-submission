# Known Issues & Bug Tracker

## Overview
This file tracks known bugs, temporary hacks, or design compromises made during development. Documenting these saves time when refactoring later.

## Active / Deferred Issues

### Mobile Touch Target Ergonomics Violations (<44px)
- **Date**: 2026-06-26
- **Description**: Inline inputs and textareas in `AutoSaveField` rows maintain small hit areas (heights `h-9` and `h-10` / `36px`-`40px`), violating WCAG 2.2 AA mobile touch target guidelines (minimum 44px x 44px).
- **Impact**: Medium (mobile usability friction & accidental taps)
- **Status**: **RESOLVED / WONTFIX (Design Decision)** - Enforcing 44px on `tableMode` (`h-9`) was deliberately skipped to prevent vertical bloat and preserve the dense, compact matrix theme of the reporting grids.

---

### Supabase Free Tier: 2 Password Reset Emails Per Hour
- **Date**: 2026-06-13
- **Description**: Supabase's free tier enforces a hard limit of 2 password reset emails per hour per email address. This cannot be changed via the Dashboard on the free plan.
- **Impact**: Low (only affects testing; real users rarely reset passwords more than once).
- **Workaround**: Use Gmail `+` aliases (e.g., `user+test1@gmail.com`) to get fresh rate limits per alias. All emails still arrive at the same inbox.

---

### Quarterly/Multi-Month Periods Hardcoded to January Start (KI-017)
- **Date**: 2026-09-20
- **Description**: `getMonthsForPeriod()` in `src/lib/report-utils.ts` ignores the selected month for all non-monthly types. "Quarterly" always returns Jan-Mar, never Q2/Q3/Q4. Whether this represents cumulative year-to-date reporting (intentional) or a bug is currently ambiguous — org confirmation required before any code change.
- **Location**: `src/lib/report-utils.ts` → `getMonthsForPeriod()`
- **Impact**: Low-Medium (incorrect period aggregation for non-monthly report types if true rolling quarters are intended)
- **Status**: **DEFERRED — Requires org confirmation** — Confirm with the organization whether multi-month periods mean rolling quarters or year-to-date checkpoints. If year-to-date: update UI labels to make it explicit. If rolling: fix `getMonthsForPeriod()` to compute from `selectedMonth`.

---

### Backup Workflow Not Actually Encrypted (KI-018)
- **Date**: 2026-09-20
- **Description**: `TECHNICAL_MANUAL.md` §6 describes database backups as "encrypted." The actual `.github/workflows/backup.yml` produces a plain, unencrypted `pg_dump` SQL file committed to a second GitHub repository. "Private repo" is access control, not encryption. The dump contains personal data (emails, per-user submissions).
- **Location**: `.github/workflows/backup.yml`, `docs/TECHNICAL_MANUAL.md`
- **Impact**: Medium (documentation falsely claims encryption; private backup repo exposure would leak plaintext PII)
- **Status**: **DEFERRED (Phase 4)** — At minimum, correct `TECHNICAL_MANUAL.md` to accurately describe the current unencrypted state. When ready: add GPG symmetric encryption step (`gpg --symmetric --cipher-algo AES256`) to the workflow before the git commit, storing the passphrase as a GitHub Actions secret.

---

## Resolved Historical Issues

### High-Severity Reliability Hardening: Override Period-Start Keying, Granular Autosave Failure Tracking & Load-Gated Error Recovery (ADR 018, RS-01, RS-20, RS-22, RS-23, RS-24)
- **Date**: 2026-10-17
- **Resolution Date**: 2026-10-17
- **Description**:
  1. **RS-01 (Non-Monthly Overrides Keyed to Current Calendar Month)**: Overrides saved on Quarterly, Half-Yearly, and 9-Month city reports were saved using the disabled calendar month (e.g., month 10 in October). Because `getMonthsForPeriod('ত্রৈমাসিক', 10)` returns `[1, 2, 3]`, overrides were omitted from table views and PDF/Excel exports.
  2. **RS-20 (Global Autosave Error Overwrites & Silent Data Loss)**: `ReportProvider` stored `saveError` as a single global string and `isSaving` as a single boolean. When field A failed and field B succeeded 1 second later, field B cleared `saveError` globally, showing a green "Saved" status while field A was never persisted on the server.
  3. **RS-22 (Swallowed `loadReport` Failures and Blank Form Renders)**: `loadReport` swallowed fetch errors and returned `void`. Network drops caused section pages to render with empty `data = {}`, causing field worker panic and enabling accidental destructive zero-overwrites.
  4. **RS-23 (Nested Provider Remounts on Section Navigation)**: `report/[section]/page.tsx` rendered a redundant nested `<ReportProvider>`, tearing down and recreating provider state and 7-table join queries on every section tab change.
  5. **RS-24 (Autosave Retry Button Only Dismissed Error)**: `auto-save-indicator.tsx` button called `clearSaveError`, which only reset the banner string without retrying failed writes.
- **Fix**:
  1. **Period-Start Keying (`getOverrideMonthForPeriod`)**: Added `getOverrideMonthForPeriod(reportType, selectedMonth)` returning `monthsRange[0]` (e.g. `1` for Q1, `4` for Q2). Updated `CorrectionButton` and `CityReportContext` to use period-start keying. Existing `.in("month", monthsRange)` queries in page and export routes naturally retrieve the overrides without schema alterations. Tested via `node --test src/lib/report-utils.test.ts`.
  2. **Granular Per-Field Error Tracking**: Replaced scalar `saveError` with `failedFields: Record<string, FailedFieldInfo>`. Failed writes keep the user's typed value intact in the input and apply visual red/amber alert styling directly to the field. Added a concurrent save counter (`pendingSavesCount`) to prevent premature spinner termination.
  3. **Load-Gated Error Screen & Retry Action**: Updated `loadReport` to return `{ success, error }` and expose `loadError`. Gated `SectionSwitcher` to render a reassuring Bengali error card with a retry button when loading fails, completely preventing forms from mounting with empty data.
  4. **Root Provider De-duplication & Section Transition Cache**: Removed the redundant nested `<ReportProvider>` in `src/app/report/[section]/page.tsx`, letting the root `<ReportProvider>` in `layout.tsx` maintain state. Cached in-memory report data across section tab changes, making tab switching instantaneous.
  5. **Functional Retry All Failed**: Updated `auto-save-indicator.tsx` to display failed field count and invoke `retryAllFailed()` to actually re-attempt writes across failed fields.

### Bubblewrap CLI CI Checksum, Manifest Redirect, Gradle Syntax & MinSdk Resolution (ADR 017)
- **Date**: 2026-10-14
- **Resolution Date**: 2026-10-14
- **Description**:
  1. `bubblewrap build` failed in GitHub Actions runner with exit code 130 on an Inquirer prompt: `"No checksum file was found to verify the state of the twa-manifest.json file. To make sure your project is up-to-date, would you like to regenerate your project? (Y/n)"`. In headless CI environments (no TTY), Inquirer prompts cause an immediate exit code 130 because clean git checkouts only track `twa-manifest.json` and lack generated Android Gradle project files and `manifest-checksum.txt`.
  2. Running `bubblewrap update --skipVersionUpgrade` in CI subsequently threw `cli ERROR Unexpected token '<', "<!DOCTYPE "... is not valid JSON`. Investigation revealed that Next.js `middleware.ts` treated `/manifest.webmanifest` and `/.well-known/assetlinks.json` as protected routes for unauthenticated clients, issuing a `307 Temporary Redirect` to `/home` (HTML). Bubblewrap's internal `fetchUtils.fetch()` followed the redirect and received HTML instead of JSON.
  3. When compiling `assembleRelease`, Gradle failed with Groovy syntax error `build file 'app/build.gradle': 44: Unexpected input: ',' @ line 44, column 34. splashScreenFadeOutDuration: ,`. Bubblewrap's `app/build.gradle` template directly interpolates `splashScreenFadeOutDuration: <%= splashScreenFadeOutDuration %>,`. When omitted from `twa-manifest.json`, it emitted an empty comma, breaking Groovy syntax.
  4. Manifest merger failed with `uses-sdk:minSdkVersion 21 cannot be smaller than version 24 declared in library [com.google.androidbrowserhelper:androidbrowserhelper:2.7.4]`. The default fallback minSdkVersion in Bubblewrap is 21, but modern `androidbrowserhelper` (v2.7.4) requires Android 7.0 (API 24) or higher.
  5. Bubblewrap's `AndroidSdkTools` strictly expects legacy `$ANDROID_HOME/tools` or `$ANDROID_HOME/bin`, while modern `setup-android@v4` provides command-line tools under `$ANDROID_HOME/cmdline-tools/latest/bin`. Furthermore, `@bubblewrap/core@1.27.0` hardcodes `BUILD_TOOLS_VERSION = '36.1.0'` when invoking `zipalign` and `apksigner`.
- **Fix**:
  1. **Middleware Whitelisting**: Added `/manifest.webmanifest`, `/manifest.json`, and `/.well-known` to `publicPaths` in `middleware.ts`, and updated `config.matcher` to bypass `.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|webmanifest)$`, allowing unauthenticated browsers, Bubblewrap, and Google/Android Digital Asset Link crawlers to access these assets with HTTP 200 JSON directly.
  2. **CI Self-Contained Generation**: In `.github/workflows/build-apk.yml`, spun up an in-job background Node.js HTTP server on port 8080 during project generation to serve the local manifest and icon assets directly. This completely decouples APK generation from external network availability or deployment lag, afterwards synchronizing production URLs and `manifest-checksum.txt` for `bubblewrap build`.
  3. **TWA Manifest Completeness & MinSdk 24**: Added `"splashScreenFadeOutDuration": 300`, `"minSdkVersion": 24`, `"orientation": "portrait"`, and dark color definitions into `twa-manifest.json`. Added fallback injection in the CI generation script and defensive `sed` substitutions across `app/build.gradle` and `app/src/main/AndroidManifest.xml` ensuring `splashScreenFadeOutDuration: 300,` and `minSdkVersion 24` are guaranteed.
  4. **SDK Compatibility, Build-Tools 36.1.0 & Non-Interactive Licenses**: Added legacy compatibility symlinks in the runner (`tools` and `bin` -> `cmdline-tools/*/bin`), configured automatic fallback symlinks for `build-tools/36.1.0`, accepted all Android SDK licenses non-interactively (`yes | sdkmanager --licenses`), pre-seeded `~/.bubblewrap/config.json`, and added `--skipPwaValidation` to `bubblewrap build`.

### Google OAuth Integration & Android TWA Digital Asset Links Setup (ADR 017)
- **Date**: 2026-10-12
- **Resolution Date**: 2026-10-12
- **Description**: Users required Google Sign-In alongside existing Email/User ID/Password authentication, and mobile app distribution via Android APK without heavy native dependencies or dual-identity conflicts from Firebase. Additionally, static prerendering failed when Supabase environment variables were absent.
- **Fix**:
  1. Integrated native Supabase Google OAuth via reusable `GoogleSignInButton` in `src/components/auth/google-sign-in-button.tsx`, allowing Google accounts to link seamlessly to existing email accounts in `auth.users` and `people`.
  2. Implemented Web Manifest (`src/app/manifest.ts`), standalone icons (`public/icons/icon-192.png`, `public/icons/icon-512.png`), and Digital Asset Links (`public/.well-known/assetlinks.json`).
  3. Created `.github/workflows/build-apk.yml` and `twa-manifest.json` for automated Google Bubblewrap TWA APK packaging via GitHub Actions.
  4. Added build-safe fallbacks in `src/utils/supabase/server.ts` and `src/utils/supabase/client.ts` for clean static prerendering.

---

### Database RPC String Alignment, View Security, Constraints & Auth Error Localization (ADR 016, KI-007, KI-010, KI-011, KI-016)
- **Date**: 2026-09-20
- **Resolution Date**: 2026-09-20
- **Description**:
  1. `get_or_create_report` seeded `'সহযোগী হয়েছে'` (missing 'ন') and `'সূধী'` (long ূ), causing silent 0-row update failures on those categories (`KI-007`).
  2. Consolidation views lacked `security_invoker = true`, allowing anon requests to query city metrics without invoking table RLS (`KI-010`).
  3. Metric numeric columns lacked database `CHECK` constraints, leaving storage vulnerable to malformed or negative data (`KI-011`).
  4. Raw English Supabase errors (`Email not confirmed`, `User already registered`, rate limits) leaked to users via redirect query parameters (`KI-016`).
- **Fix**:
  1. Updated PostgreSQL RPC `get_or_create_report` with canonical category strings `'সহযোগী হয়েছেন'` and `'সুধী'`. Migrated existing test records in-place (`UPDATE report_organizational ...`) per Option A.
  2. Executed `ALTER VIEW ... SET (security_invoker = true)` across all 7 consolidation views (`view_city_*`).
  3. Added `CHECK (col >= 0)` constraints to all numeric metrics across `report_header`, `report_course`, `report_organizational`, `report_personal`, `report_meeting`, and `report_extra`. Revoked dangerous `TRUNCATE`, `REFERENCES`, `TRIGGER` privileges from `anon`.
  4. Created `translateAuthError()` in `src/lib/i18n.ts` and wrapped all auth server action redirects (`login`, `register`, `forgotPassword`, `updatePassword`). Added an upfront verification guidance banner to `RegisterFormClient`. Added root `loading.tsx` and `error.tsx` App Router boundaries.

---


### Save Reliability, Bengali Numeral Normalization, Password Confirmation & Timezone Parity (ADR 015, KI-008, KI-009, KI-013, KI-014, KI-015)
- **Date**: 2026-09-20
- **Resolution Date**: 2026-09-20
- **Description**: 
  1. `updateField` silently hid save errors and 0-row updates, leaving a stale "সংরক্ষিত HH:MM" timestamp that misled users into believing unsaved data had synced (`KI-008`).
  2. Auto-save only executed on input blur, dropping unblurred inputs if users closed tabs or switched apps (`KI-009`).
  3. Registration had only a single password field, creating silent typo lockouts (`KI-013`).
  4. HTML `type="number"` inputs rejected Bengali Unicode numerals (০-৯) from Android keyboards (`KI-014`).
  5. UTC server time on Vercel triggered a false "future period" block for the first 6 hours of the 1st of each month in Bangladesh (`KI-015`).
- **Fix**:
  1. Updated `ReportContext` in `src/components/report/report-context.tsx` to add `saveError` state and `clearSaveError()`. Appended `.select('id')` to all `.update()` calls to detect 0-row updates as errors. Updated `AutoSaveIndicator` to display a 4-state indicator prioritizing error alerts ("সংরক্ষণ ব্যর্থ হয়েছে — আবার চেষ্টা করুন") with retry action.
  2. Implemented `visibilitychange` (for mobile app switching) and `beforeunload` (for desktop closing) event listeners inside `AutoSaveField` (`src/components/report/auto-save-field.tsx`) to flush dirty unblurred keystrokes to the database via `persist()`.
  3. Replaced `type="number"` with `type="text" inputMode="numeric" pattern="[০-৯0-9]*"` across `AutoSaveField` and added `bnToEn()` normalizer converting Bengali digits (০-৯) to standard ASCII integers before DB transmission.
  4. Added `confirmPassword` input to `src/components/auth/register-form-client.tsx` with server-side validation in `src/app/home/actions.ts` returning `'পাসওয়ার্ড মিলছে না।'`.
  5. Introduced `getDhakaDate()` helper using `Intl.DateTimeFormat` with `timeZone: 'Asia/Dhaka'` in `user-dashboard.tsx` and `period-selector.tsx`, ensuring period validation aligns with Bangladesh local time (UTC+6).

---

### Mathematical Aggregation Parity, Weighted Averages & Zero Dead-Weight Cleanup (ADR 014, KI-005, KI-006, KI-012)
- **Date**: 2026-09-14
- **Resolution Date**: 2026-09-14
- **Description**: 
  1. `sumHeaderRows()` was summing all numeric columns across multi-month spans, causing inventory stock counts (`total_muallima`, `total_unit`, `certified_muallima`, etc.) to multiply incorrectly across periods (`KI-005`).
  2. `sumRows()` was arithmetically adding average meeting attendance figures (`*_avg_attendance`) across periods instead of calculating weighted means (`KI-006`).
  3. `package.json` contained unimported dependencies `zod`, `react-hook-form`, and `@hookform/resolvers` (`KI-012`).
  4. Core math utilities lacked automated test coverage.
- **Fix**:
  1. Updated `sumHeaderRows()` in `src/lib/report-utils.ts` to separate snapshot inventory keys from delta flow keys (`muallima_increase`/`decrease`). Delta keys are summed across all months, while snapshot keys adopt the latest month's value (`latestRow[k]`).
  2. Updated `sumRows()` in `src/lib/report-utils.ts` to pair `city_avg_attendance`, `thana_avg_attendance`, and `ward_avg_attendance` with their respective count keys and compute true weighted averages: $\text{Math.round}(\sum (\text{count} \times \text{avg}) / \sum \text{count})$.
  3. Pruned unused dependencies via `npm uninstall zod react-hook-form @hookform/resolvers`.
  4. Updated `tsconfig.json` compiler target to `es2022` and enabled `allowImportingTsExtensions`.
  5. Created `src/lib/report-utils.test.ts` and registered `"test"` script in `package.json`, passing 10/10 automated tests.

---

### Admin Route Grouping (`(admin)`), Submission Lock (`is_submitted`), & Full-Field City Parity (ADR 012)
- **Date**: 2026-07-17
- **Resolution Date**: 2026-07-17
- **Description**: The admin area previously suffered from 7 fragmented legacy `/admin/*` routes with duplication and nav collisions. Furthermore, the dashboard Current Month Report Condition panel counted draft reports as completed without a formal submission mechanism (`is_submitted`), and `/city-report` only allowed numeric overrides without support for qualitative remarks (`city_comment`) or a clean View/Edit mode switcher.
- **Fix**: Migrated all admin pages (`/dashboard`, `/reports`, `/city-report`, `/management`) into `src/app/(admin)/*` (`(admin)` route group), completely eliminating the `/admin/` URL prefix per zero backward compatibility. Added `is_submitted (BOOLEAN DEFAULT false)` to `public.report` and added the **"রিপোর্ট জমা সম্পন্ন হয়েছে (Report Submission Done)"** checkbox (`CommentsForm`) to authoritative lock and track completion on the dashboard. Upgraded `CorrectionButton` with `isText={true}` `<textarea>` support to store string overrides in `city_report_override`, added Section 5 (**৫. মন্তব্য ও বিশেষ পর্যালোচনা / Comments**) to `CityReportPage`, and added the **`[ 👁️ ভিউ মোড / ⚡ এডিট মোড ]`** toggle to cleanly switch between inspecting and editing.

### WEB-006 & Accidental DCS Zone Report in DB (`report.id = 36`, ADR 009)
- **Date**: 2026-07-16
- **Resolution Date**: 2026-07-17
- **Description**: `src/app/report/[section]/page.tsx` had no role check, allowing superadmins to visit `/report/header?type=monthly&month=7&year=2026` and accidentally create a DCS zone report (`id=36`).
- **Fix**: Enforced `SectionSwitcher` role guard (`if (role === 'admin' || role === 'superadmin') router.replace('/dashboard')`). Excluded DCS across city aggregation views pragmatically using a hardcoded `WHERE r.zone_id != 1` exclusion, as the full `zone_type = 'city'` ADR-009 schema migration remains deferred for user adoption reasons.

### Save Override Failure (`42P10`) & Edit Report Display Enhancements (ADR 010)
- **Date**: 2026-07-17
- **Resolution Date**: 2026-07-17
- **Description**: Admins could not save city-level override corrections in `/admin/city-report`; PostgREST threw `42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification`. The `city_report_override` table lacked a unique constraint matching `(year, month, report_type, section, field, category)`. Additionally, the page had a friction-causing override toggle button, and overridden cells only displayed the new value (`value`) without revealing what the original aggregated zone total (`computedValue`) was prior to override.
- **Fix**: Added Postgres constraint `ALTER TABLE public.city_report_override ADD CONSTRAINT city_report_override_unique_key UNIQUE NULLS NOT DISTINCT (year, month, report_type, section, field, category)` via Supabase. Updated `CorrectionButton.tsx` to use check-then-update/insert logic backed by matching composite `onConflict` keys, and added a `Trash2` ("মুছুন") button to revert overrides. Renamed `/admin/city-report` title and nav items to **এডিট রিপোর্ট** (`Edit Report` / `এডিট`) with override mode enabled permanently (`isEditing = true` + `⚡ ওভাররাইড মোড সক্রিয়` badge). Updated `NumericCell` to render comparative dual values `[ <s>computedValue</s> newValue ]` inside the amber badge whenever `isOverridden` is true.

### Authoritative Labeling Drift, Table Mode Structure & PDF Page Overflow (ADR 007)
- **Date**: 2026-07-13
- **Resolution Date**: 2026-07-13
- **Description**: Minor terminology drift existed between application UI/PDF outputs and original Bengali spreadsheet templates (`docs/Talimul_Report_2026`). Furthermore, `courses-form.tsx`, `organizational-form.tsx`, `personal-form.tsx`, and `meetings-form.tsx` table entry modes lacked structural parity with `/report` view tables (generic `ক্যাটাগরি` headings, un-transposed columns, un-split combined categories, unbounded column widths), and PDF export tables frequently overflowed onto an unwanted 3rd sheet without visual color parity.
- **Fix**: Synchronized all labels (`দায়িত্বশীলার নাম`, `সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা`, `ইউনিট সংখ্যা`, `কতজন নিয়ে সমাপ্ত`, `সহীহ শিখেছেন কতজন`, `সহযোগী হয়েছেন`) with dual-string fallback lookups (`find(r => r.category === cat || r.category === 'সহযোগী হয়েছে')`). Split the `জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)` category into dedicated `: কতটি` and `: কতজন` rows with fallback lookups. Split `Committee Orientation / Muallima Orientation` into two separate individual rows (`Committee Orientation` and `Muallima Orientation`), and engineered dedicated `meeting_name (varchar(255))` custom title storage on the `অন্যান্য` row (`updateField('meeting_name', customName, 'meeting', 'report_meeting', 'অন্যান্য')`) with dynamic word replacement (`cat === "অন্যান্য" && customTitle ? customTitle : cat`). Standardized exact domain top-left headings (`বিভাগ/ধরন`, `দাওয়াত ও সংগঠন`, `ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন`, `বৈঠকসমূহ`) and bounded sticky left column widths (`w-48` / `w-52`) across all entry forms. Implemented two-layered table headers (`গ্রুপ / কোর্স` & `শিক্ষার্থী অবস্থান`) in `CoursesForm` table mode and transposed row-based metrics (`PERSONAL_METRICS_ROWS`) in `PersonalForm` table mode. Engineered strict 2-Page Landscape A4 PDF budgeting (`ReportPDFDocument`) placing Section 0, Section 1, Section 3, and Maktab summary on Page 1, and Section 2, Section 4, Safar summary, and Section 5 on Page 2, guaranteeing double-sided single-sheet printing without overflow.

---

### Overview Report (`/report`) Header Placeholder Flicker (`জমাকৃত রিপোর্ট দেখার প্যানেল`)
- **Date**: 2026-07-13
- **Resolution Date**: 2026-07-13
- **Description**: `src/app/report/page.tsx` previously used a static ternary fallback (`: "জমাকৃত রিপোর্ট দেখার প্যানেল"`) whenever `reportInfo` evaluated to `null`. This caused the header to briefly flash "Submitted Report Viewing Panel" during initial page mount while `loadReport()` queried the database, or persistently whenever viewing an empty (`!reportInfo`) period.
- **Fix**: Replaced static fallback with instant dynamic header resolution (`activeZoneName — activeReportTypeBn রিপোর্ট — displayPeriodLabel`). The page now resolves the active zone (`userZoneName` / `zones` lookup) and period label (`searchParams`) immediately upon mount, ensuring accurate title context across loading and empty states without placeholder text.

---

### Section Links Visible Before Period Selection + RPC 400 Null Year Error (ADR 006)
- **Date**: 2026-07-13
- **Resolution Date**: 2026-07-13
- **Description**: Four interrelated bugs caused by the ADR 005 Hybrid State Persistence system:
  1. Section grid rendered with `type=null&month=null&year=null` links before period was selected.
  2. `parseInt("null") = NaN` bypassed null-guard and reached the RPC → DB NOT NULL constraint violation (400 error).
  3. `sessionStorage` restoration loop had no escape — clearing URL params immediately redirected back to last stored period.
  4. `bottom-nav.tsx`/`navbar.tsx` Report link went to `/report` (no page exists there).
- **Fix**: Removed sessionStorage restoration loop. URL params are sole source of truth (ADR 006). Added `isValidParam()` guard rejecting string `"null"`. Section grid only renders when `hasParams && !isLoading && !error`. All nav links carry period params forward. Report tab now links to `/${periodQuery}` (home dashboard). Help links carry `periodQuery` string for round-trip preservation.

---

### Report Pages Supabase Client Memoization Gap
- **Date**: 2026-07-13
- **Resolution Date**: 2026-07-13
- **Description**: `src/app/report/[section]/page.tsx` created the browser client inside the effect flow without memoization.
- **Fix**: `SectionSwitcher` now uses `useMemo(() => createClient(), [])` at component level, matching the established pattern.

---

### Unauthenticated Protected Route Access Rendering Error Text (`ব্যবহারকারী চিহ্নিত করা যায়নি।`) & Fragmented Auth Entry (ADR 008)
- **Date**: 2026-07-14
- **Resolution Date**: 2026-07-14
- **Description**: When opening direct protected URLs such as `/report/personal?type=monthly&month=7&year=2026` without an active login session, client components set a local error state (`setError("ব্যবহারকারী চিহ্নিত করা যায়নি।")`) instead of redirecting the user to authenticate. Additionally, separate `/login` and `/register` routes fragmented onboarding and created redundant top-level navigation, while prominent theme/language toggles cluttered header dropdowns and absolute form input icons overlapped placeholder text on smaller viewports.
- **Fix**: Consolidated `/login` and `/register` into a single dynamic portal page at `/home` (`AuthPortalClient`). Replaced the side-by-side 50-50 layout on `/home` with a vertical scrolling layout containing hero headings, a focused auth card (without top segmented tabs, using bottom toggle links (`অ্যাকাউন্ট নেই? নিবন্ধন করুন` / `অ্যাকাউন্ট আছে? লগ-ইন করুন`)), and rich platform feature cards right below. Added `!pl-12 !pr-4` to all form inputs with absolute icons to eliminate overlap with placeholders. Updated `middleware.ts` and client guards (`/report/[section]/page.tsx`, `UserDashboard`) to uniformly redirect unauthenticated visitors to `/home`. Finally, encapsulated prominent theme and language toggles inside `<details>` accordions (`UserDropdown`, `BottomNav`) and inline expanded footer items (`AppearanceFooterToggle`).

---

### Unstable Client-Side Supabase Instantiation (`ReportProvider`)

- **Date**: 2026-06-25
- **Resolution Date**: 2026-06-25
- **Description**: `ReportProvider` instantiated `createClient()` directly inside the render body without `useMemo()`.
- **Fix**: Wrapped browser client creation in `useMemo(() => createClient(), [])` inside `report-context.tsx`.

---

### Secondary UI Components Unmemoized Supabase Client Instantiation
- **Date**: 2026-06-26
- **Resolution Date**: 2026-07-13
- **Description**: `admin-dashboard.tsx`, `bottom-nav.tsx`, `user-dropdown.tsx`, and `correction-button.tsx` were previously tracked as creating browser clients in unstable render paths.
- **Fix**: These components now use memoized browser client creation via `useMemo(() => createClient(), [])`; issue closed and replaced by remaining report-page consistency gap.

---

### Unmemoized State Mutators (`updateField`)
- **Date**: 2026-06-25
- **Resolution Date**: 2026-06-25
- **Description**: `updateField` inside `ReportProvider` caused child section re-render cascades.
- **Fix**: Wrapped `updateField` in `useCallback` and memoized context value object.

---

### Period Selector Race Condition on Rapid Click
- **Date**: 2026-06-25
- **Resolution Date**: 2026-06-25
- **Description**: In `user-dashboard.tsx`, rapid period clicking risked out-of-order state updates.
- **Fix**: Added `let ignore = false` cancellation trap inside `useEffect` initialization and cleanup.

---

### `checkEmailAvailability` Does Not Scale Beyond 1000 Users
- **Date**: 2026-06-12
- **Resolution Date**: 2026-06-25
- **Description**: Registration email validation invoked unpaginated `auth.admin.listUsers` HTTP requests.
- **Fix**: Verified database trigger `on_auth_user_created` keeps `public.people` synchronized. Eliminated `listUsers` HTTP call entirely, querying indexed `public.people` (ADR 003).

---

### Massive Client-Side Fallback for Report Creation
- **Date**: 2026-06-22
- **Description**: The system originally used a massive ~200-line client-side fallback in `user-dashboard.tsx` and `page.tsx` to insert seed rows into 7 child tables simultaneously when a new report was created.
- **Fix**: Replaced with atomic Postgres RPC function (`get_or_create_report`).

---

### Mobile Table Overflow & Inline Stats Visual Clutter (`page.tsx`)
- **Date**: 2026-07-12
- **Resolution Date**: 2026-07-12
- **Description**: Report tables originally forced unconstrained horizontal scrolling or squished multi-column cells across small mobile screens (`< 360px`), while inline Maktab and Safar stats blocks utilized prominent background colors (`bg-purple-500/5` / `bg-cyan-500/5`) that created double-box visual clutter below data tables.
- **Fix**: Implemented situation-based minimum-width thresholds (`table-fixed w-full min-w-[500px]` / `min-w-[520px]`) and proportional percentage column widths (`34% : 17% : 17% : 16% : 16%`, etc.) so the first 3 columns remain visible without scrolling on standard mobile portrait viewports (ADR 004). Replaced inline stats colored container backgrounds with clean, transparent border framing (`p-4 rounded-xl border border-border` & `px-3 py-2 rounded-lg border border-border/70`) while restoring normal `font-black text-sm sm:text-base` metric counts and a responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5` mobile layout.

---

### Form View Toggle Clutter & Nested Boxiness in Form Cards (`SectionLayout`, `CoursesForm`)
- **Date**: 2026-07-12
- **Resolution Date**: 2026-07-13
- **Description**: The `Form / Table` (`ভিউ`) toggle previously rendered as a large full-width bar inside form bodies, while complex forms (`courses-form.tsx`, `meetings-form.tsx`, `personal-form.tsx`, `report-header-form.tsx`) wrapped sub-sections in their own colored borders (`bg-muted/20 border border-border/40` or `bg-pink-500/5`), creating nested boxiness and vertical scroll fatigue across 8 open cards simultaneously.
- **Fix**: Lifted the layout toggle into the top-right corner of `SectionLayout` (`CompactViewToggle`) via `ViewModeContext` without prop drilling. Replaced inner box borders with flat uppercase section dividers (`border-t`), upgraded input grids to dynamic responsive columns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`), and collapsed all `CoursesForm` cards except the first category (`openCards: { [COURSE_CATEGORIES[0]]: true }`) by default (ADR 005).

---

### Dashboard Query Parameter Loss & Stale Session State (`UserDashboard`, `Navbar`)
- **Date**: 2026-07-12
- **Resolution Date**: 2026-07-13
- **Description**: Navigating from the Dashboard (`/?type=...&month=...&year=...`) to section or global pages (`/report/courses` or `/help`) and clicking "Home" resulted in period query parameter loss. Storing period filters purely in `localStorage` was rejected because it broke multi-tab side-by-side comparison (`Tab A` vs `Tab B`).
- **Fix**: Implemented Hybrid State Persistence (URL query strings as active tab truth + `sessionStorage ("dashboard-period-params")` as fallback memory when returning to `/` with clean URLs). Enforced Clean Session Guarantee via explicit force purging (`sessionStorage.removeItem("dashboard-period-params")`) on `/auth/logout` (`user-dropdown`, `bottom-nav`) and initial `/login` mount (`SessionCleaner`) (ADR 005).

---

### App Router / Turbopack `performance.measure` Negative Timestamp TypeError on `not-found` Redirect
- **Date**: 2026-07-17
- **Resolution Date**: 2026-07-17
- **Description**: When navigating to unmatched URLs or triggering 404 handlers (`src/app/not-found.tsx` and `src/app/[...not-found]/page.tsx`), Next.js client navigation crashed with `Runtime TypeError: Failed to execute 'measure' on 'Performance': 'NotFound' cannot have a negative time stamp.` Because both 404 route components previously executed `redirect("/")` synchronously inside their component render bodies, throwing `NEXT_REDIRECT` mid-render abruptly interrupted the `"NotFound"` route transition and immediately started a replacement navigation to `/`. This caused Next.js's internal performance instrumentation (`markRenderComplete`) to measure render duration (`routeChangeToRender` / `render`) against the newly overwritten navigation start mark (`routeChange`), producing negative `end - start` timestamps.
- **Fix**: Converted both `src/app/not-found.tsx` and `src/app/[...not-found]/page.tsx` to `"use client"` components that return `null` during render (`beforeRender <= afterRender`) and perform a safe client navigation (`useRouter().replace("/")`) inside `useEffect`. This allows React to cleanly commit the 404 route segment and measure performance without negative timestamps before redirecting the browser.

---

### Mobile UX & Performance: AutoSave Wiping, Nav Layout Shift, and City Report Refresh (ADR 013)
- **Date**: 2026-07-19
- **Resolution Date**: 2026-07-19
- **Description**: Three distinct UX friction points existed on mobile/slower networks:
  1. `AutoSaveField` wiped user keystrokes if context sibling updates triggered a re-render before the user finished typing.
  2. `bottom-nav.tsx` caused a jarring layout shift by starting with user tabs and expanding to admin tabs after a slow `supabase.auth.getUser()` DB call completed.
  3. City Report's `CorrectionButton` triggered a hard `window.location.reload()` upon save, ruining the SPA experience and scroll position.
- **Fix**: 
  1. Refactored `AutoSaveField`'s `useEffect` to compare against the *evaluated primitive* value of `getInitialValue`, completely decoupling the local input from upstream render cascades.
  2. Implemented eager evaluation in `bottom-nav.tsx` using `pathname.startsWith(...)` for known admin routes to instantly render admin tabs without waiting for the DB fetch (relying on `middleware.ts` for actual security).
  3. Deprecated the hard reload in `CorrectionButton` and replaced it with `ctx.refreshData()` localized state refresh via React Context.

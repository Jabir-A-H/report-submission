# ADR 015: Sprint 1 — Save Reliability, Field Worker UX, Bengali Normalization & Timezone Parity

## Date
2026-09-20

## Context
Following field testing and behavioral audits for 20-30 non-tech-savvy field workers operating on mobile devices in Bangladesh, five critical data reliability and UX issues were identified:

1. **Silent Auto-Save Failures & Stale Timestamps (KI-008)**:
   `updateField` in `ReportContext` only logged errors to `console.error`. If Supabase failed or if a `.update()` matched 0 rows (e.g. category string mismatch), the UI retained the optimistic edit and showed a green "সংরক্ষিত HH:MM" timestamp, actively deceiving workers into believing unsaved data had synced.
2. **Keystroke Loss on Mobile App Switch / Tab Exit (KI-009)**:
   Auto-saving was triggered solely on input `onBlur`. Field workers switching apps or closing tabs without tapping outside the active input lost their pending keystrokes.
3. **Bengali Numeral Rejection on Mobile Keyboards (KI-014)**:
   HTML `type="number"` inputs rejected Bengali Unicode numerals (`০-৯`) emitted by standard Bengali keyboards on Android. Users were forced to toggle their system keyboard to English to input report metrics.
4. **Silent Registration Typo Lockouts (KI-013)**:
   The registration form featured only a single password input without confirmation, risking unrecoverable account lockouts upon first sign-in attempt.
5. **UTC Server Clock vs. Bangladesh Timezone Boundary Lockout (KI-015)**:
   Next.js and Vercel evaluated `new Date()` in UTC. For the first 6 hours of the 1st of every month (00:00–06:00 BDT = 18:00–24:00 UTC prior day), the server clock lagged in the previous month, triggering a false "future period" error when users attempted to open reports on the morning of the 1st.

## Decision
We implemented comprehensive client-side resilience and input normalization:

1. **4-State Auto-Save Indicator & 0-Row Detection (`ReportContext`, `AutoSaveIndicator`)**:
   - Added `saveError: string | null` and `clearSaveError()` to `ReportContextType`.
   - Appended `.select('id')` to all `.update()` calls. If `updated.length === 0` or network errors occur, `saveError` is set and `lastSaved` is not updated.
   - `AutoSaveIndicator` evaluates states in strict priority order: `isSaving` (pulsing blue) → `saveError` (red text with retry action) → `lastSaved` (green timestamp) → idle indicator.
2. **Exit & Mobile Visibility Flush (`AutoSaveField`)**:
   - Added a `useEffect` registering `document.addEventListener('visibilitychange', ...)` (fires when users switch apps on mobile) and `window.addEventListener('beforeunload', ...)` (fires on desktop tab close).
   - Unsaved local keystrokes are flushed through `persist()` before lifecycle termination.
3. **Bengali Digit Normalization & Mobile Keypad Parity (`AutoSaveField`)**:
   - Replaced `type="number"` with `type="text" inputMode="numeric" pattern="[০-৯0-9]*"`.
   - Introduced `bnToEn(val: string)` converting Unicode Bengali digits (`০-৯`, `0x09E6–0x09EF`) to standard ASCII digits (`0-9`) before writing to Supabase.
4. **Registration Password Confirmation (`RegisterFormClient`, `actions.ts`)**:
   - Added `confirmPassword` input field with matching styling and icon layout.
   - Server-side check in `src/app/home/actions.ts` validates `password === confirmPassword` before contacting Supabase, returning translated Bengali error `'পাসওয়ার্ড মিলছে না।'`.
5. **Asia/Dhaka Timezone Parity (`user-dashboard.tsx`, `period-selector.tsx`)**:
   - Implemented `getDhakaDate()` utilizing `Intl.DateTimeFormat` with `timeZone: 'Asia/Dhaka'`.
   - All period boundary comparisons and default month/year state initializers now anchor to UTC+6.

## Consequences
- **Positive:** Field workers can freely type in Bengali or English numerals without keyboard errors.
- **Positive:** Data loss during app switching or network flakiness is eliminated and visibly surfaced with direct retry options.
- **Positive:** Account creation typos are prevented upfront.
- **Positive:** Users can reliably access new month reports at 12:01 AM BDT on the 1st of every month without UTC lag lockouts.
- **Status:** Accepted and Implemented.

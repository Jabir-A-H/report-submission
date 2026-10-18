# ADR 020: Track 1 Quick Wins, Input Normalization, and Export Standards Parity

- **Status**: Accepted and Implemented
- **Date**: 2026-10-18 (Implemented: 2026-10-19)

## Context

A comprehensive code audit across the application codebase and issue register identified 11 high-leverage issues in Track 1 spanning authentication normalization, Bengali numeral ergonomics, override safeguards, mobile accessibility, and export standard conformance:

1. **Login & Registration Case/Spacing Friction (RS-42, RS-43, RS-66)**:
   - Mobile soft-keyboards automatically capitalize first characters and append trailing whitespace upon autocomplete selection. Because usernames were matched case-sensitively, legitimate users were locked out.
   - PostgREST `.ilike('user_id', ...)` treats `_` as a single-character wildcard; usernames containing underscores risked multi-row collisions (`PGRST116`).
   - Registration allowed selecting Zone 1 (City / DCS entity).
   - Form inputs lacked unique IDs across login and register tabs, triggering password manager autofill clobbering and accessibility warnings.

2. **Phishing & Query String Message Reflection (RS-46, RS-74)**:
   - `/home?message=` rendered untrusted query strings verbatim in the error banner.
   - Successful password resets redirected with a success message that rendered as a red error card.
   - `SessionCleaner` lacked defensive sandbox error handling in strict WebViews.

3. **Silent Password Reset Failure & Rate-Limit Ambiguity (RS-47)**:
   - Untrimmed mixed-case emails failed silently in `resetPasswordForEmail` without feedback, leaving users waiting indefinitely without knowledge of Supabase Auth's 2 emails/hr rate limit.

4. **Bengali Numeral Flipping, Focus Clobbering & Data Corruption (RS-02, RS-30, RS-31, RS-32)**:
   - In `AutoSaveField`, `getInitialValue` lacked `language` dependency and active focus tracking, causing background context syncs to overwrite active keystrokes and flip typed Bengali digits to ASCII.
   - Naive regex digit-stripping (`/[^\d]/g`) stripped decimal points (`.`), corrupting `12.5` into `125` (10x inflation) and `2,500.00` into `250000` (100x financial inflation!).
   - In `city-report/page.tsx`, `Number(ov)` on Bengali numeral overrides evaluated to `NaN`, rendering broken `"NaN"` badges in the table.
   - In `CorrectionButton`, numeric inputs used `type="number"`, rejecting Bengali numerals and lacking empty value guards.

5. **Accessibility Pinch-Zoom & Export Filename Encoding (RS-61, RS-64)**:
   - `layout.tsx` disabled mobile pinch-to-zoom (`userScalable: false`), violating WCAG 1.4.4.
   - Export endpoints (`/api/export/pdf` and `/api/export/excel`) used raw `filename="${encodeURIComponent(filename)}"`, which caused browsers to download raw percent-encoded files. Single quotes (`'`) remained unescaped by `encodeURIComponent`, breaking RFC 5987 delimiters.

---

## Decision

### 1. Authentication & Session Hardening (RS-42, RS-43, RS-46, RS-47, RS-66, RS-74)
- **Login Normalization**: Immediate trim of `email` / `user_id`. For usernames, attempt exact `.eq('user_id', ...)` first, falling back to wildcard-escaped `.ilike('user_id', escaped).limit(1)`.
- **Registration Safeguards**: Enforce lowercase `userId` and `email`. Validate server-side that `targetZone.id !== 1 && targetZone.zone_type !== 'city'`.
- **Form Accessibility & DOM ID Prefixing**: Assigned unique IDs: `login-email`, `login-password` vs `register-name`, `register-user-id`, `register-email`, `register-password`, `register-confirm-password`, `register-zone-id`, complete with mobile `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}`, and exact `autoComplete` tokens.
- **Message Sanitizer & Success Alert Styling**: Introduced `sanitizeAuthMessage()` in `src/lib/i18n.ts` with a whitelist of legitimate system messages. Unrecognized strings return `null` (rendering no banner). Added emerald-green alert styling for successful password updates (`isSuccess: true`).
- **Defensive SessionCleaner**: Retained `SessionCleaner` on `/home` per `AGENTS.md` Rule 2 and `TECHNICAL_MANUAL.md` §5.5, wrapped in `try...catch` to prevent sandbox WebViews from throwing.
- **Password Reset Guidance**: Normalized email to trimmed lowercase. Added explicit Bengali subtext regarding registered email requirement and 2 emails/hr rate-limit copy.

### 2. Bengali Numeral Ergonomics & Anti-Corruption Parsing (RS-02, RS-30, RS-31, RS-32)
- **Shared Numeral Utility**: Exported `bnToEn(val)` from `src/lib/report-utils.ts` and added unit test coverage in `src/lib/report-utils.test.ts`.
- **Anti-Corruption Integer Parsing (RS-32)**: Replaced destructive regex digit stripping with float parsing and rounding:
  ```ts
  const cleaned = String(localValue).replace(/[,\s]/g, "");
  const enStr = bnToEn(cleaned);
  const parsed = parseFloat(enStr);
  const valueToSave = isNaN(parsed) ? "0" : String(Math.max(0, Math.round(parsed)));
  ```
- **Focus Tracking & Language Reactivity (RS-30)**:
  - Added `language` to `getInitialValue` dependencies, formatting numeric values to `toBn(raw)` in Bengali mode and `bnToEn(raw)` in English mode.
  - Tracked `isFocused` state: external context updates only sync to `localValue` when the field is not actively focused.
  - Pruned inert `pattern="[০-৯0-9]*"` attribute.
  - Localized `tableMode` placeholder (`language === "bn" ? "০" : "0"`).
- **Admin Override Normalization & Empty Guards (RS-02, RS-31)**:
  - In `city-report/page.tsx:305`, normalized override values via `Number(bnToEn(String(ov)))`, falling back to `0` if `isNaN`.
  - In `CorrectionButton`, switched numeric input to `type="text" inputMode="numeric"`. Initialized modal with `toBn(currentValue)`.
  - In `handleSave`, blocked empty text overrides when already overridden (prompting use of the “মুছুন” button) and validated `num >= 0` for numeric overrides.

### 3. Mobile Accessibility & RFC 6266 Export Standards (RS-61, RS-64)
- **WCAG 1.4.4 Compliance**: Removed `maximumScale: 1, userScalable: false` from `viewport` in `src/app/layout.tsx`. iOS Safari auto-zoom on focus remains blocked via `font-size: 16px !important` in `globals.css`.
- **RFC 6266 & RFC 5987 Header Conformance**: In `/api/export/pdf` and `/api/export/excel`:
  ```ts
  const encodedFilename = encodeURIComponent(filename).replace(
    /['()!*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "").trim() || fallbackName;

  headers.set(
    "Content-Disposition",
    `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`
  );
  ```

---

## Consequences

### Positive
- **Zero-DDL Compliance**: All 11 issues resolved entirely within application code and client components without database schema mutations.
- **Data Integrity Preserved**: Eliminates catastrophic decimal-stripping data inflation (RS-32) and PostgreSQL `CHECK col >= 0` violations.
- **Ergonomic Field Work**: Mobile reporters typing with Bengali keyboards experience seamless input without cursor jumps, numeral flipping, or case-sensitive lockouts.
- **Cross-Platform File Downloads**: PDF and Excel exports download with proper localized Bengali filenames across Windows, macOS, Android, and iOS browsers.
- **Accessibility Standard Met**: Full compliance with WCAG 1.4.4 zoom guidelines.

### Verification
- **Unit Tests**: 17/17 passing (`npm test`).
- **TypeScript**: 0 errors (`npx tsc --noEmit`).
- **Linting**: 0 errors / 0 warnings (`npm run lint`).
- **Production Build**: 18/18 routes compiled cleanly with exit code 0 (`npm run build`).

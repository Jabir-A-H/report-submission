# ADR 029: Track 3 Auth Security, Middleware Cookie Forwarding, and Server Actions Migration

**Date**: 2026-11-16  
**Status**: Accepted and Implemented  
**Deciders**: System Owner & Antigravity  
**Consulted**: `docs/issues-critique/SUMMARY.md`, `AGENTS.md` (Rules 2 & 6: Multi-Option Planning & Adversarial Doubt Gate; Rule 7: Pre-Production Agility)

---

## 1. Context and Problem Statement

Following the completion of Track 1 (Database DDL & Storage Hygiene) and Track 2 (Core Save Machine & Numeral Normalization), **Track 3** addresses critical vulnerabilities across the authentication pipeline, session token persistence, mobile network resilience, and administrative server actions:

1. **Middleware Cookie Dropping on Redirects (`RS-48`)**:
   - In [`middleware.ts`](file:///d:/WebDev/report-submission/middleware.ts), `@supabase/ssr` `setAll` attached refreshed session tokens to `supabaseResponse.cookies`.
   - All subsequent calls to `NextResponse.redirect(url)` or `NextResponse.json()` instantiated fresh, detached response objects, discarding `supabaseResponse`.
   - Rotated session tokens and cookie deletion directives were silently dropped. Browsers presented stale tokens, triggering Supabase Refresh Token Family Revocation and causing unexpected logouts and redirect loops on mobile.

2. **Carrier-Grade NAT (CGNAT) Field Worker Lockout (`RS-44 / KI-023`)**:
   - In [`src/app/home/actions.ts`](file:///d:/WebDev/report-submission/src/app/home/actions.ts), on-blur availability checks (`checkEmailAvailability`, `checkUserIdAvailability`) enforced a strict 10 req/min ceiling keyed solely by `clientIp`.
   - In Bangladesh, mobile operators (Grameenphone, Banglalink, Robi) assign private RFC 6598 addresses (`100.64.0.0/10`), pooling entire districts behind a single public IPv4 gateway.
   - When the rate limit tripped, the action returned `{ available: false }`. The client form interpreted this as `status = 'taken'` and set `hasBlockingError = true`.
   - The form submission handler executed `if (hasBlockingError) return`, **silently refusing to register legitimate field workers** with completely unique credentials.
   - Meanwhile, `login()` had zero rate limiting, creating an asymmetric vulnerability to credential stuffing.

3. **Login Input Normalization & Prototype Shim Purge (`RS-42`)**:
   - In `login()`, inputs containing `@` were never lowercased, causing auth misses when mobile keyboards capitalized the first character (`User@example.com`).
   - Copy-pasting credentials from messaging apps (WhatsApp, Facebook Messenger) introduced hidden zero-width characters (`\u200B-\u200D\uFEFF`) and non-breaking spaces (`\u00A0`), which standard `.trim()` failed to clean.
   - User ID lookups executed an initial exact `.eq()` query followed by a fallback `.ilike()` query, forcing sequential table scans.
   - Non-existent user IDs fell back to `${userId}@report.local`—an obsolete prototype shim violating `AGENTS.md` Rule 7.

4. **Open URL Parameter Phishing Reflection (`RS-46`)**:
   - In [`src/app/forgot-password/page.tsx`](file:///d:/WebDev/report-submission/src/app/forgot-password/page.tsx) and [`src/app/update-password/page.tsx`](file:///d:/WebDev/report-submission/src/app/update-password/page.tsx), `resolvedParams?.message` was rendered directly into the red error alert block without sanitization.
   - Attackers could craft links reflecting arbitrary phishing text inside the official application's alert cards.

5. **Direct Client PostgREST Mutations & Dead Shims (`RS-45`)**:
   - In [`src/app/(admin)/management/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx), `addZone` and `deleteZone` executed direct client PostgREST calls (`supabase.from("zone")`).
   - `addZone` contained an obsolete `42703` column fallback shim for missing `zone_type`/`parent_id` columns, which have been permanently active in PostgreSQL since ADR 009.
   - `deleteZone` checked user/report counts against stale client state, lacked child-zone hierarchy verification, and had zero check guarding Central City Zone 1 (DCS).

---

## 2. Decision Outcomes Matrix

| Problem Area | Chosen Architecture | Rejected Alternatives | Architectural Rationale & Implementation Details |
|:---|:---|:---|:---|
| **1. Middleware Cookie Loss** | **Centralized `redirectWithCookies` & `jsonWithCookies` Helpers** | Decoupled `updateSession` Module (Option B); Raw String Header Splicing (Option C) | Implemented `redirectWithCookies` and `jsonWithCookies` in [`middleware.ts`](file:///d:/WebDev/report-submission/middleware.ts), iterating through `sourceResponse.cookies.getAll()` and copying all attributes (`name`, `value`, `path`, `domain`, `maxAge`, `httpOnly`, `secure`, `sameSite`). Routed all 5 redirect and API error exits through these helpers, ensuring 100% token preservation. |
| **2. CGNAT Lockout & Availability UX** | **Decoupled Throttle State (`status: 'unverified'`), Fail-Open UX & Elevated 60 req/min Ceiling** | Compound Key Limiter Only (Option B); Pure Form Submit without Blur Checks (Option C) | Elevated ceiling to 60 req/min. On rate-limit breach, returns `{ available: true, rateLimited: true, message: 'যাচাই সীমা অতিক্রান্ত...' }`. Added `'unverified'` to `FieldStatus` in [`register-form-client.tsx`](file:///d:/WebDev/report-submission/src/components/auth/register-form-client.tsx) with amber info badge and neutral border. Excluded `'unverified'` from `hasBlockingError`, allowing users to proceed to PostgreSQL's atomic unique checks. Added account-level brute-force defense to `login()`. |
| **3. Login Normalization & Prototype Purge** | **In-Memory Unicode Sanitizer (`normalizeAuthIdentifier`) + Dummy Auth Sink** | Dual-Branch `ilike` Query (Option B); Database Stored Procedure (Option C) | Created `src/lib/auth-utils.ts`: strips zero-width spaces (`[\u200B-\u200D\uFEFF]`), normalizes non-breaking spaces, trims, and lowercases. Direct B-tree query on `people(user_id)` resolves email in 1 round-trip. Purged obsolete `@report.local` shim, replacing it with a constant dummy sink `unregistered-auth-sink@report.internal` to prevent timing-based user enumeration. |
| **4. Open URL Parameter Phishing** | **Universal `sanitizeAuthMessage` Whitelist Filter** | Discrete ASCII Error Codes Enum (Option B); React `useActionState` Client Forms (Option C) | Imported `sanitizeAuthMessage` from `@/lib/i18n` in both `forgot-password/page.tsx` and `update-password/page.tsx`. Only renders error alert cards when `authMessage?.message && !authMessage?.isSuccess` is non-null. Unrecognized or malicious URL query strings resolve to `null`, completely neutralizing parameter reflection. |
| **5. Zone Management Server Actions** | **Audited Server Actions (`createZoneAction`, `deleteZoneAction`) with Live Parallel Dependency Checks & DCS Guard** | PostgreSQL RPC Functions (Option B); Client PostgREST with Triggers (Option C) | Created `createZoneAction` and `deleteZoneAction` in [`src/app/(admin)/management/actions.ts`](file:///d:/WebDev/report-submission/src/app/(admin)/management/actions.ts) with admin/superadmin caller validation via server client. Unconditionally blocked deletion of Zone 1 (`DCS`). Executed live parallel `head: true` counts (`people`, `report`, child `zone`) before deletion. Purged dead `42703` shim from `management/page.tsx`. |

---

## 3. Verification and Quality Gates

All four mandatory pre-flight quality verification gates passed cleanly with zero errors:
1. **TypeScript**: `npx tsc --noEmit` $\rightarrow$ 0 errors.
2. **Linting**: `npm run lint` $\rightarrow$ 0 errors, 0 warnings.
3. **Unit & Integration Tests**: `npm test` $\rightarrow$ 70/70 tests passing across 22 suites (added 12 tests in `src/lib/auth-utils.test.ts` covering Unicode zero-width stripping, availability response contracts, and phishing message sanitization).
4. **Production Build**: `npm run build` $\rightarrow$ Clean exit code 0, Turbopack compiled successfully, all 20 static/dynamic routes validated.

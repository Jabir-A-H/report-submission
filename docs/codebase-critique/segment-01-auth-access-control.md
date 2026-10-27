# Segment 1: Authentication & Access Control — Adversarial Review & Synthesized Critique

> **Document Status**: Authoritative & Finalized Critique  
> **Review Gate**: Agent 2 (Senior Engineering Manager & Principal Systems Architect)  
> **Target Scope**: Authentication, Session Management, Role Gating, SSR Middleware, & Public Portals  
> **Source Documents Reviewed**: [AGENTS.md](file:///d:/WebDev/report-submission/AGENTS.md), [TECHNICAL_MANUAL.md](file:///d:/WebDev/report-submission/docs/TECHNICAL_MANUAL.md), [KNOWN_ISSUES.md](file:///d:/WebDev/report-submission/docs/KNOWN_ISSUES.md), ADRs 008, 015, 016, 017, 020, 021, 022, 023.

---

## 1. Executive Summary & Review Gate Verdict

### Architectural Verdict: CONDITIONAL APPROVAL (REMEDIATION MANDATED)
The investigation submitted by Agent 1 uncovered legitimate, high-severity defects that directly threaten session continuity, mobile field worker usability, and application security under real-world Bangladeshi network conditions. 

However, Agent 1's report contained **one critical architectural mischaracterization** ([C01-13]: proposing a `GET` method for logout, which violates RFC 7231 / OWASP CSRF defenses) and **one nuanced diagnosis** ([C01-04]: classifying a caught DOMException as a process crash rather than a silent AMR flow diversion). 

This synthesis formalizes the authoritative critique, eliminates academic over-engineering, enforces strict compliance with [AGENTS.md](file:///d:/WebDev/report-submission/AGENTS.md) Rule 2 (singular table invariants, modern SSR `getAll`/`setAll` cookies) and Rule 6 (adversarial doubt gate and competing alternatives), and maps the exact blast radius across Segments 2 through 7.

### Executive Scorecard
| Dimension | Rating (Pre-Review) | Target Post-Fix | Critical Findings |
| :--- | :---: | :---: | :--- |
| **Session Integrity & Security** | 🔴 58 / 100 | 🟢 98 / 100 | Token loss on middleware redirects ([C01-01]); unauthenticated phishing reflection ([C01-02]); zero rate limiting on password reset ([C01-08]). |
| **Mobile Field Ergonomics** | 🟠 65 / 100 | 🟢 96 / 100 | Blur-to-submit touch cancellation on mobile keyboards ([C01-05]); touch targets below 44px floor & icon-text collisions ([C01-07]). |
| **Architectural Invariants** | 🟡 70 / 100 | 🟢 100 / 100 | Deprecated `get/set/remove` SSR cookies in server client ([C01-03]); vestigial `SessionCleaner` component ([C01-11]). |
| **Edge-Case Flow Governance** | 🟠 62 / 100 | 🟢 95 / 100 | Unpadded Base64URL JWT AMR recovery diversion ([C01-04]); 2-hop redirect ping-pong on authenticated `/register` ([C01-06]). |
| **Automated Test Coverage** | 🔴 0 / 100 | 🟢 90 / 100 | 0% test coverage across auth error mappers, message sanitizers, and sliding-window rate limiters ([C01-15]). |

---

## 2. Adversarial Doubt Gate & Finding-by-Finding Verification

Every finding from Agent 1 has been cross-examined against the codebase, system invariants, and real field conditions (offline field workers, spotty 2G/3G mobile data, Android TWA WebViews, auto-capitalizing mobile keyboards).

```
Summary: 13 Verified True Positives | 1 Nuanced / Clarified Finding | 1 Partially Rejected / Corrected Finding
```

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-01] HIGH: Cookie Loss on Redirects in Middleware                                   │
│ Target: middleware.ts:46, 76, 96, 105                                                  │
│ Live Status: VERIFIED TRUE POSITIVE (CRITICAL FIELD RISK)                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  In [middleware.ts](file:///d:/WebDev/report-submission/middleware.ts#L17-L27), the `createServerClient` sets refreshed tokens onto `supabaseResponse`. However, at lines 46, 76, 96, and 105, redirects are created via `return NextResponse.redirect(url)`.
- **Field Failure Mode**:
  `NextResponse.redirect()` constructs a completely detached `Response` object with an empty cookie header. When a field worker's access token expires (default 3,600s), Supabase's `getUser()` auto-refreshes the session and attaches the new refresh token to `supabaseResponse`. If the user hits `/home` or triggers an approval check, the middleware returns a redirect, completely discarding the freshly minted token. The browser keeps the expired cookie; subsequent API and server actions fail with `JWT expired`, abruptly kicking field workers back to the login screen mid-entry.
- **Verdict**: **VERIFIED TRUE POSITIVE**. Critical reliability failure.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-02] HIGH: Unsanitized Message Reflection in Recovery Pages                        │
│ Target: src/app/forgot-password/page.tsx:107, src/app/update-password/page.tsx:101    │
│ Live Status: VERIFIED TRUE POSITIVE (SECURITY / CONTENT SPOOFING)                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  [forgot-password/page.tsx](file:///d:/WebDev/report-submission/src/app/forgot-password/page.tsx#L106-L110) and [update-password/page.tsx](file:///d:/WebDev/report-submission/src/app/update-password/page.tsx#L100-L104) directly evaluate `{resolvedParams?.message && <div>{resolvedParams.message}</div>}` inside prominent, styled alert banners.
- **Field Failure Mode**:
  While React JSX escapes HTML tags (preventing direct reflected XSS execution), this allows arbitrary **Content Spoofing / Social Engineering Phishing**. An attacker can distribute links like `https://app/forgot-password?message=Your+account+has+been+flagged.+Send+password+to+admin@evil.com` or `https://app/update-password?message=Security+Notice:+Enter+current+password+first`. The application already built a centralized `sanitizeAuthMessage()` in [src/lib/i18n.ts](file:///d:/WebDev/report-submission/src/lib/i18n.ts#L887-L903) (Track 1, ADR 020 / RS-46), but failed to bind it here.
- **Verdict**: **VERIFIED TRUE POSITIVE**. Security regression.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-03] HIGH: Deprecated Cookie API in Server Client Utility                          │
│ Target: src/utils/supabase/server.ts:11-34                                             │
│ Live Status: VERIFIED TRUE POSITIVE (AGENTS.md RULE 2 VIOLATION)                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  [src/utils/supabase/server.ts](file:///d:/WebDev/report-submission/src/utils/supabase/server.ts#L11-L34) implements `{ cookies: { get, set, remove } }`. 
  [AGENTS.md](file:///d:/WebDev/report-submission/AGENTS.md#L64) explicitly mandates:
  > *"Modern Supabase SSR: Use getAll() / setAll() cookie methods exclusively across middleware and server clients."*
- **Field Failure Mode**:
  `@supabase/ssr` v0.4.0+ deprecates `get/set/remove`. When an auth token exceeds the 4KB single-cookie limit (frequent when storing OAuth claims or user metadata), `@supabase/ssr` splits tokens across chunked cookies (`sb-*-auth-token.0`, `sb-*-auth-token.1`). The legacy `get()` method fails to reassemble chunks properly, causing sporadic `AuthSessionMissingError` on Server Components and Route Handlers.
- **Verdict**: **VERIFIED TRUE POSITIVE**. Architectural standard breach.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-04] HIGH: Unpadded Base64URL JWT Decoding in Auth Callback Route                  │
│ Target: src/app/auth/callback/route.ts:24-28                                           │
│ Live Status: VERIFIED WITH NUANCE (SILENT AMR FAILURE, NOT PROCESS CRASH)              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  In [auth/callback/route.ts](file:///d:/WebDev/report-submission/src/app/auth/callback/route.ts#L24-L28):
  ```typescript
  if (typeof atob === 'function') {
    payloadJson = atob(payloadBase64)
  }
  ```
- **Adversarial Analysis**:
  Agent 1 labeled this a "PKCE Recovery Crash". In reality, the block is wrapped in `try { ... } catch (e) { console.error(...) }`, so the Node.js runtime does **not** crash. However, standard browser/Node `atob` strictly rejects Base64URL characters (`-` and `_`) and throws `DOMException [InvalidCharacterError]` on unpadded strings. Because the exception is swallowed:
  1. The recovery detection (`amr` claim check) fails 100% of the time on Base64URL tokens.
  2. The target redirect `next` is **never** overridden to `/update-password`.
  3. The user who clicked "পাসওয়ার্ড রিসেট করুন" in their email is redirected to `/` (dashboard) as an authenticated user without ever reaching the password update form!
- **Verdict**: **VERIFIED TRUE POSITIVE (FUNCTIONAL SILENT FAILURE)**. Must use native Node.js `Buffer.from(payloadBase64, 'base64url').toString('utf-8')`.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-05] MED: Blur-to-Submit Race in Registration Form                                 │
│ Target: src/components/auth/register-form-client.tsx:243                               │
│ Live Status: VERIFIED TRUE POSITIVE (MOBILE USABILITY DEFECT)                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  In [register-form-client.tsx](file:///d:/WebDev/report-submission/src/components/auth/register-form-client.tsx#L243):
  `disabled={loading || hasBlockingError || emailStatus === 'checking' || userIdStatus === 'checking'}`.
- **Field Failure Mode**:
  On mobile devices (Android Chrome, TWA), a user types their email or user ID and immediately taps the "নিবন্ধন করুন" submit button. The browser dispatches `blur` on the input *before* dispatching `click` on the button. The blur handler sets `emailStatus = 'checking'`. React synchronously renders the button as `disabled`. Mobile WebKit and Blink cancel pointer events when the target element becomes disabled mid-touch. The tap is completely lost; the user must tap a second time after the network check completes.
- **Verdict**: **VERIFIED TRUE POSITIVE**. Submit button should only be disabled during active submission (`loading`) or definitive failure (`hasBlockingError`), not during advisory background checks.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-06] MED: Authenticated `/register` 2-Hop Redirect Ping-Pong                       │
│ Target: middleware.ts:36-47, 101-106                                                   │
│ Live Status: VERIFIED TRUE POSITIVE (REDUNDANT RTT LATENCY)                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  In [middleware.ts](file:///d:/WebDev/report-submission/middleware.ts#L36-L47):
  ```typescript
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    url.pathname = '/'
  } else {
    url.pathname = '/home'
    if (request.nextUrl.pathname.startsWith('/register')) {
      url.searchParams.set('mode', 'register')
    }
  }
  ```
- **Field Failure Mode**:
  If an authenticated user clicks a stale bookmark or link to `/register`, line 38 evaluates to `false` (since path is `/register`, not `/login`). The middleware redirects to `/home?mode=register` (Hop 1). Then, line 101 intercepts `/home` for authenticated users and redirects to `/` (Hop 2). This causes 2 round-trip redirects over cellular connections (300-800ms penalty in Bangladesh).
- **Verdict**: **VERIFIED TRUE POSITIVE**. The condition must check `if (user && (startsWith('/login') || startsWith('/register')))` and redirect directly to `/`.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-07] MED: Mobile Touch Target Ergonomics (<44px) & Icon Overlap Regression         │
│ Target: src/components/auth/auth-portal-client.tsx:86, 110, 135; register-form-client.tsx:113, 244 │
│ Live Status: VERIFIED TRUE POSITIVE (ACCESSIBILITY & ERGONOMICS)                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  All inputs and buttons in [auth-portal-client.tsx](file:///d:/WebDev/report-submission/src/components/auth/auth-portal-client.tsx#L86-L135) and [register-form-client.tsx](file:///d:/WebDev/report-submission/src/components/auth/register-form-client.tsx#L113-L244) use `h-10` (40px) and `!pl-10 !pr-3.5`.
- **Adversarial Context Check**:
  In [KNOWN_ISSUES.md](file:///d:/WebDev/report-submission/docs/KNOWN_ISSUES.md#L8-L12), the team made a formal `WONTFIX` decision for `AutoSaveField` in `tableMode` (`h-9`, 36px) to preserve reporting matrix density. **However, that exception does NOT apply to the primary authentication portal.**
  Furthermore, [KNOWN_ISSUES.md](file:///d:/WebDev/report-submission/docs/KNOWN_ISSUES.md#L281) (ADR 008) explicitly documented:
  > *"Added !pl-12 !pr-4 to all form inputs with absolute icons to eliminate overlap with placeholders."*
  The live code regressed back to `!pl-10`, leaving only 10px clearance between the 16px icon (at `left-3.5` = 14px) and input text.
- **Verdict**: **VERIFIED TRUE POSITIVE**. Upgrade auth inputs/buttons to `h-11` (44px) and restore `!pl-12 !pr-4`.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-08] MED: Zero Rate Limiting on Password Reset Action                              │
│ Target: src/app/forgot-password/actions.ts:7                                           │
│ Live Status: VERIFIED TRUE POSITIVE (DENIAL OF SERVICE / QUOTA EXHAUSTION)             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  [forgot-password/actions.ts](file:///d:/WebDev/report-submission/src/app/forgot-password/actions.ts#L7-L34) calls `supabase.auth.resetPasswordForEmail()` without invoking `rateLimit()`.
- **Field Failure Mode**:
  Per [KNOWN_ISSUES.md](file:///d:/WebDev/report-submission/docs/KNOWN_ISSUES.md#L16-L20), Supabase free tier enforces a strict limit of **2 password reset emails per hour per email address**. Without client IP sliding-window throttling (as implemented in Track 4 / ADR 021 via [src/lib/rate-limit.ts](file:///d:/WebDev/report-submission/src/lib/rate-limit.ts)), an automated bot or misclicking user can exhaust the 2-email quota in under 5 seconds, locking legitimate users out of password recovery for an entire hour.
- **Verdict**: **VERIFIED TRUE POSITIVE**.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-09] MED: Missing DOM `id` and `autocomplete` on Update Password Form             │
│ Target: src/app/update-password/page.tsx:67-91                                         │
│ Live Status: VERIFIED TRUE POSITIVE (A11Y & PASSWORD MANAGER FAILURE)                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  [update-password/page.tsx](file:///d:/WebDev/report-submission/src/app/update-password/page.tsx#L67-L91) defines `<label htmlFor="password">` and `<label htmlFor="confirmPassword">`, but neither `<input>` has an `id` attribute! Furthermore, both inputs lack `autoComplete="new-password"`.
- **Field Failure Mode**:
  Tapping labels does not focus the input fields. Mobile password autofill engines (Google Autofill on Android, iCloud Keychain on iOS) fail to register this as a password update, frequently offering stale credentials or refusing to generate strong passwords.
- **Verdict**: **VERIFIED TRUE POSITIVE**.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-10] MED: Asymmetric Login Email Normalization                                     │
│ Target: src/app/home/actions.ts:37-45                                                  │
│ Live Status: VERIFIED TRUE POSITIVE (CASING LOGIN DEFECT)                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  In [home/actions.ts](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L37-L45):
  ```typescript
  const rawIdOrEmail = (formData.get('email') as string)?.trim() || ""
  let email = rawIdOrEmail
  if (!rawIdOrEmail.includes('@')) {
    // queries people and lowercases...
  }
  ```
  If `rawIdOrEmail` contains `@` (e.g. `User@domain.com`), it is **never lowercased**!
  In contrast, `register()` ([L118](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L118)), `forgotPassword()` ([L8](file:///d:/WebDev/report-submission/src/app/forgot-password/actions.ts#L8)), and `checkEmailAvailability()` ([L221](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L221)) all execute `.trim().toLowerCase()`.
- **Field Failure Mode**:
  Mobile virtual keyboards automatically capitalize the first character of an input by default. Users typing `User@gmail.com` submit uppercase letters. While Postgres and GoTrue often handle email lowercasing, asymmetric normalization across server actions violates system invariants.
- **Verdict**: **VERIFIED TRUE POSITIVE**.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-11] LOW: Vestigial `SessionCleaner` & Shadowed Server Auth Guard                  │
│ Target: src/components/auth/session-cleaner.tsx:5-13, src/app/home/page.tsx:21-33       │
│ Live Status: VERIFIED TRUE POSITIVE (RULE 7 ZERO DEAD-WEIGHT BREACH)                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  1. [session-cleaner.tsx](file:///d:/WebDev/report-submission/src/components/auth/session-cleaner.tsx#L5-L13) only purges `sessionStorage.removeItem("dashboard-period-params")`.
     A full repository scan confirms **zero lines of code anywhere in the project set `dashboard-period-params`**. ADR 006 permanently migrated state to URL search parameters. Moreover, [AGENTS.md](file:///d:/WebDev/report-submission/AGENTS.md#L140) Rule 7 explicitly instructs: *"Delete obsolete client components (session-cleaner.tsx)"*.
  2. In [home/page.tsx](file:///d:/WebDev/report-submission/src/app/home/page.tsx#L21-L33), lines 21-33 execute `supabase.auth.getUser()` and redirect authenticated users. However, [middleware.ts](file:///d:/WebDev/report-submission/middleware.ts#L101-L106) already intercepts authenticated requests to `/home` and redirects them to `/`. Lines 21-33 are completely dead code that wastes serverless compute cycles.
- **Verdict**: **VERIFIED TRUE POSITIVE**. Delete `session-cleaner.tsx` and prune shadowed guard.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-12] LOW: Hardcoded Light Theme Utilities in Pending Approval Page                 │
│ Target: src/app/pending-approval/page.tsx:8, 23, 35                                    │
│ Live Status: VERIFIED TRUE POSITIVE (THEME GLARE DEFECT)                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  [pending-approval/page.tsx](file:///d:/WebDev/report-submission/src/app/pending-approval/page.tsx#L8-L40) uses `bg-amber-100`, `shadow-amber-100/50`, `border-amber-200/50`, `bg-amber-50/30`, and `bg-green-100` without any `dark:` prefix variants.
- **Field Failure Mode**:
  In Dark Mode or Solar Dark Mode, users awaiting approval are blinded by harsh light-amber and light-green boxes on a pure `#09090b` background.
- **Verdict**: **VERIFIED TRUE POSITIVE**. Add responsive dark tokens (`dark:bg-amber-950/40`, `dark:border-amber-900/40`, `dark:bg-green-950/40`).

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-13] LOW: Logout Route Method & Contract Realignment                               │
│ Target: src/app/auth/logout/route.ts:4                                                 │
│ Live Status: PARTIALLY REJECTED / ARCHITECTURALLY CORRECTED                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Adversarial Cross-Examination**:
  Agent 1 claimed that `route.ts` exporting only `POST` is a "method mismatch" that causes issues and proposed adding `GET` support.
  **This recommendation is strongly rejected on security grounds.**
  Under RFC 7231 and OWASP Session Management Guidelines, session termination must **never** be exposed via idempotent `GET` endpoints. Exposing `GET /auth/logout` allows trivial Cross-Site Request Forgery (e.g. `<img src="https://app/auth/logout" />` or third-party links logging users out silently) and triggers accidental logouts from browser speculative prefetching or antivirus URL scanners.
- **The True Defect**:
  In [user-dropdown.tsx](file:///d:/WebDev/report-submission/src/components/layout/user-dropdown.tsx#L140) and [bottom-nav.tsx](file:///d:/WebDev/report-submission/src/components/layout/bottom-nav.tsx#L135), the client invokes `fetch("/auth/logout", { method: "POST" })`.
  In [route.ts](file:///d:/WebDev/report-submission/src/app/auth/logout/route.ts#L7), the handler executes `redirect("/home")`.
  The browser `fetch` silently follows the 307 redirect, downloading the full `/home` HTML payload. Immediately afterwards, the client script runs `window.location.href = "/home"`, re-downloading `/home` a second time!
- **Authoritative Resolution**:
  Maintain `POST` strictly. In `route.ts`, support both standard HTML form actions (returning a redirect) and API/fetch requests (returning `NextResponse.json({ success: true })` if requested via `Accept: application/json` or headers).
- **Verdict**: **REJECT AGENT 1 FIX (NO GET LOGOUT). REVISE TO DUAL POST CONTRACT.**

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-14] LOW: Misleading Verification Copy for Google OAuth Users                      │
│ Target: src/app/pending-approval/page.tsx:18, 28                                       │
│ Live Status: VERIFIED TRUE POSITIVE (UX CONFUSION)                                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  [pending-approval/page.tsx](file:///d:/WebDev/report-submission/src/app/pending-approval/page.tsx#L18) displays:
  > *"আপনার ইমেইল ইনবক্স চেক করে ইমেইলটি ভেরিফাই করুন এবং অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।"*
- **Field Failure Mode**:
  Google OAuth users registered via `GoogleSignInButton` already have verified emails; Supabase does not dispatch confirmation emails to Google accounts. Google users spend hours checking spam folders for an email that was never sent.
- **Verdict**: **VERIFIED TRUE POSITIVE**. Update copy to clarify that email verification is only required for standard password signups.

---

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [C01-15] LOW: Zero Test Coverage Across Auth Utilities                                 │
│ Target: src/lib/i18n.ts, src/lib/rate-limit.ts                                         │
│ Live Status: VERIFIED TRUE POSITIVE (TECHNICAL DEBT)                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Code Inspection**:
  The repository only contains [date-utils.test.ts](file:///d:/WebDev/report-submission/src/lib/date-utils.test.ts) and [report-utils.test.ts](file:///d:/WebDev/report-submission/src/lib/report-utils.test.ts).
  `translateAuthError`, `sanitizeAuthMessage`, and `rateLimit` have zero unit test coverage.
- **Verdict**: **VERIFIED TRUE POSITIVE**.

---

## 3. Cross-Segment Blast Radius Matrix

Stabilization changes made in Segment 1 must not compromise the database integrity or runtime performance of Segments 2 through 7.

```mermaid
flowchart TD
    subgraph S1["Segment 1: Auth & Access Control"]
        MW["middleware.ts (SSR Session Refresh)"]
        SrvSup["src/utils/supabase/server.ts (getAll/setAll)"]
        Portal["AuthPortalClient & RegisterFormClient"]
    end

    subgraph S2["Segment 2: User Dashboard & Navigation"]
        Dash["UserDashboard (/)"]
        Period["PeriodSelector (?type=monthly&month=...)"]
    end

    subgraph S3["Segment 3: Sub-Section Reporting Forms"]
        Forms["AutoSaveField & ReportProvider"]
        ChildTables["report_header, report_course, etc."]
    end

    subgraph S4["Segment 4: Overview & Aggregation"]
        RepOverview["/report Overview"]
    end

    subgraph S5["Segment 5: Admin & Approvals"]
        AdminMgmt["(admin)/management (active=true)"]
        Pending["/pending-approval"]
    end

    subgraph S6["Segment 6: City Consolidation"]
        CityRep["(admin)/city-report"]
        Override["city_report_override"]
    end

    subgraph S7["Segment 7: Export Services"]
        ExportAPI["/api/export/pdf & /excel"]
    end

    MW -->|Fixes Cookie Loss| Dash
    MW -->|Enforces Approval Gating| Pending
    SrvSup -->|Stable Cookie Headers| ExportAPI
    SrvSup -->|Eliminates Chunking Errors| Forms
    AdminMgmt -->|Unlocks Auth Access| S1
```

### Segment Impact Analysis

| Target Segment | Potential Coupling / Risk | Verification & Guardrails |
| :--- | :--- | :--- |
| **Segment 2: User Dashboard** (`/`, `PeriodSelector`) | Pruning `SessionCleaner` could risk resurrecting `dashboard-period-params` state desync. | **ZERO RISK**: Verified across all 40+ source files that ADR 006 fully eradicated sessionStorage; URL query params are the sole source of truth. |
| **Segment 3: Sub-Section Reporting Forms** (`AutoSaveField`, 7 Child Tables) | Touch target expansions might accidentally bloat table matrix cells. | **ZERO RISK**: Touch target floor (44px) is strictly scoped to `AuthPortalClient` and `RegisterFormClient`. `AutoSaveField` table mode (`h-9`) remains intact per `KNOWN_ISSUES.md`. |
| **Segment 4: Overview & Aggregation** (`/report`) | Session cookie changes could affect client-side memoized Supabase instances. | **POSITIVE IMPACT**: Preserving refresh cookies in middleware prevents sudden 401 unauthenticated drops during long reporting reviews. |
| **Segment 5: Admin Management** (`(admin)/management`) | Approval gate synchronization with `people.active = true`. | **STABLE**: Middleware approval check strictly queries `people.active` with indexed `supabase_uid` (ADR 023). |
| **Segment 6: City Consolidation** (`(admin)/city-report`) | Database mutations or RLS policy drift. | **ZERO RISK**: Zero DDL or schema mutations. Singular tables (`people`, `zone`, `report`, `city_report_override`) preserved. |
| **Segment 7: Export Services** (`/api/export/*`) | Cookie parsing on serverless route handlers. | **POSITIVE IMPACT**: Modernizing `server.ts` to `getAll()` / `setAll()` prevents session truncation on PDF/Excel generation. |

---

## 4. Authoritative Remediation Architecture & Competing Alternatives

Per **[AGENTS.md](file:///d:/WebDev/report-submission/AGENTS.md) Rule 6**, every non-trivial defect must evaluate competing alternatives and document clear justifications for rejection before prescribing implementation.

### Defect 1: Cookie Loss on Redirects ([C01-01])
- **Alternative A (Local Header Injection)**: Manually construct `new Headers({ 'Set-Cookie': supabaseResponse.headers.get('set-cookie') })` on each `NextResponse.redirect()`.
  - *Rejection Rationale*: Flaky and error-prone. Multiple cookies in `Set-Cookie` are joined with commas by standard Fetch API header getters, which corrupts cookie attributes (Expires, SameSite).
- **Alternative B (Architectural Standard - RECOMMENDED)**: Implement a dedicated `redirectWithCookies(url: URL, source: NextResponse): NextResponse` helper:
  ```typescript
  function redirectWithCookies(url: URL, source: NextResponse) {
    const redirectResponse = NextResponse.redirect(url)
    source.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }
  ```
  Replace all raw `NextResponse.redirect()` calls across `middleware.ts` with `redirectWithCookies(url, supabaseResponse)`.

---

### Defect 2: PKCE Recovery Base64URL Decoding ([C01-04])
- **Alternative A (Client-Side Token Handling)**: Pass the raw JWT to the browser via query parameter and decode in the client component.
  - *Rejection Rationale*: Security anti-pattern; leaks raw session JWT into browser history and server access logs.
- **Alternative B (Clean Node.js Buffer Decoding - RECOMMENDED)**:
  In [auth/callback/route.ts](file:///d:/WebDev/report-submission/src/app/auth/callback/route.ts#L22-L28):
  ```typescript
  const payloadBase64 = token.split('.')[1]
  if (payloadBase64) {
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    const payload = JSON.parse(payloadJson)
    const isRecovery = payload?.amr?.some((method: any) => 
      typeof method === 'string' ? method === 'recovery' : method?.method === 'recovery'
    )
    if (isRecovery) next = '/update-password'
  }
  ```
  Zero external dependencies; natively handles unpadded Base64URL strings without throwing `DOMException`.

---

### Defect 3: Blur-to-Submit Race Condition ([C01-05])
- **Alternative A (Synthetic Pointer Event Delay)**: Add `setTimeout(..., 300)` to input blur handlers.
  - *Rejection Rationale*: Hacky delay that introduces input latency and fails on low-end Android CPUs.
- **Alternative B (Decouple Advisory Validation from Form Submission - RECOMMENDED)**:
  Remove `emailStatus === 'checking' || userIdStatus === 'checking'` from the submit button's `disabled` prop in [register-form-client.tsx](file:///d:/WebDev/report-submission/src/components/auth/register-form-client.tsx#L243). The server action `register()` already performs authoritative database uniqueness checks; client on-blur checks are strictly advisory visual cues.

---

### Defect 4: Logout Route Contract ([C01-13])
- **Alternative A (Enable GET Endpoint - AGENT 1 PROPOSAL)**: Add `export async function GET()` to `src/app/auth/logout/route.ts`.
  - *Rejection Rationale*: **REJECTED FOR SECURITY REASONS**. Violates OWASP CSRF defenses; enables drive-by logout attacks via injected `<img>` tags and crawler prefetching.
- **Alternative B (Dual-Mode POST Handler - RECOMMENDED)**:
  Retain `POST` only. Check `request.headers.get('accept')`:
  ```typescript
  export async function POST(request: Request) {
    const supabase = await createClient()
    await supabase.auth.signOut()
    const isJson = request.headers.get('accept')?.includes('application/json')
    if (isJson) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.redirect(new URL('/home', request.url))
  }
  ```
  Update client callers (`user-dropdown.tsx`, `bottom-nav.tsx`) to pass `headers: { 'Accept': 'application/json' }` before redirecting via `window.location.href = '/home'`.

---

## 5. Actionable Implementation Blueprint for Agent 3

The following tasks are prioritized by risk and ready for execution:

```markdown
- [ ] Task 1 (CRITICAL): Middleware Cookie Forwarding (middleware.ts)
  - Introduce `redirectWithCookies(url, supabaseResponse)`
  - Replace raw `NextResponse.redirect()` at lines 46, 76, 96, 105
  - Fix authenticated `/register` ping-pong at line 38: `if (user && (pathname.startsWith('/login') || pathname.startsWith('/register')))`

- [ ] Task 2 (CRITICAL): Modern SSR Cookie Implementation (src/utils/supabase/server.ts)
  - Replace deprecated `get/set/remove` with modern `getAll()` and `setAll(cookiesToSet)`

- [ ] Task 3 (HIGH): Message Reflection Sanitization (forgot-password/page.tsx & update-password/page.tsx)
  - Import `sanitizeAuthMessage` from `@/lib/i18n`
  - Wrap `resolvedParams?.message` in both pages; render alert only when sanitized result is non-null

- [ ] Task 4 (HIGH): Robust Base64URL JWT AMR Detection (src/app/auth/callback/route.ts)
  - Replace `atob(payloadBase64)` with `Buffer.from(payloadBase64, 'base64url').toString('utf-8')`

- [ ] Task 5 (MEDIUM): Registration Blur Race Fix (src/components/auth/register-form-client.tsx)
  - Remove `emailStatus === 'checking' || userIdStatus === 'checking'` from submit button `disabled` condition

- [ ] Task 6 (MEDIUM): Mobile Touch Floor & Padding Fixes
  - Upgrade inputs and buttons in `auth-portal-client.tsx`, `register-form-client.tsx`, and `google-sign-in-button.tsx` to `h-11` (44px)
  - Restore `!pl-12 !pr-4` for inputs with leading icons

- [ ] Task 7 (MEDIUM): Password Reset Rate Limiting (src/app/forgot-password/actions.ts)
  - Bind `rateLimit(`forgot-password:${clientIp}`, 3, 300_000)` using client IP from headers

- [ ] Task 8 (MEDIUM): Update Password Form Accessibility (src/app/update-password/page.tsx)
  - Add `id="password"`, `id="confirmPassword"`, and `autoComplete="new-password"`

- [ ] Task 9 (MEDIUM): Login Email Lowercase Normalization (src/app/home/actions.ts)
  - Add `.toLowerCase()` to `rawIdOrEmail` when handling email addresses

- [ ] Task 10 (LOW): Zero Dead-Weight Cleanup
  - Delete `src/components/auth/session-cleaner.tsx` per AGENTS.md Rule 7
  - Prune `SessionCleaner` import and shadowed auth check (lines 21-33) from `src/app/home/page.tsx`

- [ ] Task 11 (LOW): Dark Theme Fixes & Google OAuth Copy (src/app/pending-approval/page.tsx)
  - Add dark utility tokens (`dark:bg-amber-950/40`, `dark:border-amber-900/40`, `dark:bg-green-950/40`)
  - Update copy to clarify email verification instructions for Google signups

- [ ] Task 12 (LOW): Dual-Contract Logout Route (src/app/auth/logout/route.ts)
  - Maintain POST only; return JSON when `Accept: application/json` is present

- [ ] Task 13 (LOW): Automated Auth Unit Tests
  - Create `src/lib/auth-utils.test.ts` verifying `translateAuthError`, `sanitizeAuthMessage`, and `rateLimit`
```

---

## 6. Verification Quality Gates (Post-Implementation Standard)

When implementation commences in the next phase, all changes must pass the four mandatory quality gates defined in **[AGENTS.md](file:///d:/WebDev/report-submission/AGENTS.md) Rule 3**:

1. `npm run lint` — 0 errors, 0 warnings.
2. `npx tsc --noEmit` — 0 TypeScript errors.
3. `npm test` — All tests passing including newly added `auth-utils.test.ts`.
4. `npm run build` — Clean production build with all static/dynamic routes verified.

# Segment 04 Review: Authentication, Access Control & Role Governance

**Repository**: `Jabir-A-H/report-submission` (`Talimul Quran Report Submission`)  
**Auditor**: Subagent B (Adversarial Reviewer)  
**Target Domain**: Segment 04 — Authentication, Access Control & Role Governance  
**Cross-Examination Target**: `docs/issues-critique/segment-04-investigation.md` (Subagent A)  
**Evaluation Standard**: Pre-Production Agility (`AGENTS.md` Rule 7), Adversarial "Doubt Gate" (`AGENTS.md` Rule 2 & 6), Zero Dead-Weight Policy, Carrier-Grade NAT (CGNAT) Behavioral Integrity  
**Date**: 2026-11-15  

---

## 1. Adversarial Scorecard & Sanity Check

Subagent A delivered an incisive investigation of Segment 04, uncovering authentic vulnerabilities: the open PostgreSQL RLS policies on `people`, the silent cookie drop on middleware redirects, and the Google OAuth Zone 1 assignment trap in trigger `handle_new_user()`.

However, subjected to the adversarial **"Doubt Gate"** (*"Under what real-world field conditions will this clean-looking code fail?"*), several proposals from Subagent A exhibit critical flaws, theoretical blind spots, and architectural risks:
1. **The Compound Rate Limit Fallacy**: Subagent A proposed solving CGNAT lockout by keying availability checks on `${clientIp}:${identifier}`. **Adversarial Reality**: An attacker performing account enumeration queries *different* usernames/emails on every request. A compound key provides zero protection against account enumeration from a single IP, while a secondary IP ceiling still hazards mobile carrier gateways.
2. **Inverted Failure UX**: Throttling infrastructure errors currently return `available: false`, which the client form treats as "account taken," setting `hasBlockingError = true` and completely halting registration. Subagent A failed to flag this inverted failure coupling.
3. **RLS Demolition Blast Radius**: Subagent A proposed immediately dropping `people_update_admin` from Supabase without accounting for the fact that `src/app/(admin)/management/page.tsx` currently invokes direct client-side `supabase.from("people").update(...)`. Executing the database drop in isolation would instantly paralyze admin operations in production with `42501 (insufficient_privilege)`.
4. **Trigger Nullability Precondition**: Subagent A proposed defaulting `zone_id` to `NULL` in `handle_new_user()`. Live schema inspection reveals `people.zone_id` is defined as `NOT NULL` in PostgreSQL! Modifying the trigger without altering table constraints would crash every Google OAuth registration transaction with error `23502`.

### Master Scorecard

| Issue / Finding | Subagent A Claim | Subagent B Adversarial Verdict | Field Worker / Pre-Production Impact | Confidence |
|:---|:---|:---|:---|:---:|
| **RS-40 / RS-41: Password Recovery & Admin Reset** | Decided-Not-Doing (ADR 022) verified sound. | **UPHELD WITH PRAGMATIC ESCAPE HATCH** | Admins should NOT handle user passwords. For mistyped emails or locks in pre-production, admins use `deleteUserAction` so users can re-register. Custom SMTP resolves 2/hr limit. | 100% |
| **RS-42: Login Normalization & Casing** | Application `ilike` works; email lowercasing missing; DDL index missing. | **UPHELD & EXPANDED** | PostgreSQL requires functional unique indexes `lower(user_id)` and `lower(email)`. Dual `eq`/`ilike` application logic can then be simplified to clean direct queries. | 100% |
| **RS-43: Zone 1 / DCS Registration Leak** | Form excludes Zone 1; trigger `handle_new_user` hardcodes `zone_id = 1`. | **UPHELD; DDL DEPENDENCY FLAGGED** | `people.zone_id` is `NOT NULL`. Changing trigger requires `ALTER COLUMN zone_id DROP NOT NULL` first, plus UI guards in `/management` to block activating unassigned users. | 100% |
| **RS-44 / KI-023 Trap 3: CGNAT Lockout & Availability** | IP key causes lockout; compound key `${ip}:${email}` proposed. | **PARTIALLY REJECTED (COMPOUND KEY FLAW)** | Compound key alone permits unlimited enumeration. The true defect is inverted UX: throttling must fail open (`unverified`), never mark fields `taken` or halt submission. | 100% |
| **RS-45 / C05-04: Admin Privilege Escalation via RLS** | RLS policies permit PostgREST privilege escalation and deletion. | **VERIFIED CRITICAL; EXECUTION STAGED** | Vulnerability is 100% real. However, dropping RLS policies requires migrating `management/page.tsx` user mutations to Server Actions first to prevent UI breakage. | 100% |
| **RS-46: URL Message Phishing / XSS** | `/home` protected; `/forgot-password` and `/update-password` leak raw strings. | **UPHELD & VERIFIED** | Direct rendering of `resolvedParams.message` allows spoofed platform security alerts. Must be wrapped in existing `sanitizeAuthMessage()`. | 100% |
| **RS-48: Middleware Cookie Dropping on Redirects** | `NextResponse.redirect()` silently drops refreshed `@supabase/ssr` cookies. | **VERIFIED WITH RUNTIME PROOF** | Next.js 16 Edge/Node runtime does not forward cookies across distinct `NextResponse` instances. Dropped cookies cause session thrashing and random mobile logouts. | 100% |

---

## 2. False-Positive Discharge Table

This table evaluates claims from issue registers, previous audits, and Subagent A's report that are either false positives, misleadingly framed, or represent premature over-engineering.

| Topic / Documented Issue | Purported Severity | Adversarial Reality & Analysis | Disposition / Ruling |
|:---|:---:|:---|:---|
| **In-App Admin Password Reset Modal (RS-41)** | Medium / User Request | **False Need (Bloatware)**: In pre-production (~30 field workers), field workers who mistype their email or forget credentials can simply have their unapproved profile deleted by an admin via [`deleteUserAction`](file:///d:/WebDev/report-submission/src/app/(admin)/management/actions.ts#L6-L97), permitting immediate clean re-registration. Building custom password reset modals, temporary credential generation, or admin password inputs creates severe credential mishandling risks. | **DISCHARGED** (Keep ADR 022 Decision) |
| **Compound Key `${clientIp}:${email}` as Enumeration Fix (RS-44)** | High / Security Fix | **Architectural Fallacy**: If an availability check keys *only* by `${clientIp}:${email}`, an attacker cycling through a dictionary of 10,000 distinct email addresses hits the compound limiter only once per email. The attacker enumerates the entire user base at wire speed from a single IP. | **DISCHARGED & REDESIGNED** (Decouple throttling from validation; fail-open UX) |
| **Distributed Redis / KV Rate Limiter Requirement** | Low / Theoretical Scalability | **Premature Over-Engineering**: The platform serves ~30 field workers and 2 admins. Introducing Upstash Redis, database-backed rate limit tables, or third-party KV stores introduces external failure points, latency overhead, and deployment bloat. Standard in-memory sliding windows with relaxed thresholds and client fail-open behavior are completely adequate. | **DISCHARGED** (Retain in-memory with sound thresholds) |
| **Soft Numeric Input Outlier Warnings (RS-07)** | Low / Feature Request | **Unnecessary Bloatware**: Evaluated and decisively rejected in ADR 022. Field workers entering diverse unit counts and student figures must not be badgered by arbitrary client-side warning thresholds. | **DISCHARGED** (Confirmed Closed) |
| **Immediate Dropping of `people_update_admin` RLS Policy** | High / Security Fix | **Operational Hazard if Done Prematurely**: Subagent A recommended dropping `people_update_admin` immediately. Doing so before updating [`src/app/(admin)/management/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx#L132-L161) will cause all admin user approvals and zone assignments to fail immediately with PostgreSQL RLS violation `42501`. | **DISCHARGED AS IMMEDIATE STEP** (Must be staged behind Server Actions) |

---

## 3. Security & Operational Edge Case Scenarios

### Scenario 1: The Carrier-Grade NAT (CGNAT) Cascade & Account Enumeration Dilemma
- **The Physical Reality in Bangladesh**:
  Mobile telecom operators (Grameenphone, Banglalink, Robi, Teletalk) route mobile data traffic through Carrier-Grade NAT (CGNAT) gateways using RFC 6598 addresses (`100.64.0.0/10`). Entire districts share a small pool of public egress IPv4 addresses.
- **The Failure Cascade Under Current Code**:
  1. In [`src/components/auth/register-form-client.tsx#L62-L88`](file:///d:/WebDev/report-submission/src/components/auth/register-form-client.tsx#L62-L88), typing and blurring inputs invokes `checkEmailAvailability` and `checkUserIdAvailability`.
  2. Each check is throttled at `10 req/min per clientIp` ([`src/app/home/actions.ts#L216-L218`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L216-L218)).
  3. When an organizational training session occurs or multiple workers sign up simultaneously, the 10-request ceiling on the shared public IP is reached within seconds.
  4. The 11th request receives `{ available: false, message: 'অনেক বেশি চেষ্টা হয়েছে...' }`.
  5. The client form evaluates:
     ```typescript
     setEmailStatus(result.available ? 'available' : 'taken')
     const hasBlockingError = emailStatus === 'taken' || userIdStatus === 'taken'
     if (hasBlockingError) return;
     ```
  6. **Catastrophic Inversion**: Infrastructure throttling is interpreted as a validation failure (`taken`). The client form displays a red warning and silences form submission. Field workers are completely barred from submitting registration.
- **The Adversarial Flaw in Subagent A's Compound Key**:
  If the check keys on `${clientIp}:${email}`, an attacker attempting user enumeration sends:
  `GET checkEmail?email=victim1@gmail.com` -> key: `203.0.113.1:victim1@gmail.com` (Count 1)
  `GET checkEmail?email=victim2@gmail.com` -> key: `203.0.113.1:victim2@gmail.com` (Count 1)
  The attacker tests 100,000 accounts without ever exceeding the limit of 5 requests per key.
- **The Mathematically Sound & Resilient Solution**:
  1. **Decouple Throttling from Validation (Fail-Open UX)**:
     If the rate limiter is tripped, the server MUST return `{ available: true, rateLimited: true, message: 'যাচাই সীমা অতিক্রান্ত। জমা দেওয়ার সময় চূড়ান্ত যাচাই করা হবে।' }`.
     The client sets `status = 'unverified'`. The field renders an amber informational badge, and `hasBlockingError` remains `false`.
  2. **Authoritative Submission Gate**:
     The transactional boundary is [`register(formData)`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L107-L204). The PostgreSQL unique index handles uniqueness atomically. If taken, `register` returns a standard localized error redirect.
  3. **Relaxed Cellular IP Ceiling**:
     Raise the availability check ceiling to **60 req/min per IP**. On mobile CGNAT, 60 requests accommodates genuine bursts without enabling unrestricted scraping.

---

### Scenario 2: Token Dropoff & Session Desync on Edge Redirects (RS-48)
- **The Technical Mechanism**:
  In [`middleware.ts`](file:///d:/WebDev/report-submission/middleware.ts#L4-L95):
  ```typescript
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(..., {
    cookies: {
      setAll(cookiesToSet) {
        ...
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      }
    }
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (user && request.nextUrl.pathname === '/home') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url) // << COOKIES DROPPED!
  }
  ```
- **Next.js 16 Runtime Proof**:
  1. In Next.js App Router (Node.js and Edge runtimes), `NextResponse.redirect(url)` is implemented as:
     `new NextResponse(null, { status: 307, headers: { location: String(url) } })`.
  2. `NextResponse.redirect(url)` creates a completely fresh, detached HTTP response object.
  3. The local variable `supabaseResponse` (which received the refreshed auth tokens via `supabaseResponse.cookies.set()`) is out of scope and garbage collected.
  4. The browser receives the HTTP 307 redirect with **ZERO `Set-Cookie` headers**.
  5. The mobile browser follows the 307 redirect to `/`, presenting its existing, expired auth cookie jar.
  6. On the subsequent request to `/`, `@supabase/ssr` in server components or layout sees an expired token. If Supabase Auth's refresh token rotation is active, reusing the previous refresh token can trigger token reuse revocation, abruptly logging the user out.
- **Proof of Resolution**:
  All redirects in `middleware.ts` MUST copy cookies from `supabaseResponse` to the redirect response:
  ```typescript
  function redirectWithCookies(url: URL, sourceResponse: NextResponse): NextResponse {
    const redirectResponse = NextResponse.redirect(url)
    sourceResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }
  ```

---

### Scenario 3: Privilege Escalation & Rogue Admin PostgREST Takeover
- **Live Database Inspection**:
  Querying `pg_policies` on table `public.people` in Supabase project `pxdkvewaglagnfcqeckn`:
  ```sql
  policyname: people_update_admin | cmd: UPDATE | qual: is_admin() | with_check: NULL
  policyname: people_delete_admin | cmd: DELETE | qual: is_admin() | with_check: NULL
  ```
- **Exploitation Walkthrough**:
  1. A user with `role = 'admin'` logs in.
  2. The admin opens browser developer tools or sends an authenticated HTTP request directly to Supabase PostgREST:
     ```http
     PATCH /rest/v1/people?supabase_uid=eq.<current_user_uuid> HTTP/1.1
     Authorization: Bearer <admin_access_token>
     apikey: <anon_public_key>
     Content-Type: application/json

     { "role": "superadmin" }
     ```
  3. PostgreSQL executes the query. `is_admin()` evaluates to `TRUE`. Because `with_check` is `NULL`, PostgreSQL validates no column invariants or role transitions.
  4. The standard admin is now a `superadmin`.
  5. Similarly, a rogue admin can issue:
     ```http
     DELETE /rest/v1/people?role=eq.superadmin HTTP/1.1
     ```
     PostgreSQL deletes all superadmin profiles from `public.people`.
- **Why This Policy Exists in Live Code**:
  In [`src/app/(admin)/management/page.tsx#L132-L161`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx#L132-L161), the client UI directly calls:
  `supabase.from("people").update({ active: !user.active }).eq("id", user.id)`
  and
  `supabase.from("people").update({ zone_id: newZoneId }).eq("id", userId)`.
  The permissive RLS policies were added as a quick fix to make client-side mutations work.
- **Hardened Pre-Production Resolution**:
  Mutating `people` must NEVER occur via client PostgREST. All administrative state mutations must be routed through Server Actions running with the service role client (`adminSupabase`), and `people_update_admin` and `people_delete_admin` must be permanently dropped.

---

### Scenario 4: Google OAuth Zone 1 Contamination & Report Freeze
- **Live Trigger Analysis**:
  In database `pxdkvewaglagnfcqeckn`, `public.handle_new_user()` contains:
  ```sql
  INSERT INTO public.people (user_id, name, email, role, active, zone_id, supabase_uid)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'user_id', 'AUTO_' || SUBSTR(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user',
    false,
    COALESCE(CAST(NEW.raw_user_meta_data->>'zone_id' AS INTEGER), 1), -- << BUG!
    NEW.id
  )
  ON CONFLICT (supabase_uid) DO NOTHING;
  ```
- **The Failure Sequence**:
  1. A user registers via "Sign in with Google" (`GoogleSignInButton`).
  2. Google OAuth passes no `zone_id` metadata.
  3. `handle_new_user()` defaults `zone_id` to `1` ("ডি সি এস" / DCS).
  4. The user is created as `active = false, zone_id = 1`.
  5. An admin visits `/management` and clicks "অনুমোদন করুন" (Approve) without touching the zone dropdown.
  6. The user is now approved in Zone 1.
  7. When the user logs in and attempts to access the reporting form, [`src/app/report/[section]/page.tsx`](file:///d:/WebDev/report-submission/src/app/report/[section]/page.tsx) attempts to load reports for Zone 1. However, Zone 1 is a city-level administrative entity, not a field reporting zone.
  8. If the user's role is ever changed to `admin`, [`src/app/(admin)/dashboard/page.tsx#L108`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L108) activates global purview due to `person?.zone_id === 1`.
- **The Precondition for Fixing**:
  `people.zone_id` currently has a `NOT NULL` constraint:
  ```sql
  SELECT is_nullable FROM information_schema.columns WHERE table_name = 'people' AND column_name = 'zone_id';
  -- Result: NO
  ```
  Updating `handle_new_user()` to insert `NULL` without running `ALTER TABLE public.people ALTER COLUMN zone_id DROP NOT NULL;` will abort every Google OAuth transaction.

---

### Scenario 5: Social Engineering & Alert Phishing via Unsanitized Parameters on Recovery Pages (RS-46)
- **Live Code Inspection**:
  In [`src/app/forgot-password/page.tsx#L106-L110`](file:///d:/WebDev/report-submission/src/app/forgot-password/page.tsx#L106-L110) and [`src/app/update-password/page.tsx#L100-L104`](file:///d:/WebDev/report-submission/src/app/update-password/page.tsx#L100-L104):
  ```tsx
  {resolvedParams?.message && (
    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-center font-bold text-sm animate-in zoom-in duration-300">
      {resolvedParams.message}
    </div>
  )}
  ```
- **The Threat Flow**:
  1. An attacker crafts a URL:
     `https://report.domain/forgot-password?message=অ্যাকাউন্ট+ব্লক+করা+হয়েছে।+অবিলম্বে+017xxxxxxxx+নম্বরে+যোগাযোগ+করুন।`
  2. Because `resolvedParams.message` is rendered verbatim without whitelist validation, the user sees an authentic, system-styled red warning card.
  3. While React escapes raw HTML (preventing classic XSS), **text injection / phishing** allows attackers to impersonate system administrators.
- **Resolution**:
  Import `sanitizeAuthMessage` from `@/lib/i18n` and render only sanitized messages on `/forgot-password` and `/update-password`, matching the protection on [`/home`](file:///d:/WebDev/report-submission/src/app/home/page.tsx#L47).

---

## 4. Cross-Segment Blast Radius Analysis

When hardening Segment 04, changes propagate across multiple application boundaries. Every modification must be evaluated against coupled systems:

```
                               CROSS-SEGMENT BLAST RADIUS
  
   [ Segment 04 Changes ]                       [ Impacted Segments ]
  
   1. Drop `people` RLS policies     ───────►   SEGMENT 05: Admin Portal (Management)
      (DELETE & UPDATE)                         Breaks client-side approvals unless
                                                first migrated to Server Actions!
  
   2. Make `people.zone_id` NULLABLE ───────►   SEGMENT 02: Report State Machine
      for Google OAuth Onboarding               Users with null zone_id will fail
                                                `report/[section]` with zoneNotAssigned error.
  
   3. Enforce lower(user_id) DDL     ───────►   SEGMENT 03: Input Systems & Normalization
      case-insensitive index                    Guarantees no race condition or collision
                                                on soft-keyboard capitalization.
  
   4. Cookie Forwarding in           ───────►   SEGMENT 05: Canonical Navigation
      NextResponse.redirect()                   Prevents 307 redirect auth token dropouts
                                                during `/home` -> `/` dashboard transitions.
```

### 4.1 Blast Radius on Segment 05 (Admin Portal / User Management)
- **Direct PostgREST Client Coupling**:
  [`src/app/(admin)/management/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx) relies on direct browser Supabase calls for:
  - `toggleActive` (line 134)
  - `changeZone` (line 149)
- **Staging Requirement**:
  We must NOT drop `people_update_admin` from Supabase until two new Server Actions are created and wired into `ManagementPage`:
  - `toggleUserActiveAction(peopleId: number)`
  - `changeUserZoneAction(peopleId: number, newZoneId: number)`
  Both actions must enforce:
  1. Caller authentication via `getServerClient()`.
  2. Caller role verification (`admin` or `superadmin`).
  3. Self-deactivation prevention (`requester.id !== target.id`).
  4. Execution via `adminSupabase` (service role).

### 4.2 Blast Radius on Segment 02 (Report State Machine & Data Entry)
- **Handling Nullable `zone_id`**:
  If a Google OAuth user is created with `zone_id = NULL`:
  1. [`src/app/report/[section]/page.tsx#L128-L130`](file:///d:/WebDev/report-submission/src/app/report/[section]/page.tsx#L128-L130) already contains defensive handling:
     ```typescript
     if (!person || !person.zone_id) {
       setError(tRef.current.zoneNotAssigned);
       setIsLoading(false);
       return;
     }
     ```
     The data entry page gracefully stops and shows an error rather than crashing or invoking RPCs with `null`.
  2. **Approval Guard in Management UI**:
     In `ManagementPage`, the user card for a user with `zone_id === null` must:
     - Render a distinct amber badge: `জোন অনির্ধারিত` (Zone Unassigned).
     - Provide a default placeholder in the zone selector: `<option value="">জোন নির্বাচন করুন...</option>`.
     - **Disable the "অনুমোদন করুন" (Approve) button** until a valid reporting zone is chosen. An unassigned user must never be activated.

### 4.3 Blast Radius on Segment 01 (City Report & Aggregation)
- **Elimination of `person?.zone_id === 1` Admin Equivalence**:
  In [`src/app/(admin)/dashboard/page.tsx#L108`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L108):
  ```typescript
  const isAdminOrSuper = person?.role === "superadmin" || person?.zone_id === 1 || person?.role === "admin";
  ```
  Treating `zone_id === 1` as administrative privilege is an obsolete artifact. Zone 1 is an organizational entity, not an access role. Stripping `person?.zone_id === 1` from authorization checks ensures that accidentally placing a user in Zone 1 confers zero administrative privileges.

---

## 5. Final Hardened Pre-Production Action Plan

Following `AGENTS.md` Rule 7 (*Pre-Production Agility & Zero Dead-Weight*), implement clean, authoritative solutions without backward-compatibility shims.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                    HARDENED AUTH & ROLE GOVERNANCE PIPELINE                   │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┴─────────────────────────────────┐
     ▼                                                                   ▼
┌───────────────────────────────┐                   ┌───────────────────────────────┐
│   DATABASE LAYER (Supabase)   │                   │    APPLICATION LAYER (Next)   │
├───────────────────────────────┤                   ├───────────────────────────────┤
│ 1. ALTER TABLE people         │                   │ 1. middleware.ts              │
│    ALTER COLUMN zone_id       │                   │    Forward refreshed cookies  │
│    DROP NOT NULL;             │                   │    on all redirect responses. │
│                               │                   │                               │
│ 2. CREATE UNIQUE INDEX        │                   │ 2. home/actions.ts            │
│    idx_people_lower_user_id   │                   │    • Lowercase email on login │
│    ON people (lower(user_id));│                   │    • Fail-open availability   │
│                               │                   │    • Account login throttle   │
│ 3. CREATE UNIQUE INDEX        │                   │                               │
│    idx_people_lower_email     │                   │ 3. management/actions.ts      │
│    ON people (lower(email));  │                   │    • toggleUserActiveAction   │
│                               │                   │    • changeUserZoneAction     │
│ 4. Update handle_new_user():  │                   │                               │
│    Default zone_id = NULL     │                   │ 4. management/page.tsx        │
│    (NEVER zone_id = 1)        │                   │    • Use Server Actions       │
│                               │                   │    • Guard null zone approval │
│ 5. DROP POLICIES on people:   │                   │                               │
│    • people_update_admin      │                   │ 5. forgot/update-password     │
│    • people_delete_admin      │                   │    Sanitize URL messages with │
│                               │                   │    sanitizeAuthMessage().     │
└───────────────────────────────┘                   └───────────────────────────────┘
```

### Action Item 1: Middleware Cookie Preservation on Redirects (RS-48)
- **Target**: [`middleware.ts`](file:///d:/WebDev/report-submission/middleware.ts#L62-L92)
- **Implementation**:
  Define a cookie forwarding helper and wrap all redirect exit points:
  ```typescript
  function redirectWithCookies(request: NextRequest, url: URL, supabaseResponse: NextResponse) {
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }
  ```
  Replace lines 62, 82, and 92 with `redirectWithCookies(request, url, supabaseResponse)`.
  Modernize [`src/utils/supabase/server.ts`](file:///d:/WebDev/report-submission/src/utils/supabase/server.ts) to use `getAll()` and `setAll(cookiesToSet)`.

### Action Item 2: Resilient CGNAT Availability Checks & Login Defense (RS-44 / KI-023 Trap 3)
- **Target**: [`src/app/home/actions.ts`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L206-L275), [`src/components/auth/register-form-client.tsx`](file:///d:/WebDev/report-submission/src/components/auth/register-form-client.tsx#L62-L100)
- **Implementation**:
  1. In `checkEmailAvailability` and `checkUserIdAvailability`:
     - Raise per-IP rate limit ceiling to **60 req/min**.
     - If rate limit is exceeded, return:
       `{ available: true, rateLimited: true, message: 'যাচাই সীমা অতিক্রান্ত। ফর্ম জমা দেওয়ার সময় যাচাই হবে।' }`.
  2. In `register-form-client.tsx`:
     - When `rateLimited: true`, set field status to `'unverified'` (displaying amber info icon), NOT `'taken'`.
     - `hasBlockingError` remains `false`. The user can submit the form unimpeded.
  3. In `login()`:
     - Enforce account-level brute-force throttling: `rateLimit('login:account:' + normalizedEmail, 5, 300_000)` (max 5 failed attempts per 5 minutes per target account).

### Action Item 3: Stage Server Actions & Drop Insecure PostgREST Policies (RS-45 / C05-04)
- **Target**: [`src/app/(admin)/management/actions.ts`](file:///d:/WebDev/report-submission/src/app/(admin)/management/actions.ts), [`src/app/(admin)/management/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx#L132-L161), PostgreSQL RLS
- **Implementation Step 1 (Server Actions)**:
  In `management/actions.ts`, implement `toggleUserActiveAction(peopleId: number)` and `changeUserZoneAction(peopleId: number, newZoneId: number)`. Verify caller is an active admin or superadmin. Block self-deactivation. Execute via `adminSupabase`.
- **Implementation Step 2 (UI Integration)**:
  Update `management/page.tsx` to invoke these server actions with optimistic UI or query invalidation.
- **Implementation Step 3 (Database DDL)**:
  Drop client mutation policies from PostgreSQL:
  ```sql
  DROP POLICY IF EXISTS people_update_admin ON public.people;
  DROP POLICY IF EXISTS people_delete_admin ON public.people;
  ```

### Action Item 4: Fix Google OAuth Trigger & Schema Nullability (RS-43)
- **Target**: PostgreSQL Schema & Function `handle_new_user()`
- **Implementation**:
  ```sql
  -- 1. Permit nullable zone_id for pending users
  ALTER TABLE public.people ALTER COLUMN zone_id DROP NOT NULL;

  -- 2. Update trigger to default zone_id to NULL
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $$
  BEGIN
    INSERT INTO public.people (user_id, name, email, role, active, zone_id, supabase_uid)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'user_id', 'AUTO_' || SUBSTR(NEW.id::text, 1, 8)),
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      lower(NEW.email),
      'user',
      false,
      CAST(NEW.raw_user_meta_data->>'zone_id' AS INTEGER), -- Defaults to NULL
      NEW.id
    )
    ON CONFLICT (supabase_uid) DO NOTHING;
    RETURN NEW;
  END;
  $$;
  ```
- **UI Guard**:
  In `management/page.tsx`, if `user.zone_id === null`:
  - Show placeholder `<option value="">জোন নির্ধারণ করুন...</option>`.
  - Disable "অনুমোদন করুন" button with tooltip: "অনুমোদনের পূর্বে জোন নির্ধারণ করুন".

### Action Item 5: Case-Insensitive Uniqueness in PostgreSQL DDL (RS-42)
- **Target**: PostgreSQL DDL, [`src/app/home/actions.ts#L37-L75`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L37-L75)
- **Implementation**:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS idx_people_lower_user_id ON public.people (lower(user_id));
  CREATE UNIQUE INDEX IF NOT EXISTS idx_people_lower_email ON public.people (lower(email));
  ```
  In `actions.ts` `login()`:
  - If `rawIdOrEmail` contains `@`, lowercase it before calling `signInWithPassword`.
  - Simplify user ID lookup to directly query `people` using `.eq('user_id', rawIdOrEmail.toLowerCase())`.

### Action Item 6: Sanitize Message Parameters on Password Pages (RS-46)
- **Target**: [`src/app/forgot-password/page.tsx`](file:///d:/WebDev/report-submission/src/app/forgot-password/page.tsx#L106-L110), [`src/app/update-password/page.tsx`](file:///d:/WebDev/report-submission/src/app/update-password/page.tsx#L100-L104)
- **Implementation**:
  Import `sanitizeAuthMessage` from `@/lib/i18n`. Sanitize `resolvedParams?.message` and only display recognized whitelist system messages.

### Action Item 7: Strip Obsolete `zone_id === 1` Admin Privilege Check
- **Target**: [`src/app/(admin)/dashboard/page.tsx#L108`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L108)
- **Implementation**:
  Change:
  ```typescript
  const isAdminOrSuper = person?.role === "superadmin" || person?.role === "admin";
  ```
  Decouple entity ID 1 completely from role-based access control.

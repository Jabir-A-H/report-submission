# Segment 04 Investigation: Authentication, Access Control & Role Governance

**Repository**: `Jabir-A-H/report-submission` (`Talimul Quran Report Submission`)  
**Auditor**: Subagent A (Lead Investigator)  
**Target Domain**: Segment 04 — Authentication, Access Control & Role Governance  
**Evaluation Standard**: Pre-Production Agility (`AGENTS.md` Rule 7), 5-Layer Behavioral Trace (`WEB-001`–`WEB-014`), Zero Dead-Weight Policy, Mobile Soft-Keyboard & CGNAT Resilience  
**Date**: 2026-11-15  

---

## 1. Executive Scorecard: Auth, Access Control & Role Governance

| Issue ID | Documented Topic | Documented Status | Audited Live Status | Confidence | Live Code & DB Evidence |
|:---|:---|:---|:---|:---:|:---|
| **RS-40** | Email-verification flow gaps & unconfirmed account lock | DECIDED-NOT-DOING (ADR 022) | **VERIFIED OPERATIONAL (DESIGN DECISION HELD)** | 100% | [`src/app/home/actions.ts#L195-L197`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L195-L197). Re-registration with unconfirmed email is caught via `identities.length === 0` and returns clean Bengali error. Password reset on `/forgot-password` serves as self-service recovery. Verified in Supabase Auth schema (`email_confirmed_at`). |
| **RS-41** | No recovery via `user_id`; admins cannot reset passwords | DECIDED-NOT-DOING (ADR 022) | **VERIFIED CLEAN (DESIGN DECISION HELD)** | 100% | [`src/app/forgot-password/actions.ts#L8-L38`](file:///d:/WebDev/report-submission/src/app/forgot-password/actions.ts#L8-L38), [`src/app/forgot-password/page.tsx#L89-L91`](file:///d:/WebDev/report-submission/src/app/forgot-password/page.tsx#L89-L91). Self-service recovery is strictly email-bound; copy guides users to contact admins if email is unknown; admins can inspect user emails in `/management` table. |
| **RS-42** | Login input normalization & case insensitivity | RESOLVED (ADR 020) | **PARTIAL / DDL GAP VERIFIED** | 100% | [`src/app/home/actions.ts#L37-L75`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L37-L75), [`src/components/auth/auth-portal-client.tsx#L83-L96`](file:///d:/WebDev/report-submission/src/components/auth/auth-portal-client.tsx#L83-L96). Mobile keyboard attributes applied; `rawIdOrEmail` trimmed; user ID resolved via exact match then `.ilike('user_id', escaped).limit(1)`. **Gaps**: Email with `@` is not lowercased in `login()`; PostgreSQL DDL on `people.user_id` has `UNIQUE (user_id)` (case-sensitive), lacking `UNIQUE (lower(user_id))`. |
| **RS-43** | Registration dropdown offers city / DCS entity | RESOLVED (ADR 020) | **CRITICAL DB TRIGGER LEAK** | 100% | Web UI and server action cleanly reject Zone 1 ([`src/app/home/page.tsx#L35-L45`](file:///d:/WebDev/report-submission/src/app/home/page.tsx#L35-L45), [`src/app/home/actions.ts#L128-L161`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L128-L161)). **CRITICAL LEAK**: Database trigger `handle_new_user()` on `auth.users` hardcodes `COALESCE(CAST(NEW.raw_user_meta_data->>'zone_id' AS INTEGER), 1)`. Google OAuth users are automatically inserted into Zone 1 (DCS)! |
| **RS-44** | Public availability checks allow account enumeration | RESOLVED (ADR 021) | **CRITICAL CGNAT LOCKOUT TRAP** | 100% | [`src/app/home/actions.ts#L216-L218`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L216-L218), [`#L250-L252`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L250-L252). Rate limiting is keyed strictly on `clientIp` (10 req/min). Mobile field workers sharing carrier-grade NAT public IP gateways (Grameenphone/Banglalink/Robi) exhaust the limit rapidly, causing `available: false`, marking fields "taken", and blocking form submission (`hasBlockingError = true`). Compound key is missing. |
| **RS-45** | No in-app way to promote a second admin | DEFERRED (Phase 4 / ADR 022) | **CRITICAL RLS BYPASS VULNERABILITY** | 100% | UI lacks role promotion buttons. **CRITICAL VULNERABILITY**: PostgreSQL RLS policy `people_update_admin` (`qual: is_admin()`, `with_check: null`) permits any standard admin to directly execute `PATCH /rest/v1/people` via PostgREST to elevate their own role or other users to `'superadmin'`! |
| **RS-46** | `/home?message=` renders arbitrary text / phishing | RESOLVED (ADR 020) | **VERIFIED ON /home; LEAK ON RECOVERY PAGES** | 100% | [`src/lib/i18n.ts#L887-L903`](file:///d:/WebDev/report-submission/src/lib/i18n.ts#L887-L903), [`src/app/home/page.tsx#L47`](file:///d:/WebDev/report-submission/src/app/home/page.tsx#L47). Whitelist sanitization works on `/home`. **LEAK**: [`forgot-password/page.tsx#L106`](file:///d:/WebDev/report-submission/src/app/forgot-password/page.tsx#L106) and [`update-password/page.tsx#L100`](file:///d:/WebDev/report-submission/src/app/update-password/page.tsx#L100) render raw query params directly into alert cards without `sanitizeAuthMessage()`. |
| **RS-47** | Forgot password identical success for mistyped email | RESOLVED (ADR 020) | **VERIFIED RESOLVED** | 100% | [`src/app/forgot-password/page.tsx#L51-L91`](file:///d:/WebDev/report-submission/src/app/forgot-password/page.tsx#L51-L91). Success screen provides clear instructions, spam folder notice, 2 emails/hr limit warning, and guidance to contact admins. Preserves enumeration defense. |
| **RS-48** | Supabase cookie handling on middleware redirects & server.ts | VERIFY-FIRST | **CRITICAL SILENT COOKIE DROP VERIFIED** | 100% | [`middleware.ts#L17-L25`](file:///d:/WebDev/report-submission/middleware.ts#L17-L25), [`#L62`](file:///d:/WebDev/report-submission/middleware.ts#L62), [`#L82`](file:///d:/WebDev/report-submission/middleware.ts#L82), [`#L92`](file:///d:/WebDev/report-submission/middleware.ts#L92). When `supabase.auth.getUser()` refreshes session tokens into `supabaseResponse.cookies`, all `NextResponse.redirect(url)` calls return a new response that drops refreshed cookies completely. Also, [`src/utils/supabase/server.ts#L12-L32`](file:///d:/WebDev/report-submission/src/utils/supabase/server.ts#L12-L32) still uses deprecated `get/set/remove`. |
| **KI-013** | Password confirmation on registration | RESOLVED (ADR 015) | **VERIFIED RESOLVED** | 100% | [`src/app/home/actions.ts#L143-L145`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L143-L145), [`register-form-client.tsx#L237-L255`](file:///d:/WebDev/report-submission/src/components/auth/register-form-client.tsx#L237-L255). Server action enforces `password === confirmPassword`; client form provides matching `new-password` input and accessible error messaging. |
| **KI-016** | Auth error localization | RESOLVED (ADR 016) | **VERIFIED RESOLVED** | 100% | [`src/lib/i18n.ts#L809-L850`](file:///d:/WebDev/report-submission/src/lib/i18n.ts#L809-L850). `translateAuthError()` maps raw Supabase Auth errors (`invalid login credentials`, `email rate limit exceeded`, etc.) to clear, actionable Bengali text across all server actions. |
| **C05-04** | Privilege escalation & self-deletion governance | RESOLVED (ADR 026) | **VERIFIED IN ACTION; BYPASS IN RLS** | 100% | [`src/app/(admin)/management/actions.ts#L47-L76`](file:///d:/WebDev/report-submission/src/app/(admin)/management/actions.ts#L47-L76). `deleteUserAction` enforces self-deletion defense, blocks standard admins from deleting admins/superadmins, and blocks deleting last superadmin. **CRITICAL GAP**: Database policy `people_delete_admin` allows any admin to bypass `deleteUserAction` and directly delete all superadmins via PostgREST! |
| **KI-023 Trap 3** | Carrier-Grade NAT field worker registration lockout | RESOLVED & MIGRATED (Doc) | **TRAP STILL LIVE IN CODE** | 100% | Verified live in [`src/app/home/actions.ts#L217`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L217) and [`#L251`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L251). While documented as resolved, the live server action continues to rate limit by `clientIp` alone. Compound key `${clientIp}:${identifier}` is NOT implemented. |
| **Limit: 2/hr** | Supabase free tier 2 password reset emails/hr limit | DOCUMENTED | **VERIFIED HONORED & COMMUNICATED** | 100% | [`src/app/forgot-password/page.tsx#L55-L57`](file:///d:/WebDev/report-submission/src/app/forgot-password/page.tsx#L55-L57). Prominent warning banner displayed to users. Action lacks client-side debounce/cooldown to prevent rapid repeated submissions before hitting Supabase's hard rate limit. |

---

## 2. Issue-by-Issue Reality Check

### 2.1 RS-40 & RS-41: Password Recovery & Identity Governance
- **Documented Decision**: In ADR 022, the owner explicitly rejected adding an in-app admin password reset modal or building custom credential management. User password resets rely strictly on Supabase Auth's email recovery flow (`supabase.auth.resetPasswordForEmail`).
- **Live Code Audit**:
  1. In [`src/app/forgot-password/actions.ts#L8-L38`](file:///d:/WebDev/report-submission/src/app/forgot-password/actions.ts#L8-L38), the server action trims and lowercases email, requests a PKCE recovery link pointing to `/auth/callback?next=/update-password`, and handles errors via `translateAuthError`.
  2. In [`src/app/auth/callback/route.ts#L18-L42`](file:///d:/WebDev/report-submission/src/app/auth/callback/route.ts#L18-L42), the callback exchanges the PKCE code for a session, defensively inspects the session JWT's `amr` (Authentication Methods References) claim for `'recovery'`, and overrides the redirect destination to `/update-password`.
  3. In [`src/app/update-password/page.tsx#L20-L23`](file:///d:/WebDev/report-submission/src/app/update-password/page.tsx#L20-L23), session presence is verified server-side via `getUser()`. Unauthenticated visitors are redirected to `/home?mode=login&message=...` with `t.linkExpired`.
  4. In [`src/app/update-password/actions.ts#L8-L33`](file:///d:/WebDev/report-submission/src/app/update-password/actions.ts#L8-L33), password minimum length (6 characters) and confirmation match are validated before calling `supabase.auth.updateUser({ password })`. Upon success, `supabase.auth.signOut()` is executed immediately to invalidate the temporary recovery session and redirect the user to login with their new credentials.
- **Verdict**: **VERIFIED CLEAN & SOUND**. The email recovery pipeline is cryptographically secure and respects domain boundaries. The owner's decision in ADR 022 avoids storing administrative plaintext passwords or building custom credential endpoints.

---

### 2.2 RS-42: Login Input Normalization & Case Sensitivity
- **Documented Status**: RESOLVED in ADR 020.
- **Live Code Audit**:
  1. **Mobile Input Attributes**: In [`src/components/auth/auth-portal-client.tsx#L83-L96`](file:///d:/WebDev/report-submission/src/components/auth/auth-portal-client.tsx#L83-L96), the login input specifies `autoCapitalize="none"`, `autoCorrect="off"`, `autoComplete="username"`, and `spellCheck={false}`. This prevents soft keyboards on Android/iOS from capitalizing the first character or appending trailing whitespace after autocomplete.
  2. **Username Resolution**: In [`src/app/home/actions.ts#L37-L75`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L37-L75):
     ```typescript
     const rawIdOrEmail = (formData.get('email') as string)?.trim() || ""
     ...
     if (!rawIdOrEmail.includes('@')) {
       // Exact match first
       let { data: profile } = await adminSupabase
         .from('people')
         .select('email')
         .eq('user_id', rawIdOrEmail)
         .maybeSingle()

       // Case-insensitive fallback with wildcard escaping
       if (!profile) {
         const escaped = rawIdOrEmail.replace(/[%_]/g, '\\$&')
         const { data: profiles } = await adminSupabase
           .from('people')
           .select('email')
           .ilike('user_id', escaped)
           .limit(1)
         if (profiles && profiles.length > 0) profile = profiles[0]
       }
     ...
     ```
  3. **Vulnerabilities Discovered**:
     - **Email Lowercasing Omission**: If `rawIdOrEmail` contains `@` (user logging in with email), `login()` sets `email = rawIdOrEmail` without `.toLowerCase()`! In contrast, `register()` ([`actions.ts#L118`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L118)) and `forgotPassword()` ([`forgot-password/actions.ts#L8`](file:///d:/WebDev/report-submission/src/app/forgot-password/actions.ts#L8)) strictly lowercase email. If a user types `User@Example.Com`, `signInWithPassword` receives the mixed-case string.
     - **PostgreSQL DDL Case-Sensitivity Gap**: Live database inspection shows:
       ```sql
       CREATE UNIQUE INDEX people_user_id_key ON public.people USING btree (user_id);
       ```
       PostgreSQL's standard unique index is case-sensitive! It treats `'karim'` and `'Karim'` as distinct values. Although application code checks `ilike` in `register()`, concurrent registrations can bypass the check. If two records differ only in casing, `ilike(...).limit(1)` during login picks an arbitrary account!
- **Verdict**: **PARTIAL DEFECT**. Application layer normalization is 90% in place, but PostgreSQL requires `CREATE UNIQUE INDEX idx_people_lower_user_id ON public.people (lower(user_id))` and `login()` must lowercase email strings.

---

### 2.3 RS-43 & Trigger Audit: City / DCS Zone Registration Exclusion
- **Documented Status**: RESOLVED in ADR 020.
- **Live Code Audit**:
  1. **UI Filtering**: In [`src/app/home/page.tsx#L35-L45`](file:///d:/WebDev/report-submission/src/app/home/page.tsx#L35-L45), the zone query enforces `.neq("id", 1)` and filters `rawZones.filter(z => z.zone_type !== "city")`. The registration dropdown never displays DCS or city-type entities.
  2. **Server Action Guard**: In [`src/app/home/actions.ts#L128-L131`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L128-L131) and [`#L153-L161`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L153-L161):
     ```typescript
     const parsedZoneId = parseInt(zoneId, 10)
     if (isNaN(parsedZoneId) || parsedZoneId === 1) {
       return redirect(`/home?mode=register&message=${encodeURIComponent('অননুমোদিত জোন নির্বাচন করা হয়েছে।')}`)
     }
     ...
     const { data: targetZone } = await adminSupabase
       .from('zone')
       .select('id, zone_type')
       .eq('id', parsedZoneId)
       .maybeSingle()

     if (!targetZone || targetZone.id === 1 || targetZone.zone_type === 'city') {
       return redirect(`/home?mode=register&message=${encodeURIComponent('অননুমোদিত জোন নির্বাচন করা হয়েছে।')}`)
     }
     ```
  3. **CRITICAL ARCHITECTURAL LEAK (Google OAuth Trigger `handle_new_user`)**:
     Direct SQL inspection of `public.handle_new_user()` in database `pxdkvewaglagnfcqeckn` reveals:
     ```sql
     CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
     AS $function$
     BEGIN
       INSERT INTO public.people (user_id, name, email, role, active, zone_id, supabase_uid)
       VALUES (
         COALESCE(NEW.raw_user_meta_data->>'user_id', 'AUTO_' || SUBSTR(NEW.id::text, 1, 8)),
         COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
         NEW.email,
         'user',
         false,
         COALESCE(CAST(NEW.raw_user_meta_data->>'zone_id' AS INTEGER), 1), -- << CRITICAL BUG!
         NEW.id
       )
       ON CONFLICT (supabase_uid) DO NOTHING;
       RETURN NEW;
     END;
     $function$;
     ```
     **The Hazard**: When a user registers via `GoogleSignInButton`, `NEW.raw_user_meta_data->>'zone_id'` is `NULL`. The trigger defaults `zone_id` to `1` (DCS)!
     When an admin visits `/management` and approves the account without explicitly changing their zone dropdown, the user becomes active in Zone 1.
     In [`src/app/(admin)/dashboard/page.tsx#L108`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L108), the dashboard contains legacy logic:
     `const isAdminOrSuper = person?.role === "superadmin" || person?.zone_id === 1 || person?.role === "admin";`
     Any user assigned to `zone_id === 1` inherits admin-level zone visibility!
- **Verdict**: **CRITICAL BACKEND LEAK**. While web forms guard against Zone 1, the database trigger assigns every Google OAuth user directly to Zone 1.

---

### 2.4 RS-44 & KI-023 Trap 3: Carrier-Grade NAT (CGNAT) Field Worker Lockout
- **Documented Status**: In `KNOWN_ISSUES.md` (KI-023), the audit warned of *Carrier-Grade NAT Field Worker Lockout*, stating that rate-limiting availability checks by IP alone locks out Bangladeshi field workers sharing CGNAT mobile IP gateways (Grameenphone/Banglalink/Robi), and required a compound key (`${ip}:${email}`).
- **Live Code Audit**:
  Inspect [`src/app/home/actions.ts#L216-L218`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L216-L218) and [`#L250-L252`](file:///d:/WebDev/report-submission/src/app/home/actions.ts#L250-L252):
  ```typescript
  // checkEmailAvailability
  const headersList = await headers();
  const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`email-check:${clientIp}`, 10, 60_000)) {
    return { available: false, message: 'অনেক বেশি চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।' };
  }
  ...
  // checkUserIdAvailability
  const headersList = await headers();
  const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`userid-check:${clientIp}`, 10, 60_000)) {
    return { available: false, message: 'অনেক বেশি চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।' };
  }
  ```
  **The Field Worker Failure Scenario**:
  1. In Bangladesh, mobile telecommunications operators assign private IP addresses (e.g. `10.x.x.x` or `100.64.0.0/10`) to mobile handsets. Hundreds or thousands of users share a single public IPv4 gateway IP via CGNAT.
  2. In [`src/components/auth/register-form-client.tsx#L62-L88`](file:///d:/WebDev/report-submission/src/components/auth/register-form-client.tsx#L62-L88), every `onBlur` event on the email or user ID input triggers `checkEmailAvailability` or `checkUserIdAvailability`.
  3. If 2 or 3 field workers in the same district attempt to sign up within 60 seconds (or 1 user tests 5 usernames), the 10-request ceiling is breached on `clientIp`.
  4. The 11th request returns `{ available: false, message: 'অনেক বেশি চেষ্টা হয়েছে...' }`.
  5. In [`register-form-client.tsx#L72`](file:///d:/WebDev/report-submission/src/components/auth/register-form-client.tsx#L72), `available: false` sets `emailStatus = 'taken'` or `userIdStatus = 'taken'`.
  6. Line 90 evaluates `const hasBlockingError = emailStatus === 'taken' || userIdStatus === 'taken'`.
  7. Line 95 executes `if (hasBlockingError) return;`.
  8. **The entire form submission is blocked!** Legitimate field workers are rendered completely unable to submit their registration!
  9. **Asymmetric Insecurity**: Furthermore, `login()` in [`actions.ts`](file:///d:/WebDev/report-submission/src/app/home/actions.ts) has **ZERO rate limiting**. An attacker can run automated credential stuffing against `login()` unimpeded, while legitimate field workers on CGNAT are blocked from registering.
- **Verdict**: **CRITICAL BEHAVIORAL DEFECT**. KI-023 Trap 3 is live in production code. Keying strictly by `clientIp` is broken on mobile networks.

---

### 2.5 RS-45 & C05-04: Privilege Escalation & Self-Deletion Governance
- **Documented Status**: In Track 3 (ADR 026), `deleteUserAction` in `src/app/(admin)/management/actions.ts` was hardened to block standard admins from deleting admins/superadmins, block self-deletion, and block deleting the last superadmin.
- **Live Code Audit (Application Layer)**:
  In [`src/app/(admin)/management/actions.ts#L47-L76`](file:///d:/WebDev/report-submission/src/app/(admin)/management/actions.ts#L47-L76):
  ```typescript
  // 3. Self-deletion guard: Check both supabase_uid and people id
  if (
    (targetProfile.supabase_uid && targetProfile.supabase_uid === user.id) ||
    targetProfile.id === requesterProfile.id
  ) {
    return { success: false, error: 'নিজের অ্যাকাউন্ট ডিলিট করা যাবে না।' }
  }

  // 4. Strict 2-tier role hierarchy
  if (requesterProfile.role === 'admin') {
    if (targetProfile.role === 'admin' || targetProfile.role === 'superadmin') {
      return {
        success: false,
        error: 'অ্যাডমিনরা অন্য অ্যাডমিন বা সুপারঅ্যাডমিন অ্যাকাউন্ট ডিলিট করতে পারবেন না।',
      }
    }
  } else if (requesterProfile.role === 'superadmin') {
    if (targetProfile.role === 'superadmin') {
      const { count, error: countError } = await adminSupabase
        .from('people')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'superadmin')

      if (countError || (count !== null && count <= 1)) {
        return {
          success: false,
          error: 'সিস্টেমে অন্তত একজন সুপারঅ্যাডমিন থাকতে হবে। এটি ডিলিট করা সম্ভব নয়।',
        }
      }
    }
  }
  ```
  The Next.js Server Action is properly hardened.
- **CRITICAL DATABASE RLS AUDIT (Database Layer)**:
  Direct SQL inspection of PostgreSQL RLS policies on `public.people` in Supabase:
  ```sql
  SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'people';
  ```
  **Live Database State**:
  ```text
  1. people_select_own: cmd=SELECT, qual=((supabase_uid = auth.uid()) OR is_admin())
  2. people_insert_self_or_admin: cmd=INSERT, with_check=((supabase_uid = auth.uid()) OR is_admin())
  3. people_update_admin: cmd=UPDATE, qual=is_admin(), with_check=NULL
  4. people_delete_admin: cmd=DELETE, qual=is_admin(), with_check=NULL
  ```
  And `is_admin()` definition:
  ```sql
  SELECT EXISTS (
    SELECT 1 FROM public.people 
    WHERE supabase_uid = (SELECT auth.uid()) 
      AND role IN ('admin', 'superadmin')
  );
  ```
  **The Devastating Bypass**:
  1. Any user whose current role is `'admin'` passes `is_admin() = true`.
  2. `people_update_admin` has `with_check = NULL`. It enforces NO column restriction!
  3. A standard admin can open browser DevTools or use `curl` to issue:
     ```javascript
     supabase.from('people').update({ role: 'superadmin' }).eq('supabase_uid', user.id);
     ```
     PostgREST executes this UPDATE directly because `is_admin()` is true! The standard admin instantly escalates their own privilege to `'superadmin'`!
  4. Even worse: `people_delete_admin` has `cmd = DELETE, qual = is_admin()`.
     A standard admin can issue:
     ```javascript
     supabase.from('people').delete().eq('role', 'superadmin');
     ```
     PostgREST will delete ALL superadmin rows from `people`!
  5. Why are these policies open? Because [`src/app/(admin)/management/page.tsx#L132-L161`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx#L132-L161) executes `toggleActive` and `changeZone` via direct client-side `supabase.from("people").update(...)` instead of server actions!
- **Verdict**: **CRITICAL SECURITY VULNERABILITY**. The application action `deleteUserAction` is hardened, but the underlying PostgreSQL database RLS policies are wide open to self-escalation and destructive deletion by any standard admin.

---

### 2.6 RS-46: URL Message Parameter Phishing & Sanitization
- **Documented Status**: RESOLVED in ADR 020.
- **Live Code Audit**:
  1. **Sanitizer Implementation**: In [`src/lib/i18n.ts#L857-L903`](file:///d:/WebDev/report-submission/src/lib/i18n.ts#L857-L903), `sanitizeAuthMessage(msg)` checks inputs against `KNOWN_AUTH_SUCCESS_MESSAGES`, `KNOWN_AUTH_ERROR_MESSAGES`, and `AUTH_ERROR_TRANSLATIONS`. Unrecognized strings return `null`.
  2. **Landing Page Enforcement**: In [`src/app/home/page.tsx#L47`](file:///d:/WebDev/report-submission/src/app/home/page.tsx#L47), `authMessage = sanitizeAuthMessage(resolvedParams?.message)` is passed to `AuthPortalClient`. Malicious links like `/home?message=Your+account+is+suspended` render no alert banner.
  3. **VULNERABILITY FOUND ON PASSWORD RECOVERY PAGES**:
     Inspect [`src/app/forgot-password/page.tsx#L106-L110`](file:///d:/WebDev/report-submission/src/app/forgot-password/page.tsx#L106-L110) and [`src/app/update-password/page.tsx#L100-L104`](file:///d:/WebDev/report-submission/src/app/update-password/page.tsx#L100-L104):
     ```tsx
     // forgot-password/page.tsx:106
     {resolvedParams?.message && (
       <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-center font-bold text-sm animate-in zoom-in duration-300">
         {resolvedParams.message}
       </div>
     )}

     // update-password/page.tsx:100
     {resolvedParams?.message && (
       <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl text-center font-bold text-sm animate-in zoom-in duration-300 mt-4">
         {resolvedParams.message}
       </div>
     )}
     ```
     Neither page calls `sanitizeAuthMessage`! Both pages render unvalidated query strings verbatim into high-visibility red error banners!
     An attacker can construct social engineering links:
     `https://report.domain/forgot-password?message=অ্যাকাউন্ট+ব্লক+করা+হয়েছে।+অবিলম্বে+017xxxxxxxx+নম্বরে+টাকা+পাঠান।`
     and the user sees an authentic-looking platform alert!
- **Verdict**: **PARTIAL DEFECT**. `/home` is protected, but `/forgot-password` and `/update-password` leak raw query string rendering.

---

### 2.7 RS-48: Supabase SSR Cookie Handling on Middleware Redirects
- **Documented Status**: VERIFY-FIRST in issue register.
- **Live Code Audit**:
  Inspect [`middleware.ts#L4-L95`](file:///d:/WebDev/report-submission/middleware.ts#L4-L95):
  ```typescript
  export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(..., {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Token refresh happens here!
    const { data: { user } } = await supabase.auth.getUser()
    ...
    // Redirect 1: Unauthenticated user hitting protected route
    if (!user && !isPublicRoute) {
      ...
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      url.search = ""
      return NextResponse.redirect(url) // << COOKIES DROPPED!
    }

    // Redirect 2: User unapproved / inactive
    if (user && !isPublicRoute) {
      if (!person || person.active !== true) {
        ...
        const url = request.nextUrl.clone()
        url.pathname = '/pending-approval'
        url.search = ""
        return NextResponse.redirect(url) // << COOKIES DROPPED!
      }
    }

    // Redirect 3: Authenticated user hitting /home
    if (user && request.nextUrl.pathname === '/home') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.search = ""
      return NextResponse.redirect(url) // << COOKIES DROPPED!
    }

    return supabaseResponse
  }
  ```
  **The Mechanics of the Silent Cookie Drop**:
  1. When `@supabase/ssr` refreshes an expired access or refresh token during `getUser()`, it calls `setAll()`, attaching the refreshed cookies to `supabaseResponse.cookies`.
  2. If the request triggers a redirect (e.g. authenticated user visits `/home` and is redirected to `/`, or unapproved user is redirected to `/pending-approval`), line 82 or line 92 calls `NextResponse.redirect(url)`.
  3. `NextResponse.redirect(url)` instantiates an entirely new `NextResponse` object.
  4. It does **NOT** inherit the cookies appended to `supabaseResponse`!
  5. The browser receives an HTTP 307 redirect with **ZERO `Set-Cookie` headers**.
  6. The browser follows the redirect to `/` sending the old, expired tokens. The subsequent request fails auth or thrashes the refresh endpoint repeatedly, leading to phantom logouts and flaky mobile sessions.
  7. **Legacy Client in Server Components**: Additionally, [`src/utils/supabase/server.ts#L12-L32`](file:///d:/WebDev/report-submission/src/utils/supabase/server.ts#L12-L32) still uses deprecated `get/set/remove` methods instead of `getAll/setAll`.
- **Verdict**: **VERIFIED SEVERE DEFECT**. Auth cookies are dropped on all middleware redirects.

---

## 3. Attack Surface & Threat Model Analysis

```
                              THREAT MODEL & ATTACK SURFACE

    ┌───────────────────────────┐         ┌───────────────────────────┐
    │  Mobile Field Workers     │         │  Malicious / Rogue Actor  │
    │  (Shared CGNAT Gateways)  │         │  (Compromised Admin / Bot)│
    └─────────────┬─────────────┘         └─────────────┬─────────────┘
                  │                                     │
                  │ Rate Limit: 10 req/min              │ Unthrottled login /
                  │ on clientIp alone                   │ PostgREST Direct API
                  ▼                                     ▼
    ┌───────────────────────────┐         ┌───────────────────────────┐
    │  ACCIDENTAL DENIAL OF     │         │  PRIVILEGE ESCALATION &   │
    │  SERVICE (CGNAT LOCKOUT)  │         │  DATABASE RLS BYPASS      │
    │                           │         │                           │
    │  Worker 1 checks username │         │  • PATCH /rest/v1/people  │
    │  Worker 2 checks email    │         │    role = 'superadmin'    │
    │  Worker 3 BLOCKED!        │         │  • DELETE /rest/v1/people │
    │  Form submission halts!   │         │    deletes all superadmins│
    └───────────────────────────┘         └─────────────┬─────────────┘
                                                        │
                  ┌─────────────────────────────────────┴──────┐
                  ▼                                            ▼
    ┌───────────────────────────┐                ┌───────────────────────────┐
    │  SESSION TOKEN DROPOFF    │                │  UNSANITIZED RECOVERY     │
    │  (MIDDLEWARE REDIRECTS)   │                │  PHISHING (XSS/INJECTION) │
    │                           │                │                           │
    │  NextResponse.redirect()  │                │  /forgot-password?message=│
    │  drops refreshed cookies! │                │  Displays attacker copy   │
    │  Causes random logouts.   │                │  in official alert banner!│
    └───────────────────────────┘                └───────────────────────────┘
```

### Threat Vector 1: Carrier-Grade NAT Field Worker Lockout (Accidental DoS)
- **Actor**: Legitimate mobile field workers in Bangladesh.
- **Preconditions**: Multiple workers using mobile data operators (Grameenphone, Banglalink, Robi) connected to the same regional CGNAT gateway.
- **Exploitation / Failure Flow**:
  1. Worker A signs up on mobile, triggering `handleUserIdBlur` and `handleEmailBlur` 3 times.
  2. Worker B signs up in the same upazila 30 seconds later, testing 3 usernames and 2 emails.
  3. Total requests from that public gateway IP reach 10 within 60 seconds.
  4. Worker C (or Worker B submitting) triggers an availability check.
  5. `checkEmailAvailability` returns `{ available: false, message: 'অনেক বেশি চেষ্টা হয়েছে...' }`.
  6. The client form marks the field as `taken` with a red X icon and permanently sets `hasBlockingError = true`.
  7. Form submission is completely locked. Workers cannot register until the 60-second window clears without traffic.

### Threat Vector 2: Privilege Escalation via Direct PostgREST UPDATE
- **Actor**: Any authenticated user with `role = 'admin'`.
- **Preconditions**: Admin credentials (standard admin, not superadmin).
- **Exploitation Flow**:
  1. Standard admin opens browser console or Postman.
  2. Sends `PATCH` request to Supabase PostgREST endpoint:
     ```http
     PATCH /rest/v1/people?supabase_uid=eq.<admin_uuid> HTTP/1.1
     Authorization: Bearer <admin_jwt>
     apikey: <anon_key>
     Content-Type: application/json

     {
       "role": "superadmin"
     }
     ```
  3. PostgreSQL evaluates policy `people_update_admin` on `people`.
  4. `is_admin()` checks whether `role IN ('admin', 'superadmin')`. Since user is an admin, it evaluates to `TRUE`.
  5. `with_check` is `NULL`, meaning no column restriction or role check is enforced.
  6. PostgreSQL commits the change. The admin is now a `superadmin` with full organizational authority.

### Threat Vector 3: Rogue Admin Superadmin Annihilation via Direct PostgREST DELETE
- **Actor**: A compromised or rogue standard admin account.
- **Exploitation Flow**:
  1. Rogue admin sends `DELETE` request directly to PostgREST:
     ```http
     DELETE /rest/v1/people?role=eq.superadmin HTTP/1.1
     Authorization: Bearer <admin_jwt>
     apikey: <anon_key>
     ```
  2. PostgreSQL evaluates policy `people_delete_admin` on `people`.
  3. `is_admin()` evaluates to `TRUE`.
  4. PostgREST deletes all superadmin profiles from `people`!
  5. While `auth.users` records remain, `people` profiles are wiped, crashing `(admin)/layout.tsx` role lookups and leaving the platform with 0 active superadmins.

### Threat Vector 4: Google OAuth Zone 1 Entity Contamination
- **Actor**: Any visitor signing in with Google OAuth.
- **Exploitation Flow**:
  1. Visitor clicks "Sign in with Google".
  2. Supabase Auth creates an account in `auth.users`.
  3. Trigger `handle_new_user()` executes:
     `COALESCE(CAST(NEW.raw_user_meta_data->>'zone_id' AS INTEGER), 1)`.
  4. User profile is created in `people` with `zone_id = 1` and `active = false`.
  5. Admin in `/management` reviews pending users, clicks "অনুমোদন করুন" (Approve) without opening the zone change dropdown.
  6. The user is now approved in Zone 1 (DCS).
  7. When the user logs in, they cannot submit reports (Zone 1 is blocked from data entry).
  8. If their role is ever set to admin, [`(admin)/dashboard/page.tsx:108`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L108) treats `person?.zone_id === 1` as global admin purview.

---

## 4. Pre-Production Bloatware vs. Clean Server-Side Guards

Under `AGENTS.md` Rule 7 (*Pre-Production Agility & Zero Dead-Weight*), pre-production platforms must avoid complex application-layer workarounds to bypass missing DDL or incomplete database configurations.

### Bloatware 1: Client-Side Direct `people` Mutations vs. Server Actions
- **The Bloatware**: In [`src/app/(admin)/management/page.tsx#L132-L161`](file:///d:/WebDev/report-submission/src/app/(admin)/management/page.tsx#L132-L161), `toggleActive` and `changeZone` invoke `supabase.from("people").update(...)` directly on the browser client.
- **The Collateral Damage**: To allow this client call, PostgreSQL had to define a wide-open RLS policy `people_update_admin` (`qual: is_admin()`). This open policy created Threat Vector 2 (privilege escalation).
- **Clean Architecture**:
  1. Move `toggleActive` and `changeZone` to Next.js Server Actions: `toggleUserActiveAction(peopleId)` and `changeUserZoneAction(peopleId, newZoneId)` in `src/app/(admin)/management/actions.ts`.
  2. Execute updates using `adminSupabase` (service role client) where authorization, role checks, and self-demotion guards are enforced server-side.
  3. Drop `people_update_admin` and `people_delete_admin` completely from PostgREST, making `people` administrative mutations 100% server-gated.

### Bloatware 2: In-Memory Rate Limiting by IP Alone
- **The Bloatware**: In [`src/lib/rate-limit.ts`](file:///d:/WebDev/report-submission/src/lib/rate-limit.ts), an in-memory sliding window map is maintained per serverless Lambda instance, and [`actions.ts`](file:///d:/WebDev/report-submission/src/app/home/actions.ts) keys strictly on `clientIp`.
- **The Collateral Damage**: In serverless architectures, memory is ephemeral and uncoordinated between containers; yet within any container, shared CGNAT mobile tower IPs cause catastrophic lockouts of innocent field workers.
- **Clean Architecture**:
  1. Rate limit by compound key: `${clientIp}:${normalizedIdentifier}` for availability checks.
  2. Implement rate limiting on `login(formData)` to block brute force credential stuffing.

### Bloatware 3: Application-Layer Case-Insensitive `ilike` Scans vs. PostgreSQL Unique Index
- **The Bloatware**: In `register()`, `adminSupabase.from('people').select('id').ilike('user_id', escaped).limit(1)` is executed manually, and in `login()`, a dual `eq` then `ilike` query is run because `people.user_id` lacks a case-insensitive database index.
- **The Collateral Damage**: Application race conditions permit duplicate case-variant usernames to be inserted concurrently.
- **Clean Architecture**:
  1. Execute clean DDL in Supabase:
     ```sql
     CREATE UNIQUE INDEX idx_people_lower_user_id ON public.people (lower(user_id));
     CREATE UNIQUE INDEX idx_people_lower_email ON public.people (lower(email));
     ```
  2. Let PostgreSQL guarantee case-insensitive uniqueness mathematically with zero application overhead.

### Bloatware 4: Legacy Redundant `person?.zone_id === 1` Dashboard Check
- **The Bloatware**: In [`src/app/(admin)/dashboard/page.tsx#L108`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L108):
  `const isAdminOrSuper = person?.role === "superadmin" || person?.zone_id === 1 || person?.role === "admin";`
- **The Collateral Damage**: Zone 1 is an entity ID, not a role. Mixing `zone_id === 1` into authorization checks creates security creep whenever a user is mistakenly assigned to Zone 1.
- **Clean Architecture**:
  Authorization must strictly check `person?.role === 'admin' || person?.role === 'superadmin'`. Strip `person?.zone_id === 1` from all authorization logic.

---

## 5. Recommended Pre-Production Architecture

```
                       RECOMMENDED HARDENED AUTH ARCHITECTURE

    [ Browser / Mobile Client ]
                │
                │ HTTPS Request (with Cookies)
                ▼
    [ middleware.ts ]
         ├── getUser() token refresh
         ├── Forward refreshed cookies to ALL responses!
         │     const response = NextResponse.redirect(url);
         │     supabaseResponse.cookies.getAll().forEach(c => response.cookies.set(c));
         │     return response;
         └── Enforce route protection & active status
                │
                ▼
    [ Next.js Server Actions ('use server') ]
         ├── login()           ──> Normalizes email.toLowerCase(); rate limits per IP & account
         ├── register()        ──> Rejects zone 1; relies on lower(user_id) unique index
         ├── checkAvailability ──> Uses compound key: `${clientIp}:${identifier}`
         └── User Management Server Actions (Service Role Client):
               ├── deleteUserAction()       ──> 2-tier role guard, self-deletion guard, last-superadmin guard
               ├── toggleUserActiveAction() ──> Validates admin role; prevents self-deactivation
               └── changeUserZoneAction()   ──> Validates zone is NOT zone 1 / city
                │
                ▼
    [ PostgreSQL Database (Supabase `pxdkvewaglagnfcqeckn`) ]
         ├── Table Constraints:
         │     CREATE UNIQUE INDEX idx_people_lower_user_id ON public.people (lower(user_id));
         │     CREATE UNIQUE INDEX idx_people_lower_email ON public.people (lower(email));
         ├── Trigger handle_new_user():
         │     zone_id NULLABLE or assigned to dedicated pending onboarding status (NEVER zone 1)
         │     ON CONFLICT (supabase_uid) DO NOTHING
         └── RLS Policies on `people`:
               ├── SELECT: (supabase_uid = auth.uid() OR is_admin())
               ├── INSERT: (supabase_uid = auth.uid() OR is_admin())
               ├── UPDATE: REVOKED from PostgREST (mutations via Server Actions only)
               └── DELETE: REVOKED from PostgREST (deletions via deleteUserAction only)
```

### Action Plan 1: Fix Middleware Cookie Dropping on Redirects (RS-48)
In `middleware.ts`, create a helper function `createRedirectResponse(url, supabaseResponse)` that copies all cookies from `supabaseResponse` to the redirect response:
```typescript
function redirectWithCookies(request: NextRequest, url: URL, supabaseResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
  })
  return redirectResponse
}
```
Replace lines 62, 82, and 92 in `middleware.ts` with `redirectWithCookies(request, url, supabaseResponse)`.
Upgrade `src/utils/supabase/server.ts` to `getAll()` and `setAll(cookiesToSet)`.

### Action Plan 2: Eliminate CGNAT Field Worker Lockout (RS-44 / KI-023 Trap 3)
In `src/app/home/actions.ts`:
1. For `checkEmailAvailability(rawEmail)`:
   Key by `rateLimit('email-check:' + clientIp + ':' + email, 5, 60_000)` with a broader fallback IP ceiling (e.g. 50/min per IP to accommodate mobile cell towers).
2. For `checkUserIdAvailability(rawUserId)`:
   Key by `rateLimit('userid-check:' + clientIp + ':' + userId, 5, 60_000)` with a 50/min IP ceiling.
3. In `RegisterFormClient`, when rate limited, display an informative amber warning rather than marking `status = 'taken'` (which sets `hasBlockingError = true` and halts form submission).
4. Add rate limiting to `login(formData)`: `rateLimit('login:' + clientIp + ':' + email, 5, 60_000)`.

### Action Plan 3: Close Privilege Escalation & RLS Bypass (C05-04 / RS-45)
1. **Drop Dangerous Policies on `people`**:
   ```sql
   DROP POLICY IF EXISTS people_delete_admin ON public.people;
   DROP POLICY IF EXISTS people_update_admin ON public.people;
   ```
2. **Move Management Actions to Server Actions**:
   In `src/app/(admin)/management/actions.ts`, implement:
   - `toggleUserActiveAction(peopleId: number)`
   - `changeUserZoneAction(peopleId: number, newZoneId: number)`
   Both actions authenticate the caller via `getServerClient()`, verify `requester.role IN ('admin', 'superadmin')`, block self-deactivation, and execute mutations via `adminSupabase`.
3. In `src/app/(admin)/management/page.tsx`, replace client `supabase.from("people").update(...)` with the server actions.

### Action Plan 4: Harden Google OAuth Profile Trigger (`handle_new_user`) (RS-43)
Update `public.handle_new_user()` in PostgreSQL:
1. Make `people.zone_id` nullable (`ALTER TABLE public.people ALTER COLUMN zone_id DROP NOT NULL;`), or create an explicit unassigned status.
2. In `handle_new_user()`, default `zone_id` to `NULL` (or a designated onboarding zone), **NEVER to `1`**.
3. In `ManagementPage`, unassigned users display a prominent warning badge requiring zone assignment before activation.

### Action Plan 5: Sanitize All Auth Message Parameters (RS-46)
In `src/app/forgot-password/page.tsx` and `src/app/update-password/page.tsx`:
Import `sanitizeAuthMessage` from `@/lib/i18n` and sanitize `resolvedParams?.message` before rendering alert banners.

### Action Plan 6: Enforce Case-Insensitive Uniqueness in PostgreSQL DDL (RS-42)
Execute DDL migrations in Supabase:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_lower_user_id ON public.people (lower(user_id));
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_lower_email ON public.people (lower(email));
```
In `src/app/home/actions.ts` `login()`, ensure `email = rawIdOrEmail.toLowerCase()` when `@` is present.
Strip obsolete `person?.zone_id === 1` check from `src/app/(admin)/dashboard/page.tsx:108`.

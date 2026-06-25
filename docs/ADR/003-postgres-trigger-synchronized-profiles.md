# ADR 003: Adoption of Postgres Trigger Pattern for Synchronized User Profiles

- **Status**: Accepted
- **Date**: 2026-10-26

## Context

During unauthenticated user registration (`/register`), the client form triggers live validation (`checkEmailAvailability`) to inform the user if an email or username is already taken. Previously, this server action queried `public.people` and additionally invoked `adminSupabase.auth.admin.listUsers({ perPage: 1000 })` over HTTP to check for orphaned Supabase Auth accounts.

This pattern introduced severe operational bottlenecks:
1. **Hard API Caps**: `listUsers` is limited to 1,000 records per request. In production organizations exceeding 1,000 users, validation silently failed or missed duplicate accounts.
2. **Network & Memory Overhead**: Fetching thousands of Auth user objects over HTTP just to perform a boolean availability check degraded server response times and risked rate-limit exhaustion.

## Decision

We formally recognize and rely on the **Postgres Trigger Pattern** (`on_auth_user_created` trigger executing `public.handle_new_user()`) which atomically duplicates newly created `auth.users` records into `public.people`.

Consequently:
1. We eliminate `adminSupabase.auth.admin.listUsers` scans entirely from `src/app/auth/register/actions.ts`.
2. Live registration availability lookups query **only** `public.people` (`SELECT id FROM people WHERE email = $1`), leveraging standard database indexing (<1ms query time).

## Consequences

### Positive
- **Infinite Scalability**: Removes the 1,000-user cap completely.
- **Zero HTTP Overhead**: Eliminates slow administrative HTTP requests during normal sign-up flows.
- **Enhanced Security**: Adheres to principle of least privilege by avoiding administrative service role scans for unauthenticated visitors.

### Negative / Risks
- If database administrators manually delete a row from `public.people` via SQL or Table Editor without deleting the corresponding Supabase Auth user record, an orphaned account is created. Standard GoTrue anti-enumeration fallbacks (`identities: []`) handle this safely during final form submission.

# Known Issues & Bug Tracker

## Overview
This file tracks known bugs, temporary hacks, or design compromises made during development. Documenting these saves time when refactoring later.

## Active / Deferred Issues

### `checkEmailAvailability` Does Not Scale Beyond 1000 Users
- **Date**: 2026-06-12
- **Description**: The `checkEmailAvailability` server action (called on-blur during registration) checks for orphaned auth accounts (emails in `auth.users` but not in the `people` table) by calling `adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 })`. This fetches up to 1000 auth users on every email field blur event. It will silently miss users if the auth table exceeds 1000 records, and has unnecessary overhead.
- **Impact**: Medium (scalability — does not affect correctness for current user count)
- **Potential Fix**: Create a Supabase database function (RPC) that queries `auth.users` directly for an exact email match:
  ```sql
  create or replace function check_email_exists(search_email text)
  returns boolean language sql security definer as $$
    select exists(select 1 from auth.users where email = search_email);
  $$;
  ```
  Then replace the `listUsers` call with `await adminSupabase.rpc('check_email_exists', { search_email: email })`.

---

## Resolved Historical Issues

### `Report.created_at` Sorting Crash
- **Description**: The dashboard crashed after login because it attempted to sort reports by `created_at`, a field which did not exist in the legacy schema.
- **Fix**: The query was refactored to sort by `Report.id` descending, accurately reflecting the creation sequence without needing a new schema column.

### Tailwind 4 `.container` Alignment Bug
- **Description**: Because Tailwind 4's `.container` does not automatically center content or set max-widths without explicit configuration, the UI awkwardly hugged the left side of the screen.
- **Fix**: A custom `.container` class was defined in `globals.css` using `@apply mx-auto px-4 w-full max-w-7xl;` to properly center the dashboard layouts.

### Authentication & Logout State Hanging
- **Description**: The `UserDropdown` initially showed a hardcoded static user and the logout button failed to clear sessions.
- **Fix**: The dropdown was updated to dynamically fetch the user from Supabase and the `people` table. A dedicated POST route `/auth/logout` was built to properly clear cookies and trigger a redirect to `/login`.

### Supabase Silent Email Collision on Registration
- **Date**: 2026-06-12
- **Description**: When a user attempted to register with an email that already existed in `auth.users`, Supabase intentionally returned a fake success response (no `authError`) to prevent email enumeration. The code fell through to redirecting the user to `/pending-approval`, as if registration had succeeded.
- **Fix**: After `signUp`, the code now checks `authData.user.identities?.length === 0`. Supabase populates an empty `identities` array when the email already exists. If the array is empty, registration is rejected with a clear error message.

### Registration Public Route Missing from Middleware
- **Date**: 2026-06-12
- **Description**: The `/register` and `/home` routes were not in the middleware's `publicPaths` array, meaning unauthenticated visitors would be incorrectly redirected to `/login` when trying to access the registration page.
- **Fix**: Added `/register` and `/home` to `publicPaths` in `middleware.ts`.

### Root Route (`/`) Incorrectly Treated as Public
- **Date**: 2026-06-12
- **Description**: The root URL `/` was in the `publicPaths` list, causing the middleware to skip the `people.active` check entirely. This meant inactive (unapproved) users who managed to log in could reach the dashboard without being redirected to `/pending-approval`.
- **Impact**: High (security — allowed pending users to access the dashboard).
- **Fix**: Removed `/` from `publicPaths`. The middleware now protects it and correctly enforces the `active` check.

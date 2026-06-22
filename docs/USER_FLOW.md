# User Flow

## Overview
This document outlines the User Experience (UX) and navigation paths for standard users (Zone Managers). The frontend focuses on an accessible, adaptive UI built with Next.js and Tailwind v4.

## 1. Authentication Flow

### 1.1 Registration
1. User navigates to `/register` (publicly accessible, no login required).
2. The registration form (`RegisterFormClient`) is a **client component** that provides live on-blur field validation:
   - When the user tabs out of the **Email** field, it immediately calls `checkEmailAvailability()` — a server action that checks both the `people` table and `auth.users` for duplicates. The field border turns red/green and a badge appears.
   - When the user tabs out of the **User ID** field, it calls `checkUserIdAvailability()` — a server action that checks the `people` table. Same red/green feedback.
   - The Submit button is **disabled** while any check is in progress or if either field shows a conflict.
3. On submit, the `register` server action (`/app/auth/register/actions.ts`) runs the following checks in order:
   - All required fields are present.
   - `user_id` passes the format rule: alphanumeric + `_` `-`, min 3 chars.
   - `password` is at least 6 characters.
   - `user_id` is not already taken in the `people` table (server-side guard, in addition to the live check).
   - Calls `supabase.auth.signUp()`. If Supabase returns `identities.length === 0`, the email already exists in auth and the user is shown an error (Supabase uses this pattern to prevent email enumeration).
4. On success, the session is immediately signed out (`supabase.auth.signOut()`) — the user must wait for admin approval before being allowed in.
5. User is redirected to `/pending-approval`.

### 1.2 Login
1. User navigates to `/login`. Accepts either **Email address** or **User ID** in the identifier field.
2. If the input does not contain `@`, the `login` server action resolves it to an email by querying `people.user_id` using the **admin client** (service role key), then falls back to a legacy `@report.local` suffix for older accounts.
3. `supabase.auth.signInWithPassword()` is called with the resolved email.
4. On success, `revalidatePath('/')` is called and the user is redirected to `/`.
5. **Active status is enforced by middleware** (not the login action itself): On the first request to `/`, middleware calls `getUser()` and queries `people.active`. If `active = false`, the user is redirected to `/pending-approval`. If `active = true`, the dashboard loads.

### 1.3 Middleware Route Protection
`middleware.ts` runs on every request matching the Next.js matcher (excludes static files):
- **Public routes** (no auth required): `/home`, `/login`, `/register`, `/auth/*`, `/pending-approval`
- **Protected routes** (everything else, including `/`): Middleware calls `supabase.auth.getUser()`.
  - If no session: unauthenticated users visiting `/` are redirected to `/home`; all others go to `/login`.
  - If session exists but `people.active = false`: user is redirected to `/pending-approval`.
  - If session exists and `people.active = true`: request proceeds normally.
- **API routes**: Return a `401 JSON` response instead of redirecting.
- **Authenticated users on `/login`**: Redirected to `/` (dashboard).

### 1.4 Logout
User clicks the logout button. A `POST /auth/logout` route handler calls `supabase.auth.signOut()` and redirects to `/login`. The client button uses a `try/catch` around the fetch request to prevent users from silently retaining active sessions on network errors.

### 1.5 Password Reset Flow
1. User navigates to `/forgot-password` (publicly accessible).
2. The user submits their email. A server action (`/app/forgot-password/actions.ts`) calls `supabase.auth.resetPasswordForEmail()`.
3. The `redirectTo` URL is dynamically resolved: `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_VERCEL_URL` → `localhost:3000` fallback. This ensures the correct origin is used in both local dev and Vercel production.
4. The `redirectTo` parameter points to `/auth/callback?next=/update-password` to strictly enforce the **PKCE (Proof Key for Code Exchange)** flow required for Server-Side Rendering. Supabase generates a one-time `?code=` parameter attached to this URL.
5. User clicks the link in their email → Supabase verifies the token → redirects to `/auth/callback?code=XXXX&next=/update-password`.
6. The callback route (`/app/auth/callback/route.ts`) calls `exchangeCodeForSession(code)` to securely create a server-side session cookie, then redirects to `/update-password`.
7. The `/update-password` page is guarded by `supabase.auth.getUser()`, allowing only successfully authenticated users (those who completed the code exchange).
8. User submits their new password (with confirmation field). The server action validates length ≥ 6 and match, calls `supabase.auth.updateUser({ password })`, signs the user out, and redirects to `/login` with a Bangla success message.

**Supabase Dashboard Requirements:**
- **Redirect URLs** (Authentication → URL Configuration): Must include `https://talimul-report.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`.
- **Email Template** (Authentication → Email Templates → Reset Password): The default `{{ .ConfirmationURL }}` works correctly with PKCE. No modification needed.
- **Rate Limits**: Free tier allows 2 password reset emails per hour per email (fixed). Use Gmail `+` aliases for testing.

---

## 2. Dashboard Flow
1. **Landing**: User lands on `/` (Dashboard). Middleware has already verified they are authenticated and active.
2. **Context Toggle**: Users can toggle between Bangla (default) and English via the `UserDropdown` settings, which displays explicit language choice buttons ("বাংলা" and "EN") indicating the active state. The selection updates the interface via a global React Context without triggering URL changes or route reloads.
3. **Period Selection**: User selects the Report Type (e.g., মাসিক), Month, and Year from the dropdowns. 
   - **URL State**: Selections update the URL query parameters (e.g., `?type=monthly&month=6&year=2026`) dynamically without page reloads, acting as the single source of truth across all sections (no `localStorage` syncing needed).
   - **Future Month Protection**: The UI and data-fetching logic actively block the creation or viewing of reports for future dates, showing an appropriate warning.
   - **Auto-Creation**: If a user navigates to a valid current or past month where a report doesn't exist, the system automatically initializes an empty report with all required child tables seamlessly.
4. **Section Overview**: User views 7 distinct cards representing the 7 report sections.
5. **Completion Indicators**: Each card displays a psychological completion badge:
   - ⚪ (White): Empty, no data entered.
   - 🟠 (Orange): Partially filled.
   - 🟢 (Green): Fully completed.
   *(This encourages users to input '0' even for empty fields to achieve a green state).*

*Note: The UI strictly follows the 4-theme system (Light, Dark, Solarized Light, Solarized Dark). Users can select their theme from an explicit visual grid selector with swatch previews inside the `UserDropdown` settings. While interactive power-user features like `kbar` and `framer-motion` were explored, they have been explicitly omitted to prioritize a minimalist, highly accessible experience tailored to non-tech-savvy field managers.*

---

## 3. Data Entry Flow (Adaptive Matrix)
1. **Navigation**: User clicks a section card and routes to `/report/[section]`. A visible "Nav Stepper" component tracks progress across the 7 sections.
2. **Layout**:
   - **Desktop**: A sticky, tabular adaptive grid.
   - **Mobile**: Grouped cards with a Fixed Bottom Navigation Bar (no hamburger menu).
3. **Auto-Save Mechanism**:
   - As the user types and moves off a field (`onBlur`), the data is instantly auto-saved to Supabase.
   - A visual indicator next to the field spins during the save and turns into a ✅ upon success.
4. **No Final Submit**: Because of the real-time auto-save architecture, there is no master "Submit" button. Users simply fill out all sections until all 7 badges turn green.

---

## 4. Exports
From the dashboard, users can request an export (Excel or highly condensed PDF) of their submitted report. The Next.js app or Edge Function rapidly compiles the data and triggers a download.

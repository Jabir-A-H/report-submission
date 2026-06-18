# API and Services

## Overview
Because the architecture relies heavily on Next.js and Supabase, traditional REST API endpoints are minimized. Instead, the system uses Supabase's client libraries and Next.js Server Actions for most operations, with Edge Functions / API Routes reserved for high-computation tasks like exports.

## 1. Supabase Data Fetching
- **Client-Side**: The Next.js frontend uses `@supabase/ssr` to fetch and mutate data directly from the PostgreSQL tables and views.
- **Security**: Data access is governed by Row Level Security (RLS) policies defined in the database, ensuring users only see their own zone data.
- **Realtime**: Auto-saving forms bypass traditional `POST /submit` endpoints. Instead, an `onBlur` event triggers a direct `supabase.from('table').upsert(...)` call.

## 2. Supabase Client Patterns
The codebase uses two Supabase client patterns:

| Pattern | File | Key | Used For |
|---|---|---|---|
| SSR Server Client | `@/utils/supabase/server` | `ANON_KEY` | Server Components, middleware, reading user-owned data |
| SSR Browser Client | `@/utils/supabase/client` | `ANON_KEY` | Client Components that need to read from the DB |
| Admin Client (inline) | `createClient` from `@supabase/supabase-js` | `SERVICE_ROLE_KEY` | Server Actions that need to bypass RLS (e.g., checking uniqueness, resolving user IDs at login, admin operations) |

> **Important**: The `SERVICE_ROLE_KEY` is **never** exposed to the client. It is only used inside `'use server'` actions and Next.js API route handlers.

## 3. Server Actions (Auth)
Auth logic lives in server actions, not API routes:

### `/app/auth/register/actions.ts`
- **`register(formData)`**: Validates fields, checks `user_id` uniqueness via admin client, calls `supabase.auth.signUp()`, detects silent email collisions via `identities.length === 0`, then signs the new session out and redirects to `/pending-approval`.
- **`checkEmailAvailability(email)`**: Called on-blur during registration. Checks `people.email` (fast path) and then `auth.users` via `admin.listUsers()`. Returns `{ available, message }`.
- **`checkUserIdAvailability(userId)`**: Called on-blur during registration. Checks `people.user_id`. Returns `{ available, message }`.

### `/app/login/actions.ts`
- **`login(formData)`**: Resolves user_id → email (if input is not an email) via admin client lookup of `people.user_id`. Calls `supabase.auth.signInWithPassword()`. On success, redirects to `/`. Middleware enforces the `active` check.

### `/app/forgot-password/actions.ts`
- **`forgotPassword(formData)`**: Validates the email and calls `supabase.auth.resetPasswordForEmail()`. The `redirectTo` parameter strictly points to the PKCE callback route (`/auth/callback?next=/update-password`).

### `/app/update-password/actions.ts`
- **`updatePassword(formData)`**: Validates the new password, calls `supabase.auth.updateUser({ password })`, signs the user out, and redirects to `/login` with a success message.

### `/app/auth/callback/route.ts`
- **`GET /auth/callback`**: Next.js API route that handles the PKCE code exchange. Extracts the `code` from the URL, calls `supabase.auth.exchangeCodeForSession()`, and redirects the user to the destination provided in the `next` param (usually `/update-password`).

### `/auth/logout/route.ts`
- **`POST /auth/logout`**: Calls `supabase.auth.signOut()` and redirects to `/login`.

## 4. Aggregation via Views
Instead of computing aggregations on the server via an API route, the Next.js app queries PostgreSQL Views directly:
```typescript
const { data } = await supabase.from('city_monthly_aggregates_view').select('*');
```
This offloads the computational heavy-lifting to the database layer.

## 5. Export Services (Excel & PDF)
Generating high-fidelity exports requires server-side processing to keep the client lightweight.
- **Approach**: Next.js API Routes (`/api/export/*`) handle the export generation.
- **Excel Export**: Utilizes a library like `exceljs` to map JSON data into a formatted XLSX file.
- **PDF Export**: 
  - Utilizes `@react-pdf/renderer` in `/api/export/pdf/route.tsx` to generate highly customized, condensed Bangla-supported PDFs using the *Tiro Bangla* font.
  - **Layout & Efficiency**: Specifically engineered to fit all comprehensive data onto a maximum of **two A4 pages**. This ensures the document is ready for physical printing and administrative evaluation.
  - **Styling**: Mimics the legacy Excel-based PDF reports but with professionalized web-safe aesthetics (light blue headers, peach statistic blocks, yellow meeting headers) via flexbox.
  - **Structural Adjustments**: Adjusts rigid database schemas into visually friendly tables. For instance, the *Personal* table inverts standard row/column mapping to align with the visual spec, and multi-field data points (e.g. `সহযোগী / সম্মতি দিয়েছেন`) are intelligently displayed without strictly merging strings.
  - **Data Integrity**: The PDF strictly adheres to predefined database schema categories. Missing legacy categories (e.g., `রুকনদের অনুশীলনী ক্লাস`) found in old PDFs are intentionally excluded from the code unless they are explicitly added to the Supabase database Enum/Text fields.
- **Flow**:
  1. Client sends a request with `report_id` or `period`.
  2. The API Route queries Supabase for the required data, resolving aggregations if needed.
  3. The document layout is computed in-memory by `@react-pdf/renderer`.
  4. The server responds with a raw PDF `Buffer` downloaded by the user's browser.

## 6. Authentication Service
- Handled by Supabase Auth + Next.js Middleware + Server Actions.
- `middleware.ts` protects all routes not in the `publicPaths` list. It enforces both authentication (valid session) and authorization (user is `active`).
- See `USER_FLOW.md` for the complete authentication flow.

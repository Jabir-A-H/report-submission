# System Architecture

## Overview
The Report Submission System is built on a modern **Next.js** (Frontend) and **Supabase** (Backend/Database) stack. This architecture provides high performance, a premium UI, and a streamlined developer experience.

## Technology Stack
- **Frontend Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase (managed cloud instance)
- **Deployment & Hosting**: Vercel (Frontend), Supabase (Backend)
- **Language**: TypeScript

## High-Level Architecture Flow
```text
Browser / Client (Next.js)
       │
       │  Every Request
       ▼
middleware.ts
       │  Calls supabase.auth.getUser() + checks people.active
       │  Routes public/protected, enforces approval gate
       ▼
Next.js App Router
       │
       ├─ Server Components  →  read data via SSR Supabase client (anon key)
       ├─ Server Actions      →  mutate data; admin operations use service role key
       ├─ Client Components   →  interactive UI (forms with on-blur validation, etc.)
       │
       ▼
Supabase Edge/API Layer
       │
       ├─ Auth (Email/Password via Server Actions)
       ├─ PostgreSQL (Tables, Views, RLS Policies)
       └─ Edge Functions (Excel Export, custom PDF generator)
```

## Route Protection Model
The middleware (`middleware.ts`) is the **single source of truth** for auth enforcement:

| Route | Type | Rule |
|---|---|---|
| `/home` | Public | Always accessible |
| `/login` | Public | Redirects to `/` if already logged in |
| `/register` | Public | Always accessible |
| `/auth/callback` | Public | Always accessible (PKCE exchange handler) |
| `/forgot-password` | Public | Always accessible |
| `/update-password` | Public | Bypasses middleware `active` check, but guarded by session check in page component |
| `/pending-approval` | Public | Always accessible |
| `/api/*` | Protected | Returns `401 JSON` if unauthenticated |
| `/` | Protected | Requires auth + `active = true` |
| `/admin/*` | Protected | Requires auth + `active = true` + role check in layout |
| All other routes | Protected | Requires auth + `active = true` |

**Unauthenticated visitors** hitting `/` are redirected to `/home` (the landing page). The root route `src/app/page.tsx` also contains a hardcoded fallback redirect to `/home` to ensure unauthenticated users during RSC transitions (bypassing middleware) safely reach the landing page instead of throwing errors or landing on `/login`. All other protected routes send unauthenticated users to `/login`.

**Orphaned Auth Accounts**: Middleware explicitly treats authenticated users who are missing a corresponding row in the `people` table as `active = false`. This guarantees orphaned accounts cannot slip past the approval gate.

**Pending-Approval Exit**: The `/pending-approval` page's "Return to Login" button uses a `<form POST>` to `/auth/logout` (not a `<Link>`). This is critical — a simple link to `/login` would create a redirect trap: middleware sees the active session, redirects `/login` → `/` → `/pending-approval` in a loop.

## Supabase Client Strategy
Three different Supabase client patterns are used depending on context:

| Pattern | Key Used | Context |
|---|---|---|
| `@/utils/supabase/server` | `ANON_KEY` | Server Components, middleware |
| `@/utils/supabase/client` | `ANON_KEY` | Client Components |
| `createClient()` from `@supabase/supabase-js` | `SERVICE_ROLE_KEY` | Server Actions needing to bypass RLS |

The `SERVICE_ROLE_KEY` is **never** sent to the browser. It is only used inside `'use server'` actions.

## Zero-Cost Operations & Backups
To ensure data safety while minimizing operational costs:
- The system utilizes managed Supabase which handles daily internal backups.
- **GitHub Actions**: A cron job runs periodically (`.github/workflows/backup.yml`) to perform an encrypted `pg_dump` of the Supabase PostgreSQL database and pushes it to a private repository. This ensures full disaster recovery capabilities without relying solely on the cloud provider.

## Exports Strategy
- Excel and PDF exports will be generated using whichever method is fastest (Next.js API routes vs. Supabase Edge Functions).
- PDF exports will be customized to heavily condense the output for easier printing and review.

## Aggregation Strategy
All aggregations, including cross-month aggregations (Quarterly, Yearly), are executed entirely via **PostgreSQL Views** at the database layer. The frontend simply queries the pre-calculated view, remaining lightweight and fast without performing client-side `SUM` operations.

## Report Initialization Strategy
When a user accesses a report period that doesn't exist yet, the system relies on a **Postgres RPC function (`get_or_create_report`)** rather than client-side fallback insertions. This ensures:
1. **Atomicity**: The root report and all 7 child tables (header, courses, etc. across 50+ categories) are seeded in a single database transaction. If any part fails, it rolls back entirely.
2. **Performance**: Reduces 8 separate HTTP network requests down to 1.
3. **Resilience**: A `UNIQUE` database constraint handles parallel request race conditions securely via `ON CONFLICT DO NOTHING`, guaranteeing zero duplicate reports.

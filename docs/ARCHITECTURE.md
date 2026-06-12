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
| `/auth/*` | Public | Always accessible (callback handlers) |
| `/pending-approval` | Public | Always accessible |
| `/api/*` | Protected | Returns `401 JSON` if unauthenticated |
| `/` | Protected | Requires auth + `active = true` |
| `/admin/*` | Protected | Requires auth + `active = true` + role check in layout |
| All other routes | Protected | Requires auth + `active = true` |

**Unauthenticated visitors** hitting `/` are redirected to `/home`. All other protected routes send them to `/login`.

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

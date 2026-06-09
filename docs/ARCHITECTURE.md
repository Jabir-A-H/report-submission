# System Architecture

## Overview
The Report Submission System has been modernized from a legacy Flask/PostgreSQL architecture to a modern **Next.js** (Frontend) and **Supabase** (Backend/Database) stack. This architecture provides high performance, a premium UI, and a streamlined developer experience.

## Technology Stack
- **Frontend Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS v4, Framer Motion
- **Database & Auth**: Supabase (managed cloud instance)
- **Deployment & Hosting**: Vercel (Frontend), Supabase (Backend)
- **Language**: TypeScript

## High-Level Architecture Flow
```text
Browser / Client (Next.js)
       │
       │ (REST / Realtime)
       ▼
Supabase Edge/API Layer
       │
       ├─ Auth (Email/Password, Google One Tap)
       │
       ├─ Middleware (`middleware.ts` for route protection)
       │
       ├─ Edge Functions (Excel Export, custom PDF generator)
       │
       ▼
PostgreSQL Database
       │
       ├─ Tables (User Data, Form Sections)
       └─ Views (City-wide aggregations & calculations)
```

## Zero-Cost Operations & Backups
To ensure data safety while minimizing operational costs:
- The system utilizes managed Supabase which handles daily internal backups.
- **GitHub Actions**: A cron job runs periodically (`.github/workflows/backup.yml`) to perform an encrypted `pg_dump` of the Supabase PostgreSQL database and pushes it to a private repository. This ensures full disaster recovery capabilities without relying solely on the cloud provider.

## Exports Strategy
- Excel and PDF exports will be generated using whichever method is fastest (Next.js API routes vs. Supabase Edge Functions).
- PDF exports will be customized to heavily condense the output for easier printing and review.

## Aggregation Strategy
All aggregations, including cross-month aggregations (Quarterly, Yearly), are executed entirely via **PostgreSQL Views** at the database layer. The frontend simply queries the pre-calculated view, remaining lightweight and fast without performing client-side `SUM` operations.

# ADR 002: Core Reliability & Stabilization Prioritization Over Feature Expansion

**Status**: Accepted  
**Date**: 2026-06-25  
**Author**: Engineering Team  

## Context
During code audits and user interview grilling sessions (`/grill-me`), we identified severe runtime instability and scaling bottlenecks in the active Next.js App Router codebase:
1. **Supabase Client Instability (`src/components/report/report-context.tsx`)**: `ReportProvider` instantiates `createClient()` directly inside the component render body without memoization (`useMemo`). Every parent state update or keyboard input forces a complete client teardown and recreation, triggering infinite render cascades and websocket memory leaks.
2. **Unmemoized Mutator Overheads**: `updateField` in `ReportProvider` is not wrapped in `useCallback()`. Child input matrices re-render needlessly on every keystroke.
3. **Period Selection Race Conditions (`src/components/dashboard/user-dashboard.tsx`)**: The report initialization `useEffect` fires asynchronously without cancellation flags or cleanup handlers when rapidly clicking period selector buttons, causing out-of-order `get_or_create_report` RPC execution.
4. **Admin User List Scaling Cap (`src/app/auth/register/actions.ts`)**: `checkEmailAvailability` executes `adminSupabase.auth.admin.listUsers()`, which is hardcapped at 1000 records by Supabase Auth APIs. In production organizations exceeding 1000 field workers, duplicate registration validation silently breaks.

## Decision
We establish an immutable engineering principle: **Core Reliability & Stabilization First**. 
All feature requests (e.g. offline PWA service workers, interactive command bars, graphical charts) are strictly frozen until the foundational stability bugs documented in `KNOWN_ISSUES.md` are completely resolved. The immediate implementation roadmap (`ROADMAP.md`) is resequenced to resolve these 4 stability defects sequentially.

## Consequences
### Positive
- **Guaranteed Data Integrity**: Field workers will no longer experience silent auto-save dropped frames or client crashes during report input.
- **Infinite Scalability for Auth**: Migrating registration checks to Postgres RPC (`check_email_exists`) eliminates the 1000-user API ceiling.
- **Predictable React Tree**: Stabilizing Supabase client references and callback mutators ensures smooth 60fps mobile card swiping.

### Negative / Mitigations
- **Delayed Feature Delivery**: Non-critical cosmetic requests are pushed to later sprints. *Mitigation: Clear communication to stakeholders via updated `ROADMAP.md`.*

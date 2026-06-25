# Project Roadmap

## Phase 1: MVP (Completed)
- [x] Initialize Next.js + Supabase workspace.
- [x] Define PostgreSQL tables and aggregation views.
- [x] Implement Auth with Admin Approval Gate (`active = false`).
  - [x] Registration with live on-blur validation (email & user_id uniqueness).
  - [x] Supabase silent email collision detection (`identities.length === 0`).
  - [x] Login via Email or User ID (server-side resolution).
  - [x] Middleware-enforced route protection and active status check.
- [x] Build User Dashboard & 7 Section Adaptive Matrix.
- [x] Build real-time Auto-Save system.
- [x] Build Admin Dashboard (Users, Zones, Overrides).
- [x] Implement City Report Aggregation View.
- [x] Develop custom, condensed PDF/Excel Export logic.
- [x] Transition Docs Suite to Master Manual + Living Trackers structure (`TECHNICAL_MANUAL.md` & `ADR/`).

## Phase 2: Core Reliability & Stabilization (Completed)
1. [x] **Fix Supabase Client Instability (`src/components/report/report-context.tsx`)**: Wrapped inline `createClient()` inside `ReportProvider` with `useMemo()`.
2. [x] **Memoize Mutator Callbacks (`src/components/report/report-context.tsx`)**: Wrapped `updateField` mutator in `useCallback()` to eliminate unnecessary child matrix re-renders.
3. [x] **Resolve Period Selection Race Conditions (`src/components/dashboard/user-dashboard.tsx`)**: Added cancellation flags (`let ignore = false`) to `useEffect` report initialization.
4. [x] **Eliminate Registration API Scaling Cap (`src/app/auth/register/actions.ts`)**: Migrated registration email validation from `admin.listUsers()` (1000-user cap) to query synchronized `public.people` (ADR 003).

## Phase 3: Secondary Polish & Mobile Usability Hardening (Active Focus)
1. [ ] **Secondary Component Memoization**: Wrap render-loop `createClient()` calls inside `admin-dashboard.tsx`, `bottom-nav.tsx`, `user-dropdown.tsx`, and `correction-button.tsx` with `useMemo`.
2. [ ] **Mobile Touch Ergonomics (WCAG Lints)**: Expand touch target padding on nested table rows in `auto-save-field.tsx` (`min-h-[44px] min-w-[44px]`).

## Phase 4: Post-Stabilization Feature Expansion
- [ ] **Signature Upload**: Add an option for users/admins to upload a handwritten signature image for PDF exports.
- [ ] **Custom JWT Claims (Performance)**: Store `role` and `active` as custom claims in the Supabase JWT via database hooks.
- [ ] **Realtime Pending Page Tracking**: Auto-refresh `/pending-approval` once an admin approves the account.
- [ ] **Google One Tap & Magic Links**: Implement passwordless auth options.
- [ ] **Enhanced Admin Charts & Audit Logs**: Add visual trend charts and audit tracking.
- [ ] **Mobile App Native Wrapper**: Capacitor or React Native wrapper for mobile deployment.

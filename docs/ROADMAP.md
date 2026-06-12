# Project Roadmap

## Phase 1: MVP (Current Focus)
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
- [ ] Develop custom, condensed PDF/Excel Export logic.

## Phase 2: Post-MVP & Improvements
- [ ] **`checkEmailAvailability` RPC Fix**: Replace the `admin.listUsers()` call with a `supabase.rpc('check_email_exists', ...)` call backed by a Postgres function that queries `auth.users` directly. This removes the 1000-user cap and reduces latency on the registration form. (See `KNOWN_ISSUES.md`.)
- [ ] **Custom JWT Claims (Performance)**: Store `role` and `active` as custom claims in the Supabase JWT via a database hook. This would allow middleware and layouts to read these values directly from the session token, eliminating ~2 extra `people` table queries on every page load.
- [ ] **Realtime Pending Page Tracking**: Use Supabase Realtime to auto-refresh the `/pending-approval` page and seamlessly redirect the user once an admin approves the account.
- [ ] **Google One Tap Login**: Simplify authentication for Zone Managers alongside standard Email/Password.
- [ ] **OTP / Magic Links**: Implement passwordless login via Supabase.
- [ ] **Enhanced Analytics**: Add visual charts to the Admin Dashboard to track metrics over time.
- [ ] **Audit Logs**: Track who made changes, especially for Admin overrides.

## Phase 3: Future Considerations
- [ ] **Mobile App Wrapper**: Potentially wrap the responsive PWA into a native app using React Native or Capacitor.
- [ ] **AI Integrations**: Use AI to detect anomalies in reported numbers compared to previous periods.

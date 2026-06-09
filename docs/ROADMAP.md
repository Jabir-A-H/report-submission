# Project Roadmap

## Phase 1: MVP (Current Focus)
- [ ] Initialize Next.js + Supabase workspace.
- [ ] Define PostgreSQL tables and aggregation views.
- [ ] Implement Auth with Admin Approval Gate (`active = false`).
- [ ] Build User Dashboard & 7 Section Adaptive Matrix.
- [ ] Build real-time Auto-Save system.
- [ ] Build Admin Dashboard (Users, Zones, Overrides).
- [ ] Implement City Report Aggregation View.
- [ ] Develop custom, condensed PDF/Excel Export logic.

## Phase 2: Post-MVP & Improvements
- [ ] **Realtime Pending Page Tracking**: Use Supabase Realtime to auto-refresh the `/pending-approval` page and seamlessly redirect the user once their email is confirmed and an admin approves the account.
- [ ] **Google One Tap Login**: Simplify authentication for Zone Managers alongside standard Email/Password.
- [ ] **OTP / Magic Links**: Implement passwordless login via Supabase.
- [ ] **Enhanced Analytics**: Add visual charts to the Admin Dashboard to track metrics over time.
- [ ] **Audit Logs**: Track who made changes, especially for Admin overrides.

## Phase 3: Future Considerations
- [ ] **Mobile App Wrapper**: Potentially wrap the responsive PWA into a native app using React Native or Capacitor.
- [ ] **AI Integrations**: Use AI to detect anomalies in reported numbers compared to previous periods.

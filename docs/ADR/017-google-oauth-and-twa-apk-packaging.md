# ADR 017: Supabase Google OAuth Integration & Bubblewrap TWA Android APK Packaging

- **Status**: Accepted and Implemented
- **Date**: 2026-10-12

## Context

The application needed mobile app distribution (Android APK) and streamlined authentication via Google Sign-In, complementing the existing Email / Custom User ID / Password authentication flow. 

Two architectural options were evaluated:
1. **Firebase Authentication + Capacitor Native Wrapper**:
   - Requires introducing Firebase SDK alongside Supabase.
   - Creates dual-identity token conflicts (Firebase JWT vs. Supabase RLS policies and `middleware.ts`).
   - Heavy APK size (15–30 MB) and breaks Next.js Server Components / SSR without static exports or complex webview bridges.
2. **Supabase Native Google OAuth + Google Bubblewrap (Trusted Web Activity - TWA)**:
   - Uses Supabase’s native Google OAuth provider (100% free, up to 50k MAUs).
   - Links Google accounts to existing email/password accounts automatically under the same `auth.users` row and `public.people` profile.
   - Packages the live Next.js web application into an official Google TWA APK using Bubblewrap CLI.
   - Ultra-lightweight APK (~2 MB), native full-screen experience without browser chrome via Digital Asset Links (`.well-known/assetlinks.json`), and automatic live updates on every web deployment without requiring app re-compilation.

## Decision

1. **Reject Firebase Authentication**: Maintain Supabase Auth as the single source of truth for identity, PostgreSQL RLS enforcement, and profile synchronization.
2. **Implement Google OAuth**:
   - Added reusable `GoogleSignInButton` in `src/components/auth/google-sign-in-button.tsx` using `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`.
   - Embedded into both login and registration tabs in `AuthPortalClient` and `RegisterFormClient` with bilingual support (Bangla/English) and error translation via `translateAuthError()`.
   - Reused existing `/auth/callback` PKCE exchange endpoint to establish secure SSR session cookies.
3. **PWA Foundation & Metadata Route**:
   - Implemented `src/app/manifest.ts` delivering `/manifest.webmanifest` titled `তা'লীমুল কুরআন রিপোর্ট` (`Talimul Quran Report`).
   - Created standalone PNG app icons at `public/icons/icon-192.png` and `public/icons/icon-512.png` matching the brand theme `#0da2b8`.
4. **TWA APK CI/CD Pipeline via GitHub Actions**:
   - Configured `twa-manifest.json` targeting live deployment `talimul-report.vercel.app` with package `org.talimulquran.report` and app name `Talimul Quran Report`.
   - Generated permanent PKCS12 release keystore and configured exact SHA-256 fingerprint `6A:FA:D3:2C:D1:A6:7B:25:B4:07:48:0F:87:16:BD:70:97:1A:34:4B:00:86:2B:43:E4:9B:0B:4F:16:2B:B3:9F` directly into `public/.well-known/assetlinks.json`.
   - Configured `.github/workflows/build-apk.yml` with secure keystore injection via GitHub Secrets (`ANDROID_KEYSTORE_BASE64`), legacy SDK symlinks (`$ANDROID_HOME/cmdline-tools/latest/bin` -> `$ANDROID_HOME/tools` and `$ANDROID_HOME/bin`), and non-interactive `yes | bubblewrap update --skipVersionUpgrade` followed by `yes | bubblewrap build` to guarantee headless compilation without Inquirer checksum prompts (exit code 130).
5. **Prerender Resilience**:
   - Enhanced `src/utils/supabase/server.ts` and `src/utils/supabase/client.ts` with safe fallback placeholders during static prerendering when environment variables are omitted in local/CI environments.

## Consequences

### Positive
- **Zero Ongoing Cost**: All authentication and CI/CD pipelines run on 100% free tiers (Supabase 50k MAU, Google Cloud OAuth, GitHub Actions).
- **Single Source of Truth**: All identities map 1:1 to `public.people` without auth provider fragmentation.
- **Micro APK Footprint**: APK size reduced from ~25 MB to ~2 MB.
- **Immediate Domain Verification**: The SHA-256 fingerprint is pre-baked into `public/.well-known/assetlinks.json`, enabling seamless borderless full-screen standalone Android launch without manual hash generation steps.
- **Zero-Friction Updates**: PWA/TWA loads the live Next.js application; web deployments update the mobile app instantly without user app updates.
- **Full Compatibility**: Retains existing User ID login, password reset PKCE flows, and approval gate (`active = false`).

### Considerations / Requirements
- Deploy to Vercel so `https://talimul-report.vercel.app/.well-known/assetlinks.json` is live before testing domain verification on device.
- Unapproved first-time Google sign-ins continue to be correctly routed to `/pending-approval` by `middleware.ts` until an admin assigns a zone.

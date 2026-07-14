# ADR 008: Unified Home Authentication Portal and Collapsible Settings Architecture

## Status

Accepted

## Context

Previously, the Report Submission System maintained separate routing topologies for unauthenticated landing (`/home`), user login (`/login`), and user registration (`/register`). Furthermore, protected section pages (`/report/[section]`) and dashboard views (`UserDashboard`) relied on client-side state manipulation (`setError("ব্যবহারকারী চিহ্নিত করা যায়নি।")`) rather than authoritative route redirects when an unauthenticated session was encountered on the client side.

Additionally, user interface toggles for language and theme selection (`LanguageToggle` and `ThemeToggle`) were prominently displayed at the top-right navigation bar (`UserDropdown`) and mobile navigation sheet (`BottomNav`), creating visual clutter and distracting from primary core reporting workflows.

To align with modern high-fidelity web applications and ensure robust route protection across all entry points, we needed to:
1. Consolidate `/home`, `/login`, and `/register` into a single, cohesive, dynamic Authentication & Landing Portal hosted at `/home`.
2. Eliminate `/login` and `/register` routes entirely, establishing `/home` as the singular public entry portal and base URL for auth state actions (`mode=login` vs `mode=register`).
3. Standardize unauthenticated client-side guards across all report section views (`/report/[section]`) and dashboards to immediately invoke `router.replace('/home')`.
4. Hide appearance and localization settings inside discrete, collapsible (`<details>`) UI components both in desktop dropdowns, mobile bottom navigation, and footer elements.

## Decision Drivers

* **Singular Public Entry Point**: Simplifying user flow by eliminating navigation friction between separate login, registration, and marketing landing pages.
* **Authoritative Unauthenticated Redirects**: Ensuring that direct URL queries to protected pages (`/report/personal?type=monthly&month=7&year=2026`) seamlessly redirect to the `/home` portal when unauthenticated rather than rendering localized error strings on empty dashboards.
* **Middleware Route Governance**: Centralizing unauthenticated redirection governance (`!user && !isPublicRoute -> /home`) and preserving backwards compatibility for any legacy bookmarks to `/login` or `/register`.
* **Visual Excellence & Ergonomics**: Reducing top-level navigation clutter by collapsing secondary settings (`Language` and `Theme Mode`) into accordion `<details>` menus and discrete footer modals (`AppearanceFooterToggle`).

## Considered Options

### Option 1: Maintain Separate Pages (`/login`, `/register`, `/home`) with Client Error Strings
- **Pros**: Retains existing file structure without touching `middleware.ts` path definitions.
- **Cons**: Fragmented user experience, redundant page requests, unauthenticated direct links display dead-end error strings (`ব্যবহারকারী চিহ্নিত করা যায়নি।`), prominent settings distract from reporting focus.

### Option 2: Unified Portal at `/login` (`/home` redirects to `/login`)
- **Pros**: Traditional pattern where `/login` handles authentication.
- **Cons**: Requires keeping separate marketing landing at `/home` or losing `/home` domain semantics. Does not satisfy user preference to make `/home` the primary unified dynamic experience.

### Option 3: Unified Dynamic Portal at `/home` with Collapsible Appearance Controls & Uniform Redirects (Selected)
- **Pros**: `/home` serves as both the branded public showcase (`রিপোর্ট পেশ আধুনিকায়ন`) and interactive dual-mode (`LogIn` / `Register`) portal. All unauthenticated requests seamlessly flow to `/home`. Settings are cleanly organized into accordion (`<details>`) structures and discrete footer popovers.
- **Cons**: Requires careful server-action redirection parameter handling (`?mode=login&message=...` vs `?mode=register&message=...`) and removing legacy files.

## Decision

We will implement **Option 3: Unified Dynamic Portal at `/home` with Collapsible Appearance Controls & Uniform Redirects**.

Specifically:
1. **Unified Portal & Scrolling Layout (`/home`)**: `src/app/home/page.tsx` now hosts a centered vertical scrolling layout without any topbar header. The hero section displays exactly `তা'লীমুল কুরআন বিভাগ` (without top pills or paragraph subtitles), followed immediately by `AuthPortalClient` (Login/Register box), and then rich platform feature cards (`প্ল্যাটফর্মের মূল বৈশিষ্ট্যসমূহ`) below. `SessionCleaner` ensures defensive session sanitization per ADR 005.
2. **Auth Card Minimalism & Input Padding Protection (`AuthPortalClient`, `RegisterFormClient`)**: Removed the redundant top segmented tab switcher (`[ ->] লগ-ইন করুন | 👤+ নতুন নিবন্ধন`) in favor of a clean, single-purpose auth card where mode switching is driven solely by the bottom toggle link (`অ্যাকাউন্ট নেই? নিবন্ধন করুন` / `অ্যাকাউন্ট আছে? লগ-ইন করুন`). Enforced `!pl-12 !pr-4` (`!pl-12 !pr-8` for select) across all form inputs containing absolute icons (`Mail`, `Lock`, `User`, `Tag`, `MapPin` with `pointer-events-none`) to guarantee zero collision with placeholder or entered text.
3. **Server Actions Consolidation (`src/app/home/actions.ts`)**: Both `login()` and `register()` server actions reside in `src/app/home/actions.ts`, returning redirection states to `/home?mode=login&message=...` or `/home?mode=register&message=...`.
4. **Route Cleanup & Middleware (`src/middleware.ts`)**: `src/app/login/` and `src/app/register/` directories are permanently removed. `publicPaths` in `middleware.ts` is updated to `['/home', '/auth', '/pending-approval', '/forgot-password', '/update-password']`. All unauthenticated protected route access redirects to `/home`. Legacy `/login` and `/register` URLs are intercepted by `middleware.ts` and redirected to `/home` (`/` if already authenticated).
5. **Client-Side Guard Harmonization**: `src/app/report/[section]/page.tsx`, `src/app/report/page.tsx`, and `src/components/dashboard/user-dashboard.tsx` now perform `router.replace('/home')` whenever `!user` is encountered after `supabase.auth.getUser()`.
6. **Collapsible Dropdown Accordions & Inline Expanded Footer Settings (`/help`)**: `UserDropdown` and `BottomNav` encapsulate `ThemeToggle` and `LanguageToggle` within native `<details className="group ...">` accordions triggered by `⚙️ থিম ও ভাষা (Appearance)`. Meanwhile, the bottom footer row on `/home` embeds the `সাহায্য (Help)` link (`/help`) and `AppearanceFooterToggle` (`ভাষা: [বাংলা | EN]` and `থিম: [লাইট | ডার্ক...]`) directly inline, avoiding popup modals.

## Consequences

### Positive
- **Zero Route Leakage**: Direct access to `/report/personal?type=monthly&month=7&year=2026` by an unauthenticated visitor cleanly redirects to `/home` instead of rendering an error screen.
- **Modern Consolidated UX**: Users can switch between Login and Registration seamlessly on `/home` without full page reloads while viewing system features.
- **Reduced Visual Clutter**: Navigation panels focus exclusively on core reporting actions (`হোম`, `রিপোর্ট`, `অ্যাডমিন`), while theme and language options remain easily accessible yet unobtrusive.
- **Strict Single Table & Client Adherence**: Preserves singular table naming (`people`, `zone`, `report`, `report_*`) and memoized client rules (`createClient()` / `useMemo()`).

### Negative / Trade-offs
- Any external links targeting `/login` will undergo a single 307 redirect through `middleware.ts` to `/home`.

## Implementation Notes

- **Password Recovery & Callback Governance**: `src/app/auth/callback/route.ts`, `src/app/update-password/page.tsx`, and `src/app/forgot-password/page.tsx` link back to `/home` on completion or error.
- **Session Protection**: `SessionCleaner` is retained on `/home` (`SessionStorage` purge on unauthenticated landing per ADR 005).

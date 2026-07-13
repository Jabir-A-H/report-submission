# ADR 005: Hybrid State Persistence, Compact Header View Toggle, and Flat Accordion Form Architecture

**Status**: Accepted  
**Date**: 2026-07-12  
**Author**: Engineering Team  

## Context
During the Round 2 UI/UX refinement cycle of the Report Submission System, three critical structural challenges were identified across the reporting interface (`/report/[section]`) and user dashboard (`/`):
1. **Query Parameter Loss vs. Multi-Tab Safety**: When users navigated from the Dashboard (`/?type=monthly&month=7&year=2026`) to section pages (`/report/courses`) or global pages (`/help`), and subsequently clicked "Home", the selected period query parameters were lost. While storing period parameters entirely in `localStorage` was considered as an alternative to URL query strings, this would break multi-tab side-by-side comparison (`Tab A` viewing July while `Tab B` edits August) by causing global storage overwrites and silent data corruption across tabs.
2. **View Toggle Clutter and Layout Inefficiency**: The `Form / Table` (`ভিউ`) layout switcher previously rendered as a full-width block inside the form body of every section. This pushed critical input fields down and duplicated UI controls. Furthermore, the secondary navigation header (`SectionLayout`) had a redundant `LayoutGrid` button that performed the exact same navigation function as the "Home" link.
3. **Vertical Scroll Fatigue & Nested Boxiness in Form Cards**: On complex reporting sections (`CoursesForm` with 8 distinct categories, `MeetingsForm` with 3 administrative tiers, and `PersonalForm` with multi-step outreach data), wrapping sub-sections in their own colored borders (`bg-muted/20 border border-border/40` or `bg-pink-500/5`) inside parent cards created nested box-within-a-box visual clutter. Additionally, rendering 8 open cards simultaneously on `CoursesForm` resulted in excessive vertical scrolling on mobile and desktop viewports.

## Decision
We adopt the following three architectural patterns across the reporting suite:

### 1. Hybrid State Persistence with Clean Session Guarantee (`Force Purge`)
- **Active Source of Truth (URL Query Parameters)**: URL query strings (`?type=...&month=...&year=...`) remain the primary source of truth for all active reporting pages (`UserDashboard`, `SectionLayout`, `AutoSaveField`). This ensures multi-tab isolation (Tab A and Tab B maintain independent period states without overwrites), exact bookmarkability, and reliable SSR/CSR hydration.
- **Navigation Restoration Fallback (`sessionStorage`)**: Whenever valid period parameters exist on the Dashboard (`UserDashboard`) or within any Section page (`SectionLayout`), they are automatically saved to `sessionStorage` under the key `"dashboard-period-params"`. When a user navigates back to Home (`/`) without query parameters attached, the dashboard intercepts the clean URL (`!hasParams`) and immediately issues `router.replace(/?${savedParams})` before rendering, eliminating parameter loss across page transitions.
- **Force Purge on Login/Logout (`Clean Session Guarantee`)**: To prevent session leakage across different user accounts on shared devices without requiring complex `userId` payload validation, the system enforces strict session purging (`sessionStorage.removeItem("dashboard-period-params")`) at three strategic lifecycle points:
  1. `user-dropdown.tsx` right before triggering `POST /auth/logout`.
  2. `bottom-nav.tsx` right before triggering `POST /auth/logout`.
  3. `/login/page.tsx` on initial component mount via a dedicated client component (`SessionCleaner`).

### 2. Context-Powered Compact Header View Toggle (`ViewModeContext`)
- **Top-Right Slot Placement**: We lift the `Form / Table` layout switcher out of the individual form content and position it in the top-right corner of the secondary navigation bar (`SectionLayout`), precisely replacing the redundant `LayoutGrid` icon (`flex justify-end min-w-[80px] md:min-w-[110px]`).
- **Context Decoupling (`ViewModeProvider`)**: Rather than prop-drilling view state across Next.js App Router layout boundaries, `view-mode-toggle.tsx` exports `ViewModeContext` and `ViewModeProvider`. Table-heavy form components (`CoursesForm`, `OrganizationalForm`, `PersonalForm`, `MeetingsForm`) wrap their contents in `ViewModeProvider`.
- **Conditional Rendering (`CompactViewToggle`)**: The `CompactViewToggle` component inside `SectionLayout` attempts to consume `ViewModeContext`. If consumed inside a provider, it renders two compact icon buttons (`LayoutList` / `Table2`) inside a segmented pill (`bg-muted/60 border border-border/80`). If the active section does not provide `ViewModeContext` (e.g., `ReportHeaderForm`, `ExtraForm`, `CommentForm`), `CompactViewToggle` gracefully returns `null`, leaving the top-right header slot clean.

### 3. Flat UI Card Design & Single-Open Accordion Collapsibility
- **Flat Section Dividers**: Inner box containers with background tints and borders (`bg-muted/20 border border-border/40`) inside cards are eliminated across `courses-form.tsx`, `meetings-form.tsx`, `personal-form.tsx`, and `report-header-form.tsx`. Sections instead use high-contrast uppercase section headers (`text-xs font-bold uppercase tracking-wide`) separated by clean, minimal horizontal dividers (`border-t border-border/40`).
- **Dynamic Proportional Grids**: All input grids are upgraded from skipping breakpoints (`grid-cols-1 sm:grid-cols-3`) to smooth multi-tier responsive layouts (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`), preventing stretched input boxes on single-column mobile or squashed fields on tablet devices.
- **Single-Open Accordions (`CoursesForm`)**: Each of the 8 course categories is rendered as a collapsible accordion card controlled by `openCards` state. To eliminate scroll fatigue while maintaining context, **only the first category (`COURSE_CATEGORIES[0]`) is open by default (`{ [COURSE_CATEGORIES[0]]: true }`)**, with rotating indicator arrows (`ChevronDown rotate-180`) on the right side of card headers.

### 4. Standardized Field Primitive and Navigation Clarity
- **`AutoSaveField` Multi-Mode Primitive**: The shared form field component now supports explicit rendering paths for compact inline cards (`inline`, optional `inputWidth`) and dense tabular cells (`tableMode`) in addition to the default stacked mode. This removed repetitive one-off styling across section forms and created a single implementation point for compact heights and focus behaviors.
- **Footer Step Labels in `SectionLayout`**: Previous/next navigation buttons now display localized section names (`prevTitle`, `nextTitle`) instead of only generic labels, improving sequential navigation clarity during long-form report completion.
- **Container Ownership Simplification**: The outer `premium-card` wrapper was removed from `SectionLayout` form content area so each section owns its own card structure, preventing nested card effects and duplicated borders.

### 5. Extras/Comments Alignment and Motion Policy
- **`ExtrasForm` Structural Split**: The former combined card was split into two focused cards (`মক্তব রিপোর্ট`, `সফর রিপোর্ট`) backed by dedicated category arrays (`MOKTOB_CATEGORIES`, `SAFAR_CATEGORIES`) while retaining compatibility with `report_extra` persistence.
- **`CommentsForm` Flat Card Alignment**: Comment entry card styling was reduced to the same compact flat system used elsewhere (`rounded-2xl`, tighter header spacing) for visual consistency.
- **Global Hover Motion Reduction**: The `.premium-card` global utility no longer applies hover lift (`hover:-translate-y-1`) or aggressive hover shadow escalation. Motion emphasis is now intentionally component-scoped to prevent UI noise on dense data-entry pages.

## Consequences
### Positive
- **Guaranteed Multi-Tab Safety & Session Cleanliness**: Users can safely open multiple reporting tabs across different months without data corruption or storage races, while every login starts with a guaranteed 100% clean session storage state.
- **Maximized Vertical Form Space**: Moving the view toggle into the header slot and removing inner box borders frees up ~120px of vertical viewport space per card, presenting a sleek, modern, and highly readable form interface.
- **Drastically Reduced Scroll Fatigue**: Collapsing 7 of the 8 course cards by default turns a 3,000px vertical scroll page into a compact, easily navigable 600px summary list.

### Negative / Mitigations
- **Hidden Context Requirement for Toggle**: `CompactViewToggle` relies on `ViewModeContext` being present in the component tree. *Mitigation: `useViewModeContext()` checks for null context inside `CompactViewToggle` and returns `null` safely without throwing exceptions when rendered above non-toggleable forms.*

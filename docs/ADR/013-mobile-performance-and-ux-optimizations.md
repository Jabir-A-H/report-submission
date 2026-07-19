# ADR 013: Mobile Performance & UX Optimizations

## Date
2026-07-19

## Context
During the mobile performance audit and UX refinement phase, several micro-interactions and layout behaviors were identified as causing friction for end-users, particularly on lower-end devices or slower networks.

1. **AutoSaveField Input Wiping:** The `AutoSaveField` component utilized an aggressive `useEffect` dependency array that included `getInitialValue`. As the user typed quickly, context state updates from other fields could trigger re-renders that reset the local input value back to the previous stable state, effectively wiping out the user's current keystrokes.
2. **Bottom Nav Layout Shift:** The `bottom-nav.tsx` dynamically rendered admin tabs (`/dashboard`, `/reports`, etc.) by awaiting a user role check via `supabase.auth.getUser()`. Because this DB call takes time, users visiting an admin route would initially see only the standard user tabs, which would then suddenly expand and shift layout once the admin state resolved, causing a jarring visual pop.
3. **City Report Full-Page Refresh:** When an admin saved an override in the `(admin)/city-report` page, the `CorrectionButton` triggered a hard `window.location.reload()`. This disrupted the single-page application (SPA) experience, destroyed local scrolling context, and forced the browser to re-download assets and state.

## Decision
We implemented three targeted optimizations to resolve these friction points without overhauling the architecture:

1. **Decoupled Local State from Upstream Props (`AutoSaveField`)**
   - Removed the aggressive dependency on the raw `getInitialValue` reference.
   - Refactored the `useEffect` to compare against the *evaluated primitive* value.
   - This ensures the local input state is only overridden from upstream when the actual primitive data value changes in the DB, isolating the user's keystrokes from sibling field re-renders.

2. **Eager Route Evaluation for Layout Stability (`bottom-nav.tsx`)**
   - Implemented an eager evaluation strategy checking `pathname.startsWith(...)` for known admin paths (`/dashboard`, `/reports`, `/city-report`, `/management`).
   - If the user is currently actively viewing an admin path, the Bottom Nav instantly assumes admin privileges and renders the admin layout without waiting for the slow `supabase.auth.getUser()` fetch.
   - This relies on the premise that `middleware.ts` and route guards already protect these routes; if the user is on the route, they are definitively an admin. This entirely eliminates the layout shift on load.

3. **Context-Driven Localized State Refresh (`CorrectionButton`)**
   - Deprecated the use of `window.location.reload()` on override saves.
   - Integrated the `ctx.refreshData()` method provided by `ReportContext` (which triggers localized `loadReport` fetching) and wired it into the `CorrectionButton` via an `onSuccess` callback.
   - Saving an override now cleanly updates the specific data block in the UI without unmounting the application shell.

## Consequences
- **Positive:** Significant reduction in UI layout shift on mobile devices.
- **Positive:** Data entry in `AutoSaveField` is now immune to concurrent state updates, guaranteeing no lost keystrokes.
- **Positive:** Admin workflows inside the City Report page feel substantially faster and maintain SPA fluidity.
- **Negative/Risk:** Eager evaluation in `bottom-nav` tightly couples the nav's assumed state to the `middleware.ts` security perimeter. If middleware were ever relaxed, the nav might briefly show admin tabs to non-admins before self-correcting (though this is acceptable since the pages themselves would still 401).

## Status
Accepted and Implemented.

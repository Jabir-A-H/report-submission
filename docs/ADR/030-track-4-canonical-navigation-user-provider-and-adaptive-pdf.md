# ADR 030: Track 4 Canonical Navigation, Unified UserProvider, Viewport Ergonomics, and Adaptive PDF Layout

**Date**: 2026-11-16  
**Status**: Accepted and Implemented  
**Deciders**: System Owner & Antigravity  
**Consulted**: `docs/issues-critique/SUMMARY.md`, `AGENTS.md` (Rules 2 & 6: Multi-Option Planning & Adversarial Doubt Gate; Rule 7: Pre-Production Agility)

---

## 1. Context and Problem Statement

Following the completion of Track 1 (Database DDL & Hygiene), Track 2 (Core Save Machine & Numeral Normalization), and Track 3 (Auth Security & Middleware Forwarding), **Track 4** addresses critical architectural debt and user experience blockers in navigation, layout rendering performance, mobile touch ergonomics, accessibility, and PDF print layout:

1. **Fragile 3-Tuple Query Routing (`RS-60` / `WEB-002`)**:
   - `user-dashboard.tsx` called the `get_or_create_report` RPC and acquired `repId`, but immediately discarded it and constructed URLs using 3-tuple parameters: `/report/[section]?type=${type}&month=${month}&year=${year}`.
   - When `/report/[section]/page.tsx` loaded, it re-queried `getUser()`, re-queried `people`, and **re-invoked the `get_or_create_report` RPC a second time**, generating an unnecessary 480ms mobile network waterfall and risk of query desynchronization.
   - Navigation between section tabs via `SectionLayout` passed raw query strings, while returning to `/` with `?reportId=42` reset `user-dashboard.tsx` back to the unselected period picker.

2. **Layout Auth Query Waterfall (`RS-67` / `WEB-006`)**:
   - [`navbar.tsx`](file:///d:/WebDev/report-submission/src/components/layout/navbar.tsx), [`bottom-nav.tsx`](file:///d:/WebDev/report-submission/src/components/layout/bottom-nav.tsx), and [`user-dropdown.tsx`](file:///d:/WebDev/report-submission/src/components/layout/user-dropdown.tsx) each independently invoked `supabase.auth.getUser()` and queried `people` for profile and zone data on every route transition (sextuplicate query overhead).

3. **Mobile Viewport Clearance & Navigation Clipping (`C06-03` / `WEB-010`)**:
   - Fixed `BottomNav` (`h-16`, 64px) + fixed stepper bar (`h-19`, ~76px) created a 140px fixed obstruction at the bottom of the screen.
   - `SectionLayout` outer container only specified `pb-24` (96px).
   - Exactly **44px of the form was permanently clipped behind the navigation bars** on mobile devices, preventing access to bottom inputs, submit toggles, and warning cards.

4. **Unbound Form Labels & Missing Input IDs (`RS-66`)**:
   - `AutoSaveField` inputs lacked `id`, `htmlFor`, and `aria-label` attributes. Screen readers announced "edit text, blank", while tapping labels failed to focus inputs.

5. **PDF 2-Page Print Guarantee & Adaptive Comments Layout (`C06-01`)**:
   - Monthly reports are duplex-printed on a single sheet of A4 paper.
   - On Page 2, available vertical height for comments alongside tables and signature is ~191.03 pt.
   - Manual newlines in comments can force unexpected page overflows.
   - However, for half-yearly or yearly reports, field coordinators legitimately require long comments.
   - Hard character or line truncations would destroy necessary reporting context.

6. **`PersonalForm` Table Row Totals (`C04-02` / `C04-04`)**:
   - Paper reporting sheets and PDF exports have a row total column (`মোট`) across the 3 categories (`সহযোগী`, `সক্রিয় সহযোগী`, `কর্মী`), which was missing from the web interface.
   - Naively computing totals from keystrokes causes full-table re-renders, triggering virtual keyboard collapse (`C03-01`).

7. **Submission Checkbox Touch Target Floor (`CommentsForm`)**:
   - Only the 24px checkbox `<input>` was interactive, resulting in missed taps on mobile.

8. **Help Guide Terminology Sync (`RS-65`)**:
   - `help-diagram-client.tsx` used stale `"সাইন আপ"` instead of canonical `"নিবন্ধন"`.

---

## 2. Decision Outcomes Matrix

| Problem Area | Chosen Architecture | Rejected Alternatives | Architectural Rationale & Implementation Details |
| :--- | :--- | :--- | :--- |
| **1. Canonical `reportId` Routing** | **Canonical `?reportId=42` with In-Memory Cache & Graceful Tamper Fallback** | 3-Tuple URLs with Optional Report ID (Option 1); Full App Router Path Restructuring `/report/[id]/[section]` (Option 3) | `user-dashboard.tsx` links directly to `/report/${section.id}?reportId=${repId}`. In `report/[section]/page.tsx`, if `reportIdParam` is present, `loadReport(id)` is called directly (skipping the RPC). In-memory cache hits render with 0 network calls. Catches `PGRST116` tampering and renders an authorization recovery card with a return button. Redirects admins to `/dashboard` (`WEB-006`). |
| **2. Layout Auth Consolidation** | **Unified Memoized `<UserProvider>` Context** | Sibling-Level Component State (Option 1); Server-Component Layout Prop Drilling (Option 3) | Implemented `src/components/providers/user-provider.tsx` and mounted in `RootLayout`. Subscribes to `supabase.auth.onAuthStateChange`. Gracefully handles guests without throwing. `Navbar`, `BottomNav`, and `UserDropdown` consume `useUser()`, cutting 6 queries per route transition to 0. |
| **3. Mobile Viewport Clearance** | **Safe-Area Aware `pb-[calc(10.5rem+env(safe-area-inset-bottom,0px))] md:pb-28`** | Hardcoded `pb-36` (Option 1); Dynamic JS Scroll Offset (Option 3) | Replaced outer container padding in `SectionLayout`. Guarantees 36px clearance above mobile `BottomNav` (64px) + fixed stepper bar (76px), and 20px clearance on desktop, completely eliminating clipping. |
| **4. Form Label Accessibility** | **Deterministic Collision-Free IDs & Sibling `<label htmlFor>`** | Bare `id={name}` (Option 1); Wrapping `<label><input /></label>` (Option 3) | Generated deterministic IDs: `field-${section}-${table}-${category || "root"}-${name}` in `AutoSaveField`. Bound via sibling `<label htmlFor={fieldId}>` (preventing synthetic click loops). Table mode inputs receive matching `id` and descriptive `aria-label`. |
| **5. PDF Comment Budgeting** | **Adaptive 2-Page / 3-Page Layout Engine** | Hard 16-Line Truncation (Option A); Dynamic Canvas Metric Simulation (Option C) | In `pdf/route.tsx`, comments are analyzed: `isLongComment = commentLines.length > 7 || normalizedComment.length > 500`. For normal comments, rendered on Page 2 with signature block (duplex 2-page print). For long comments (half-yearly/yearly), Page 2 renders an indicator note (`* বিস্তারিত মন্তব্য পরবর্তী পাতায় সংযোজিত (পৃষ্ঠা ৩)`) and signature block, while Page 3 is cleanly generated dedicated to full comments and signature. |
| **6. `PersonalForm` Totals** | **Context-Derived Table Row Totals** | Local State Keystroke Hoisting (Option A); Imperative DOM Mutation (Option C) | Added "সর্বমোট" column to table header. Derived `rowTotal` from `data?.personal` in ReportContext. Isolates keystrokes in local component state; totals recompute only on blur or idle save, ensuring 0ms IME keyboard latency. |
| **7. Submission Card Touch Floor** | **Full-Card `<label htmlFor>` with Submitting Lock** | Isolated Checkbox Click Handler (Option 1); Floating Modal Confirmation (Option C) | Converted outer container into a clickable `<label htmlFor="report-submission-checkbox">` with hover border and focus-within styling. When `submitting === true`, applied `pointer-events-none opacity-60 cursor-wait` to prevent double-click race conditions. |
| **8. Terminology Alignment** | **Uniform "নিবন্ধন" Across Documentation & UI** | Retaining Mixed "সাইন আপ" (Option 1) | Replaced all 10 occurrences of "সাইন আপ" with "নিবন্ধন" in `help-diagram-client.tsx`, matching `register-form-client.tsx` and `i18n.ts`. |

---

## 3. Verification & Quality Gates

All four project quality gates passed with zero defects:
- **TypeScript Gate**: `npx tsc --noEmit` $\rightarrow$ 0 errors.
- **Linting Gate**: `npm run lint` $\rightarrow$ 0 errors, 0 warnings.
- **Test Suite Gate**: `npm test` $\rightarrow$ 70/70 tests passing across 22 test suites.
- **Build Gate**: `npm run build` $\rightarrow$ Clean compilation across all 18 routes with exit code `0`.

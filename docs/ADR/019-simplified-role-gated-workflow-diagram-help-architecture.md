# ADR 019: Illustrated Non-Technical Visual Help Architecture with Theme-Adaptive UI Mockups

- **Status**: Accepted and Implemented
- **Date**: 2026-10-17 (Updated: 2026-10-18)

## Context

The initial help center implementation (`src/app/help/page.tsx`) was an AI-generated placeholder containing generic filler:
1. **Irrelevant Filler & Fake Contacts**: Hardcoded fake email (`support@talimulquran.org`), dummy telephone hotline (`+৮৮০ ১৭০০-০০০০০০`), fabricated support schedules (`সকাল ৯:০০ - রাত ৯:০০`), and generic FAQs explaining color themes and general philosophy.
2. **Cluttered Layout**: A bulky 2-column sidebar category navigation with 10 generic accordion questions that failed to explain how the actual application works.
3. **Broken Public Access**: The bottom footer on `/home` provided a "সাহায্য (Help)" link to `/help`, but `middleware.ts` lacked `/help` in `publicPaths`, causing unauthenticated visitors to be redirected straight back to `/home`.
4. **Developer Jargon Leakage**: Initial revisions included route slugs (e.g., `/api/export/pdf`, `/home → /pending-approval`), font name specifications ("Kalpurush font"), and page counts that confused non-technical Quran teachers and field coordinators.
5. **Lack of Visual Representation**: Pure text lists or breadcrumb pills lacked visual anchors showing what the interface actually looks like.

## Decision

1. **Zero Dead-Weight AI Removal & Zero Jargon**:
   - Completely deleted all placeholder FAQs, fake contact cards, accordion blocks, arbitrary tip boxes, and developer-centric URLs/font terms.
   - Replaced all route slugs with conversational Bengali/English action buttons (e.g. `[ নিবন্ধন পেজে যান ]`, `[ ফরম পূরণে যান ]`).

2. **Server-Side Role Resolution (Zero FOIC)**:
   - `src/app/help/page.tsx` is an async Server Component inspecting user session and role via `@/utils/supabase/server`.
   - Passes `initialIsAdmin` directly to client component `HelpDiagramClient`, guaranteeing that administrators receive the Admin Workflow Diagram on first SSR render with zero flash of content (FOIC) or layout shifting.

3. **Illustrated Step-by-Step Visual Walkthrough with Component Mockups**:
   - Instead of static PNG images (which fail in Dark/Solarized themes, add 5–10MB load on spotty 3G, and cannot switch languages dynamically), designed **100% Theme-Adaptive SVG/CSS Component Mockups**:
     - **For Users (`role = 'user'` or public visitors)**:
       1. **ধাপ ০১: অ্যাকাউন্ট নিবন্ধন ও অনুমোদন**: Mockup of registration form + Zone dropdown (Pin ❶) + sign up button (Pin ❷) + Pending approval status card (Pin ❸). Includes callout: *"নিবন্ধনের পর সাথে সাথে কেন লগইন হয় না?"*
       2. **ধাপ ০২: লগইন ও রিপোর্টের মাস নির্বাচন**: Mockup of period mode pills + year/month dropdowns (Pin ❶) + "ফরম পূরণ করুন" launch button (Pin ❷). Includes callout: *"ভুল মাস নির্বাচন করলে কী করবেন?"*
       3. **ধাপ ০৩: ধাপে ধাপে ৭টি সেকশন পূরণ ও অটো-সেভ**: Mockup of 7 section tabs (Pin ❶) + numeric inputs (Pin ❷) + live cloud auto-save badge (Pin ❸: `[ ✓ সংরক্ষিত ]` vs `[ ⚠️ আবার চেষ্টা করুন ]`). Includes callout: *"কোনো সেভ বাটন নেই কেন? (অটো-সেভ কীভাবে কাজ করে)"*
       4. **ধাপ ০৪: এক নজরে যাচাই ও চূড়ান্ত জমাদান**: Mockup of consolidated summary (Pin ❶) + "চূড়ান্ত রিপোর্ট জমা দিন" button (Pin ❷) + submission lock indicator (Pin ❸). Includes callout: *"জমা দেওয়ার পর ভুল সংশোধন করা যাবে কি?"*
       5. **ধাপ ০৫: অফিসিয়াল PDF ও Excel ডাউনলোড**: Mockup of download buttons (Pin ❶) + 2-page print layout preview (Pin ❷) + print/share tips (Pin ❸). Includes callout: *"মোবাইল থেকে কীভাবে প্রিন্ট করবেন?"*
     - **For Administrators (`role = 'admin' | 'superadmin'`)**:
       1. **ধাপ ০১: কমান্ড সেন্টার ও অগ্রগতি পর্যবেক্ষণ**: Dashboard KPI card mockup (submitted vs pending zone progress).
       2. **ধাপ ০২: ব্যবহারকারী অনুমোদন ও জোন নিয়ন্ত্রণ**: User management table mockup with 1-click approval (`[ ✅ অনুমোদন দিন ]`).
       3. **ধাপ ০৩: জমাকৃত জোন রিপোর্ট অডিট**: Submitted reports table mockup with filter and audit view drawer.
       4. **ধাপ ০৪: সমন্বিত সিটি রিপোর্ট ও সেল ওভাররাইড**: City aggregated data table with Edit Mode toggle and amber-highlighted cell override (`৭৫০ ✏️`).
       5. **ধাপ ০৫: অফিসিয়াল মহানগরী PDF ও Excel এক্সপোর্ট**: Metropolitan executive export engine mockup.
     - Role-gated switcher (`[ 🛡️ অ্যাডমিন গাইড | 👤 ব্যবহারকারী গাইড ]`) retained strictly for administrators.

4. **Interactive Stage Stepper Navigator**:
   - Replaced redundant breadcrumb ribbon with a responsive sticky 5-stage navigator allowing instant smooth-scroll jumping to any step.

5. **Public Path Whitelisting & Layout Resilience**:
   - Whitelisted `'/help'` in `middleware.ts`.
   - Provided graceful unauthenticated fallbacks in `UserDropdown` and `BottomNav`.

## Consequences

### Positive
- **High-Density Usability for Non-Tech Users**: Clear visual recognition of screens, buttons, and badges with numbered pins.
- **Zero Asset Overhead**: Component mockups load instantly (0ms network request) and adapt to Light, Dark, and Solarized themes dynamically.
- **Bilingual & Responsive**: Seamless Bengali and English switching across all mockups and text.
- **Proactive Troubleshooting**: Directly addresses real-world friction (approval delay, auto-save confusion, report locking).

### Trade-offs
- Mockups require maintaining Tailwind template elements rather than relying on external image files, but this ensures complete design system cohesion and zero network latency.

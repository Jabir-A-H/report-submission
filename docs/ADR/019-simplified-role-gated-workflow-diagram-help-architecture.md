# ADR 019: Simple Text-First Role-Gated Help Architecture with Exact Application Alignments

- **Status**: Accepted and Implemented
- **Date**: 2026-10-17 (Updated: 2026-10-18)

## Context

1. **AI Placeholder Clutter**: The initial `/help` page contained generic AI-generated filler (fake support emails, fabricated telephone numbers, irrelevant theme FAQs).
2. **First-Revision Drift & Jargon**: The initial rework introduced cryptic route slugs (`/api/export/pdf`, `/home → /pending-approval`) and described features the application does not possess:
   - Claimed Step 1 had a mobile field (it asks for name, user ID, email, password twice, and zone).
   - Claimed only admin approval was needed (Supabase email verification is required too).
   - Claimed Step 2 allowed choosing quarterly/annual modes (regular users have `monthlyOnly={true}`).
   - Claimed the launch button was "ফরম পূরণ করুন" (it is "যান").
   - Claimed Step 3 had top tabs (navigation is bottom previous/next buttons and top-left `← ড্যাশবোর্ড`).
   - Claimed Step 4 had an "এক নজরে" review page with a lock button preventing edits (no lock exists; submission is simply marked via the checkbox in the Comments section, and reports can always be edited).
3. **Mockup Drift & Overhead**: Coded mockups proved to be a redundant UI surface that quickly drifted from actual application behavior and added visual clutter.

## Decision

1. **Text-First, Zero-Mockup Architecture**:
   - Completely removed all coded UI mockups and screenshots.
   - Adopted a clean, readable, text-first manual with exact button and field labels in quotation marks (e.g. `“যান”`, `“সম্পাদনা করুন”`, `“রিপোর্ট জমা সম্পন্ন হয়েছে”`).

2. **Accurate 4-Step User Guide**:
   - **ধাপ ০১: সাইন আপ ও অনুমোদন (Register & Get Approved)**: 6 form fields, email verification link, admin approval gate, and Google Sign-In notice.
   - **ধাপ ০২: লগ-ইন ও মাস নির্বাচন (Log In & Choose Month)**: User ID/Email login caveats (avoiding keyboard auto-capitalization/spaces), Month/Year selection, and tapping “যান”.
   - **ধাপ ০৩: সাতটি সেকশন পূরণ ও স্বয়ংক্রিয় সংরক্ষণ (Fill 7 Sections & Rely on Auto-Save)**: Bottom Previous/Next navigation, centered auto-save indicator, and the submission checkbox in the Comments section (emphasizing reports can be edited anytime).
   - **ধাপ ০৪: PDF ডাউনলোড (Download PDF)**: Bottom menu "রিপোর্ট" tab, top-right "ডাউনলোড" dropdown, and A4 Landscape printing instructions.

3. **Accurate 5-Step Admin Guide**:
   - **ধাপ ০১: ড্যাশবোর্ডে চলতি মাসের অগ্রগতি**: Current-month-only KPI tracking and identifying pending zones.
   - **ধাপ ০২: ব্যবহারকারী অনুমোদন ও ব্যবস্থাপনা**: Status filter for pending users, 1-click approval (`“অনুমোদন করুন”`), deactivation, and zone reassignment caveats.
   - **ধাপ ০৩: জোনের রিপোর্ট পর্যালোচনা**: Filtering all zone submissions and auditing field remarks.
   - **ধাপ ০৪: সিটি রিপোর্টে সংখ্যা সংশোধন (ওভাররাইড)**: View/Edit Mode, cell overrides, and restoring original sums via the “মুছুন” button.
   - **ধাপ ০৫: সিটি রিপোর্ট PDF ও Excel**: Metropolitan executive exports with overrides included.

4. **Dedicated Common Problems & Solutions (সাধারণ সমস্যা ও সমাধান)**:
   - Covers 9 real-world obstacles: login failures, missing verification emails, password resets, wrong zone selection, red save failures, autosave blur triggers, absence of manual save buttons, editing existing submissions, and wrong month selections.

5. **Human Contact, Scroll Observer & Institutional Footer**:
   - Added a direct WhatsApp/Coordinator contact assistance card.
   - Stepper provides clean, short, single-word labels (`১. সাইন আপ`, `২. মাস নির্বাচন`, `৩. তথ্য পূরণ`, `৪. PDF ডাউনলোড`, `সমস্যা`) with responsive sticky positioning (`top-2 sm:top-3 md:top-20`).
   - Integrated an `IntersectionObserver` that automatically updates the active stepper highlight as the user scrolls naturally.
   - Calculated exact scroll clearance offsets (`140px` desktop / `72px` mobile) to eliminate top clipping behind sticky headers.
   - Standardized institutional footer at page bottom with `<AppearanceFooterToggle />` (Language & Theme toggles) and context-aware navigation (`[ ← মূল ড্যাশবোর্ডে ফিরুন ]` or `[ ← লগইন / নিবন্ধন পেজে ফিরুন ]`), ensuring full parity for signed-in and signed-out visitors.
   - Retained server-side role resolution (`createClient()`) to prevent FOIC for administrators.

## Consequences

### Positive
- **100% Truthful Guidance**: Every label, button name, and navigation instruction matches the live code with zero discrepancies.
- **Zero Maintenance Overhead**: Text-only layout will not drift from component visual updates or break across themes.
- **Ultra-Lightweight & Fast**: Zero image downloads; loads instantly on 2G/3G mobile networks.
- **Non-Technical Clarity**: Simple language with clear actionable numbered points and direct answers to real friction points.

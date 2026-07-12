# ADR 004: Dynamic Responsive Table Thresholds and Transparent Border-Framed Inline Stats Architecture

**Status**: Accepted  
**Date**: 2026-07-12  
**Author**: Engineering Team  

## Context
The Report Submission System displays ~250+ quantitative and qualitative metrics across 7 major reporting sections, including multi-column data tables (`report_courses`, `report_organizational`, `report_personal`, `report_meetings`) and inline category statistics (`report_extras` for Maktab and Safar).

On mobile devices (`< 640px` viewports), previous iterations suffered from two significant UI/UX challenges:
1. **Unconstrained Table Squishing vs. Excessive Horizontal Scrolling**: Standard `w-full` tables with many columns either squeezed text into illegible, vertical multi-line slivers, or forced users to scroll horizontally before they could even identify the row subject (e.g., in the Dawah or Meeting tables).
2. **Inline Stats Visual Clutter & Double Boxiness**: Inline statistics summaries (`মক্তব রিপোর্ট:`, `সফর রিপোর্ট:`) positioned below tables used prominent colored backgrounds (`bg-purple-500/5`, `bg-cyan-500/5`) inside colored borders. When placed immediately below table containers (`rounded-xl border border-border`), this created visual dissonance, box-within-a-box clutter, and shrunk metric font sizes (`text-xs`).

## Decision
We adopt a dual-layout specification for responsive tabular reporting and inline metrics:

### 1. Situation-Based Dynamic Minimum Widths (`min-w-[px]`) with Proportional Allocation
- For medium-density tables (`Section 2: দাওয়াত ও সংগঠন` and `Section 3: ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন`), tables enforce `table-fixed w-full min-w-[500px]`.
- For `Section 4: বৈঠকসমূহ`, tables enforce `table-fixed w-full min-w-[520px]`.
- Columns are allocated strict proportional percentage widths (e.g., `w-[34%] : w-[17%] : w-[17%] : w-[16%] : w-[16%]`). Because the minimum width locks at `500px`/`520px` inside `overflow-x-auto`, the critical first 3 columns (`68%` of `500px` = `340px`) occupy exactly 100% of standard portrait mobile viewports (`360px–390px`). Users immediately read the category label, numeric count (`সংখ্যা`), and net growth (`বৃদ্ধি`) without scrolling, while secondary financial/comment columns overflow cleanly to the right. On larger viewports (`> 500px`), `w-full` expands smoothly across all columns without horizontal scrollbars.

### 2. Transparent, Border-Framed Inline Statistics Structure (`report_extras`)
- All container background tints (`bg-purple-500/5`, `bg-cyan-500/5`) are eliminated (`bg-transparent`).
- Outer containers match the exact curvature and border token of main tables (`p-4 rounded-xl border border-border text-xs sm:text-sm`).
- Inner metric items inside the responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5`) are framed in sleek individual border boxes (`px-3 py-2 rounded-lg border border-border/70`). On mobile (`grid-cols-1`), each item sits on its own row (`flex items-center justify-between gap-0.5 py-0.5`), separating label and number clearly without multi-line wrapping.
- Metric numbers maintain normal high-visibility typography (`font-black text-foreground text-sm sm:text-base`), and labels maintain `text-muted-foreground font-semibold`.

### 3. 3-Tier Opaque Report Header & URL Parameter Preservation
- Report headers follow strict typographic hierarchy: Line 1: `বিসমিল্লাহির রহমানীর রহীম` (`font-bold text-foreground`), Line 2: `তা'লীমুল কুরআন বিভাগ` (`text-2xl md:text-3xl font-black text-foreground`), Line 3: `{zone} জোন — {reportType} রিপোর্ট — {displayPeriodLabel}` (`text-lg md:text-xl font-bold text-foreground`).
- `Navbar` and `BottomNav` are wrapped in `<Suspense>` boundaries (`RootLayout`) so `useSearchParams()` preserves active filters (`zone_id`, `month`, `year`, `report_type`) across navigation transitions.

## Consequences
### Positive
- **Guaranteed Mobile Legibility**: Mobile users get immediate visibility of core metric columns (`সংখ্যা` and `বৃদ্ধি`) on 100% of standard mobile viewports without scrolling or squishing.
- **Visual Harmony**: Inline Maktab and Safar statistics blend harmoniously with table borders, presenting crisp, highly legible metric cards without boxiness or color clash.
- **Parameter Continuity**: URL query parameters (`zone_id`, `month`, `year`) persist seamlessly across mobile tab navigation.

### Negative / Mitigations
- **Scrollbar Requirement on Small Screens**: Tables with `min-w-[500px]` will display horizontal scrollbars on viewports narrower than `500px` when inspecting the rightmost columns (`পরিমাণ / টাকা`, `মন্তব্য`). *Mitigation: Horizontal scroll is wrapped in `overflow-x-auto` on the parent card, ensuring smooth touch swiping without horizontal page wobble.*

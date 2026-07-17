# ADR 012: Route Group Simplification (`(admin)`), Authoritative Submission Governance (`is_submitted`), & Full-Field City Report Parity

## Status
Accepted (2026-07-17)

## Context & Problem Statement
1. **URL Redundancy & Route Duplication**: The project originally mounted administrative pages under `src/app/admin/*`, resulting in multi-segment URLs (`/admin`, `/admin/reports`, `/admin/city-report`, `/admin/management`). Because global top and bottom navigation bars (`Navbar`, `BottomNav`) already rendered unified tabs, having `/admin` inside paths added unnecessary URL length while risking layout structure duplication (`/admin/layout.tsx`). Per our **Zero Dead-Weight & No Backward Compatibility Policy**, we needed clean, direct, top-level URLs (`/dashboard`, `/reports`, `/city-report`, `/management`).
2. **Ambiguous Completion Metrics on Admin Dashboard**: The Current Month Report Condition panel (`/dashboard`) calculated `submittedCount` vs `pendingCount` solely by checking whether a row existed in `public.report` for that `(year, month, zone_id)` combination (`get_or_create_report` RPC). Because opening any section initialized a row, partially filled drafts (`is_submitted === false`) were mistakenly counted as completed submissions on the admin summary.
3. **Incomplete City Report Fields & Lack of View/Edit Mode Toggle**: The City Report (`/city-report`, previously titled `এডিট রিপোর্ট`) only allowed overriding numeric values (`total_muallima`, `courses`, `meetings`). It lacked Section 5 (**৫. মন্তব্য ও বিশেষ পর্যালোচনা / Comments**) where city admins could review or override qualitative city remarks (`city_comment`), and lacked an interactive toggle to cleanly hide correction badges/buttons when inspecting in View Mode.

## Decision
1. **Next.js Route Grouping (`src/app/(admin)/*`) & Zero Legacy Redirects**:
   - Replaced `src/app/admin/*` directory with the route group `src/app/(admin)/*`.
   - Mounted `dashboard/page.tsx` (`/dashboard`) as the authoritative index, and directly mounted `reports/page.tsx` (`/reports`), `city-report/page.tsx` (`/city-report`), and `management/page.tsx` (`/management`).
   - Updated `middleware.ts`, root `page.tsx`, `SectionSwitcher`, `Navbar`, `BottomNav`, and `UserDropdown` to directly target clean paths without `/admin/` redirect layers.
2. **Authoritative Submission Governance via `is_submitted` BOOLEAN**:
   - Added `is_submitted (BOOLEAN DEFAULT false)` to `public.report`.
   - Embedded the **"রিপোর্ট জমা সম্পন্ন হয়েছে (Report Submission Done)"** checkbox inside `CommentsForm` (`/report/comment`), storing submission state atomically.
   - Refactored the dashboard Current Month Report Condition panel (`/dashboard`) to strictly check `r.is_submitted === true` when partitioning `submittedCount` and `pendingCount`.
3. **Upgraded String/Text Overrides (`isText={true}`) & City Report Parity**:
   - Upgraded `CorrectionButton` and `NumericCell` to accept `isText={true}`, rendering a `<textarea>` modal and persisting text overrides in `city_report_override` (`data_type = text`).
   - Added Section 5 (**৫. মন্তব্য ও বিশেষ পর্যালোচনা / Comments**) right inside `CityReportPage` (`/city-report`), enabling city admins to input or override `city_comment` alongside numeric metrics.
   - Renamed `/city-report` title across `Navbar`, `BottomNav`, `UserDropdown`, and `CityReportPage` back from `এডিট রিপোর্ট` to `সিটি রিপোর্ট` ("City Report").
   - Added the **`[ 👁️ ভিউ মোড / ⚡ এডিট মোড ]`** toggle to `CityReportPage`, dynamically toggling `isEditing` to hide or show correction triggers cleanly.

## Consequences
- **Positive**:
  - Clean, professional URLs (`/dashboard`, `/reports`, `/city-report`, `/management`) with zero routing overhead or duplication.
  - 100% accurate dashboard completion tracking — admins only see `Submitted` once the zone leader checks the final box on `/report/comment`.
  - Full-field parity on `/city-report` — city admins can edit/override every single cell and comment while switching effortlessly between clean inspection (`View Mode`) and rapid adjustment (`Edit Mode`).
- **Negative**:
  - Requires running `ALTER TABLE public.report ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT false;` on database environments where not yet applied.

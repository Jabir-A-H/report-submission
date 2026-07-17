# ADR 011: Universal Click-Outside Modal Governance & Touch-Safe Dismissal

## Status
Accepted (2026-07-17)

## Context
During Round 3.6 usability testing across mobile devices and desktop viewports (`/admin/city-report` override panel and `/admin/management` modals), two competing UX priorities collided:
1. **Effortless Inspection**: Users tapping cells or quick-view buttons to inspect details (`CorrectionButton` or `selectedZoneForUsers`) expect 1-click dismissal when tapping anywhere outside the modal box (`onClick` on `fixed inset-0`).
2. **Accidental Data Loss Protection**: On mobile touch screens (`< sm`), accidental edge taps while typing inside an input field (`newValue` or `newZoneName`) would abruptly close the modal and erase unsaved input if click-outside was unconditional.

## Decision
All modal dialogs and floating panels across the platform enforce a **Conditional Click-Outside (`If Unchanged`) Dismissal Policy**:
- **Read-Only / Inspection Panels (`selectedZoneForUsers`, `UserDropdown`, `BottomNav` profile)**: Unconditionally close when `e.target === e.currentTarget` on the backdrop.
- **Form / Data-Entry Panels (`CorrectionButton`, `isAddZoneModalOpen`)**: Evaluate input state modification before closing:
  ```typescript
  onClick={(e) => {
    if (e.target === e.currentTarget && newValue === currentValue.toString() && !isSaving && !isDeleting) {
      setIsOpen(false);
    }
  }}
  ```
  If the input value differs from the initial state, the backdrop click is safely ignored, requiring the user to explicitly tap **বাতিল** (Cancel) or **✕** to discard changes.

## Related Engineering Invariants (Audited via `/learn`)
1. **Top-Level Component Extraction**: All React child components (`NumericCell`, `CorrectionButton`) and context definitions (`CityReportContext`) are defined outside page component bodies (`CityReportPage()`) to prevent `react-hooks/static-components` render-loop errors.
2. **Supabase Browser Client Memoization**: Every Client Component reading or mutating data via `@/utils/supabase/client` wraps the client instance inside `useMemo(() => createClient(), [])`.
3. **Database Nullable Composite Uniqueness (`UNIQUE NULLS NOT DISTINCT`)**: When PostgREST `onConflict` (`upsert`) is invoked across columns where some fields allow `NULL` (`category`), the Postgres table must enforce uniqueness via `UNIQUE NULLS NOT DISTINCT` composite constraints (`city_report_override_unique_key`).

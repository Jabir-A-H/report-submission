# Segment 03 Investigation Report: Form Ergonomics, Matrix Inputs & Section Presentation

**Target Source Files Audited**:
- [`src/components/report/sections/report-header-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/report-header-form.tsx)
- [`src/components/report/sections/courses-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/courses-form.tsx)
- [`src/components/report/sections/organizational-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/organizational-form.tsx)
- [`src/components/report/sections/personal-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/personal-form.tsx)
- [`src/components/report/sections/meetings-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/meetings-form.tsx)
- [`src/components/report/sections/extras-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/extras-form.tsx)
- [`src/components/report/sections/comments-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx)
- Coupled Infrastructure & Primitives:
  - [`src/components/report/auto-save-field.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx)
  - [`src/components/report/view-mode-toggle.tsx`](file:///d:/WebDev/report-submission/src/components/report/view-mode-toggle.tsx)
  - [`src/components/report/section-layout.tsx`](file:///d:/WebDev/report-submission/src/components/report/section-layout.tsx)
  - [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts)
  - [`src/lib/i18n.ts`](file:///d:/WebDev/report-submission/src/lib/i18n.ts)

**Target Documentation Audited**:
- `docs/TECHNICAL_MANUAL.md` (Chapters 2.3, 5)
- `docs/ADR/004-dynamic-responsive-tables-and-transparent-stats-architecture.md`
- `docs/ADR/007-authoritative-labeling-harmonization-and-2-page-landscape-pdf-architecture.md`
- `docs/ADR/010-edit-report-override-constraint-and-display.md`
- `docs/ADR/015-sprint-1-save-integrity-and-input-normalization.md`
- `docs/ADR/020-track-1-quick-wins-and-input-normalization.md`
- `docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md`
- `docs/ADR/026-behavioral-stability-unmount-dirty-flush-role-hierarchy-and-foic-elimination.md`
- `docs/ADR/027-track-1-database-ddl-rls-hardening-and-storage-hygiene.md`
- `docs/ADR/030-track-4-canonical-navigation-user-provider-and-adaptive-pdf.md`
- `docs/KNOWN_ISSUES.md` (`Mobile Touch Target Ergonomics`, `RS-30`, `RS-32`, `RS-34`, `RS-66`)

---

## 1. Executive Scorecard & Segment Quality Assessment

### Overall Letter Grade: C+

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEGMENT 03 ARCHITECTURAL SCORECARD                  │
├────────────────────────────────────────────────────────────────────────┤
│  Matrix Form Presentation & Dual Views: B- (Table & Card toggle works, │
│                                            accordion dirty flush safe) │
│  Accessibility & Screen Reader Binding: F  (label="" passes raw SQL    │
│                                            column names to aria-label) │
│  Database Invariant Alignment & Limits: D  (Missing 1500-char limit    │
│                                            causes silent DB crash)     │
│  Submission Governance & Lock State:    D- (Submit done checkbox locks  │
│                                            nothing; inputs wide open)  │
│  Unicode NFC & Nukta Integrity:         D+ (Decomposed U+09BC nuktas   │
│                                            in code vs U+09DF DB claims)│
│  Mobile Ergonomics & Touch Target:      C  (36px table cells, no Enter │
│                                            navigation, outline-none)   │
│  i18n Localization Parity:              C  (toBn hardcoded on totals,  │
│                                            English Form/Table toggle)  │
│  Rule 7 Pre-Production Agility:         C- (Ghost column fallbacks,    │
│                                            dual-string documentation)  │
└────────────────────────────────────────────────────────────────────────┘
```

### Executive Summary
Segment 03 encapsulates the core data-entry surface of the application across 7 distinct organizational reporting domains comprising ~250 individual input cells. The section forms implement a dual-mode presentation architecture: an interactive collapsible accordion card view for mobile devices and a dense tabular matrix for desktop displays, coupled with dynamic responsive sticky column positioning.

While the basic rendering, 1,000ms debouncing, and unmount flush mechanisms work well, an exhaustive line-by-line behavioral and architectural audit uncovered several critical pre-production defects, accessibility failures, and documentation drifts:

1. **Catastrophic Screen Reader Announcer Leak (`CRIT-03-01`)**: In all 4 matrix tables (`CoursesForm`, `OrganizationalForm`, `PersonalForm`, `MeetingsForm`), developers passed `label=""` to `AutoSaveField` to suppress visual labels in table cells. In [`auto-save-field.tsx#L233`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L233), `aria-label` falls back to `${category || section} ${label || name}`. Because `label` is empty, screen readers announce raw internal database column identifiers (e.g. `"বিশিষ্টদের status_quran"`, `"দাওয়াত দান amount"`, `"রুকন became_shohojogi"`, `"কমিটি বৈঠক হয়েছে thana_avg_attendance"`) to visually impaired Bengali field workers.
2. **Silent Database CHECK Constraint Crash on Comments (`CRIT-03-02`)**: In ADR 027, PostgreSQL added `CHECK (char_length(comment) <= 1500)` to `report_comment.comment`. However, [`comments-form.tsx`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx) and `AutoSaveField` implement **zero** client-side `maxLength={1500}` enforcement and no character counter. Entering or pasting >1500 characters triggers an unhandled PostgreSQL constraint violation, causing the field to flash red with a generic "সংরক্ষণ ব্যর্থ হয়েছে" error with zero explanation.
3. **Submission State Illusion & Missing Read-Only Gate (`CRIT-03-03`)**: Checking the "রিপোর্ট জমা সম্পন্ন হয়েছে" box in `CommentsForm` marks `report.is_submitted: true`, but does **not** lock, disable, or render a read-only warning in any of the 7 section forms. A field worker or supervisor who believes the report is officially frozen can inadvertently touch an input on a mobile device and silently overwrite submitted data.
4. **Unicode Nukta Normalization Split & Ghost Column Shenanigans (`CRIT-03-04`)**: Despite ADR 027 claiming complete normalization to canonical precomposed `U+09DF` ('য়') and engine-level `CHECK (position(chr(2492) in category) = 0)` guards, category string literals in [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts) (`ORG_CATEGORIES`, `PERSONAL_CATEGORIES`, `MEETING_CATEGORIES`) still contain decomposed `U+09BC` Nukta bytes (`chr(2479)||chr(2492)`). Furthermore, residual ghost column fallbacks (`course_name === category` and `meeting_type === category`) remain in active code paths, and `TECHNICAL_MANUAL.md` continues to document obsolete dual-string fallbacks.
5. **Mobile Viewport Obstruction & Pseudo-Navigation**: The sticky left category column in `CoursesForm` is fixed at `w-48` (192px), consuming over 60% of a 320px mobile screen and leaving only 128px for 12 input columns. Additionally, `enterKeyHint="next"` is purely decorative because `AutoSaveField` has no `onKeyDown` listener, and accordion buttons strip focus rings with `outline-none` without providing `focus-visible`.

Under **`AGENTS.md` Rule 7 (Pre-Production Agility)**, all legacy polyfills, ghost matchers, and unconstrained inputs must be cleaned up before live field deployment.

---

## 2. Rule 7 Pre-Production Bloatware & Legacy Shenanigans Register

| Ref ID | File & Line | Description | Real-World Failure Mode | Clean Pre-Production DDL/Architecture Remedy |
|:---|:---|:---|:---|:---|
| **BLOAT-03-01** | [`auto-save-field.tsx#L60-L61`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L60-L61), [`report-context.tsx#L153-L154`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L153-L154) | Dead prototype column checks: `item.course_name === category` and `item.meeting_type === category`. | Architectural dead-weight from ancient prototypes. PostgreSQL child tables `report_course` and `report_meeting` strictly use `category`. If child tables actually had `course_name`, subsequent mutations via `.eq('category', category)` would fail. | Completely purge `course_name` and `meeting_type` checks from all client state mappers; enforce pure canonical `item.category === category`. |
| **BLOAT-03-02** | [`personal-form.tsx#L38, #L109`](file:///d:/WebDev/report-submission/src/components/report/sections/personal-form.tsx#L38) | Asymmetric label & Nukta workaround: `{cat === "সক্রিয় সহযোগী" ? t.labels.becameActiveAssociate : tc(cat as any)}`. | Hardcoded special-case workaround caused by Unicode mismatch between decomposed `PERSONAL_CATEGORIES[2]` (`\u09af\u09bc`) and precomposed dictionary keys (`\u09df`). In English mode, renders verb phrase "Became Active Associate" alongside noun headers "Rukn" and "Worker". | Normalize all category constants to canonical precomposed NFC `\u09df`. Replace special-case ternary with standard `tc(cat as any)` rendering the proper noun "Active Associate" / "সক্রিয় সহযোগী". |
| **BLOAT-03-03** | [`TECHNICAL_MANUAL.md#L96, #L98`](file:///d:/WebDev/report-submission/docs/TECHNICAL_MANUAL.md#L96) | Documentation claims active dual-string fallbacks: `find(r => r.category === cat || r.category === 'সহযোগী হয়েছে')` and `find(r => r.category === cat || (cat === 'Committee Orientation' && x.category === 'Committee Orientation / Muallima Orientation'))`. | Documentation drift. These defensive shims were already purged from live export and loader pipelines during Track 1 pre-production normalization. Retaining them in documentation creates cognitive clutter and leads future developers to re-introduce obsolete shims. | Reconcile `TECHNICAL_MANUAL.md` Chapter 2.3 to state that all category queries strictly enforce canonical single-string equality (`r.category === cat`). |
| **BLOAT-03-04** | [`extras-form.tsx#L6-18, #L4`](file:///d:/WebDev/report-submission/src/components/report/sections/extras-form.tsx#L6-L18) | Private duplicate category arrays `MOKTOB_CATEGORIES` and `SAFAR_CATEGORIES` declared locally; unused `Send` icon import. | Violates Single Source of Truth architecture (ADR 025). Category renaming in `src/lib/report-utils.ts` leaves `extras-form.tsx` out of sync, causing silent 0-row save drops. `Send` icon lingers as unimported dead code. | Export `MOKTOB_CATEGORIES` and `SAFAR_CATEGORIES` directly from `src/lib/report-utils.ts` and import them in `extras-form.tsx`. Purge `Send` import. |
| **BLOAT-03-05** | [`i18n.ts#L367, #L385, #L370, #L386`](file:///d:/WebDev/report-submission/src/lib/i18n.ts#L367) | Duplicated category keys with differing Unicode Nukta bytes (`'সহযোগী হয়েছেন'` vs `'সহযোগী হয়েছেন'`, `'সক্রিয় সহযোগী'` vs `'সক্রিয় সহযোগী হয়েছেন'`). | Clutters the translation dictionary and masks Unicode normalization bugs in upstream callers. Lookups silently fail depending on whether the caller passes decomposed `U+09BC` or precomposed `U+09DF`. | Standardize all dictionary keys on verified canonical precomposed NFC Unicode characters (`\u09df`) and prune duplicate entries. |

---

## 3. 5-Layer Behavioral & Functional Defect Catalog (`WEB-001`–`WEB-014`)

### 3.1 Layer 1: DOM & Matrix UI Defect Catalog

#### `DEFECT-03-01` (`WEB-007`): Screen Reader SQL Column Name Leak in All 4 Table Views
- **Location**:
  - [`src/components/report/sections/courses-form.tsx#L56-L67`](file:///d:/WebDev/report-submission/src/components/report/sections/courses-form.tsx#L56-L67)
  - [`src/components/report/sections/organizational-form.tsx#L33-L37`](file:///d:/WebDev/report-submission/src/components/report/sections/organizational-form.tsx#L33-L37)
  - [`src/components/report/sections/personal-form.tsx#L65-L73`](file:///d:/WebDev/report-submission/src/components/report/sections/personal-form.tsx#L65-L73)
  - [`src/components/report/sections/meetings-form.tsx#L68-L74`](file:///d:/WebDev/report-submission/src/components/report/sections/meetings-form.tsx#L68-L74)
  - Coupled primitive: [`src/components/report/auto-save-field.tsx#L233`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L233)
- **Root Cause**: In `tableMode`, the forms do not render visual `<label>` elements. To avoid rendering visual labels, all 4 form components pass `label=""` to every `AutoSaveField`. In `auto-save-field.tsx`, line 233 sets:
  ```tsx
  aria-label={`${category || section} ${label || name}`}
  ```
  Because `label` is empty (`""`), the expression falls back to `name`—which is the raw, internal PostgreSQL database column name!
- **Failure Conditions**: A visually impaired field worker or user operating a screen reader (TalkBack on Android, VoiceOver on iOS, NVDA on Windows) navigates table cells in Table View mode.
- **Observed Behavior**: The screen reader announces:
  - `"বিশিষ্টদের number"` instead of `"বিশিষ্টদের সংখ্যা"`
  - `"বিশিষ্টদের status_board"` instead of `"বিশিষ্টদের বোর্ড"`
  - `"বিশিষ্টদের status_qayda"` instead of `"বিশিষ্টদের কায়দা"`
  - `"দাওয়াত দান amount"` instead of `"দাওয়াত দান পরিমাণ"`
  - `"রুকন became_shohojogi"` instead of `"রুকন সহযোগী হয়েছেন"`
  - `"কমিটি বৈঠক হয়েছে thana_avg_attendance"` instead of `"কমিটি বৈঠক হয়েছে থানা গড় উপস্থিতি"`
- **Impact**: Complete failure of accessibility compliance (WCAG 2.2 Success Criterion 4.1.2: Name, Role, Value). Bengali field workers are presented with incomprehensible English database column tokens.

#### `DEFECT-03-02` (`WEB-011`): Cosmetic `enterKeyHint="next"` with Zero Keyboard Traversal Navigation
- **Location**: [`src/components/report/auto-save-field.tsx#L226, #L265, #L322`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L226)
- **Root Cause**: `AutoSaveField` renders `enterKeyHint="next"` on all input variants (`tableMode`, `inline`, and stacked). However, it implements **no `onKeyDown` event handler**.
- **Failure Conditions**: A field worker on an Android or iOS device taps a number into a matrix cell and presses the blue "Next" / "Enter" arrow on their virtual soft keyboard.
- **Observed Behavior**: In mobile Chrome and Safari, pressing "Next" on an `<input>` that lacks an `onKeyDown` listener and is not enclosed in a managed form does nothing; focus remains trapped in the current cell. The user must manually tap the tiny adjacent 36px table cell with their thumb, causing touch fatigue across 250+ metrics.
- **Impact**: Mobile data-entry friction and high error rates for non-technical field workers.

#### `DEFECT-03-03` (`WEB-010`): Flash of Incorrect View (FOIC) & Cumulative Layout Shift (CLS) on `ViewModeToggle`
- **Location**: [`src/components/report/view-mode-toggle.tsx#L15-L28`](file:///d:/WebDev/report-submission/src/components/report/view-mode-toggle.tsx#L15-L28)
- **Root Cause**: `useViewMode` initializes state via `useState<ViewMode>(defaultMode)` (`"card"`). A post-mount `useEffect` reads `localStorage.getItem("report-view-mode")` and calls `setViewMode("table")` if the user previously selected Table View.
- **Failure Conditions**: Any user who prefers Table View navigates to `/report/courses`, `/report/organizational`, `/report/personal`, or `/report/meeting`, or refreshes the page.
- **Observed Behavior**: The browser renders the 8 large card accordions during SSR/initial paint, and then flashes abruptly into a 900px-wide data table with horizontal scrollbars after client hydration completes.
- **Impact**: Jarring layout shift (CLS violation) and wasted render cascades.

#### `DEFECT-03-04` (`WEB-011`): Mobile Touch Target Floor Violations (< 44px) on Table Mode Inputs
- **Location**: [`src/components/report/auto-save-field.tsx#L234`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L234)
- **Root Cause**: In `tableMode`, the input element is styled with `h-9` (36px). The parent `<td>` in `courses-form.tsx:L56-L67` has `p-1` (4px padding). The total clickable height of the input itself is only 36px, and tapping the 4px padding area does not trigger focus on the input.
- **Failure Conditions**: Field workers accessing Table View on mobile or tablet devices (e.g. iPad Mini, 6-inch Android phones).
- **Impact**: Violates WCAG 2.2 AA touch target minimum (44px x 44px). Field workers repeatedly miss the 36px target, tapping adjacent cells or table borders.

#### `DEFECT-03-05` (`WEB-011`): Sticky Column Over-Consumption on Small Mobile Viewports (< 375px)
- **Location**:
  - [`src/components/report/sections/courses-form.tsx#L31, #L53`](file:///d:/WebDev/report-submission/src/components/report/sections/courses-form.tsx#L31)
  - [`src/components/report/sections/organizational-form.tsx#L20, #L30`](file:///d:/WebDev/report-submission/src/components/report/sections/organizational-form.tsx#L20)
  - [`src/components/report/sections/personal-form.tsx#L33, #L60`](file:///d:/WebDev/report-submission/src/components/report/sections/personal-form.tsx#L33)
  - [`src/components/report/sections/meetings-form.tsx#L31, #L49`](file:///d:/WebDev/report-submission/src/components/report/sections/meetings-form.tsx#L31)
- **Root Cause**: The sticky left category column is hardcoded to `w-48` (192px) or `w-52` (208px) across all viewports.
- **Failure Conditions**: A user on a standard 360px or compact 320px screen views the table in Table Mode.
- **Observed Behavior**: On a 320px screen, `w-48` consumes 192px (60% of the entire screen width), leaving only 128px of horizontal viewport space to view and scroll through the remaining 12 data columns. On `personal-form.tsx`, `w-52` consumes 208px (65% of screen width).
- **Impact**: Severe horizontal claustrophobia; editing table rows on smaller screens becomes nearly impossible.

#### `DEFECT-03-06` (`WEB-007`): Focus Ring Suppression on Accordion Header Buttons
- **Location**:
  - [`src/components/report/sections/courses-form.tsx#L91`](file:///d:/WebDev/report-submission/src/components/report/sections/courses-form.tsx#L91)
  - [`src/components/report/sections/personal-form.tsx#L102`](file:///d:/WebDev/report-submission/src/components/report/sections/personal-form.tsx#L102)
  - [`src/components/report/sections/meetings-form.tsx#L97`](file:///d:/WebDev/report-submission/src/components/report/sections/meetings-form.tsx#L97)
- **Root Cause**: All three accordion header `<button>` elements include `outline-none` without providing `focus-visible:ring-2` or any alternate focus indicator.
- **Failure Conditions**: Keyboard-only users navigating section accordions with `Tab` or `Shift+Tab`.
- **Impact**: Violates WCAG 2.4.7 (Focus Visible - Level AA). Keyboard focus becomes completely invisible when tabbing onto accordion cards.

---

### 3.2 Layer 2: Client State & Context Defect Catalog

#### `DEFECT-03-07` (`WEB-008`): Unconditional Bengali Numeral Formatting on `PersonalForm` Derived Row Totals
- **Location**: [`src/components/report/sections/personal-form.tsx#L77`](file:///d:/WebDev/report-submission/src/components/report/sections/personal-form.tsx#L77)
- **Root Cause**: `PersonalForm` imports `language` from `useLanguage()` on line 13. However, when rendering the derived horizontal row total in Table Mode on line 77, it unconditionally executes:
  ```tsx
  <td className="p-2 text-center font-bold text-xs sm:text-sm text-foreground bg-muted/20 border-r border-border/40 tabular-nums">
    {toBn(rowTotal)}
  </td>
  ```
- **Failure Conditions**: A user or administrator selects English language (`language === 'en'`) via `UserDropdown`.
- **Observed Behavior**: All form labels and headers translate to English ("How many are teaching", "Rukn", "Total"), but the computed total column displays Bengali Unicode digits (`"০"`, `"৫"`, `"১২"`) instead of ASCII digits (`"0"`, `"5"`, `"12"`).
- **Impact**: Localization parity defect violating the dual-language architecture of `TECHNICAL_MANUAL.md` Chapter 5.3.

#### `DEFECT-03-08` (`WEB-008`): Hardcoded English Labels in `CompactViewToggle`
- **Location**: [`src/components/report/view-mode-toggle.tsx#L85, #L98`](file:///d:/WebDev/report-submission/src/components/report/view-mode-toggle.tsx#L85)
- **Root Cause**: `CompactViewToggle` hardcodes `<span className="hidden sm:inline">Form</span>` and `<span className="hidden sm:inline">Table</span>` without referencing `t.labels`.
- **Failure Conditions**: Standard operation in default Bengali mode.
- **Observed Behavior**: The secondary navigation header displays English words "Form" and "Table" inside the top-right toggle buttons, rather than localized Bengali tokens (e.g. `"কার্ড"` / `"টেবিল"`).
- **Impact**: Visual and linguistic inconsistency in the primary user navigation bar.

#### `DEFECT-03-09` (`WEB-013`): Custom Meeting Name Eradicated in Collapsed Card Header
- **Location**: [`src/components/report/sections/meetings-form.tsx#L103-L105`](file:///d:/WebDev/report-submission/src/components/report/sections/meetings-form.tsx#L103-L105)
- **Root Cause**: `TECHNICAL_MANUAL.md` Chapter 2.3 explicitly specifies that when a custom title is provided for the `অন্যান্য` row, the custom title directly replaces the word `"অন্যান্য"`. In `MeetingsForm`, when in Card View, line 104 renders:
  ```tsx
  <h3 className="text-base sm:text-lg font-bold text-foreground">
    {category === "অন্যান্য" ? t.labels.others : tc(category as any)}
  </h3>
  ```
  `MeetingsForm` does not import `useReport()` or read `data?.meeting`. Consequently, it has no access to the persisted `meeting_name`.
- **Failure Conditions**: A user enters a custom meeting title (e.g. `"বিশেষ তারবিয়াত বৈঠক"`) and collapses the card.
- **Observed Behavior**: The collapsed card header displays `"অন্যান্য"` (Others), completely hiding the custom meeting name. The user cannot discern which meeting the card contains without expanding it.
- **Impact**: Functional regression violating explicit specifications in `TECHNICAL_MANUAL.md` and ADR 007.

---

### 3.3 Layer 3: Server Actions & Boundary Defect Catalog

#### `DEFECT-03-10` (`WEB-006`): Complete Absence of Submission Lock Enforcement across Section Forms
- **Location**:
  - [`src/components/report/sections/comments-form.tsx#L10-L65`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx#L10-L65)
  - All 7 section form components (`report-header-form.tsx`, `courses-form.tsx`, `organizational-form.tsx`, `personal-form.tsx`, `meetings-form.tsx`, `extras-form.tsx`, `comments-form.tsx`)
  - Coupled primitive: [`src/components/report/auto-save-field.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx)
- **Root Cause**: Checking the "রিপোর্ট জমা সম্পন্ন হয়েছে" checkbox sets `report.is_submitted: true`. However:
  1. `AutoSaveField` has **no `disabled` or `readOnly` prop**.
  2. None of the 7 section forms check `isSubmitted` or disable their inputs.
  3. `SectionLayout` displays no warning banner indicating the report is in a submitted state.
- **Failure Conditions**: A zone manager completes all sections, checks "রিপোর্ট জমা সম্পন্ন হয়েছে" in Section 7, and receives confirmation. Later, they (or another user on the same device) open Section 2 (`/report/organizational?reportId=...`). They accidentally touch or edit a numeric field.
- **Observed Behavior**: `AutoSaveField` detects the change and immediately executes an HTTP PATCH to PostgreSQL, overwriting the submitted report data with zero warnings or confirmation checks.
- **Impact**: High data integrity risk. The submission checkbox provides a false sense of security while leaving all underlying data-entry cells completely unprotected.

#### `DEFECT-03-11` (`WEB-005`): Main-Thread Freezing Browser Native Dialogs in `CommentsForm`
- **Location**: [`src/components/report/sections/comments-form.tsx#L25, #L48, #L58`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx#L25)
- **Root Cause**: `handleSubmissionToggle` executes synchronous `window.confirm()` and `alert()` calls:
  ```tsx
  const confirmed = window.confirm("আপনি কি নিশ্চিত যে আপনার মাসিক রিপোর্ট জমা দিতে চান?...");
  ...
  alert(warningMsg);
  ...
  const confirmed = window.confirm("আপনি কি রিপোর্টটি পুনরায় সম্পাদনা মোডে নিতে চান?");
  ```
- **Failure Conditions**: Field workers running the application inside an Android Trusted Web Activity (TWA) or Android WebView, or users with popup blockers / aggressive mobile browser sandboxing.
- **Observed Behavior**:
  1. `window.confirm()` blocks JavaScript execution on the browser's main UI thread, causing animation frame drops and freezing virtual keyboards.
  2. In modern Android WebViews / TWA wrappers, native `confirm()` and `alert()` dialogs are frequently suppressed or fail silently if a custom `WebChromeClient.onJsConfirm` handler is not configured, leaving the submission toggle in an unresponsive state.
  3. The native OS dialog ignores application themes (Dark Mode, Solarized).
- **Impact**: Brittle mobile UX and potential submission lockouts on TWA APK builds.

---

### 3.4 Layer 4: Database Schemas & DDL Defect Catalog

#### `DEFECT-03-12` (`WEB-005` / `WEB-014`): Missing Client-Side Length Limit on Comments Textarea
- **Location**:
  - [`src/components/report/sections/comments-form.tsx#L79-L87`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx#L79-L87)
  - Coupled primitive: [`src/components/report/auto-save-field.tsx#L300-L315`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L300-L315)
- **Root Cause**: In ADR 027, PostgreSQL added a strict table check constraint:
  ```sql
  ALTER TABLE public.report_comment ADD CONSTRAINT chk_report_comment_length CHECK (char_length(comment) <= 1500);
  ```
  However, in `AutoSaveField`, the `<textarea>` element has **no `maxLength` attribute**, no character counter, and no truncation logic.
- **Failure Conditions**: A field worker or supervisor enters an extensive monthly evaluation, pastes a detailed event narrative, or types > 1,500 characters.
- **Observed Behavior**: `AutoSaveField` debounces and sends the payload to Supabase. PostgreSQL rejects the transaction with code `23514` (check_violation: `chk_report_comment_length`). The request fails, `failedFields` registers an error, and the textarea receives a red border. The user is told "সংরক্ষণ ব্যর্থ হয়েছে" with no indication that the text exceeded the 1,500-character limit.
- **Impact**: User frustration, silent data drop risk, and violation of the 5-layer round-trip contract.

#### `DEFECT-03-13` (`WEB-004`): Unicode Nukta Decomposition Inconsistency between Category Literals & DB Constraints
- **Location**:
  - [`src/lib/report-utils.ts#L87-L135`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L87-L135)
  - Target DB Constraint: `CHECK (position(chr(2492) in category) = 0)` on `report_extra`, `report_organizational`, `report_personal`, and `report_meeting` (ADR 027)
- **Root Cause**: ADR 027 documented that all child table category strings were migrated from decomposed Nukta byte sequences (`chr(2479)||chr(2492)` - `U+09AF U+09BC`) to canonical precomposed NFC `chr(2527)` (`U+09DF` - 'য়').
  However, analysis of `src/lib/report-utils.ts` and `backups/db_backup_2026-11-10.json` reveals:
  1. `ORG_CATEGORIES` contains 7 string literals with decomposed `U+09BC` (e.g. `"দাওয়াত দান"`, `"সহযোগী হয়েছেন"`, `"সক্রিয় সহযোগী"`).
  2. `PERSONAL_CATEGORIES[2]` contains decomposed `U+09BC` (`"সক্রিয় সহযোগী"`).
  3. `MEETING_CATEGORIES` contains decomposed `U+09BC` (`"কমিটি বৈঠক হয়েছে"`, `"মুয়াল্লিমাদের নিয়ে বৈঠক"`).
  4. In `report_extra`, historical test rows contain **both** decomposed (`"ওয়ার্ড প্রতিনিধির সফর"`) and precomposed (`"ওয়ার্ড প্রতিনিধির সফর"`) records!
- **Failure Conditions**: If the PostgreSQL table constraint `CHECK (position(chr(2492) in category) = 0)` is strictly active, any direct `INSERT` using `ORG_CATEGORIES` or `MEETING_CATEGORIES` will trigger a database constraint violation because `chr(2492)` (`\u09bc`) is present in the string.
- **Impact**: Latent database collision risk and binary string mismatch between client search filters and database records.

---

## 4. Impeccable UI/UX, Mobile Ergonomics & Accessibility Review

### 4.1 Touch Target Floor Evaluation (WCAG 2.2 AA)
- **Table Mode Matrix Cells**: Inputs use `h-9` (36px height) with `p-1` (4px padding) in the `<td>`. This yields a 36px interactive touch height, falling 8px short of the 44px WCAG touch target floor.
- **Inline Mode Inputs**: Inputs use `h-10` (40px height), falling 4px short of the 44px touch target floor.
- **Accordion Toggle Headers**: Measure `p-4 sm:p-5` with a total height of ~56px, comfortably satisfying the 44px touch target floor.
- **Submission Checkbox Card**: In ADR 030, the submission card was converted to `<label htmlFor="report-submission-checkbox">` with `p-5`, providing a generous full-width ~80px touch target.

### 4.2 Keyboard Navigation & Virtual Soft-Keyboard Traversal
- **Soft Keyboard Tab Order**: Tab navigation moves horizontally across table rows (`<td>` to `<td>`), which is logically correct. However, pressing the virtual keyboard's "Next" button does not navigate because `AutoSaveField` lacks an `onKeyDown` Enter listener.
- **Focus Rings**: Accordion headers (`CoursesForm:L91`, `PersonalForm:L102`, `MeetingsForm:L97`) explicitly suppress focus rings with `outline-none` and omit `focus-visible:ring-2`. This renders keyboard-only navigation impossible for accessibility compliance.
- **Input Mode Optimization**: All numeric fields correctly declare `inputMode="numeric"` and `type="text"`, prompting mobile operating systems to display numeric keypads without triggering soft-keyboard auto-capitalization.

### 4.3 Responsive Scannability & Viewport Real Estate
- **Sticky Column Proportions**:
  - `CoursesForm`, `OrganizationalForm`, `MeetingsForm`: Sticky first column width is `w-48` (192px).
  - `PersonalForm`: Sticky first column width is `w-52` (208px).
  - On a 360px mobile screen (e.g. Galaxy S21 / iPhone 13 mini), a 192px sticky column consumes 53% of the viewport; a 208px column consumes 58%.
  - On a 320px screen (e.g. iPhone SE 1st gen / small Android), `w-48` consumes 60% of the viewport.
  - While sticky row headers are necessary for spreadsheet comprehension, `w-48` is overly wide on mobile viewports. Reducing the sticky width on small screens to `w-36` (144px) with truncation and tooltips reclaims 48px of precious horizontal viewport real estate.

### 4.4 Cumulative Layout Shift (CLS) & Typography
- **ViewMode Hydration Shift**: As documented in `DEFECT-03-03`, `useViewMode` causes a large post-hydration CLS when switching from default Card View to stored Table View.
- **Bengali Numeral Monospace Alignment**: All matrix cells correctly declare `tabular-nums` and `text-center`, ensuring numbers align cleanly across column vertical axes.
- **Typography Sizing**: Table header labels use `text-xs font-black` (12px), sub-headers use `text-[11px] font-bold`, and data cells use `text-xs sm:text-sm font-bold`. This maintains a clear, scannable visual hierarchy.

---

## 5. Cross-Segment Blast Radius & Cohesion Warnings

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEGMENT 03 CROSS-SEGMENT BLAST RADIUS               │
├────────────────────────────────────────────────────────────────────────┤
│  ◄── Segment 01 (Math & Loader):                                       │
│      Normalizing category constants in `report-utils.ts` directly      │
│      impacts `loadReportDataBundle()` and `sumRows()`.                 │
│                                                                        │
│  ◄── Segment 02 (Save Machine):                                        │
│      Purging ghost fallbacks (`course_name`, `meeting_type`) from      │
│      `auto-save-field.tsx` must be mirrored in `report-context.tsx`.   │
│                                                                        │
│  ──► Segment 05 (Routing & Navigation):                                │
│      Fixing ViewMode CLS requires coordinating cookie reading in       │
│      `RootLayout` or `section-layout.tsx`.                             │
│                                                                        │
│  ──► Segment 06 (Admin & Exports):                                     │
│      Changes to `meeting_name` formatting or category strings must     │
│      maintain 100% parity with PDF and Excel export route matchers.    │
│                                                                        │
│  ──► Segment 07 (Database & DDL):                                      │
│      Enforcing precomposed NFC `\u09df` requires validating PostgreSQL │
│      CHECK constraints on all 4 child tables.                          │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Impact on Segment 01 (Data Calculation & Loader)**:
   Any normalization of category strings in `src/lib/report-utils.ts` (e.g. fixing `\u09af\u09bc` vs `\u09df`) directly affects `sumRows()` and `loadReportDataBundle()`. If category strings in `report-utils.ts` do not match the database records returned by PostgREST, `item = computedCourse.find(x => x.category === cat)` will return `undefined`, causing exports and city reports to display zeroes.
2. **Impact on Segment 02 (Save Machine & State Machine)**:
   Removing the ghost fallbacks (`course_name === category` and `meeting_type === category`) in `auto-save-field.tsx` must be synchronized with `report-context.tsx:L153-L154`. If removed from one but not the other, optimistic updates and persistence mapping will desynchronize.
3. **Impact on Segment 06 (Admin & Export Pipelines)**:
   In `meetings-form.tsx`, displaying the custom meeting name in place of `"অন্যান্য"` must preserve the exact same substitution logic used in `/api/export/pdf/route.tsx:L637` (`cat === "অন্যান্য" && customTitle ? customTitle : cat`) and `/api/export/excel/route.ts:L316`.
4. **Impact on Segment 07 (Database Schemas & DDL)**:
   Addressing the Unicode Nukta decomposition drift requires coordinating a clean, one-time SQL migration in Supabase to guarantee that existing child table rows and new client inputs strictly agree on NFC precomposed characters (`\u09df`).

---

## 6. Competing Multi-Option Remediation Proposals (Rules 2 & 6)

### 6.1 Proposal 1: Accessible Screen Reader Labels in Table View Mode (`DEFECT-03-01`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Approach Comparison: Table Cell Screen Reader Accessibility                 │
├──────────────────────────────┬──────────────────────────────┬────────────────┤
│ Dimension                    │ Option A: Canonical Composite│ Option B: W3C  │
│                              │ Prop Labeling (Recommended)  │ ARIA Grid ID   │
├──────────────────────────────┼──────────────────────────────┼────────────────┤
│ Accessibility Standard       │ WCAG 2.2 AA (Full Compliance)│ WCAG 2.2 AAA   │
│ Code Complexity              │ Low (Pass label prop cleanly)│ High (DOM IDs) │
│ Cognitive Overhead           │ Minimal                      │ High           │
│ Risk of ID Collision         │ Zero                         │ Medium         │
│ Performance Impact           │ Zero                         │ Zero           │
└──────────────────────────────┴──────────────────────────────┴────────────────┘
```

#### Option A: Canonical Composite Labeling via `AutoSaveField` Props (Recommended)
- **Implementation**:
  1. In `courses-form.tsx`, `organizational-form.tsx`, `personal-form.tsx`, and `meetings-form.tsx`, pass the human-readable localized label to `AutoSaveField` in table mode:
     ```tsx
     <AutoSaveField
       label={t.labels.count}
       name="number"
       type="number"
       section="courses"
       table="report_course"
       category={category}
       tableMode
     />
     ```
  2. Because `tableMode` already suppresses visual `<label>` rendering (it only renders `<input>` on lines 220–241 of `auto-save-field.tsx`), passing `label={t.labels.count}` does not affect visual table layouts.
  3. In `auto-save-field.tsx:L233`, update `aria-label`:
     ```tsx
     aria-label={`${tc(category as any) || section} — ${label || name}`}
     ```
- **Why do it (Benefits)**:
  - Screen readers immediately announce clear, human-readable Bengali labels (e.g. `"বিশিষ্টদের — সংখ্যা"`, `"দাওয়াত দান — পরিমাণ"`).
  - Eliminates raw database column leaks with zero layout shift and zero additional CSS.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - If a developer adds a new table column in the future and forgets to pass `label`, it will fall back to `name`. Mitigated by TypeScript interface enforcement (`label` required).

#### Option B: Full W3C ARIA Grid Header Binding (`aria-labelledby`)
- **Implementation**:
  Assign deterministic DOM IDs to all table column headers (`th-col-${name}`) and row headers (`th-row-${category}`). Bind `<input aria-labelledby="th-row-${category} th-col-${name}">`.
- **Why do it (Benefits)**:
  - Adheres strictly to the formal W3C WAI-ARIA Grid design pattern. Screen readers announce row and column coordinates natively.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - Requires generating and synchronizing unique DOM IDs across complex two-layered headers (`CoursesForm` and `MeetingsForm`).
  - If an ID string contains special characters or spaces, `aria-labelledby` resolution silently breaks.
  - Substantially higher code ceremony for zero additional UX benefit over Option A.

#### Option C: In-Primitive Fallback Dictionary
- **Implementation**:
  Maintain an internal dictionary inside `AutoSaveField` that translates column names (`number`, `sessions`, `status_qayda`) to localized labels when `label` is empty.
- **Why do it (Benefits)**:
  - Localized fix within `auto-save-field.tsx` without modifying the 4 section form files.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - Rejected under Rule 2.5 (Favor Simplicity) and Rule 7. Duplicates labels already maintained in `src/lib/i18n.ts`. Creates split sources of truth.

---

### 6.2 Proposal 2: Comments Character Limit & Error Governance (`DEFECT-03-12`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Approach Comparison: Comments 1500-Character Constraint Governance          │
├──────────────────────────────┬──────────────────────────────┬────────────────┤
│ Dimension                    │ Option A: Client maxLength + │ Option B: Drop │
│                              │ Visual Counter (Recommended) │ DB Constraint  │
├──────────────────────────────┼──────────────────────────────┼────────────────┤
│ Data Integrity               │ Ironclad (Guaranteed <= 1500)│ Unbounded      │
│ User Experience              │ Real-time visual feedback    │ No feedback    │
│ PDF Layout Safety            │ Guaranteed Landscape Fit     │ High Risk (CLS)│
│ Implementation Effort        │ Minimal (< 15 lines of code) │ DDL Migration  │
└──────────────────────────────┴──────────────────────────────┴────────────────┘
```

#### Option A: Client `maxLength={1500}` with Real-Time Character Counter (Recommended)
- **Implementation**:
  1. Add `maxLength?: number` to `AutoSaveFieldProps`.
  2. Pass `maxLength={1500}` to `<textarea>` in `AutoSaveField`.
  3. In `comments-form.tsx`, render an accessible real-time counter below the textarea:
     ```tsx
     <div className="flex justify-between items-center text-xs text-muted-foreground mt-1.5 px-1">
       <span>সর্বোচ্চ ১৫০০ অক্ষর</span>
       <span className={commentLength > 1400 ? "text-amber-600 font-bold" : ""}>
         {toBn(commentLength)} / ১৫০০
       </span>
     </div>
     ```
- **Why do it (Benefits)**:
  - Completely prevents PostgreSQL `chk_report_comment_length` check constraint violations (`23514`).
  - Provides upfront visual guidance before users invest time typing lengthy feedback.
  - Preserves landscape A4 PDF page budgeting (ADR 026 / ADR 030).
- **Why not do it (Risks & Real-World Failure Modes)**:
  - On mobile soft keyboards, pasting text that exceeds 1,500 characters will silently truncate at character 1,500. Mitigated by the visible counter alerting the user.

#### Option B: Drop Database Check Constraint
- **Implementation**:
  Execute `ALTER TABLE public.report_comment DROP CONSTRAINT chk_report_comment_length;`.
- **Why do it (Benefits)**:
  - Allows unbounded comments; user text is never rejected by PostgreSQL.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - **REJECTED UNDER RULE 6**: Unbounded comments completely shatter the landscape PDF export engine (`src/app/api/export/pdf/route.tsx`). Long comments would spill onto Page 4 or 5, breaking the duplex 2-page print guarantee established in ADR 007, ADR 026, and ADR 030.

#### Option C: Server Action / RPC Silent Truncation
- **Implementation**:
  In `updateField`, execute `value = String(value).slice(0, 1500)`.
- **Why do it (Benefits)**:
  - Prevents DB check violations in the background.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - **REJECTED**: Silently deletes user data without informing the user that part of their comment was discarded. Highly hostile UX.

---

### 6.3 Proposal 3: Submission State Protection & Edit Mode Governance (`DEFECT-03-10`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Approach Comparison: Submission Lock & Read-Only Governance                 │
├──────────────────────────────┬──────────────────────────────┬────────────────┤
│ Dimension                    │ Option A: Non-Destructive    │ Option B: Hard │
│                              │ Banner + Unlock Mode (Rec.)  │ DB RLS Lock    │
├──────────────────────────────┼──────────────────────────────┼────────────────┤
│ Accidental Edit Protection   │ Complete (Inputs disabled)   │ Complete       │
│ Field Worker Flexibility     │ High (Self-service unlock)   │ Zero (Admin)   │
│ Mobile Gestural Safety       │ Complete (No tap accidents)  │ Complete       │
│ Blast Radius                 │ Frontend UI only             │ RLS / DB Engine│
└──────────────────────────────┴──────────────────────────────┴────────────────┘
```

#### Option A: Non-Destructive Submission Banner with Self-Service "Unlock" Mode (Recommended)
- **Implementation**:
  1. In `SectionLayout`, inspect `data?.is_submitted`.
  2. When `is_submitted === true`:
     - Render a prominent sticky banner across all 7 section forms:
       `"এই রিপোর্টটি জমা সম্পন্ন হয়েছে (Submitted) — অনাকাঙ্ক্ষিত পরিবর্তন রোধে সম্পাদনা লক করা হয়েছে।"`
     - Provide an accessible `"সম্পাদনা আনলক করুন (Unlock Editing)"` action button that toggles `is_submitted: false` via `updateField("is_submitted", false, "comment", "report")`.
     - Pass `readOnly={isSubmitted}` or `disabled={isSubmitted}` to `AutoSaveField` inputs.
  3. In `comments-form.tsx`, replace `window.confirm()` and `alert()` with an accessible custom modal dialog.
- **Why do it (Benefits)**:
  - Permanently eliminates accidental keystrokes and scroll-tap mutations on submitted reports.
  - Matches user mental model while preserving field worker autonomy (users can unlock and correct mistakes without filing an administrative support ticket).
  - 100% theme-aware, mobile-friendly dialogs that do not block the browser thread.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - Requires threading `readOnly` into `AutoSaveField` and updating styling for disabled inputs.

#### Option B: Hard Database-Level RLS / Trigger Lock
- **Implementation**:
  Add a PostgreSQL trigger or RLS policy: `CREATE POLICY lock_submitted_reports ON report_* FOR UPDATE USING (NOT (SELECT is_submitted FROM report WHERE id = report_id));`.
- **Why do it (Benefits)**:
  - Absolute, irrevocable server-side protection against unauthorized edits.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - **REJECTED**: In pre-production and early field trials, field workers frequently submit reports and subsequently realize they omitted a student count or meeting. A hard RLS lock requires superadmins to manually intervene in the database to unlock reports, creating massive administrative overhead.

#### Option C: Status Quo ("Edit Anytime" with Zero Input Locking)
- **Implementation**:
  Retain current behavior: `is_submitted` only affects dashboard KPI counters; inputs remain permanently editable.
- **Why do it (Benefits)**:
  - Zero development effort.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - **REJECTED**: In mobile field testing, users regularly swipe through forms to review submitted data and accidentally tap numbers, silently altering historical submissions without realizing it.

---

### 6.4 Proposal 4: Unicode Nukta Normalization & Eradication of Ghost Fallbacks (`DEFECT-03-13`, `BLOAT-03-01`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Approach Comparison: Unicode Nukta & Category Identifier Standardization    │
├──────────────────────────────┬──────────────────────────────┬────────────────┤
│ Dimension                    │ Option A: Full Canonical NFC │ Option B: App- │
│                              │ Normalization (Recommended)  │ Layer Polyfill │
├──────────────────────────────┼──────────────────────────────┼────────────────┤
│ Rule 7 Compliance            │ 100% (Pure Clean DDL)        │ 0% (Polyfills) │
│ Database Query Performance   │ Sub-millisecond (B-Tree match│ Slower (Regex) │
│ Code Complexity              │ Clean, single-string equality│ Sprawling ORs  │
│ Blast Radius                 │ Synchronized DB + Code Update│ Localized code │
└──────────────────────────────┴──────────────────────────────┴────────────────┘
```

#### Option A: Full Canonical NFC Precomposed Normalization (`U+09DF`) + Pruning Ghost Fallbacks (Recommended)
- **Implementation**:
  1. Execute a synchronized, idempotent SQL migration in Supabase to convert all remaining decomposed Nukta byte sequences (`chr(2479)||chr(2492)`) to pure precomposed `chr(2527)` (`U+09DF` - 'য়') across `report_organizational`, `report_personal`, `report_meeting`, and `city_report_override`:
     ```sql
     UPDATE public.report_organizational 
       SET category = replace(category, chr(2479)||chr(2492), chr(2527)) 
       WHERE position(chr(2492) in category) > 0;
     UPDATE public.report_personal 
       SET category = replace(category, chr(2479)||chr(2492), chr(2527)) 
       WHERE position(chr(2492) in category) > 0;
     UPDATE public.report_meeting 
       SET category = replace(category, chr(2479)||chr(2492), chr(2527)) 
       WHERE position(chr(2492) in category) > 0;
     ```
  2. Normalize all category string constants in `src/lib/report-utils.ts` and `src/lib/i18n.ts` to verified pure precomposed NFC literals.
  3. Permanently purge ghost column matchers (`course_name === category` and `meeting_type === category`) from `auto-save-field.tsx` and `report-context.tsx`.
  4. Purge the asymmetric label override `{cat === "সক্রিয় সহযোগী" ? ...}` from `personal-form.tsx`.
- **Why do it (Benefits)**:
  - 100% compliance with `AGENTS.md` Rule 7.
  - Eliminates all string matching ambiguities and duplicate dictionary keys in `i18n.ts`.
  - Guarantees binary equality matching in PostgreSQL queries without application-layer polyfills.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - Requires running the SQL migration on Supabase before deploying the code update to prevent transient 0-row update drops on existing test reports.

#### Option B: Application-Layer Nukta Strip/Normalize Polyfill
- **Implementation**:
  Add `.normalize("NFC").replace(/\u09af\u09bc/g, "\u09df")` inside every database query and row matcher.
- **Why do it (Benefits)**:
  - Requires no database SQL migration.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - **VIOLATION OF RULE 7**: Directly violates the rule prohibiting complex application-layer shims to bypass needed database data cleanup. Adds CPU overhead to every client row iteration. Rejected.

---

### 6.5 Proposal 5: Sticky Column Width & CLS Remediation (`DEFECT-03-03`, `DEFECT-03-05`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Approach Comparison: Sticky Column Width & ViewMode CLS Remediation         │
├──────────────────────────────┬──────────────────────────────┬────────────────┤
│ Dimension                    │ Option A: Responsive Width + │ Option B: Force│
│                              │ Cookie ViewMode (Recommended)│ Card on Mobile │
├──────────────────────────────┼──────────────────────────────┼────────────────┤
│ Mobile Horizontal Usability  │ High (+48px viewport gain)   │ N/A (Cards)    │
│ Power User Flexibility       │ Preserved (Table available)  │ Lost           │
│ Layout Shift (CLS)           │ 0ms (SSR Cookie reading)     │ 0ms            │
│ Implementation Effort        │ Low                          │ Minimal        │
└──────────────────────────────┴──────────────────────────────┴────────────────┘
```

#### Option A: Responsive Sticky Width (`w-36 sm:w-48`) + Cookie-Backed ViewMode (Recommended)
- **Implementation**:
  1. In `courses-form.tsx`, `organizational-form.tsx`, `personal-form.tsx`, and `meetings-form.tsx`:
     Change sticky column class from fixed `w-48` / `w-52` to responsive:
     `w-36 sm:w-48 min-w-[144px] sm:min-w-[192px] max-w-[144px] sm:max-w-[192px] truncate`
     Add `title={category}` so truncated category names can be inspected on hover/tap.
  2. In `view-mode-toggle.tsx`:
     Store view mode preference in an `app-view-mode` cookie (with `localStorage` fallback) and read it on the server, eliminating the post-mount FOIC and CLS.
  3. In `auto-save-field.tsx`:
     Add an `onKeyDown` handler listening for `e.key === "Enter"` to automatically advance focus to the next input in DOM order.
  4. Localize "Form" and "Table" toggle labels in `CompactViewToggle`.
- **Why do it (Benefits)**:
  - Reclaims 48px of horizontal width on mobile viewports, allowing at least two full data columns to remain visible alongside the category header.
  - Completely eliminates post-hydration layout shift (CLS).
  - Enables smooth keyboard traversal across the 250-cell matrix.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - Long category titles (e.g. `জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতজন`) will truncate with an ellipsis on 320px–360px screens. Mitigated by `title={...}` and the default mobile Card View.

#### Option B: Lock Mobile Viewports to Card View Exclusively
- **Implementation**:
  Hide `CompactViewToggle` on screens `< 768px`; force `viewMode = 'card'`.
- **Why do it (Benefits)**:
  - Eliminates all horizontal table overflow challenges on mobile phones.
- **Why not do it (Risks & Real-World Failure Modes)**:
  - Deprives power users on large phones (e.g. iPhone Pro Max, Galaxy Ultra) or small tablets from using rapid spreadsheet data entry. Rejected.

---

## 7. Recommended Action Plan for Segment 03

Following dialectical review and adversarial verification by Subagent 03B, the implementation should be executed across four distinct tiers:

### Tier 1: Database DDL & Data Reconciliation
1. **Unicode Nukta SQL Clean**: Execute a single SQL `UPDATE` on Supabase normalizing remaining decomposed `chr(2492)` Nuktas to `chr(2527)` (`U+09DF`) across `report_organizational`, `report_personal`, `report_meeting`, and `report_extra`.
2. **Duplicate Row Purge**: Verify no duplicate category rows exist in `report_extra` (`'ওয়ার্ড প্রতিনিধির সফর'` vs `'ওয়ার্ড প্রতিনিধির সফর'`).

### Tier 2: Application Architecture & State Machine Hygiene
1. **Purge Ghost Column Matchers**: Strip `course_name === category` and `meeting_type === category` from `auto-save-field.tsx:L60-L61` and `report-context.tsx:L153-L154`.
2. **Category Constant Centralization**: Export `MOKTOB_CATEGORIES` and `SAFAR_CATEGORIES` from `src/lib/report-utils.ts` and import them into `extras-form.tsx`; purge unused `Send` import.
3. **Unicode Normalization of Code Literals**: Ensure all category string literals in `report-utils.ts` and `i18n.ts` are pure precomposed NFC `\u09df`.

### Tier 3: Form Ergonomics, Accessibility & UI/UX Hardening
1. **Screen Reader Accessible Composite Labels**: Pass human-readable labels (`t.labels.*`) to `AutoSaveField` in all 4 table views; update `aria-label` to announce `${category} — ${label}` instead of raw SQL column names.
2. **Comments Length Limit & Counter**: Add `maxLength={1500}` and visual `${toBn(len)} / ১৫০০` counter to `CommentsForm`.
3. **Submission State Lockout Banner**: Render a non-destructive submission status banner across all section forms when `is_submitted === true`, with an active "Unlock" button to prevent accidental tap overwrites.
4. **Custom Meeting Title Parity**: Update `MeetingsForm` to read `data?.meeting` and dynamically display the custom meeting title in the card header when collapsed.
5. **i18n Localization Parity**: Fix `personal-form.tsx` derived total column to use `formatLocaleNumber(rowTotal, language)` instead of hardcoded `toBn(rowTotal)`. Localize "Form" and "Table" in `CompactViewToggle`.
6. **Responsive Sticky Column & CLS Fix**: Update sticky column class to `w-36 sm:w-48 truncate`; read view mode preference via cookie to eliminate CLS; add Enter key listener for `enterKeyHint="next"`; add `focus-visible:ring-2` to accordion header buttons.

### Tier 4: Documentation Suite Reconciliation
1. **Reconcile `TECHNICAL_MANUAL.md`**: Update Chapter 2.3 to reflect strict canonical single-string category lookups, removing outdated claims of dual-string backward-compatibility shims.
2. **Update `KNOWN_ISSUES.md`**: Register `DEFECT-03-01` through `DEFECT-03-13` with remediation statuses.

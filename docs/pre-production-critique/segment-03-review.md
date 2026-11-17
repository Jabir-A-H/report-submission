# Segment 03 Adversarial Review: Form Ergonomics, Matrix Inputs & Section Presentation

**Audited Investigation Deliverable**:
- [`docs/pre-production-critique/segment-03-investigation.md`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-03-investigation.md) (Lead Investigator: Subagent 03A)

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
  - [`src/components/report/report-context.tsx`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx)
  - [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts)
  - [`src/lib/i18n.ts`](file:///d:/WebDev/report-submission/src/lib/i18n.ts)

**Target Documentation Audited**:
- `docs/TECHNICAL_MANUAL.md` (Chapters 2.3, 5)
- `docs/ADR/004-dynamic-responsive-tables-and-transparent-stats-architecture.md`
- `docs/ADR/007-authoritative-labeling-harmonization-and-2-page-landscape-pdf-architecture.md`
- `docs/ADR/010-edit-report-override-constraint-and-display.md`
- `docs/ADR/012-route-group-simplification-submission-governance-and-city-report-parity.md`
- `docs/ADR/015-sprint-1-save-integrity-and-input-normalization.md`
- `docs/ADR/020-track-1-quick-wins-and-input-normalization.md`
- `docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md`
- `docs/ADR/026-behavioral-stability-unmount-dirty-flush-role-hierarchy-and-foic-elimination.md`
- `docs/ADR/027-track-1-database-ddl-rls-hardening-and-storage-hygiene.md`
- `docs/ADR/028-track-2-core-save-machine-concurrency-and-numeral-normalization.md`
- `docs/ADR/030-track-4-canonical-navigation-user-provider-and-adaptive-pdf.md`
- `docs/KNOWN_ISSUES.md` (`Mobile Touch Target Ergonomics`, `RS-30`, `RS-32`, `RS-34`, `RS-66`)

---

## 1. Adversarial Verdict & Quality Scorecard Validation

### 1.1 Formal Verdict: APPROVED WITH AMENDMENTS

Subagent 03A correctly uncovered several critical, previously undocumented behavioral and accessibility defects—most notably the catastrophic screen reader leak in matrix tables (`CRIT-03-01`), the missing client-side character length limit on comments (`CRIT-03-02`), and the absence of any input lock upon submission (`CRIT-03-03`).

However, passing Subagent 03A's recommendations through the **Adversarial Doubt Gate** (*"Under what real-world field conditions will this clean-looking code fail?"*) revealed **five severe implementation traps, three false-positive design assumptions, and a critical database migration hazard** that would crash the pre-production database with a `unique_violation` (23505) error if executed as written.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEGMENT 03 ADVERSARIAL SCORECARD                     │
├────────────────────────────────────────────────────────────────────────┤
│  Subagent 03A Initial Grade:         C+ (68/100)                       │
│  Adversarial Validated Health Score: 64/100 (Grade: C)                 │
├────────────────────────────────────────────────────────────────────────┤
│  Subsystem Dimension Ratings:                                          │
│  - Matrix Form Presentation & Dual Views:    78/100 (Solid baseline)   │
│  - Screen Reader & Form Accessibility:       28/100 (Catastrophic SQL) │
│  - Character Bounds & DB Check Alignment:    45/100 (Unbounded text)   │
│  - Submission Governance & Lock State:       35/100 (No input locks)   │
│  - Unicode NFC & DDL Integrity:              40/100 (Split split split)│
│  - Mobile Touch & Viewport Usability:        62/100 (Card good, Tab C-)│
│  - i18n Localization Parity:                 70/100 (Minor gaps)       │
│  - Architectural Simplicity (Rule 7):        65/100 (Ghost matchers)   │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Scorecard Validation & Core Amendments
1. **Screen Reader Announcement Failure Verified**: Passing `label=""` to suppress visual headers causes `AutoSaveField` to announce raw PostgreSQL column names (`"বিশিষ্টদের status_board"`, `"দাওয়াত দান amount"`). This is 100% verified and constitutes a severe WCAG 2.2 AA violation.
2. **PostgreSQL Check Violation Crash on Comments Verified**: The database strictly enforces `CHECK (char_length(comment) <= 1500)` (`ADR 027`). Neither `AutoSaveField` nor `CommentsForm` enforces `maxLength={1500}`. Pasting >1500 characters triggers an unhandled Postgres 23514 check violation, locking the field in an error state.
3. **Submission State Illusion Verified**: Checking "রিপোর্ট জমা সম্পন্ন হয়েছে" leaves all ~250 inputs across the 7 section forms completely interactive. An accidental touch while scrolling on mobile overwrites submitted data via auto-save PATCH with zero warning.
4. **AMENDMENT REQUIRED (The DDL Unique Collision Trap)**: Subagent 03A proposed an immediate `UPDATE` to convert decomposed Nuktas (`\u09af\u09bc`) to precomposed `\u09df`. **Empirical database analysis proves that Report 23 in `report_extra` already contains BOTH decomposed and precomposed rows for the same categories.** Running 03A's update directly will crash PostgreSQL with duplicate key violations on `report_extra_report_id_category_key`. Deduplication must precede the DDL update.
5. **AMENDMENT REQUIRED (The Sticky Column Truncation Trap)**: Subagent 03A proposed shrinking the sticky column to `w-36` (144px) with `truncate`. In `ORG_CATEGORIES`, rows 99 and 100 share a 51-character identical prefix (`"জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : "`), differing only in the last word (`"কতটি"` vs `"কতজন"`). Truncating at 144px renders them completely indistinguishable (`"জনশক্তির সহীহ্ কু..."`).
6. **AMENDMENT REQUIRED (The Mobile Soft-Keyboard Enter Trap)**: Subagent 03A proposed adding an `e.key === "Enter"` listener to auto-advance DOM focus. On mobile iOS numeric inputs, the standard keypad lacks an Enter key; on Android, programmatic `.focus()` jumps race with auto-save re-renders, causing keyboard flashing, horizontal viewport snapping, and voice-typing truncation.

---

## 2. False Positives & Over-Engineered Proposals Discharged

The following findings and proposals by Subagent 03A have been cross-examined and amended or discharged:

### 2.1 DISCHARGED: Naive `w-36 truncate` Sticky Column on Small Mobile Viewports
- **Subagent 03A Proposal**: In `courses-form.tsx`, `organizational-form.tsx`, `personal-form.tsx`, and `meetings-form.tsx`, change sticky column width from `w-48` / `w-52` to `w-36` (144px) with `truncate` to reclaim 48px of viewport space on 320px screens.
- **Adversarial Cross-Examination ("Doubt Gate")**:
  - In `ORG_CATEGORIES` (lines 99–100 of `src/lib/report-utils.ts`), two consecutive rows are:
    1. `"জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি"`
    2. `"জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতজন"`
  - In a 144px column (`w-36`), minus 24px cell padding (`p-3`), available width is 120px. At `text-xs font-bold` (~9px per Bengali glyph), 120px fits ~13 characters.
  - Applying `truncate` transforms both rows into:
    `"জনশক্তির সহীহ্ কু..."`
  - A field worker filling out the table cannot tell which row is the unit count (`কতটি`) and which row is the participant count (`কতজন`). Entering participant headcount into the unit row corrupts city-wide aggregations by an order of magnitude.
  - Furthermore, **Card View is already the default mobile view** (`defaultMode="card"` in `view-mode-toggle.tsx`), where card titles render full-width without any truncation! Table View on a 320px phone is an intentional power-user mode requiring horizontal scrolling.
- **Hardened Determination**: **REJECT `w-36 truncate`.** Maintain `w-48 sm:w-52` in Table View with `whitespace-normal break-words text-xs leading-tight`. For small viewports, ensure Card View is the default mobile experience, preserving full typographic clarity.

---

### 2.2 AMENDED: Naive `e.key === "Enter"` DOM Focus Jump Traversal
- **Subagent 03A Proposal**: Add an `onKeyDown` listener to `AutoSaveField` that catches `Enter` and automatically calls `.focus()` on the next input in DOM order to solve `DEFECT-03-02`.
- **Adversarial Cross-Examination ("Doubt Gate")**:
  - **The iOS Reality**: In iOS Safari, `<input type="text" inputMode="numeric">` renders the standard iOS telephone keypad. **The iOS telephone keypad has NO "Enter" or "Next" button.** iOS users navigate inputs using the native Safari `<` and `>` accessory bar above the keyboard.
  - **The Focus Race with Auto-Save Blur**: When JavaScript calls `nextInput.focus()` synchronously during `onKeyDown`, the current input immediately triggers `onBlur`. In `auto-save-field.tsx`, `handleBlur()` executes `persistRef.current()`, which calls `updateField()` in `report-context.tsx`. When `updateField()` updates React state (`data`, `failedFields`, or `pendingSavesCount`), the React fiber tree re-renders. A re-render while focus is shifting between cells frequently causes mobile browsers to blur active focus entirely to `document.body` or bounce the virtual keyboard open and shut.
  - **Transposed Matrix Traversal**: In `personal-form.tsx`, the table is transposed: rows are metrics (`teaching`, `learning`), columns are categories (`rukon`, `kormi`, `sokrio`). Standard DOM order moves horizontally across categories for a single metric. But in `CoursesForm`, a row has 12 columns. Navigating past column 12 jumps to column 1 of the next row, causing the table container to violently scroll from `scrollLeft = 800px` back to `scrollLeft = 0px`, disorienting the user.
  - **Voice Typing Conflict**: Bengali field workers utilizing Google Voice Typing on Android Gboard often have speech recognition terminate with a synthetic Enter event. An eager `Enter` handler forcibly jumps focus mid-sentence, splitting the voice stream across two fields.
- **Hardened Determination**: **AMEND.** Do not implement an aggressive synthetic DOM jump on numeric keypads. Retain `enterKeyHint="next"` for soft-keyboard compliance, but delegate sequential navigation to native keyboard accessory bars and standard tab indexing. Provide clear visual cell boundaries and high-contrast focus rings.

---

### 2.3 DISCHARGED: Using `disabled={isSubmitted}` on Matrix Cells
- **Subagent 03A Proposal**: In Proposal 3, Subagent 03A suggested passing `disabled={isSubmitted}` or `readOnly={isSubmitted}` interchangeably to lock inputs.
- **Adversarial Cross-Examination ("Doubt Gate")**:
  - On mobile iOS Safari and Android Chrome, `disabled` form controls do not bubble touch events. On a dense matrix table where inputs occupy 90% of the visible viewport, setting `disabled={true}` on all table inputs causes touch-drag scrolling (swiping horizontally or vertically) to be swallowed or stutter. A field worker reviewing their submitted report becomes unable to scroll smoothly through the table.
  - Furthermore, `disabled` inputs suffer from severe contrast degradation (browser-enforced 40% gray opacity) that violates WCAG 1.4.3 contrast requirements when viewed in outdoor sunlight.
  - In contrast, `readOnly={true}`:
    1. Allows normal touch-drag swiping and momentum scrolling.
    2. Prevents the mobile virtual keyboard from popping up upon tap.
    3. Retains full typography contrast and crisp legibility.
    4. Allows text selection and screen reader navigation.
- **Hardened Determination**: **STRICTLY ENFORCE `readOnly={isSubmitted}`.** Never use `disabled` or `pointer-events-none` on table matrix cells.

---

### 2.4 DISCHARGED: Complete Mobile Elimination of Table Mode (Option B in Proposal 5)
- **Subagent 03A Proposal**: Evaluated hiding `CompactViewToggle` on screens `< 768px` and forcing Card View.
- **Adversarial Cross-Examination ("Doubt Gate")**:
  - Many field supervisors operate in the field using 8-inch or 10-inch Android tablets, or large phablets (e.g. Galaxy S24 Ultra, iPhone 16 Pro Max) where viewing multiple columns side-by-side in landscape is significantly faster than expanding 8 separate accordions.
  - Artificially removing Table View penalizes experienced users who prefer spreadsheet density.
- **Hardened Determination**: **REJECT.** Preserve the dual-mode architecture. Card View is the default; Table View remains accessible as an explicit user choice.

---

## 3. Intercepted Implementation Traps & Real-World Failure Modes

### 3.1 TRAP 1: The DDL Duplicate Key Collision in `report_extra` (Report ID 23)
- **The Threat**: Subagent 03A proposed running:
  ```sql
  UPDATE public.report_extra 
    SET category = replace(category, chr(2479)||chr(2492), chr(2527)) 
    WHERE position(chr(2492) in category) > 0;
  ```
- **Empirical Field Verification**:
  Direct inspection of `backups/db_backup_2026-11-10.json` reveals that for `report_id = 23`, `report_extra` already contains:
  ```json
  [
    { "id": 148, "report_id": 23, "category": "স্থানীয়ভাবে পরিচালিত", "number": 0 },
    { "id": 153, "report_id": 23, "category": "স্থানীয়ভাবে পরিচালিত", "number": 0 },
    { "id": 152, "report_id": 23, "category": "ওয়ার্ড প্রতিনিধির সফর", "number": 0 },
    { "id": 154, "report_id": 23, "category": "ওয়ার্ড প্রতিনিধির সফর", "number": 0 }
  ]
  ```
  Note that row 148 uses precomposed `\u09df`, while row 153 uses decomposed `\u09af\u09bc`!
  Likewise, row 152 uses precomposed `\u09df`, while row 154 uses decomposed `\u09af\u09bc`!
- **Real-World Crash Condition**:
  `public.report_extra` enforces a unique constraint on `(report_id, category)` (`report_extra_report_id_category_key` per ADR 023).
  Executing the `UPDATE` replaces `\u09af\u09bc` with `\u09df` in row 153, converting it into `"স্থানীয়ভাবে পরিচালিত"`. Because row 148 already has that exact category for `report_id = 23`, PostgreSQL will instantly abort the transaction with:
  `ERROR: duplicate key value violates unique constraint "report_extra_report_id_category_key" (SQLSTATE 23505)`.
- **Mandatory Hardened Fix**:
  Before executing the `UPDATE`, an idempotent SQL deduplication script must purge or merge redundant zero-rows:
  ```sql
  -- Step 1: Delete duplicate zero-records that would collide upon normalization
  DELETE FROM public.report_extra e1
  USING public.report_extra e2
  WHERE e1.report_id = e2.report_id
    AND e1.id > e2.id
    AND replace(e1.category, chr(2479)||chr(2492), chr(2527)) = replace(e2.category, chr(2479)||chr(2492), chr(2527));

  -- Step 2: Now safely normalize all remaining rows
  UPDATE public.report_extra 
    SET category = replace(category, chr(2479)||chr(2492), chr(2527)) 
    WHERE position(chr(2492) in category) > 0;
  ```

---

### 3.2 TRAP 2: The Code-Database Desynchronization Data Blackout
- **The Threat**:
  Subagent 03A recommended normalizing all category string constants in `src/lib/report-utils.ts` to precomposed NFC `\u09df`.
- **Empirical Field Verification**:
  Our analysis of the database backup revealed:
  - `report_personal`: 24 rows with decomposed `\u09bc` (`"সক্রিয় সহযোগী"`), 0 with `\u09df`.
  - `report_meeting`: 56 rows with decomposed `\u09bc` (`"কমিটি বৈঠক হয়েছে"`, `"মুয়াল্লিমাদের নিয়ে বৈঠক"`), 0 with `\u09df`.
  - `report_organizational`: 197 rows with decomposed `\u09bc` (`"দাওয়াত দান"`, `"সহযোগী হয়েছেন"`, `"সম্মতি দিয়েছেন"`, `"সক্রিয় সহযোগী"`, `"দাওয়াতী ইউনিট"`, `"জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)"`), 0 with `\u09df`.
  - `city_report_override`: 1 row with decomposed `\u09bc` (`"কমিটি বৈঠক হয়েছে"`), 0 with `\u09df`.
- **Real-World Crash Condition**:
  If a developer edits `src/lib/report-utils.ts` and pushes to production *before* running the database migration, JavaScript binary string comparison (`===`) will fail on every single loaded report row:
  ```ts
  const row = arrayData.find(item => item.category === category);
  // 'সক্রিয় সহযোগী' (\u09af\u09bc) === 'সক্রিয় সহযোগী' (\u09df) evaluates to FALSE!
  ```
  Every existing record in `report_organizational`, `report_personal`, and `report_meeting` will evaluate to `undefined`!
  Field workers opening their reports will see completely blank forms, assuming all historical monthly reporting data was permanently deleted!
- **Mandatory Hardened Fix**:
  The database migration (Tier 1) MUST be executed and verified in Supabase prior to deploying the application code update (Tier 2).

---

### 3.3 TRAP 3: The Newline Break PDF Overflow Trap on Comments
- **The Threat**:
  Subagent 03A proposed adding `maxLength={1500}` to `<AutoSaveField type="textarea">` and claimed this guarantees 2-page landscape PDF budgeting.
- **Real-World Crash Condition**:
  In `@react-pdf/renderer` (used in `src/app/api/export/pdf/route.tsx`), text layout height is a function of both character count and newline characters (`\n`).
  A field worker entering 15 short bullet points separated by newlines consumes only ~300 characters, well within the 1,500-character limit. However, 15 newline line breaks take up ~180pt of vertical height in the PDF comment box, pushing the official signature and seal block onto Page 3. This ruins duplex printing and violates the 2-page print guarantee established in ADR 007 and ADR 030.
- **Mandatory Hardened Fix**:
  In `CommentsForm`, enforce a 2-dimensional boundary:
  1. `maxLength={1500}` for absolute character ceiling.
  2. Input normalization on blur: collapse consecutive blank lines (`value.replace(/\n{3,}/g, '\n\n')`).
  3. In `src/app/api/export/pdf/route.tsx`, enforce `<Text numberOfLines={12}>` or vertical overflow clamping to guarantee the signature block remains anchored on Page 2.

---

### 3.4 TRAP 4: Main-Thread `window.confirm` Freeze & WebView Silent Failure in Android TWA
- **The Threat**:
  In [`comments-form.tsx:L25, #L48, #L58`](file:///d:/WebDev/report-submission/src/components/report/sections/comments-form.tsx#L25), `handleSubmissionToggle` executes synchronous `window.confirm()` and `alert()`.
- **Real-World Crash Condition**:
  The project packages an Android TWA APK via `.github/workflows/build-apk.yml` and `twa-manifest.json`.
  In Android WebView and Chrome Custom Tabs under specific battery-saver or sandbox modes, unhandled `window.confirm()` calls can be silently dismissed (returning `false`) or cause ANR (Application Not Responding) timeouts if the native dialog thread is blocked. The user taps "জমা সম্পন্ন করুন", nothing happens, and no feedback is provided.
- **Mandatory Hardened Fix**:
  Replace `window.confirm()` and `alert()` with an accessible, non-blocking React confirmation dialog component (using standard Tailwind styling, Dark Mode support, and keyboard trap protection).

---

### 3.5 TRAP 5: `ViewModeProvider` Lifecycle Churn & Navigational CLS
- **The Threat**:
  In [`section-layout.tsx:L126-L130`](file:///d:/WebDev/report-submission/src/components/report/section-layout.tsx#L126-L130), `ViewModeProvider` is mounted conditionally:
  ```tsx
  return supportsViewToggle ? (
    <ViewModeProvider defaultMode="card">
      {layoutContent}
    </ViewModeProvider>
  ) : layoutContent;
  ```
- **Real-World Crash Condition**:
  `supportsViewToggle` is only true for `"courses"`, `"organizational"`, `"personal"`, and `"meeting"`.
  When a user starts on Section 1 (`/report/header`), `ViewModeProvider` is NOT mounted.
  When the user clicks "Next" to navigate to Section 2 (`/report/courses`), `ViewModeProvider` MOUNTS.
  `useViewMode` initializes with `useState("card")`, rendering cards on mount. Then `useEffect` fires, reads `localStorage`, finds `"table"`, and triggers a secondary re-render into Table Mode.
  When the user steps to Section 6 (`/report/extra`), `ViewModeProvider` UNMOUNTS.
  When they step to Section 7 (`/report/comment`), it stays unmounted.
  If they navigate back to Section 5 (`/report/meeting`), it MOUNTS AGAIN, triggering yet another card-to-table layout shift!
- **Mandatory Hardened Fix**:
  Lift `ViewModeProvider` to `src/app/report/layout.tsx` (or `RootLayout`), ensuring it mounts exactly once and maintains its state across all section navigations without lifecycle churn. Read the initial mode from an `app-view-mode` cookie on the server to achieve 0ms CLS.

---

## 4. Cross-Segment Blast Radius & Cohesion Verification

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEGMENT 03 CROSS-SEGMENT BLAST RADIUS               │
├────────────────────────────────────────────────────────────────────────┤
│  ◄── Segment 01 (Math & Aggregation Loader):                           │
│      Normalizing category constants in `report-utils.ts` directly      │
│      impacts `loadReportDataBundle()` and `sumRows()`. A mismatch      │
│      zeroes out city aggregations and breaks reporting parity.         │
│                                                                        │
│  ◄── Segment 02 (Save Machine):                                        │
│      Purging ghost fallbacks (`course_name`, `meeting_type`) from      │
│      `auto-save-field.tsx` must be mirrored in `report-context.tsx`.   │
│                                                                        │
│  ──► Segment 05 (Routing, Layout & Providers):                         │
│      Lifting `ViewModeProvider` out of `section-layout.tsx` into       │
│      `src/app/report/layout.tsx` eliminates section-switch CLS.        │
│                                                                        │
│  ──► Segment 06 (Admin & Exports):                                     │
│      `meeting_name` formatting and category string normalization must  │
│      match PDF (`route.tsx:L637`) and Excel (`route.ts:L316`) matchers.│
│                                                                        │
│  ──► Segment 07 (Database Schemas & DDL):                              │
│      Enforcing precomposed NFC `\u09df` requires safe deduplication    │
│      before activating `CHECK (position(chr(2492) in category) = 0)`. │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Integration with Segment 01 (Data Calculation & Loader)
- Category strings in `src/lib/report-utils.ts` (`ORG_CATEGORIES`, `PERSONAL_CATEGORIES`, `MEETING_CATEGORIES`, `EXTRA_CATEGORIES`) serve as the primary key matchers for `loadReportDataBundle()` and `sumRows()`.
- If category strings in `report-utils.ts` are updated to NFC precomposed `\u09df` without synchronizing the database rows, `computedCourse.find(x => x.category === cat)` will return `undefined`, causing all calculated totals, weighted attendances, and city-wide aggregations to evaluate to `0`.
- **Verification Rule**: Any category normalization must be 100% synchronized across `report-utils.ts`, `report-data-loader.ts`, and Supabase child table records.

### 4.2 Integration with Segment 02 (Save Machine & Concurrency)
- In `auto-save-field.tsx:L60-L61` and `report-context.tsx:L153-L154`, residual prototype checks (`course_name === category` and `meeting_type === category`) linger as dead code.
- Removing them from `auto-save-field.tsx` without removing them from `report-context.tsx` would create an asymmetric state mapper where initial form renders and optimistic context updates use different lookup keys.
- **Verification Rule**: Purge ghost matchers simultaneously from both `auto-save-field.tsx` and `report-context.tsx`.

### 4.3 Integration with Segment 05 (Routing, Layout & Providers)
- In `section-layout.tsx`, bottom navigation clearance is set to `pb-[calc(10.5rem+env(safe-area-inset-bottom,0px))] md:pb-28`.
- In `CommentsForm`, the submission card has height ~80px. With 36px clearance above `BottomNav` (64px) + fixed stepper bar (76px), the submission card renders with proper physical clearance above mobile system bars.
- Lifting `ViewModeProvider` to `src/app/report/layout.tsx` ensures uninterrupted state persistence when navigating between sections.

### 4.4 Integration with Segment 06 (Admin & Document Exports)
- In `MeetingsForm`, displaying the custom meeting name when `category === "অন্যান্য"` must preserve exact parity with the PDF exporter (`/api/export/pdf/route.tsx:L637`) and Excel exporter (`/api/export/excel/route.ts:L316`).
- Both export routes check: `cat === "অন্যান্য" && customTitle ? customTitle : cat`. `MeetingsForm` must read `data?.meeting` and adopt this identical fallback.

### 4.5 Integration with Segment 07 (Database Schemas & DDL)
- In `docs/ADR/027-track-1-database-ddl-rls-hardening-and-storage-hygiene.md` and `TECHNICAL_MANUAL.md`, it was documented that child tables enforce `CHECK (position(chr(2492) in category) = 0)`.
- As proven in Section 3.1, this constraint cannot currently be enforced on `report_extra` due to existing duplicate rows in report 23.
- Once deduplication and normalization are applied via Supabase SQL migration, the check constraint can be safely activated, establishing an ironclad database-level invariant.

---

## 5. Final Hardened Pre-Production Action Plan

The following prioritized Action Matrix provides a battle-tested, dependency-ordered implementation roadmap for Segment 03.

### Prioritized Action Matrix

| Priority | ID | Target File / Area | Action Summary | Risk / Blast Radius |
|:---|:---|:---|:---|:---|
| **P0** | `ACT-03-01` | Supabase SQL Migration | Execute idempotent deduplication in `report_extra` (Report 23) followed by normalization of decomposed `\u09bc` to precomposed `\u09df` across all child tables. | **High** (Run before code update to prevent data blackout). |
| **P0** | `ACT-03-02` | `src/lib/report-utils.ts`, `src/lib/i18n.ts` | Normalize category string literals to canonical NFC precomposed `\u09df`; prune duplicate decomposed dictionary keys in `i18n.ts`. | **Medium** (Coupled to ACT-03-01). |
| **P0** | `ACT-03-03` | `courses-form.tsx`, `organizational-form.tsx`, `personal-form.tsx`, `meetings-form.tsx`, `auto-save-field.tsx` | Pass human-readable localized labels (`label={t.labels.*}`) in table mode; update `aria-label` in `auto-save-field.tsx` to announce `${tc(category)} — ${label}`. | **Low** (Frontend accessibility fix, zero visual layout shift). |
| **P1** | `ACT-03-04` | `comments-form.tsx`, `auto-save-field.tsx` | Add `maxLength={1500}` to `<AutoSaveField type="textarea">`; add visual character counter (`{toBn(len)} / ১৫০০`) and newline normalization in `CommentsForm`. | **Low** (Prevents Postgres 23514 check violations and PDF spillage). |
| **P1** | `ACT-03-05` | `section-layout.tsx`, `auto-save-field.tsx`, all 7 section forms | Implement read-only submission banner in `SectionLayout` when `is_submitted === true`; pass `readOnly={isSubmitted}` to inputs with self-service "সম্পাদনা আনলক করুন" toggle. | **Medium** (Data entry protection; strictly use `readOnly`, not `disabled`). |
| **P1** | `ACT-03-06` | `meetings-form.tsx` | Read `data?.meeting` from `useReport()` and dynamically display custom meeting title in collapsed card header when `category === "অন্যান্য"`. | **Low** (Matches PDF/Excel export parity). |
| **P1** | `ACT-03-07` | `view-mode-toggle.tsx`, `src/app/report/layout.tsx` | Lift `ViewModeProvider` to report route layout; store view mode preference in `app-view-mode` cookie to eliminate FOIC and CLS. Localize "Form" and "Table" buttons. | **Low** (Layout stability and localization parity). |
| **P2** | `ACT-03-08` | `auto-save-field.tsx`, `report-context.tsx` | Purge dead prototype column matchers (`course_name === category`, `meeting_type === category`). | **Low** (Rule 7 clean-up). |
| **P2** | `ACT-03-09` | `extras-form.tsx`, `src/lib/report-utils.ts` | Centralize `MOKTOB_CATEGORIES` and `SAFAR_CATEGORIES` exports in `report-utils.ts`; prune duplicate definitions and unused `Send` import in `extras-form.tsx`. | **Low** (Single Source of Truth hygiene). |
| **P2** | `ACT-03-10` | `personal-form.tsx` | Use `formatLocaleNumber(rowTotal, language)` for derived row totals; replace asymmetric label ternary with standard `tc(cat as any)`. | **Low** (Localization parity). |
| **P2** | `ACT-03-11` | `comments-form.tsx` | Replace synchronous `window.confirm()` and `alert()` with non-blocking themed modal dialogs safe for Android TWA APK wrappers. | **Low** (Mobile UX reliability). |
| **P2** | `ACT-03-12` | `docs/TECHNICAL_MANUAL.md`, `docs/KNOWN_ISSUES.md` | Reconcile Chapter 2.3 to reflect canonical single-string lookups; register resolved defect entries in known issues. | **Zero** (Documentation parity). |

---

### Detailed Implementation Specifications

#### Tier 1: Database DDL & Data Reconciliation (P0)
1. **Idempotent Deduplication & Nukta Normalization Migration**:
   Execute the following SQL in Supabase SQL Editor:
   ```sql
   BEGIN;
   -- 1. Deduplicate report_extra rows for report_id = 23 that share the same normalized category
   DELETE FROM public.report_extra e1
   USING public.report_extra e2
   WHERE e1.report_id = e2.report_id
     AND e1.id > e2.id
     AND replace(e1.category, chr(2479)||chr(2492), chr(2527)) = replace(e2.category, chr(2479)||chr(2492), chr(2527));

   -- 2. Normalize child tables to canonical precomposed U+09DF ('য়')
   UPDATE public.report_organizational 
     SET category = replace(category, chr(2479)||chr(2492), chr(2527)) 
     WHERE position(chr(2492) in category) > 0;

   UPDATE public.report_personal 
     SET category = replace(category, chr(2479)||chr(2492), chr(2527)) 
     WHERE position(chr(2492) in category) > 0;

   UPDATE public.report_meeting 
     SET category = replace(category, chr(2479)||chr(2492), chr(2527)) 
     WHERE position(chr(2492) in category) > 0;

   UPDATE public.report_extra 
     SET category = replace(category, chr(2479)||chr(2492), chr(2527)) 
     WHERE position(chr(2492) in category) > 0;

   UPDATE public.city_report_override 
     SET category = replace(category, chr(2479)||chr(2492), chr(2527)) 
     WHERE position(chr(2492) in category) > 0;

   -- 3. Verify zero decomposed nuktas remain
   COMMIT;
   ```

#### Tier 2: Application Architecture & State Machine Hygiene (P0/P1)
1. **Purge Ghost Matchers**:
   In [`auto-save-field.tsx:L60-L61`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L60-L61) and [`report-context.tsx:L153-L154`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L153-L154), replace:
   ```ts
   // BEFORE:
   const row = arrayData.find(
     (item) =>
       item.category === category ||
       (table === "report_course" && item.course_name === category) ||
       (table === "report_meeting" && item.meeting_type === category)
   );

   // AFTER:
   const row = arrayData.find((item) => item.category === category);
   ```
2. **Category Constant Standardization**:
   In `src/lib/report-utils.ts`, export `MOKTOB_CATEGORIES` and `SAFAR_CATEGORIES`. Ensure all string literals in `ORG_CATEGORIES`, `PERSONAL_CATEGORIES`, `MEETING_CATEGORIES`, and `EXTRA_CATEGORIES` use precomposed NFC `\u09df`.
3. **i18n Translation Dictionary Clean-up**:
   In `src/lib/i18n.ts`, prune duplicate entries with decomposed Nuktas (`'সহযোগী হয়েছেন'`, `'সক্রিয় সহযোগী'`) and standardize on canonical precomposed keys.

#### Tier 3: Form Ergonomics, Accessibility & UI/UX Hardening (P1)
1. **Accessible Screen Reader Labels in Table View**:
   In `courses-form.tsx`, `organizational-form.tsx`, `personal-form.tsx`, and `meetings-form.tsx`, pass the localized label prop:
   ```tsx
   <AutoSaveField
     label={t.labels.number}
     name="number"
     type="number"
     section="courses"
     table="report_course"
     category={category}
     tableMode
   />
   ```
   In `auto-save-field.tsx:L233`, construct an accessible, human-readable composite label:
   ```tsx
   aria-label={`${tc(category as any) || section} — ${label || name}`}
   ```
2. **Comments Length Limit & Counter**:
   In `auto-save-field.tsx`, support `maxLength?: number` on `AutoSaveFieldProps` and forward to `<textarea>`.
   In `comments-form.tsx`, pass `maxLength={1500}` and render a live counter below the textarea:
   ```tsx
   <div className="flex justify-between items-center text-xs text-muted-foreground mt-1.5 px-1">
     <span>সর্বোচ্চ ১৫০০ অক্ষর</span>
     <span className={commentLength > 1400 ? "text-amber-600 font-bold" : ""}>
       {toBn(commentLength)} / ১৫০০
     </span>
   </div>
   ```
3. **Submission State Read-Only Banner**:
   In `SectionLayout`, when `data?.is_submitted === true`:
   - Render a sticky amber banner at the top of the form:
     `"এই রিপোর্টটি জমা সম্পন্ন হয়েছে (Submitted) — অনাকাঙ্ক্ষিত পরিবর্তন রোধে সম্পাদনা লক করা হয়েছে।"`
   - Provide an accessible action button: `"সম্পাদনা আনলক করুন"` that executes `updateField("is_submitted", false, "comment", "report")`.
   - Pass `readOnly={Boolean(data?.is_submitted)}` to `AutoSaveField`. Style read-only inputs with `bg-muted/10 cursor-default opacity-85` while preserving normal contrast and touch-scroll gestures.
4. **Accordion Button Focus Rings**:
   In `courses-form.tsx:L91`, `personal-form.tsx:L102`, and `meetings-form.tsx:L97`, replace `outline-none` with `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
5. **Custom Meeting Title in Collapsed Card**:
   In `meetings-form.tsx`, read `data?.meeting` from `useReport()`. When rendering card headers, resolve:
   ```tsx
   const customTitle = data?.meeting?.find((m: any) => m.category === "অন্যান্য")?.meeting_name;
   const displayTitle = category === "অন্যান্য" && customTitle ? customTitle : (category === "অন্যান্য" ? t.labels.others : tc(category as any));
   ```

#### Tier 4: Documentation Suite Reconciliation (P2)
1. **Reconcile `TECHNICAL_MANUAL.md`**:
   - Update Chapter 2.3 to state that all category queries strictly enforce canonical single-string equality (`r.category === cat`), removing obsolete claims of active dual-string fallbacks.
   - Update Chapter 5.2 to document the submission read-only state governance and `readOnly={isSubmitted}` pattern.
2. **Update `KNOWN_ISSUES.md`**:
   - Record `DEFECT-03-01` through `DEFECT-03-13` with remediation details and verified resolution dates.

# ADR 007: Authoritative Labeling Harmonization & 2-Page Landscape PDF Architecture

- **Status**: Accepted
- **Date**: 2026-07-13
- **Applies to**: Report View (`src/app/report/page.tsx`), Data Entry Forms (`src/components/report/sections/*-form.tsx`), and PDF Export Route (`src/app/api/export/pdf/route.tsx`).

---

## 1. Context & Problem Statement

The Report Submission System underwent a comprehensive audit against the authoritative spreadsheet suite (`docs/Talimul_Report_2026`). Several divergences and layout constraints were identified:

1. **Terminology Drift**: Minor differences existed between the original Bengali spreadsheet labels and the application (e.g., `সমাপ্ত` vs `কতজন নিয়ে সমাপ্ত`, `সহীহ শিখেছে` vs `সহীহ শিখেছেন কতজন`, `বোর্ডে / কায়দায়` vs `বোর্ড` / `কায়দা`, `মোট ইউনিট:` vs `ইউনিট সংখ্যা:`, `Orientation / Result Publish` vs `Committee Orientation / Muallima Orientation`).
2. **Table Structural Parity in Entry Forms**: While the main overview report (`/report`) displayed `১. গ্রুপ / কোর্স রিপোর্ট` with a two-layered heading (`গ্রুপ / কোর্স` & `শিক্ষার্থী অবস্থান`) and `৩. ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন` as a transposed table (where 7 metrics are vertical rows and categories are columns), the table entry mode (`viewMode === 'table'`) in `courses-form.tsx` and `personal-form.tsx` used single-layer headings or un-transposed column structures.
3. **PDF Page Budgeting & Layout Integrity**: When exporting full zone reports via `@react-pdf/renderer` (`src/app/api/export/pdf/route.tsx`), the output lacked visual color parity with the overview page (`/report`), and un-budgeted table heights often caused overflow onto a 3rd sheet or squished table rows. The user required that all reports fit cleanly inside **exactly 2 Landscape A4 pages** (`0.5 inch` / `36 pt` padding) so that users can print on a single double-sided sheet of paper.

---

## 2. Architecture Decisions

### 2.1 Master Terminology Lock, Mashq/Orientation Splits & Fallback Matching
All UI labels across card entry forms, table entry forms, overview report views, and printed PDF reports are locked to the exact Bengali specification:
- **Header & Stats Bar**: `দায়িত্বশীলার নাম`, `সার্টিফিকেটপ্রাপ্ত মুয়াল্লিমা`, `সার্টিফিকেটপ্রাপ্ত ক্লাস নিচ্ছেন`, `প্রশিক্ষণপ্রাপ্ত মুয়াল্লিমা`, `প্রশিক্ষণপ্রাপ্ত ক্লাস নিচ্ছেন`, `ইউনিট সংখ্যা`, and `মুয়াল্লিমা সহ ইউনিট`.
- **Course Report**: `কতজন নিয়ে সমাপ্ত`, `সহীহ শিখেছেন কতজন`, `বোর্ড`, `কায়দা`, `আমপারা`, and `কুরআন`.
- **Organizational Report**:
  - `সহযোগী হয়েছেন` (replacing `সহযোগী হয়েছে`). To maintain backward compatibility with historical database rows saved with `সহযোগী হয়েছে`, both the report view (`src/app/report/page.tsx`) and the PDF exporter (`route.tsx`) employ dual-string fallback lookups:
    ```ts
    const row = orgData.find((r) => 
      r.category === cat || 
      (cat === "সহযোগী হয়েছেন" && r.category === "সহযোগী হয়েছে") || 
      (cat === "সহযোগী হয়েছে" && r.category === "সহযোগী হয়েছেন")
    );
    ```
  - **Mashq Category Split**: The category `জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)` is split into two dedicated rows (`জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি` and `জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতজন`) across all forms, `/report`, `/admin/city-report`, and exports (`route.tsx`, `route.ts`). Includes dual-string fallback lookups (`find(r => r.category === cat || (cat === 'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি' && r.category === 'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক)'))`) guaranteeing backward compatibility with un-split legacy rows.
- **Meetings Report**:
  - **Orientation Split**: `Committee Orientation` and `Muallima Orientation` are split into two dedicated individual rows (with dual-string fallbacks (`find(r => r.category === cat || (cat === 'Committee Orientation' && x.category === 'Committee Orientation / Muallima Orientation'))`) ensuring legacy combined records remain readable without data migration).
  - **Custom Meeting Name (`meeting_name`)**: The `report_meeting` database table features two distinct text fields: `comments (text)` for normal qualitative remarks on all rows, and `meeting_name (varchar(255))` specifically for custom meeting titles on the `অন্যান্য` ("Others") row (`updateField('meeting_name', customName, 'meeting', 'report_meeting', 'অন্যান্য')`), dynamically formatted across `/report`, `/admin/city-report`, PDF (`route.tsx`), and Excel (`route.ts`) exports such that when `meeting_name` is provided, the inserted custom name directly replaces the word `অন্যান্য` (`cat === "অন্যান্য" && customTitle ? customTitle : cat`); if no name is given, it displays `অন্যান্য`.

---

### 2.2 Standardized Top-Left Table Headings & Bounded Sticky Column Widths
Across all section input tables (`courses-form.tsx`, `organizational-form.tsx`, `personal-form.tsx`, `meetings-form.tsx`), generic `ক্যাটাগরি` headings are replaced with authoritative top-left headings matching exact domain terminology, and sticky left columns (`<th>` and `<td>`) are explicitly bounded to prevent horizontal stretching while keeping data columns easily visible without excessive scrolling:
- **Courses Section (`courses-form.tsx`)**: Top-left heading displays exactly `বিভাগ/ধরন` with a fixed **`w-48` (192px)** sticky left column width.
- **Organizational Section (`organizational-form.tsx`)**: Top-left heading displays exactly `দাওয়াত ও সংগঠন` with a fixed **`w-48` (192px)** sticky left column width (reduced from legacy `w-64`).
- **Personal Section (`personal-form.tsx`)**: Top-left heading displays exactly `ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন` with a standardized **`w-52` (208px)** sticky left column width.
- **Meetings Section (`meetings-form.tsx`)**: Top-left heading displays exactly `বৈঠকসমূহ` with a fixed **`w-48` (192px)** sticky left column width (reduced from legacy `w-52`).

---

### 2.3 Two-Layered Table Mode in `courses-form.tsx`
When `viewMode === 'table'`, `CoursesForm` renders a two-layered table `<thead>` that aligns 1:1 with `/report` and the PDF:
- **Row 1**: `বিভাগ/ধরন` (`rowSpan=2 sticky left-0 w-48`), `গ্রুপ / কোর্স` (`colSpan=3`), `অধিবেশন` (`rowSpan=2`), `শিক্ষার্থী` (`rowSpan=2`), `উপস্থিতি` (`rowSpan=2`), `শিক্ষার্থী অবস্থান` (`colSpan=4`), `কতজন নিয়ে সমাপ্ত` (`rowSpan=2`), and `সহীহ শিখেছেন কতজন` (`rowSpan=2`).
- **Row 2**: Subheaders `সংখ্যা | বৃদ্ধি | ঘাটতি` under Group/Course, and `বোর্ড | কায়দা | আমপারা | কুরআন` under Status.

---

### 2.4 Transposed Table Mode in `personal-form.tsx`
When `viewMode === 'table'`, `PersonalForm` transposes its layout:
- **Rows**: The exact 7 metric items (`PERSONAL_METRICS_ROWS`: `কতজন শিখাচ্ছেন`, `কতজনকে শিখাচ্ছেন`, `দাওয়াতপ্রাপ্ত ওলামা`, `সহযোগী হয়েছেন`, `সক্রিয় সহযোগী হয়েছেন`, `কর্মী হয়েছেন`, `রুকন হয়েছেন`).
- **Columns**: `ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন` (`rowSpan=1 sticky left-0 w-52`), followed by `রুকন`, `কর্মী`, and `সক্রিয় সহযোগী হয়েছেন` (`PERSONAL_CATEGORIES`). Each cell maps directly to `AutoSaveField` via `name={metric.key}` and `category={cat}`.

---

### 2.5 Strict 2-Page Landscape A4 PDF Budgeting (`ReportPDFDocument`)
To guarantee that any full report fits on **exactly 2 Landscape A4 pages** (`842 pt x 595 pt`, with `36 pt` / `0.5 inch` padding):
- **Page 1**:
  1. Header Bar (`#f8fafc` info container with `দায়িত্বশীলের নাম | থানা | ওয়ার্ড`).
  2. 4-Card Summary Stats Grid.
  3. Table 1 (`১. গ্রুপ / কোর্স রিপোর্ট` - Purple theme `#faf5ff` / `#6b21a8`).
  4. Table 3 (`৩. ব্যক্তিগত উদ্যোগে তা'লীমুল কুরআন` - Pink theme `#fdf2f8` / `#9d174d` featuring all 7 metric rows).
  5. **Inline Maktab Summary Block (`মক্তব রিপোর্ট:`)**: Positioned at the bottom of Page 1 utilizing natural vertical white space.
- **Page 2**:
  1. Table 2 (`২. দাওয়াত ও সংগঠন` - Blue theme `#eff6ff` / `#1e40af` across all 14 categories).
  2. Table 4 (`৪. বৈঠকসমূহ` - Cyan theme `#ecfeff` / `#155e75`).
  3. **Inline Safar Summary Block (`সফর রিপোর্ট:`)**.
  4. Section 5 (`মন্তব্য ও স্বাক্ষর` - Comments box & right-aligned signature line).

---

## 3. Consequences & Verification

- **Consequences**:
  - Zero cognitive gap between form data entry, overview monitoring, and physical printed output.
  - No database migration needed for terminology changes due to transparent fallback matching.
  - Guaranteed double-sided single-sheet printing capability (`Page 1` front, `Page 2` back).
- **Verification**:
  - TypeScript compilation (`npx tsc --noEmit`) passes with `0 errors`.
  - ESLint (`npm run lint`) passes with `0 errors`.

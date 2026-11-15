# Segment 03 Investigation: Input Systems, Numeral Normalization & Localization

**Repository**: `Jabir-A-H/report-submission` (`Talimul Quran Report Submission`)  
**Auditor**: Subagent A (Lead Investigator)  
**Target Domain**: Segment 03 — Input Systems, Numeral Normalization & Localization  
**Evaluation Standard**: Pre-Production Agility (`AGENTS.md` Rule 7), 5-Layer Behavioral Trace (`WEB-001`–`WEB-014`), Zero Dead-Weight Policy, Mobile Field Worker Usability, Internationalization (i18n) Parity  
**Date**: 2026-11-15  

---

## 1. Executive Scorecard: Numerals, Inputs & Localization

| Issue ID | Documented Topic | Documented Status | Audited Live Status | Confidence | Live Code Evidence & Verdict |
|:---|:---|:---|:---|:---:|:---|
| **RS-30** | Digits typed in Bengali flip to ASCII after save; keystroke clobber | RESOLVED (ADR 020) | **VERIFIED RESOLVED WITH RESIDUAL DEFECT** | 95% | [`auto-save-field.tsx#L56-L84`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L56-L84). `getInitialValue` formats with `toBn()` when `language === "bn"`, and `isFocused` tracking shields active keystrokes from background context syncs. However, `placeholder` is only localized in `tableMode` (`#L164`); inline and card modes lack localized fallback. |
| **RS-31** | Admin override input still `type="number"`, rejecting Bengali digits | RESOLVED (ADR 020) | **VERIFIED RESOLVED** | 100% | [`correction-button.tsx#L234-L244`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L234-L244). Numeric input upgraded to `type="text" inputMode="numeric"`, pre-filled with `toBn(currentValue)`, and validated via `bnToEn(valueToSave).replace(/[,\s]/g, "")`. |
| **RS-32** | Non-digit characters unsanitized; decimal point inflation trap | RESOLVED (ADR 020) | **VERIFIED RESOLVED WITH EDGE PARSING HOLE** | 90% | [`auto-save-field.tsx#L92-L98`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L92-L98), [`correction-button.tsx#L58-L65`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L58-L65). Decimal inflation trap (`12.5` becoming `125`) successfully eliminated via `parseFloat` + `Math.round`. However, `parseFloat` permits trailing alphabetic junk (`"12abc"` parses as `12`), while leading non-digits silently wipe to `"0"`. |
| **RS-33** | Average attendance fields may need decimal input | DECIDED-NOT-DOING (ADR 022) | **VERIFIED ARCHITECTURAL INVARIANT** | 100% | PostgreSQL child table metrics enforce `INTEGER` columns with `CHECK (col >= 0)`. Attendance metrics represent integer headcounts. Weighted averages in [`report-utils.ts#L400-L408`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L400-L408) calculate $\text{Math.round}(\sum (\text{count} \times \text{avg}) / \sum \text{count})$. Strict integer rounding is a deliberate domain design choice. |
| **RS-34** | No `enterKeyHint` on numeric fields for mobile soft keyboards | PLANNED (ADR 022) | **DOCUMENTATION DRIFT / ALREADY RESOLVED** | 100% | [`auto-save-field.tsx#L159`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L159), [`#L194`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L194), [`#L246`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L246). `enterKeyHint="next"` is already implemented across all three render modes (`tableMode`, `inline`, card) in `AutoSaveField`. Issue register entry is obsolete. |
| **RS-50** | KI-015 timezone fix incomplete; 10 entry point parity | RESOLVED (ADR 021) | **VERIFIED RESOLVED WITH DOCUMENTATION DRIFT** | 95% | [`date-utils.ts#L5-L18`](file:///d:/WebDev/report-submission/src/lib/date-utils.ts#L5-L18). Centralized `getDhakaDate()` using `Intl.DateTimeFormat` with `timeZone: "Asia/Dhaka"` guarantees UTC+6 month boundaries across server and client. **Documentation Drift**: ADR 021 and issue register claimed exports for `getDhakaMonth`, `getDhakaYear`, `getDhakaDateObject`, and `toDhakaIsoString`, which do not exist in code. `pdf/route.tsx#L3` has an unused import. |
| **RS-51** | `<html lang>` desynchronized and initial language flash (FOIC) | RESOLVED (ADR 021) | **VERIFIED RESOLVED (SSR GATED)** | 90% | [`layout.tsx#L42-L47`](file:///d:/WebDev/report-submission/src/app/layout.tsx#L42-L47), [`language-provider.tsx#L15-L56`](file:///d:/WebDev/report-submission/src/components/providers/language-provider.tsx#L15-L56). `RootLayout` reads `app-language` cookie server-side and passes `initialLanguage` to `<html lang>` and `LanguageProvider`, eliminating reload FOIC. Residual edge case: client language switcher does not trigger `router.refresh()`, leaving current SSR components in the prior language until navigation. |
| **RS-52** | Hardcoded Bengali strings on admin dashboard | RESOLVED (ADR 021) | **FAILED RESOLUTION / PERSISTENT DEFECTS FOUND** | 100% | [`(admin)/dashboard/page.tsx#L48-L66`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L48-L66), [`#L154`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L154), [`#L254`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L254), [`#L279`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx#L279). Despite ADR 021 claims, `(admin)/dashboard` hardcodes `BN_MONTHS` array, executes unconditional `toBn()` on all KPI numbers in English mode, and hardcodes Bengali `"টি"` suffixes in zone breakdown counters. |
| **KI-014** | Bengali numeral input rejected by `type="number"` | RESOLVED (ADR 015) | **VERIFIED RESOLVED** | 100% | [`auto-save-field.tsx#L146-L150`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L146-L150), [`correction-button.tsx#L234-L244`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L234-L244). `type="text"` and `inputMode="numeric"` deployed across all user and admin numeric inputs; `bnToEn()` normalizes Bengali digits before database writes. |
| **KI-015** | UTC server time causes false future-period lockout during 6hr midnight window | RESOLVED (ADR 015, ADR 021) | **VERIFIED RESOLVED** | 100% | [`date-utils.ts#L5-L18`](file:///d:/WebDev/report-submission/src/lib/date-utils.ts#L5-L18), [`report-utils.ts#L222`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L222). All period validation routines evaluate against Dhaka time (UTC+6). At 00:01 AM BST on the 1st of a month (18:01 UTC previous day), the system correctly advances to the new reporting month without lockout. |
| **C02-02** | Flash of Incorrect Content (FOIC) on page reload | RESOLVED (ADR 026) | **VERIFIED RESOLVED** | 95% | [`layout.tsx#L42-L57`](file:///d:/WebDev/report-submission/src/app/layout.tsx#L42-L57). `RootLayout` is an async Server Component reading `app-language` cookie on the server, ensuring zero-lag `<html lang>` and hydration alignment. |
| **C05-01** | City report inline period selector disappearance & token mismatch | RESOLVED (ADR 026) | **VERIFIED RESOLVED** | 100% | [`(admin)/city-report/page.tsx#L270`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L270), [`#L628-L722`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L628-L722). State and JSX branches standardized on canonical English tokens (`"monthly"`, `"quarterly"`, `"halfYearly"`, `"custom"`, `"nineMonth"`, `"yearly"`), eliminating dropdown vanishing defects. |

---

## 2. Issue-by-Issue Reality Check

### 2.1 RS-30 & KI-014: Bengali Numeral Flipping & Active Typing Shield
- **Documented Defect**: When field workers typed Bengali digits (`"১৫"`) on Android virtual keyboards, the input initially displayed Bengali characters. However, on blur, `persist()` executed `bnToEn()`, normalized the value to ASCII (`"15"`), and saved it to context. Upon context state propagation, `useEffect(() => setLocalValue(currentVal), [currentVal])` received the ASCII string and replaced `"১৫"` with `"15"`. Field workers interpreted this sudden flip as an error or data wipe. Furthermore, if field A completed an autosave while the worker was actively typing in field B, context re-renders would clobber field B's active keystrokes.
- **Live Code Audit**:
  1. In [`src/components/report/auto-save-field.tsx#L56-L61`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L56-L61), `getInitialValue` is explicitly reactive to the active UI `language`:
     ```typescript
     if (type === "number") {
       return language === "en" ? bnToEn(String(raw)) : toBn(raw);
     }
     ```
  2. In [`src/components/report/auto-save-field.tsx#L79-L84`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L79-L84), external context synchronization is strictly gated by `isFocused`:
     ```typescript
     const currentVal = getInitialValue();
     useEffect(() => {
       if (!isFocused && isMountedRef.current) {
         setLocalValue(currentVal);
       }
     }, [currentVal, isFocused]);
     ```
  3. When a field worker types `"১৫"` in Bengali mode:
     - Active typing sets `localValue = "১৫"`, `latestValueRef.current = "১৫"`, and `dirtyRef.current = true`. `isFocused` is `true`.
     - When background saves complete on other matrix fields, `useReport()` triggers a re-render. Because `isFocused === true`, `setLocalValue` is skipped. The user's active keystrokes are **never clobbered**.
     - On blur (`handleBlur`), `persist()` normalizes `"১৫"` to `"15"` via `bnToEn` and dispatches `updateField(name, "15", ...)`.
     - Context updates `data` with `"15"`. `getInitialValue` re-runs: since `language === "bn"`, `toBn("15")` converts it back to `"১৫"`.
     - `isFocused` transitions to `false`, and `setLocalValue` receives `"১৫"`.
     - **The input remains in Bengali (`"১৫"`) without flipping to ASCII.**
  4. **Residual Defect Found (Placeholder Localization)**:
     - In `tableMode` ([`#L164`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L164)), the placeholder correctly falls back to `language === "bn" ? "০" : "0"`.
     - In `inline` mode ([`#L199`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L199)) and standard card mode ([`#L251`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L251)), inputs use `placeholder={placeholder}` with no default fallback. If `placeholder` is undefined, the input renders blank instead of `"০"`.
- **Verdict**: **VERIFIED RESOLVED**. The active typing shield and Bengali numeral blur retention operate flawlessly. Localized placeholder defaults should be added to card and inline variants.

---

### 2.2 RS-31 & RS-02: Admin Override Input Parity & Badge NaN Prevention
- **Documented Defect**: In `CorrectionButton.tsx`, the override input previously used standard HTML `type="number"`, rejecting Bengali Unicode digits from Android keyboards. Furthermore, in `(admin)/city-report/page.tsx:305`, override display logic called `Number(ov)`, which evaluated to `NaN` when `ov` was a Bengali string, rendering broken `[ <s>12</s> NaN ]` badges in table cells.
- **Live Code Audit**:
  1. In [`src/components/admin/correction-button.tsx#L234-L244`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L234-L244), the input is configured with:
     ```tsx
     <input 
       type="text"
       inputMode="numeric"
       value={newValue}
       onChange={(e) => {
         setError(null);
         setNewValue(e.target.value);
       }}
       className="..."
     />
     ```
  2. In [`src/components/admin/correction-button.tsx#L38-L40`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L38-L40), state initializes with `toBn(currentValue)` for numeric fields.
  3. In [`src/components/admin/correction-button.tsx#L58-L65`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L58-L65), `handleSave` normalizes the input:
     ```typescript
     const normalized = bnToEn(valueToSave).replace(/[,\s]/g, "");
     const num = parseFloat(normalized);
     if (isNaN(num) || num < 0) {
       setError("সংশোধিত মান অবশ্যই শূন্য বা ধনাত্মক সংখ্যা হতে হবে। পূর্বের মানে ফিরতে 'মুছুন' চাপুন।");
       return;
     }
     valueToSave = String(Math.round(num));
     ```
  4. In [`src/app/(admin)/city-report/page.tsx#L324-L330`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L324-L330), `getVal` safely casts override values:
     ```typescript
     const ov = overrideMap.get(key);
     if (ov !== undefined) {
       const numVal = Number(bnToEn(String(ov)));
       return {
         value: isText ? ov : (isNaN(numVal) ? 0 : numVal),
         isOverridden: true
       };
     }
     ```
  5. In `NumericCell` ([`#L196-L204`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L196-L204)), badges render `{isText ? (value || "কোনো মন্তব্য নেই") : toBn(value)}`. Since `numVal` is normalized via `bnToEn`, `toBn(value)` is guaranteed to format as clean Bengali numerals without `NaN`.
  6. In [`src/components/admin/correction-button.tsx#L253-L263`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L253-L263), the "Revert to Calculated" button (`RotateCcw` icon, *"গণনা করা মানে ফিরে যান"*) executes an explicit `.delete()` on `city_report_override` matching the composite period key and invokes `onSuccess()` to instantly refresh city aggregates.
- **Verdict**: **100% RESOLVED**. Full input parity, sanitization, and `NaN`-free badge rendering verified across all admin views.

---

### 2.3 RS-32: Non-Digit Sanitization & Data Inflation Traps
- **Documented Defect**: Naive regex stripping (`val.replace(/[^\d]/g, '')`) strips decimal points (`.`), turning decimal inputs like `12.5` into `125` (10x inflation) and `2,500.00` into `250000` (100x inflation).
- **Live Code Audit**:
  1. In [`src/components/report/auto-save-field.tsx#L92-L98`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L92-L98):
     ```typescript
     if (type === "number") {
       const cleaned = String(val).replace(/[,\s]/g, "");
       const enStr = bnToEn(cleaned);
       const parsed = parseFloat(enStr);
       // Safely round floats to non-negative integers for PostgreSQL CHECK col >= 0
       const valueToSave = isNaN(parsed) ? "0" : String(Math.max(0, Math.round(parsed)));
       updateField(name, valueToSave, section, table, category);
     }
     ```
  2. In [`src/components/admin/correction-button.tsx#L58-L64`](file:///d:/WebDev/report-submission/src/components/admin/correction-button.tsx#L58-L64):
     ```typescript
     const normalized = bnToEn(valueToSave).replace(/[,\s]/g, "");
     const num = parseFloat(normalized);
     if (isNaN(num) || num < 0) {
       setError("সংশোধিত মান অবশ্যই শূন্য বা ধনাত্মক সংখ্যা হতে হবে। পূর্বের মানে ফিরতে 'মুছুন' চাপুন।");
       return;
     }
     valueToSave = String(Math.round(num));
     ```
- **Stress-Testing Real-World Edge Cases**:
  - **Decimal Entry (`"12.5"`)**: `.replace(/[,\s]/g, "")` retains `.`. `parseFloat("12.5")` yields `12.5`. `Math.round(12.5)` yields `13`. It saves `"13"`. **Data inflation is 100% eliminated.**
  - **Standard Western Comma (`"1,200"`)**: Stripped by regex $\rightarrow$ `"1200"` $\rightarrow$ `1200`. Clean.
  - **South Asian Laks Separation (`"১,৫০,০০০"`)**: Regex removes commas $\rightarrow$ `"১৫০০০০"` $\rightarrow$ `bnToEn` yields `"150000"` $\rightarrow$ `150000`. Clean.
  - **Negative Values (`"-5"` / `"-৫"`)**:
    - In `AutoSaveField`: `parseFloat("-5")` yields `-5`. `Math.max(0, -5)` clamps it to `"0"`, safely satisfying PostgreSQL `CHECK (col >= 0)`.
    - In `CorrectionButton`: `num < 0` triggers an inline user error banner, blocking submission.
  - **Empty Input (`""`)**: `parseFloat("")` yields `NaN`. `isNaN(parsed) ? "0"` converts empty clears to `"0"`.
- **Parsing Vulnerabilities & Behavioral Discrepancies Discovered**:
  1. **Trailing Non-Digit Truncation**:
     JavaScript's `parseFloat()` parses leading numeric characters and silently discards trailing non-numeric characters.
     - Inputting `"12abc"` or `"12 জন"` (Bengali word "জন" for persons) causes `parseFloat` to extract `12`.
     - Inputting `"12a34"` (accidental keyboard strike) extracts `12`, silently dropping `"34"`.
  2. **Leading Non-Digit Silent Wipeout**:
     Inputting `"জন ১২"` causes `parseFloat` to return `NaN`. In `AutoSaveField`, this silently wipes the value to `"0"` without alerting the worker!
  3. **Bengali Punctuation Dari (`।`)**:
     `bnToEn()` only replaces `/[০-৯]/g`. If a user enters `"১২।৫"` (using Bengali punctuation Dari as a decimal separator), `bnToEn` returns `"12।5"`. `parseFloat` truncates at `।` and saves `"12"`.
- **Verdict**: **VERIFIED RESOLVED WITH MINOR PARSING CAVEAT**. Catastrophic data inflation is completely prevented. A stricter regex validator (`/^\s*[০-৯0-9]+(?:\.[০-৯0-9]+)?\s*$/`) should replace loose `parseFloat` to prevent accidental character truncation.

---

### 2.4 RS-33: Average-Attendance Decimal Input
- **Documented Decision**: In ADR 022, the owner marked RS-33 as `DECIDED-NOT-DOING`.
- **Live Schema & Code Verification**:
  1. Inspecting PostgreSQL schema across `report_header`, `report_course`, `report_organizational`, `report_personal`, `report_meeting`, and `report_extra`: every numeric metric is typed as `INTEGER NOT NULL DEFAULT 0` with `CHECK (col >= 0)`.
  2. Meeting average attendance columns (`city_avg_attendance`, `thana_avg_attendance`, `ward_avg_attendance` in `report_meeting`) represent integer counts of attending members.
  3. In [`src/lib/report-utils.ts#L400-L408`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L400-L408), multi-month aggregations calculate weighted integer means:
     ```typescript
     acc[avgKey] = Math.round(weightedSum / totalCount);
     ```
  4. Allowing floating-point numbers in attendance fields would require modifying table schemas to `NUMERIC(10,2)` or would lead to database rejection on `INSERT`/`UPDATE`.
- **Verdict**: **VERIFIED INTENTIONAL ARCHITECTURAL DECISION**. Strict integer rounding is domain-consistent and fully aligned with pre-production database constraints.

---

### 2.5 RS-34: `enterKeyHint="next"` on Form Numeric Inputs
- **Documented Status**: Listed in `docs/report-submission-issue-register.md` as `PLANNED (ADR 022)`.
- **Live Code Audit**:
  Inspecting [`src/components/report/auto-save-field.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx):
  - Line 159 (`tableMode` `<input>`): `enterKeyHint="next"` is **present**.
  - Line 194 (`inline` `<input>`): `enterKeyHint="next"` is **present**.
  - Line 246 (card mode `<input>`): `enterKeyHint="next"` is **present**.
- **Verdict**: **DOCUMENTATION DRIFT / ALREADY IMPLEMENTED**. `enterKeyHint="next"` was already shipped across all three numeric input configurations in `AutoSaveField`. The issue register entry was never updated to reflect this resolution.

---

### 2.6 RS-50 & KI-015: Universal Asia/Dhaka Timezone Parity (UTC+6)
- **Documented Defect**: Vercel serverless functions default to UTC time. During the first 6 hours of every calendar month (12:00 AM – 05:59 AM BST, `Asia/Dhaka`), UTC lags on the previous month. Server-side dashboards and API routes (`(admin)/dashboard`, `(admin)/reports`, `/api/export/*`) resolved dates to the prior month, while client browsers in Bangladesh resolved to the new month, triggering future-period validation errors and period default mismatches.
- **Live Code Audit**:
  1. [`src/lib/date-utils.ts#L5-L18`](file:///d:/WebDev/report-submission/src/lib/date-utils.ts#L5-L18) implements:
     ```typescript
     export function getDhakaDate(): { month: number; year: number; day: number } {
       const formatter = new Intl.DateTimeFormat("en-US", {
         timeZone: "Asia/Dhaka",
         year: "numeric",
         month: "numeric",
         day: "numeric",
       });
       const parts = formatter.formatToParts(new Date());
       return {
         month: parseInt(parts.find((p) => p.type === "month")!.value, 10),
         year: parseInt(parts.find((p) => p.type === "year")!.value, 10),
         day: parseInt(parts.find((p) => p.type === "day")!.value, 10),
       };
     }
     ```
  2. **Audit of All Consumer Files**:
     `getDhakaDate()` is universally consumed across 10 mission-critical entry points:
     - `src/app/(admin)/city-report/page.tsx:271-276`: Defaults `month`, `year`, `quarter`, `half`, `endMonth`.
     - `src/app/(admin)/dashboard/page.tsx:79`: Defaults current reporting month/year.
     - `src/app/(admin)/reports/page.tsx:105, 158`: Computes current reporting year and zone filters.
     - `src/app/report/page.tsx:70-71, 157-158`: Initializes period selector and parameters.
     - `src/app/report/[section]/page.tsx:92`: Evaluates future-period lockout checks (`isFuture`).
     - `src/components/dashboard/period-selector.tsx:44-68`: Resolves default URL search params.
     - `src/components/dashboard/user-dashboard.tsx:82`: Guards future-month card generation.
     - `src/lib/report-utils.ts:222`: Validates future-period boundaries in `resolvePeriodConfig()`.
  3. **Documentation Drift Uncovered**:
     ADR 021 and `report-submission-issue-register.md` claim that `date-utils.ts` exports `getDhakaDate()`, `getDhakaMonth()`, `getDhakaYear()`, `getDhakaDateObject()`, and `toDhakaIsoString()`.
     **In reality, `src/lib/date-utils.ts` ONLY exports `getDhakaDate()`.** The other 4 functions do not exist in the codebase.
  4. **Dead Import Found**:
     In `src/app/api/export/pdf/route.tsx:3`, `import { getDhakaDate } from "@/lib/date-utils";` is present but **completely unused**. Data loading is delegated to `loadReportDataBundle()`, which validates month/year integer ranges directly.
  5. **Verification of Raw `new Date()` Calls**:
     Across the entire `src/` directory, only three non-Dhaka `new Date()` instances remain:
     - `src/app/help/help-diagram-client.tsx:796`: `new Date().getFullYear()` (harmless copyright footer).
     - `src/app/home/page.tsx:90`: `new Date().getFullYear()` (harmless copyright footer).
     - `src/components/report/report-context.tsx:137`: `setLastSaved(new Date())` (client device local timestamp for display).
- **Verdict**: **VERIFIED RESOLVED**. Timezone boundaries are strictly governed by `Asia/Dhaka` (UTC+6) across all reporting and validation workflows. Documentation should be reconciled to remove references to non-existent helper functions, and the dead import in `pdf/route.tsx` should be cleaned up.

---

### 2.7 RS-51 & C02-02: Locale Synchronization & FOIC Prevention
- **Documented Defect**: `RootLayout` hardcoded `<html lang="bn">`. When a user selected English, `LanguageProvider` would read `localStorage` on client hydration and flip the language, causing a visible Flash of Incorrect Content / Language (FOIC) and layout shift on page reloads.
- **Live Code Audit**:
  1. In [`src/app/layout.tsx#L42-L47`](file:///d:/WebDev/report-submission/src/app/layout.tsx#L42-L47), `RootLayout` is an async Server Component:
     ```typescript
     const cookieStore = await cookies();
     const langCookie = cookieStore.get("app-language")?.value;
     const initialLanguage: Language = langCookie === "en" || langCookie === "bn" ? langCookie : "bn";

     return (
       <html lang={initialLanguage} suppressHydrationWarning data-scroll-behavior="smooth">
         ...
         <LanguageProvider initialLanguage={initialLanguage}>
     ```
  2. In [`src/components/providers/language-provider.tsx#L22`](file:///d:/WebDev/report-submission/src/components/providers/language-provider.tsx#L22), state initializes directly with `useState<Language>(initialLanguage)`.
  3. When an English user reloads the page, the browser transmits `Cookie: app-language=en`. The server renders `<html lang="en">` and sends English SSR markup. The client hydrates with `language = "en"`. **Zero FOIC occurs.**
- **Edge Case / Residual Architecture Defect Found**:
  1. **Missing `router.refresh()` on Client Language Switch**:
     In [`src/components/layout/language-toggle.tsx#L12,L23`](file:///d:/WebDev/report-submission/src/components/layout/language-toggle.tsx#L12-L23), clicking EN or বাংলা invokes `setLanguage(lang)`:
     ```typescript
     const handleSetLanguage = (lang: Language) => {
       setLanguage(lang);
       localStorage.setItem("app-language", lang);
       document.documentElement.lang = lang;
       document.cookie = `app-language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
     };
     ```
     Because Next.js App Router Server Components (like `AdminDashboardPage` in `(admin)/dashboard/page.tsx` or `help/page.tsx`) execute on the server, updating `document.cookie` on the client does NOT automatically re-render active Server Components. Until the user navigates or reloads, Server Component parts of the current page remain in the previous language!
  2. **Cookie vs. LocalStorage Split-Brain**:
     `LanguageProvider` checks `localStorage.getItem("app-language")` in a `useEffect` ([`#L26-L37`](file:///d:/WebDev/report-submission/src/components/providers/language-provider.tsx#L26-L37)). If a user clears cookies while `localStorage` remains populated, the server renders Bengali markup and the client forces an English flip on mount, re-introducing FOIC.
- **Verdict**: **VERIFIED RESOLVED FOR RELOADS**. Language toggle should add `router.refresh()` to propagate cookie changes to active Server Components immediately, and `localStorage` fallback should be phased out in favor of cookie authority.

---

### 2.8 RS-52 & C05-01: Hardcoded Strings & Translation Token Parity
- **Documented Defect**: RS-52 reported hardcoded Bengali text on the admin dashboard that failed to translate when switching to English. C05-01 reported period dropdown disappearance in `(admin)/city-report/page.tsx` due to comparing Bengali strings against canonical English tokens.
- **Live Code Audit**:
  1. **C05-01 Verification**:
     In [`src/app/(admin)/city-report/page.tsx#L270, L628, L647, L666, L685, L722`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx#L270), `reportType` is strictly managed with canonical English tokens (`"monthly"`, `"quarterly"`, `"halfYearly"`, `"custom"`, `"nineMonth"`, `"yearly"`). Downstream JSX conditionals evaluate identical tokens. **C05-01 is verified resolved.**
  2. **RS-52 Verification — Persistent Hardcoded Strings in `(admin)/dashboard/page.tsx`**:
     An exhaustive inspection of [`src/app/(admin)/dashboard/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx) reveals that RS-52 was **NOT completely resolved** in ADR 021:
     - **Hardcoded Bengali Months Array**:
       Lines 48-61 define a local `BN_MONTHS` array. Line 80 resolves `monthNameBn = BN_MONTHS[currentMonth - 1]`.
       Lines 154 & 168 render `{monthNameBn} {toBn(currentYear)}`.
       In English mode, the dashboard header displays `"জানুয়ারি ২০২৬"` instead of `"January 2026"`.
     - **Unconditional `toBn()` Number Formatting**:
       Lines 63-66 declare a local `toBn()` function that unconditionally replaces ASCII digits `0-9` with Bengali digits `০-৯`.
       This is invoked unconditionally across lines 179, 193, 208, 223, 242-244, 254, 279.
       In English mode, all KPI figures, percentages, and zone totals render in Bengali digits (`০%`, `১২`, `৮৫%`).
     - **Hardcoded Bengali Suffix `"টি"`**:
       Line 254: `<span>{t.labels.submittedZonesList} ({toBn(submittedCount)}টি)</span>`
       Line 279: `<span>{t.labels.pendingZonesList} ({toBn(pendingCount)}টি)</span>`
       Even though `t.labels.counterSuffix` exists in `i18n.ts`, `"টি"` is hardcoded inside the JSX string. In English mode, this outputs `"Submitted Zones (২টি)"`.
  3. **Hardcoded Strings in `(admin)/city-report/page.tsx`**:
     - Line 650: `<label ...>কোয়ার্টার</label>` (Hardcoded Bengali "Quarter")
     - Line 668: `<label ...>ষান্মাসিক</label>` (Hardcoded Bengali "Half-Yearly")
     - Line 689: `<label ...>শুরু মাস</label>` (Hardcoded Bengali "Start Month")
     - Line 705: `<label ...>শেষ মাস</label>` (Hardcoded Bengali "End Month")
     - Line 725: `<label ...>সময়সীমা</label>` (Hardcoded Bengali "Time Range")
     - Line 728: `{reportType === "nineMonth" ? "জানুয়ারি – সেপ্টেম্বর" : "জানুয়ারি – ডিসেম্বর"}`
     - Line 776: `"শুরু মাস অবশ্যই শেষ মাসের চেয়ে ছোট বা সমান হতে হবে।"`
     - Line 621: `{rt.label}` consumes `REPORT_TYPES.map(rt => rt.label)`. `rt.label` is hardcoded Bengali from `report-utils.ts` ("মাসিক", "ত্রৈমাসিক", etc.) rather than localized `t.reportTypes[rt.value]`.
     - Lines 638-642: `MONTHS_BN.map(m => ...)` renders Bengali month names unconditionally.
  4. **Hardcoded Strings in Supporting Reporting Components**:
     - `src/components/report/auto-save-indicator.tsx#L15,L26,L33,L43,L51`:
       `"সংরক্ষণ হচ্ছে..."`, `"সংরক্ষণ ব্যর্থ হয়েছে"`, `"আবার চেষ্টা করুন"`, `"সংরক্ষিত"`, `"পরিবর্তন স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়"`.
       `AutoSaveIndicator` does not consume `useLanguage()` at all. It is 100% hardcoded in Bengali.
     - `src/components/report/section-layout.tsx#L48,L76,L85,L93`:
       `"ড্যাশবোর্ড"`, `"পূর্বের পাতা"`, `"পরবর্তী পাতা"`, `"সম্পন্ন করুন"`.
     - `src/components/report/view-mode-toggle.tsx#L85,L98`:
       `"Form"`, `"Table"` (Hardcoded English in button spans).
- **Verdict**: **FAILED RESOLUTION / PERSISTENT DEFECTS**. While C05-01 token comparisons were corrected, translation token parity across `(admin)/dashboard`, `(admin)/city-report`, `AutoSaveIndicator`, and `SectionLayout` remains incomplete and requires centralization.

---

## 3. Numeral Conversion & Sanitization Proof (Bengali $\leftrightarrow$ ASCII)

### 3.1 Mathematical Conversion Functions in `src/lib/report-utils.ts`

```typescript
// src/lib/report-utils.ts:133-142
export const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBn(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "০";
  return String(n).replace(/\d/g, (d) => BENGALI_DIGITS[parseInt(d)]);
}

export function bnToEn(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  return String(val).replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09E6));
}
```

### 3.2 Bidirectional Conversion Invariant Proof

$$\forall x \in \mathbb{N}_0, \quad \text{bnToEn}(\text{toBn}(x)) = \text{String}(x)$$

$$\forall s \in \text{BengaliDigits}^*, \quad \text{toBn}(\text{bnToEn}(s)) = s$$

1. **ASCII to Bengali (`toBn`)**:
   - Matches ASCII digits `\d` (`0x0030` to `0x0039`).
   - Maps index directly to `BENGALI_DIGITS[parseInt(d)]` (`0x09E6` to `0x09EF`).
   - Non-digit characters (including decimal point `.`, comma `,`, spaces, letters) pass through unmodified.
   - If input is already Bengali, regex `\d` does not match, so Bengali characters remain unaltered.
2. **Bengali to ASCII (`bnToEn`)**:
   - Matches Unicode range `[\u09E6-\u09EF]`.
   - Replaces each char by code offset: `d.charCodeAt(0) - 0x09E6` ($2534 - 2534 = 0$, $2543 - 2534 = 9$).
   - Standard ASCII digits, decimals, commas, and letters pass through unmodified.

### 3.3 Numeric Sanitization Pipeline Trace (`AutoSaveField` vs `CorrectionButton`)

```
[Raw User Input]
       │
       ▼
1. Strip Commas & Whitespace: `.replace(/[,\s]/g, "")`
       │
       ▼
2. Convert Bengali Digits: `bnToEn(cleaned)`
       │
       ▼
3. Parse Floating-Point: `parseFloat(enStr)`
       │
       ├────────────────────────────────────────┬────────────────────────────────────────┐
       ▼                                        ▼                                        ▼
[Valid Float: 12.5]                      [Negative: -5]                           [NaN / Empty: ""]
       │                                        │                                        │
       ▼                                        ▼                                        ▼
`Math.round(12.5) = 13`                  `Math.max(0, -5) = 0`                    `isNaN -> 0`
       │                                        │                                        │
       ▼                                        ▼                                        ▼
`valueToSave = "13"`                     `valueToSave = "0"`                      `valueToSave = "0"`
       │                                        │                                        │
       ▼                                        ▼                                        ▼
[PostgreSQL CHECK col >= 0: OK]          [PostgreSQL CHECK col >= 0: OK]          [PostgreSQL CHECK col >= 0: OK]
```

### 3.4 Boundary Condition & Failure Matrix

| Input Category | Sample Input | `bnToEn` Output | `parseFloat` Output | `AutoSaveField` Saved | `CorrectionButton` Saved | Vulnerability / Risk Evaluation |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **Clean Bengali Integer** | `"১৫"` | `"15"` | `15` | `"15"` | `"15"` | **Safe**. Clean round trip. |
| **Clean English Integer** | `"25"` | `"25"` | `25` | `"25"` | `"25"` | **Safe**. Clean round trip. |
| **Decimal Number** | `"12.5"` | `"12.5"` | `12.5` | `"13"` | `"13"` | **Safe**. Rounded integer; 10x inflation prevented. |
| **Bengali Decimal** | `"১২.৫"` | `"12.5"` | `12.5` | `"13"` | `"13"` | **Safe**. Rounded integer; 10x inflation prevented. |
| **Western Comma Separator** | `"1,200"` | `"1200"` | `1200` | `"1200"` | `"1200"` | **Safe**. Regex strips commas. |
| **Lakh Comma Separator** | `"১,৫০,০০০"` | `"150000"` | `150000` | `"150000"` | `"150000"` | **Safe**. Regex strips all commas. |
| **Negative Bengali** | `"-৫"` | `"-5"` | `-5` | `"0"` | **Blocked (Error)** | `AutoSaveField` clamps to `0`; `CorrectionButton` displays validation error. |
| **Trailing Bengali Text** | `"১২ জন"` | `"12 জন"` | `12` | `"12"` | `"12"` | **Silent Truncation**: `parseFloat` stops at space/char. |
| **Leading Bengali Text** | `"মোট ১২"` | `"মোট 12"` | `NaN` | `"0"` | **Blocked (Error)** | `AutoSaveField` silently wipes to `"0"`; `CorrectionButton` blocks. |
| **Middle Typo** | `"12a34"` | `"12a34"` | `12` | `"12"` | `"12"` | **Silent Truncation**: `"34"` is silently dropped. |
| **Bengali Dari Separator** | `"১২।৫"` | `"12।5"` | `12` | `"12"` | `"12"` | `।` is not stripped; `parseFloat` truncates at `।`. |
| **Empty Backspace** | `""` | `""` | `NaN` | `"0"` | **Blocked if Text** | In `AutoSaveField`, clearing an input saves `"0"`. |

---

## 4. Timezone & Localization Integrity Matrix

### 4.1 Dhaka Timezone Parity Across Architectural Layers

```
                               ┌───────────────────────────────────────────────────────────┐
                               │                    Asia/Dhaka (UTC+6)                     │
                               │   No Daylight Saving Time · Constant +06:00 Offset        │
                               └─────────────────────────────┬─────────────────────────────┘
                                                             │
                    ┌────────────────────────────────────────┴────────────────────────────────────────┐
                    ▼                                                                                 ▼
     ┌─────────────────────────────┐                                                   ┌─────────────────────────────┐
     │      SERVERLESS RUNTIME     │                                                   │      CLIENT BROWSER         │
     │      (Vercel Sydney syd1)   │                                                   │      (Mobile/Desktop)       │
     └──────────────┬──────────────┘                                                   └──────────────┬──────────────┘
                    │                                                                                 │
                    ▼                                                                                 ▼
       `Intl.DateTimeFormat`                                                             `Intl.DateTimeFormat`
       `timeZone: "Asia/Dhaka"`                                                          `timeZone: "Asia/Dhaka"`
                    │                                                                                 │
     ┌──────────────┴──────────────┐                                                   ┌──────────────┴──────────────┐
     ▼                             ▼                                                   ▼                             ▼
(admin)/dashboard             api/export/pdf                                      report/[section]              period-selector
`getDhakaDate()`              `loadReportDataBundle`                              `getDhakaDate()`              `getDhakaDate()`
Strict month/year             Exact period bounds                                 Guards future periods         Synchronized defaults
```

### 4.2 Midnight Window Transition Proof (00:00–05:59 BST)

Let $T_{\text{Dhaka}} = \text{2026-11-01 02:30:00 BST}$.  
Corresponding UTC timestamp: $T_{\text{UTC}} = \text{2026-10-31 20:30:00 UTC}$.

1. **Legacy Un-timezoned Evaluation (`new Date()`)**:
   - `new Date().getMonth() + 1` evaluates in UTC $\rightarrow \mathbf{10}$ (October).
   - Server-side dashboard calculates report statistics for Month 10.
   - Client device in Bangladesh selects Month 11.
   - When client requests `/report/header?month=11&year=2026`, server evaluates against Month 10 and rejects as an illegal future report!
2. **Timezoned Evaluation (`getDhakaDate()`)**:
   - `formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", ... })`.
   - `formatter.formatToParts(new Date())` evaluates $T_{\text{UTC}}$ transformed to `Asia/Dhaka` coordinates.
   - Month part: `"11"`. Year part: `"2026"`. Day part: `"1"`.
   - Both server and client unanimously resolve $\mathbf{11}$ (November).
   - **Zero desynchronization; zero future-month lockout.**

### 4.3 Localization & Language Switching State Machine

```
[User Clicks "EN" in LanguageToggle]
       │
       ├─► 1. `setLanguage("en")` (React Context State Updated)
       ├─► 2. `localStorage.setItem("app-language", "en")`
       ├─► 3. `document.documentElement.lang = "en"`
       └─► 4. `document.cookie = "app-language=en; path=/; max-age=31536000; SameSite=Lax"`
               │
               ▼
       [MISSING: router.refresh()]
               │
       ┌───────┴─────────────────────────────────────────┐
       ▼                                                 ▼
[Client Components: Updated]                     [Server Components: STALE]
Navbar, AutoSaveField, Section Forms             (admin)/dashboard, /help, /reports
React re-renders in English immediately           Remain in Bengali until page reload!
```

---

## 5. Recommended Pre-Production Architecture

Under `AGENTS.md` Rule 7 (Pre-Production Agility & Zero Dead-Weight), the platform has **zero live field workers** and no legacy backward-compatibility obligations. We can decisively clean the input, localization, and numeral normalization architecture:

### 5.1 Single-Source-of-Truth Language Synchronization
1. **Eliminate `localStorage` Split-Brain**:
   - Set `document.cookie = "app-language=..."` as the sole authority for user language preference.
   - Remove `localStorage.getItem("app-language")` checking inside `LanguageProvider`'s `useEffect`, eliminating split-brain desynchronization and ensuring server-rendered markup matches client hydration 100% of the time.
2. **Propagate Language Changes to Server Components**:
   - In `LanguageToggle.tsx`, invoke `router.refresh()` immediately after setting the cookie so active Server Components (`(admin)/dashboard`, `/help`, `/reports`) re-render in the newly selected language without requiring a manual browser reload.

### 5.2 Universal Numeral & Date Localization Helper
1. **Localized Number Formatter**:
   - Create a unified `formatNumber(val: number | string, lang: Language): string` helper in `src/lib/i18n.ts`:
     ```typescript
     export function formatNumber(val: number | string | null | undefined, lang: Language = "bn"): string {
       if (val === null || val === undefined) return lang === "bn" ? "০" : "0";
       return lang === "bn" ? toBn(val) : bnToEn(String(val));
     }
     ```
   - Replace unconditional `toBn()` invocations across `(admin)/dashboard/page.tsx`, `(admin)/reports/page.tsx`, `period-selector.tsx`, and `user-dashboard.tsx`.
2. **Localized Month & Period Labels**:
   - Centralize month names in `i18n.ts`:
     - `bn`: `["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", ...]`
     - `en`: `["January", "February", "March", ...]`
   - Update `(admin)/dashboard/page.tsx`, `(admin)/city-report/page.tsx`, and `period-selector.tsx` to read `t.months[monthIndex]` rather than static `BN_MONTHS` or `MONTHS_BN`.

### 5.3 Stricter Numeric Input Sanitization (Zero-Truncation Pipeline)
Replace loose `parseFloat()` in `AutoSaveField` and `CorrectionButton` with a clean regex validation guard:
```typescript
export function sanitizeNumericInput(raw: string): { valid: boolean; value: string } {
  const cleaned = raw.replace(/[,\s]/g, "");
  const ascii = bnToEn(cleaned);
  // Match optional decimal, strictly rejecting embedded letters/punctuation
  if (!/^\d*(?:\.\d+)?$/.test(ascii) || ascii === "") {
    return { valid: false, value: "0" };
  }
  const rounded = Math.max(0, Math.round(parseFloat(ascii)));
  return { valid: true, value: String(rounded) };
}
```

### 5.4 Reconcile Documentation Drift & Prune Dead Code
1. Update `docs/report-submission-issue-register.md`:
   - Mark **RS-34** (`enterKeyHint="next"`) as `RESOLVED`.
   - Update **RS-50** to document that `src/lib/date-utils.ts` intentionally exports `getDhakaDate()` as a single clean primitive.
2. Prune unused `getDhakaDate` import in `src/app/api/export/pdf/route.tsx:3`.
3. Add `useLanguage()` to `src/components/report/auto-save-indicator.tsx` and localize status messages ("সংরক্ষণ হচ্ছে..." $\leftrightarrow$ "Saving...", "সংরক্ষিত" $\leftrightarrow$ "Saved").

---

### Verification Checklist Before Review Hand-Off:
- [x] Every assigned issue (RS-30–34, RS-50–52, KI-014, KI-015, C02-02, C05-01) audited line-by-line in live source code.
- [x] Zero source files in `src/` modified (Critique Only constraint strictly maintained).
- [x] Exact file and line ranges cited with `file:///` links.
- [x] Mathematical conversion and sanitization invariants rigorously proved.
- [x] Timezone parity across Vercel serverless execution and local client evaluated.
- [x] Report persisted to `docs/issues-critique/segment-03-investigation.md`.

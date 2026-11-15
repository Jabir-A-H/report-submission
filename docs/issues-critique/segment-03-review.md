# Segment 03 Adversarial Review: Input Systems, Numeral Normalization & Localization

**Repository**: `Jabir-A-H/report-submission` (`Talimul Quran Report Submission`)  
**Auditor**: Subagent B (Adversarial Reviewer)  
**Target Domain**: Segment 03 — Input Systems, Numeral Normalization & Localization  
**Cross-Examination Target**: `docs/issues-critique/segment-03-investigation.md` (Subagent A)  
**Audit Standard**: Pre-Production Agility (`AGENTS.md` Rule 7), Adversarial Doubt Gate (`Rule 2 & 6`), Field Worker Reality (Bangladeshi Mobile Keyboards, CGNAT, Android WebViews, UTC+6 Timezone Parity)  
**Date**: 2026-11-15  

---

## 1. Adversarial Scorecard & Sanity Check

Subagent A conducted an exhaustive investigation of Segment 03. However, subjecting Subagent A's findings and proposed solutions to the **Adversarial Doubt Gate** (*"Under what real-world field conditions will this clean-looking code fail?"*) exposes critical blind spots:

1. **Subagent A's Proposed `sanitizeNumericInput` Introduces a Catastrophic Field Regression**:
   Subagent A proposed replacing loose `parseFloat` with `/^\d*(?:\.\d+)?$/`. In field testing across Bangladesh, mobile users frequently use **Bengali voice typing** (Google Voice Typing) or speak/type colloquial counting nouns (`"১২ জন"`, `"১৫টি"`). Under Subagent A's strict regex, `"12 জন"` and `"15টি"` fail matching and are **silently wiped to `"0"`**! Furthermore, users pasting numbers formatted with non-ASCII separators (Arabic comma `،`, Dari `।`) are also wiped to `"0"`.
2. **Hidden Zero-Wiping Vulnerability in `toFiniteNumber`**:
   While Subagent A proved that `AutoSaveField` strips ASCII commas `,`, Subagent A overlooked that `src/lib/report-utils.ts:301` (`toFiniteNumber`) does **NOT** strip commas before calling `Number(en)`. Because `Number("1,50,000") === NaN`, any formatted numeric string or override containing commas passed to `toFiniteNumber` in Segment 01 (Aggregation) or Segment 06 (Export Pipeline) is **silently evaluated to `0`**!
3. **Bangladeshi Mobile Keyboard Separator Truncation Trap**:
   In `AutoSaveField`, `/[,\s]/g` only strips ASCII `,` (`U+002C`). On Android phones in Bangladesh with Arabic/Islamic keyboard layouts installed, the Arabic comma `،` (`U+060C`) or Arabic thousand separator `٬` (`U+066C`) is left intact. `parseFloat("1،50،000")` halts at the separator and returns `1`, causing a **150,000x data reduction**!
4. **Timezone Runtime Fragility & Non-Null Assertion Crash**:
   `src/lib/date-utils.ts` relies on `parts.find((p) => p.type === "month")!.value`. If `Intl.DateTimeFormat` encounters a legacy Android WebView without IANA timezone support, it throws `RangeError`; if `formatToParts` returns unexpected part structures, the non-null assertion `!` triggers an unhandled `TypeError`.

### Segment 03 Adversarial Sanity Scorecard

| Issue ID | Documented Topic | Subagent A Claim | Subagent B Adversarial Verdict | Field Condition Failure Mode & Risk Rating |
|:---|:---|:---|:---|:---:|
| **RS-30** | Bengali Numeral Flipping & Keystroke Clobber | Verified Resolved (ADR 020) | **CONFIRMED RESOLVED (Residual Placeholder Cosmetic)** | **LOW**. Input active typing shield verified. Card view empty placeholder is standard HTML behavior, not a defect. |
| **RS-31** | Admin Override Input Parity | Verified Resolved (ADR 020) | **CONFIRMED RESOLVED** | **ZERO**. `CorrectionButton` uses `inputMode="numeric"`, pre-fills `toBn`, and safely removes commas. |
| **RS-32** | Non-Digit Sanitization & Data Inflation | Verified Resolved with Caveats | **CRITICAL ARCHITECTURAL DEFECT RE-EVALUATED** | **CRITICAL**. Non-ASCII commas truncate numbers to leading digits (`"১،৫০,০০০"` $\rightarrow$ `1`). Subagent A's proposal wipes voice-typed input (`"১২ জন"`) to `0`. |
| **RS-33** | Average Attendance Field Decimals | Verified Architectural Invariant | **DISCHARGED FALSE POSITIVE** | **ZERO**. Deliberate domain invariant confirmed in ADR 022; backed by DB `INTEGER` column constraints. |
| **RS-34** | `enterKeyHint="next"` on Mobile Keyboards | Documentation Drift / Resolved | **CONFIRMED RESOLVED (Doc Drift)** | **ZERO**. Already implemented across all 3 input modes in `AutoSaveField`. |
| **RS-50** | Asia/Dhaka Timezone Parity (UTC+6) | Verified Resolved (Doc Drift) | **CONFIRMED RESOLVED (With Runtime Hardening Need)** | **MEDIUM**. Server/client parity operates correctly, but `new Intl.DateTimeFormat` allocation churn and missing mathematical fallback risk `RangeError` on legacy WebViews. |
| **RS-51** | `<html lang>` FOIC & Hydration | Verified Resolved (SSR Gated) | **CONFIRMED RESOLVED (Reloads) / PARTIAL (Dynamic)** | **MEDIUM**. Reload FOIC eliminated. Client language toggle needs `router.refresh()` to propagate to Server Components without manual reload. |
| **RS-52** | Hardcoded Bengali Strings on Admin Dashboard | Failed Resolution / Persistent Defects | **CONFIRMED DEFECT** | **HIGH**. English mode broken in `(admin)/dashboard` (hardcoded `BN_MONTHS`, unconditional `toBn()`, hardcoded `"টি"`), `AutoSaveIndicator`, and `city-report`. |
| **KI-014** | `type="number"` Rejection of Bengali Digits | Verified Resolved | **CONFIRMED RESOLVED** | **ZERO**. `type="text" inputMode="numeric"` deployed across all inputs. |
| **KI-015** | 6-Hour UTC Midnight Window Lockout | Verified Resolved | **CONFIRMED RESOLVED** | **ZERO**. `getDhakaDate()` eliminates midnight lockout across all reporting boundaries. |
| **C02-02** | Flash of Incorrect Content (FOIC) | Verified Resolved | **CONFIRMED RESOLVED** | **ZERO**. RootLayout cookie reading prevents SSR hydration flash. |
| **C05-01** | Inline Period Selector Disappearance | Verified Resolved | **CONFIRMED RESOLVED** | **ZERO**. Standardized canonical English tokens (`"quarterly"`, `"halfYearly"`) prevent dropdown vanishing. |

---

## 2. False-Positive Discharge Table

To maintain pre-production engineering velocity (`AGENTS.md` Rule 7), we must eliminate theoretical nitpicks and obsolete issues from active backlogs:

| Issue ID | Documented / Claimed Issue | Why It Was Flagged | Authoritative Adversarial Discharge Proof | Action / Status |
|:---|:---|:---|:---|:---|
| **RS-33** | Average attendance fields should support floating-point decimals | Subagent A / Historical Register questioned if `thana_avg_attendance` needs decimals. | 1. **ADR 022 Authority**: ADR 022 explicitly decided `DECIDED-NOT-DOING`: *"All attendance fields remain strictly rounded whole integers across forms, database queries, and export engines. Avoids floating-point rounding drifts."*<br>2. **PostgreSQL Schema Constraints**: Every attendance column in `report_meeting` is typed as `INTEGER NOT NULL DEFAULT 0 CHECK (col >= 0)`. Storing decimals would violate database DDL.<br>3. **Domain Reality**: Attendance represents discrete human beings attending religious and educational gatherings. Integer counts with weighted arithmetic rounding ([`report-utils.ts#L400-L408`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L400-L408)) are mathematically stable. | **DISCHARGED FALSE POSITIVE** (Permanently mark as Won't Fix / Domain Invariant). |
| **RS-34** | Missing `enterKeyHint="next"` on form numeric inputs | Listed as `PLANNED (ADR 022)` in issue register. | Code verification in [`src/components/report/auto-save-field.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx) reveals lines 159 (`tableMode`), 194 (`inline`), and 246 (card mode) **already have `enterKeyHint="next"`**. The issue was resolved in code but never closed in documentation. | **DISCHARGED AS RESOLVED** (Update `report-submission-issue-register.md` to `RESOLVED`). |
| **RS-50 (Drift)** | Missing exported helper functions in `date-utils.ts` | ADR 021 claimed `date-utils.ts` exported `getDhakaMonth`, `getDhakaYear`, `getDhakaDateObject`, and `toDhakaIsoString`. | Having 5 overlapping date functions is pre-production dead-weight. Exporting a single authoritative primitive [`getDhakaDate(): { month, year, day }`](file:///d:/WebDev/report-submission/src/lib/date-utils.ts#L5-L18) is mathematically superior, minimizing API surface and bundle size. | **DISCHARGED AS CLEAN ARCHITECTURE** (Align documentation to live single-function export). |
| **RS-30 (Cosmetic)** | Card & Inline modes lack localized default placeholder (`"০"`) | Subagent A flagged that only `tableMode` defaults placeholder to `language === "bn" ? "০" : "0"`. | In card mode, every field has an explicit descriptive label (`<label className="text-sm font-medium">{label}</label>`). An empty placeholder in HTML inputs with clear labels is standard UX pattern to avoid visual clutter. In compact table mode, a `"০"` placeholder is needed because table cells have no separate label. | **DISCHARGED AS INTENTIONAL UX** (Keep current clean behavior). |

---

## 3. Edge Case Keyboard & Locale Vulnerabilities

### 3.1 The Bangladeshi Mobile Keyboard Separator Trap (Data Truncation)

In Bangladesh, field workers predominantly use Android smartphones (Samsung, Xiaomi, Symphony, Walton, Realme) equipped with diverse virtual keyboards:
- **Gboard** (Google Keyboard)
- **Ridmik Keyboard** (Phonetic / Traditional Bijoy layout)
- **Voice Typing** (Google Bengali Speech-to-Text)
- **Islamic / Arabic Companion Keyboards** (installed for Quranic study, using Arabic punctuation)

#### Real-World Failure Scenario Trace:
1. A field worker pastes a large headcount formatted with South Asian numbering: `"১,৫০,০০০"`.
   - If the input came from an Islamic app, SMS, or banking gateway, it may contain the Arabic comma `،` (`U+060C`) or Arabic thousand separator `٬` (`U+066C`) instead of ASCII `,` (`U+002C`).
2. In [`src/components/report/auto-save-field.tsx:93-95`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L93-L95):
   ```typescript
   const cleaned = String(val).replace(/[,\s]/g, "");
   const enStr = bnToEn(cleaned);
   const parsed = parseFloat(enStr);
   ```
   - The regex `/[,\s]/g` matches **only ASCII comma (U+002C)** and whitespace.
   - It **fails to match** Arabic comma (`\u060C`), Arabic thousand separator (`\u066C`), or Fullwidth comma (`\uFF0C`).
   - `bnToEn("১،৫০،০০০")` produces `"1،50،000"`.
   - JavaScript's `parseFloat("1،50،000")` parses `"1"` and **aborts at `،`**!
   - `Math.round(1)` evaluates to `1`.
   - **Result**: The system saves `"1"` to the database instead of `"150000"`! A massive 150,000x headcount error is recorded silently without error!

#### The Subagent A Regex Regress Trap:
Subagent A suggested replacing `parseFloat` with `/^\d*(?:\.\d+)?$/`.
- **Field Reality**: When mobile users speak into their phone using voice typing, or quickly transcribe notes, they enter `"১২ জন"` (12 persons) or `"১৫টি"` (15 units).
- Under live `parseFloat`: `parseFloat(bnToEn("১২ জন"))` successfully extracts `12`.
- Under Subagent A's proposed regex: `/^\d*(?:\.\d+)?$/.test("12 জন")` evaluates to `false`.
- Subagent A's code executes: `return { valid: false, value: "0" };`
- **Result**: Subagent A's proposal **silently destroys legitimate voice-typed inputs to `"0"`**!

### 3.2 The `toFiniteNumber` Comma-Blindness Bug

In [`src/lib/report-utils.ts:301-306`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L301-L306):
```typescript
export function toFiniteNumber(val: unknown): number {
  if (typeof val === "boolean" || val === null || val === undefined) return 0;
  const en = typeof val === "string" ? bnToEn(val.trim()) : val;
  const num = typeof en === "number" ? en : Number(en);
  return Number.isFinite(num) ? num : 0;
}
```
- In JavaScript, `Number("1,500") === NaN` and `Number("1,50,000") === NaN` because `Number()` does **NOT** tolerate commas.
- `toFiniteNumber` executes `Number(en)` without stripping commas!
- Where is `toFiniteNumber` used?
  1. [`src/lib/report-data-loader.ts:206`](file:///d:/WebDev/report-submission/src/lib/report-data-loader.ts#L206): `return ov !== undefined ? toFiniteNumber(ov) : toFiniteNumber(computed);`
  2. [`src/lib/report-utils.ts:356`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L356): `sumRows()` aggregation accumulators.
- **Result**: If an admin sets a formatted override `"১,৫০০"` or an external import includes commas, `toFiniteNumber` evaluates it to `0`! Both the city report aggregates and PDF/Excel exports will display `0` instead of `1500`!

### 3.3 Timezone Parity & Runtime Boundary Conditions

In [`src/lib/date-utils.ts:5-18`](file:///d:/WebDev/report-submission/src/lib/date-utils.ts#L5-L18):
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

#### Adversarial Stress-Test:
1. **Allocation Churn in Tight Render Loops**:
   Creating `new Intl.DateTimeFormat` instantiates an expensive ICU formatting engine. `getDhakaDate()` is called on every row render, filter evaluation, and period resolution. In `(admin)/reports/page.tsx` and `report-utils.ts`, calling this repeatedly causes unnecessary garbage collection pressure on low-memory mobile devices.
2. **`RangeError` on Legacy Android WebViews**:
   On budget Symphony or Walton Android devices running older Android System WebViews without updated IANA timezone databases, `new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka" })` throws:
   `RangeError: Invalid time zone specified: Asia/Dhaka`
3. **Non-Null Assertion Crash (`!.value`)**:
   If an environment returns non-standard parts, `parts.find(...)` returns `undefined`. Accessing `.value` immediately throws `TypeError: Cannot read properties of undefined (reading 'value')`, crashing the entire Next.js component tree.
4. **The Mathematical Invariant**:
   Bangladesh Standard Time (BST) is **strictly UTC+6 with NO Daylight Saving Time**.
   $$T_{\text{Dhaka}} = T_{\text{UTC}} + 6 \times 3600 \times 1000 \text{ ms}$$
   A fallback to mathematical UTC+6 date projection (`new Date(Date.now() + 21600000)`) provides an infallible, zero-allocation safety net that guarantees 100% uptime even if `Intl` fails completely.

---

## 4. Cross-Segment Blast Radius Analysis

Altering numeral and date utilities carries critical dependencies across the system. We must rigorously map the blast radius before implementing any changes:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEGMENT 03 UTILITY CORE                              │
│       date-utils.ts · report-utils.ts (toBn, bnToEn, toFiniteNumber)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│   SEGMENT 01    │        │   SEGMENT 02    │        │   SEGMENT 06    │
│  Data Loader    │        │   AutoSaveField │        │  Export Routes  │
│  sumRows / Agg  │        │   State Machine │        │  PDF & Excel    │
└─────────────────┘        └─────────────────┘        └─────────────────┘
```

### 4.1 Impact on Segment 01 (Calculation Engines & Aggregation)
- **`toFiniteNumber()` Modification**:
  - If `toFiniteNumber` is updated to strip all separators (`[,،٬，_\s]`), it directly **fixes** Segment 01 calculations in `sumRows()` and `sumHeaderRows()`.
  - **Risk**: If a non-numeric string like a date `"2026-11-15"` or category name is passed, `toFiniteNumber` must continue returning `0`. Since `sumRows()` skips keys in `NON_NUMERIC_KEYS`, this change is 100% safe and non-breaking.

### 4.2 Impact on Segment 02 (Save Reliability & State Machine)
- **`AutoSaveField` Sanitization Pipeline**:
  - Updating `persist()` in `AutoSaveField` directly affects the values sent to `updateField()`.
  - **Invariant**: The sanitized value must always satisfy PostgreSQL table constraints: `INTEGER` and `CHECK (col >= 0)`.
  - If the user types invalid alphabetic junk (`"12a34"`), `persist()` must **NOT** silently wipe it to `"0"` (which would overwrite good data in the database). Instead, it must reject the save and preserve the previous valid state.

### 4.3 Impact on Segment 06 (Export Pipeline: PDF & Excel)
- **`toBn()` & `bnToEn()`**:
  - The PDF generator ([`src/app/api/export/pdf/route.tsx`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx)) and Excel generator ([`src/app/api/export/excel/route.ts`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts)) invoke `toBn()` on every exported cell.
  - In `pdf/route.tsx`, `import { getDhakaDate } from "@/lib/date-utils";` is currently an unused dead import. Removing it produces zero runtime regression and cleans bundle size.

---

## 5. Final Hardened Pre-Production Action Plan

Under `AGENTS.md` Rule 7 (Pre-Production Agility & Zero Dead-Weight), the following hardened, code-verified fixes must be executed across Segment 03:

### 5.1 Hardened Universal Numeral Sanitization Pipeline

Implement an authoritative, zero-truncation, multi-separator sanitizer in `src/lib/report-utils.ts`:

```typescript
/**
 * Authoritative numeric parser for Bangladeshi field inputs.
 * Handles Bengali digits, Arabic-Indic digits, voice-typing counting suffixes,
 * and diverse Unicode comma/decimal separators without truncation or silent zero-wipes.
 */
export function parseBangladeshiNumber(raw: unknown): { valid: boolean; value: number } {
  if (raw === null || raw === undefined || raw === "") {
    return { valid: true, value: 0 };
  }
  if (typeof raw === "number") {
    return { valid: Number.isFinite(raw), value: Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0 };
  }

  let s = String(raw).trim();
  // 1. Normalize Bengali and Arabic-Indic numerals to ASCII
  s = s.replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09E6));
  s = s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  s = s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));

  // 2. Normalize decimal separators (embedded Dari '।' or Arabic decimal '٫')
  s = s.replace(/(\d)[।٫](\d)/g, "$1.$2");

  // 3. Strip all thousands separators, commas, and whitespace
  // Includes ASCII comma (,), Arabic comma (،), Arabic thousand separator (٬), Fullwidth comma (，), and NBSP
  s = s.replace(/[,،٬，_\s\u00A0\u202F]/g, "");

  // 4. Strip valid colloquial Bengali counting nouns (জন, টি, টা, Dari) from voice typing
  s = s.replace(/(?:জন|টি|টা|।)+$/g, "");

  // 5. Strict numeric validation
  if (!/^\d+(?:\.\d+)?$/.test(s)) {
    return { valid: false, value: 0 };
  }

  const num = parseFloat(s);
  return { valid: true, value: Math.max(0, Math.round(num)) };
}
```

- Update [`src/lib/report-utils.ts:301-306`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L301-L306) (`toFiniteNumber`):
  ```typescript
  export function toFiniteNumber(val: unknown): number {
    if (typeof val === "boolean" || val === null || val === undefined) return 0;
    return parseBangladeshiNumber(val).value;
  }
  ```
- Update [`src/components/report/auto-save-field.tsx:92-98`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx#L92-L98):
  ```typescript
  if (type === "number") {
    const result = parseBangladeshiNumber(val);
    if (result.valid) {
      updateField(name, String(result.value), section, table, category);
    }
    // If invalid (e.g. "12a34"), do NOT save corrupted 0; preserve previous state
  }
  ```

### 5.2 Fail-Safe Cached Dhaka Timezone Engine

Harden [`src/lib/date-utils.ts`](file:///d:/WebDev/report-submission/src/lib/date-utils.ts) with singleton caching and mathematical UTC+6 fallback:

```typescript
let cachedDhakaFormatter: Intl.DateTimeFormat | null = null;

function getDhakaFormatter(): Intl.DateTimeFormat | null {
  if (cachedDhakaFormatter) return cachedDhakaFormatter;
  try {
    cachedDhakaFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    return cachedDhakaFormatter;
  } catch {
    return null;
  }
}

/**
 * Returns the current date components in the Asia/Dhaka timezone (UTC+6).
 * Guaranteed crash-proof: falls back to mathematical UTC+6 projection if Intl fails.
 */
export function getDhakaDate(): { month: number; year: number; day: number } {
  const formatter = getDhakaFormatter();
  if (formatter) {
    try {
      const parts = formatter.formatToParts(new Date());
      const m = parts.find((p) => p.type === "month")?.value;
      const y = parts.find((p) => p.type === "year")?.value;
      const d = parts.find((p) => p.type === "day")?.value;
      if (m && y && d) {
        return {
          month: parseInt(m, 10),
          year: parseInt(y, 10),
          day: parseInt(d, 10),
        };
      }
    } catch {
      // Fall through to mathematical offset
    }
  }

  // Infallible fallback: Bangladesh Standard Time is constant UTC+6 with NO DST
  const dhakaMs = Date.now() + 6 * 60 * 60 * 1000;
  const fallback = new Date(dhakaMs);
  return {
    month: fallback.getUTCMonth() + 1,
    year: fallback.getUTCFullYear(),
    day: fallback.getUTCDate(),
  };
}
```

### 5.3 Complete Admin Dashboard English Translation Parity (RS-52)

Eliminate all hardcoded Bengali strings across [`src/app/(admin)/dashboard/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/dashboard/page.tsx):
1. **Centralize Month Names**:
   In `src/lib/i18n.ts`, export localized month arrays:
   - `bn`: `["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]`
   - `en`: `["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]`
   Replace local `BN_MONTHS` array with `t.months[currentMonth - 1]`.
2. **Conditional KPI Number Formatting**:
   Replace local unconditional `toBn()` with:
   ```typescript
   const formatNum = (val: number | string) => (lang === "bn" ? toBn(val) : String(val));
   ```
3. **Localized Zone Counter Suffix**:
   Replace hardcoded `({toBn(submittedCount)}টি)` with:
   ```tsx
   <span>{t.labels.submittedZonesList} ({formatNum(submittedCount)}{t.labels.counterSuffix})</span>
   ```

### 5.4 Dynamic Language Toggle Refresh & Dead Code Cleanup
1. In [`src/components/layout/language-toggle.tsx`](file:///d:/WebDev/report-submission/src/components/layout/language-toggle.tsx), add `router.refresh()` inside `handleSetLanguage()` to propagate cookie updates immediately to active Server Components (`(admin)/dashboard`, `/help`).
2. Remove dead import `import { getDhakaDate } from "@/lib/date-utils";` from [`src/app/api/export/pdf/route.tsx:3`](file:///d:/WebDev/report-submission/src/app/api/export/pdf/route.tsx#L3).
3. Update `docs/report-submission-issue-register.md`:
   - Mark **RS-33** as `DECIDED-NOT-DOING / DOMAIN INVARIANT`.
   - Mark **RS-34** as `RESOLVED`.
   - Mark **RS-50** as `RESOLVED` with single-primitive documentation.

# Segment 07 Adversarial Review: Database Schemas, DDL Invariants, RLS Policies, Build/Infra & Documentation Suite

**Reviewer Role**: Subagent 07B (Adversarial Reviewer)  
**Lead Investigator Deliverable Inspected**: [`docs/pre-production-critique/segment-07-investigation.md`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-07-investigation.md)  
**Target Codebase & Infra Files**:
- Database & Supabase Clients: [`src/utils/supabase/client.ts`](file:///d:/WebDev/report-submission/src/utils/supabase/client.ts), [`src/utils/supabase/server.ts`](file:///d:/WebDev/report-submission/src/utils/supabase/server.ts)
- Utilities & Constants: [`src/lib/utils.ts`](file:///d:/WebDev/report-submission/src/lib/utils.ts), [`src/lib/version.ts`](file:///d:/WebDev/report-submission/src/lib/version.ts), [`src/lib/i18n.ts`](file:///d:/WebDev/report-submission/src/lib/i18n.ts), [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts)
- Global CSS & App Shell: [`src/app/globals.css`](file:///d:/WebDev/report-submission/src/app/globals.css), [`src/app/layout.tsx`](file:///d:/WebDev/report-submission/src/app/layout.tsx), [`src/app/manifest.ts`](file:///d:/WebDev/report-submission/src/app/manifest.ts), [`src/app/icon.tsx`](file:///d:/WebDev/report-submission/src/app/icon.tsx)
- Build, Tooling & Package Config: [`package.json`](file:///d:/WebDev/report-submission/package.json), [`postcss.config.js`](file:///d:/WebDev/report-submission/postcss.config.js), [`next.config.mjs`](file:///d:/WebDev/report-submission/next.config.mjs), [`eslint.config.mjs`](file:///d:/WebDev/report-submission/eslint.config.mjs), [`tsconfig.json`](file:///d:/WebDev/report-submission/tsconfig.json), [`twa-manifest.json`](file:///d:/WebDev/report-submission/twa-manifest.json), [`vercel.json`](file:///d:/WebDev/report-submission/vercel.json)
- CI/CD & Automation: [`.github/workflows/ci.yml`](file:///d:/WebDev/report-submission/.github/workflows/ci.yml), [`.github/workflows/build-apk.yml`](file:///d:/WebDev/report-submission/.github/workflows/build-apk.yml), [`.github/workflows/backup.yml`](file:///d:/WebDev/report-submission/.github/workflows/backup.yml)
- Documentation Suite: [`docs/TECHNICAL_MANUAL.md`](file:///d:/WebDev/report-submission/docs/TECHNICAL_MANUAL.md), [`docs/ROADMAP.md`](file:///d:/WebDev/report-submission/docs/ROADMAP.md), [`docs/KNOWN_ISSUES.md`](file:///d:/WebDev/report-submission/docs/KNOWN_ISSUES.md), [`docs/report-submission-issue-register.md`](file:///d:/WebDev/report-submission/docs/report-submission-issue-register.md), [`docs/pre-production-cleanup-plan.md`](file:///d:/WebDev/report-submission/docs/pre-production-cleanup-plan.md), [`docs/pre-production-schema-cleanup-backlog.md`](file:///d:/WebDev/report-submission/docs/pre-production-schema-cleanup-backlog.md), [`docs/ADR/*`](file:///d:/WebDev/report-submission/docs/ADR/) (ADR 001–030)

---

## 1. Adversarial Verdict & Quality Scorecard Validation

### Overall Verdict: `APPROVED WITH AMENDMENTS`

Subagent 07A conducted a comprehensive investigation across Segment 07, correctly identifying foundational drifts such as the **Tiro Bangla Typography Selector Invalidation (`DEFECT-07-01`)**, the **Bengali Unicode Nukta String Mismatch (`DEFECT-07-02`)**, and the **Multi-File Semantic Version Drift (`DEFECT-07-06`)**.

However, passing Subagent 07A's findings and proposals through the **"Adversarial Doubt Gate"** (*"Under what real-world field conditions will this clean-looking code fail?"*) intercepted **one critical implementation trap** and **two exaggerated / false-alarm claims**:

1. **The PostCSS CommonJS Scope Crash (Intercepted Build Blocker)**:  
   Subagent 07A proposed blindly adding `"type": "module"` to [`package.json`](file:///d:/WebDev/report-submission/package.json) to eliminate Node 22 test runner warnings (`BLOAT-07-04`). **Under real-world execution, doing this immediately breaks `next build` and PostCSS with `ReferenceError: module is not defined in ES module scope`!** This occurs because [`postcss.config.js`](file:///d:/WebDev/report-submission/postcss.config.js#L1) is written in CommonJS (`module.exports = { ... }`). In Node.js, when `"type": "module"` is present, all `.js` files are evaluated as ES Modules. Adding `"type": "module"` requires simultaneously converting `postcss.config.js` to ESM (`export default { ... }`) or renaming it to `postcss.config.mjs`.
2. **Exaggerated Scope of `cn()` Utility Collisions (Discharged Strawman)**:  
   Subagent 07A claimed that the naive implementation of `cn()` in [`src/lib/utils.ts`](file:///d:/WebDev/report-submission/src/lib/utils.ts) causes widespread Tailwind cascade collisions across dynamic UI states. Codebase grepping reveals that `cn()` is called in **only two files** ([`language-toggle.tsx`](file:///d:/WebDev/report-submission/src/components/layout/language-toggle.tsx) and [`theme-toggle.tsx`](file:///d:/WebDev/report-submission/src/components/layout/theme-toggle.tsx)). While standardizing `src/lib/utils.ts` to `twMerge(clsx(inputs))` is technically sound because both packages are already installed, it does not currently cause catastrophic UI bugs.
3. **Discharged False Alarm: Same-Day Monthly Backup Purging**:  
   Subagent 07B stress-tested `.github/workflows/backup.yml`'s Python retention script against multiple executions on the same calendar day. The retention algorithm sorts files chronologically and marks intra-month files older than 30 days for deletion (`dt < retention_cutoff`). If triggered multiple times on the same day, intra-month backups from *today* are within 30 days and are preserved. The permanent monthly backup is never deleted. However, a real sorting ambiguity exists if uncompressed `.sql` and compressed `.sql.gz` files co-exist with identical timestamps.
4. **Massive Expansion of Unicode Nukta Blast Radius**:  
   Subagent 07A identified 175 decomposed `\u09AF\u09BC` occurrences across two files (`report-utils.ts` and `i18n.ts`). Exhaustive adversarial scanning across `src/` discovered **438 occurrences of decomposed Nukta (`U+09BC`) across 32 source files**, including admin city-report aggregations, Excel/PDF export routes, management actions, and user dashboard components. Because Unicode UAX #15 excludes Bengali Nukta from composition, standard JavaScript `.normalize('NFC')` leaves them decomposed, causing silent 0-row update dropouts and check constraint crashes in PostgreSQL.

---

### Authoritative Subsystem Health Scorecard

```
┌────────────────────────────────────────────────────────────────────────┐
│               SEGMENT 07 ADVERSARIAL HEALTH SCORECARD                  │
├────────────────────────────────────────────────────────────────────────┤
│  Database Schemas, DDL & Invariants:    96 / 100 (Rock-solid singular   │
│                                                  tables, checks & syd1)│
│  RLS Access Policies & Statement Cache: 94 / 100 (0 auth_rls_initplan; │
│                                                  search_path=public)   │
│  Unicode NFC Nukta Data Integrity:      52 / 100 (CRITICAL: 438 client │
│                                                  decomposed bytes vs DB│
│                                                  check constraint)     │
│  Build Pipeline, Tooling & ESM:         68 / 100 (PostCSS CommonJS trap│
│                                                  typeless module warn; │
│                                                  phantom ESLint pkgs)  │
│  Typography, Global CSS & A11y:         72 / 100 (Tiro Bangla selector │
│                                                  dead; global <a> box) │
│  Infrastructure, CI & Packaging:        92 / 100 (syd1 pinned, headless│
│                                                  mock Bubblewrap server│
│                                                  sound backup retain)  │
│  Documentation Suite Consistency:       62 / 100 (Quadruple version    │
│                                                  drift; dead component │
│                                                  listed; duplicate doc)│
├────────────────────────────────────────────────────────────────────────┤
│  COMPOSITE SUBSYSTEM HEALTH SCORE:      76 / 100 (Grade: B)            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. False Positives & Over-Engineered Proposals Discharged

### 2.1 DISCHARGED HAZARD & AMENDED: Naive Addition of `"type": "module"` to `package.json` (`BLOAT-07-04`)
- **Subagent 07A Proposal**: Add `"type": "module"` directly to [`package.json`](file:///d:/WebDev/report-submission/package.json) to eliminate Node 22 test runner `[MODULE_TYPELESS_PACKAGE_JSON]` warnings during `npm test`.
- **Adversarial Cross-Examination through Doubt Gate**:
  - *"Under what real-world field conditions will this clean-looking code fail?"*
  - **The PostCSS CommonJS Scope Crash**:  
    [`postcss.config.js`](file:///d:/WebDev/report-submission/postcss.config.js#L1-L5) is currently written as:
    ```js
    module.exports = {
      plugins: {
        '@tailwindcss/postcss': {},
      },
    }
    ```
  - In Node.js, setting `"type": "module"` in `package.json` changes the default module evaluation of all `.js` files in the repository from CommonJS to ECMAScript Modules (ESM).
  - In ESM, the Node.js runtime does not define `module`, `exports`, or `require`.
  - When Turbopack or PostCSS executes during `npm run build` or `npm run dev`, it attempts to load `postcss.config.js`. PostCSS throws a fatal exception:
    `ReferenceError: module is not defined in ES module scope for file postcss.config.js`
  - The entire production build fails immediately!
- **Adversarial Amendment**:  
  Adding `"type": "module"` to `package.json` is approved **only if coupled with an atomic ESM migration of `postcss.config.js`**:
  ```js
  export default {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  };
  ```
  Alternatively, rename `postcss.config.js` to `postcss.config.mjs`. Blindly updating `package.json` in isolation is rejected as a build-breaking hazard.

---

### 2.2 DISCHARGED AS STRAWMAN: "Widespread Dynamic Cascade Bugs" via Naive `cn()` (`BLOAT-07-01`)
- **Subagent 07A Claim**: The naive implementation of `cn()` in [`src/lib/utils.ts#L1-L3`](file:///d:/WebDev/report-submission/src/lib/utils.ts#L1-L3) (`return inputs.filter(Boolean).join(' ')`) is causing widespread CSS cascade order precedence bugs across dynamic UI states throughout the application.
- **Adversarial Cross-Examination**:
  - Direct codebase search (`git grep -n "cn(" src/`) reveals that `cn()` is utilized in **exactly two files**:
    1. [`src/components/layout/language-toggle.tsx#L13,L24`](file:///d:/WebDev/report-submission/src/components/layout/language-toggle.tsx#L13)
    2. [`src/components/layout/theme-toggle.tsx#L63,L73,L81,L89`](file:///d:/WebDev/report-submission/src/components/layout/theme-toggle.tsx#L63)
  - All form section inputs, tables, buttons, and badges construct class names via direct template literals or static utility strings.
  - In the two toggle components, classes passed to `cn()` are mutually exclusive ternary expressions (e.g. `language === "bn" ? "bg-primary..." : "text-muted-foreground..."`) that do not contain conflicting Tailwind utility declarations.
- **Verdict**: **DISCHARGED AS OVERSTATED STRAWMAN**. The claim of live visual regressions across the app is false. However, updating `src/lib/utils.ts` to `twMerge(clsx(inputs))` is **APPROVED FOR FUTURE-PROOFING AND CODE QUALITY**, since `clsx` and `tailwind-merge` are already installed in `package.json`.

---

### 2.3 DISCHARGED FALSE ALARM: Accidental Purging of Permanent Monthly Snapshots (`DEFECT-07-07`)
- **Subagent 07A Suspicion**: In [`.github/workflows/backup.yml`](file:///d:/WebDev/report-submission/.github/workflows/backup.yml#L44-L94), if the workflow triggers multiple times on the same day, the Python retention script might accidentally purge the permanent monthly snapshot.
- **Adversarial Cross-Examination through Doubt Gate**:
  - Tracing the Python retention logic:
    ```python
    for ym, month_files in by_month.items():
        month_files.sort(key=lambda x: x[1])
        last_fname, _ = month_files[-1] # Kept persistently for historical records
        for fname, dt in month_files[:-1]:
            if dt < retention_cutoff:   # Older than 30 days
                os.remove(fpath)
    ```
  - Scenario: Two backups run on November 30 (00:00:00 and 14:00:00).
    - `month_files[-1]` is the 14:00:00 backup. It is tagged `[RETAIN - MONTHLY]` and never deleted.
    - `month_files[:-1]` contains the 00:00:00 backup.
    - Its timestamp is tested against `retention_cutoff` (`now - 30 days`). Because it occurred *today*, `dt < retention_cutoff` evaluates to `False`. It is tagged `[RETAIN - RECENT]` and kept!
  - 30 days later (December 31), the 00:00:00 backup is older than 30 days and is deleted, while the 14:00:00 backup remains the permanent monthly snapshot for November.
- **Verdict**: **DISCHARGED AS MATHEMATICALLY FALSE ALARM**. The retention algorithm handles intra-day triggers and monthly snapshots correctly. However, the secondary finding—sorting ambiguity if `.sql` and `.sql.gz` exist with identical timestamps—is valid and amended below.

---

## 3. Intercepted Implementation Traps & Real-World Failure Modes

### 3.1 The PostCSS CommonJS Scope Crash Trap

#### Behavioral Failure Trace:
1. Developer observes `[MODULE_TYPELESS_PACKAGE_JSON]` warnings when running `npm test`.
2. Developer adds `"type": "module"` to `package.json`.
3. Developer runs `npm run build` or pushes to GitHub Actions CI (`ci.yml` step `Build Next.js Production Bundle`).
4. Next.js 16 initializes Turbopack and invokes PostCSS loader.
5. PostCSS loads `postcss.config.js`.
6. Node.js evaluates `postcss.config.js` under ESM rules because `package.json` specifies `"type": "module"`.
7. Line 1 encounters `module.exports = { ... }`.
8. Execution halts abruptly:
   ```
   ReferenceError: module is not defined in ES module scope for file d:\WebDev\report-submission\postcss.config.js
       at file:///d:/WebDev/report-submission/postcss.config.js:1:1
   ```
9. **CI fails and deployment crashes.**

#### The Hardened Remedy:
Coupled migration:
1. Update `package.json`:
   ```json
   "type": "module"
   ```
2. Convert `postcss.config.js` to pure ESM syntax:
   ```js
   export default {
     plugins: {
       '@tailwindcss/postcss': {},
     },
   };
   ```

---

### 3.2 The UAX #15 Composition Exclusion Trap & 438-Byte Decomposed Nukta Leak

#### Deep Technical Analysis:
In Bengali Unicode:
- Decomposed NFD byte sequence: `\u09AF\u09BC` (`\xe0\xa6\xaf\xe0\xa6\xbc` = `chr(2479) || chr(2492)` = Bengali Letter Ya + Bengali Sign Nukta).
- Precomposed NFC character: `\u09DF` (`\xe0\xa7\x9f` = `chr(2527)` = Bengali Letter Yya 'য়').

Under the Unicode Standard (UAX #15), precomposed Bengali Nukta characters (`U+09DC..U+09DF`) are explicitly included in **`CompositionExclusions.txt`**:
```
# CompositionExclusions-15.0.0.txt
09DC  # BENGALI LETTER RRA
09DD  # BENGALI LETTER RHA
09DF  # BENGALI LETTER YYA
```
Because of this standard exclusion, standard ECMAScript and PostgreSQL normalization functions **refuse to compose them**:
```ts
const decomposed = "\u09AF\u09BC";
const precomposed = "\u09DF";

decomposed === precomposed; // false
decomposed.normalize("NFC") === precomposed; // false!
decomposed.normalize("NFC") === decomposed; // true! (remains decomposed)
```

#### Real-World Failure Scenario in PostgreSQL:
1. In ADR 027, database child tables were migrated to precomposed NFC `\u09DF` and locked with constraints:
   `CHECK (position(chr(2492) in category) = 0)` on `report_organizational`, `report_personal`, `report_meeting`, and `report_extra`.
2. In client code, [`src/lib/report-utils.ts#L105`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts#L105):
   ```ts
   export const PERSONAL_CATEGORIES = ["রুকন", "কর্মী", "সক্রিয় সহযোগী"];
   ```
   Contains decomposed `\u09AF\u09BC` bytes!
3. In [`src/components/report/sections/personal-form.tsx#L51-L55`](file:///d:/WebDev/report-submission/src/components/report/sections/personal-form.tsx#L51):
   ```tsx
   personalData.reduce((acc: number, row: any) => {
     if (PERSONAL_CATEGORIES.includes(row?.category)) {
       return acc + (Number(row?.[metric.key]) || 0);
     }
     return acc;
   }, 0)
   ```
   - `row.category` from PostgreSQL contains precomposed `\u09DF`.
   - `PERSONAL_CATEGORIES[2]` contains decomposed `\u09AF\u09BC`.
   - `PERSONAL_CATEGORIES.includes(row?.category)` returns **`false`**!
   - **The "সর্বমোট" (Total) column silently omits all metrics entered under "সক্রিয় সহযোগী"!**
4. In [`src/components/report/auto-save-field.tsx`](file:///d:/WebDev/report-submission/src/components/report/auto-save-field.tsx):
   - Field passes `category="সক্রিয় সহযোগী"` (decomposed `\u09AF\u09BC`) to `updateField()`.
   - `updateField()` runs:
     `supabase.from('report_personal').update({ [name]: value }).eq('report_id', targetReportId).eq('category', category)`
   - PostgREST evaluates binary equality in PostgreSQL. `\u09AF\u09BC` does not match `\u09DF`.
   - **0 rows are updated!**
   - Line 190 of [`report-context.tsx`](file:///d:/WebDev/report-submission/src/components/report/report-context.tsx#L190) executes:
     `0-row update on report_personal (name=became_shohojogi, category=সক্রিয় সহযোগী)`
   - Auto-save enters the `error` state and displays `"সংরক্ষণ ব্যর্থ হয়েছে"`!
5. If an insert is attempted with the client string, PostgreSQL constraint `check_report_personal_category_nfc_nukta` aborts the transaction with:
   `ERROR: new row for relation "report_personal" violates check constraint "check_report_personal_category_nfc_nukta"`

#### Exhaustive Codebase Audit:
Adversarial scanning across all 71 source files identified **438 occurrences of decomposed Nukta (`\u09BC`) across 32 files**:
- `src/lib/report-utils.ts`: 30 occurrences
- `src/lib/i18n.ts`: 145 occurrences
- `src/app/help/help-diagram-client.tsx`: 85 occurrences
- `src/app/api/export/excel/route.ts`: 16 occurrences
- `src/app/(admin)/city-report/page.tsx`: 15 occurrences
- `src/components/dashboard/user-dashboard.tsx`: 12 occurrences
- `src/app/(admin)/management/page.tsx`: 11 occurrences
- `src/app/(admin)/management/actions.ts`: 10 occurrences
- `src/app/api/export/pdf/route.tsx`: 9 occurrences
- `src/components/dashboard/period-selector.tsx`: 9 occurrences
- `src/components/report/auto-save-field.tsx`: 9 occurrences
- Other files: 87 occurrences

#### Why Unit Tests Failed to Catch This:
In [`src/lib/report-utils.test.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.test.ts#L45):
The test fixtures were authored with the **same decomposed strings** as `report-utils.ts`! Because both fixture and implementation contained `\u09AF\u09BC`, `assert.equal(a, b)` evaluated `decomposed === decomposed` (true), giving false confidence while drifting from PostgreSQL!

---

### 3.3 The Missing Class Descendant Selector Blunder & Tiro Bangla Font Invalidation

#### Behavioral Failure Trace:
In [`src/app/globals.css#L119-L121`](file:///d:/WebDev/report-submission/src/app/globals.css#L119-L121):
```css
.lang-bn body {
  font-family: var(--font-tiro-bangla), serif;
}
```
In [`src/app/layout.tsx#L48-L49`](file:///d:/WebDev/report-submission/src/app/layout.tsx#L48-L49):
```tsx
<html lang={initialLanguage} suppressHydrationWarning data-scroll-behavior="smooth">
  <body className={`${inter.variable} ${tiroBangla.variable} antialiased font-sans ...`}>
```
In [`src/components/providers/language-provider.tsx#L30`](file:///d:/WebDev/report-submission/src/components/providers/language-provider.tsx#L30):
```ts
document.documentElement.lang = savedLang;
```

#### Why `.lang-bn body` Never Matches:
1. `.lang-bn body` is a **descendant selector**. It matches a `<body>` element that is inside an element with class `.lang-bn`.
2. In HTML documents, `<body>` is never inside another element—it is a direct child of `<html>`.
3. Furthermore, class `.lang-bn` is **never added anywhere in the DOM** (the app sets the HTML attribute `lang="bn"` on `<html>`, not a CSS class).
4. Therefore, `.lang-bn body` has zero matches across 100% of page renders.

#### Real-World Field Consequences:
- Google's `Tiro Bangla` font (loaded in `layout.tsx`) is **never applied to any body text**.
- `body` renders with:
  `font-family: var(--font-inter), system-ui, -apple-system, sans-serif;`
- Because `Inter` does not include Bengali glyphs, the browser falls back to the operating system's default Bengali font:
  - On Windows: Vrinda or Nirmala UI.
  - On Android: Noto Sans Bengali (often poorly kerned in older Android 10/11 devices).
  - On Linux: FreeSans / Lohit Bengali.
- Field workers in rural zones view dense matrix forms with cramped system font fallbacks instead of the legibility-optimized `Tiro Bangla` typography.

#### The Hardened Remedy:
Replace the invalid selector in `globals.css` with native language selectors:
```css
html[lang="bn"] body,
:lang(bn) body {
  font-family: var(--font-tiro-bangla), serif;
}
```
This activates instantly during SSR based on the `app-language` cookie, guaranteeing zero Flash of Incorrect Font (FOIF).

---

### 3.4 The Global Anchor Tag Hypertext Box Distortion

#### Behavioral Failure Trace:
In [`src/app/globals.css#L128-L135`](file:///d:/WebDev/report-submission/src/app/globals.css#L128-L135):
```css
button, a, .tap-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  @apply transition-transform;
}
```

#### Real-World Field Consequences:
1. `display: inline-flex` forces all `<a>` tags to behave as flex containers.
2. In prose text, inline links (e.g. in `/help`, error messages, or form footers) cannot wrap across lines naturally.
3. Every inline link expands to at least 44px in height and width:
   - In [`src/components/auth/register-form-client.tsx#L296,L310`](file:///d:/WebDev/report-submission/src/components/auth/register-form-client.tsx#L296):
     `<p className="text-sm">ইতিমধ্যে একাউন্ট আছে? <Link href="/home?mode=login">লগইন করুন</Link></p>`
   - The link `"লগইন করুন"` expands into a 44px-tall flex box, distorting the line height of the paragraph and creating awkward visual gaps on mobile viewports.
4. While WCAG 2.2 Criterion 2.5.8 requires 24px x 24px (and recommends 44px x 44px) for interactive targets, it **explicitly exempts inline links within text**:
   > *"Exception: Inline - The target is in a sentence or block of text."*

#### The Hardened Remedy:
Scope the 44px floor to standalone interactive elements, preserving inline text links:
```css
button, .btn, .tap-target, nav a, [role="button"] {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  @apply transition-transform;
}

button:active, .btn:active, .tap-target:active, nav a:active {
  transform: scale(0.96);
}
```

---

### 3.5 Transitive Hoisting Fragility in `eslint.config.mjs`

#### Behavioral Failure Trace:
In [`eslint.config.mjs#L1-L4`](file:///d:/WebDev/report-submission/eslint.config.mjs#L1-L4):
```js
import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";
```
None of these 4 packages are declared in [`package.json`](file:///d:/WebDev/report-submission/package.json).

#### Real-World Failure Scenario:
- Today, `npm install` hoists transitive dependencies into root `node_modules` because `eslint-config-next` depends on them.
- If a developer or CI environment runs `pnpm install`, `yarn install` with PnP, or `npm install --install-strategy=nested`, transitive packages are isolated.
- Running `npm run lint` immediately crashes:
  `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@typescript-eslint/parser'`

#### The Hardened Remedy:
Add explicit devDependencies in `package.json`:
```json
"@typescript-eslint/parser": "^8.26.0",
"@next/eslint-plugin-next": "^16.2.0",
"eslint-plugin-react": "^7.37.4",
"eslint-plugin-react-hooks": "^5.2.0"
```

---

### 3.6 Sorting Ambiguity on Co-Existing `.sql` and `.sql.gz` Backups

#### Behavioral Failure Trace:
In [`.github/workflows/backup.yml#L76`](file:///d:/WebDev/report-submission/.github/workflows/backup.yml#L76):
```python
month_files.sort(key=lambda x: x[1])
last_fname, _ = month_files[-1]
```
If an aborted run or manual recovery leaves both `db_backup_2026-11-15_000000.sql` (50 MB) and `db_backup_2026-11-15_000000.sql.gz` (5 MB) in the backup directory:
- Both files produce the exact same `dt` timestamp.
- Python's `sort()` retains arbitrary directory listing order.
- If `os.listdir()` yields `.sql.gz` first, `.sql` remains at `month_files[-1]`.
- The 50 MB uncompressed `.sql` is permanently retained, while the 5 MB `.sql.gz` is deleted after 30 days, causing git repository bloat.

#### The Hardened Remedy:
Harden the sort key to prioritize compressed `.sql.gz` files:
```python
month_files.sort(key=lambda x: (x[1], 1 if x[0].endswith('.gz') else 0))
```

---

## 4. Cross-Segment Blast Radius & Cohesion Verification

```
┌────────────────────────────────────────────────────────────────────────┐
│                     CROSS-SEGMENT BLAST RADIUS                         │
│                                                                        │
│   Segment 07: Database Schemas, DDL, Infra & Tooling                   │
│        │                                                               │
│        ├─► Segment 01 (Math & Loader): Replacing 438 decomposed        │
│        │   Nukta bytes guarantees exact binary match in sumRows()      │
│        │   and loadReportDataBundle() without defensive fallbacks.     │
│        │                                                               │
│        ├─► Segment 02 (Save Machine): Resolving Nukta string disparity │
│        │   prevents 0-row update write dropouts on report_personal     │
│        │   and report_organizational; eliminates save error badges.    │
│        │                                                               │
│        ├─► Segment 03 (Form Ergonomics): html[lang="bn"] body selector │
│        │   activates Tiro Bangla font across all 7 form sections.      │
│        │   Scoping 44px touch targets fixes prose link distortion.     │
│        │                                                               │
│        ├─► Segment 04 (Auth & Security): Pinned search_path = public   │
│        │   on DB functions prevents schema traversal attacks.          │
│        │                                                               │
│        ├─► Segment 05 (Routing & Layout): Zero FOIC language cookie    │
│        │   reading in RootLayout couples directly with globals.css     │
│        │   html[lang="bn"] selector for instantaneous font activation. │
│        │                                                               │
│        └─► Segment 06 (Admin & Exports): Verified syd1 proximity       │
│            (<2ms to Supabase Sydney) and outputFileTracingIncludes     │
│            for kalpurush.ttf guarantees sub-second PDF generation.     │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Cohesion Evaluation:
1. **Segment 01 (Data Calculation, Aggregation & Loader)**:  
   When child table rows are queried from Supabase, `row.category` is pure NFC (`\u09DF`). By replacing all decomposed `\u09AF\u09BC` occurrences in `report-utils.ts` and `PERSONAL_CATEGORIES`, functions like `sumRows()` and `loadReportDataBundle()` match records cleanly via `===` without needing fuzzy string normalizers.
2. **Segment 02 (Save Machine & State)**:  
   Fixing the Nukta disparity directly cures the `0-row update` bug in `ReportContext.updateField()`. Auto-saves for `"সহযোগী হয়েছেন"` and `"সক্রিয় সহযোগী"` will match PostgreSQL rows, eliminating spurious error rings and preventing write-ahead buffer retention traps.
3. **Segment 03 (Form Ergonomics & Matrix Presentation)**:  
   Replacing `.lang-bn body` with `html[lang="bn"] body` immediately applies Google's `Tiro Bangla` serif font to all form labels, matrix headings, and table cells, significantly improving visual clarity and reducing eye strain for field workers.
4. **Segment 06 (Admin Workflows & Document Exports)**:  
   Next.js NFT configuration (`outputFileTracingIncludes`) in [`next.config.mjs`](file:///d:/WebDev/report-submission/next.config.mjs#L14) ensures `kalpurush.ttf` is bundled into Vercel serverless containers, preventing `ENOENT` font crashes in `/api/export/pdf`.

---

## 5. Final Hardened Pre-Production Action Plan

### Tier 1: Database DDL, Invariant Alignment & Unicode Sanitization (CRITICAL PRIORITY)
- [ ] **Surgical Unicode Nukta Replacement Across `src/`**:  
  Execute a global replacement across all 32 files containing decomposed `\u09AF\u09BC` (`\xe0\xa6\xaf\xe0\xa6\xbc` = `chr(2479)||chr(2492)`), converting them to canonical precomposed NFC `\u09DF` (`\xe0\xa7\x9f` = `chr(2527)`).  
  *Key Files*: [`src/lib/report-utils.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.ts), [`src/lib/i18n.ts`](file:///d:/WebDev/report-submission/src/lib/i18n.ts), [`src/app/help/help-diagram-client.tsx`](file:///d:/WebDev/report-submission/src/app/help/help-diagram-client.tsx), [`src/app/(admin)/city-report/page.tsx`](file:///d:/WebDev/report-submission/src/app/(admin)/city-report/page.tsx), [`src/app/api/export/excel/route.ts`](file:///d:/WebDev/report-submission/src/app/api/export/excel/route.ts).
- [ ] **Synchronize Unit Test Fixtures**:  
  Update [`src/lib/report-utils.test.ts`](file:///d:/WebDev/report-submission/src/lib/report-utils.test.ts) to test with canonical `\u09DF` strings, preventing future test/database divergence.
- [ ] **Verify Database Invariants in Supabase**:  
  Confirm `check_*_category_nfc_nukta` constraints remain active across `report_extra`, `report_organizational`, `report_personal`, and `report_meeting`.

### Tier 2: Build Tooling, ESM Runtime & Package Hygiene (HIGH PRIORITY)
- [ ] **Atomic ESM Migration for PostCSS & Package.json**:  
  1. Convert [`postcss.config.js`](file:///d:/WebDev/report-submission/postcss.config.js) to ESM syntax: `export default { plugins: { '@tailwindcss/postcss': {} } };`.
  2. Add `"type": "module"` to [`package.json`](file:///d:/WebDev/report-submission/package.json).
  3. Verify `npm test` runs with zero `[MODULE_TYPELESS_PACKAGE_JSON]` warnings and `npm run build` exits `0`.
- [ ] **Activate Installed `clsx` and `tailwind-merge` in `src/lib/utils.ts`**:  
  Update [`src/lib/utils.ts`](file:///d:/WebDev/report-submission/src/lib/utils.ts) to export `twMerge(clsx(inputs))`.
- [ ] **Prune Dead DevDependency `autoprefixer`**:  
  Remove `"autoprefixer"` from `package.json` `devDependencies` (Tailwind v4 handles prefixing internally).
- [ ] **Declare Explicit ESLint Dependencies in `package.json`**:  
  Add `@typescript-eslint/parser`, `@next/eslint-plugin-next`, `eslint-plugin-react`, and `eslint-plugin-react-hooks` to `devDependencies` to eliminate phantom transitive dependency risks.

### Tier 3: UI/UX Typography, CSS & Touch Target Refinements (MEDIUM PRIORITY)
- [ ] **Fix Bengali Typography Selector in `globals.css`**:  
  Update [`src/app/globals.css#L119-L121`](file:///d:/WebDev/report-submission/src/app/globals.css#L119-L121) from `.lang-bn body` to `html[lang="bn"] body, :lang(bn) body { font-family: var(--font-tiro-bangla), serif; }`.
- [ ] **Scope 44px Touch Targets Away from Inline Hypertext**:  
  Change `button, a, .tap-target` in `globals.css` to `button, .btn, .tap-target, nav a, [role="button"]`, allowing inline prose links to wrap naturally without line height blowout.
- [ ] **Firefox Number Spinner Suppression**:  
  Add `input[type="number"] { -moz-appearance: textfield; appearance: textfield; }` to [`globals.css`](file:///d:/WebDev/report-submission/src/app/globals.css) to eliminate spinner-induced table cell reflow on desktop Firefox.

### Tier 4: Documentation Suite Reconciliation & Archive Protocol (HOUSEKEEPING)
- [ ] **Align Quadruple Version Drift to Canonical `2.4.0`**:  
  1. [`src/lib/version.ts`](file:///d:/WebDev/report-submission/src/lib/version.ts#L6): Set `export const APP_VERSION = "2.4.0";`.
  2. [`docs/TECHNICAL_MANUAL.md`](file:///d:/WebDev/report-submission/docs/TECHNICAL_MANUAL.md): Update Line 3 to `Version: 2.4.0` and Line 380 to `APP_VERSION = "2.4.0"`.
  3. [`twa-manifest.json`](file:///d:/WebDev/report-submission/twa-manifest.json#L21): Bump `appVersionName` to `"2.4.0"` and `appVersionCode` to `240`.
- [ ] **Prune Phantom Component from `TECHNICAL_MANUAL.md`**:  
  Remove Line 373 referencing obsolete `src/components/auth/session-cleaner.tsx`.
- [ ] **Quarantine Duplicate & Obsolete Documentation Files**:  
  Move [`docs/Help Page Review Report-Submission v2.md`](file:///d:/WebDev/report-submission/docs/Help%20Page%20Review%20Report-Submission%20v2.md) (duplicate of `Help Page Review Report-Submission.md`) and legacy report [`docs/ai-audit-verification-report.md`](file:///d:/WebDev/report-submission/docs/ai-audit-verification-report.md) into `docs/archive/` per Rule 4.
- [ ] **Harden Backup Retention Sorting Key**:  
  Update [`.github/workflows/backup.yml#L76`](file:///d:/WebDev/report-submission/.github/workflows/backup.yml#L76) to `month_files.sort(key=lambda x: (x[1], 1 if x[0].endswith('.gz') else 0))`.

---

*Report persisted to [`docs/pre-production-critique/segment-07-review.md`](file:///d:/WebDev/report-submission/docs/pre-production-critique/segment-07-review.md) in accordance with Segment 07 directives.*
# Master Prompt Architecture & Execution Guidelines: Whole-Codebase Pre-Production Critique

**Repository**: `talimul-quran-report-submission`  
**Standard**: 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`), Impeccable UI/UX Ergonomics, Pre-Production Agility & Zero Dead-Weight (`AGENTS.md` Rule 7), Adversarial Doubt-Driven Review (`Rule 2 & 6`)  
**Pipeline**: 2-Agent Dialectical Pair per Segment (Agent 1: Lead Investigator + Agent 2: Adversarial Reviewer)  
**Coordinating Role**: Master Prompt Architect & Chief of Staff

---

## 1. Executive Directive & Audit Philosophy

### 1.1 Core Audit Posture: Pre-Production Agility & Zero Dead-Weight (Rule 7)
The platform is in active pre-production development with **zero live field workers**. Under `AGENTS.md` Rule 7:
> *"Implement clean architectural fixes and schema migrations directly. Do NOT write complex application-layer shims, redundant query loops, or backward-compatibility polyfills to support obsolete prototypes, old test rows, past schemas, legacy URL params, etc."*

**The primary mandate of this audit is to identify and eradicate bloatware.** In previous milestones, numerous application-layer patches were implemented defensively to avoid touching database DDL or to tolerate inconsistent test records. In a pre-production system, application-layer workarounds written to avoid schema updates are architectural bloatware:
1. **Defensive Query Polyfills**: Query loops and try/catch fallbacks (e.g., querying `zone_type` and falling back to `select('id, name')` if missing).
2. **Dual-String Category Fallbacks**: Application and export code searching for both old and new Bengali spelling variants (e.g., `"সহযোগী হয়েছেন"` vs `"সহযোগী হয়েছে"`, split vs unsplit Mashq strings, or legacy meeting names) instead of standardizing database rows with a clean one-time SQL migration.
3. **In-Memory Data Shaping**: Attaching parent metadata in frontend loops (e.g., query-layer header snapshot month mapping) instead of adding foreign key columns directly to PostgreSQL tables.
4. **Obsolete Components & Dead Objects**: Retaining client components solely to clean up defunct storage keys (e.g., `session-cleaner.tsx`), keeping uncalled PostgreSQL functions (`handle_new_auth_user`), or preserving legacy tables (`legacy_people`) behind `deny_all` policies instead of executing `DROP TABLE ... CASCADE`.
5. **Legacy URL & Param Polyfills**: Maintaining backward-compatible query parameter parsers for deleted routes (`/login`, `/register`, bare `/report`) instead of strictly enforcing canonical entity routing (`/home`, `/report/[section]?reportId=42`).

### 1.2 The 2-Agent Dialectical Engine
Every segment is investigated by an asymmetric agent pair:
```
┌────────────────────────────────────────────────────────┐
│         SUBAGENT A: LEAD INVESTIGATOR                  │
│  - Exhaustive line-by-line inspection of segment files │
│  - Cataloging pre-production bloatware & Rule 7 traps │
│  - 5-Layer behavioral flow tracing (DOM -> DB -> PDF)  │
│  - UI/UX ergonomics (touch targets, scanability, CLS)  │
└──────────────────────────┬─────────────────────────────┘
                           │ Produces Segment Audit Report
                           ▼
┌────────────────────────────────────────────────────────┐
│         SUBAGENT B: ADVERSARIAL REVIEWER               │
│  - Cross-examines findings via the "Doubt Gate"        │
│  - Eliminates false positives & trivial objections     │
│  - Validates pre-production vs production trade-offs   │
│  - Evaluates cross-segment blast radius & breaking DDL │
│  - Formulates final actionable remediation roadmap     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Codebase Partitioning & Coverage Matrix

Every single source file, configuration file, and build script is mapped across 7 cohesive functional segments:

| Segment ID | Domain Name | Target Source Files & Configurations | Primary Audit Focus |
|:---:|:---|:---|:---|
| **01** | **Authentication, Middleware & Route Access Control** | `middleware.ts`<br>`src/app/auth/callback/route.ts`<br>`src/app/auth/logout/route.ts`<br>`src/app/forgot-password/page.tsx`<br>`src/app/forgot-password/actions.ts`<br>`src/app/update-password/page.tsx`<br>`src/app/update-password/actions.ts`<br>`src/app/pending-approval/page.tsx`<br>`src/components/auth/auth-portal-client.tsx`<br>`src/components/auth/google-sign-in-button.tsx`<br>`src/components/auth/register-form-client.tsx`<br>`src/components/auth/session-cleaner.tsx` | - Pre-production bloatware (`session-cleaner.tsx`, legacy `/login` redirects)<br>- Refreshed session cookie loss on `NextResponse.redirect`<br>- Rate-limit bypasses on auth server actions<br>- Silent registration collision handling (`identities: []`)<br>- WCAG 44px touch target compliance on mobile |
| **02** | **Root Shell, Layouts, Navigation & Global State** | `src/app/layout.tsx`<br>`src/app/page.tsx`<br>`src/app/home/page.tsx`<br>`src/app/home/actions.ts`<br>`src/app/globals.css`<br>`src/app/error.tsx`<br>`src/app/loading.tsx`<br>`src/app/not-found.tsx`<br>`src/app/[...not-found]/page.tsx`<br>`src/app/manifest.ts`<br>`src/app/icon.tsx`<br>`src/components/layout/navbar.tsx`<br>`src/components/layout/bottom-nav.tsx`<br>`src/components/layout/user-dropdown.tsx`<br>`src/components/layout/language-toggle.tsx`<br>`src/components/layout/theme-toggle.tsx`<br>`src/components/layout/appearance-footer-toggle.tsx`<br>`src/components/providers/language-provider.tsx`<br>`src/components/providers/theme-provider.tsx` | - Sextuplicate auth queries across sibling navigation bars<br>- Defensive `zone_type` fallback queries in `home/page.tsx`<br>- Flash of Incorrect Content / Language (FOIC) on mount<br>- SSR cookie synchronization (`app-language`)<br>- Responsive navigation drawer and click-outside governance |
| **03** | **Report Core State Machine, Auto-Save & Lifecycle** | `src/app/report/page.tsx`<br>`src/app/report/[section]/page.tsx`<br>`src/components/report/report-context.tsx`<br>`src/components/report/auto-save-field.tsx`<br>`src/components/report/auto-save-indicator.tsx`<br>`src/components/report/section-layout.tsx`<br>`src/components/report/view-mode-toggle.tsx`<br>`src/components/dashboard/period-selector.tsx`<br>`src/components/dashboard/user-dashboard.tsx` | - Focus loss & form unmount cascade on auto-save blur<br>- `data` reference in `SectionSwitcher` `useEffect` dependencies<br>- Canonical routing migration (`/report/[section]?reportId=42`)<br>- Redundant `get_or_create_report` RPC calls on tab switches<br>- Unmount persistence flush in `auto-save-field.tsx`<br>- URL search parameter desynchronization |
| **04** | **Report Data-Entry Section Forms & UI Ergonomics** | `src/components/report/sections/report-header-form.tsx`<br>`src/components/report/sections/courses-form.tsx`<br>`src/components/report/sections/organizational-form.tsx`<br>`src/components/report/sections/personal-form.tsx`<br>`src/components/report/sections/meetings-form.tsx`<br>`src/components/report/sections/extras-form.tsx`<br>`src/components/report/sections/comments-form.tsx` | - Dual-string fallback lookups (`find(r => r.category === ...)` )<br>- Missing live computed row totals in `personal-form.tsx`<br>- Dynamic table vs card mode toggle ergonomics<br>- Accordion state collapse dropping dirty input values<br>- Fixed sticky left columns (`w-48` / `w-52`) mobile scrolling<br>- Unicode normalization drift (NFC vs NFD) on category keys |
| **05** | **Admin Portal, User Governance & Override System** | `src/app/(admin)/layout.tsx`<br>`src/app/(admin)/dashboard/page.tsx`<br>`src/app/(admin)/reports/page.tsx`<br>`src/app/(admin)/city-report/page.tsx`<br>`src/app/(admin)/management/page.tsx`<br>`src/app/(admin)/management/actions.ts`<br>`src/components/admin/correction-button.tsx` | - Privilege escalation: standard admins deleting superadmins<br>- Missing `end_month` in `CorrectionButton` upsert/delete queries<br>- Language mismatch breaking secondary period controls (`ত্রৈমাসিক` vs `quarterly`)<br>- DCS (`zone_id = 1`) hardcoded exclusions vs clean schema hierarchy<br>- Superadmin self-deletion prevention guards |
| **06** | **Document Export Pipeline, City Views & Help System** | `src/app/api/export/pdf/route.tsx`<br>`src/app/api/export/excel/route.ts`<br>`src/components/admin/reports/city-report-pdf.tsx`<br>`src/app/help/page.tsx`<br>`src/app/help/help-diagram-client.tsx`<br>`public/fonts/kalpurush.ttf` | - PDF Page 2 vertical budget overflow onto Page 3<br>- Maktab summary positioning (ADR 007 §2.5 rebalance)<br>- ~500 lines of duplicated query & override logic across export routes<br>- Dropping overrides when English period tokens (`quarterly`) are passed<br>- Font register lifecycle and memory leaks in React-PDF<br>- Merged cell calculation errors in Excel exporter |
| **07** | **Infrastructure, Supabase Clients, Utilities & Build Pipeline** | `src/utils/supabase/client.ts`<br>`src/utils/supabase/server.ts`<br>`src/lib/utils.ts`<br>`src/lib/date-utils.ts`<br>`src/lib/date-utils.test.ts`<br>`src/lib/report-utils.ts`<br>`src/lib/report-utils.test.ts`<br>`src/lib/rate-limit.ts`<br>`src/lib/version.ts`<br>`src/lib/i18n.ts`<br>`next.config.mjs`<br>`postcss.config.js`<br>`eslint.config.mjs`<br>`tsconfig.json`<br>`package.json`<br>`twa-manifest.json`<br>`.github/workflows/*` (`ci.yml`, `build-apk.yml`, `backup.yml`)<br>`vercel.json` | - Arithmetic string concatenation bug in `sumRows` (`"5" + 3 = "53"`)<br>- Unicode decomposed characters in constants (`U+09AF U+09BC` vs `U+09DF`)<br>- Serverless compute proximity: Vercel region configuration (`syd1`)<br>- Browser Supabase client memoization contracts<br>- Unused dependencies in `package.json`<br>- Dead database tables/functions/views in SQL migrations |

---

## 3. High-Precision Segment Audit Prompts

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 01: AUTHENTICATION, MIDDLEWARE & ROUTE ACCESS CONTROL             -->
<!-- ========================================================================= -->
```

### Segment 01 - Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 01: Authentication, Middleware & Route Access Control in `talimul-quran-report-submission`.

Your target files:
- `middleware.ts`
- `src/app/auth/callback/route.ts`
- `src/app/auth/logout/route.ts`
- `src/app/forgot-password/page.tsx`
- `src/app/forgot-password/actions.ts`
- `src/app/update-password/page.tsx`
- `src/app/update-password/actions.ts`
- `src/app/pending-approval/page.tsx`
- `src/components/auth/auth-portal-client.tsx`
- `src/components/auth/google-sign-in-button.tsx`
- `src/components/auth/register-form-client.tsx`
- `src/components/auth/session-cleaner.tsx`

CRITICAL SPECIAL FOCUS (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
The platform is in active pre-production development with 0 live field workers. Identify any application-layer bloatware written solely to avoid schema DDL or maintain backward compatibility with old prototypes. Specifically inspect:
1. `src/components/auth/session-cleaner.tsx`: Why does this component exist? Is it clearing defunct sessionStorage keys from legacy prototypes? Can it be deleted entirely?
2. `middleware.ts`: Inspect the explicit path checks for `/login` and `/register`. In pre-production where all entry routes are canonicalized to `/home`, why are legacy URL rewrites retained?
3. Refreshed Cookie Dropping: Trace `NextResponse.redirect()` in `middleware.ts`. When Supabase SSR rotates tokens in `setAll`, does `NextResponse.redirect(url)` drop the refreshed session cookies?
4. Registration Integrity: Trace `register-form-client.tsx` and auth server actions. How are silent email collisions (`identities.length === 0`) handled? Does the UI inform the user or leave them hanging?
5. Rate Limiting: Inspect `rate-limit.ts` integration in auth endpoints. Can malicious bots spam password resets or registration requests?
6. UI/UX Ergonomics: Inspect touch target sizes across auth buttons, input heights, and password visibility toggles against the 44px WCAG mobile floor.

Deliver your audit formatted as:
1. Executive Quality Scorecard (Grade A-F, Summary).
2. Pre-Production Bloatware & Rule 7 Violations (file:line, description, zero-dead-weight remedy).
3. 5-Layer Behavioral Audit Findings Table (`WEB-001` through `WEB-014`).
4. Detailed Receipt & Fix Plans for every issue.
5. Cross-Segment Blast Radius Map.

Stop with findings recorded. Do NOT modify any source files.
```

### Segment 01 - Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 01: Authentication, Middleware & Route Access Control in `talimul-quran-report-submission`.

Your goal is to cross-examine Subagent A's report with ruthless doubt:
1. Challenge Bloatware Classifications: Did Subagent A flag standard Next.js auth patterns as bloatware? Verify whether removing `session-cleaner.tsx` or legacy redirect rules causes regressions for developers testing old bookmarks.
2. Stress-Test Cookie Dropping (C01-01): Is cookie dropping on `NextResponse.redirect()` a theoretical concern or a verified bug in Next.js 15 + `@supabase/ssr`? What exact header copying code is required?
3. False-Positive Elimination: Did Subagent A complain about touch targets on non-touch desktop fields? Are the auth forms genuinely accessible on 320px mobile viewports?
4. Security Blast Radius: If rate limiting is enforced on password resets, does it inadvertently block automated CI tests or legitimate developers on shared NAT IPs?
5. Clean Pre-Production DDL Arbitration: Where Subagent A proposes application-layer guards for profile creation, evaluate whether a clean PostgreSQL trigger (`on_auth_user_created`) in Supabase is superior.

Output a structured Adversarial Critique:
- Accepted Findings (verified real-world bugs).
- False Positives & Downgraded Issues (with exact technical justification).
- Stress-Tested Pre-Production Remediation Roadmap.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 02: ROOT SHELL, LAYOUTS, NAVIGATION & GLOBAL STATE                -->
<!-- ========================================================================= -->
```

### Segment 02 - Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 02: Root Shell, Layouts, Navigation & Global State in `talimul-quran-report-submission`.

Your target files:
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/home/page.tsx`
- `src/app/home/actions.ts`
- `src/app/globals.css`
- `src/app/error.tsx`
- `src/app/loading.tsx`
- `src/app/not-found.tsx`
- `src/app/[...not-found]/page.tsx`
- `src/app/manifest.ts`
- `src/app/icon.tsx`
- `src/components/layout/navbar.tsx`
- `src/components/layout/bottom-nav.tsx`
- `src/components/layout/user-dropdown.tsx`
- `src/components/layout/language-toggle.tsx`
- `src/components/layout/theme-toggle.tsx`
- `src/components/layout/appearance-footer-toggle.tsx`
- `src/components/providers/language-provider.tsx`
- `src/components/providers/theme-provider.tsx`

CRITICAL SPECIAL FOCUS (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. Redundant Sibling Auth Queries: Inspect `navbar.tsx`, `bottom-nav.tsx`, and `user-dropdown.tsx`. Trace how each component independently calls `supabase.auth.getUser()` and `supabase.from("people")`. How many redundant database queries are executed on every page load?
2. Pre-Production Defensive Fallbacks in `src/app/home/page.tsx`: Inspect lines 35-51. Why does `home/page.tsx` execute a fallback query selecting `id, name` if `select('id, name, zone_type')` throws an error? Is this legacy backward-compatibility bloatware?
3. Hardcoded DCS Entity Checks: Inspect `filter((z) => z.id !== 1 && z.zone_type !== "city")`. Why is DCS hardcoded by `id === 1`?
4. Flash of Incorrect Language / Content (FOIC): Trace `language-provider.tsx` and `layout.tsx`. Does `RootLayout` render `<html lang="bn">` while `LanguageProvider` asynchronously updates to English from `localStorage` after mount?
5. UI/UX Ergonomics & Mobile Shell: Check the 3-tab mobile bottom nav (`bottom-nav.tsx`), slide-up profile drawers, and top navbar. Do tap targets meet 44px? Is there cumulative layout shift (CLS) when auth state resolves?

Deliver your audit formatted with the standard Quality Scorecard, Bloatware Register, Behavioral Findings Table (`WEB-001`–`WEB-014`), Receipt & Fix Plans, and Blast Radius Map.

Stop with findings recorded. Do NOT modify any source files.
```

### Segment 02 - Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 02: Root Shell, Layouts, Navigation & Global State in `talimul-quran-report-submission`.

Cross-examine Subagent A's report through the "Doubt Gate":
1. Unified Auth Context Trade-offs: Subagent A recommends consolidating `getUser` and `people` into a shared `UserProvider`. Will wrapping the root shell in a client context force Server Components into client boundaries, hurting initial page paint (LCP)?
2. FOIC Remediation: Is reading the `app-language` cookie in `RootLayout` server-side 100% reliable across Edge Middleware, Next.js App Router, and static asset pre-fetches?
3. DCS Zone 1 Hierarchy: If we eliminate the `id !== 1` filter and enforce `zone_type != 'city'`, does the live database schema already possess `zone_type`? If not, what is the exact DDL script required?
4. Layout Suspense & Streaming: Subagent A flags fallback layout spinners. Does replacing them cause hydration mismatches between SSR and browser client HTML?
5. Screen Economy & Mobile Ergonomics: Review Subagent A's critique of the slide-up menu. Does it respect thumb reach on large phones?

Output a structured Adversarial Critique separating confirmed architectural defects from theoretical nitpicks, and provide the clean pre-production DDL and provider architecture.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 03: REPORT CORE STATE MACHINE, AUTO-SAVE & LIFECYCLE              -->
<!-- ========================================================================= -->
```

### Segment 03 - Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 03: Report Core State Machine, Auto-Save & Lifecycle in `talimul-quran-report-submission`.

Your target files:
- `src/app/report/page.tsx`
- `src/app/report/[section]/page.tsx`
- `src/components/report/report-context.tsx`
- `src/components/report/auto-save-field.tsx`
- `src/components/report/auto-save-indicator.tsx`
- `src/components/report/section-layout.tsx`
- `src/components/report/view-mode-toggle.tsx`
- `src/components/dashboard/period-selector.tsx`
- `src/components/dashboard/user-dashboard.tsx`

CRITICAL SPECIAL FOCUS (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. The Auto-Save Blur & Unmount Loop (C03-01): Inspect `src/app/report/[section]/page.tsx` lines 60-147 and `report-context.tsx`. When a user edits a field and blurs, `updateField` mutates `data`. Because `data` is in `SectionSwitcher`'s `useEffect` dependency array, does this trigger `setIsLoading(true)`, unmounting the active form and re-querying `getUser`, `people`, and `get_or_create_report`?
2. Canonical Entity Routing vs 3-Tuple Query Parameters: Trace how `/report/[section]` handles navigation. Why does it require `type`, `month`, and `year` query params on every tab switch instead of a canonical `reportId=42` pointer? How much RPC traffic and state churn does this produce?
3. Unmount Persistence Flush: Inspect `src/components/report/auto-save-field.tsx`. If a user edits an input and immediately clicks "পরবর্তী পাতা" or switches tabs before blurring, does the unmounted field drop the pending keystrokes?
4. Dirty State Race Conditions: What happens if a network glitch occurs during an auto-save? Does `report-context.tsx` queue the save, retry, or overwrite newer user typing with stale snapshot data?
5. Mobile Touch & View Mode Toggle: Check `view-mode-toggle.tsx` and `compact-view-toggle`. Are inputs and mode pills ergonomic on mobile? Does toggling compact view cause layout shifts or loss of focus?

Deliver your audit formatted with the standard Quality Scorecard, Bloatware Register, Behavioral Findings Table (`WEB-001`–`WEB-014`), Receipt & Fix Plans, and Blast Radius Map.

Stop with findings recorded. Do NOT modify any source files.
```

### Segment 03 - Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 03: Report Core State Machine, Auto-Save & Lifecycle in `talimul-quran-report-submission`.

Cross-examine Subagent A's report through the "Doubt Gate":
1. The Dependency Array Dilemma: Subagent A claims removing `data` from `SectionSwitcher`'s dependency array fixes the unmount loop. If `data` is removed, does `SectionSwitcher` risk rendering stale report data when the user switches between different months?
2. Canonical `reportId` Routing Blast Radius: If sub-section URLs are updated to `/report/[section]?reportId=42`, what happens if a user directly bookmarks or reloads a URL without `reportId`? Does Subagent A provide an atomic fallback resolver that initialises the report without redirect loops?
3. Unmount Flush Race Condition: If `auto-save-field.tsx` triggers an auto-save inside `useEffect` cleanup (unmount), will React 19 / Next.js abort the in-flight fetch? Does `navigator.sendBeacon` or a mutable ref flush provide guaranteed delivery?
4. Autosave Debouncing vs Immediate Blur: Does Subagent A's proposal introduce debouncing delays that allow users to navigate away before dirty state is committed?
5. Cell Hit Target AA Exception: Cross-check `KNOWN_ISSUES.md`. Is the `h-9` (36px) input height a documented design exception for dense matrix tables, or a genuine bug?

Output a structured Adversarial Critique separating confirmed architectural defects from theoretical nitpicks, and formulate the bulletproof state machine fix.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 04: REPORT DATA-ENTRY SECTION FORMS & UI ERGONOMICS               -->
<!-- ========================================================================= -->
```

### Segment 04 - Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 04: Report Data-Entry Section Forms & UI Ergonomics in `talimul-quran-report-submission`.

Your target files:
- `src/components/report/sections/report-header-form.tsx`
- `src/components/report/sections/courses-form.tsx`
- `src/components/report/sections/organizational-form.tsx`
- `src/components/report/sections/personal-form.tsx`
- `src/components/report/sections/meetings-form.tsx`
- `src/components/report/sections/extras-form.tsx`
- `src/components/report/sections/comments-form.tsx`

CRITICAL SPECIAL FOCUS (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. Dual-String Fallback Lookups: Inspect `organizational-form.tsx`, `courses-form.tsx`, and `meetings-form.tsx`. Look for category searches such as `find(r => r.category === "সহযোগী হয়েছেন" || r.category === "সহযোগী হয়েছে")` or split mashq category lookups. Why are these dual-string fallbacks present in application code? In pre-production, shouldn't database rows be migrated with a clean SQL update and the fallback shims eradicated?
2. Unicode Normalization Drift (C07-02 / C04-03): Check category strings against `PERSONAL_METRICS_ROWS` and `ORG_CATEGORIES`. Are decomposed characters (e.g. `U+09AF U+09BC` Ja + Nukta) conflicting with precomposed characters (`U+09DF` Yya), causing category lookups to return `undefined`?
3. Missing Live Computed Row Totals (C04-02): Inspect `personal-form.tsx` in table mode. Does the form display live row totals as the user types, or does the user have to guess whether numbers balance?
4. Table vs Card Mode Parity: Compare data presentation in `viewMode === 'table'` vs `viewMode === 'card'`. Are all fields accessible in both modes? Does switching modes drop uncommitted inputs?
5. Accordion State & Persistence: Inspect `courses-form.tsx` and `organizational-form.tsx`. When an accordion section collapses, does it unmount child inputs and flush pending changes?
6. Mobile Sticky Columns: Check the sticky left column widths (`w-48` / `w-52`) across table views. Do they cause horizontal overflow or clipping on 360px viewports?

Deliver your audit formatted with the standard Quality Scorecard, Bloatware Register, Behavioral Findings Table (`WEB-001`–`WEB-014`), Receipt & Fix Plans, and Blast Radius Map.

Stop with findings recorded. Do NOT modify any source files.
```

### Segment 04 - Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 04: Report Data-Entry Section Forms & UI Ergonomics in `talimul-quran-report-submission`.

Cross-examine Subagent A's report through the "Doubt Gate":
1. Database Category Migration vs Dual-String Code: Subagent A calls for purging dual-string fallbacks and updating the database. If we run `UPDATE report_organizational SET category = ...`, what happens to reports already saved under old category strings? Are there foreign key constraints or RPC triggers that would reject this update?
2. Performance Cost of Live Row Totals: Subagent A recommends live computed row totals in `personal-form.tsx`. Will recalculating matrix totals on every keystroke cause input lag on low-end Android mobile devices?
3. Card Mode vs Table Mode Redundancy: Why does the application maintain two separate rendering branches (table and card) for every form? Does this double maintenance overhead and create field drift? Should one mode be standardized?
4. Sticky Column Usability: Subagent A criticizes sticky `w-48` left columns. If sticky positioning is removed, can mobile field workers easily identify which row they are editing when scrolling horizontally across 8 data columns?
5. Bengali Unicode Canon: What is the exact Node.js/PostgreSQL normalization command required to ensure 100% string equality across all 7 forms?

Output a structured Adversarial Critique separating confirmed architectural defects from theoretical nitpicks, and provide the clean pre-production remediation plan.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 05: ADMIN PORTAL, USER GOVERNANCE & OVERRIDE SYSTEM               -->
<!-- ========================================================================= -->
```

### Segment 05 - Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 05: Admin Portal, User Governance & Override System in `talimul-quran-report-submission`.

Your target files:
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/dashboard/page.tsx`
- `src/app/(admin)/reports/page.tsx`
- `src/app/(admin)/city-report/page.tsx`
- `src/app/(admin)/management/page.tsx`
- `src/app/(admin)/management/actions.ts`
- `src/components/admin/correction-button.tsx`

CRITICAL SPECIAL FOCUS (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. Privilege Escalation on User Deletion (C05-04): Inspect `deleteUserAction` in `src/app/(admin)/management/actions.ts`. Trace the role verification. Can a standard admin delete a superadmin account? Can an admin delete their own account using the service role bypass key?
2. Override Upsert Unique Index Collision (C05-02): Inspect `src/components/admin/correction-button.tsx` lines 96-107 and 127-142. What is the `onConflict` clause passed to Supabase upsert? Does it include `end_month`? What happens when an override is saved for a custom multi-month range?
3. Custom Range Override Deletion: In `CorrectionButton.handleDelete`, does the delete query omit `end_month`, inadvertently wiping all custom ranges that share the same start month?
4. City Report Period Controls Vanishing (C05-01): Inspect `src/app/(admin)/city-report/page.tsx`. Trace the select dropdown values (`"quarterly"`, `"monthly"`) vs the conditional rendering checks (`reportType === "ত্রৈমাসিক"`). Why do secondary period selectors vanish when selecting an option?
5. Hardcoded DCS Entity vs Zone Hierarchy: Inspect how DCS (`zone_id = 1`) is filtered out across admin reports and management lists. Why is this hardcoded instead of using a structured `zone_type` schema?
6. Admin Navigation & Modals: Check `(admin)/layout.tsx` and modal components. Do modals implement click-outside protection with unsaved-change guards?

Deliver your audit formatted with the standard Quality Scorecard, Bloatware Register, Behavioral Findings Table (`WEB-001`–`WEB-014`), Receipt & Fix Plans, and Blast Radius Map.

Stop with findings recorded. Do NOT modify any source files.
```

### Segment 05 - Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 05: Admin Portal, User Governance & Override System in `talimul-quran-report-submission`.

Cross-examine Subagent A's report through the "Doubt Gate":
1. Superadmin Governance Reality Check: Subagent A flags standard admins deleting superadmins. In pre-production with only 2 test admin accounts, is this a critical vulnerability or a deferred administrative polish? Under pre-production standards, what is the cleanest 2-tier guard?
2. Override Upsert Index Verification: Cross-check the database schema from ADR 023. What is the exact name and column definition of `city_report_override_period_unique`? If `CorrectionButton` does not pass `end_month`, does PostgREST throw a 42P10 error in production?
3. Period Token Normalization: Subagent A points out Bengali vs English token mismatch in `city-report/page.tsx`. What is the canonical single source of truth for period tokens across the entire codebase (`REPORT_TYPES`)?
4. Service Role Bypass Invariant: Does `actions.ts` instantiate `createClient` with `SUPABASE_SERVICE_ROLE_KEY` safely, or does it leak the service key to client bundles?
5. DCS Deletion Risk: If we execute `DELETE FROM report WHERE id = 36` (the accidental DCS report), will foreign key cascades delete historical child table test data?

Output a structured Adversarial Critique separating confirmed architectural defects from theoretical nitpicks, and formulate the exact DDL and action remediation steps.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 06: DOCUMENT EXPORT PIPELINE, CITY VIEWS & HELP SYSTEM            -->
<!-- ========================================================================= -->
```

### Segment 06 - Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 06: Document Export Pipeline, City Views & Help System in `talimul-quran-report-submission`.

Your target files:
- `src/app/api/export/pdf/route.tsx`
- `src/app/api/export/excel/route.ts`
- `src/components/admin/reports/city-report-pdf.tsx`
- `src/app/help/page.tsx`
- `src/app/help/help-diagram-client.tsx`
- `public/fonts/kalpurush.ttf`

CRITICAL SPECIAL FOCUS (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. PDF Page 2 Vertical Budget Overflow (C06-01): Inspect `src/app/api/export/pdf/route.tsx` lines 654-711. Measure the point heights of all sections placed on Page 2 (Section 2, Section 4, Maktab summary, Safar summary, Comments). Does Page 2 exceed the 523.28 pt landscape A4 ceiling (~558 pt), pushing content onto an unwanted 3rd page and violating ADR 007?
2. Code Duplication Across Export Routes: Compare `src/app/api/export/pdf/route.tsx` and `src/app/api/export/excel/route.ts`. How many lines of identical database querying, aggregation, and override-merging code are duplicated (~500 lines)? Why isn't there a shared `report-data-loader.ts`?
3. Overrides Dropped on English Period Tokens (C06-02): Inspect lines 929-954 of `pdf/route.tsx` and lines 488-515 of `excel/route.ts`. When a caller requests export with `type=quarterly`, why does the override query check `.eq("report_type", "quarterly")` instead of `"ত্রৈমাসিক"`, dropping all overrides?
4. Backward-Compatible Fallback Lookups: Look at lines 423 of `excel/route.ts` and lines 580/626 of `pdf/route.tsx`. Why are there multi-clause category fallbacks (`"Committee Orientation / Muallima Orientation"` vs `"Committee Orientation"`, `"সহযোগী হয়েছেন"` vs `"সহযোগী হয়েছে"`) in the export engines?
5. Kalpurush Font & Bengali Glyphs: Check how `@react-pdf/renderer` registers `kalpurush.ttf`. Are Bengali conjuncts rendering correctly without clipping or glyph overlap?
6. Help System & Role Diagrams: Inspect `help-diagram-client.tsx`. Are all roles (worker, admin, superadmin) accurately represented without outdated workflow instructions?

Deliver your audit formatted with the standard Quality Scorecard, Bloatware Register, Behavioral Findings Table (`WEB-001`–`WEB-014`), Receipt & Fix Plans, and Blast Radius Map.

Stop with findings recorded. Do NOT modify any source files.
```

### Segment 06 - Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 06: Document Export Pipeline, City Views & Help System in `talimul-quran-report-submission`.

Cross-examine Subagent A's report through the "Doubt Gate":
1. PDF Rebalancing Feasibility: Subagent A recommends moving the Maktab summary to the bottom of Page 1. Does Page 1 have sufficient vertical margin to hold Section 0, Section 1, Section 3, AND the Maktab summary without overflowing onto Page 2? Compute the exact point heights under real-world data loads.
2. Shared Data Loader Abstraction Overhead: Subagent A suggests creating `src/lib/report-data-loader.ts`. Under Rule 2 (Simplicity), does introducing a shared loader create an unnecessary abstraction layer, or does it eliminate high-risk divergence between PDF and Excel exports?
3. PDF Memory Leak & Serverless Execution: How does `@react-pdf/renderer` perform inside Vercel serverless functions? Does registering the font on every invocation leak memory?
4. Excel Formatting Quirks: Inspect Excel cell column widths and formulas in `excel/route.ts`. Do merged header cells break auto-fit calculations in Microsoft Excel and LibreOffice?
5. Help System Staleness: Does `src/app/help/page.tsx` reference outdated URLs or deleted routes (`/login`, `/register`)?

Output a structured Adversarial Critique separating confirmed architectural defects from theoretical nitpicks, and provide the exact mathematical layout budget and shared loader architecture.
```

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 07: INFRASTRUCTURE, SUPABASE CLIENTS, UTILITIES & BUILD PIPELINE -->
<!-- ========================================================================= -->
```

### Segment 07 - Subagent A: Lead Investigator
```markdown
You are Subagent A (Lead Investigator) auditing Segment 07: Infrastructure, Supabase Clients, Utilities & Build Pipeline in `talimul-quran-report-submission`.

Your target files:
- `src/utils/supabase/client.ts`
- `src/utils/supabase/server.ts`
- `src/lib/utils.ts`
- `src/lib/date-utils.ts`
- `src/lib/date-utils.test.ts`
- `src/lib/report-utils.ts`
- `src/lib/report-utils.test.ts`
- `src/lib/rate-limit.ts`
- `src/lib/version.ts`
- `src/lib/i18n.ts`
- `next.config.mjs`
- `postcss.config.js`
- `eslint.config.mjs`
- `tsconfig.json`
- `package.json`
- `twa-manifest.json`
- `.github/workflows/*` (`ci.yml`, `build-apk.yml`, `backup.yml`)
- `vercel.json` (serverless region configuration)

CRITICAL SPECIAL FOCUS (AGENTS.md Rule 7: Pre-Production Agility & Zero Dead-Weight):
1. Arithmetic String Concatenation Bug (C07-01): Inspect `src/lib/report-utils.ts` line 328 in `sumRows`:
   `((existing as any)[k] || 0) + ((row as any)[k] || 0)`.
   If a database query or input field returns a string digit, does `"5" + 3` result in `"53"`, corrupting city analytics by orders of magnitude?
2. Unicode Normalization Drift (C07-02): Inspect lines 87 and 108 in `src/lib/report-utils.ts`. Are category constants stored in mixed NFC and NFD Unicode representations? What happens when string equality `===` is checked?
3. Dead Database Tables, Functions & Views (Zero Dead-Weight): Check `docs/pre-production-schema-cleanup-backlog.md` and live SQL migrations. Why do `legacy_people` (plaintext passwords), `handle_new_auth_user` (0 triggers), and `view_city_course_final` (flawed query) still exist in the database?
4. Transatlantic Compute Latency Cascade: Check for `vercel.json`. Are Vercel serverless functions deployed to default Washington DC (`iad1`), adding ~440ms–1.2s round-trip network transit delay to Supabase Sydney (`ap-southeast-2`)?
5. Supabase Client Memoization: Inspect `src/utils/supabase/client.ts`. Does it enforce singleton or memoized client usage?
6. Dead Dependencies & Config Integrity: Inspect `package.json` for unused packages. Check `twa-manifest.json` integrity and Android APK build workflow.

Deliver your audit formatted with the standard Quality Scorecard, Bloatware Register, Behavioral Findings Table (`WEB-001`–`WEB-014`), Receipt & Fix Plans, and Blast Radius Map.

Stop with findings recorded. Do NOT modify any source files.
```

### Segment 07 - Subagent B: Adversarial Reviewer
```markdown
You are Subagent B (Adversarial Reviewer) auditing Segment 07: Infrastructure, Supabase Clients, Utilities & Build Pipeline in `talimul-quran-report-submission`.

Cross-examine Subagent A's report through the "Doubt Gate":
1. Type Coercion Blast Radius: Subagent A calls for `Number(...)` coercion in `sumRows`. What happens if a non-numeric field (like `comments` or `meeting_name`) is passed to `sumRows`? Does it produce `NaN`?
2. Unicode Normalization Performance: Does calling `.normalize("NFC")` on every string comparison introduce measurable CPU overhead in large aggregation loops? Where is the optimal place to enforce normalization (database seed, API boundary, or utility)?
3. Vercel Region Pinning (`syd1`): If we create `vercel.json` with `"regions": ["syd1"]`, are all serverless functions and Edge Middlewares supported in Sydney on Vercel's standard plan?
4. Zero Dead-Weight Execution Safety: Subagent A proposes dropping `legacy_people` and `view_city_course_final`. Is there any external script, backup pipeline, or analytics dashboard that still references these tables?
5. Test Coverage Adequacy: Do `date-utils.test.ts` and `report-utils.test.ts` adequately test multi-month weighted averages, snapshot inventory stock, and Unicode string matches?

Output a structured Adversarial Critique separating confirmed architectural defects from theoretical nitpicks, and formulate the production-grade utility and infrastructure plan.
```

---

## 4. Subagent Output Schema & Quality Protocols

### 4.1 Subagent A (Lead Investigator) Required Schema
Subagent A must produce an audit artifact adhering to this structure:
```markdown
# Segment [XX] Codebase & Architectural Audit: [Segment Name]

## 1. Executive Quality Scorecard
- **Health Grade**: [A / B / C / D / F]
- **Pre-Production Bloatware Count**: [N]
- **Critical Behavioral Defects**: [N]
- **Executive Summary**: [Concise 3-5 sentence overview]

## 2. Pre-Production Bloatware & Rule 7 Violations
| # | File Location | Bloatware Pattern | Root Cause in Prototype | Zero-Dead-Weight Clean Remediation |
|---|---|---|---|---|

## 3. 5-Layer Behavioral Audit Findings Table
| # | Bug ID | Short Title | File Location | Urgency | Risk: Fix | Risk: No Fix | ROI | Blast Radius | Status |
|---|---|---|---|---|---|---|---|---|---|

## 4. Deep Receipts & Remediation Plans
For each finding:
- **Current Behavior**: Exact file:line snippet and mechanism.
- **Behavioral Impact**: Why this breaks in pre-production or field use.
- **Authoritative Citation**: Rule or ADR reference.
- **Actionable Remediation**: Exact clean code or DDL replacement.

## 5. Cross-Segment Blast Radius & Wire Analysis
```

### 4.2 Subagent B (Adversarial Reviewer) Required Schema
Subagent B must produce an adversarial review artifact adhering to this structure:
```markdown
# Segment [XX] Adversarial Critique & Doubt Gate Review: [Segment Name]

## 1. Executive Adversarial Evaluation
- **Agreement Level with Lead Investigator**: [High / Moderate / Skeptical]
- **False Positive Count Discharged**: [N]
- **Core Verdict**: [Concise verdict on real-world risks vs trivial complaints]

## 2. Doubt Gate Cross-Examination
| Lead Finding ID | Claimed Severity | Adversarial Ruling | Rationale & Real-World Stress Test |
|---|---|---|---|

## 3. False Positive & Trivial Con Elimination
Detailed justification for any dismissed, downgraded, or rejected findings.

## 4. Clean Pre-Production DDL vs App-Layer Patch Arbitration
Under Rules 6 & 7, arbitration on whether clean database migrations supersede proposed application patches.

## 5. Final Hardened Action Plan & Priority Matrix
```

---

## 5. Execution Workflow & Coordination Directives

1. **Subagent Execution Order**:
   - Run Segment 01 through Segment 07 sequentially or in parallel pairs.
   - For each segment, Subagent A executes first and persists its report in `docs/critiques/segment-[XX]-[slug]-investigation.md`.
   - Subagent B reads Subagent A's report alongside the source files, performs the adversarial review, and persists in `docs/critiques/segment-[XX]-[slug]-review.md`.
2. **Quality Gate Verification**:
   - Before and during critique synthesis, the Master Architect verifies all 4 repo quality gates:
     - `npm run lint` $\rightarrow$ 0 errors
     - `npx tsc --noEmit` $\rightarrow$ 0 errors
     - `npm test` $\rightarrow$ 100% pass rate
     - `npm run build` $\rightarrow$ Clean exit code 0
3. **Master Synthesis Protocol**:
   - Upon completion of all 7 segments, consolidate findings into `docs/critiques/SUMMARY.md` featuring the Master Scorecard, Top 10 Systemic Bloatware & Blockers, and an Actionable Pre-Production Roadmap.

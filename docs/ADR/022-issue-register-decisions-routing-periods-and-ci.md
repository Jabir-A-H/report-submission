# ADR 022: Issue Register Policy Decisions, Canonical URL Routing, Multi-Month Period Expansion, and Automated CI

**Date**: 2026-10-20  
**Status**: Accepted and Planned  
**Deciders**: System Owner & Antigravity  
**Consulted**: `docs/report-submission-issue-register.md`, `docs/TECHNICAL_MANUAL.md`, `docs/ROADMAP.md`  

---

## 1. Context and Problem Statement

Following the completion and hardening of Track 1 (ADR 020) and Track 4 (ADR 021), fourteen architectural, product, and policy questions remained open in `docs/report-submission-issue-register.md` (`RS-05`, `RS-06`, `RS-07`, `RS-11`, `RS-12`, `RS-13`, `RS-14`, `RS-33`, `RS-34`, `RS-40/41`, `RS-45`, `RS-60`, `RS-63`, `RS-70`, `RS-71`).

Without authoritative owner decisions on these items, development risked architectural drift across URL state management, multi-month period aggregation, submission governance, and deployment safety.

On 2026-10-20, an exhaustive grilling session was conducted across all open frontier items. This ADR formally records the decisions, trade-offs, and resulting system architecture.

---

## 2. Decision Outcomes Matrix

| Issue ID | Focus | Decision | Rationale & Trade-offs |
|:---|:---|:---|:---|
| **RS-13** | Report Submission Locking | **DECIDED-NOT-DOING** (Keep As-Is) | *"রিপোর্ট জমা সম্পন্ন হয়েছে"* remains an advisory status marker for dashboard progress tracking. Inputs will NOT be locked. Field workers retain real-time editing flexibility; no complex admin unlock protocol required. |
| **RS-60** | Section URL Routing | **ACCEPTED (Planned)** | Transition section navigation from fragile 3-tuple query strings (`?type=...&month=...&year=...`) to canonical database pointers: `/report/[section]?reportId=42`. Single source of truth eliminates tab desynchronization and parameter drops. Fallback behavior without `reportId` will resolve active period in implementation planning. |
| **RS-05** | Multi-Month Period Calculations | **ACCEPTED (Planned)** | Expand `getMonthsForPeriod` beyond Jan–Mar hardcoding. Implement all calendar quarters (Q1: Jan–Mar, Q2: Apr–Jun, Q3: Jul–Sep, Q4: Oct–Dec), halves (H1: Jan–Jun, H2: Jul–Dec), 9-Month Cumulative (Jan–Sep), Annual (Jan–Dec), **plus a flexible Custom Range selector** (Start Month to End Month). |
| **RS-11 / RS-12** | Zone-Worker Cardinality | **DECIDED-NOT-DOING** (Keep As-Is) | Multiple approved workers may belong to and submit reports for the same zone. No registration locks or mid-month reassignment restrictions will be applied. |
| **RS-40 / RS-41** | User ID Recovery & Admin Password Reset | **DECIDED-NOT-DOING** (Keep As-Is) | Self-service password recovery via the existing email link on `/home` is sufficient. No in-app admin password reset modal will be added. |
| **RS-45** | Secondary Admin Promotion in UI | **DEFERRED (Phase 4)** | Postponed until the 3-tier organizational hierarchy upgrade (Roadmap Phase 4 / ADR 009). Administrative role assignment remains managed directly in the database. |
| **RS-07** | Reasonableness / Outlier Input Warnings | **DECIDED-NOT-DOING** (Keep As-Is) | Numeric inputs remain unconstrained without arbitrary soft warning banners or outlier limits. |
| **RS-33** | Attendance Field Decimals | **DECIDED-NOT-DOING** (Keep As-Is) | All attendance fields remain strictly rounded whole integers across forms, database queries, and export engines. Avoids floating-point rounding drifts. |
| **RS-06** | City Report Overrides | **ACCEPTED (Planned)** | Add an explicit *"গণনা করা মানে ফিরে যান"* (Revert to calculated) button in the override modal to allow admins to immediately remove an override and restore zone-calculated totals without manual deletion. |
| **RS-71** | Automated CI Pipeline | **ACCEPTED (Planned)** | Implement `.github/workflows/ci.yml` running linting (`npm run lint`), TypeScript checking (`npx tsc --noEmit`), unit tests (`npm test`), and production build (`npm run build`) on every push and pull request to `main`. |
| **RS-70** | Backup GPG Encryption | **DECIDED-NOT-DOING** (Keep As-Is) | Automated database dumps in `.github/workflows/backup.yml` remain unencrypted `.sql` text dumps because the backup destination repository is already private. |
| **RS-34** | Mobile Keyboard Navigation | **ACCEPTED (Planned)** | Add `enterKeyHint="next"` to numeric form inputs, enabling mobile virtual keyboards to render a "Next" button for rapid field-to-field traversal. |
| **RS-63** | In-App Onboarding Tour | **DECIDED-NOT-DOING** (Keep As-Is) | The text-first visual operational guide at `/help` (ADR 019) is the sole documentation source. No intrusive onboarding overlays will be added to the mobile UI. |
| **UI Version** | Version Synchronization | **ACCEPTED (Planned)** | Update `package.json` to `"2.1.0"`, establish `src/lib/version.ts`, and display the version badge in the UI (login footer, user dropdown, mobile navigation drawer, and `/help`). Per owner directive, `twa-manifest.json` remains completely untouched. |

---

## 3. Detailed Architectural Specifications

### 3.1 Canonical `reportId` URL Routing (RS-60)
- **Current Flow**: Navigation between `/report/header`, `/report/course`, `/report/organizational`, etc. relies on propagating `?type=monthly&month=X&year=Y` in every link. If query params drop or a worker reloads an incomplete URL, it defaults to the current month or breaks.
- **New Architecture**:
  1. The entry point (`/report` or `/`) calls `get_or_create_report` once to resolve or initialize the report row.
  2. All sub-section links render with the canonical database ID: `/report/[section]?reportId=42`.
  3. Form sections load their data directly by `reportId`, eliminating redundant composite `(zone_id, month, year, report_type)` lookups.
  4. Direct visits without `reportId` will gracefully resolve to the active report during implementation.

### 3.2 Dynamic Multi-Month & Custom Date Range Engine (RS-05)
- **Period Types**:
  - `মাসিক` (Monthly): Single target month.
  - `ত্রৈমাসিক` (Quarterly): Q1 `[1..3]`, Q2 `[4..6]`, Q3 `[7..9]`, Q4 `[10..12]`.
  - `ষাণ্মাসিক` (Half-Yearly): H1 `[1..6]`, H2 `[7..12]`.
  - `নবমাসিক` (9-Month Cumulative): `[1..9]`.
  - `বার্ষিক` (Annual): `[1..12]`.
  - `কাস্টম রেঞ্জ` (Custom Range): Dynamic `[startMonth..endMonth]`.
- **Database Parity**: Overrides for any multi-month period continue to be stored canonically under `monthsRange[0]` to maintain zero-DDL compliance (ADR 018).

### 3.3 Automated CI Quality Gates (RS-71)
- **Workflow**: `.github/workflows/ci.yml`
- **Triggers**: `push` to `main`, `pull_request` to `main`.
- **Steps**:
  1. `npm run lint` (0 errors)
  2. `npx tsc --noEmit` (0 errors)
  3. `npm test` (All unit tests passing)
  4. `npm run build` (Clean production compilation)

---

## 4. Consequences and Impact

### Positive
- **Zero Unresolved Product Decisions**: Every decision item from the full issue register is formally decided and closed.
- **URL Stability**: Eliminates state desynchronization and multi-tab race conditions in the reporting form.
- **Comprehensive Reporting Scope**: Field and city analytics support all standard quarters, halves, cumulative 9-month intervals, and arbitrary month ranges.
- **Continuous Quality Assurance**: CI prevents regressions from reaching production Vercel environments.

### Trade-offs & Retained Constraints
- **Zero DDL Preserved**: No database migrations are required for any of these decisions. All logic is encapsulated in application routing, utilities, and UI components.
- **TWA Manifest Stability**: `twa-manifest.json` stays unchanged, preserving Android APK release compatibility.
- **Single-Worker Invariant Deferred**: The system permits multi-worker zones; attribution relies on honesty and organizational coordination rather than database constraints.

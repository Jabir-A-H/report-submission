# Master Prompt Architecture & Execution Guidelines: Whole-Codebase Pre-Production Critique

**Repository**: `talimul-quran-report-submission`  
**Standard**: 5-Layer Behavioral Audit (`WEB-001`–`WEB-014`), Impeccable UI/UX Ergonomics, Pre-Production Agility & Zero Dead-Weight (`AGENTS.md` Rule 7), Adversarial Doubt-Driven Review (`Rule 2 & 6`), Cross-Segment Cohesion Engine  
**Pipeline**: 2-Agent Dialectical Pair per Segment (Agent 1: Lead Investigator + Agent 2: Adversarial Reviewer) across 7 Decoupled Segments (14 Subagents Total)  
**Coordinating Role**: Master Prompt Architect & Chief of Staff  
**Artifact Destination**: `docs/pre-production-critique/`  

---

## 1. Executive Directive & Paradigm Shift: Pre-Production Scrutiny (Rule 7)

### 1.1 The Fundamental Paradigm Shift
In previous development phases, numerous documented issues, roadmaps, and bug trackers were written under defensive assumptions: preserving legacy prototypes, accommodating unconstrained or inconsistent test database rows, avoiding database schema migrations (DDL), and maintaining backward-compatible URL patterns.

Under **`AGENTS.md` Rule 7 (Pre-Production Agility vs. Production Stability)**:
> *"The platform is in active pre-production development and has NOT yet launched to live field workers.*  
> *When a defect or feature requires a database schema change, index addition, or RLS rewrite, **implement the clean DDL directly in Supabase**. Never invent complex application-layer shims, redundant query loops, or data-packing hacks to bypass a needed schema change.*  
> *Immediately DROP dead tables, orphaned functions, and obsolete views. Delete obsolete client components and unimported dependencies.*  
> *Never compromise architecture for backward compatibility: Do NOT maintain legacy shims, fallback polyfills, redundant param mappings, or dead data migrations solely to support outdated URLs, old test rows, or past schemas."*

**The core mandate of this audit is to eradicate "code shenanigans" and bloatware.**  
The 14 audit subagents must critically re-evaluate every documented issue, existing code pattern, and proposed solution. If an issue was created to work around an old database limitation, the audit must ask: **"Why not fix the database schema directly?"** If an application-layer polyfill exists to parse ambiguous strings, the audit must ask: **"Why not enforce database constraints and canonical enums?"**

### 1.2 Zero Implementation Directive
All 14 subagents operate in a **strict, read-only audit posture**.  
- **NO code modifications in `src/`**.
- **NO staging or committing changes**.
- Every finding must cite exact file paths and line ranges (`file:///path/to/file#L12-L34`).
- All reports must be persisted as Markdown documents in `docs/pre-production-critique/`.

### 1.3 The 2-Agent Dialectical Engine
Every segment is investigated by an asymmetric agent pair:
```
┌────────────────────────────────────────────────────────────────────────┐
│                   SUBAGENT A: LEAD INVESTIGATOR                        │
│  - Line-by-line inspection of segment target files & linked docs       │
│  - 5-Layer behavioral flow tracing (DOM -> State -> Actions -> DB -> PDF)│
│  - Cataloging pre-production bloatware & Rule 7 violations             │
│  - Impeccable UI/UX ergonomics (touch floor, layout shift, scanability)│
│  - Formulating multi-option competing alternatives (Rule 2 & Rule 6)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Produces: segment-XX-investigation.md
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   SUBAGENT B: ADVERSARIAL REVIEWER                     │
│  - Cross-examines every finding through the "Doubt Gate"               │
│  - Filters out false positives and trivial objections                  │
│  - Intercepts real-world field traps (rural cellular CGNAT, offline,   │
│    Bangladeshi mobile keyboard quirks, voice typing, unmount cascades) │
│  - Evaluates cross-segment blast radius & cohesive integration         │
│  - Validates DDL migration safety (unique key clashes on test rows)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Produces: segment-XX-review.md
                                    ▼
                 Validated, Production-Grade Action Plan
```

---

## 2. Synthesized Skills & Methodological Framework

Each subagent's prompt embeds and activates the core tenets of 14 specialized skills:

| Skill | Core Audit Contribution & Mandatory Standard |
|:---|:---|
| **Chief of Staff** (`/chief-of-staff`) | High-density context framing, strategic vs tactical clarity, refusal to accept band-aids; forces solutions into the architectural "pit of success". |
| **Impeccable & Design Taste** (`/impeccable`, `/design-taste-frontend`) | Eliminates UI slop: enforces responsive touch targets (44px WCAG vs dense matrix density trade-offs), zero layout shift (CLS), typographic hierarchy, contrast ratios, and dark/light mode parity. |
| **Manager** (`/manager`) | Master skill orchestrator: structures multi-layer inquiries, enforces adversarial verification, and rejects unchallenged single-path patches. |
| **Prompter** (`/prompter`) | Signal-boosting prompt construction: establishes clear cognitive boundaries, explicit inputs/outputs, structured schemas, and anti-hallucination constraints. |
| **Modern Web Guidance** (`/modern-web-guidance`) | Evaluates compliance with modern web primitives: semantic HTML, native DOM APIs, CSS Grid/Flexbox modern alignment, standard form attributes (`enterKeyHint`, `inputMode`), and screen reader accessibility (`aria-label`, `htmlFor`). |
| **Behavioral Audit** (`/behavioral-audit`) | 5-layer system audit (Layer 1: DOM/Form -> Layer 2: Client State/Cache -> Layer 3: Server Actions/API -> Layer 4: DB Schema/RLS -> Layer 5: Exports/Views). Tests against the 14-bug taxonomy (`WEB-001` through `WEB-014`). |
| **Codebase Architecture** (`/codebase-design`) | Analyzes module depth: identifies shallow abstractions, applies the "deletion test" (can this file/wrapper be deleted with zero loss?), enforces locality and high leverage. |
| **Source-Driven Development** (`/source-driven-development`) | Grounds all critique in official, current documentation (Next.js 16 App Router, React 19, Supabase SSR, PostgreSQL 15+). Rejects deprecated patterns and speculative polyfills. |
| **Vercel Mobile & Touch Skills** (`/vercel-react-native-skills`) | Evaluates mobile performance: soft keyboard viewport shrinking, focus retention during auto-save blur, touch target padding, and offline write-ahead resilience. |
| **Vercel Composition & React Best Practices** (`/vercel-composition-patterns`, `/react-best-practices`) | Reviews React 19 App Router architecture: server vs client component seam, context fragmentation vs unified providers, memoization integrity (`useMemo`, `useCallback`), and re-render cascades. |
| **Idea Refine** (`/idea-refine`) | Stress-tests assumptions, expands at least 2–3 competing alternatives before converging, isolating high-risk architectural trade-offs. |
| **Context7 MCP** (`/context7-mcp`) | Resolves modern library references and canonical API contracts across packages. |
| **Code Review & Adversarial Critique** (`/code-review-and-quality`, `/adversarial-critique`) | Dialectical Builder-Critic loop, zero code mutations during audit, cross-segment blast radius analysis, and real-world failure mode anticipation. |
| **`AGENTS.md` Rule 7** | Active pre-production posture: direct DDL authority, zero dead-weight, clean schemas, no legacy backward-compatibility overhead. |

---

## 3. Complete Codebase & Documentation Partitioning (7 Decoupled Segments)

The entire codebase (all 71 source files in `src/`, root configurations, and `docs/` suite) is partitioned into 7 decoupled segments without overlap or omission:

```
========================================================================================================================
SEGMENT 01: Data Calculation, Aggregation & Shared Data Loader
------------------------------------------------------------------------------------------------------------------------
Target Source Files:
  - src/lib/report-utils.ts
  - src/lib/report-utils.test.ts
  - src/lib/report-data-loader.ts
  - src/lib/report-data-loader.test.ts
  - src/lib/date-utils.ts
  - src/lib/date-utils.test.ts
Target Documentation:
  - docs/TECHNICAL_MANUAL.md (Chapters 1.4, 2.2, 3)
  - docs/ADR/014-mathematical-aggregation-parity-and-zero-dead-weight.md
  - docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md
  - docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md
  - docs/ADR/022-issue-register-decisions-routing-periods-and-ci.md
  - docs/ADR/025-core-infrastructure-sumrows-hardening-compute-proximity-and-shared-data-loader.md
  - docs/ADR/028-track-2-core-save-machine-concurrency-and-numeral-normalization.md
  - docs/KNOWN_ISSUES.md (KI-005, KI-006, KI-014, KI-015, KI-021)
Core Focus:
  - Mathematical aggregation parity: weighted mean attendance vs raw summing
  - Stock vs flow aggregation (snapshot of latest month inventory vs flow sum)
  - Bengali numeral parsing (parseBangladeshiNumber, voice-typing suffixes, comma-blindness)
  - Timezone calculations (Asia/Dhaka), month boundaries, UTC+6 math fallback
  - Shared data loading bundle (loadReportDataBundle) query consolidation
  - Rule 7 Scrutiny: Why parse strings and polyfill data in JS when PostgreSQL views, generated columns, or clean SQL queries can do it natively?

========================================================================================================================
SEGMENT 02: Save Machine, Autosave Lifecycle, Concurrency & State Machine
------------------------------------------------------------------------------------------------------------------------
Target Source Files:
  - src/components/report/report-context.tsx
  - src/components/report/auto-save-field.tsx
  - src/components/report/auto-save-indicator.tsx
  - src/components/report/view-mode-toggle.tsx
Target Documentation:
  - docs/TECHNICAL_MANUAL.md (Chapter 4.2)
  - docs/ADR/005-hybrid-state-persistence-and-compact-view-toggle-architecture.md
  - docs/ADR/015-sprint-1-save-integrity-and-input-normalization.md
  - docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md
  - docs/ADR/020-track-1-quick-wins-and-input-normalization.md
  - docs/ADR/026-behavioral-stability-unmount-dirty-flush-role-hierarchy-and-foic-elimination.md
  - docs/ADR/028-track-2-core-save-machine-concurrency-and-numeral-normalization.md
  - docs/KNOWN_ISSUES.md (KI-008, KI-009, KI-014, RS-20, RS-24, RS-25)
Core Focus:
  - Auto-save engine, debounce timing (1000ms idle vs blur vs exit flush)
  - Concurrency & race condition mitigation: monotonic per-field sequence counters (fieldSequenceRef), activeReportIdRef
  - Write-Ahead Buffer (localStorage write-ahead buffer draft:${reportId}:${fieldKey})
  - Field error tracking (failedFields scoped by composite key), retry engine (retryAllFailed)
  - Unmount flush integrity (dirtyRef, latestValueRef, beforeunload, visibilitychange)
  - Pre-flight submission drain (drainPendingSaves)
  - Rule 7 Scrutiny: Is the save machine over-engineered to compensate for missing server-side transactional guarantees or unconstrained dirty states? Can state management be drastically simplified?

========================================================================================================================
SEGMENT 03: Form Ergonomics, Matrix Inputs & Section Presentation
------------------------------------------------------------------------------------------------------------------------
Target Source Files:
  - src/components/report/sections/report-header-form.tsx
  - src/components/report/sections/courses-form.tsx
  - src/components/report/sections/organizational-form.tsx
  - src/components/report/sections/personal-form.tsx
  - src/components/report/sections/meetings-form.tsx
  - src/components/report/sections/extras-form.tsx
  - src/components/report/sections/comments-form.tsx
Target Documentation:
  - docs/TECHNICAL_MANUAL.md (Chapters 2.3, 5)
  - docs/ADR/004-dynamic-responsive-tables-and-transparent-stats-architecture.md
  - docs/ADR/007-authoritative-labeling-harmonization-and-2-page-landscape-pdf-architecture.md
  - docs/ADR/010-edit-report-override-constraint-and-display.md
  - docs/ADR/015-sprint-1-save-integrity-and-input-normalization.md
  - docs/ADR/020-track-1-quick-wins-and-input-normalization.md
  - docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md
  - docs/ADR/026-behavioral-stability-unmount-dirty-flush-role-hierarchy-and-foic-elimination.md
  - docs/ADR/027-track-1-database-ddl-rls-hardening-and-storage-hygiene.md
  - docs/ADR/030-track-4-canonical-navigation-user-provider-and-adaptive-pdf.md
  - docs/KNOWN_ISSUES.md (Mobile Touch Target Ergonomics, RS-30, RS-32, RS-34, RS-66)
Core Focus:
  - 7 section form implementations and matrix rendering structures
  - Table view vs Card view (accordions, openCards)
  - Transposed matrix table in Personal section (personal-form.tsx) and dynamic blur-derived total column (সর্বমোট)
  - Two-layered header structures in Courses and Meetings
  - Custom meeting name row (অন্যান্য + meeting_name storage)
  - Mobile touch floor (WCAG 44px vs 36px dense matrix trade-off)
  - Bengali text rendering, input labels (aria-label, deterministic id/htmlFor), enterKeyHint="next"
  - Submission confirmation modal and lock in comments-form.tsx
  - Rule 7 Scrutiny: Are there remaining dual-string fallbacks or category name polyfills? Are forms fighting the database schema? Can category keys be simplified to pure canonical identifiers?

========================================================================================================================
SEGMENT 04: Auth, Access Control, Security & Zone Management
------------------------------------------------------------------------------------------------------------------------
Target Source Files:
  - middleware.ts
  - src/app/auth/callback/route.ts
  - src/app/auth/logout/route.ts
  - src/app/home/page.tsx
  - src/app/home/actions.ts
  - src/app/forgot-password/page.tsx
  - src/app/forgot-password/actions.ts
  - src/app/update-password/page.tsx
  - src/app/update-password/actions.ts
  - src/app/pending-approval/page.tsx
  - src/components/auth/auth-portal-client.tsx
  - src/components/auth/google-sign-in-button.tsx
  - src/components/auth/register-form-client.tsx
  - src/lib/auth-utils.ts
  - src/lib/auth-utils.test.ts
  - src/lib/rate-limit.ts
Target Documentation:
  - docs/TECHNICAL_MANUAL.md (Chapters 1.3, 1.4, 4.1)
  - docs/ADR/003-postgres-trigger-synchronized-profiles.md
  - docs/ADR/008-unified-home-portal-and-collapsible-settings-architecture.md
  - docs/ADR/016-database-integrity-view-security-and-auth-localization.md
  - docs/ADR/017-google-oauth-and-twa-apk-packaging.md
  - docs/ADR/020-track-1-quick-wins-and-input-normalization.md
  - docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md
  - docs/ADR/023-database-hardening-rls-optimization-and-schema-agility.md
  - docs/ADR/027-track-1-database-ddl-rls-hardening-and-storage-hygiene.md
  - docs/ADR/029-track-3-auth-security-cookie-forwarding-and-server-actions.md
  - docs/KNOWN_ISSUES.md (KI-003, KI-013, KI-016, KI-023, RS-42, RS-43, RS-44, RS-45, RS-46, RS-47, RS-48)
Core Focus:
  - Route protection in middleware.ts (public vs protected, admin approval gate, cookie forwarding on all redirect/json exits)
  - Dual auth identifier resolution (Email vs User ID)
  - Account approval workflow (people.active = false -> /pending-approval)
  - Rate limiting (in-memory sliding window, CGNAT carrier resilience, fail-open verification)
  - Open-redirect and message sanitization (sanitizeAuthMessage)
  - Google OAuth flow, trigger resilience, null zone_id handling
  - Role hierarchy and zone management actions (createZoneAction, deleteZoneAction, protecting Zone 1 DCS)
  - Rule 7 Scrutiny: Why maintain dummy auth sinks or complex auth resolvers? Can user provisioning and profile synchronization be fully delegated to hardened PostgreSQL triggers and RLS?

========================================================================================================================
SEGMENT 05: Routing, Canonical Navigation, Layout & Providers
------------------------------------------------------------------------------------------------------------------------
Target Source Files:
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/error.tsx
  - src/app/loading.tsx
  - src/app/not-found.tsx
  - src/app/[...not-found]/page.tsx
  - src/app/report/page.tsx
  - src/app/report/[section]/page.tsx
  - src/components/report/section-layout.tsx
  - src/components/dashboard/period-selector.tsx
  - src/components/dashboard/user-dashboard.tsx
  - src/components/layout/navbar.tsx
  - src/components/layout/bottom-nav.tsx
  - src/components/layout/user-dropdown.tsx
  - src/components/layout/language-toggle.tsx
  - src/components/layout/theme-toggle.tsx
  - src/components/layout/appearance-footer-toggle.tsx
  - src/components/providers/user-provider.tsx
  - src/components/providers/language-provider.tsx
  - src/components/providers/theme-provider.tsx
Target Documentation:
  - docs/TECHNICAL_MANUAL.md (Chapters 1.3, 4.2, 5)
  - docs/ADR/006-url-only-period-state-simplification.md
  - docs/ADR/008-unified-home-portal-and-collapsible-settings-architecture.md
  - docs/ADR/011-universal-click-outside-modal-governance.md
  - docs/ADR/012-route-group-simplification-submission-governance-and-city-report-parity.md
  - docs/ADR/020-track-1-quick-wins-and-input-normalization.md
  - docs/ADR/022-issue-register-decisions-routing-periods-and-ci.md
  - docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md
  - docs/ADR/026-behavioral-stability-unmount-dirty-flush-role-hierarchy-and-foic-elimination.md
  - docs/ADR/030-track-4-canonical-navigation-user-provider-and-adaptive-pdf.md
  - docs/KNOWN_ISSUES.md (RS-05, RS-22, RS-23, RS-51, RS-60, RS-66, RS-67)
Core Focus:
  - Canonical reportId navigation (/report/[section]?reportId=42) vs 3-tuple parameter fallbacks
  - Unified <UserProvider> architecture and single onAuthStateChange subscription
  - Layout rendering, mobile navigation bar clearance (calc(10.5rem + env(safe-area-inset-bottom)))
  - Period resolution and selector UI (Month, Quarter, Half-Year, Annual, Custom Range)
  - Zero FOIC (Flash of Incorrect Content/Language) via server cookie reading
  - Navigation drawer, modal dismissal governance, error and loading boundaries
  - Rule 7 Scrutiny: Does canonical navigation still retain fallback branches for old prototype URLs? Are there redundant providers or duplicated route trees?

========================================================================================================================
SEGMENT 06: Admin Workflows, City Report Overrides & Export Engines
------------------------------------------------------------------------------------------------------------------------
Target Source Files:
  - src/app/(admin)/layout.tsx
  - src/app/(admin)/dashboard/page.tsx
  - src/app/(admin)/reports/page.tsx
  - src/app/(admin)/city-report/page.tsx
  - src/app/(admin)/management/page.tsx
  - src/app/(admin)/management/actions.ts
  - src/components/admin/correction-button.tsx
  - src/app/api/export/pdf/route.tsx
  - src/app/api/export/excel/route.ts
  - src/app/help/page.tsx
  - src/app/help/help-diagram-client.tsx
Target Documentation:
  - docs/TECHNICAL_MANUAL.md (Chapters 1.2, 2.1, 4.3)
  - docs/ADR/007-authoritative-labeling-harmonization-and-2-page-landscape-pdf-architecture.md
  - docs/ADR/009-zone-hierarchy-type-column-and-admin-site-restructure.md
  - docs/ADR/010-edit-report-override-constraint-and-display.md
  - docs/ADR/012-route-group-simplification-submission-governance-and-city-report-parity.md
  - docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md
  - docs/ADR/019-simplified-role-gated-workflow-diagram-help-architecture.md
  - docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md
  - docs/ADR/022-issue-register-decisions-routing-periods-and-ci.md
  - docs/ADR/023-database-hardening-rls-optimization-and-schema-agility.md
  - docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md
  - docs/ADR/026-behavioral-stability-unmount-dirty-flush-role-hierarchy-and-foic-elimination.md
  - docs/ADR/027-track-1-database-ddl-rls-hardening-and-storage-hygiene.md
  - docs/ADR/028-track-2-core-save-machine-concurrency-and-numeral-normalization.md
  - docs/ADR/030-track-4-canonical-navigation-user-provider-and-adaptive-pdf.md
  - docs/KNOWN_ISSUES.md (KI-010, KI-017, KI-021, RS-01, RS-02, RS-06, RS-08, RS-09, RS-64, C05-01, C05-04, C06-01)
Core Focus:
  - Admin portal routes (/dashboard, /reports, /city-report, /management)
  - City report aggregation, override management (city_report_override 7-column unique key, CorrectionButton, revert actions)
  - User management, zone assignment, deletion guardrails (protecting Zone 1 DCS and superadmins)
  - Document export pipeline: Landscape PDF (2-page vs 3-page adaptive layout engine, font registration, Maktab/Safar summary side-by-side) and Excel spreadsheet exporter
  - RFC 6266 / RFC 5987 header compliance (filename*=UTF-8''...)
  - Help diagrams and operational guide synchronization
  - Rule 7 Scrutiny: Why calculate city report overrides and aggregations in custom TypeScript code instead of relying on PostgreSQL views or database functions? Are there obsolete prototype components or duplicate export pipelines?

========================================================================================================================
SEGMENT 07: Database Schemas, DDL Invariants, RLS Policies, Build/Infra & Documentation
------------------------------------------------------------------------------------------------------------------------
Target Source Files & Infra:
  - src/utils/supabase/client.ts
  - src/utils/supabase/server.ts
  - src/lib/utils.ts
  - src/lib/version.ts
  - src/lib/i18n.ts
  - src/app/globals.css
  - src/app/manifest.ts
  - src/app/icon.tsx
  - next.config.mjs
  - postcss.config.js
  - eslint.config.mjs
  - tsconfig.json
  - package.json
  - twa-manifest.json
  - vercel.json
  - .github/workflows/ci.yml
  - .github/workflows/build-apk.yml
  - .github/workflows/backup.yml
Target Documentation:
  - docs/TECHNICAL_MANUAL.md (Entire Manual)
  - docs/ROADMAP.md (Entire Roadmap)
  - docs/KNOWN_ISSUES.md (Entire Register)
  - docs/report-submission-issue-register.md
  - docs/pre-production-cleanup-plan.md
  - docs/pre-production-schema-cleanup-backlog.md
  - docs/ADR/* (ADR 001 through 030)
Core Focus:
  - Database schema invariants, singular naming conventions (people, zone, report, report_*)
  - RLS security (security_invoker = true, statement-level caching with is_admin() and get_user_zone_id())
  - Zero dead-weight in schema (verifying dead tables/views/functions are dropped)
  - Unicode Nukta normalization (U+09DF precomposed vs U+09AF U+09BC decomposed) and database exclusion constraints
  - Serverless compute proximity (vercel.json pinned to syd1) and font asset bundling (outputFileTracingIncludes)
  - Build pipeline, CI automation, Android TWA APK packaging, automated backup retention engine
  - Documentation suite consistency, source-of-truth hierarchy, ADR continuity, semantic versioning
  - Rule 7 Scrutiny: Is the database schema fully normalized and leveraging PostgreSQL features directly? Are there obsolete documentation items or todo lists tracking old compromises that should be wiped clean?
========================================================================================================================
```

---

## 4. Master Prompt Template A: Lead Investigator (Agent 1)

```markdown
You are Subagent A (Lead Investigator) auditing **Segment {{SEGMENT_ID}}: {{SEGMENT_NAME}}** of the `report-submission` system.

### 🎯 Mission Posture & Role
You are conducting an exhaustive, zero-implementation architectural and behavioral audit. You must NOT modify any code in `src/`. Your deliverable is an authoritative, high-density critique report saved directly to:
`docs/pre-production-critique/segment-{{SEGMENT_ID}}-investigation.md`

### 📜 Master Operating Directive: Pre-Production Agility & Zero Dead-Weight (`AGENTS.md` Rule 7)
The system is in active pre-production development with **zero live field workers**. Under Rule 7:
1. **No Defensive Polyfills or Shims**: If a bug or limitation was historically handled by application-layer polyfills (defensive queries, dual-string category matchers, array-index spoofing, or in-memory reshaping), flag it as **pre-production bloatware**. Propose clean, direct database schema changes (DDL) or architectural consolidation.
2. **Zero Dead-Weight**: Audit every target file for obsolete components, dead functions, unused variables, and deprecated TODOs. If a file or helper can be purged without loss of functionality, recommend its immediate quarantine and removal.
3. **Re-evaluate Legacy Issues**: Inspect the documented issues in `docs/KNOWN_ISSUES.md`, `ROADMAP.md`, and `ADR/*` that touch this segment. Are they obsolete workarounds for problems that clean DDL or modern architecture already solves?

### 🔬 5-Layer Behavioral Audit Directives (`/behavioral-audit`)
Trace data end-to-end across all 5 architectural layers:
- **Layer 1 (DOM & Matrix UI)**: Uncontrolled vs controlled input state, keyboard event traps, blur vs focus races, layout shifts (CLS), and mobile soft-keyboard view adjustments.
- **Layer 2 (Client State & Context)**: Context provider re-render frequency, memoization breaks (`useMemo`, `useCallback`), stale closures in callbacks, and unmount persistence loss.
- **Layer 3 (Server Actions, Middleware & API)**: Auth session cookie forwarding, rate-limiting boundaries, parameter validation, role-hierarchy enforcement, and unhandled Promise rejections.
- **Layer 4 (Database Schemas & RLS)**: Singular table invariants, foreign key index coverage, statement-level RLS caching, check constraints, and unique key collisions.
- **Layer 5 (Document Exports & Views)**: Aggregation parity between UI, PDF, and Excel, print point budgeting, font registration, and RFC 6266 header encoding.

### 🎨 Impeccable UI/UX & Mobile Ergonomics Directives (`/impeccable`, `/design-taste-frontend`)
- **Touch Target Floor**: Scrutinize touch targets against the WCAG 44px x 44px mobile floor. Where dense matrix inputs use `h-9` (36px), evaluate whether tap padding (`py-1`, negative margins, or expanded hitboxes) can preserve compact visual density while preventing touch errors.
- **Layout Shift (CLS) & FOIC**: Detect any Flash of Incorrect Content or Language during mount.
- **Responsive Scannability**: Verify horizontal overflow handling (`overflow-x-auto`, sticky first columns) on 320px–375px mobile viewports.

### ⚖️ Multi-Option Planning & Competing Alternatives (`AGENTS.md` Rule 2 & Rule 6)
For every non-trivial defect or bloatware item discovered:
- Formulate **at least 2 to 3 distinct solution approaches** (e.g. Minimal Application Patch vs. Clean Database DDL / Schema Migration vs. Deep Architectural Consolidation).
- Explicitly evaluate real technical trade-offs (benefits vs. real risks: race conditions, memory leaks, performance overhead).
- **Banned trivial cons**: NEVER cite normal development steps (*"creates a new file"*, *"adds boilerplate"*) as reasons not to implement a clean architecture.

---

### 📂 Your Assigned Scope:
**Target Source Files & Configurations**:
{{TARGET_SOURCE_FILES}}

**Relevant Documentation & Historical Context**:
{{TARGET_DOCS_FILES}}

**Domain-Specific Focal Invariants & Risks**:
{{DOMAIN_SPECIFIC_FOCUS}}

**Rule 7 Pre-Production Scrutiny Questions**:
{{RULE_7_SCRUTINY_QUESTIONS}}

---

### 📝 Required Report Structure (`docs/pre-production-critique/segment-{{SEGMENT_ID}}-investigation.md`)
Your report MUST contain the following structured sections:
1. **Executive Scorecard & Segment Quality Assessment**
   - Letter Grade (A–F) and concise executive summary of the segment's architectural health.
2. **Rule 7 Pre-Production Bloatware & Legacy Shenanigans Register**
   - Table of bloatware items: Ref ID, File & Line, Description, Failure Mode, Clean Pre-Production DDL/Architecture Remedy.
3. **5-Layer Behavioral & Functional Defect Catalog**
   - Exhaustive defect list classified against the 14-bug taxonomy (`WEB-001`–`WEB-014`).
   - Every defect MUST cite exact lines: `file:///path/to/file#L12-L34`, root cause, and failure conditions.
4. **Impeccable UI/UX, Mobile Ergonomics & Accessibility Review**
   - Touch targets, keyboard navigation (`enterKeyHint`), scannability, typography, contrast, and layout shift evaluation.
5. **Cross-Segment Blast Radius & Cohesion Warnings**
   - Explicit analysis of how changes in this segment affect adjacent segments.
6. **Competing Multi-Option Remediation Proposals (Rules 2 & 6)**
   - 2–3 competing alternatives for each critical finding, with comparative trade-off tables and recommended paths.

Persist your report using `write_file`, then send a concise summary message to the coordinator.
```

---

## 5. Master Prompt Template B: Adversarial Reviewer (Agent 2)

```markdown
You are Subagent B (Adversarial Reviewer) auditing **Segment {{SEGMENT_ID}}: {{SEGMENT_NAME}}** of the `report-submission` system.

### 🎯 Mission Posture & Role
You are the critical reviewer applying the **"Adversarial Doubt Gate"** (`AGENTS.md` Rule 2 & Rule 6) to the investigation report prepared by Subagent A (`docs/pre-production-critique/segment-{{SEGMENT_ID}}-investigation.md`). You do NOT write application code. Your deliverable is an authoritative critique and verification report saved directly to:
`docs/pre-production-critique/segment-{{SEGMENT_ID}}-review.md`

### 🛡️ The Adversarial "Doubt Gate" Protocol
Cross-examine every finding and proposal from Subagent A against this fundamental question:
> **"Under what real-world field conditions will this clean-looking code fail?"**

You must evaluate proposals against harsh field realities:
1. **Mobile Field Worker Conditions**: Spotty 2G/3G/4G cellular connections in rural Bangladesh, high latency (>500ms), Carrier-Grade NAT (CGNAT) gateway sharing, sudden connection drops, soft keyboards resizing viewports unpredictably.
2. **Bengali Numeral & Keyboard Quirks**: Voice typing colloquial counters (`জন`, `টি`, `টা`), fullwidth/Arabic commas, Unicode decomposed Nukta characters (`chr(2479)||chr(2492)` vs `chr(2527)`), and ASCII-to-Bengali digit drift.
3. **Database DDL Safety & Existing Row Integrity**: Will proposed DDL migrations (e.g. adding `UNIQUE` constraints or `NOT NULL` columns) crash against existing test records in Supabase? Does an `UPDATE` trigger `duplicate key` errors?
4. **Concurrency & Race Conditions**: In-flight HTTP saves, tab switching while typing, multiple rapid keystrokes, out-of-order response arrivals, and browser unmount flushes.
5. **Cross-Segment Blast Radius**: Does a clean refactor in this segment silently break export routes, admin city aggregations, navigation stepper state, or RLS statement caching?

### 🚫 False-Positive & Strawman Filter
- **Filter Out Trivial Objections**: If Subagent A raised concerns about cosmetic code style or trivial nitpicks that do not affect correctness, reliability, or user experience, explicitly discharge them as **False Positives**.
- **Reject Speculative Architecture**: If Subagent A proposed adding complex abstraction layers, speculative generic helpers, or redundant wrappers, reject them under `AGENTS.md` Rule 2.5 (Favor Simplicity).
- **Enforce Rule 7 (Pre-Production Agility)**: Ensure Subagent A did NOT propose application-layer polyfills to avoid database DDL. If Subagent A tried to preserve backward compatibility for an obsolete prototype or old URL parameter, strike it down and enforce clean DDL.

---

### 📂 Your Assigned Scope:
**Primary Investigation to Review**:
`docs/pre-production-critique/segment-{{SEGMENT_ID}}-investigation.md`

**Target Source Files & Configurations**:
{{TARGET_SOURCE_FILES}}

**Relevant Documentation & Historical Context**:
{{TARGET_DOCS_FILES}}

**Focal Adversarial Checkpoints**:
{{ADVERSARIAL_CHECKPOINTS}}

---

### 📝 Required Review Report Structure (`docs/pre-production-critique/segment-{{SEGMENT_ID}}-review.md`)
Your report MUST contain the following structured sections:
1. **Adversarial Verdict & Quality Scorecard Validation**
   - Overall verdict: `APPROVED`, `APPROVED WITH AMENDMENTS`, or `REJECTED / REQUIRES RE-INVESTIGATION`.
   - Critical evaluation of Subagent A's findings.
2. **False Positives & Over-Engineered Proposals Discharged**
   - Detailed breakdown of findings by Subagent A that were dismissed, with explicit technical justifications.
3. **Intercepted Implementation Traps & Real-World Failure Modes**
   - Documented real-world conditions under which Subagent A's proposals would crash or corrupt data (e.g. mobile race conditions, CGNAT lockouts, DDL unique key collisions, Unicode byte mismatch).
4. **Cross-Segment Blast Radius & Cohesion Verification**
   - Exhaustive analysis of upstream and downstream dependencies. Verification that changes in Segment {{SEGMENT_ID}} do not destabilize other segments.
5. **Final Hardened Pre-Production Action Plan**
   - Prioritized, battle-tested roadmap:
     - Tier 1: Clean Database Schema & DDL Changes
     - Tier 2: Application Architecture & State Machine Consolidation
     - Tier 3: UI/UX, Mobile Ergonomics & Accessibility Refinements
     - Tier 4: Documentation Suite Reconciliations

Persist your report using `write_file`, then send a concise summary message to the coordinator.
```

---

## 6. Segment-Specific Parameters & Deep-Dive Directives

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 01: DATA CALCULATION, AGGREGATION & SHARED DATA LOADER            -->
<!-- ========================================================================= -->
```

### Segment 01 Specification
- **Segment ID**: `01`
- **Segment Name**: `Data Calculation, Aggregation & Shared Data Loader`
- **Target Source Files**:
  - `src/lib/report-utils.ts`
  - `src/lib/report-utils.test.ts`
  - `src/lib/report-data-loader.ts`
  - `src/lib/report-data-loader.test.ts`
  - `src/lib/date-utils.ts`
  - `src/lib/date-utils.test.ts`
- **Target Documentation**:
  - `docs/TECHNICAL_MANUAL.md` (Chapters 1.4, 2.2, 3)
  - `docs/ADR/014-mathematical-aggregation-parity-and-zero-dead-weight.md`
  - `docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md`
  - `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`
  - `docs/ADR/022-issue-register-decisions-routing-periods-and-ci.md`
  - `docs/ADR/025-core-infrastructure-sumrows-hardening-compute-proximity-and-shared-data-loader.md`
  - `docs/ADR/028-track-2-core-save-machine-concurrency-and-numeral-normalization.md`
  - `docs/KNOWN_ISSUES.md` (`KI-005`, `KI-006`, `KI-014`, `KI-015`, `KI-021`)

#### Domain-Specific Focus & Invariants:
1. **Mathematical Aggregation Parity**:
   - `sumRows()` weighted average attendance calculation: verify `sum(avg * count) / sum(count)` across single-zone multi-month periods and city-wide multi-zone aggregations. Ensure division by zero defaults cleanly to `0`.
   - String concatenation defense: ensure `toFiniteNumber()` strictly converts numeric strings and Bengali numerals without string concatenation (`"5" + 3 = "53"`).
   - Text accumulator protection: ensure string fields (e.g. `meeting_name`, `comments`, `course_name`) are never coerced into `0` or `NaN`.
2. **Stock vs. Flow Aggregation**:
   - `sumHeaderRows()` snapshot selection: static inventory counts (`total_muallima`, `total_unit`, `certified_muallima`) must select the latest month's snapshot, while flow metrics (`increase`, `decrease`) must sum cumulatively.
   - Verify parent `report.month` attachment in `report-data-loader.ts` so chronological sorting never fails.
3. **Bangladeshi Mobile Numeral Normalization**:
   - `parseBangladeshiNumber()`: verify stripping of colloquial voice-typing suffixes (`জন`, `টি`, `টা`, `খানা`, `খানি`) and punctuation characters (Arabic comma `،` `U+060C`, thousand separator `٬` `U+066C`, fullwidth comma `，` `U+FF0C`).
4. **Timezone & Temporal Boundaries**:
   - `date-utils.ts`: evaluate `Asia/Dhaka` timezone calculations (`getDhakaDate`, `getDhakaMonth`, `getDhakaYear`). Ensure 6-hour UTC offset never creates future-period lockouts or aggregation skews.

#### Rule 7 Pre-Production Scrutiny:
- Why are complex aggregation calculations performed in client-side / serverless JavaScript instead of leveraging PostgreSQL aggregation views (`view_city_*_agg`) or stored SQL functions?
- Are there residual dual-string lookups or category aliases in `report-utils.ts` or `report-data-loader.ts` that exist only because database records were historically inconsistent?
- Can `loadReportDataBundle()` be further streamlined by defining exact SQL view projections rather than assembling joins and in-memory overrides in TypeScript?

#### Adversarial Checkpoints for Subagent B:
- **Zero Attendance Division**: When total count is `0`, does weighted average return `NaN` or crash PDF export?
- **Comma Truncation Trap**: Does `parseBangladeshiNumber("150,000")` return `1` or `150000`?
- **Month Snapshot Ordering**: If reports arrive out of order from PostgREST, does `sumHeaderRows()` sort by numeric month (`1` to `12`) or alphabetic string (`"1"`, `"10"`, `"2"`)?

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 02: SAVE MACHINE, AUTOSAVE LIFECYCLE, CONCURRENCY & STATE MACHINE -->
<!-- ========================================================================= -->
```

### Segment 02 Specification
- **Segment ID**: `02`
- **Segment Name**: `Save Machine, Autosave Lifecycle, Concurrency & State Machine`
- **Target Source Files**:
  - `src/components/report/report-context.tsx`
  - `src/components/report/auto-save-field.tsx`
  - `src/components/report/auto-save-indicator.tsx`
  - `src/components/report/view-mode-toggle.tsx`
- **Target Documentation**:
  - `docs/TECHNICAL_MANUAL.md` (Chapter 4.2)
  - `docs/ADR/005-hybrid-state-persistence-and-compact-view-toggle-architecture.md`
  - `docs/ADR/015-sprint-1-save-integrity-and-input-normalization.md`
  - `docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md`
  - `docs/ADR/020-track-1-quick-wins-and-input-normalization.md`
  - `docs/ADR/026-behavioral-stability-unmount-dirty-flush-role-hierarchy-and-foic-elimination.md`
  - `docs/ADR/028-track-2-core-save-machine-concurrency-and-numeral-normalization.md`
  - `docs/KNOWN_ISSUES.md` (`KI-008`, `KI-009`, `KI-014`, `RS-20`, `RS-24`, `RS-25`)

#### Domain-Specific Focus & Invariants:
1. **Concurrency & Race Condition Defenses**:
   - Monotonic sequence counter (`fieldSequenceRef.current[fieldKey] = ++seq`): verify that responses from superseded edits are discarded, preventing stale network responses from clobbering recent typing.
   - `activeReportIdRef` isolation: verify that in-flight requests from a previously loaded report are ignored if the user switches reports.
2. **Write-Ahead Buffer & Unmount Flush**:
   - `localStorage` write-ahead buffer (`draft:${reportId}:${fieldKey}`): inspect private browsing / sandbox failure modes. Does `try/catch` wrapping prevent crashes when `localStorage` is disabled?
   - Unmount dirty flush: verify that when mobile workers switch section tabs or collapse cards while typing, `dirtyRef` and `latestValueRef` flush pending edits before unmount without dropping data.
3. **Failure Isolation & Granular Retry**:
   - Composite error dictionary (`failedFields` scoped by `${reportId}:${table}:${category}:${name}`): ensure that a failure in one field never locks or marks unrelated fields as failed.
   - `AutoSaveIndicator` 4-state lifecycle (`saved`, `saving`, `error`, `offline`) and `retryAllFailed()` operational reliability.
4. **Pre-Flight Submission Drain**:
   - `drainPendingSaves(2500)`: verify that before final report submission, all in-flight promises are drained and pending inputs blurred.

#### Rule 7 Pre-Production Scrutiny:
- Is the client-side state machine over-engineered because the database lacks atomic multi-table transaction RPCs? Could a single atomic RPC (`save_report_matrix`) replace optimistic individual cell updates?
- Are there unnecessary abstractions or legacy session cleanup mechanisms lingering in `ReportContext`?
- Can `ViewModeProvider` state be simplified to eliminate re-renders across the section forms?

#### Adversarial Checkpoints for Subagent B:
- **Mobile Keyboard Collapse Trap**: When the user taps "Submit" while an input is focused, does the soft keyboard collapse cause a blur event that races with the submit modal?
- **Rapid Navigation Tab Switch**: If a user enters a number and instantly clicks Section 3 tab within 100ms, does the unmount flush complete before the browser unloads the component?
- **Stale Cache Clashing**: Does `localStorage` draft caching ever restore data from an old reporting year if the user opens the same month a year later?

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 03: FORM ERGONOMICS, MATRIX INPUTS & SECTION PRESENTATION        -->
<!-- ========================================================================= -->
```

### Segment 03 Specification
- **Segment ID**: `03`
- **Segment Name**: `Form Ergonomics, Matrix Inputs & Section Presentation`
- **Target Source Files**:
  - `src/components/report/sections/report-header-form.tsx`
  - `src/components/report/sections/courses-form.tsx`
  - `src/components/report/sections/organizational-form.tsx`
  - `src/components/report/sections/personal-form.tsx`
  - `src/components/report/sections/meetings-form.tsx`
  - `src/components/report/sections/extras-form.tsx`
  - `src/components/report/sections/comments-form.tsx`
- **Target Documentation**:
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

#### Domain-Specific Focus & Invariants:
1. **Section Form Architectures & Dual View Modes**:
   - `PersonalForm`: transposed table mode (7 horizontal metric rows x 3 tier columns) with blur-derived horizontal totals (`সর্বমোট`). Verify 0ms keystroke latency.
   - `CoursesForm` & `MeetingsForm`: two-layered header tables (`viewMode === 'table'`) and single-open collapsible accordions (`viewMode === 'card'`).
   - `MeetingsForm`: custom meeting row (`অন্যান্য` category + `meeting_name` column). Ensure dynamic display replaces "অন্যান্য" when custom title is provided.
   - `CommentsForm`: character limit enforcement (`1500` chars), submission confirmation dialog, and authoritative lock state (`is_submitted`).
2. **Input Ergonomics & Accessibility**:
   - Touch targets: examine dense matrix input heights (`h-9` / 36px) vs. WCAG 44px mobile touch floor. Can touch target padding be expanded without causing horizontal or vertical table bloat?
   - Form accessibility: verify deterministic input IDs (`field-${section}-${table}-${category}-${name}`) and sibling `<label htmlFor={fieldId}>` binding.
   - Mobile keyboard traversal: verify `enterKeyHint="next"` and `inputMode="numeric"`.

#### Rule 7 Pre-Production Scrutiny:
- Are there remaining dual-string category matchers in any of the 7 section forms (e.g. matching legacy Bengali spellings)? Since database rows have been normalized, can these be replaced with strict canonical constants?
- Are multiple nested context providers or state wrappers still present inside individual section forms?
- Can the category strings and metric columns across the 7 forms be represented by a shared TypeScript schema or enum?

#### Adversarial Checkpoints for Subagent B:
- **Accordion Collapse Data Loss**: If a user types into an expanded card and taps another card header to collapse it, does the accordion state toggle drop un-blurred keystrokes?
- **Sticky Column Mobile Obstruction**: On a 320px screen, does the `w-48` sticky left column consume more than 60% of the viewport width, making matrix data entry impossible?
- **Derived Total Lag**: In `personal-form.tsx`, does the "সর্বমোট" column update instantaneously on blur, or does it require an entire page reload?

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 04: AUTH, ACCESS CONTROL, SECURITY & ZONE MANAGEMENT              -->
<!-- ========================================================================= -->
```

### Segment 04 Specification
- **Segment ID**: `04`
- **Segment Name**: `Auth, Access Control, Security & Zone Management`
- **Target Source Files**:
  - `middleware.ts`
  - `src/app/auth/callback/route.ts`
  - `src/app/auth/logout/route.ts`
  - `src/app/home/page.tsx`
  - `src/app/home/actions.ts`
  - `src/app/forgot-password/page.tsx`
  - `src/app/forgot-password/actions.ts`
  - `src/app/update-password/page.tsx`
  - `src/app/update-password/actions.ts`
  - `src/app/pending-approval/page.tsx`
  - `src/components/auth/auth-portal-client.tsx`
  - `src/components/auth/google-sign-in-button.tsx`
  - `src/components/auth/register-form-client.tsx`
  - `src/lib/auth-utils.ts`
  - `src/lib/auth-utils.test.ts`
  - `src/lib/rate-limit.ts`
- **Target Documentation**:
  - `docs/TECHNICAL_MANUAL.md` (Chapters 1.3, 1.4, 4.1)
  - `docs/ADR/003-postgres-trigger-synchronized-profiles.md`
  - `docs/ADR/008-unified-home-portal-and-collapsible-settings-architecture.md`
  - `docs/ADR/016-database-integrity-view-security-and-auth-localization.md`
  - `docs/ADR/017-google-oauth-and-twa-apk-packaging.md`
  - `docs/ADR/020-track-1-quick-wins-and-input-normalization.md`
  - `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`
  - `docs/ADR/023-database-hardening-rls-optimization-and-schema-agility.md`
  - `docs/ADR/027-track-1-database-ddl-rls-hardening-and-storage-hygiene.md`
  - `docs/ADR/029-track-3-auth-security-cookie-forwarding-and-server-actions.md`
  - `docs/KNOWN_ISSUES.md` (`KI-003`, `KI-013`, `KI-016`, `KI-023`, `RS-42`, `RS-43`, `RS-44`, `RS-45`, `RS-46`, `RS-47`, `RS-48`)

#### Domain-Specific Focus & Invariants:
1. **Middleware Route Governance & Cookie Forwarding**:
   - `redirectWithCookies()` and `jsonWithCookies()`: verify that all 5 exit routes in `middleware.ts` forward rotated session cookies (`setAll`), preventing session dropouts.
   - Route protection: public paths (`/home`, `/help`, `/pending-approval`, `/auth/*`) vs protected routes. Ensure `/pending-approval` redirect loop is impossible.
2. **Authentication Flow & Identifier Resolution**:
   - `normalizeAuthIdentifier()`: stripping zero-width spaces/BOM (`[\u200B-\u200D\uFEFF]`), non-breaking spaces, trimming, lowercasing.
   - Dual identifier login: resolving `user_id` to `email` via direct `people` table lookup. Verify dummy auth sink (`unregistered-auth-sink@report.internal`) defense against timing-based user enumeration.
3. **Registration & Approval Gates**:
   - Handling silent Supabase email collisions (`identities.length === 0`).
   - Exclusion of Zone 1 (DCS / City entity) from registration dropdown.
   - Google OAuth sign-in trigger resilience (`handle_new_user()` with null `zone_id` and fallback user ID generation).
4. **Security Hardening & Rate Limiting**:
   - Sliding-window rate limiter in `rate-limit.ts` (availability checks, password resets, login brute-force).
   - Carrier-Grade NAT (CGNAT) resilience: verify that mobile field workers sharing carrier gateway IPs (Grameenphone, Banglalink, Robi) are never locked out of registering.
   - Open redirect & URL message sanitization (`sanitizeAuthMessage()`).

#### Rule 7 Pre-Production Scrutiny:
- Are there residual rewrites or redirects for deleted legacy routes (`/login`, `/register`)?
- Is there any code remaining in the codebase that references the quarantined `session-cleaner.tsx`?
- Can user profile management be unified completely into audited server actions using the service-role client, eliminating direct client write policies on `people`?

#### Adversarial Checkpoints for Subagent B:
- **CGNAT Lockout Trap**: If 20 field workers at a training conference register over mobile cellular data, will the 21st user be blocked by IP rate limiting?
- **Pending Approval Loop**: If an unapproved user clicks "Logout" on `/pending-approval`, does it POST to `/auth/logout` or trigger a circular redirect back to `/pending-approval`?
- **Zone 1 Escalation**: Can an attacker manipulate POST body parameters to register directly under `zone_id = 1` (City / DCS entity)?

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 05: ROUTING, CANONICAL NAVIGATION, LAYOUT & PROVIDERS             -->
<!-- ========================================================================= -->
```

### Segment 05 Specification
- **Segment ID**: `05`
- **Segment Name**: `Routing, Canonical Navigation, Layout & Providers`
- **Target Source Files**:
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
  - `src/app/error.tsx`
  - `src/app/loading.tsx`
  - `src/app/not-found.tsx`
  - `src/app/[...not-found]/page.tsx`
  - `src/app/report/page.tsx`
  - `src/app/report/[section]/page.tsx`
  - `src/components/report/section-layout.tsx`
  - `src/components/dashboard/period-selector.tsx`
  - `src/components/dashboard/user-dashboard.tsx`
  - `src/components/layout/navbar.tsx`
  - `src/components/layout/bottom-nav.tsx`
  - `src/components/layout/user-dropdown.tsx`
  - `src/components/layout/language-toggle.tsx`
  - `src/components/layout/theme-toggle.tsx`
  - `src/components/layout/appearance-footer-toggle.tsx`
  - `src/components/providers/user-provider.tsx`
  - `src/components/providers/language-provider.tsx`
  - `src/components/providers/theme-provider.tsx`
- **Target Documentation**:
  - `docs/TECHNICAL_MANUAL.md` (Chapters 1.3, 4.2, 5)
  - `docs/ADR/006-url-only-period-state-simplification.md`
  - `docs/ADR/008-unified-home-portal-and-collapsible-settings-architecture.md`
  - `docs/ADR/011-universal-click-outside-modal-governance.md`
  - `docs/ADR/012-route-group-simplification-submission-governance-and-city-report-parity.md`
  - `docs/ADR/020-track-1-quick-wins-and-input-normalization.md`
  - `docs/ADR/022-issue-register-decisions-routing-periods-and-ci.md`
  - `docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md`
  - `docs/ADR/026-behavioral-stability-unmount-dirty-flush-role-hierarchy-and-foic-elimination.md`
  - `docs/ADR/030-track-4-canonical-navigation-user-provider-and-adaptive-pdf.md`
  - `docs/KNOWN_ISSUES.md` (`RS-05`, `RS-22`, `RS-23`, `RS-51`, `RS-60`, `RS-66`, `RS-67`)

#### Domain-Specific Focus & Invariants:
1. **Canonical `reportId` Entity Navigation**:
   - Verify `/report/[section]?reportId=42` canonical URL architecture. Does it bypass `get_or_create_report` RPC on tab transitions?
   - Verify fallback resolver: if a user navigates to a bare `/report/[section]`, does it recover gracefully or show a reassuring error card?
   - Admin access to report forms: verify that admins accessing `/report/[section]` are immediately redirected to `/dashboard` (`WEB-006`).
2. **Unified `<UserProvider>` Context & Auth Query Deduplication**:
   - Single `onAuthStateChange` listener mounted in `RootLayout`. Ensure `Navbar`, `BottomNav`, and `UserDropdown` consume `useUser()` with zero duplicate database queries.
   - Profile state caching and graceful handling of unauthenticated visitors.
3. **Physical Viewport Clearance & Layout Ergonomics**:
   - Mobile obstruction defense: verify `SectionLayout` bottom padding `pb-[calc(10.5rem+env(safe-area-inset-bottom,0px))] md:pb-28`. Does it guarantee 36px clearance above mobile `BottomNav` (64px) + fixed stepper bar (76px)?
   - Zero FOIC (Flash of Incorrect Content): verify server-side `app-language` cookie reading in `RootLayout` and passing `initialLanguage` to `<html lang>` and `LanguageProvider`.
4. **Modal & Drawer Governance**:
   - Universal click-outside dismissal: ensure modals and dropdowns close on backdrop click if and only if inputs remain unchanged (`ADR 011`).

#### Rule 7 Pre-Production Scrutiny:
- Are there lingering query parameter parsers or polyfills for the old 3-tuple parameter format (`?type=...&month=...&year=...`)? Under Rule 7, can we enforce canonical `reportId` strictly?
- Can navigation stepper state be derived entirely from the canonical URL without maintaining redundant React context?
- Is there any code remaining in `src/app/page.tsx` that performs unnecessary client-side routing rather than direct server redirects?

#### Adversarial Checkpoints for Subagent B:
- **URL Tampering / Missing Report ID**: If a user manually edits the URL to `/report/personal?reportId=999999` (non-existent report), does the application crash with an unhandled exception or render an accessible error card with retry?
- **Mobile Keyboard Bottom Nav Clipping**: When a mobile keyboard opens, does `BottomNav` remain fixed and cover the active input field?
- **Hydration Mismatch on Language**: Does SSR language cookie resolution match the client-side `localStorage` value, or does it trigger React hydration warnings?

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 06: ADMIN WORKFLOWS, CITY REPORT OVERRIDES & EXPORT ENGINES       -->
<!-- ========================================================================= -->
```

### Segment 06 Specification
- **Segment ID**: `06`
- **Segment Name**: `Admin Workflows, City Report Overrides & Export Engines`
- **Target Source Files**:
  - `src/app/(admin)/layout.tsx`
  - `src/app/(admin)/dashboard/page.tsx`
  - `src/app/(admin)/reports/page.tsx`
  - `src/app/(admin)/city-report/page.tsx`
  - `src/app/(admin)/management/page.tsx`
  - `src/app/(admin)/management/actions.ts`
  - `src/components/admin/correction-button.tsx`
  - `src/app/api/export/pdf/route.tsx`
  - `src/app/api/export/excel/route.ts`
  - `src/app/help/page.tsx`
  - `src/app/help/help-diagram-client.tsx`
- **Target Documentation**:
  - `docs/TECHNICAL_MANUAL.md` (Chapters 1.2, 2.1, 4.3)
  - `docs/ADR/007-authoritative-labeling-harmonization-and-2-page-landscape-pdf-architecture.md`
  - `docs/ADR/009-zone-hierarchy-type-column-and-admin-site-restructure.md`
  - `docs/ADR/010-edit-report-override-constraint-and-display.md`
  - `docs/ADR/012-route-group-simplification-submission-governance-and-city-report-parity.md`
  - `docs/ADR/018-high-severity-reliability-hardening-rs01-rs20-rs22.md`
  - `docs/ADR/019-simplified-role-gated-workflow-diagram-help-architecture.md`
  - `docs/ADR/021-track-4-codebase-cleanup-and-edge-fixes.md`
  - `docs/ADR/022-issue-register-decisions-routing-periods-and-ci.md`
  - `docs/ADR/023-database-hardening-rls-optimization-and-schema-agility.md`
  - `docs/ADR/024-canonical-routing-export-loader-and-pre-production-reconciliation.md`
  - `docs/ADR/026-behavioral-stability-unmount-dirty-flush-role-hierarchy-and-foic-elimination.md`
  - `docs/ADR/027-track-1-database-ddl-rls-hardening-and-storage-hygiene.md`
  - `docs/ADR/028-track-2-core-save-machine-concurrency-and-numeral-normalization.md`
  - `docs/ADR/030-track-4-canonical-navigation-user-provider-and-adaptive-pdf.md`
  - `docs/KNOWN_ISSUES.md` (`KI-010`, `KI-017`, `KI-021`, `RS-01`, `RS-02`, `RS-06`, `RS-08`, `RS-09`, `RS-64`, `C05-01`, `C05-04`, `C06-01`)

#### Domain-Specific Focus & Invariants:
1. **Admin Portal Governance & Role Hierarchy**:
   - `deleteUserAction`: strict server-side authorization check. Standard admins can ONLY delete standard users (`role === 'user'`). Deleting superadmins, self-deletion, and deleting the last remaining superadmin must be unconditionally blocked.
   - `createZoneAction` & `deleteZoneAction`: Zone 1 (DCS) protected against deletion. Dependency verification (`people`, `report`, child `zone`) before deletion.
2. **City Report Aggregation & Overrides**:
   - `city_report_override` 7-column unique key `(year, month, end_month, report_type, section, field, category)`. Verify `CorrectionButton` upsert reliability and revert action (`RotateCcw` button).
   - View Mode vs Edit Mode toggle (`isEditing` state). Ensure highlights and correction triggers render accurately.
3. **Document Export Pipelines (PDF & Excel)**:
   - PDF 2-page print guarantee: landscape A4 page budgeting. Adaptive comments engine (short comments <= 7 lines on Page 2; long comments cleanly dedicated to Page 3 without pushing signatures onto Page 4). Side-by-side Maktab & Safar summary blocks.
   - Font registration & serverless tracing: verify `kalpurush.ttf` path resolution and Next.js NFT bundling.
   - RFC 6266 / RFC 5987 Content-Disposition header formatting (`filename*=UTF-8''...`).
4. **Help System Parity**:
   - Verify terminology synchronization between `/help` and application UI (`নিবন্ধন` vs `সাইন আপ`).

#### Rule 7 Pre-Production Scrutiny:
- Why are city aggregation numbers calculated in route handlers instead of reading directly from PostgreSQL aggregation views (`view_city_*_agg`)?
- Does `CorrectionButton` or `city-report/page.tsx` still retain defensive shims for un-migrated 6-column unique constraints?
- Are there unimported prototype export files or dead mock scripts in `src/app/api/export/`?

#### Adversarial Checkpoints for Subagent B:
- **PDF Comment Height Explosion**: If an admin inputs a 1,500-character comment with 25 manual newline characters, does the PDF exporter overflow onto Page 4 or crash `@react-pdf/renderer`?
- **Serverless Font Missing in Vercel**: In a clean Vercel container deployment, does `/api/export/pdf` throw `ENOENT: no such file or directory, open '.../kalpurush.ttf'`?
- **Revert Override Race**: When an admin reverts an override in `CorrectionButton`, does the UI immediately reflect the recalculated zone total, or does it display stale cached state?

---

```markdown
<!-- ========================================================================= -->
<!-- SEGMENT 07: DATABASE SCHEMAS, DDL, RLS, BUILD/INFRA & DOCUMENTATION       -->
<!-- ========================================================================= -->
```

### Segment 07 Specification
- **Segment ID**: `07`
- **Segment Name**: `Database Schemas, DDL Invariants, RLS Policies, Build/Infra & Documentation`
- **Target Source Files & Infra**:
  - `src/utils/supabase/client.ts`
  - `src/utils/supabase/server.ts`
  - `src/lib/utils.ts`
  - `src/lib/version.ts`
  - `src/lib/i18n.ts`
  - `src/app/globals.css`
  - `src/app/manifest.ts`
  - `src/app/icon.tsx`
  - `next.config.mjs`
  - `postcss.config.js`
  - `eslint.config.mjs`
  - `tsconfig.json`
  - `package.json`
  - `twa-manifest.json`
  - `vercel.json`
  - `.github/workflows/ci.yml`
  - `.github/workflows/build-apk.yml`
  - `.github/workflows/backup.yml`
- **Target Documentation**:
  - `docs/TECHNICAL_MANUAL.md` (Entire Manual)
  - `docs/ROADMAP.md` (Entire Roadmap)
  - `docs/KNOWN_ISSUES.md` (Entire Register)
  - `docs/report-submission-issue-register.md`
  - `docs/pre-production-cleanup-plan.md`
  - `docs/pre-production-schema-cleanup-backlog.md`
  - `docs/ADR/*` (ADR 001 through 030)

#### Domain-Specific Focus & Invariants:
1. **Database Schema & DDL Invariants**:
   - Singular table naming invariant (`people`, `zone`, `report`, `report_header`, `report_course`, `report_organizational`, `report_personal`, `report_meeting`, `report_extra`, `report_comment`, `city_report_override`). Plural names strictly prohibited.
   - RLS statement-level caching: `is_admin()` and `get_user_zone_id()` declared `STABLE SECURITY DEFINER` with `SET search_path = public`. Verify 0 `auth_rls_initplan` warnings.
   - Non-negative `CHECK (col >= 0)` constraints across metric columns.
   - Bengali Unicode Nukta exclusion: `CHECK (position(chr(2492) in category) = 0)` on child tables. Ensure canonical precomposed NFC `U+09DF` ('য়') is enforced.
2. **Infrastructure, Proximity & Build Pipeline**:
   - Serverless compute proximity: `vercel.json` pinned to `"regions": ["syd1"]` (Sydney, Australia) matching Supabase database region (`ap-southeast-2`).
   - Automated GitHub Actions workflows: CI pipeline (`ci.yml`), automated APK build (`build-apk.yml`), and monthly backup retention engine (`backup.yml` with `gzip -9` compression and permanent calendar month snapshotting).
3. **Documentation Suite Reconciliation & Zero Dead-Weight**:
   - Source-of-Truth Hierarchy: `TECHNICAL_MANUAL.md` -> `ADR/*` -> `ROADMAP.md` -> `KNOWN_ISSUES.md` -> Live Code.
   - Audit all documentation for stale references: ensure docs do NOT list phantom files, dead routes, or deprecated shims.
   - Re-evaluate all entries in `KNOWN_ISSUES.md`: which items are obsolete workarounds that should be formally closed or purged?

#### Rule 7 Pre-Production Scrutiny:
- Are there unimported dependencies in `package.json` that should be removed?
- Are there dead tables, views, or functions in PostgreSQL that survived previous cleanup rounds?
- Are there documentation files in `docs/` that track obsolete legacy systems and create cognitive clutter for developers?

#### Adversarial Checkpoints for Subagent B:
- **Backup Retention Logic Trap**: In `.github/workflows/backup.yml`, does the Python retention script accidentally purge the permanent monthly snapshot if the workflow triggers twice in one day?
- **Database Search Path Exploit**: If an RLS function lacks `SET search_path = public`, can a malicious user spoof functions by altering schema precedence?
- **Version Number Drift**: Does `src/lib/version.ts`, `package.json`, and `TECHNICAL_MANUAL.md` maintain 100% semantic version alignment without drift?

---

## 7. Execution Orchestration & Subagent Deployment Plan

The audit will execute systematically across the 7 segments using the 14-agent dialectical pipeline:

```mermaid
flowchart TD
    subgraph Phase 1: Lead Investigation (Subagents 1A - 7A)
        A1[Agent 1A: Calculation & Loader]
        A2[Agent 2A: Save Machine & State]
        A3[Agent 3A: Form Ergonomics & Matrix]
        A4[Agent 4A: Auth, Access & Security]
        A5[Agent 5A: Routing & Navigation]
        A6[Agent 6A: Admin & Exports]
        A7[Agent 7A: DB, Infra & Docs]
    end

    subgraph Output 1: Investigation Reports
        R1[segment-01-investigation.md]
        R2[segment-02-investigation.md]
        R3[segment-03-investigation.md]
        R4[segment-04-investigation.md]
        R5[segment-05-investigation.md]
        R6[segment-06-investigation.md]
        R7[segment-07-investigation.md]
    end

    subgraph Phase 2: Adversarial Doubt Gate (Subagents 1B - 7B)
        B1[Agent 1B: Adversarial Math & Loader Review]
        B2[Agent 2B: Adversarial State Machine Review]
        B3[Agent 3B: Adversarial Form Ergonomics Review]
        B4[Agent 4B: Adversarial Auth & CGNAT Review]
        B5[Agent 5B: Adversarial Routing Review]
        B6[Agent 6B: Adversarial Admin & PDF Review]
        B7[Agent 7B: Adversarial DB & Infra Review]
    end

    subgraph Output 2: Verification Reports & Synthesis
        V1[segment-01-review.md]
        V2[segment-02-review.md]
        V3[segment-03-review.md]
        V4[segment-04-review.md]
        V5[segment-05-review.md]
        V6[segment-06-review.md]
        V7[segment-07-review.md]
        SYN[SUMMARY.md: Master Pre-Production Synthesis]
    end

    A1 --> R1 --> B1 --> V1
    A2 --> R2 --> B2 --> V2
    A3 --> R3 --> B3 --> V3
    A4 --> R4 --> B4 --> V4
    A5 --> R5 --> B5 --> V5
    A6 --> R6 --> B6 --> V6
    A7 --> R7 --> B7 --> V7

    V1 & V2 & V3 & V4 & V5 & V6 & V7 --> SYN
```

All subagents will be invoked by the coordinator with their respective parameterized prompt blocks, strictly adhering to the read-only mandate, the "Doubt Gate" cross-examination, and the pre-production agility posture of `AGENTS.md` Rule 7.

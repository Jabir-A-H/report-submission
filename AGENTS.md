# Report Submission System: AI Agent & Developer Rules

This document defines mandatory operational rules and protocols for all AI agents and developers contributing to the **Report Submission System** (`report-submission`).

## 🎯 Mission
Treat this project as a high-integrity, high-efficiency reporting system where correctness, architectural cleanliness, database performance, and data integrity are higher priority than rapid feature output.

---

## 📌 RULE 1: Mandatory Post-Session Documentation Protocol

> **CRITICAL DIRECTIVE:** You MUST ALWAYS update, reconcile, and optimize the documentation in `docs/` after every coding, debugging, refactoring, or design session before concluding work.

### Antigravity Systemic Docs Directive
When implementation and docs are updated/decided, Antigravity must execute this systemic documentation step:
> *"now add all these info that we decided on and actually implemented into the dcos properly for a complete docs suite. use any skills as needed."*
Run this systemically for docs sync, ADR alignment, roadmap updates, and known-issues cleanup.

At the end of any session or significant milestone:

1. **Update `docs/TECHNICAL_MANUAL.md`**:
   - Reconcile architectural state, database schemas, route governance, client memoization, and UI/UX layout specifications.
   - Ensure singular table names (`people`, `zone`, `report`, `report_*`), RPC signatures (`get_or_create_report`), and auth gating rules (`people.active = true`) match live code.
   - Update chapter sections whenever components, flows, or export engines evolve.

2. **Update `docs/ROADMAP.md`**:
   - Check off completed tasks (`[x]`).
   - Add new audit findings, edge cases, or priority shifts to their respective phases.
   - Keep milestone statuses, progress tracking, and phase tags accurate.

3. **Update `docs/KNOWN_ISSUES.md`**:
   - Move resolved bugs to **Resolved Historical Issues** with discovery date, resolution date, detailed description, and exact fix summary.
   - Maintain active/deferred issue statuses (`KI-xxx`) and immediately document newly discovered edge cases or regressions.

4. **Record Architecture Decisions (`docs/ADR/*`)**:
   - For any significant architectural change, database schema mutation, state pattern shift, or routing overhaul, record a new formal ADR following sequential numbering (`ADR 014+`).
   - Keep existing ADR statuses accurate (`Accepted and Implemented`, `Superseded`, etc.).

5. **Optimize Documentation Quality & Zero Dead-Weight**:
   - Prune obsolete notes, dead code references, or deprecated assumptions.
   - Enforce the **Zero Dead-Weight Policy**: immediately delete all replaced files, orphaned components, unused hooks, and unimported dependencies (`package.json`).
   - Ensure all markdown links (`file:///...`) remain valid and readable.
   - Keep documentation concise, fact-based, and high-density.

---

## 🏛️ RULE 2: Source-of-Truth Order & Architectural Standards

### Source-of-Truth Hierarchy (Mandatory)
1. `docs/TECHNICAL_MANUAL.md`
2. `docs/ADR/*`
3. `docs/ROADMAP.md`
4. `docs/KNOWN_ISSUES.md`
5. Live code when docs and implementation drift

If documentation and code conflict, do not guess. Flag the drift and align docs to implemented reality through explicit updates.

### System Constraints & Rules
- **Singular Table Naming**: All Supabase database tables use exact singular naming: `people`, `zone`, `report`, `report_header`, `report_course`, `report_organizational`, `report_personal`, `report_meeting`, `report_extra`, `report_comment`, `city_report_override`. Plural table names are strictly prohibited.
- **Client Memoization**: All browser Supabase clients must be strictly memoized with `useMemo(() => createClient(), [])` to prevent infinite re-renders and connection thrashing.
- **Auth & Approval Gating**: `src/middleware.ts` is the single source of truth for route protection. All authenticated users must have `active = true` in `people`; unapproved users are routed to `/pending-approval`. Unauthenticated visitors to protected routes are uniformly redirected to `/home`.
- **Canonical Entity Routing & Initialization**: Sub-section navigation uses canonical database pointers (`/report/[section]?reportId=42`). The entry point initializes via `get_or_create_report` once; sub-sections load by `reportId` directly from context or database without re-invoking the RPC on every tab switch.
- **Unified Auth & Profile Context**: Never invoke duplicate `getUser()` or `people` queries across sibling layout components (`Navbar`, `BottomNav`, `UserDropdown`). Consume a single, memoized `UserProvider`.
- **Modern Supabase SSR**: Use `getAll()` / `setAll()` cookie methods exclusively across middleware and server clients.
- **Serverless Compute Proximity**: Pin Vercel serverless function regions (`vercel.json`) to match the Supabase database hosting region (`syd1` for `ap-southeast-2`) to avoid cross-continental network latency cascades.

---

## 🛡️ RULE 3: Pre-Flight Verification & Quality Gates

Before completing any task or ending a work session, execute and verify all four gates:

1. **Linting Check**:
   ```bash
   npm run lint
   ```
   Must pass with 0 errors.

2. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   Must pass with 0 errors.

3. **Unit & Integration Test Suite**:
   ```bash
   npm test
   ```
   Must pass with 0 test failures.

4. **Production Build Verification**:
   ```bash
   npm run build
   ```
   Must compile cleanly with exit code `0` and all static/dynamic routes validated.

---

## 🔒 RULE 4: Execution Discipline & Safety (Mandatory)

1. **Never run `git commit`** (or stage changes in preparation for one) on your own initiative. Finish the assigned goal and stop with changes uncommitted for user review.
2. **Never run destructive git commands** (`git checkout <file>`, `git restore`, `git stash`, `git reset --hard`) without explicit user permission.
3. **Prefer existing MCP servers over custom scripts.** If an MCP tool (e.g. Supabase MCP) covers the functionality, use it directly instead of creating one-off scripts.

---

## 💬 RULE 5: Communication Style

- Be concise, direct, and implementation-specific.
- Prefer concrete file and path references (`file:///...`) over abstract descriptions.
- Never leave partial documentation updates after code changes.

---

## ⚖️ RULE 6: Solution Alternatives, Adversarial Pre-Check & Clean Code Standard (Mandatory)

Before proposing or implementing any bug fix, architectural change, or schema modification:

1. **Formulate Competing Alternatives**:
   - Never present a single, unchallenged local patch.
   - For every non-trivial defect or design choice, formulate at least two distinct solution approaches (e.g. Minimal Application Patch vs. Clean Database Schema / DDL Migration vs. Architectural Consolidation).

2. **Adversarial Stress-Testing ("Doubt Gate")**:
   - Evaluate real-world edge cases: spotty/offline cellular connectivity (mobile field workers), concurrent tab/route navigation, unmount race conditions, memory leaks, form state resets, etc.
   - Cross-examine the proposal against the question: *"Under what field conditions will this clean-looking code fail?"*

3. **Cross-Check All Project Documentation**:
   - Cross-examine assumptions across all relevant project documentation in `docs/` (including `TECHNICAL_MANUAL.md`, active `ADR/*` records, `ROADMAP.md`, `KNOWN_ISSUES.md`, and any active issue registers or planning documents).
   - Verify that architectural invariants (e.g. singular table names, client memoization, canonical routing), historical regressions (preventing re-emergence of resolved `KI-xxx` issues), coupled subsystems, and scheduled roadmap phases are strictly respected.

4. **Present Comparative Trade-offs**:
   - Present the recommended solution alongside the rejected alternative(s), explicitly justifying why the alternative was rejected before asking for user approval.

---

## 🚫 RULE 7: Clean Architecture & Pre-Production Database Agility

The platform is in active pre-production development and has NOT yet launched to live field workers.
- **Schema & DDL Authority**: When a defect or feature requires a database schema change, index addition, or RLS rewrite, **implement the clean DDL directly in Supabase**. Never invent complex application-layer shims, redundant query loops, or data-packing hacks to bypass a needed schema change.
- **Zero Dead-Weight**: Immediately DROP dead tables (`legacy_people`), orphaned functions (`handle_new_auth_user`), and obsolete views (`view_city_course_final`). Delete obsolete client components (`session-cleaner.tsx`) and unimported dependencies (`package.json`).
- **Never compromise architecture for backward compatibility**: Do NOT maintain legacy shims, fallback polyfills, redundant param mappings, or dead data migrations solely to support outdated URLs, old test rows, or past schemas.
- **Prioritize Clean, Direct, Modern Design**: Choose the cleanest, most robust, and highest-density implementation without backward-compatibility overhead.
- When the site officially launches into live production, the project owner will explicitly notify you to activate production backward-compatibility constraints. Until that notice, treat the system as pre-production.

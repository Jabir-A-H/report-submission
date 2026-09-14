# Report Submission System: AI Agent & Developer Rules

This document defines mandatory operational rules and protocols for all AI agents and developers contributing to the **Report Submission System** (`report-submission`).

---

## 📌 RULE 1: Mandatory Post-Session Documentation Protocol

> **CRITICAL DIRECTIVE:** You MUST ALWAYS update, reconcile, and optimize the documentation in `docs/` after every coding, debugging, refactoring, or design session before concluding work.

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
- **Atomic Report Initialization**: All report access must go through the atomic PostgreSQL RPC `get_or_create_report` to eliminate race conditions and missing row states.
- **Hybrid State Persistence**: Preserve period query parameters (`?type=...&month=...&year=...`) across navigation, with explicit session cache clearing on `/auth/logout` and `/home` login.

---

## 🛡️ RULE 3: Pre-Flight Verification & Quality Gates

Before completing any task or ending a work session, execute and verify all three gates:

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

3. **Production Build Verification**:
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

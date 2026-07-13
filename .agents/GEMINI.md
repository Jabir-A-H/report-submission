# GEMINI.md: Report Submission System Operative Guide (Re-audited)

## Mission
Treat this project as a production reporting system where correctness, stability, and data integrity are higher priority than rapid feature output.

---

## Source-of-truth order (mandatory)
1. `docs/TECHNICAL_MANUAL.md`
2. `docs/ADR/*`
3. `docs/ROADMAP.md`
4. `docs/KNOWN_ISSUES.md`
5. Live code when docs and implementation drift

If docs and code conflict, do not guess. Flag the drift and align docs to implemented reality through explicit updates.

---

## System Constraints & Architectural Standards
**All technical constraints, security rules, schema names, client memoization rules, and UI/UX layouts are strictly governed by the docs suite.**
Before making any changes, checking schemas, or designing features, consult:
- **`docs/TECHNICAL_MANUAL.md`**: For auth gating (`people.active = true`), Supabase client separation (`server` vs `client` vs `admin`), atomic report initialization (`get_or_create_report` RPC), schema naming, and UI layouts.
- **`docs/ADR/*`**: For architectural decisions.

---

## Reliability & Pre-Flight Checklist
- Verify browser Supabase clients are memoized (`useMemo`) per `TECHNICAL_MANUAL.md`.
- Verify no auth redirect loop regressions (`/pending-approval` and logout flow).
- Ensure Hybrid State Persistence and Force Purge on login/logout (`ADR 005`) are preserved without regressions.
- Ensure exact singular table naming (`people`, `zone`, `report`, `report_*`) is preserved per `TECHNICAL_MANUAL.md`.
- Update `docs/TECHNICAL_MANUAL.md` or create a new `ADR` when architecture or layout behavior changes.

---

## Antigravity systemic docs directive (mandatory)
When implementation and docs are updated/decided, instruct Antigravity to run this exactly and treat it as a required system step:

> "now add all these info that we decided on and actually implemented into the dcos properly for a complete docs suite. use any skills as needed."

Run this systemically for docs sync, ADR alignment, roadmap updates, and known-issues cleanup.

Global skills location for this workflow:
`F:\WebDev\.agents\skills`

Also check environment context under:
`C:\Users\jabir\.gemini`

---

## Communication style for this project
- Be concise, direct, and implementation-specific.
- Prefer concrete file/path references over abstract recommendations.
- Do not leave partial doc updates after code changes.

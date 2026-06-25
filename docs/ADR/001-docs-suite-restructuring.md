# ADR 001: Transition to Master Manual + Living Trackers Documentation Architecture

**Status**: Accepted  
**Date**: 2026-06-25  
**Author**: Engineering Team  

## Context
The documentation suite previously consisted of ~10 granular markdown files (`ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `USER_FLOW.md`, `ADMIN_FLOW.md`, `API_AND_SERVICES.md`, `DOMAIN_MODEL.md`, `CONVENTIONS.md`, `LEGACY_MAPPING.md`, `MIGRATION_PLAN.md`, `QUICKSTART.md`). 
While granular segregation works for small prototypes, as the Next.js App Router codebase scaled to 250+ fields and complex Supabase client patterns, developers frequently experienced "documentation fragmentation." Updates to database aggregation views or client auth gates were documented in one file while leaving others stale. Furthermore, AI coding agents parsing 10 separate markdown files routinely hit token window degradation or missed cross-cutting constraints.

## Decision
We formally adopt the **Master Manual + Living Trackers** pattern (aligned with the `docs-architect` skill specification):
1. **Authoritative Master Specification (`TECHNICAL_MANUAL.md`)**: A single comprehensive reference synthesizing architecture, vocabulary, database schema, route governance, export services, developer conventions, and mobile design system tokens.
2. **Living Trackers (`ROADMAP.md` & `KNOWN_ISSUES.md`)**: Maintained strictly for dynamic sprint progress, backlog prioritization, and verified technical debt.
3. **Formal Architecture Decision Records (`ADR/`)**: A structured directory tracking immutable architectural trade-offs and structural pivot rationale.
4. **Archival & Pruning**: Deprecated legacy files (`LEGACY_MAPPING.md`, `MIGRATION_PLAN.md`) are moved to `docs/archive/`, and redundant granular specification files are deleted.

## Consequences
### Positive
- **Single Source of Truth**: Developers and AI assistants ingest one cohesive file (`TECHNICAL_MANUAL.md`) to understand the complete technical architecture.
- **Elimination of Stale Drift**: Modifying a domain concept or database schema requires updating exactly one section in one file.
- **Historical Traceability**: Architectural decisions are preserved permanently in numbered ADR markdown files.

### Negative / Mitigations
- **File Length**: `TECHNICAL_MANUAL.md` is ~300+ lines. *Mitigation: Strict Markdown table of contents with anchor links and clear horizontal chapter demarcation.*

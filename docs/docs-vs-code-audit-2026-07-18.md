# Docs vs. Codebase Audit — report-submission
*Generated 2026-07-18, against `main` on GitHub.*

Checked: `docs/TECHNICAL_MANUAL.md`, `docs/ROADMAP.md`, `docs/KNOWN_ISSUES.md`, `README.md`, all 12 files in `docs/ADR/`, and the live `src/` tree, `middleware.ts`, `package.json`/`package-lock.json`.

## Top 2 (fix these first)

1. **A real data-correctness gap has zero documentation.** `src/lib/report-utils.ts:168` has a `TODO` on `sumHeaderRows()`: yearly/quarterly aggregates for snapshot fields (`total_muallima`, `total_unit`, etc.) are currently **summed across months** when they should take the **most recent month's value** instead — meaning any multi-month report view is silently over-counting those specific numbers today. It's the only `TODO`/`FIXME` in the whole codebase, and it appears nowhere in `KNOWN_ISSUES.md`. This is exactly the kind of thing that file exists for.

2. **Docs and lockfile disagree on the Next.js major version, and the reason will keep causing this.** `README.md` and `TECHNICAL_MANUAL.md` both say "Next.js 15+", but `package-lock.json` resolves `next` to **16.2.9**. Root cause: `package.json` pins nearly every core dependency (`next`, `react`, `react-dom`, `tailwindcss`, `typescript`, `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `react-hook-form`, etc.) to `"latest"` rather than a version range. For a project whose own mission statement says correctness/stability outrank feature velocity, that's a live risk — any fresh `npm install` (a new machine, a CI runner, Antigravity itself) can silently cross a major-version boundary. Worth pinning to caret ranges against what's actually running in production, then updating the docs to match.

## Add (real, currently undocumented)

- **`README.md`'s ADR list stops at ADR 003.** It only links `001`–`003`; ADRs `004` through `012` all exist in `docs/ADR/` and aren't linked from the README at all.
- **ADR-011 ("Universal Click-Outside Modal Governance") is never referenced from `TECHNICAL_MANUAL.md` or `ROADMAP.md`.** It's a real, dated (2026-07-17), implemented decision — `ROADMAP.md` Phase 3.6 item 5 describes exactly this behavior, but that phase's heading only cites "ADR 010," so ADR-011 is effectively orphaned from the two docs that are supposed to be authoritative.
- **`TECHNICAL_MANUAL.md:92` cites "ADR 013"** ("Note on Centralization") for the decision to centralize category arrays into `report-utils.ts` — which is a real, implemented decision (verified: `COURSE_CATEGORIES`, `ORG_CATEGORIES`, `PERSONAL_CATEGORIES`, `MEETING_CATEGORIES`, `EXTRA_CATEGORIES`, `sumRows`, `sumHeaderRows`, `getMonthsForPeriod` do all live there) — but no `013` file exists in `docs/ADR/`. Either write the ADR or drop the citation.

## Remove / fix (stale or actually wrong)

- **Every doc link in `README.md`'s "Documentation Suite" section is a local Windows absolute path** (`file:///f:/WebDev/report-submission/docs/...`). These are dead links for anyone else, and dead on GitHub. Should be repo-relative (`docs/TECHNICAL_MANUAL.md`, etc.).
- **`README.md`'s flow description and Mermaid diagram both reference routes that no longer exist**: "Manager registers at `/register`" (folded into `/home?mode=register` per ADR-008) and "activated by an administrator in `/admin/users`" (that page is now `/management`, per the `(admin)` route group restructure / ADR-012).
- **Dead code violating the project's own Zero Dead-Weight Policy**: `src/components/layout/bottom-nav.tsx:63` — `const showAdminNav = isAdmin || pathname.startsWith("/admin")`. Confirmed via full-repo grep: this is the *only* remaining reference to the old `/admin/*` prefix anywhere in `src/`. Since the route group migration dropped that prefix entirely (routes are now `/dashboard`, `/reports`, `/city-report`, `/management`), the `pathname.startsWith("/admin")` half of that condition can never be true again — it's inert leftover from before ADR-012.
- **`TECHNICAL_MANUAL.md:273`** (appendix) says `docs/ADR/` holds "`001` through `011`" — there are actually 12 files, through `012`.
- **`TECHNICAL_MANUAL.md:87`** describes `PERSONAL_CATEGORIES` as `রুকন, কর্মী, সক্রিয় সহযোগী হয়েছেন` — the actual array in `report-utils.ts:81` is `["রুকন", "কর্মী", "সক্রিয় সহযোগী"]` (no `হয়েছেন`). Looks like it got conflated with the separate `PERSONAL_METRICS_ROWS` array, which does have a `সক্রিয় সহযোগী হয়েছেন` label on a different row entirely.
- **`ROADMAP.md` numbering is out of sequence twice**: Phase 3 jumps from item 6 straight to item 8 (no item 7 anywhere), and Phase 3.5 has items `1, 2, 3`, then item `13` ("DCS Read-Only City View") sitting right after item 3, *before* items `4`–`12` even appear under "Active." Purely cosmetic, but confusing to scan.

## Compress

- **`TECHNICAL_MANUAL.md` Chapter 2 (the 7-section breakdown) and Chapter 5.4/5.5** are written at the level of exact Tailwind classes and pixel widths (`w-48` / `192px`, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, etc.) repeated per section. That's a direct restatement of the source rather than architecture — it duplicates what's already in the component files, and it's *why* the `PERSONAL_CATEGORIES` slip above happened: the doc and the code each have their own copy of the same fact, and only one of them got updated. Recommend describing intent ("sticky first column, standardized width across the four table sections") and letting the code own the exact values.

## Self-conflicts / cross-doc mismatches

- Covered above: Next.js version (docs say 15+, lockfile says 16.2.9); ADR-011 and "ADR 013" citation gaps; ADR count off by one.
- **`README.md` labels the nightly `pg_dump` cron as "CI/CD"** ("Deployment & CI/CD: Vercel & GitHub Actions"). There's no build/lint/test workflow in `.github/workflows/` — just the one backup job. Vercel's git-triggered deploys are the actual CD; the GitHub Actions piece is backup automation, not CI.

## Worth knowing, not a docs bug

- `.github/copilot-instructions.md` exists alongside `.agents/rules/GEMINI.md` — a second per-agent rules file outside `.agents/rules/`. If you carry the git-discipline/MCP-preference rules from your GEMINI.md update into other agent files, this one's easy to miss since it's not sitting next to the others.

# AI Audit Double-Verification Summary

**Date:** 2026-10-06
**Reference:** `docs/report-submission-issue-register.md`

## Executive Summary
A strict "double-verification" has been performed on the 43 issues listed in the AI-generated `report-submission-issue-register.md` against the live codebase (`src/`). 

**Verdict:** The AI did **not** hallucinate. The issue register is an exceptionally high-fidelity audit. Every verifiable claim is mathematically rooted in the codebase's React lifecycle flows, component prop passing, and database queries. The statuses (`OPEN-BUG`, `OPEN-DECISION`, `VERIFY-FIRST`, `DEFERRED`) perfectly represent the codebase's current state.

## 1. Critical Data Integrity Flaws (Verified)
* **RS-01, RS-02, & RS-31 (Overrides)**: Overrides for multi-month reports are saved to the wrong month key (the current month instead of month 1), meaning they disappear from aggregations. Clearing a numeric override saves `""`, which coerces to `0`, zeroing out real data.
* **RS-08 (Admin Reports List)**: The admin reports query pulls all rows from `public.report` without filtering by `is_submitted` or data presence. Since reports are minted the moment a user clicks a period, the admin list gets cluttered with empty placeholders.
* **RS-09 (Admin "Unique Zones" Limit)**: The unique zones count relies on a hard `.limit(1000)` on a raw reports query. At ~30 zones × 12 months, this limit will be permanently exceeded in roughly 2.7 years, breaking the count logic.
* **RS-10 (Non-monthly URL Generation)**: Regular users can bypass UI protections via crafted URLs, allowing them to create non-monthly rows that disappear from official aggregations.

## 2. Save Reliability & Architecture Flaws (Verified)
* **RS-20 (Silent Optimistic Failure)**: The global `saveError` state is deeply flawed. If Field A fails to save (e.g., network drop) but Field B succeeds, Field B's success wipes Field A's error message. Field A remains optimistically displayed on-screen, but the data is lost.
* **RS-22 (Swallowed Load Errors)**: `loadReport` catches but swallows Supabase fetch errors. If a fetch fails, it mounts an empty data object, leading users to accidentally overwrite and destroy their existing database records.
* **RS-23 (Nested Provider Remounts)**: The dynamic routing architecture (`[section]`) causes the entire `<ReportProvider>` to completely unmount and remount on every Next/Prev section navigation. This triggers 4 sequential network calls and a full-screen spinner on every tab change, and abandons any pending background saves.

## 3. Localization & UX Issues (Verified)
* **RS-30 (Bengali Numerals Overwritten)**: The autosave logic converts Bengali digits to ASCII (`bnToEn`) to save to the database, but the React `useEffect` forcefully syncs this ASCII value back to the input, overwriting the user's localized text as soon as they click away.
* **RS-42 (Input Normalization in Auth)**: The login action queries `.eq('user_id', rawIdOrEmail)` without trimming whitespace or lowercasing. Mobile keyboards that auto-capitalize the first letter will permanently lock users out.
* **RS-46 (Arbitrary Message Injection)**: The `/home` page accepts any text via `?message=` and renders it. While XSS is prevented by React, it allows for social engineering (e.g., `?message=Account suspended, call the admin`).

## 4. Pending Organizational & Infrastructure Decisions
These issues cannot be resolved purely by modifying the frontend code:
1. **RS-05 (Hardcoded January Starts)**: `getMonthsForPeriod` explicitly ignores `selectedMonth` for quarterly/half-yearly reports. **Decision Needed**: Does the organization want rolling periods (e.g., Q2 = April-June) or strictly cumulative year-to-date checkpoints?
2. **Unverifiable Database State (RS-03, RS-21, RS-73)**: Row Level Security (RLS) policies and SQL View definitions (`view_city_*_agg`) are missing from the repo. Claims regarding RLS `UPDATE` vs `SELECT` mismatches (RS-21) and the absence of a `month` column on `report_header` (RS-03) must be audited directly inside the Supabase dashboard.

## Recommended Next Steps
1. **Phase 1 (Critical)**: Prioritize **RS-20**, **RS-22**, and **RS-23** to prevent silent data loss and fix the severe performance regression on tab navigation.
2. **Phase 2 (Data Integrity)**: Address the data integrity bugs (**RS-01**, **RS-02**) in the Admin City Report dashboard.
3. **Phase 3 (Operational)**: Make an organizational decision on **RS-05** regarding reporting periods, and audit the Supabase dashboard for **RS-03** and **RS-21**.

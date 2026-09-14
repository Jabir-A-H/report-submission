# ADR 014: Mathematical Aggregation Parity, Weighted Averages & Zero Dead-Weight Cleanup

## Date
2026-09-14

## Context
During the comprehensive data correctness audit (September 2026), two critical mathematical aggregation anomalies and package dependency bloat were identified:

1. **Snapshot Inventory Over-Counting in `sumHeaderRows()` (KI-005)**:
   In multi-month views (quarterly, half-yearly, yearly), `sumHeaderRows()` summed all numerical columns across months. However, inventory metrics such as `total_muallima`, `certified_muallima`, and `total_unit` represent static *stock* counts, not delta flows. Summing them across 3 or 12 months inflated inventory figures (e.g. 10 + 12 + 15 resulted in 37 muallimas instead of the true current inventory of 15).
2. **Average Attendance Arithmetic Summation in `sumRows()` (KI-006)**:
   When consolidating meeting rows across multi-month spans or multiple periods, `city_avg_attendance`, `thana_avg_attendance`, and `ward_avg_attendance` were being summed directly. For example, Month 1 with 2 meetings averaging 10 attendees and Month 2 with 3 meetings averaging 15 attendees yielded an aggregate of `25` instead of the mathematically correct weighted mean of `13`.
3. **Unused Dependencies Violating Zero Dead-Weight Policy (KI-012)**:
   `zod`, `react-hook-form`, and `@hookform/resolvers` were declared in `package.json` but never imported anywhere in `src/`.
4. **Lack of Automated Math Verification**:
   The calculation layer in `src/lib/report-utils.ts` had no unit tests, leaving the core business formulas vulnerable to silent regression.

## Decision
We executed the following architectural and mathematical corrections:

1. **Latest-Month Inventory Stock Resolution (`sumHeaderRows()`)**:
   - Categorized header metrics into `HEADER_SNAPSHOT_KEYS` (`total_muallima`, `certified_muallima`, `certified_muallima_taking_classes`, `trained_muallima`, `trained_muallima_taking_classes`, `total_unit`, `units_with_muallima`) and `HEADER_DELTA_KEYS` (`muallima_increase`, `muallima_decrease`).
   - Sorted rows chronologically by month.
   - For snapshot stock fields, the aggregate adopts the value from the most recent month (`latest[k]`).
   - For delta flows (`increase`/`decrease`), values are summed across all months in the period.
2. **Weighted Mean Attendance Calculation (`sumRows()`)**:
   - Paired each attendance average with its corresponding count key (`city_avg_attendance` → `city_count`, `thana_avg_attendance` → `thana_count`, `ward_avg_attendance` → `ward_count`).
   - For each meeting category across periods, calculated weighted mean: $\text{Math.round}(\sum (\text{count} \times \text{avg}) / \sum \text{count})$.
   - Included fallback logic for single-entry edge cases where counts were unrecorded.
3. **Zero Dead-Weight Package Pruning**:
   - Uninstalled `zod`, `react-hook-form`, and `@hookform/resolvers`.
   - Updated `tsconfig.json` target to `es2022` and enabled `allowImportingTsExtensions: true`.
4. **Built-in Automated Testing**:
   - Added `src/lib/report-utils.test.ts` using Node.js native test runner (`node --test`).
   - Registered `"test": "node --test src/lib/report-utils.test.ts"` in `package.json`.
   - Achieved 100% pass rate across 10 unit test cases validating Bengali formatting, period ranges, snapshot retention, and weighted attendance.

## Consequences
- **Positive:** Multi-month quarterly and yearly reports now display mathematically sound stock counts and attendance averages across dashboard, city reports, and PDF/Excel exports.
- **Positive:** Reduced package dependencies and streamlined `node_modules` per the Zero Dead-Weight Policy.
- **Positive:** Automated regression protection is now native to the repository without requiring external heavy test runners.
- **Status:** Accepted and Implemented.

# Migration Plan (DEPRECATED)

> [!WARNING]
> **LEGACY DOCUMENT**: This document describes the migration process from the old system. The migration has been completed. This file is kept for historical reference only.
## Overview
This document outlines the step-by-step strategy for migrating from the legacy Flask system to the modern Next.js + Supabase architecture safely, with zero data loss.

## Phase 1: Foundation & Schema Design
1. **Supabase Initialization**: Spin up the new Supabase project.
2. **Schema Creation**: Map and create tables based on `LEGACY_MAPPING.md`. Ensure default values (`0` for numeric fields) are properly set.
3. **Views Creation**: Write the PostgreSQL Views responsible for city-wide aggregation.
4. **RLS Configuration**: Implement Row Level Security policies to restrict zone data access.

## Phase 2: Frontend MVP (Read/Write)
1. **Authentication**: Implement Next.js + Supabase Auth. Build the Login, Register, and Pending Approval screens.
2. **Dashboard UI**: Build the role-based dashboards (User vs. Admin).
3. **Adaptive Matrix**: Build the 7 form sections with the auto-save functionality and completion badges.
4. **Admin UI**: Build the Zone Management, User Management, and City Report views (including the Override system).

## Phase 3: Data Migration (Dry Run)
1. **Data Export**: Extract a JSON or CSV dump from the legacy PostgreSQL database.
2. **Data Transformation**: Map the legacy IDs to the new Supabase schema UUIDs where applicable.
3. **Data Import**: Push the legacy data into a staging Supabase instance to verify structural integrity and view calculation accuracy.

## Phase 4: Parallel Running & Testing
1. Deploy the Next.js app to Vercel (Staging).
2. Allow a subset of Admins/Users to test the UI, ensuring the Bangla/English toggle and auto-saves perform optimally.
3. Verify the PDF/Excel exports match legacy formatting expectations.

## Phase 5: Production Cutover
1. Put the legacy Flask app into "Read-Only" mode.
2. Perform the final data migration to the Production Supabase instance.
3. Point the main domain to the Vercel deployment.
4. Deprecate the legacy system.

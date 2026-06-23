# Database Schema

## Overview
This system runs on a **managed Supabase PostgreSQL** database. The schema is designed to store the ~250+ fields across 7 report sections efficiently, while heavily leveraging PostgreSQL Views for complex aggregations (e.g., city-wide totals) to ensure high performance on the frontend.

## Tables Overview

### Auth & Users
Supabase handles core authentication via its internal `auth.users` table. Application-specific user data is stored in the public schema.
- **`people`**: Stores user profiles.
  - `id` (Primary Key, Integer)
  - `supabase_uid` (UUID, Foreign Key to `auth.users.id`, `ON DELETE CASCADE` — deleting the auth account automatically removes the profile row)
  - `user_id` (String, Unique constraint, custom ID chosen by the user during registration, e.g., 'sumona' or '002')
  - `name`, `email`, `role` ('user', 'admin', or 'superadmin')
  - `active` (Boolean, defaults to `false`. Requires admin approval for login).
  - `zone_id` (Foreign Key to `zones`)
  
  *Note: A Postgres database trigger (`on_auth_user_created` executing `handle_new_user()`) automatically populates the `people` table securely with the user-submitted custom `user_id` when a new user registers via Supabase Auth.*

- **`legacy_people`**: Backup table containing legacy user profiles and their historical sequential User IDs for reference.

### Core Business Entities
- **`zones`**: Stores the ~14 geographical zones.

### Reports & Sections
Reports are broken down structurally similar to the legacy models.
- **`report`**: The root record for a submitted report.
  - `id`, `zone_id`, `month`, `year`, `report_type` (e.g., মাসিক, ত্রৈমাসিক)
  - **Constraints**: Enforces a `UNIQUE (zone_id, month, year, report_type)` constraint to prevent race conditions and duplicate report generation.

All 7 report sub-tables below have a `report_id` column with a **Foreign Key** to `report.id` (`ON DELETE CASCADE`) — deleting a report automatically removes all its associated section data:
- **`report_headers`**: (মূল তথ্য) Basic info, muallima counts, units.
- **`report_courses`**: (গ্রুপ / কোর্স রিপোর্ট) Course metrics, attendance.
- **`report_organizational`**: (দাওয়াত ও সংগঠন) Organizational invites and metrics.
- **`report_personal`**: (ব্যক্তিগত উদ্যোগে তালিমুল কুরআন) Personal initiative numbers.
- **`report_meetings`**: (বৈঠকসমূহ) Meeting counts and average attendance.
- **`report_extras`**: Additional metrics.
- **`report_comments`**: (মন্তব্য রিপোর্ট) Free-text feedback.

### Overrides
- **`city_report_overrides`**: Allows admins to override calculated city-wide totals.
  - `year`, `month`, `report_type`, `section`, `field`, `value`
  - Replaces aggregated sums dynamically in Views without altering user data.

## PostgreSQL Views (Aggregations)
Instead of calculating city-wide totals on the fly via the Next.js frontend or an API route, the system leverages PostgreSQL views. This keeps aggregation logic at the database layer, allowing for instant query returns.
The system relies on 6 explicit views corresponding to the report sections:
- `view_city_header_agg`
- `view_city_course_agg`
- `view_city_organizational_agg`
- `view_city_personal_agg`
- `view_city_meeting_agg`
- `view_city_extra_agg`

## PostgreSQL Functions (RPC)
To guarantee atomicity and eliminate frontend network overhead during report creation, the system uses a Postgres RPC function:
- **`get_or_create_report`**: Accepts `(p_zone_id, p_year, p_month, p_report_type)`. 
  - **Month Forcing**: If `p_report_type` is not `'মাসিক'`, the function forces `p_month := 1`. This aligns database records consistently by storing all quarterly/yearly reports at month `1` for that year.
  - **Atomicity**: It checks if a matching report exists. If not, it executes a single transactional block to `INSERT` the root `report` row, and immediately `INSERT` zeroed-out seed rows into all 7 child tables (handling 50+ categories total). It safely handles race conditions using `ON CONFLICT DO NOTHING`.

## Row Level Security (RLS)
- **Users**: Can only `SELECT`, `INSERT`, and `UPDATE` reports tied to their `zone_id`.
- **Admins & Superadmins**: Bypass RLS to read all reports and write to the override tables.

*Technical Note on `people` table RLS: To prevent PostgreSQL infinite recursion errors when evaluating policies on the `people` table itself, admin permissions are evaluated using a `SECURITY DEFINER` function (`is_admin()`) rather than querying the `people` table directly within the policy.*

# Database Schema

## Overview
This system runs on a **managed Supabase PostgreSQL** database. The schema is designed to store the ~250+ fields across 7 report sections efficiently, while heavily leveraging PostgreSQL Views for complex aggregations (e.g., city-wide totals) to ensure high performance on the frontend.

## Tables Overview

### Auth & Users
Supabase handles core authentication via its internal `auth.users` table. Application-specific user data is stored in the public schema.
- **`people`**: Stores user profiles.
  - `id` (UUID, maps to auth.users)
  - `user_id` (String, 3-digit sequential ID, e.g., '021')
  - `name`, `email`, `role` ('user' or 'admin')
  - `active` (Boolean, defaults to `false`. Requires admin approval for login).
  - `zone_id` (Foreign Key to `zones`)
  
  *Note: A Postgres database trigger (`on_auth_user_created`) automatically populates the `people` table securely when a new user registers via Supabase Auth, bypassing RLS limitations.*

### Core Business Entities
- **`zones`**: Stores the ~14 geographical zones.

### Reports & Sections
Reports are broken down structurally similar to the legacy models.
- **`reports`**: The root record for a submitted report.
  - `id`, `zone_id`, `month`, `year`, `report_type` (e.g., মাসিক, ত্রৈমাসিক)
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

## Row Level Security (RLS)
- **Users**: Can only `SELECT`, `INSERT`, and `UPDATE` reports tied to their `zone_id`.
- **Admins**: Bypass RLS to read all reports and write to the override tables.

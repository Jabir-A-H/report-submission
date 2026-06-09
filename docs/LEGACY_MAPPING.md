# Legacy Mapping

## Overview
This document maps the legacy Flask/SQLAlchemy definitions (`models.py`) to the new Supabase PostgreSQL schema. While some field names may be tweaked during implementation, the structural mapping remains consistent.

## 1. Authentication & Users
| Legacy SQLAlchemy | New Supabase Table | Notes |
| :--- | :--- | :--- |
| `People` | `people` (Public Schema) | Linked 1:1 with Supabase `auth.users` via UUID. |
| `People.active` | `people.active` | Boolean flag. Determines if the user passed the approval gate. |

## 2. Core Entities
| Legacy SQLAlchemy | New Supabase Table | Notes |
| :--- | :--- | :--- |
| `Zone` | `zones` | Geographical assignments. |
| `Report` | `reports` | Root table. Identifies `month`, `year`, `report_type`, `zone_id`. |

## 3. The 7 Report Sections
The 7 legacy tables correspond directly to the 7 sections on the frontend.
| Legacy SQLAlchemy | New Supabase Table | Section Name |
| :--- | :--- | :--- |
| `ReportHeader` | `report_headers` | ১. মূল তথ্য (Basic Info) |
| `ReportCourse` | `report_courses` | ২. গ্রুপ / কোর্স রিপোর্ট (Group/Course) |
| `ReportOrganizational`| `report_organizational` | ৩. দাওয়াত ও সংগঠন (Dawah & Org) |
| `ReportPersonal` | `report_personal` | ৪. ব্যক্তিগত উদ্যোগে তালিমুল কুরআন (Personal Initiative) |
| `ReportMeeting` | `report_meetings` | ৫. বৈঠকসমূহ (Meetings) |
| `ReportExtra` | `report_extras` | ৬. মক্তব ও সফর রিপোর্ট (Maktab & Travel) |
| `ReportComment` | `report_comments` | ৭. মন্তব্য রিপোর্ট (Comments) |

## 4. Admin Operations
| Legacy SQLAlchemy | New Supabase Table | Notes |
| :--- | :--- | :--- |
| `CityReportOverride`| `city_report_overrides` | Stores Admin overrides for aggregated city sums. |

## Refactoring Notes
- Legacy fields with strict character limits (e.g., `String(100)`) can be relaxed in Supabase (`text` data type) to prevent arbitrary cutoffs unless strict validation is required.
- Legacy integer fields defaulting to `0` are preserved to ensure mathematical aggregations (Views) function correctly without `NULL` errors.

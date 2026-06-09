# Domain Model

## Overview
This document defines the core business concepts, vocabulary, and entities that map real-world operations into system logic. Maintaining this logic is critical to prevent code drift over time.

## 1. Zones & Users
- **Zones**: There are approximately 14 zones. Each zone acts as a geographical partitioning for reports.
- **Users (Zone Managers)**: Users assigned to a specific zone. They log in to enter data for their zone.
- **Admin**: System administrators who oversee all zones, manage users, and generate city-wide (aggregated) reports.

## 2. Report Types
Reports are submitted periodically. The system handles 5 distinct reporting periods:
- **মাসিক** (Monthly)
- **ত্রৈমাসিক** (Quarterly)
- **ষান্মাসিক** (Half-Yearly)
- **নয়-মাসিক** (Nine-Month)
- **বার্ষিক** (Yearly)

## 3. The 7 Report Sections
A complete report consists of 7 conceptual sections containing over 250 fields in total. The Next.js form handles these sections via an adaptive matrix.
1. **মূল তথ্য (Basic Info/Header)**: General data, responsible names, and muallima (teacher) counts.
2. **গ্রুপ / কোর্স রিপোর্ট (Group/Course Report)**: Details on educational groups, attendance, and student progress.
3. **দাওয়াত ও সংগঠন (Dawah & Org)**: Outreach, organizational activities, and funding/amounts.
4. **ব্যক্তিগত উদ্যোগে তালিমুল কুরআন (Personal Initiative)**: Personal teaching/learning metrics.
5. **বৈঠকসমূহ (Meetings)**: Meeting statistics, including average attendance at the city, thana, and ward levels.
6. **মক্তব ও সফর রিপোর্ট (Maktab & Travel)**: (Tracked via extras). Maktab statistics and travel reports.
7. **মন্তব্য রিপোর্ট (Comments)**: Textual feedback and general comments for the period.

## 4. Aggregation Rules
- **City Report**: An aggregate of all zone reports for a given period.
- **Overrides**: Admins can override specific calculated fields for the city report without modifying the underlying zone data. This is an official "correction" mechanism.

## 5. System States
While not complex enough to warrant a dedicated state machine file, the system relies on the following states:
- **User State**: `pending` (active=false) → `active` (approved by admin) → `suspended` (manually toggled).
- **Report Section State**: `empty` → `partial` (auto-saved) → `filled`.
- **Completion Badges**: Represented visually as ⚪ (empty), 🟠 (partial), 🟢 (complete).

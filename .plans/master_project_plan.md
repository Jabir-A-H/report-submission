# Master Project Plan: Report Submission System Modernization

This document aggregates the core architectural, UI/UX, policy, and legacy logic plans into a single source of truth for AI agents and developers.

---

## 1. Project Policies & Direction
- **Architecture**: Next.js (Frontend) + Supabase (Backend/Database).
- **Hosting**: Vercel ($0 frontend) and Supabase (hosted backend).
- **Design Philosophy**: Clean, minimalist, highly accessible (utility over flair). Mobile-first focus.
- **Database Management**: Schema managed via Supabase Studio UI. Migrations tracked in version control for CI/CD data safety.
- **Documentation**: Living markdown documentation within the repository.
- **Version Control**: Conventional Commits style with automated changelogs.
- **Testing**: Manual testing prioritized until MVP is stable, followed by standard Unit/E2E testing.

---

## 2. Technical Architecture & Database
- **Authentication**: Supabase Auth. Requires manual admin approval: users register, are set to `active = false` (in the existing `people` table), and must wait for admin approval before logging in.
- **Database Logic**: Utilize **PostgreSQL Views (Virtual Tables)** for calculating city-wide totals and aggregations to ensure high performance.
- **Data Entry**: The system will handle ~250+ numeric fields across 7 sections via an **Adaptive Matrix** (Sticky grids on Desktop, grouped Cards on Mobile).
- **Zero-Cost Operations**: 
  - GitHub Actions (`.github/workflows/backup.yml`) for daily encrypted `pg_dump` backups pushed to a private repository.
- **Exports**: Excel via Edge Functions (`xlsx`), PDF via high-fidelity Bengali rendering (`@react-pdf/renderer` or Playwright headless browser).

---

## 3. UI/UX & Frontend Implementation
- **Themes**: 4 Themes (Light, Dark, Solarized Light, Solarized Dark) using `next-themes`.
- **Language**: Custom React Context for instant Bangla (default, Tiro Bangla font) to English (Inter font) toggle without i18n URL routing overhead.
- **Navigation**: 
  - Desktop: Fixed top navbar.
  - Mobile: Fixed Bottom Navigation Bar (replaces hamburger menu).
- **Auto-Save**: Real-time auto-save on field blur/focus out. Auto-save indicator (spinner to ✅) next to fields.
- **Role-Based Dashboards**:
  - **User**: Select period -> view 7 section cards -> completion status badges (🟢 🟠 ⚪) act as a psychological guide driving users to complete all fields (even with '0'). Real-time auto-save ensures data is instantly available; no "Final Submit" button is needed.
  - **Admin**: Quick actions (City Report, User Management, Zone Management) and aggregated stats.
- **Core Routes**:
  - `auth/login`, `auth/register`
  - `/` (User/Admin Dashboard based on role)
  - `/report/[section]` (7 form sections)
  - `/report` (At-a-glance view)
  - `/admin/city-report` (Admin aggregation & overrides)
  - `/admin/users`, `/admin/zones`, `/admin/zone-reports`

---

## 4. Legacy Business Logic & Workflow
- **Roles**: `user` (Zone Manager) and `admin`.
- **Zones**: ~14 zones, ~20-30 total users.
- **Report Types**: Monthly, Quarterly, Half-Yearly, Nine-Month, Yearly (মাসিক, ত্রৈমাসিক, ষান্মাসিক, নয়-মাসিক, বার্ষিক).
- **Report Sections (7)**:
  1. মূল তথ্য (Basic Info/Header)
  2. গ্রুপ / কোর্স রিপোর্ট (Group/Course Report)
  3. দাওয়াত ও সংগঠন (Dawah & Org)
  4. ব্যক্তিগত উদ্যোগে তালিমুল কুরআন (Personal Initiative)
  5. বৈঠকসমূহ (Meetings)
  6. মক্তব ও সফর রিপোর্ট (Maktab & Travel)
  7. মন্তব্য রিপোর্ট (Comments)
- **Override System**: Admins can override calculated city-wide totals via the `city_report_override` table. This replaces the sum without altering the underlying user data.

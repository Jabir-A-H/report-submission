# Implementation Plan: Modernize Report Submission System

Migrate the existing Flask-based monolith to a modern, mobile-first **Next.js + Supabase** stack. This plan ensures $0 hosting costs while delivering a professional UI/UX that exceeds the reference site (`reportdu.com`).

---

## User Review Required

> [!IMPORTANT]
> **Backup Privacy**: To keep the project public but backups private, we will create a **second (private) repository** specifically for database daily snapshots.
> 
> **Registration Approval**: Authentication will require manual admin approval. New users will be redirected to a "Pending Approval" page until an admin toggles their `active` status in the database.

---

## Proposed Changes

### 1. Database & Auth (Supabase)
*   **Schema Migration**: Leverage current tables in Supabase.
*   **Auth Integration**: Use Supabase Auth for login/registration.
*   **Admin Approval**: We will continue using your existing **`people` table** and its **`active` column**. Supabase Auth will handle the "secure login" part, and we will link it to your `people` records.
*   **[NEW] Logic Layer (SQL Views)**: 
    > [!NOTE]
    > **What is a Postgres View?** Think of it as a "Virtual Table." Instead of the application downloading thousands of rows to calculate a sum, the database calculates it once and gives us a simple table (like `city_report_totals`) that we can read instantly. It is much faster and safer.

### 2. Frontend (Next.js + Tailwind + Shadcn/UI)
*   **Mobile-First Design**: Optimized for small screens using a responsive grid.
*   **Form UX (The "Dinlipi" Inspiration)**: Instead of a complex multi-step wizard, we will use a **Single-Page Card Layout**. All 6 sections will be grouped into clean, collapsible cards (like `dinlipi.online`), ensuring no data loss while keeping the UI tidy.
*   **Tech Stack**: Next.js 14+ (App Router), Tailwind CSS, Lucide icons, Framer Motion.
*   **Components**: Use high-quality components from **Shadcn/UI** (Data Tables, Forms, Dialogs).

### 3. Features & Modules
*   **Dashboard**: A card-based overview of recent reports.
*   **Report Builder**: Card-based form entry (Header, Courses, Organizational, etc.). 
*   **City Report Overhaul (Rebuilt from Scratch)**: 
    *   **The Vision**: Move away from a "giant table of numbers" (like `reportdu.com`) toward a **Visual Dashboard**. 
    *   **Simple & Beautiful**: Use summary cards for key metrics (Totals, Averages) followed by interactive, drill-down charts or simplified nested lists. 
    *   **Intuitive Overrides**: Instead of a separate "Override" page, allow admins to click a value directly in the City Report to suggest an adjustment (authenticated inline editing).
*   **Exports**: 
    *   **Excel**: Use `xlsx` library in an Edge Function.
    *   **PDF**: Use `@react-pdf/renderer` or a specialized Edge Function for high-fidelity Bengali rendering.

### 4. Zero-Cost Operations
*   **Hosting**: Deploy Frontend/API to **Vercel** ($0).
*   **Backups**: 
    *   [NEW] `.github/workflows/backup.yml`: A GitHub Action that runs every 24h.
    *   **Logic**: It checks if the database has changed since the last backup. If yes, it runs `pg_dump` and pushes the encrypted file to a **private backup repository**.

---

## 🏗️ Phased Migration Roadmap

| Phase | Milestone | Description |
| :--- | :--- | :--- |
| **Phase 1** | **Foundation** | Set up Next.js project, connect to Supabase, implement Auth + Approval flow. |
| **Phase 2** | **Data Entry** | Build the mobile-first "New Report" forms for all 6 sections. |
| **Phase 3** | **Analytics** | Create SQL Views for city-wide aggregation and build the Admin Dashboard. |
| **Phase 4** | **Export & PDF** | Implement Excel/PDF download features and the custom backup Action. |

---

## Verification Plan

### Automated Tests
*   **Supabase Policies**: Verify that 'users' can only edit their own reports via RLS (Row Level Security).
*   **Aggregation Logic**: Compare the output of the new SQL Views against the current Python `services/report_aggregator.py` results to ensure 100% accuracy.

### Manual Verification
1.  **Mobile Test**: Open the new dashboard on a mobile browser emulator to verify form responsiveness.
2.  **Approval Flow**: Register a new account, verify it is blocked from logging in, then manually approve in Supabase and verify login works.
3.  **Backup Test**: Manually trigger the GitHub Action and verify the backup file appears in the private repo.

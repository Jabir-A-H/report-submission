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

### 2. Frontend: The "Adaptive Matrix" Architecture
Audit results show ~250+ numeric fields across 7 sections. To maximize UI/UX for this high information density, we will implement an **Adaptive Matrix** system:

*   **Desktop/Tablet (Efficiency Mode)**: 
    *   **Dense Grid**: An improved version of your current tables with **Sticky Headers** and **Sticky First Columns** so users always know what row/column they are in while scrolling.
    *   **Keyboard Navigation**: Full support for Arrow keys and Tab to fly through input fields.
*   **Mobile (Focus Mode)**: 
    *   **Grid-to-Card Transition**: Tables automatically transform into **Grouped Cards**. Each category (e.g., a specific Course) becomes a card that can be expanded to fill in its 12 related fields. 
    *   **Large Touch Targets**: Numeric inputs will have stepper buttons (+/-) for quick adjustments on mobile.
*   **Universal UX Features**:
    *   **Persistent Sidebar/Bottom-Nav**: A "Report Map" that shows completion status (e.g., ✅ Header, 🟡 Courses [12/30], ⚪ Personal) and allows instant jumping between sections.
    *   **Auto-Save (Debounced)**: Every change is saved to Supabase in the background (within 500ms of typing). No more "Save" button anxiety.
    *   **Real-time Totals**: Floating summary bar at the top/bottom that updates as you type.

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

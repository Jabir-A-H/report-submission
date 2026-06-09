# Developer Conventions

## Overview
This document enforces consistent code style, folder structure, and commit practices across the codebase to ensure long-term maintainability.

## 1. Tech Stack Conventions
- **Framework**: Next.js App Router. Use Server Components by default. Use `"use client"` only when interactivity (hooks, state, Framer Motion) is strictly required.
- **Styling**: Tailwind CSS v4. Avoid inline styles.
- **Language**: TypeScript is mandatory. Use strict typing for Supabase responses.
- **Components**: Functional components only.

## 2. Folder Structure
The Next.js `src` folder is strictly organized:
```text
/src
  /app           # Next.js App Router (pages, layouts, API routes)
  /components    # Reusable React components (UI elements, layout wrappers)
  /hooks         # Custom React hooks
  /lib           # Third-party integrations (Supabase client init, etc.)
  /utils         # Pure utility functions (formatting, math, constants)
```

## 3. Naming Conventions
- **Files/Folders**: `kebab-case` for URLs (e.g., `/pending-approval`).
- **Components**: `PascalCase` (e.g., `CityReportTable.tsx`).
- **Database Tables/Columns**: `snake_case` (e.g., `report_courses`, `total_muallima`).
- **Variables/Functions**: `camelCase` (e.g., `fetchReportData`, `isComplete`).

## 4. Git & Commits
We strictly adhere to Conventional Commits to automate changelogs.
- `feat:` - A new feature (e.g., `feat: add PDF export generation`)
- `fix:` - A bug fix (e.g., `fix: correct attendance calculation`)
- `docs:` - Documentation only changes
- `style:` - UI/CSS tweaks that don't affect logic
- `refactor:` - Code changes that neither fix a bug nor add a feature
- `chore:` - Build process or auxiliary tool changes

## 5. UI/UX Principles
- **Minimalism**: Focus on utility. Keep forms clean.
- **Mobile-First**: Design for small screens first, scale up to desktop sticky grids.
- **Feedback**: Every action (especially auto-saves) must provide visual feedback (spinners, checkmarks).

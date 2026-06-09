# Developer Conventions

## Overview
This document enforces consistent code style, folder structure, and commit practices across the codebase to ensure long-term maintainability.

## 1. Tech Stack Conventions
- **Framework**: Next.js App Router. Use Server Components by default. Use `"use client"` only when interactivity (hooks, state) is strictly required.
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

## 5. UI/UX Principles & Design System
- **HSL Tokens**: Ensure all custom colors use `hsl()` CSS variables defined in `globals.css` (e.g., `hsl(var(--primary))`) to smoothly support the 4-theme suite, especially Solarized Light/Dark.
- **Minimalism & Accessibility**: Focus on utility. Keep forms clean. Avoid complex JavaScript animations like `framer-motion` for basic navigation; rely on standard snappy CSS transitions.
- **Mobile-First**: Design for small screens first, scale up to desktop sticky grids.
- **Feedback**: Every action (especially auto-saves) must provide visual feedback (spinners, checkmarks).
- **Glassmorphism**: Use the custom `.glass-panel` utility class for elevated layered elements (adds a `20px` backblur and subtle white opacity overlay).
- **Light-Catch Borders**: Use the `.light-catch` utility for a premium, physical feel on prominent cards and buttons.

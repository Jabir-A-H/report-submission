# User Flow

## Overview
This document outlines the User Experience (UX) and navigation paths for standard users (Zone Managers). The frontend focuses on an accessible, adaptive UI built with Next.js and Tailwind v4.

## 1. Authentication Flow
1. **Registration**: User signs up with Email/Password, providing their Name and Zone. Supabase Auth handles the sign-up, and an automated Database Trigger (`on_auth_user_created`) securely intercepts the new user to create their profile in the `people` table with an automatically generated sequential `user_id`.
2. **Email Confirmation**: Supabase Auth strictly requires the user to click a confirmation link sent to their registered email. Until this is done, login is disabled.
3. **Approval Gate**: Post-registration, the user is redirected to a `/pending-approval` screen which instructs them to confirm their email and wait for admin approval. Their account defaults to `active = false`.
4. **Login**: When logging in, if the email is confirmed, the server action verifies if the user's `active` status is `true`. If they are not active (still pending approval), the system securely terminates the session and redirects them to `/pending-approval`. Once an Admin approves the account, they can successfully access the User Dashboard.
5. **Header Data & Logout**: The global header features a `UserDropdown` component that dynamically fetches the logged-in user's name, zone, and role from the `people` table. The logout flow calls an auth endpoint to clear Supabase cookies and redirects to `/login`.

## 2. Dashboard Flow
1. **Landing**: User lands on `/` (Dashboard).
2. **Context Toggle**: User can instantly toggle between Bangla (default) and English via a global React Context without triggering URL changes or route reloads.
3. **Period Selection**: User selects the Report Type (e.g., মাসিক) and Date.
4. **Section Overview**: User views 7 distinct cards representing the 7 report sections.
5. **Completion Indicators**: Each card displays a psychological completion badge:
   - ⚪ (White): Empty, no data entered.
   - 🟠 (Orange): Partially filled.
   - 🟢 (Green): Fully completed.
   *(This encourages users to input '0' even for empty fields to achieve a green state).*

*Note: The UI strictly follows the 4-theme system (Light, Dark, Solarized Light, Solarized Dark). While interactive power-user features like `kbar` and `framer-motion` were explored, they have been explicitly omitted to prioritize a minimalist, highly accessible experience tailored to non-tech-savvy field managers.*

## 3. Data Entry Flow (Adaptive Matrix)
1. **Navigation**: User clicks a section card and routes to `/report/[section]`. A visible "Nav Stepper" component tracks progress across the 7 sections.
2. **Layout**:
   - **Desktop**: A sticky, tabular adaptive grid.
   - **Mobile**: Grouped cards with a Fixed Bottom Navigation Bar (no hamburger menu).
3. **Auto-Save Mechanism**:
   - As the user types and moves off a field (`onBlur`), the data is instantly auto-saved to Supabase.
   - A visual indicator next to the field spins during the save and turns into a ✅ upon success.
4. **No Final Submit**: Because of the real-time auto-save architecture, there is no master "Submit" button. Users simply fill out all sections until all 7 badges turn green.

## 4. Exports
From the dashboard, users can request an export (Excel or highly condensed PDF) of their submitted report. The Next.js app or Edge Function rapidly compiles the data and triggers a download.

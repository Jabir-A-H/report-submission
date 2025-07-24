Update all codes in the repository to match the todo_4 mockup.

# Site UI Design Document (Extreme Detail)

## 1. Global Layout & Structure
- **Base Template (`base.html`)**
  - Use Tailwind CSS for all layout, spacing, and responsive design.
  - Top navigation bar is fixed, stretches full width, and collapses into a side bar like hamburger menu on mobile.
  - Logo is always visible at the left; zone name with a drop-down menu that shows user info (name, id, email and zone name) and logout option at the right.
  - Main content area is centered, with a max-width of 1200px for readability on large screens. but focus on mobile view as my all users use mobile.
  - All pages have consistent padding (px-4 py-8) and margin (mb-8 for major sections).
  - Footer is always at the bottom, with copyright, app version. Use muted colors and big, clear font for readibility.
  - Use a light and warm background gradient for visual depth.
  - All pages inherit from `base.html` for consistent layout and navigation.

## 2. Navigation System
- **Navigation Bar**
  - Always visible except on login/register pages.
  - Contains links: Home (`/`), Report at a glance (`/report`), Help (`/help`).
  - For admins, show extra links: Users (`/users`), Zones (`/zones`), Zone Reports (`/zonereports`), Fields (`/fields`).
  - Hamburger menu appears on screens <768px, toggles navigation links vertically.
  - Zone info is shown at top right, with dropdown for profile/settings (future feature).
  - Active page is highlighted with a color accent and underline.
  - Navigation is keyboard accessible (tab order, focus states).

## 3. Home/Dashboard Page (`index.html`)
- **Header**
  - Large Bengali title: "রিপোর্ট ড্যাশবোর্ড" (font-bold, text-4xl).
  - Subtitle shows current period (month/year) in Bengali, below the title.
- **Period Selector**
  - Three dropdowns: Report Type, Month (if applicable), Year.
  - Report Type options: Populate from report tbale database - মাসিক, ত্রৈমাসিক, ষান্মাসিক, নয়-মাসিক, বার্ষিক (Bengali).
  - Populate from report tbale database - Month dropdown uses Bengali month names; year dropdown covers 2025 and 2026 (more will be added later dynamically as the backend database increases).
  - Dropdowns are styled with rounded corners, border, and focus ring.
  - Submit button: prominent, rounded, hover effect.
  - in dashboard/landing page, only the Selector is visible at the top of the dashboard. and the other options for section report editing is shown dynamically as users select the report type and year.
- **Section Cards Grid**
  - Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop.
  - Each card has:
    - Icon (large, visually distinct)
    - Bengali section name (font-bold)
    - Completion status: green for complete, yellow for incomplete, with icon and label
    - Action button: "শুরু করুন" (Start) if incomplete, "দেখুন/সম্পাদনা করুন" (View/Edit) if complete
    - Card has shadow, rounded corners, and fade-in animation
    - Hover/active effects: card lifts, shadow deepens, button color changes
  - Cards link to the appropriate section page, passing period params.
- **Summary Stats**
  - Four stats in a grid: completed sections, incomplete sections, completion rate (%), total sections
  - Each stat uses a large colored number and Bengali label
  - Stats update dynamically as sections are completed
- **Tips/Activity**
  - If all sections complete: show green congratulatory message with icon
  - If some incomplete: show blue progress message with icon
  - Messages are animated and dismissible

## 4. Section Pages (`sections/*.html`)
- **Header**
  - Bengali section name, large icon, breadcrumb navigation (Home > Section)
  - Breadcrumb is clickable, uses muted colors
- **Form Layout**
  - All fields labeled in Bengali, with tooltips or help text for complex fields
  - Inputs: text, number, textarea, select; all styled with rounded corners, border, and focus ring
  - Required fields marked with * and aria-required for accessibility
  - Auto-save indicator: spinner or checkmark appears next to field on change, fades out after save
  - Save button: large, colored, with icon; disabled until changes are made
  - Cancel/back button: returns to dashboard, keeps current period selection
  - Form is responsive, fields stack vertically on mobile
- **Validation/Error Handling**
  - Inline error messages in Bengali, red text, appear below field
  - Success message on save, green text, appears at top of form
  - All validation is both client-side (HTML5) and server-side

## 5. Report Summary Page (`report.html`)
- **Header**
  - Bengali title: "রিপোর্ট সারাংশ", subtitle with selected period
- **Section Links**
  - Card/grid links to all sections for quick navigation, same style as dashboard
- **Summary Table**
  - Aggregated data for selected period, with Bengali column headers
  - Table is responsive, scrolls horizontally on mobile
  - Download buttons: Excel, PDF, styled as prominent action buttons
  - Table rows animate on hover
- **Navigation**
  - Back to dashboard, help, logout links always visible at top

## 6. Admin Pages
- **Users Management (`admin_users.html`)**
  - Table of users: email, zone, role, status, actions
  - Approve/reject buttons: color-coded, with confirmation dialog
  - Status: green for active, yellow for pending, red for rejected
  - Table is sortable and searchable
- **Zones Management (`admin_zones.html`)**
  - List of zones, add/delete zone form
  - Add zone: input and button, validation for uniqueness
  - Delete zone: confirmation dialog
- **Reports Management (`admin_reports.html`)**
  - Table of all reports, filter by period/zone
  - Edit/view links for each report, color-coded by status
  - Table supports pagination for large datasets
- **Fields Management (`admin_fields.html`)**
  - Dynamic table for adding/removing data categories
  - Add/remove row buttons, inline editing
  - Changes auto-save, with feedback indicator

## 7. Authentication Pages
- **Login (`login.html`)**
  - Bengali labels, email/user ID input, password input
  - Error messages: red, appear above form
  - Forgot password link: styled as small text below form
  - Login button: large, blue, with icon
- **Register (`register.html`)**
  - Bengali labels, all required fields, zone selection
  - Success message on registration, green, appears above form
  - Pending approval notice: yellow, appears after registration
  - Register button: large, green, with icon

## 8. Help/FAQ Page (`help.html`)
- **Header**
  - Bengali title: "সহায়তা / প্রশ্ন", large, bold
- **FAQ List**
  - Accordion or expandable list of common questions/answers
  - Bengali text, links to relevant pages
  - Each FAQ item animates open/close
- **Contact Info**
  - Email, phone, or support form, styled as card at bottom
  - Success/error messages for contact form

## 9. UI/UX Principles
- **Accessibility**
  - All interactive elements have focus states, aria-labels, and keyboard navigation
  - Sufficient color contrast for all text and buttons
  - Large clickable areas for touch devices
- **Localization**
  - All labels, messages, tooltips, and error/success messages in Bengali
  - Date and number formats follow Bengali conventions
- **Responsiveness**
  - Mobile-first design, adapts to all screen sizes
  - Grid and flex layouts for dynamic resizing
- **Feedback**
  - Loading spinners for async actions, success/error toasts for saves
  - Auto-save indicators on forms
- **Consistency**
  - Unified color palette, font sizes, spacing, and button styles across all pages

## 10. Visual Style Guide
- **Colors**
  - Primary: Blue (`#2563eb`), Cyan (`#06b6d4`), Green (`#16a34a`), Red (`#dc2626`), Yellow (`#facc15`)
  - Background: White, Blue-50, Cyan-50, with gradients for depth
- **Typography**
  - Font: Noto Sans Bengali, fallback to sans-serif
  - Headings: bold, large size, blue or cyan
  - Body: regular, readable size, dark gray
- **Icons**
  - Use Heroicons or similar, sized for clarity, with Bengali context
  - Icons are color-coded by section or action
- **Buttons**
  - Rounded corners, shadow, hover/active states, color-coded by action
  - Large touch targets for mobile

## 11. Example UI Flows
- **User Login → Dashboard → Section Edit → Save → Summary → Logout**
  - User logs in, lands on dashboard, selects period, edits sections, saves, views summary, logs out
- **Admin Login → Dashboard → Manage Users/Zones/Reports → Edit Fields → Logout**
  - Admin logs in, sees dashboard, manages users/zones/reports, edits fields, logs out
- **User Registration → Pending Approval → Login → Dashboard**
  - User registers, sees pending approval, logs in after approval, lands on dashboard

## 12. Wireframes & Mockups
- Attach Figma/Sketch files or include ASCII wireframes for each page
- Example wireframe for dashboard:

```
+-------------------------------------------------------------+
| Logo   রিপোর্ট ড্যাশবোর্ড        User Info [ID, Role, Zone] |
+-------------------------------------------------------------+
| Period Selector: [Report Type] [Month] [Year] [যান]         |
+-------------------------------------------------------------+
| [Section Card] [Section Card] [Section Card]                |
| [Section Card] [Section Card] [Section Card]                |
+-------------------------------------------------------------+
| Summary Stats: Completed | Incomplete | Rate | Total        |
+-------------------------------------------------------------+
| Tips/Activity Message                                        |
+-------------------------------------------------------------+
| Footer: Copyright, Version, Contact                         |
+-------------------------------------------------------------+
```

---

*This document provides a comprehensive, detailed reference for all UI elements, layouts, and user flows in the report-submission system. All design decisions are aligned with Bengali language, accessibility, and modern web standards.*

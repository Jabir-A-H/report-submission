# Site UI Design Document (Extreme Detail)

## 1. Global Layout & Structure
- **Base Template (`base.html`)**
  - Responsive, mobile-first layout using Tailwind CSS.
  - Fixed top navigation bar with logo, user info, hamburger menu for mobile.
  - Main content area centered, max-width for readability.
  - Consistent padding, margin, and spacing across all pages.
  - Footer with copyright, version, and contact info.

## 2. Navigation System
- **Navigation Bar**
  - Visible on all pages (except login/register).
  - Links: Dashboard (`/`), Report Summary (`/report`), Help (`/help`), Logout (`/logout`).
  - For admins: additional links to Users, Zones, Reports, Fields management.
  - Hamburger menu for mobile: toggles navigation links.
  - User info: name, ID, role, zone displayed at top right.

## 3. Home/Dashboard Page (`index.html`)
- **Header**
  - Bengali title: "রিপোর্ট ড্যাশবোর্ড"
  - Subtitle: current period (month/year)
- **Period Selector**
  - Dropdowns for report type, month (if applicable), and year.
  - Bengali month names, years 2020–2030.
  - Submit button: "যান"
- **Section Cards Grid**
  - 1–3 columns, responsive.
  - Each card: icon, Bengali section name, completion status (color-coded), action button.
  - Action button: "শুরু করুন" (Start) or "দেখুন/সম্পাদনা করুন" (View/Edit)
  - Hover/active effects for accessibility.
- **Summary Stats**
  - Grid of 4 stats: completed, incomplete, completion rate, total sections.
  - Bengali labels, color-coded numbers.
- **Tips/Activity**
  - Success message if all sections complete.
  - Progress message if some sections incomplete.

## 4. Section Pages (`sections/*.html`)
- **Header**
  - Section name in Bengali, icon.
  - Breadcrumb navigation: Home > Section
- **Form Layout**
  - All fields labeled in Bengali, with tooltips/help text.
  - Inputs: text, number, textarea, select as needed.
  - Required fields marked with *.
  - Auto-save indicator (spinner/checkmark) on field change.
  - Save button: prominent, color-coded.
  - Cancel/back button: returns to dashboard, retains period selection.
- **Validation/Error Handling**
  - Inline error messages in Bengali.
  - Success message on save.

## 5. Report Summary Page (`report.html`)
- **Header**
  - Bengali title: "রিপোর্ট সারাংশ"
  - Subtitle: selected period
- **Section Links**
  - Card/grid links to all sections for quick navigation.
- **Summary Table**
  - Aggregated data for selected period.
  - Download buttons: Excel, PDF.
  - Bengali column headers.
- **Navigation**
  - Back to dashboard, help, logout links.

## 6. Admin Pages
- **Users Management (`admin_users.html`)**
  - Table of users: email, zone, role, status, actions.
  - Approve/reject buttons, color-coded status.
- **Zones Management (`admin_zones.html`)**
  - List of zones, add/delete zone form.
- **Reports Management (`admin_reports.html`)**
  - Table of all reports, filter by period/zone.
  - Edit/view links for each report.
- **Fields Management (`admin_fields.html`)**
  - Dynamic table for adding/removing data categories.

## 7. Authentication Pages
- **Login (`login.html`)**
  - Bengali labels, email/user ID input, password input.
  - Error messages, forgot password link.
- **Register (`register.html`)**
  - Bengali labels, all required fields, zone selection.
  - Success message on registration, pending approval notice.

## 8. Help/FAQ Page (`help.html`)
- **Header**
  - Bengali title: "সহায়তা / প্রশ্ন"
- **FAQ List**
  - Accordion or expandable list of common questions/answers.
  - Bengali text, links to relevant pages.
- **Contact Info**
  - Email, phone, or support form.

## 9. UI/UX Principles
- **Accessibility**
  - Keyboard navigation, screen reader support.
  - Sufficient color contrast, large clickable areas.
- **Localization**
  - All labels, messages, tooltips in Bengali.
- **Responsiveness**
  - Mobile-first, adapts to all screen sizes.
- **Feedback**
  - Loading spinners, success/error toasts, auto-save indicators.
- **Consistency**
  - Unified color palette, font sizes, spacing.

## 10. Visual Style Guide
- **Colors**
  - Primary: Blue (`#2563eb`), Cyan (`#06b6d4`), Green (`#16a34a`), Red (`#dc2626`), Yellow (`#facc15`)
  - Background: White, Blue-50, Cyan-50
- **Typography**
  - Font: Noto Sans Bengali, fallback to sans-serif.
  - Headings: bold, large size.
  - Body: regular, readable size.
- **Icons**
  - Use Heroicons or similar, with Bengali context.
- **Buttons**
  - Rounded corners, shadow, hover/active states.

## 11. Example UI Flows
- **User Login → Dashboard → Section Edit → Save → Summary → Logout**
- **Admin Login → Dashboard → Manage Users/Zones/Reports → Edit Fields → Logout**
- **User Registration → Pending Approval → Login → Dashboard**

## 12. Wireframes & Mockups
- (Attach or link to Figma/Sketch files, or include ASCII wireframes if needed)

---

*This document provides a comprehensive, detailed reference for all UI elements, layouts, and user flows in the report-submission system. All design decisions are aligned with Bengali language, accessibility, and modern web standards.*

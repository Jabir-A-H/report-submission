# UI/UX Implementation Plan — রিপোর্ট সাবমিশন সিস্টেম

A comprehensive, original, and mobile-first Next.js UI. Builds on the new app's existing architecture. The legacy site's purpose, Bengali strings, and feature requirements are ported in. The legacy visual design is **discarded** and replaced with original modern patterns suited for non-tech-savvy mobile users.

---

## Site Overview (From Legacy Docs)

This is a Bengali-language report management system for ~20-30 users across **14 zones**. It has:
- **2 roles**: `user` (zone submitter) and `admin`.
- **7 report sections** per report: Header, Courses, Organizational, Personal, Meetings, Extras, Comments.
- **5 report types**: মাসিক, ত্রৈমাসিক, ষান্মাসিক, নয়-মাসিক, বার্ষিক.
- Reports belong to a zone + period (month/year + type). One report per zone per period.
- **Admin approval workflow**: New users register, await admin activation.

---

## Modern Enhancements (New vs. Legacy)

This Next.js version introduces several UX improvements that were **not present** in the original site:

| Feature | Legacy UX | **Modern (New) UX** |
|---|---|---|
| **Auto-save** | Manual "Save" button per page. | **Real-time auto-save** on focus out (blur). No more lost data. |
| **Mobile Navigation** | Standard top bar/hamburger menu. | **Fixed Bottom Navigation Bar** for 1-handed thumb use. |
| **Theme System** | Light theme only. | **4 Themes**: Light, Dark, Solarized Light, Solarized Dark. |
| **Status Tracking** | Static links. | **Dynamic Status Badges** (✅/⚠️) update as you fill sections. |
| **Language Toggle** | Hardcoded Bengali. | **Instant BN/EN Toggle** via custom React Context. |
| **Form Inputs** | Standard HTML (auto-zooms on iOS). | **iOS-Optimized**: 16px min font, 44px tap targets. |
| **Admin Dashboard** | List of links. | **Quick Action Center** with stats cards & aggregated overview. |
| **Period Selector** | Static multi-dropdown. | **Smart Selector**: Hides month/year based on report type. |

---

## Technical Choices

### Theme: `next-themes` (4 Themes)
| Theme | Description |
|---|---|
| **Light** (default) | Clean white / cyan premium palette (current) |
| **Dark** | Dark charcoal backgrounds, same cyan accent |
| **Solarized Light** | Warm cream/yellow-tinted — easy on eyes |
| **Solarized Dark** | Deep teal-indigo tones — great for low light |

CSS variables for each theme go in `globals.css` and are swapped by `next-themes`.

### Language: Custom React Context (Bangla default → English toggle)
- A `LanguageProvider` wraps the app and provides a `useT()` hook for localized strings.
- Bangla strings sourced directly from legacy templates and docs.
- No URL changes. No i18n library overhead.
- Font swaps: `Tiro Bangla` (Google Fonts) active in Bangla mode; `Inter` in English mode.

---

## Proposed Implementation Details

### 1. Infrastructure

#### [MODIFY] `src/app/layout.tsx`
- Wrap with `<ThemeProvider>` and `<LanguageProvider>`.
- Load `Tiro_Bangla` font from `next/font/google`; conditionally apply to `<body>` via the language context class.
- Remove `CommandBar` if it conflicts; integrate theme/language toggles into the new Navbar instead.

#### [NEW] `src/components/providers/theme-provider.tsx`
#### [NEW] `src/components/providers/language-provider.tsx`
#### [NEW] `src/lib/i18n.ts`
- Bangla and English string dictionaries for every UI label used across the site.

---

### 2. Global Layout & Navigation

**All pages (except Login, Register, Landing) share a common layout:**

#### Desktop (≥768px)
- Fixed top navbar: Logo/Site Name (left) | Nav Links (center) | Zone + User Dropdown + Language/Theme Toggles (right).
- Active page highlighted with accent color.

#### Mobile (<768px)
- Fixed top bar: Logo (left) | Hamburger or User Info icon (right).
- **Fixed Bottom Navigation Bar** with icons for the current user's most common actions (industry-standard mobile app pattern, replaces the clunky hamburger menu entirely for primary navigation).
  - **Normal User bottom nav**: Home 🏠 | Report 📋 | Help ❓
  - **Admin bottom nav**: Home 🏠 | Reports 📋 | Users 👥 | Zones 🗺️

**Navigator links by role:**
| Link | Normal User | Admin |
|---|:---:|:---:|
| হোম (`/`) | ✅ | ✅ |
| রিপোর্ট (`/report`) | ✅ | ✅ |
| সিটি রিপোর্ট (`/city_report`) | ❌ | ✅ |
| সব জোন রিপোর্ট (`/zone_reports`) | ❌ | ✅ |
| ইউজার ব্যবস্থাপনা (`/admin/users`) | ❌ | ✅ |
| জোন ব্যবস্থাপনা (`/admin/zones`) | ❌ | ✅ |
| সহায়তা (`/help`) | ✅ | ✅ |

#### [MODIFY] `src/app/layout.tsx`
#### [NEW] `src/components/layout/navbar.tsx`
#### [NEW] `src/components/layout/bottom-nav.tsx`
#### [NEW] `src/components/layout/user-dropdown.tsx`

---

### 3. Complete Site Map & Page-by-Page UI Plan

#### A. Landing / Unauthenticated Home (`/`)
- Full-screen gradient hero with the app name in Bengali.
- Two primary CTAs: "লগইন করুন" and "নিবন্ধন করুন" (full-width, 48px tall tap targets).
- Feature bullets at the bottom (মাসিক রিপোর্ট, PDF/Excel ডাউনলোড, সিটি রিপোর্ট).

#### [MODIFY] `src/app/page.tsx`

---

#### B. Login (`/login`)
- Standalone card page (no nav / bottom bar).
- Fields: **Email অথবা ৩-ডিজিট ইউজার আইডি** + **পাসওয়ার্ড**.
- Link to Register.
- Full inline Bengali error messages.

#### [MODIFY] `src/app/auth/login/page.tsx`

---

#### C. Register (`/register`)
- Standalone card page.
- Fields: পূর্ণ নাম, ইমেইল, পাসওয়ার্ড, জোন নির্বাচন (dropdown).
- On success: "রেজিস্ট্রেশন সফল! অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন।"

#### [MODIFY] `src/app/auth/register/page.tsx`

---

#### D. User Dashboard — Normal User (`/`) [logged in, role=user]
- **Period Selector** at top (always visible first):
  - Report Type dropdown (মাসিক/ত্রৈমাসিক/ষান্মাসিক/নয়-মাসিক/বার্ষিক)
  - Month dropdown (Bengali names, only shows if মাসিক selected)
  - Year dropdown (2025, 2026…)
  - "যান" button.
- After period is selected, a **7-section card grid** appears below:
  - Cards for: হেডার, কোর্স, দাওয়াত ও সংগঠন, ব্যক্তিগত, বৈঠক, অতিরিক্ত, মন্তব্য.
  - Each card shows: section icon + Bengali name + completion status badge (✅ সম্পন্ন / ⚠️ অসম্পূর্ণ).
  - "শুরু করুন" CTA button if incomplete, "সম্পাদনা করুন" if complete.
  - Responsive grid: 1 col mobile → 2 col tablet → 3-4 col desktop.
- **Summary stats bar**: Completed / Incomplete / Completion % / Total.
- **"চূড়ান্ত জমা দিন"** (Final Submit) button only appears when ALL 7 sections are complete. This marks the report as submitted in admin's view.

#### [NEW] `src/components/dashboard/user-dashboard.tsx`
#### [NEW] `src/components/dashboard/period-selector.tsx`
#### [NEW] `src/components/dashboard/section-grid.tsx`

---

#### E. Admin Dashboard (`/`) [logged in, role=admin]
- **Global Stats Row**: Total Reports · Total Zones · Pending Users · Active Users.
- **Admin Quick Actions** (full-width cards on mobile, 3-col grid on desktop):
  - 🏙️ সিটি রিপোর্ট → `/city_report`
  - 👥 ইউজার ব্যবস্থাপনা → `/admin/users`
  - 🗺️ জোন ব্যবস্থাপনা → `/admin/zones`
- **"সকল জোন রিপোর্ট"** section: Paginated table/card list of all reports with filters (zone, type, month/year). On mobile: card view. On desktop: table view. Each row has a "দেখুন" button.

#### [NEW] `src/components/dashboard/admin-dashboard.tsx`

---

#### F. Report Sections (7 pages — Normal User & Admin can both access)
Each section is a focused form page at `/report/[section]`:
- Header (`/report/header`): Responsible person, thana, ward, teacher statistics.
- Courses (`/report/courses`): 10 fixed course categories × multiple numeric fields.
- Organizational (`/report/organizational`): 14 fixed org categories × number/increase/amount.
- Personal (`/report/personal`): 3 member categories × teaching/learning/etc.
- Meetings (`/report/meetings`): 4 meeting types (2 admin-only) × city/thana/ward counts.
- Extras (`/report/extras`): 8 fixed activity categories × count.
- Comments (`/report/comments`): Single text area for period-specific remarks.

**All section pages share:**
- Breadcrumb: হোম > সেকশন নাম.
- Auto-save indicator next to each field (spinner → checkmark).
- All labels in Bengali.
- Fixed category rows — no dynamic addition/removal.
- "সংরক্ষণ করুন" save button + "ড্যাশবোর্ডে ফিরে যান" back button.
- Inline Bengali validation messages.

> [!NOTE]
> Two meeting categories and one extras category are **admin-only** and should be hidden from non-admin users: "Committee Orientation", "Muallima Orientation", and "মহানগরী পরিচালিত".

#### [NEW] `src/app/report/[section]/page.tsx`
#### [NEW] `src/components/report/auto-save-field.tsx`

---

#### G. Report At-a-Glance (`/report`) [summary/view]
- Period selector (type, month, year) + Download buttons (PDF/Excel) at top.
- Readonly spreadsheet-style table showing all data for selected period.
- **Normal User**: sees only their zone's data.
- **Admin**: sees aggregated city-wide totals (sum of all zones).
- Table scrolls horizontally on mobile.

#### [MODIFY] `src/app/report/page.tsx`

---

#### H. City Report (`/city_report`) [admin only]
- Same as Report At-a-Glance but always shows aggregated city data.
- Admins can also **override** fields here (overrides stored in `city_report_override` table, don't affect underlying zone data).
- Override mode: editable table with save per field.

#### [NEW] `src/app/admin/city-report/page.tsx`

---

#### I. Zone Reports (`/zone_reports`) [admin only]
- Paginated list of all submitted reports from all zones.
- Filter by: Zone, Report Type, Year, Month.
- Mobile: card layout. Desktop: table layout.
- Each entry: "দেখুন" button linking to that zone's summary.
- Per-page selector (10/25/50/100).

#### [NEW] `src/app/admin/zone-reports/page.tsx`

---

#### J. User Management (`/admin/users`) [admin only]
- 4 stats cards: সক্রিয় · অপেক্ষমাণ · অ্যাডমিন · মোট.
- List of all users as cards (mobile-friendly, not a table).
- Each user card shows: name, email, user_id, zone, role, status badge.
- Zone reassignment dropdown + "আপডেট" button inline.
- Approve and Delete action buttons with confirmation dialogs.

#### [NEW] `src/app/admin/users/page.tsx`

---

#### K. Zone Management (`/admin/zones`) [admin only]
- Total zones stat card.
- List of all zones with a delete button each (with confirmation).
- "নতুন জোন যোগ করুন" form at the bottom.

#### [NEW] `src/app/admin/zones/page.tsx`

---

#### L. Help/FAQ (`/help`)
- Bengali title: "সহায়তা"
- Accordion-style FAQ list, fully in Bengali.
- Step-by-step guide for using the system.

#### [NEW] `src/app/help/page.tsx`

---

### 4. Mobile-First & Touch Standards

- **Tap Targets**: All buttons/links ≥ 44×44px.
- **No hover-dependent interactions**: Remove all `hover:scale` or hover-to-reveal UI patterns. Replace with `:active:scale-95` tap feedback.
- **iOS auto-zoom prevention**: All form inputs use `text-base` (16px) or larger.
- **Forms**: Inputs stacked vertically (no side-by-side on mobile), large select dropdowns.
- **Tables**: Horizontal scroll with `overflow-x-auto` wrapper.

#### [MODIFY] `src/app/globals.css`
- Add 4 theme variable sets (light, dark, solarized-light, solarized-dark).
- Add `:active` feedback utilities.
- Set global `input`, `select`, `textarea` min font size to 16px.

---

### 5. Toast Notifications & Feedback
- Auto-dismissing success toasts (green) after 5 seconds.
- Persistent warning/error toasts (amber/red) until dismissed.
- Auto-save indicator: a small spinner next to a field while saving, replaced by a ✅ on success.

#### [NEW] `src/components/ui/toast.tsx`
#### [NEW] `src/components/ui/auto-save-indicator.tsx`

---

## Bangla String Reference (Key Labels)

| Element | Bangla | English |
|---|---|---|
| Site Title | রিপোর্ট সাবমিশন সিস্টেম | Report Submission System |
| Dashboard | ড্যাশবোর্ড | Dashboard |
| Login | লগইন করুন | Login |
| Register | নিবন্ধন করুন | Register |
| Logout | লগআউট | Logout |
| Report | রিপোর্ট | Report |
| Monthly | মাসিক | Monthly |
| Quarterly | ত্রৈমাসিক | Quarterly |
| Half-Yearly | ষান্মাসিক | Half-Yearly |
| Nine-Month | নয়-মাসিক | Nine-Month |
| Yearly | বার্ষিক | Yearly |
| Save | সংরক্ষণ করুন | Save |
| Submit (final) | চূড়ান্ত জমা দিন | Final Submit |
| View/Edit | দেখুন/সম্পাদনা করুন | View/Edit |
| Start | শুরু করুন | Start |
| Admin | অ্যাডমিন | Admin |
| User | ইউজার | User |
| Zone | জোন | Zone |
| Approved | সক্রিয় | Active |
| Pending | অপেক্ষমাণ | Pending |
| Help | সহায়তা | Help |
| City Report | সিটি রিপোর্ট | City Report |
| Zone Reports | সব জোন রিপোর্ট | All Zone Reports |
| User Management | ইউজার ব্যবস্থাপনা | User Management |
| Zone Management | জোন ব্যবস্থাপনা | Zone Management |

---

## Verification Plan

### Manual Verification
1. **Role Routing**: Log in as a user → see User Dashboard. Log in as admin → see Admin Dashboard. Confirm nav links match the role table above.
2. **Period Selector**: Select "মাসিক" → confirm month dropdown appears. Select other types → confirm month dropdown hides.
3. **Section Cards**: Complete one section → verify card status updates to green "সম্পন্ন". Verify final submit button only appears when all 7 done.
4. **Admin Tools**: Approve a pending user, assign a zone, add and delete a zone.
5. **Theming**: Toggle all 4 themes in sequence on both mobile and desktop.
6. **Language**: Toggle to English → verify all UI labels switch. Toggle back to Bangla → verify font changes to Tiro Bangla.
7. **Mobile Emulation**: Verify bottom nav on mobile, 44px tap targets, no iOS zoom on form focus.

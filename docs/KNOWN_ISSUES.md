# Known Issues & Bug Tracker

## Overview
This file tracks known bugs, temporary hacks, or design compromises made during development. Documenting these saves time when refactoring later.

## Current Issues
*(No issues logged yet. Add issues here as development begins).*

### Format for Logging:
```markdown
### [Issue Title]
- **Date**: YYYY-MM-DD
- **Description**: Brief explanation of the bug or hack.
- **Impact**: High/Medium/Low
- **Potential Fix**: Notes on how to resolve it in the future.
```

## Resolved Historical Issues
The following notable issues were resolved during the initial Next.js migration and are documented here for context:

### `Report.created_at` Sorting Crash
- **Description**: The dashboard crashed after login because it attempted to sort reports by `created_at`, a field which did not exist in the legacy schema.
- **Fix**: The query was refactored to sort by `Report.id` descending, accurately reflecting the creation sequence without needing a new schema column.

### Tailwind 4 `.container` Alignment Bug
- **Description**: Because Tailwind 4's `.container` does not automatically center content or set max-widths without explicit configuration, the UI awkwardly hugged the left side of the screen.
- **Fix**: A custom `.container` class was defined in `globals.css` using `@apply mx-auto px-4 w-full max-w-7xl;` to properly center the dashboard layouts.

### Authentication & Logout State Hanging
- **Description**: The `UserDropdown` initially showed a hardcoded static user and the logout button failed to clear sessions.
- **Fix**: The dropdown was updated to dynamically fetch the user from Supabase and the `people` table. A dedicated POST route `/auth/logout` was built to properly clear cookies and trigger a redirect to `/login`.

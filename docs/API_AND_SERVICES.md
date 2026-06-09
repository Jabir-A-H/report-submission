# API and Services

## Overview
Because the architecture relies heavily on Next.js and Supabase, traditional REST API endpoints are minimized. Instead, the system uses Supabase's client libraries and Edge Functions / Next.js API Routes for specific high-computation tasks.

## 1. Supabase Data Fetching
- **Client-Side**: The Next.js frontend uses `@supabase/ssr` to fetch and mutate data directly from the PostgreSQL tables and views.
- **Security**: Data access is governed by Row Level Security (RLS) policies defined in the database, ensuring users only see their own zone data.
- **Realtime**: Auto-saving forms bypass traditional `POST /submit` endpoints. Instead, an `onBlur` event triggers a direct `supabase.from('table').upsert(...)` call.

## 2. Aggregation via Views
Instead of computing aggregations on the server via an API route, the Next.js app queries PostgreSQL Views directly:
```typescript
const { data } = await supabase.from('city_monthly_aggregates_view').select('*');
```
This offloads the computational heavy-lifting to the database layer.

## 3. Export Services (Excel & PDF)
Generating high-fidelity exports requires server-side processing to keep the client lightweight.
- **Approach**: Whichever is faster/more reliable to implement between Next.js API Routes (`/api/export/*`) or Supabase Edge Functions.
- **Excel Export**: Utilizes a library like `exceljs` to map JSON data into a formatted XLSX file.
- **PDF Export**: Utilizes `@react-pdf/renderer` or a headless browser to generate highly customized, condensed Bangla-supported PDFs.
- **Flow**:
  1. Client sends a request with `report_id` or `period`.
  2. The server/Edge Function queries Supabase for the required data.
  3. The document is generated in-memory.
  4. The server responds with a `Blob` or presigned download URL.

## 4. Authentication Service
- Handled entirely by Supabase Auth.
- Next.js Middleware (`middleware.ts`) protects routes, ensuring unauthenticated users or those with `active = false` are redirected away from protected dashboard pages.

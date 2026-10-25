# Proposal: add-list-export-kit

## Why

Every list in the PRD needs text search, filters (project, status, date range) and an Excel export of exactly what is on screen (UMM-04, UMM-09). Building that once as a shared kit, before the many master-data and transaction lists arrive, keeps them consistent and saves rebuilding each one. The three lists that exist today (Pengguna & Peran, Log Audit, Notifikasi) are moved onto the kit to prove it.

## What Changes

- **A shared list kit (UMM-09, Wajib):**
  - A data table with sortable columns.
  - A toolbar with text search, choice filters and a date-range filter in Bahasa Indonesia.
  - Server-side pagination (50 per page).
  - All list state lives in the URL, so a filtered view can be shared or reloaded.
- **Excel export (UMM-04, Wajib):** an "Ekspor Excel" button on each list downloads an .xlsx with the same columns as the screen and every row matching the active search and filters, not just the current page. Dates use WIB and money is numeric with Rp formatting. Only users who may see the list can export it.
- **Lists moved onto the kit:**
  - Pengguna & Peran: search by name or email, filter by role and status.
  - Log Audit: filter by data type and date range.
  - Notifikasi: filter by read status.

## Capabilities

### New Capabilities
- `platform/list-views`: How every list behaves: search, filters, date range, sorting, pagination and URL state.
- `platform/data-export`: Exporting a list or report to .xlsx with the active filters and the same data as on screen.

### Modified Capabilities
- None. Pengguna & Peran, Log Audit and Notifikasi keep their specified behavior and gain the kit's search, filters and export.

## Impact

- **Dependencies:** `@tanstack/react-table` v8 (column rendering; sorting state is driven by the URL), `exceljs` (server-side .xlsx), `date-fns` (Indonesian dates), and the shadcn `calendar` component (react-day-picker).
- **App:**
  - `components/data-table/*` (table, toolbar, filters, export button).
  - `lib/list/*` (URL parameter parsing).
  - `lib/export/*` (workbook builder and export registry).
  - Route handler `app/api/export/[list]/route.ts`.
  - The query functions for users, audit and notifications move into shared `queries.ts` files used by both page and export.

## Out of scope

- The project filter appears on lists once projects exist (`add-projects-contracts`).
- PDF/print layouts (UMM-05) come with master data, where the company letterhead exists.
- Report-specific exports (L/R proyek, aging, payroll recap) reuse this export path in their own changes.

## Open questions (PRD §19)

None of the §19 questions affect this change.

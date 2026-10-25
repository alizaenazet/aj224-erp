# Design: add-list-export-kit

## Context

See proposal.md. Existing lists render shadcn Tables. Log Audit and Notifikasi already paginate through `?page=` with `ListPagination`. Queries currently live inside the page files.

## Goals / Non-Goals

**Goals:** one list pattern, where the URL holds the state, the server filters, sorts and paginates, and a client table renders. Export reuses the exact same query, so the file always equals the screen.

**Non-Goals:** client-side filtering of large datasets, saved views, column pickers, CSV.

## Decisions

### Server-driven lists, URL as state
- **Parameters:** `q`, filter keys (e.g. `role`, `status`, `table`), `from`/`to` (yyyy-mm-dd), `sort` (`column.asc|desc`) and `page`.
- **Why server-side:** transaction lists (attendance, costs) will hold thousands of rows. Server filtering keeps pages light on 4G (PRD §14) and lets export run the same query.
- **Parsing:** `lib/list/params.ts` turns raw search params into typed values:
  - `parseText` trims to 100 characters.
  - `parseEnum` accepts only allowed values.
  - `parseDateRange` converts to WIB day bounds (`from` 00:00+07:00 inclusive, the day after `to` 00:00+07:00 exclusive).
  - `parseSort` accepts only allowed columns.
  - `parsePage`.
- **Shared queries:** each list has `lib/<module>/queries.ts` with `queryX(params, { page })`. The page calls it with a page number; the export calls it with `page: null` (all rows, capped at 10,000 with a warning row if exceeded).

### Client components (`components/data-table/`)
- **`useListParams()`:** reads `useSearchParams` and updates the URL with `router.replace(…, { scroll: false })`. Any change other than `page` deletes `page`.
- **`DataTable<T>`:** TanStack Table v8 with `manualSorting`, `getCoreRowModel`, and sorting state derived from `sort`. Sortable headers are ghost Buttons with an arrow icon. Rendering uses shadcn Table. The empty state uses shadcn `Empty` with "Tidak ada data yang cocok" and "Reset filter".
- **`DataTableToolbar`:** a search Input (300 ms debounce), a filter slot, "Reset filter" (only when something is active) and an export slot.
- **`SelectFilter`:** a shadcn Select bound to one param, with an "Semua …" option.
- **`DateRangeFilter`:** a Popover holding a Calendar in `mode="range"` (react-day-picker v10, `id` locale), with a button label like "25 Okt – 31 Okt 2026" and a "Hapus" action.
- **`ExportButton`:** a Button wrapping `<a href="/api/export/<key>?<current params>" download>` labelled "Ekspor Excel".
- **Pagination:** the existing `ListPagination` (server component) stays and receives the computed hrefs.
- Each list keeps a small client component that defines its columns (`UsersDataTable` etc.) and receives rows from the server page.

### Export
- **`lib/export/xlsx.ts`:** `buildWorkbook({ sheetName, columns, rows })` built on exceljs. It gives the header row a bold font, freezes it, adds an auto-filter and sets column widths. Column `type`:
  - `date` → JS Date shifted to WIB wall time, numFmt `dd/mm/yyyy`.
  - `datetime` → numFmt `dd/mm/yyyy hh:mm`.
  - `rupiah` → number with numFmt `"Rp" #,##0`.
  - `number` and `text` as-is.
- **`lib/export/registry.ts`:** maps a key to `{ roles, fileBase, sheetName, columns, load(searchParams) }`. Keys: `users` (super_admin, director), `audit-log` (super_admin, director), `notifications` (any active role).
- **`app/api/export/[list]/route.ts`:** GET resolves the definition, then `assertRole(roles)` (403 JSON with an Indonesian message), then `load()`, then the workbook. The response sets `Content-Type` to spreadsheetml and `Content-Disposition: attachment; filename="<fileBase>-<today WIB>.xlsx"`. Data is read with the user's own Supabase client, so RLS still applies.
- Route handlers aren't affected by the page Suspense rule. `createClient()` calls `connection()` there too, which is harmless.

### Lists moved onto the kit
| List | Search | Filters | Sort | Export columns |
|---|---|---|---|---|
| Pengguna & Peran | name, email (`list_users()` result filtered with `or(ilike…)`) | role, status | name, last sign-in | Nama, Email, Peran, Status, Login Terakhir |
| Log Audit | — | data type, date range | time | Waktu, Pengguna, Jenis data, Tindakan, Perubahan, Alasan |
| Notifikasi | title | read status | time | Waktu, Judul, Isi, Status |

`list_users()` is a set-returning function, so PostgREST filters and ranges apply to its result. Status and role filters use `eq`, and counting uses `count: 'exact'`.

## Risks / Trade-offs

- [Large exports] → Capped at 10,000 rows per file, with a final note row saying the export was truncated. Real volumes (A11) stay well below that.
- [TanStack v9 exists] → v8 is pinned because sorting and paging are server-driven and only column rendering is used. Upgrading later only touches `DataTable`.
- [The URL becomes the source of truth] → `useListParams` debounces search to avoid a request per keystroke.

## Migration Plan

App-only change, with no database migration. Rollback means reverting the components; the data is untouched.

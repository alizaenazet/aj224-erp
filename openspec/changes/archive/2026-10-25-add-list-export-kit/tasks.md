# Tasks: add-list-export-kit

## 1. Kit

- [x] 1.1 Add `lib/list/params.ts` (parseText, parseEnum, parseDateRange in WIB, parseSort, parsePage) and verify with `tsc` and a node one-off that 25 Okt 2026 maps to 2026-10-24T17:00:00Z..2026-10-25T17:00:00Z
- [x] 1.2 Add `components/data-table/` (useListParams, DataTable on TanStack v8 with URL sorting, DataTableToolbar with debounced search and Reset filter, SelectFilter, DateRangeFilter with Indonesian calendar, ExportButton, empty state); verify `tsc` and `pnpm lint` pass
- [x] 1.3 Add `lib/export/xlsx.ts`, `lib/export/registry.ts` and `app/api/export/[list]/route.ts` (role check, WIB file name, 10,000-row cap); verify an unauthenticated request returns 401/redirect and an unknown key returns 404

## 2. Lists on the kit

- [x] 2.1 Move Pengguna & Peran onto the kit (`lib/users/queries.ts`: search name/email, role and status filters, sort name/last sign-in, 50 per page) with export key `users`; verify as Super Admin: searching "maya" shows only Maya, Peran=Finance + Status=Aktif shows only active Finance users, Reset filter restores all, and the export of the Finance filter contains exactly those rows with Indonesian labels
- [x] 2.2 Move Log Audit onto the kit (`lib/audit/queries.ts`: data type filter, WIB date range, sort by time) with export key `audit-log`; verify as Super Admin that a 25 Okt–25 Okt range shows only that day's entries, the URL keeps filter and page on reload, the export has dates and "Diubah"/"Dibuat" labels, and as HCM `/api/export/audit-log` is refused
- [x] 2.3 Move Notifikasi onto the kit (`lib/notifications/queries.ts`: title search, read-status filter) with export key `notifications`; verify as Finance with 63 notifications that the Belum dibaca filter and page 2 work and the export holds all matching rows

## 3. Integration

- [x] 3.1 Run `pnpm lint` and `pnpm build`; confirm no server or console errors on the three lists and that the downloaded file name is `<list>-<today WIB>.xlsx`

## Workflow follow-up

- Archive the change with `/opsx:archive` after verification.

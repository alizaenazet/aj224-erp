# Tasks: add-data-import

## 1. Database

- [x] 1.1 Write migration `<ts>_data_import.sql` with `import_runs` and RLS; verify `pnpm db:reset` and `pnpm db:types` succeed and that a user reads only their own runs while Super Admin and Direktur read all

## 2. Engine

- [x] 2.1 Add `lib/import/{parse,cells,types,run,workbook,registry}.ts` (XLSX and CSV parsing, header matching, cell conversion, chunked insert with row fallback, history); verify `tsc` passes
- [x] 2.2 Add the five templates (`employees`, `certificates`, `clients`, `suppliers`, `tenders`) reusing the form schemas; verify `tsc` passes

## 3. Routes and page

- [x] 3.1 Add `GET`/`POST /api/import/[template]`, the `/settings/import` page with template cards, results and Riwayat Impor, and the Pengaturan → Impor Data menu item
- [x] 3.2 Verify as HCM: the Karyawan template has the Data and Petunjuk sheets; a file missing Jabatan is refused naming the column; a 12-row file with a 15-digit NIK KTP and an unknown position checks as 10 valid / 2 failed with row numbers and creates nothing; Impor creates 10 employees (with pay settings where filled) and the audit log names HCM; importing again fails all rows as existing; the history shows the run
- [x] 3.3 Verify the other templates: Sertifikat (expiry empty = Seumur hidup, unknown NIK fails), Klien CSV with semicolons and a contact, Supplier as Finance (only template offered; Karyawan POST refused 403), Riwayat tender as Marketing (Kalah with date and reason counts in that period's win rate; Kalah without reason fails)
- [x] 3.4 Run `pnpm lint` and `pnpm build`; confirm no server or console errors; check the page at 375 px

## Workflow follow-up

- Archive the change with `/opsx:archive` after verification.

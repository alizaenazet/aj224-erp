# Tasks: add-employee-records

## 1. Database

- [x] 1.1 Write migration `<ts>_employee_records.sql`: employees (generated is_active, exit-date trigger, linked-profile deactivation trigger, prevent_hard_delete, audit), employee_pay_settings (checks, audit), attachments + `can_read_attachment` / `can_write_attachment` / `can_access_attachment_path`, `is_pay_table` + replaced audit_log policy, `profiles.employee_id` + link guard, recreated `list_users()`, RLS, bucket `employee-files` + storage policies; add dev employees, pay settings and links to `supabase/seed.sql`; verify `pnpm db:reset` and `pnpm db:types` succeed
- [x] 1.2 SQL check as roles: HCM inserts and updates an employee, Finance/Operasional/Super Admin read but cannot insert, Marketing and Lapangan read no employees, delete is refused; duplicate NIK karyawan and a 15-digit NIK KTP are refused; future exit date refused; deactivating Lukman sets the lapangan profile inactive
- [x] 1.3 SQL check pay and files: HCM writes pay, Finance and Direktur read, Super Admin and Operasional read no rows; Harian without daily wage refused; pay audit row visible to Direktur only; attachment rows and storage objects for documents readable by HCM/Direktur only, photo readable by Operasional, insert refused for non-HCM and for paths that do not match the row

## 2. Shared pieces

- [x] 2.1 Add `lib/attachments/{config,actions,queries}.ts`, `/api/attachments/[id]` route, `components/attachments/{use-attachment-upload,attachment-list}` (upload control lives in the list; the photo uses the hook directly); verify `tsc` passes
- [x] 2.2 Add `components/app/date-picker.tsx`; extend audit labels (employees, pay settings, profiles.employee_id, `AUDIT_REFS`) and `enrichAuditRows`; hide pay tables from the Log Audit filter for non-Direktur; verify `tsc` passes

## 3. Employees

- [x] 3.1 Add `lib/employees/{labels,schema,queries,actions}.ts`, the `employees` export, and SDM → Karyawan in navigation
- [x] 3.2 Add the list page and toolbar; verify as HCM: list, search by name/NIK/phone, filter Lapangan + Aktif, export contains the same rows; as Finance no add action; as Marketing "Akses ditolak" and no menu item
- [x] 3.3 Add new/edit pages with the employee form; verify as HCM: create Agus Salim AJ-0101 (Lapangan, Linesman/Pemanjat), duplicate AJ-0101 refused with "Data yang sama sudah ada.", 15-digit NIK KTP refused, position change Helper → Linesman/Pemanjat shown in Riwayat as Direktur
- [x] 3.4 Add the detail page (Data, Dokumen, Gaji tabs) with photo, documents and pay card; verify as HCM: upload a large JPG photo (stored ≤ 1 MB) and a PDF as Kontrak kerja, a 12 MB PDF and a .zip refused, open the PDF through the temporary link, remove the KK file; simulate an offline upload and retry with "Coba lagi"; as Operasional no Dokumen or Gaji tab and the document API link returns 404
- [x] 3.5 Pay settings dialog; verify as HCM: Harian Rp 150.000 + uang makan Rp 25.000 + tunjangan lapangan Rp 30.000 saved and shown as Rupiah, Harian without daily wage refused, negative refused; as Finance read-only; as Super Admin no Gaji tab; as Direktur the change appears in the pay Riwayat and Log Audit, and Super Admin's Log Audit shows no pay entry
- [x] 3.6 Nonaktifkan/Aktifkan; verify as HCM: deactivate the employee linked to the lapangan user with today's date → Nonaktif, and the lapangan session is signed out and cannot sign in; a future exit date is refused; reactivating the employee leaves the account inactive

## 4. Account linking

- [x] 4.1 Add the Karyawan column, "Belum terhubung" badge, `LinkEmployeeDialog` and `linkEmployee` action; verify as Super Admin: link the lapangan user to an employee and see the name, linking a second account to the same employee refused, an inactive employee is not offered and is refused by the database, unlink works; as Direktur the column shows without the action

## 5. Integration

- [x] 5.1 Run `pnpm lint` and `pnpm build`; confirm no server or console errors on the new pages; check the employee list and detail at 375 px

## Workflow follow-up

- Archive the change with `/opsx:archive` after verification.

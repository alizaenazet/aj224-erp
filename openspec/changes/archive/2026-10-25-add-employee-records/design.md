# Design: add-employee-records

## Context

See proposal.md. Building blocks already in place:
- **RLS helpers:** `has_role()`, `current_app_role()`, `is_active_user()`.
- **Audit:** the trigger `audit_row_change(key)` and the history sheet.
- **List kit:** `DataTable`, toolbar, filters, export registry.
- **Master data:** `positions`.
- **Profile guards:** no self-deactivation; at least one Super Admin.
- **Deactivation pattern:** `setUserActive`, which flips the profile row and bans the auth user.

## Goals / Non-Goals

**Goals:**
- One employee record.
- Pay settings that are physically separate and unreadable outside HCM, Finance and Direktur.
- A generic attachment service that later modules plug into by adding cases to two SQL functions and one entry in a client config.

**Non-Goals:**
- Lapangan crew access (comes with assignments).
- Certificates.
- Import.
- Payroll maths.

## Decisions

### Tables (migration `…_employee_records.sql`)
| Table | Key fields | Notes |
|---|---|---|
| `employees` | employee_no (unique `lower(btrim)`), full_name, nik_ktp (`^\d{16}$`, partial unique when not null), birth_place, birth_date, address, phone, emergency_contact_name, emergency_contact_phone, blood_type (`A`/`B`/`AB`/`O`), employment_status (`permanent`/`contract`/`daily`), work_type (`office`/`field`), position_id → positions (restrict), join_date, exit_date (≥ join_date), bank_name, bank_account_number, bank_account_holder, bpjs_number, `is_active boolean generated always as (exit_date is null) stored`, created_by, timestamps | **Audit trigger** (insert and update). Delete is revoked, so employees are never deleted. **BEFORE trigger:** refuses an exit date after `today_wib()` ("Tanggal keluar tidak boleh melewati hari ini"). **AFTER UPDATE trigger:** when exit_date goes from null to a value, sets `is_active = false` on the linked profile (security definer). |
| `employee_pay_settings` | employee_id pk → employees (cascade), pay_type (`daily`/`monthly`), daily_wage, base_salary, fixed_allowance, meal_allowance_per_day, field_allowance_per_day, overtime_rate_per_hour, fixed_deduction, timestamps | Every amount is `numeric(14,2) ≥ 0`. Check: daily needs daily_wage; monthly needs base_salary. Components default to 0. Audit trigger keyed `employee_id`. |
| `attachments` | id, entity_type, entity_id uuid, category (`^[a-z_]+$`), bucket, path (unique), file_name, mime_type, size_bytes (1 … 10 485 760), uploaded_by default `auth.uid()`, created_at | Path format is `<entity_type>/<entity_id>/<category>/<uuid>.<ext>`. A check keeps the path's first three segments equal to the row's columns. `attachment_bucket(entity_type)` names the bucket each entity type must use. |
| `profiles.employee_id` | uuid unique → employees (set null) | Grant update(employee_id) to authenticated, so the existing Super Admin update policy applies. A guard trigger refuses linking an inactive employee ("Karyawan nonaktif tidak dapat dihubungkan"). A unique violation is mapped in the action to "Karyawan sudah terhubung dengan akun lain." |

`list_users()` is dropped and recreated with `employee_id` and `employee_name` (the return type changes).

### Exit date instead of a status column
- Making `is_active` generated from `exit_date` means the two can never disagree, and later modules filter `is_active`.
- Deactivating and reactivating are a separate action, not part of the edit form:
  - **Nonaktifkan:** a dialog asks for the exit date (default today) and warns about the linked account.
  - **Aktifkan kembali:** clears the exit date.
- The linked account is not reactivated automatically. Super Admin does that on Pengguna & Peran.

### Linked account deactivation
- **Profile row:** the AFTER UPDATE trigger flips `profiles.is_active` in the same transaction. Data access stops immediately, because RLS reads profiles. The trigger runs through `profiles_guard`, so deactivating the last Super Admin, or HCM deactivating their own linked record, is refused with the existing messages.
- **Auth user:** `setEmployeeActive` then bans the linked user with the admin client (`876000h`), exactly like `setUserActive`. Sign-in and token refresh then fail too. If the ban call fails, the action reports it, but the profile is already inactive, which is the safe state.

### RLS (PRD §13)
- **employees:**
  - select: `super_admin`, `director`, `finance`, `hcm`, `operations`
  - insert/update: `hcm`
  - delete: revoked (and the trigger refuses it)
- **employee_pay_settings:**
  - select: `hcm`, `finance`, `director`
  - insert/update: `hcm`
  - delete: revoked
  - Super Admin gets no policy, so they see no rows.
- **audit_log:** the select policy is replaced. Rows whose `table_name` is a pay table (`public.is_pay_table(name)`: `employee_pay_settings` now, payroll tables later via `create or replace`) are visible to `director` only. All other rows stay visible to `super_admin` and `director`.
- **Attachment access functions** (security invoker, so they see the record through the caller's own RLS):
  - **`can_read_attachment(entity_type, entity_id, category)`:** for `employee`, the employee must be visible to the caller, and either the category is `photo` or the caller is `hcm` or `director`.
  - **`can_write_attachment(...)`:** for `employee`, the caller must be `hcm` and the employee must exist. Other entity types return false until their change adds a case.
  - **`can_access_attachment_path(name, write)`:** parses a storage object name safely (bad paths return false) and calls one of the two functions above.
- **attachments:**
  - select: `can_read_attachment`
  - insert: `uploaded_by = auth.uid()` and `can_write_attachment`
  - delete: `can_write_attachment`
  - update: none
- **Storage:** bucket `employee-files` is private, limited to 10 MB and to pdf, jpeg, png and xlsx MIME types. Object select/insert/delete policies call `can_access_attachment_path`; there is no update (uploads use `upsert: false`).

### Attachment flow (UMM-03)
- **`lib/attachments/config.ts`** (client-safe) holds per entity type: the bucket, categories with labels (`photo` Foto, `ktp` KTP, `kk` KK, `contract` Kontrak kerja, `diploma` Ijazah, `other` Lainnya), and the allowed MIME types. It also exports `MAX_FILE_BYTES = 10 MB` and `MAX_PHOTO_BYTES = 1 MB`.
- **Client upload (`components/attachments/use-attachment-upload.ts`):**
  - Validate the type and size, with Indonesian messages listing the allowed types.
  - Compress JPG/PNG with `browser-image-compression` (`maxSizeMB: 1`, `maxWidthOrHeight: 1920`, web worker). If the result is still over 1 MB, retry as JPEG.
  - Upload straight to Storage with the browser client at the path above, so large files skip the Server Action body limit and can be retried.
  - Call the `registerAttachment` action, which validates and inserts the row under RLS. If registering fails, remove the uploaded object.
  - The failed state keeps the compressed `File`, so "Coba lagi" re-sends it without choosing the file again.
- **Viewing:** `GET /api/attachments/[id]` reads the row under RLS, creates a 5-minute signed URL and redirects to it. Links open in a new tab and avoid popup blockers. A 404 is returned when the row is not visible.
- **Removing:** `deleteAttachment(id)` deletes the row under RLS, then removes the object, using the signed-in client for both.
- **Photo:**
  - It is an attachment with category `photo`. Uploading a new one deletes the previous one after the new one is registered.
  - The detail page creates a signed URL for it server-side and shows it in `Avatar`.

### Audit labels with references
`lib/audit/labels.ts` gains:
- Labels for `employees` and `employee_pay_settings`, with Rupiah formatters for the amounts.
- `profiles.employee_id`.
- `AUDIT_REFS`, a map from a field to its referenced table and display column: `employees.position_id` → `positions.name`, `profiles.employee_id` → `employees.full_name`.

`withActorNames` becomes `enrichAuditRows`. Besides the actor names, it resolves those ids to names, one query per referenced table, so history shows "Jabatan: Helper → Linesman/Pemanjat".

### App structure
- **`lib/employees/`:**
  - `labels.ts`: status, type and blood-type labels; the row type.
  - `schema.ts`: `employeeSchema` and `paySettingsSchema`, shared by client and server. `.nullable()` comes before transforms, and numbers are preprocessed `"" | NaN → null`.
  - `queries.ts`: `parseEmployeeListParams`, `queryEmployees`, `getEmployee`, `getPaySettings`, `employeeOptions` (for the link combobox).
  - `actions.ts`: `createEmployee`, `updateEmployee`, `setEmployeeActive`, `savePaySettings`.
- **`lib/attachments/`:** `config.ts`, `actions.ts` (`registerAttachment`, `deleteAttachment`), `queries.ts` (`listAttachments`, `signedPhotoUrl`).
- **Routes:**
  - `/hr/employees`: list. Readers: SA, Dir, Fin, HCM, Ops. HCM sees "Tambah Karyawan".
  - `/hr/employees/new` and `/hr/employees/[id]/edit`: HCM only.
  - `/hr/employees/[id]`: detail. Readers as for the list.
- **Detail page layout:**
  - Header: name, NIK karyawan, and badges for status, type and position. Actions are Ubah, Nonaktifkan/Aktifkan (HCM) and Riwayat (SA/Dir).
  - Tabs:
    - **Data:** a card with field rows and the photo.
    - **Dokumen:** HCM/Dir; `AttachmentList`.
    - **Gaji:** HCM/Fin/Dir; the pay card, with Ubah for HCM and Riwayat for Dir.
- **Users page:**
  - A "Karyawan" column shows the linked name. A Lapangan user without a link shows a "Belum terhubung" outline badge.
  - Menu item "Hubungkan Karyawan" (SA) opens `LinkEmployeeDialog`, a Command combobox of active employees with "Lepas tautan".
  - Action `linkEmployee({userId, employeeId|null})`.
- **Navigation:** SDM → Karyawan `/hr/employees` (SA, Dir, Fin, HCM, Ops).
- **Export:** `employees` uses the same query and readers, with columns NIK karyawan, Nama, NIK KTP, Jabatan, Tipe, Status kerja, No. HP, Tanggal masuk, Tanggal keluar, Status.

### shadcn components
Existing: Card, Tabs, Badge, Avatar, Button, Dialog, AlertDialog, Field, Input, InputGroup ("Rp" addon), Select, Textarea, Popover + Calendar, Command, Table, DropdownMenu, Empty, Skeleton, Alert.

New:
- `components/app/date-picker.tsx`: Popover + Calendar + Button, a value string `yyyy-MM-dd`, Indonesian locale.
- `components/attachments/attachment-list.tsx` (includes the category picker and upload button).
- `components/app/rupiah-input.tsx`: InputGroup with an "Rp" addon.
- `components/employees/*`.

No new shadcn primitives are needed beyond `command` (already added).

### Seed (dev only)
- About 12 employees covering both types and all statuses, with pay settings for most.
- Lukman Hakim (field, Linesman/Pemanjat) is linked to the lapangan user.
- Office employees are linked to the Marketing, Finance, HCM and Operasional users.
- One inactive employee with an exit date.

## Risks / Trade-offs
- **Generated `is_active`:** a future-dated exit cannot be scheduled; HCM enters it on the day. This keeps one source of truth.
- **Direct-to-storage upload:** an orphaned object is possible if the tab closes between upload and register. It is unreadable (no row), and a later cleanup job can remove orphans.
- **Security-invoker access functions:** they depend on employee RLS. This is intended ("access follows the record"), but later entity cases must keep their own record's RLS correct.
- **Super Admin and pay audit rows:** hidden by policy. The Log Audit table filter also leaves out pay tables for anyone but Direktur, so Super Admin is not offered a filter that can never show rows.

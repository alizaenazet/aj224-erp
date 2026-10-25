# Design: add-data-import

## Context

See proposal.md. Building blocks already in place:
- **`exceljs`:** already used by exports.
- **Shared zod schemas:** `employeeSchema`, `paySettingsSchema`, `certificateSchema`, `clientSchema`, `contactSchema`, `tenderSchema`, `tenderStatusSchema`, and `buildMasterSchema` for suppliers.
- **Database rules:** RLS per role and the audit trigger.

## Goals / Non-Goals

**Goals:**
- One import engine with a registry of templates, so later changes add a template file and nothing else.
- Exactly the form rules, reused rather than rewritten.

**Non-Goals:**
- Updating records by import.
- Background jobs (files are small: ≤ 2.000 rows).
- Importing files such as certificate scans.

## Decisions

### Flow
1. **Download:** `GET /api/import/[template]` returns the template .xlsx, built from the template definition.
2. **Upload:** `POST /api/import/[template]` takes multipart `file` and `mode` = `check` | `import`. It uses a route handler, not a Server Action, because of the 1 MB Server Action body limit.
3. **Role check:** `assertRole(template.roles)`.
4. **Size check:** the size must be ≤ 5 MB and the extension `.xlsx` or `.csv`.
5. **Parse** (`lib/import/parse.ts`):
   - XLSX: the first worksheet, or the one named `Data`, through exceljs.
   - CSV: a small RFC 4180 parser. The delimiter (`;` or `,`) is detected from the header line, and a UTF-8 BOM is stripped.
   - Row 1 is the header. Blank rows are skipped. More than 2.000 data rows are refused.
6. **Match columns:**
   - Headers are normalised: lower case, `*` removed, whitespace collapsed.
   - Missing required columns refuse the whole file ("Kolom wajib tidak ditemukan: Jabatan, …").
7. **Validate:** `template.prepare(rows, ctx)` turns every row into either a prepared value (insert payload) or errors `{ row, column?, message }`. `ctx` holds the signed-in Supabase client plus lookups loaded once: positions by lower name, certificate types, employees by lower NIK karyawan, clients by lower name, existing unique keys. In-file duplicates are tracked in the same pass.
8. **Check mode:** returns `{ total, valid, failed, errors }`.
9. **Import mode:**
   - `template.insert(valid, ctx)` inserts in chunks of 200 with the signed-in client, so RLS and audit apply.
   - When a chunk fails, it is retried row by row, so the failing rows are named (`dbErrorMessage`).
   - Child rows (pay settings, client contacts) are inserted after their parents, mapped by the returned ids.
10. **History:** import mode writes `import_runs` (template, file name, totals, the first 200 errors) and returns the result.

### Cell conversion (`lib/import/cells.ts`)
- **Text:** strings are trimmed. Rich text, hyperlink and formula results are unwrapped. Empty cells become null.
- **Dates:**
  - Excel date cells use their UTC date part, matching how exports write WIB dates.
  - Text dates are accepted as `yyyy-mm-dd`, `dd/mm/yyyy` or `dd-mm-yyyy`. Anything else fails with "Format tanggal tidak dikenali (gunakan yyyy-mm-dd atau dd/mm/yyyy)".
- **Numbers:**
  - Numeric cells are used as they are.
  - Text numbers:
    - "Rp" and spaces are removed.
    - Indonesian decimal comma is accepted (`12,5`).
    - Dot thousands are accepted (`150.000`).
    - Anything else fails.
- **Choices:** values are matched case-insensitively against the Indonesian labels (e.g. "Harian Lepas" → `daily`) or the code. The error lists the allowed labels.

### Templates (`lib/import/templates/*.ts`, registry `lib/import/registry.ts`)
| Key | Roles | Columns (required *) | Checks / inserts |
|---|---|---|---|
| `employees` | hcm | NIK Karyawan*, Nama*, NIK KTP, Tempat Lahir, Tanggal Lahir, Alamat, No. HP, Kontak Darurat, No. HP Kontak Darurat, Golongan Darah, Status Kerja*, Tipe*, Jabatan*, Tanggal Masuk*, Bank, No. Rekening, Atas Nama, No. BPJS, Tipe Gaji, Upah Harian, Gaji Pokok, Tunjangan Tetap, Uang Makan/Hari, Tunjangan Lapangan/Hari, Tarif Lembur/Jam, Potongan Tetap | `employeeSchema`. Position by active name. Unique NIK karyawan and NIK KTP. Pay columns are optional; when any is filled, Tipe Gaji is required and `paySettingsSchema` applies. Inserts employees, then pay settings. |
| `certificates` | hcm | NIK Karyawan*, Jenis Sertifikat*, Nomor, Penerbit, Tanggal Terbit*, Tanggal Kedaluwarsa, Catatan | `certificateSchema`. Employee by NIK karyawan; type by active name. An empty expiry means Seumur hidup. Duplicate = same employee, type and issue date. |
| `clients` | super_admin, marketing | Nama Perusahaan*, Jenis*, Alamat, NPWP, Termin Pembayaran (hari), Catatan, Nama Kontak, Jabatan Kontak, No. HP Kontak, Email Kontak | `clientSchema` (term defaults to 30, active). Unique name. `contactSchema` when Nama Kontak is filled. Inserts clients, then contacts. |
| `suppliers` | super_admin, finance | Nama*, Kategori*, Kontak, Telepon, Email, Alamat, NPWP, Bank, No. Rekening, Atas Nama, Termin Pembayaran (hari), Catatan | `buildMasterSchema(suppliers.fields, "create")`. Unique name. |
| `tenders` | marketing | Nama Paket*, Klien*, Pemilik Akhir, Lokasi, Tegangan (kV), Panjang (kms), Jumlah Tower, Lingkup Pekerjaan, Tanggal Informasi, Batas Penawaran, Nilai Penawaran, Estimasi Biaya, Peluang Menang (%), Status*, Tanggal Penutupan, Alasan Kalah, Pemenang, Harga Pemenang, Catatan | `tenderSchema` + `tenderStatusSchema`. Client by name. Menang/Kalah/Batal require Tanggal Penutupan (≤ today). Duplicate = same package name and client. The insert writes status fields directly; the triggers record the first bid revision and check closing data. |

### Template workbook (`lib/import/workbook.ts`)
- **Data sheet:**
  - Bold frozen header. Required titles end in " *".
  - Column widths are set.
  - List data validation (rows 2–2001) for short choices: status, type, blood type, pay type, kind, category, voltage, lost reason.
  - Date and number columns get matching number formats.
- **Petunjuk sheet:**
  - General rules (start at row 2, keep the titles, date and number formats, existing data is never overwritten).
  - A table of Kolom / Wajib / Keterangan / Contoh.
  - Master lists (positions, certificate types, clients) are written at the bottom from the live data when the template is downloaded.

### Database (migration `…_data_import.sql`)
- **`import_runs`:** template, file_name, mode (`import` only), total_rows, imported_rows, failed_rows, errors jsonb (first 200), created_by default `auth.uid()`, created_at.
- **RLS:**
  - insert: an active user with `created_by = auth.uid()`
  - select: own runs, or `super_admin`/`director`
  - no update/delete

### UI
- **Route:** `/settings/import` (roles: super_admin, director, hcm, marketing, finance). Direktur sees the history only, with no templates. The menu item is Pengaturan → Impor Data (`FileUpIcon`).
- **Cards:** one Card per allowed template, with:
  - Description and "Unduh templat".
  - A file chooser (hidden input + Button) showing the chosen file name.
  - "Periksa" and "Impor" buttons. "Impor" is confirmed with AlertDialog when there are failed rows from the last check.
  - A result Alert with totals, plus a Table of failures (Baris, Kolom, Alasan); the first 200 are shown, with a note when there are more.
- **Riwayat Impor:** a table of the last 50 runs visible to the user (Waktu, Pengguna via `list_people`, Templat, Berkas, Total, Berhasil, Gagal).

### shadcn components
Existing components only: Card, Button, Alert, AlertDialog, Table, Badge, Empty.

## Risks / Trade-offs
- **Row-by-row fallback:** it is slow only when a chunk fails, which is rare after validation. The 2.000-row cap keeps a request under a few seconds.
- **No dry-run cache:** the file is uploaded again for Impor. That is simple and stateless, and a re-check happens anyway.
- **Data races:** a row valid at check time can fail at import, for example when someone added the same NIK meanwhile. It is then reported as a failed row by the database error.

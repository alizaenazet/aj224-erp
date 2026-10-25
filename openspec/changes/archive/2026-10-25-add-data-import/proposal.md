# Proposal: add-data-import

## Why

Go-live needs the company's existing data in the system before people start working in it (PRD §16): employees with pay settings before attendance starts, certificates, clients and suppliers, and at least two years of tender history as the basis of the first win rates. Typing hundreds of rows by hand is slow and error-prone. UMM-13 asks for template-based Excel/CSV import that shows every failed row with its reason and still saves the valid ones.

## What Changes

- **Impor data (UMM-13, Wajib):** a Pengaturan → Impor Data page that offers each user the templates their role may import.
- **Templates:**
  - Each template is a downloadable .xlsx with a Data sheet (fixed column titles, required columns marked *, drop-down lists for short choices) and a Petunjuk sheet (every column, whether it is required, the allowed values and an example).
- **Uploads:**
  - XLSX or CSV (comma or semicolon), up to 5 MB and 2.000 rows.
  - Columns are matched by title. A file missing a required column is refused as a whole.
- **Periksa then Impor:**
  - "Periksa" validates every row without saving.
  - "Impor" saves all valid rows and lists every failed row with its row number, column and reason.
  - Rows that already exist (or repeat inside the file) are failed rows; import never overwrites.
  - Rows are validated with the same rules as the forms, and saved under the user's own permissions (RLS and audit apply).
- **Templates in this change:**
  - Karyawan, with optional pay settings (HCM).
  - Sertifikat karyawan (HCM).
  - Klien, with one contact per row (Super Admin, Marketing).
  - Supplier (Super Admin, Finance).
  - Riwayat tender (Marketing).
- **Riwayat impor:** every import is recorded (who, when, template, file, totals, the first errors). Users see their own runs; Super Admin and Direktur see all.
- Later changes register their own templates (projects, sections, tools, materials, opening balances, kasbon) in the same registry.

## Capabilities

### New Capabilities
- `platform/data-import`: Template download, file upload, row validation with per-row errors, partial import of valid rows, and import history.

### Modified Capabilities
None. Imported rows follow the existing rules of `hcm/employees`, `hcm/pay-settings`, `hcm/certifications`, `marketing/clients`, `master-data/suppliers` and `marketing/tenders`.

## Impact

- **Database:** table `import_runs` with RLS.
- **App:**
  - `lib/import/*`: parsing, cell conversion, the template registry with five templates, template workbook builder, runner.
  - `GET /api/import/[template]` (template file) and `POST /api/import/[template]` (check or import).
  - `/settings/import` page and its menu item.
- **Dependencies:** none new (`exceljs` is already used for export).

## Out of scope

- Templates for projects, sections, tools, materials, opening balances and kasbon: added by their changes (`add-projects-contracts`, `add-sections-progress`, `add-equipment-mobilization`, `add-material-stock`, `add-project-pl`, `add-payroll`).
- Updating existing records by import, and certificate scan files (uploaded per certificate).

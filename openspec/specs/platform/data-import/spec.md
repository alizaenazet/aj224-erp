# platform/data-import Specification

## Purpose
Loads existing company data from Excel or CSV templates, reports every rejected row with its reason, and keeps the valid rows, so go-live data entry is fast and checkable (UMM-13, PRD §16).

## Requirements

### Requirement: Import templates
Each importable data type SHALL have a downloadable .xlsx template with a Data sheet whose first row holds the fixed column titles (required columns marked with *) and a Petunjuk sheet describing every column, whether it is required, its allowed values or format, and an example. (UMM-13)

#### Scenario: Download template
- **WHEN** an HCM user downloads the Karyawan template
- **THEN** the file has a Data sheet starting with "NIK Karyawan *" and a Petunjuk sheet listing the allowed Status Kerja values Tetap, Kontrak and Harian Lepas

### Requirement: Upload and column matching
Users SHALL upload a filled template as XLSX or CSV (comma or semicolon separated) of at most 5 MB and 2.000 data rows; columns SHALL be matched by title regardless of case and the * marker, extra columns SHALL be ignored, and a file missing a required column SHALL be refused as a whole with the missing titles named. (UMM-13)

#### Scenario: Missing required column
- **WHEN** a Karyawan file has no "Jabatan" column
- **THEN** nothing is imported and the message names the missing column Jabatan

#### Scenario: CSV with semicolons
- **WHEN** a Klien CSV saved by Excel with semicolons is uploaded
- **THEN** its rows are read the same as from the XLSX template

### Requirement: Row validation with reasons
Every row SHALL be validated with the same rules as the matching form, plus references by name or number (position, certificate type, employee, client) and uniqueness against existing data and earlier rows of the same file; every failed row SHALL be reported with its row number, the column when known, and a reason in Bahasa Indonesia. (UMM-13)

#### Scenario: Invalid rows reported
- **WHEN** a Karyawan file has a 15-digit NIK KTP on row 4 and an unknown position on row 7
- **THEN** row 4 is reported for NIK KTP and row 7 for Jabatan, each with its reason

#### Scenario: Existing record
- **WHEN** a row repeats an NIK karyawan that already exists
- **THEN** that row fails with a reason that the data already exists, and the existing employee is not changed

### Requirement: Check before import
"Periksa" SHALL validate the file and show the number of valid and failed rows with the failures, without saving anything. (UMM-13)

#### Scenario: Check only
- **WHEN** HCM checks a file with 10 valid and 2 invalid rows
- **THEN** the result shows 10 valid and 2 failed rows and no employee is created

### Requirement: Partial import of valid rows
"Impor" SHALL save every valid row and report the failed rows with their reasons, saving under the user's own permissions so access rules and the audit log apply. (UMM-13, PRD §13)

#### Scenario: Valid rows saved
- **WHEN** HCM imports a file with 10 valid and 2 invalid rows
- **THEN** 10 employees are created, the 2 failed rows are listed with reasons, and importing the same file again fails all rows as already existing

### Requirement: Templates and permissions
This change SHALL provide the templates Karyawan with optional pay settings (HCM), Sertifikat karyawan (HCM), Klien with one optional contact per row (Super Admin, Marketing), Supplier (Super Admin, Finance) and Riwayat tender (Marketing); a user SHALL see and use only the templates of data they may manage. (UMM-13, PRD §13, §16)

#### Scenario: Role-scoped templates
- **WHEN** a Finance user opens Impor Data
- **THEN** only the Supplier template is offered, and posting a Karyawan file is refused

#### Scenario: Tender history
- **WHEN** Marketing imports a tender row with status Kalah, closing date 15 Agu 2025 and reason Harga
- **THEN** the tender is created as Kalah closed on that date and counts in that period's win rate

#### Scenario: Lost without reason
- **WHEN** a tender row has status Kalah without Alasan Kalah
- **THEN** that row fails with a reason that the lost reason is required

### Requirement: Import history
Every import SHALL be recorded with user, time, template, file name, total, imported and failed rows and the first failures; users SHALL see their own imports and Super Admin and Direktur SHALL see all. (UMM-13, UMM-08)

#### Scenario: History listed
- **WHEN** HCM has imported a Karyawan file
- **THEN** Riwayat Impor shows the run with 10 imported and 2 failed rows

# Spec Delta

## Purpose

Lets users export any list or report to an Excel (.xlsx) file containing the same data they see, with the filters they applied, for accountants and offline review (UMM-04).

## ADDED Requirements

### Requirement: Export matches the screen
Each list SHALL offer "Ekspor Excel", producing an .xlsx with the same columns as the screen and every row that matches the active search and filters across all pages. (UMM-04)

#### Scenario: Filtered export
- **WHEN** a Super Admin filters Pengguna & Peran by Peran "Finance" and exports
- **THEN** the file lists exactly the Finance users with columns Nama, Email, Peran, Status, Login Terakhir

#### Scenario: All pages included
- **WHEN** a list with 60 matching rows is exported while page 1 is shown
- **THEN** the file contains all 60 rows

### Requirement: Readable values
Exported files SHALL use Indonesian column headers and display values (role and status labels), dates as real dates in WIB, and money as numbers formatted "Rp" without decimals. (UMM-04, PRD §14)

#### Scenario: Date and label values
- **WHEN** Log Audit is exported
- **THEN** Waktu cells are dates in WIB and Tindakan shows "Dibuat", "Diubah" or "Dibatalkan"

### Requirement: Export respects access
Exports SHALL contain only data the requesting user may see, and users without access to a list SHALL be refused. (UMM-04, UMM-02)

#### Scenario: Unauthorized export
- **WHEN** an HCM user requests the Log Audit export directly by URL
- **THEN** the request is refused and no file is produced

### Requirement: File naming
Exported files SHALL be named after the list and the export date in WIB, e.g. `pengguna-2026-10-25.xlsx`. (UMM-04)

#### Scenario: File name
- **WHEN** Pengguna & Peran is exported on 25 Okt 2026
- **THEN** the downloaded file is named `pengguna-2026-10-25.xlsx`

# Spec Delta

## Purpose

Adds the Alat import template for Operasional (ALT-01, UMM-13).

## MODIFIED Requirements

### Requirement: Templates and permissions
The import SHALL provide the templates Karyawan with optional pay settings (HCM), Sertifikat karyawan (HCM), Absensi (HCM), Klien with one optional contact per row (Super Admin, Marketing), Supplier (Super Admin, Finance), Riwayat tender (Marketing), Seksi Tarik by project code (Operasional) and Alat with opening stock (Operasional); a user SHALL see and use only the templates of data they may manage. (UMM-13, PRD §13, §16, PRJ-05, HCM-10, ALT-01)

#### Scenario: Role-scoped templates
- **WHEN** a Finance user opens Impor Data
- **THEN** only the Supplier template is offered, and posting a Karyawan file is refused

#### Scenario: Tender history
- **WHEN** Marketing imports a tender row with status Kalah, closing date 15 Agu 2025 and reason Harga
- **THEN** the tender is created as Kalah closed on that date and counts in that period's win rate

#### Scenario: Lost without reason
- **WHEN** a tender row has status Kalah without Alasan Kalah
- **THEN** that row fails with a reason that the lost reason is required

#### Scenario: Sections by project code
- **WHEN** Operasional imports rows for project PRJ/AJ224/2026/001 with sections S-05 and S-06, and a row whose section code already exists in that project
- **THEN** S-05 and S-06 are created with their kms and the duplicate row fails with a reason

#### Scenario: Office attendance
- **WHEN** HCM imports attendance rows for AJ-0005 on two dates with Hadir and Cuti, and a row with a future date
- **THEN** the two records are saved and the future-dated row fails with a reason

#### Scenario: Tools with opening stock
- **WHEN** Operasional imports a Per Jumlah row "PUL-01 Pulley 30 Baik at GDG-LMG" and a Per Unit row with quantity 2
- **THEN** the pulley is created with 30 Baik at Gudang Lamongan and the Per Unit row fails with a reason

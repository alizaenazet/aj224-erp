# Spec Delta

## Purpose

Adds the Seksi Tarik import template so Operasional can load a project's sections from Excel (PRJ-05, UMM-13).

## MODIFIED Requirements

### Requirement: Templates and permissions
The import SHALL provide the templates Karyawan with optional pay settings (HCM), Sertifikat karyawan (HCM), Klien with one optional contact per row (Super Admin, Marketing), Supplier (Super Admin, Finance), Riwayat tender (Marketing) and Seksi Tarik by project code (Operasional); a user SHALL see and use only the templates of data they may manage. (UMM-13, PRD §13, §16, PRJ-05)

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

# platform/audit-log Specification

## Purpose
Keeps a tamper-resistant trail of who changed sensitive records, when, and from what to what, and lets Super Admin and Direktur review that history per record and across the system (UMM-08).

## Requirements

### Requirement: Audited changes are recorded automatically
For every table that opts into auditing, the system SHALL record each insert and each update that changes data: table, record, action, the user who made it (or "Sistem" for scheduled jobs), time, and the old and new values of the changed fields. (UMM-08)

#### Scenario: Role change recorded
- **WHEN** a Super Admin changes Maya's role from Marketing to Finance
- **THEN** the audit log holds an entry for Maya's user record with action "Diubah", the Super Admin as actor, and the field Peran changed from Marketing to Finance

#### Scenario: Invitation recorded with the inviter
- **WHEN** a Super Admin invites a new user
- **THEN** the audit log holds a "Dibuat" entry for that user with the Super Admin as actor

#### Scenario: Update without real change
- **WHEN** an audited record is saved with no field values changed
- **THEN** no audit entry is written

### Requirement: Cancellations and overrides are recorded with their reason
The system SHALL record a cancellation (status Batal) and any explicit override as distinct audit actions ("Dibatalkan", "Override") together with the reason given. (UMM-08, UMM-11)

#### Scenario: Cancellation with reason
- **WHEN** an audited transaction is cancelled with the reason "Salah input"
- **THEN** its audit entry has action "Dibatalkan" and reason "Salah input"

### Requirement: Audit entries cannot be edited or deleted by users
No user role SHALL be able to insert, change or delete audit entries directly; entries are written only by the system. (UMM-08, PRD §14)

#### Scenario: Direct write refused
- **WHEN** any signed-in user tries to insert, update or delete an audit entry through the API
- **THEN** the request is refused

### Requirement: Record history for Super Admin and Direktur
Super Admin and Direktur SHALL be able to open the change history of a single record, newest first, showing time (WIB), actor, action, reason and each changed field with old and new values. Other roles SHALL NOT see audit entries. (UMM-08, PRD §13)

#### Scenario: History of a user
- **WHEN** a Direktur opens "Riwayat" for Maya on Pengguna & Peran
- **THEN** a panel lists Maya's audit entries newest first with actor, time and changed fields

#### Scenario: Other roles refused
- **WHEN** a Finance user reads the audit log through the API
- **THEN** no entries are returned

### Requirement: Global audit log page
Super Admin and Direktur SHALL have a Log Audit page under Pengaturan listing all audit entries newest first, filterable by data type and paginated. (UMM-08, PRD §13)

#### Scenario: Filter by data type
- **WHEN** a Super Admin opens Log Audit and filters by "Pengguna"
- **THEN** only entries for user records are listed, 50 per page

#### Scenario: Page hidden from other roles
- **WHEN** an HCM user opens `/settings/audit-log`
- **THEN** they see "Akses ditolak" and the menu does not list Log Audit

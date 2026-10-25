# master-data/positions-certificates Specification

## Purpose
Defines job positions, certificate types with default validity, and which certificates each position requires, which the assignment check (HCM-06) and training needs (HCM-08) rely on (MST-06, MST-07).

## Requirements

### Requirement: Default positions
The system SHALL start with the positions Site Manager, Pengawas, Mandor, Linesman/Pemanjat, Operator Mesin, Helper, Driver, Safety Officer, Admin Proyek and Staf Kantor. (MST-06)

#### Scenario: Seeded positions
- **WHEN** an HCM user opens Jabatan on a new installation
- **THEN** the 10 positions are listed

### Requirement: Certificate types with default validity
The system SHALL keep certificate types with a name and a default validity in months, where an empty validity means lifetime, starting with TKBT Tingkat 1, TKBT Tingkat 2, SKTTK, Ahli K3 Umum, SIO Operator, P3K and SIM B1. (MST-07)

#### Scenario: Lifetime type
- **WHEN** an HCM user saves a certificate type without a validity
- **THEN** it is shown with validity "Seumur hidup"

#### Scenario: Invalid validity
- **WHEN** the validity is entered as 0 or a negative number
- **THEN** the form refuses it

### Requirement: Required certificates per position
HCM SHALL set, per position, which certificate types are required; a position may require none. (MST-06)

#### Scenario: Set requirements
- **WHEN** an HCM user marks TKBT Tingkat 2 as required for Linesman/Pemanjat
- **THEN** Linesman/Pemanjat lists TKBT Tingkat 2 as a required certificate

#### Scenario: Position without requirements
- **WHEN** Helper has no required certificates
- **THEN** its required certificate list shows "Tidak ada"

### Requirement: Position and certificate access by role
Super Admin and HCM SHALL manage positions, certificate types and requirements; Direktur SHALL view them; all signed-in roles SHALL be able to read them for forms. (PRD §13)

#### Scenario: Operasional cannot manage
- **WHEN** an Operasional user tries to change a position's required certificates through the API
- **THEN** the change is refused

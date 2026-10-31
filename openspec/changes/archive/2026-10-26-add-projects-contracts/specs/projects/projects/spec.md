# Spec Delta

## Purpose

Keeps one record per project with its code, client, status, schedule, location and documents, and gives every project one page whose tabs show the data of each module without retyping (PRJ-01, PRJ-09, PRJ-10, MST-04).

## ADDED Requirements

### Requirement: Project records
Marketing and Finance SHALL create projects with name, client, end owner, location text, voltage, length (kms), tower count, start date and target finish date; the system SHALL give each project a unique code from the `project` document number and SHALL NOT allow projects to be deleted. (PRJ-01, UMM-10, UMM-11)

#### Scenario: Create project
- **WHEN** Finance creates project "Stringing SUTT 150 kV Tuban – Jenu" for client PT Karya Konstruksi Negara (Persero)
- **THEN** it gets the next code such as PRJ/AJ224/2026/003 and status Persiapan

### Requirement: One location per project
Creating a project SHALL create exactly one location of type Proyek with a code derived from the project code and the project name, used later by tools and materials. (MST-04)

#### Scenario: Project location created
- **WHEN** project PRJ/AJ224/2026/003 is created
- **THEN** a location PRJ-AJ224-2026-003 of type Proyek with the project's name exists and is linked to the project

### Requirement: Project status
A project's status SHALL be one of Persiapan, Berjalan, Tertunda, Selesai and Ditutup; Finance and Operasional SHALL change it among the first four; Ditutup SHALL NOT be selectable until the closing checklist exists. Status changes SHALL be recorded in the audit log. (PRJ-01, PRJ-11)

#### Scenario: Start the project
- **WHEN** Operasional changes a project from Persiapan to Berjalan
- **THEN** the list shows Berjalan and the project history records the change

#### Scenario: Closing not yet available
- **WHEN** someone tries to set status Ditutup
- **THEN** the change is refused with a message that the closing checklist is required

### Requirement: Project list
Proyek → Daftar Proyek SHALL list projects with code, name, client, status and contract value after addenda, with search by code or name, filters for status and client, and Excel export; roles that may not see contract data SHALL NOT see the contract value. (PRJ-01, UMM-09, UMM-04)

#### Scenario: Filter running projects of a client
- **WHEN** Finance filters status Berjalan and client PT PLN (Persero) UIP Jawa Bagian Timur
- **THEN** only that client's running projects are listed and the export matches

### Requirement: Project page and tabs
Each project SHALL have a page with a header (code, name, client, status, tender link) and tabs; this change provides Ringkasan, Kontrak & Termin, RAB & Biaya and Dokumen, each shown only to roles that may see its data. (PRD §9)

#### Scenario: HCM view
- **WHEN** an HCM user opens a project
- **THEN** they see the header and Ringkasan without contract values, and no Kontrak & Termin or RAB & Biaya tab

### Requirement: Project summary
The Ringkasan tab SHALL show the contract value after the latest addendum (with whether PPN applies), the start and target finish dates, the number of payment terms per status with the scheduled total, the total RAB, and the planned profit = contract value − total RAB, all read from the related records. (PRJ-09, PRD §11.3)

#### Scenario: Planned profit
- **WHEN** a project's contract value after addendum is Rp 10.500.000.000 and its RAB totals Rp 9.000.000.000
- **THEN** Ringkasan shows planned profit Rp 1.500.000.000

### Requirement: Project documents
Users who manage contracts or run projects SHALL attach documents to a project as Kontrak, Addendum, BAP, BAST, Gambar, Izin, Korespondensi or Lainnya; Kontrak and Addendum files SHALL be visible only to roles that see contract data, other files to every role that sees the project. (PRJ-10, UMM-03)

#### Scenario: Upload BAP
- **WHEN** Operasional uploads a BAP PDF to a project
- **THEN** it is listed under BAP and can be opened by Finance and HCM

#### Scenario: Contract file hidden from HCM
- **WHEN** an HCM user opens the project's documents
- **THEN** the Kontrak and Addendum files are not listed and their links return 404

### Requirement: Project access by role
Super Admin, Direktur, Marketing, Finance, HCM and Operasional SHALL see the project list and pages; Marketing and Finance SHALL create and edit projects; Lapangan SHALL NOT see projects until assignments exist. (PRD §13)

#### Scenario: Super Admin views only
- **WHEN** a Super Admin opens a project
- **THEN** no edit, status or create actions are offered

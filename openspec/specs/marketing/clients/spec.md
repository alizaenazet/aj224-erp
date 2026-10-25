# marketing/clients Specification

## Purpose
Keeps one record per client with contacts, the history of contact with them, and their tender record, so Marketing can follow up on time and judge each client by results (MKT-01, MKT-02).

## Requirements

### Requirement: Client records
Marketing and Super Admin SHALL create and edit clients with company name (unique), type (Kontraktor EPC, BUMN, PLN, Swasta), address, NPWP, default payment term in days (0–365, default 30), notes and status Aktif/Nonaktif; a client used by a tender SHALL NOT be deleted, only deactivated. (MKT-01)

#### Scenario: Create client
- **WHEN** Marketing saves "PT Mitra Transmisi Nusantara" as Kontraktor EPC with payment term 45 days
- **THEN** the client is listed as Aktif with type Kontraktor EPC

#### Scenario: Duplicate name
- **WHEN** Marketing saves another client named "pt mitra transmisi nusantara"
- **THEN** the save is refused with "Data yang sama sudah ada."

### Requirement: Client contacts
Each client SHALL have any number of contacts with name, position, phone, email and notes, which Marketing and Super Admin add, edit and remove. (MKT-01)

#### Scenario: Add contact
- **WHEN** Marketing adds contact "Ir. Hendra Wijaya, Manajer Pengadaan" with phone and email
- **THEN** the client page lists the contact with a clickable phone and email

### Requirement: Client page
The client page SHALL show the client's data, contacts, activity log and tender history (package, voltage, bid value, status), with the number of tenders, tender value won and the client's win rate by count per PRD §11.1. (MKT-01, PRD §11.1)

#### Scenario: Client statistics
- **WHEN** a client has 2 won and 1 lost tender and 1 cancelled
- **THEN** its win rate is 66,7% and the cancelled tender is not counted

### Requirement: Activity log and follow-ups
Marketing SHALL log visits, calls, meetings and other contact per client (optionally linked to one of the client's tenders) with date, notes and an optional follow-up date, and SHALL mark follow-ups done; a Tindak Lanjut list SHALL show open follow-ups, with due and overdue ones first. Activities SHALL be edited only by their author or a Super Admin. (MKT-02)

#### Scenario: Log a visit with follow-up
- **WHEN** Marketing logs a visit to the client on 25 Okt 2026 with follow-up 28 Okt 2026
- **THEN** the activity appears on the client page and the follow-up appears in Tindak Lanjut

#### Scenario: Follow-up done
- **WHEN** Marketing marks the follow-up done
- **THEN** it leaves the open list and shows as Selesai on the client page

### Requirement: Follow-up reminders
The daily check SHALL notify the activity's author once when an open follow-up is due (follow-up date today or earlier). (MKT-02, UMM-06)

#### Scenario: Due follow-up
- **WHEN** the daily check runs on the follow-up date
- **THEN** the author gets "Tindak lanjut jatuh tempo" naming the client, and a second run does not repeat it

### Requirement: Client access by role
Marketing and Super Admin SHALL manage clients and contacts; Direktur, Finance and Operasional SHALL view them; HCM and Lapangan SHALL NOT see clients. (PRD §13)

#### Scenario: Finance views only
- **WHEN** a Finance user opens a client
- **THEN** data, contacts and tenders are shown without add, edit or delete actions

#### Scenario: HCM has no access
- **WHEN** an HCM user opens `/marketing/clients` or queries clients through the API
- **THEN** they see "Akses ditolak" and no rows are returned

### Requirement: Client list
Marketing → Klien SHALL list clients with type, payment term, number of tenders and win rate, with search by name or NPWP, filters for type and status, and Excel export. (MKT-01, UMM-09, UMM-04)

#### Scenario: Filter by type
- **WHEN** Marketing filters by type PLN
- **THEN** only PLN clients are listed and the export matches

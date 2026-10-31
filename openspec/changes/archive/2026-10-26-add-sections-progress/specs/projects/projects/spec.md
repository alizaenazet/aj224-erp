# Spec Delta

## Purpose

Adds project progress to the project list and the Ringkasan tab (PRJ-01, PRJ-09).

## MODIFIED Requirements

### Requirement: Project list
Proyek → Daftar Proyek SHALL list projects with code, name, client, status, progress and contract value after addenda, with search by code or name, filters for status and client, and Excel export; roles that may not see contract data SHALL NOT see the contract value, and roles that may not see progress SHALL NOT see progress. (PRJ-01, UMM-09, UMM-04)

#### Scenario: Filter running projects of a client
- **WHEN** Finance filters status Berjalan and client PT PLN (Persero) UIP Jawa Bagian Timur
- **THEN** only that client's running projects are listed and the export matches

#### Scenario: Progress column
- **WHEN** Direktur opens Daftar Proyek
- **THEN** each project shows its project progress from §11.2

### Requirement: Project summary
The Ringkasan tab SHALL show the contract value after the latest addendum (with whether PPN applies), the start and target finish dates, the number of payment terms per status with the scheduled total, the total RAB, the planned profit = contract value − total RAB, and project progress versus planned progress with the deviation, all read from the related records. (PRJ-09, PRD §11.2, §11.3)

#### Scenario: Planned profit
- **WHEN** a project's contract value after addendum is Rp 10.500.000.000 and its RAB totals Rp 9.000.000.000
- **THEN** Ringkasan shows planned profit Rp 1.500.000.000

#### Scenario: Progress versus plan
- **WHEN** project progress is 25% and planned progress today is 40%
- **THEN** Ringkasan shows actual 25%, planned 40% and deviation −15 points

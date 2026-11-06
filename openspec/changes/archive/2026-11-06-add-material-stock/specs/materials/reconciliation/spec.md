# Spec Delta: materials/reconciliation

## Purpose
Shows, per project and client-supplied (titipan) material, how much was received, used, returned and lost, as the basis for the berita acara rekonsiliasi with the client (MAT-06).

## ADDED Requirements

### Requirement: Titipan reconciliation per project
For each project and each Titipan Klien material that moved at its location, the system SHALL show: received from client, transferred in, transferred out, used, returned to client, shrinkage (shortfalls on receipt plus negative opname differences, net of positive differences) and on hand, where on hand = received + in − out − used − returned − shrinkage. Cancelled transactions SHALL NOT count. The table SHALL be exportable to Excel. (MAT-06, UMM-04)

#### Scenario: Reconciliation after work
- **WHEN** PRJ-…-003 received 3.000 m from the client, used 2.700 m, returned 150 m and an opname found 140 m
- **THEN** the row shows received 3.000, used 2.700, returned 150, shrinkage 10, on hand 140

#### Scenario: Export
- **WHEN** Operasional exports the reconciliation of PRJ-…-003
- **THEN** the .xlsx holds the same rows and columns as the screen

### Requirement: Reconciliation access
Super Admin, Direktur, Finance and Operasional SHALL see every project's reconciliation; Lapangan SHALL see only their assigned projects in the project tab Material. (PRD §13)

#### Scenario: Lapangan project tab
- **WHEN** Lukman opens the Material tab of his project
- **THEN** he sees the stock and reconciliation of that project only

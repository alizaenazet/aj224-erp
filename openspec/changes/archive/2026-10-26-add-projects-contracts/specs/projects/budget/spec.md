# Spec Delta

## Purpose

Sets the budget (RAB) of each project per cost category and compares it with the realized cost from the finance modules, so overruns show early (PRJ-04, PRD §11.3).

## ADDED Requirements

### Requirement: Budget per cost category
Finance and Operasional SHALL set a project's budget as one amount (≥ 0) per active project cost category (not Overhead Kantor), with notes; the total RAB is the sum of the amounts. (PRJ-04, MST-05)

#### Scenario: Enter RAB
- **WHEN** Finance enters Upah & Gaji Rp 3.000.000.000 and Material & Consumable Rp 2.500.000.000
- **THEN** the RAB & Biaya tab lists both and the total RAB is Rp 5.500.000.000

### Requirement: Budget versus realization
The RAB & Biaya tab SHALL show per category Anggaran, Realisasi, Sisa = Anggaran − Realisasi and % Terpakai = Realisasi ÷ Anggaran, marked yellow at 80% or more and red above 100%, plus totals; Realisasi SHALL come from the shared project cost view that the finance modules fill (zero until they exist). (PRJ-04, PRD §11.3)

#### Scenario: Nothing realized yet
- **WHEN** no costs have been recorded for the project
- **THEN** every category shows Realisasi Rp 0 and % Terpakai 0%

#### Scenario: Category near its budget
- **WHEN** a category with budget Rp 100.000.000 has Rp 85.000.000 realized
- **THEN** it shows 85% marked yellow

### Requirement: Budget access by role
The budget SHALL be visible to Super Admin, Direktur, Finance and Operasional and editable by Finance and Operasional; Marketing, HCM and Lapangan SHALL NOT see it. Budget changes SHALL be recorded in the audit log. (PRD §13, UMM-08)

#### Scenario: Marketing has no RAB tab
- **WHEN** a Marketing user opens a project
- **THEN** no RAB & Biaya tab is shown and budget rows are not returned through the API

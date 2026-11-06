# Spec Delta: projects/budget

## ADDED Requirements

### Requirement: Realisation from cost records
The RAB & Biaya tab SHALL show, per cost category, the realised cost from the combined cost source (supplier bill lines, direct expenses including opening cost, approved field-cash project costs, and payroll allocation once payroll exists), with Sisa and % Terpakai colouring (≥ 80% warning, > 100% critical). (PRJ-04, FIN-11)

#### Scenario: Realisation appears
- **WHEN** a Rp 9.000.000 bill line is recorded for the project in Sewa Alat & Kendaraan
- **THEN** that category's Realisasi increases by Rp 9.000.000

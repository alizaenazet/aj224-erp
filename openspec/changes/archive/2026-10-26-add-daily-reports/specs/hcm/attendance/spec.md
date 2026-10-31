# Spec Delta

## Purpose

Field attendance follows the configurable backdate limit (PRD §5 A5).

## MODIFIED Requirements

### Requirement: Entry window
Lapangan SHALL enter or change attendance only for dates from `backdate_days` days ago (system parameter, default 3 = H+3) up to today; HCM SHALL enter or change any past date; no one SHALL enter future dates. (HCM-09, PRD §5 A5)

#### Scenario: Too late for Lapangan
- **WHEN** `backdate_days` is 3 and Lapangan tries to save attendance dated four days ago
- **THEN** the save is refused with a reason that field input closes after three days

#### Scenario: Limit changed
- **WHEN** Super Admin sets `backdate_days` to 5
- **THEN** Lapangan can pick and save dates up to five days ago

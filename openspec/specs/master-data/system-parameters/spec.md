# master-data/system-parameters Specification

## Purpose
Keeps the tunable numbers behind business rules — backdating limit, certificate warning window, project health thresholds, PPN rate, working hours, salary divisor and document number formats — in one audited place (MST-10).

## Requirements

### Requirement: Parameters with PRD defaults
The system SHALL keep: backdate limit in days (default 3), certificate "segera kedaluwarsa" window in days (60), project health Waspada threshold (10 points) and Kritis threshold (20 points), PPN rate in percent (11), standard work hours per day (8) and monthly salary divisor (26). (MST-10)

#### Scenario: Defaults on a new installation
- **WHEN** a Super Admin opens Parameter Sistem on a new installation
- **THEN** the values above are shown

### Requirement: Valid parameter values
The system SHALL refuse values outside sensible bounds: backdate 0–31 days, warning window 1–365 days, Waspada threshold greater than 0 and lower than the Kritis threshold, PPN 0–100, work hours 1–24, divisor 1–31. (MST-10)

#### Scenario: Thresholds out of order
- **WHEN** a Super Admin sets Waspada to 25 while Kritis is 20
- **THEN** saving is refused with a message in Bahasa Indonesia

### Requirement: Document number formats
Super Admin SHALL edit each document type's number format and reset period from Parameter Sistem; a format SHALL contain a `{SEQ:n}` token. (MST-10, UMM-10)

#### Scenario: Change invoice format
- **WHEN** a Super Admin changes the invoice format to `AJ/INV/{YYYY}{MM}/{SEQ:4}`
- **THEN** the next invoice number uses the new format

#### Scenario: Missing sequence token
- **WHEN** a format without `{SEQ:n}` is saved
- **THEN** saving is refused

### Requirement: Parameter access and audit
Super Admin SHALL edit parameters and formats; Direktur SHALL view them read-only; all signed-in roles SHALL be able to read the values used by rules; every change SHALL be recorded in the audit log. (MST-10, PRD §13, UMM-08)

#### Scenario: Change is audited
- **WHEN** a Super Admin changes the backdate limit from 3 to 5 days
- **THEN** the audit log shows "Batas input mundur: 3 → 5" with the Super Admin as actor

#### Scenario: Direktur read-only
- **WHEN** a Direktur opens Parameter Sistem
- **THEN** values are shown without editable fields

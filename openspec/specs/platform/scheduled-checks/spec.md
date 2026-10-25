# platform/scheduled-checks Specification

## Purpose
Runs the registered daily checks (certificate expiry, due dates, termin readiness, missing daily reports) every morning in WIB, isolates failures, and keeps a record of each run (PRD §15).

## Requirements

### Requirement: Daily run at 06:00 WIB
The system SHALL run all enabled registered checks once a day at 06:00 WIB, in their configured order. (PRD §15)

#### Scenario: Scheduled run
- **WHEN** the clock reaches 06:00 WIB
- **THEN** every enabled check runs once

#### Scenario: Disabled check skipped
- **WHEN** a registered check is disabled
- **THEN** the daily run skips it

### Requirement: One failing check does not stop the others
If a check fails, the system SHALL record the failure with its error message and continue with the remaining checks. (PRD §15)

#### Scenario: Failure isolated
- **WHEN** the second of three checks raises an error
- **THEN** the first and third complete and the run log shows the second as failed with its message

### Requirement: Run history
The system SHALL record each check's start time, end time, outcome and message, readable by Super Admin only. (PRD §15)

#### Scenario: Run recorded
- **WHEN** the daily run finishes
- **THEN** each check has a run entry with outcome success or failed

### Requirement: Dates follow WIB
All date rules (H+3 input limits, certificate status, due dates, reminders) SHALL use the current date in Asia/Jakarta, not the server's time zone. (PRD §14)

#### Scenario: Just after midnight WIB
- **WHEN** it is 00:30 WIB on 26 Oct 2026 (still 25 Oct in UTC)
- **THEN** "today" for every rule is 26 Oct 2026

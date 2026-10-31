# Spec Delta

## Purpose

An employee who has left cannot hold or regain an assignment after their exit date (HCM-01, HCM-05).

## MODIFIED Requirements

### Requirement: Project assignments
HCM SHALL assign an active employee to a project that is not completed or closed with an active position on the project, a start date and an optional end date, and SHALL end an assignment by setting its end date; an employee's assignments SHALL NOT overlap, so at most one is active on any date. When the employee has an exit date, the assignment SHALL end on or before it, and an end date SHALL NOT be extended or cleared past the exit date or on a completed or closed project; shortening an end date is always allowed. The crew of a project on a date SHALL NOT include people who left before that date. Assignments SHALL NOT be deleted. (HCM-01, HCM-05)

#### Scenario: Assign a linesman
- **WHEN** HCM assigns Budi Santoso to PRJ/AJ224/2026/001 as Linesman/Pemanjat from today
- **THEN** the assignment is listed as Aktif and Budi appears in that project's crew

#### Scenario: Overlapping assignment refused
- **WHEN** HCM assigns Budi to another project from next week while his first assignment has no end date
- **THEN** the assignment is refused with a reason naming his current project

#### Scenario: Employee who left
- **WHEN** HCM records an assignment for Wahyu Hidayat (left 31 Agu 2026) from 1 Agu 2026 without an end date
- **THEN** it is refused, saying the end date must be 31 Agu 2026 or earlier; with end date 31 Agu 2026 it is saved

#### Scenario: Re-opening after exit refused
- **WHEN** HCM clears the end date of an assignment of an employee who has left
- **THEN** the change is refused

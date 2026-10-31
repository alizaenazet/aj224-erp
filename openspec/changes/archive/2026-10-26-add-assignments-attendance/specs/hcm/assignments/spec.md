# Spec Delta

## Purpose

Records which employee works on which project in which position, checks required certificates at assignment time with an audited override, and gives each project its crew (HCM-05, HCM-06, PRD §11.5).

## ADDED Requirements

### Requirement: Project assignments
HCM SHALL assign an active employee to a project that is not completed or closed with a position on the project, a start date and an optional end date, and SHALL end an assignment by setting its end date; an employee's assignments SHALL NOT overlap, so at most one is active on any date. Assignments SHALL NOT be deleted. (HCM-05)

#### Scenario: Assign a linesman
- **WHEN** HCM assigns Budi Santoso to PRJ/AJ224/2026/001 as Linesman/Pemanjat from today
- **THEN** the assignment is listed as Aktif and Budi appears in that project's crew

#### Scenario: Overlapping assignment refused
- **WHEN** HCM assigns Budi to another project from next week while his first assignment has no end date
- **THEN** the assignment is refused with a reason naming his current project

### Requirement: Certificate check on assignment
An assignment SHALL be refused when a certificate required for the position is missing or expired on the start date (fit = every required certificate Berlaku or Segera Kedaluwarsa on that date); the form SHALL show each required certificate's status before saving. (HCM-06, PRD §11.5, MST-06)

#### Scenario: Expired certificate refused
- **WHEN** HCM assigns Slamet Riyadi as Linesman/Pemanjat while his TKBT Tingkat 2 has expired
- **THEN** the form shows TKBT Tingkat 2 Kedaluwarsa and saving without an override reason is refused

#### Scenario: Expiring certificate allowed
- **WHEN** Joko Susilo's SIO Operator expires in 45 days and he is assigned as Operator Mesin from today
- **THEN** the assignment is saved without an override

### Requirement: Override with reason
HCM SHALL be able to save an unfit assignment by entering an override reason; the override SHALL record who and when, SHALL be written to the audit log as an override entry with the reason and the missing certificates, and the assignment SHALL show an Override badge. (HCM-06, UMM-08)

#### Scenario: Override recorded
- **WHEN** HCM assigns Andi Wijaya as Driver without SIM B1 with reason "SIM B1 sedang diperpanjang, surat keterangan terlampir"
- **THEN** the assignment is saved with an Override badge and the audit log shows an Override entry by HCM with that reason

### Requirement: Certificate state of the crew
Crew lists (project team, attendance and the assignment list) SHALL show each active crew member's required-certificate state today, marking Kedaluwarsa or Belum ada in red and Segera Kedaluwarsa in yellow. (HCM-06)

#### Scenario: Expires during the assignment
- **WHEN** Lukman Hakim's TKBT Tingkat 1 expires while he is assigned
- **THEN** his row in the crew and attendance lists is marked red with TKBT Tingkat 1 Kedaluwarsa

### Requirement: Assignment list
SDM → Penugasan SHALL list assignments with employee, project, position, dates, status (Akan datang, Aktif, Selesai), certificate state and override badge, with search by employee, filters for project, status and override, and Excel export. (HCM-05, UMM-04, UMM-09)

#### Scenario: Overrides only
- **WHEN** HCM filters Override
- **THEN** only assignments saved with an override are listed

### Requirement: Assignment access by role
HCM SHALL manage assignments; Super Admin, Direktur and Operasional SHALL view them; Lapangan SHALL view the assignments of their own active projects; Marketing and Finance SHALL NOT see them. (PRD §13)

#### Scenario: Operasional views only
- **WHEN** Operasional opens Penugasan
- **THEN** assignments are listed without add or end actions

#### Scenario: Finance refused
- **WHEN** Finance opens `/hr/assignments` or queries assignments through the API
- **THEN** access is denied and no rows are returned

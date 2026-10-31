# hcm/attendance Specification

## Purpose
Records daily attendance of field crews (by Lapangan) and office staff (by HCM) with overtime, one record per employee per date, and summarizes it per period for payroll (HCM-09 … HCM-11).

## Requirements

### Requirement: Field attendance today
Lapangan SHALL open Absensi Hari Ini for their project, see the crew assigned on that date, set each person's status (Hadir, Izin, Sakit, Cuti, Alpa, Libur) and overtime hours, use "Tandai Semua Hadir", and save; overtime SHALL be allowed only with Hadir. Saving SHALL send only new or changed rows and SHALL keep a stored note, so an older record of someone no longer assigned does not block saving the others. (HCM-09)

#### Scenario: Mark all present
- **WHEN** Lapangan Lukman opens Absensi Hari Ini for PRJ/AJ224/2026/001, taps Tandai Semua Hadir, changes Rudi Hartono to Sakit, gives Budi 2 hours overtime and saves
- **THEN** each crew member has one record for today with those values

#### Scenario: Older record of someone no longer assigned
- **WHEN** Rudi's assignment was ended on 28 Okt after he was recorded on 29 Okt, and HCM changes Joko's status on the 29 Okt sheet and saves
- **THEN** Joko's record is saved and Rudi's record is left as it was

#### Scenario: Nothing changed
- **WHEN** the sheet is saved again without changes
- **THEN** the user is told there is nothing to save

### Requirement: One record per employee per date
Attendance SHALL hold at most one record per employee per date; saving again SHALL update it. A field record SHALL name the project the employee is assigned to on that date; an office record has no project. (HCM-09, HCM-10)

#### Scenario: Correction the same day
- **WHEN** Lapangan saves Rudi as Sakit and later changes him to Hadir
- **THEN** Rudi has one record for that date with status Hadir

### Requirement: Entry window
Lapangan SHALL enter or change attendance only for dates from `backdate_days` days ago (system parameter, default 3 = H+3) up to today; HCM SHALL enter or change any past date; no one SHALL enter future dates. (HCM-09, PRD §5 A5)

#### Scenario: Too late for Lapangan
- **WHEN** `backdate_days` is 3 and Lapangan tries to save attendance dated four days ago
- **THEN** the save is refused with a reason that field input closes after three days

#### Scenario: Limit changed
- **WHEN** Super Admin sets `backdate_days` to 5
- **THEN** Lapangan can pick and save dates up to five days ago

### Requirement: Attendance sheet photo
Lapangan and HCM SHALL be able to attach photos of the paper attendance sheet to a project day. (HCM-09, UMM-03)

#### Scenario: Sheet attached
- **WHEN** Lapangan uploads a photo after saving today's attendance
- **THEN** the photo is listed with that project day and HCM can open it

### Requirement: Office attendance
HCM SHALL fill attendance of active office staff per date with the same statuses and overtime, with Tandai Semua Hadir, and SHALL be able to import attendance rows by employee number, date, status, overtime and optional project code; an imported row for a recorded date SHALL replace that record, and rows the database refuses SHALL be listed with their reason while the others are saved. HCM SHALL be able to open project attendance for any project, including Persiapan. (HCM-10, UMM-13)

#### Scenario: Office day
- **WHEN** HCM opens Absensi for Kantor on today's date and marks all present except Sari Wulandari as Cuti
- **THEN** each active office employee has a record for today without a project

#### Scenario: Import replaces and adds
- **WHEN** HCM imports four rows: Sari for a recorded date as Izin with a note, Oki for an empty date with 2 hours overtime, Lukman with the project code, and an unknown NIK
- **THEN** three rows are saved (Sari's record replaced) and the unknown NIK is listed as failed

### Requirement: Attendance recap
SDM → Absensi → Rekap SHALL show, for a period (default this month), per employee the number of days per status, total overtime hours and days present per project, with filters for project and employee type and Excel export. (HCM-11, PRD §11.7)

#### Scenario: Monthly recap
- **WHEN** HCM opens the recap for this month filtered on PRJ/AJ224/2026/001
- **THEN** each crew member shows Hadir, Izin, Sakit, Cuti, Alpa and Libur counts and overtime hours for that project

### Requirement: Attendance access by role
HCM SHALL manage all attendance; Lapangan SHALL manage attendance of the crew of their own active projects within the entry window; Super Admin, Direktur, Finance and Operasional SHALL view attendance; Marketing SHALL NOT. (PRD §13)

#### Scenario: Lapangan outside their project
- **WHEN** Lapangan saves attendance for an employee assigned to another project through the API
- **THEN** the write is refused

#### Scenario: Finance views only
- **WHEN** Finance opens the recap
- **THEN** it is shown without edit actions

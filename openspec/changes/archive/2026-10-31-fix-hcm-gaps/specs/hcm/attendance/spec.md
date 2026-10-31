# Spec Delta

## Purpose

Saving a sheet or an import works when older records exist (HCM-09, HCM-10).

## MODIFIED Requirements

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

### Requirement: Office attendance
HCM SHALL fill attendance of active office staff per date with the same statuses and overtime, with Tandai Semua Hadir, and SHALL be able to import attendance rows by employee number, date, status, overtime and optional project code; an imported row for a recorded date SHALL replace that record, and rows the database refuses SHALL be listed with their reason while the others are saved. HCM SHALL be able to open project attendance for any project, including Persiapan. (HCM-10, UMM-13)

#### Scenario: Office day
- **WHEN** HCM opens Absensi for Kantor on today's date and marks all present except Sari Wulandari as Cuti
- **THEN** each active office employee has a record for today without a project

#### Scenario: Import replaces and adds
- **WHEN** HCM imports four rows: Sari for a recorded date as Izin with a note, Oki for an empty date with 2 hours overtime, Lukman with the project code, and an unknown NIK
- **THEN** three rows are saved (Sari's record replaced) and the unknown NIK is listed as failed

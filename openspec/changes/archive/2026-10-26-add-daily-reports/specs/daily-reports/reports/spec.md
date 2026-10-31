# Spec Delta

## Purpose

Daily reports from each project: what was done, who worked, what blocked the work and photos; they update section progress, are reviewed by Operasional and print for the main contractor (OPS-01 … OPS-04, UMM-12).

## ADDED Requirements

### Requirement: Daily report content
A daily report SHALL belong to one project and date and hold weather for morning, midday and afternoon (Cerah, Berawan, Hujan, Hujan Lebat), effective working hours, safety briefing yes/no with participants, activity lines (section, stage, cumulative progress after today, notes), main equipment used, obstacles, plan for tomorrow and photos; the workforce SHALL be the number of crew marked Hadir in that day's attendance. (OPS-01)

#### Scenario: Report with activity
- **WHEN** Lapangan Lukman sends the report for PRJ/AJ224/2026/001 today with weather Cerah/Cerah/Hujan, 7 working hours, briefing with 6 participants, activity S-03 Penarikan Konduktor 60% and plan "Lanjut T.15–T.16"
- **THEN** the report is saved as Terkirim and shows the workforce counted from today's attendance

### Requirement: No-activity report
A report SHALL be able to state "Tidak Ada Kegiatan" with a required reason instead of activities, obstacles and photos. (OPS-01)

#### Scenario: Rain day
- **WHEN** Lapangan sends "Tidak Ada Kegiatan" with reason "Hujan lebat sepanjang hari"
- **THEN** the report is saved without activities and counts as sent for that date

### Requirement: One report per project per date
There SHALL be at most one report per project and date; Lapangan SHALL send or change it only for their active projects from `backdate_days` days ago up to today, and only while it is Terkirim or Perlu Revisi; a report asked for revision may be changed after the window. No future dates. (OPS-01, PRD §5 A5)

#### Scenario: Too late
- **WHEN** Lapangan sends a report dated four days ago with `backdate_days` = 3
- **THEN** it is refused with a reason that input closes after three days

### Requirement: Progress from the report
Sending a report SHALL set each activity's section stage to its cumulative progress, logged with source Laporan harian and the report, and SHALL re-check progress-based terms; a report SHALL NOT lower progress. (OPS-01, PRJ-06, PRJ-03)

#### Scenario: Progress updated
- **WHEN** a report sets S-03 Penarikan Konduktor to 60% while it is 50%
- **THEN** the matrix shows 60% and the progress log shows 50% → 60% from Laporan harian of that date

#### Scenario: Lower value refused
- **WHEN** a report sets S-01 Penarikan Konduktor to 80% while it is 100%
- **THEN** the report is refused with a reason that progress cannot go down

### Requirement: Photos
A report with activity SHALL take 1–10 photos; a report without photos SHALL show "Foto belum ada" until one is added, and an eleventh photo SHALL be refused. (OPS-01, UMM-03)

#### Scenario: Photo limit
- **WHEN** a report already has 10 photos and an eleventh is uploaded
- **THEN** the upload is refused

### Requirement: Obstacles by category
Obstacles SHALL be recorded with a category (Cuaca, ROW/Lahan/Warga, Material Belum Datang, Alat Rusak, Izin Padam/Crossing, Tenaga Kerja, Lainnya) and a description, and each project SHALL show a recap of obstacles per category with their count and latest date. (OPS-02)

#### Scenario: Recap per category
- **WHEN** a project has three reports with obstacle ROW/Lahan/Warga and one with Cuaca
- **THEN** the project's Laporan Harian tab shows ROW/Lahan/Warga 3 and Cuaca 1 with their latest dates

### Requirement: Review by Operasional
Operasional SHALL see incoming reports (filters for project, status and date), mark a report Sudah Diperiksa, or set Perlu Revisi with a required comment that notifies the reporter; a reviewed report SHALL NOT be changed. (OPS-03)

#### Scenario: Revision requested
- **WHEN** Operasional asks for revision with "Foto aktivitas T.15 belum ada"
- **THEN** the report shows Perlu Revisi with the comment and Lukman gets a notification linking to it

### Requirement: Missing reports
Each morning the system SHALL notify Operasional of each running project without a report (or "Tidak Ada Kegiatan") for yesterday, once per project and date, and the Laporan Harian page SHALL list those projects. (OPS-03)

#### Scenario: Yesterday missing
- **WHEN** the daily check runs and PRJ/AJ224/2026/003 (Berjalan) has no report for yesterday
- **THEN** Operasional gets "Laporan harian belum masuk" for that project and date, and the page lists it

### Requirement: Printed daily report
Each report SHALL print on A4 with the company letterhead: the report on one page and its photos on attachment pages. (OPS-04, UMM-05)

#### Scenario: Print for the main contractor
- **WHEN** Operasional opens Cetak on a report with 4 photos
- **THEN** the print view shows the report page followed by a photo page with the 4 photos and their times

### Requirement: Local draft
The field report form SHALL keep its input on the device until the report is sent, restoring it after a reload, and SHALL discard it after a successful send. (UMM-12)

#### Scenario: Reload keeps input
- **WHEN** Lapangan fills weather and two activities and the page reloads before sending
- **THEN** the form shows the same input

### Requirement: Daily report access by role
Operasional SHALL manage and review reports of all projects; Lapangan SHALL manage reports of their own active projects; Super Admin and Direktur SHALL view reports; Marketing, Finance and HCM SHALL NOT see them. Reports SHALL change only through the report functions. (PRD §13)

#### Scenario: Finance refused
- **WHEN** Finance opens `/operations/daily-reports` or queries reports through the API
- **THEN** access is denied and no rows are returned

#### Scenario: Lapangan other project
- **WHEN** Lukman sends a report for a project he is not assigned to through the API
- **THEN** it is refused

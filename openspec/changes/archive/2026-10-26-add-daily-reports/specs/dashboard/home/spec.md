# Spec Delta

## Purpose

Adds the daily report to the Lapangan home (DSB-04).

## MODIFIED Requirements

### Requirement: Lapangan home
For Lapangan the home page SHALL show their active project(s) with large buttons for the field actions available (Absensi Hari Ini, Laporan Harian, Tambah Pekerja Lokal) and today's status: how many crew members have attendance recorded out of the crew assigned today, and whether today's daily report is sent. Lapangan without an active assignment SHALL see a message to contact HCM. (DSB-04, PRD §9)

#### Scenario: Status today
- **WHEN** Lukman, assigned to PRJ/AJ224/2026/001 with 6 crew, has recorded 4 of them today
- **THEN** the home shows the project with "Absensi hari ini 4/6 kru" and the Absensi Hari Ini button opens that project's list

#### Scenario: No assignment
- **WHEN** a Lapangan user has no active assignment
- **THEN** the home says no project is assigned and to contact HCM, and no field buttons are shown

#### Scenario: Report status
- **WHEN** today's report of the project is not sent yet
- **THEN** the home shows "Laporan hari ini belum dikirim" and the Laporan Harian button opens the form for today

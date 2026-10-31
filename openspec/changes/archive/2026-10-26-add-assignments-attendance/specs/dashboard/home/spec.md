# Spec Delta

## Purpose

The home page (Beranda) shows each role what needs doing; this change adds the mobile home for Lapangan (DSB-04, PRD §9).

## ADDED Requirements

### Requirement: Lapangan home
For Lapangan the home page SHALL show their active project(s) with large buttons for the field actions available (Absensi Hari Ini, Tambah Pekerja Lokal) and today's status: how many crew members have attendance recorded out of the crew assigned today. Lapangan without an active assignment SHALL see a message to contact HCM. (DSB-04, PRD §9)

#### Scenario: Status today
- **WHEN** Lukman, assigned to PRJ/AJ224/2026/001 with 6 crew, has recorded 4 of them today
- **THEN** the home shows the project with "Absensi hari ini 4/6 kru" and the Absensi Hari Ini button opens that project's list

#### Scenario: No assignment
- **WHEN** a Lapangan user has no active assignment
- **THEN** the home says no project is assigned and to contact HCM, and no field buttons are shown

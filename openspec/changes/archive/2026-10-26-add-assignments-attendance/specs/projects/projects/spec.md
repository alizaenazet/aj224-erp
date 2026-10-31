# Spec Delta

## Purpose

Opens projects to Lapangan, limited to the projects of their active assignment (UMM-02, PRD §6).

## MODIFIED Requirements

### Requirement: Project access by role
Super Admin, Direktur, Marketing, Finance, HCM and Operasional SHALL see the project list and pages; Marketing and Finance SHALL create and edit projects; Lapangan SHALL see only the projects of their active assignment (Ringkasan without contract values, Seksi & Progres and Tim & Absensi), including when opening another project's address directly. (PRD §13, UMM-02)

#### Scenario: Super Admin views only
- **WHEN** a Super Admin opens a project
- **THEN** no edit, status or create actions are offered

#### Scenario: Lapangan opens another project
- **WHEN** Lukman, assigned to PRJ/AJ224/2026/001, opens the address of PRJ/AJ224/2026/003
- **THEN** the project is not found and no data of it is returned through the API

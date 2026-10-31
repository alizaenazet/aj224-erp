# Spec Delta

## Purpose

Lets Lapangan view the sections and progress of their projects; their progress entry arrives with daily reports (PRD §13).

## MODIFIED Requirements

### Requirement: Progress access by role
Sections, stages, progress and the progress log SHALL be visible to Super Admin, Direktur, Marketing, Finance and Operasional and to Lapangan for their own active projects, and editable only by Operasional (Lapangan reports progress through daily reports); HCM SHALL NOT see them. Progress values SHALL change only through the progress functions, never by direct table writes. (PRD §13)

#### Scenario: Finance reads only
- **WHEN** Finance opens Seksi & Progres
- **THEN** the matrix and curve are shown without edit actions, and a direct update of a progress row through the API is refused

#### Scenario: HCM refused
- **WHEN** an HCM user opens the Seksi & Progres address or queries sections through the API
- **THEN** access is denied and no rows are returned

#### Scenario: Lapangan reads their project
- **WHEN** Lukman opens Seksi & Progres of PRJ/AJ224/2026/001
- **THEN** the matrix is shown without edit actions

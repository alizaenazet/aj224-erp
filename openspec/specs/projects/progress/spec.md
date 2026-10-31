# projects/progress Specification

## Purpose
Records the pulling sections and stringing-stage progress of each project and computes section progress, project progress, planned progress and schedule deviation with one set of formulas, shown as a matrix and a weekly curve (PRJ-05 … PRJ-08, PRD §11.2).

## Requirements

### Requirement: Pulling sections
Operasional SHALL maintain a project's sections with code (unique in the project), tower from and to, tower count, length (km), circuits, planned start and planned finish (not before the start); kms SHALL be computed as length × circuits. A section with recorded progress SHALL NOT be removed. (PRJ-05, PRD §11.2)

#### Scenario: kms computed
- **WHEN** Operasional adds section S-03 from T.12 to T.18 with 6 towers, 4,2 km and 2 circuits
- **THEN** the section shows 8,4 kms

#### Scenario: Section with progress kept
- **WHEN** Operasional tries to remove a section that has stage progress
- **THEN** the removal is refused with a reason

### Requirement: Project stages
Each new project SHALL receive its own stage list copied from the active stage template with the template weights; Operasional SHALL change stage weights and order and remove stages outside the contract scope, and the project's weights SHALL total 100. Removing a stage SHALL remove its progress. (PRJ-06, MST-08)

#### Scenario: Copied from template
- **WHEN** a project is created
- **THEN** its stages are Pemasangan Pulley (10), Penarikan Pilot Wire (10), Penarikan Konduktor (30), Sagging (15), Clamping (15), Spacer & Damper (10), Jumper (5) and GSW/OPGW (5)

#### Scenario: Weights must total 100
- **WHEN** Operasional removes GSW/OPGW without moving its 5 points to another stage
- **THEN** saving is refused because the weights total 95

### Requirement: Stage progress with source
Operasional SHALL set the cumulative progress (0–100%) of each stage of a section, and daily reports SHALL set it when sent; every change SHALL be logged with the old and new value, who changed it, when, the source (manual or daily report with its report) and a note. Lowering a value SHALL be possible only for Operasional with a reason. Progress SHALL NOT change on a closed project. (PRJ-06, OPS-01)

#### Scenario: Manual update logged
- **WHEN** Operasional sets Penarikan Konduktor of S-03 from 0% to 50% with note "Tarik konduktor T.12–T.15"
- **THEN** the matrix shows 50% and the progress log lists S-03 · Penarikan Konduktor 0% → 50%, manual, by that user

#### Scenario: Lowering needs a reason
- **WHEN** Operasional lowers S-03 Penarikan Konduktor from 60% to 55% without a note
- **THEN** the change is refused with a reason that lowering progress needs a reason

### Requirement: Progress formulas
Section progress SHALL be Σ(stage weight × stage progress) ÷ Σ stage weight; project progress SHALL be Σ(section progress × section kms) ÷ Σ section kms; planned progress on a date SHALL be, per section, 0% before planned start, 100% after planned finish and linear between, combined by kms weight; deviation SHALL be actual − planned in percentage points. (PRJ-06, PRD §11.2)

#### Scenario: PRD worked example
- **WHEN** S-03 (8,4 kms) has Pulley 100%, Pilot Wire 100%, Konduktor 50% and the other stages 0%
- **THEN** S-03 progress is 35%

#### Scenario: Project progress weighted by kms
- **WHEN** a project has S-03 (8,4 kms) at 35% and S-04 (5,6 kms) at 100%
- **THEN** project progress is 61%

### Requirement: Progress matrix
The Seksi & Progres tab SHALL show a table of sections × stages with each cell's progress marked belum (0%), berjalan (between) or selesai (100%), each section's kms, progress and planned progress, and the project total; the matrix SHALL be exportable to Excel. (PRJ-07, UMM-04)

#### Scenario: Export for the client report
- **WHEN** Operasional exports the matrix
- **THEN** the Excel file has one row per section with each stage's %, kms and section progress, and a total row with project progress

### Requirement: Plan versus actual curve
The Seksi & Progres tab SHALL show a weekly chart of planned and actual project progress, the plan from the section schedules and the actual from the progress log as of each week's end. (PRJ-08)

#### Scenario: Behind schedule
- **WHEN** the plan reaches 40% by a week's end while actual progress is 25%
- **THEN** that week shows planned 40% and actual 25%, and the header deviation shows −15 points for today's values

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

# Proposal: add-sections-progress

## Why

Progress on a stringing project is tracked per pulling section (seksi tarik) and per stringing stage, today in spreadsheets that are rebuilt for every client report. Termin billing depends on that progress, so terms are often billed late. This change records sections and stage progress per project, computes section and project progress with one formula (PRD §11.2), shows the progress matrix and the plan-versus-actual curve, and sets progress- and date-based terms to Siap Ditagih automatically with a Finance notification.

## What Changes

- **Seksi tarik (PRJ-05, Wajib):**
  - Fields: code, tower from–to (e.g. T.12–T.18), tower count, length (km), circuits, kms (automatic = length × circuits), planned start and finish.
  - Operasional adds, edits and removes sections; a section with progress cannot be removed.
  - Sections can be imported from Excel with a new "Seksi Tarik" template (UMM-13).
- **Tahapan & progres seksi (PRJ-06, Wajib):**
  - Each project gets its own stage list copied from the stage template (MST-08) when it is created.
  - Operasional can adjust weights and remove stages outside the contract scope; the weights must total 100.
  - Progress per section and stage is 0–100% (cumulative).
  - Every change is logged with its source: manual by Operasional now, a daily report from `add-daily-reports` later.
  - Section and project progress are computed automatically (§11.2).
- **Matriks progres (PRJ-07, Wajib):**
  - A section × stage table coloured belum / berjalan / selesai, with section progress, kms and the project total.
  - Exportable to Excel for client report attachments.
- **Kurva rencana vs realisasi (PRJ-08, Sebaiknya):**
  - Weekly chart of planned and actual project progress.
  - Planned progress comes from the section schedules (§11.2).
- **Termin otomatis (PRJ-03, Wajib, automatic part):**
  - A term with condition progress ≥ X% becomes Siap Ditagih when project progress reaches X%.
  - A term with a date condition becomes Siap Ditagih on that date (daily check, or at once when saved with a past date).
  - Finance is notified each time, as with manual readiness.
- **Ringkasan and list (PRJ-09, PRJ-01):**
  - Ringkasan gains progress versus plan and the schedule deviation in percentage points.
  - Daftar Proyek gains a Progres column.
- **Project tab:** Seksi & Progres.

## Capabilities

### New Capabilities
- `projects/progress`: Sections, per-project stages, stage progress with its log, the progress formulas, the matrix and the curve.

### Modified Capabilities
- `projects/contracts`: Terms become Siap Ditagih automatically when their progress or date condition is met (PRJ-03).
- `projects/projects`: The list gains a progress column and Ringkasan gains progress versus plan (PRJ-01, PRJ-09).
- `platform/data-import`: Adds the Seksi Tarik template for Operasional (UMM-13).

## Impact

- **Database:**
  - Tables `project_stages`, `project_sections`, `section_progress` (current values) and `progress_updates` (log).
  - Views `section_progress_summary` and `project_progress`; `project_overview` gains progress columns.
  - Functions `save_project_stages`, `update_section_progress`, `project_progress_curve`, and internal term checks.
  - Daily check `check_term_dates`; triggers that copy the stage template and re-check progress terms.
  - RLS, audit and seed data.
- **App:**
  - `/projects/[id]/progress` tab.
  - Progress card on Ringkasan, Progres column on the list.
  - Export `project-progress` (matrix) and import template `sections`.
  - Operasional gets the Impor Data menu.
- **Dependencies:** shadcn `progress` and `chart` components (adds Recharts).

## Out of scope

- Progress entry from daily reports and their review (`add-daily-reports`, OPS-01 … OPS-04); this change only reserves the source on the log.
- Lapangan access to sections, which follows assignments in `add-assignments-attendance`.
- Project health status Normal/Waspada/Kritis (`add-project-pl`, §11.3).
- Section geometry beyond the PRD fields (spans, tower types).

## Open questions

- Stage weights (PRD §19) stay configurable in the stage template and per project.

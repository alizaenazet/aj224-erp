# Design: add-daily-reports

## Context

- **Progress:** stages are written through `apply_stage_progress(section, stage, progress, source, report, note, by)`, which already supports source `daily_report` and a `daily_report_id`. `check_progress_terms` re-checks progress terms.
- **Lapangan scoping:** `user_project_ids()`.
- **Attendance:** gives the day's workforce.
- **Shared infrastructure:**
  - `system_parameters.backdate_days` (default 3) exists, but change 11 hardcoded three days for attendance.
  - Attachments use the dispatcher functions, printing uses `Letterhead`/`PrintPage`, daily checks go through `scheduled_checks`, and notifications use `notify_user` / `notify_roles`.

## Goals / Non-Goals

**Goals**
- One report per project and date, written only through definer functions that apply progress and keep the H+3 rule.
- Review, a missing-report check, an obstacle recap, a print layout and a local draft.

**Non-Goals**
- Structured equipment and material lines (changes 13–14).
- Office "Perlu Tindakan" lists (change 20).

## Decisions

### Tables (migration `…_daily_reports.sql`)
| Table | Columns | Rules |
|---|---|---|
| `daily_reports` | project_id → projects, report_date, status (`submitted` / `revision` / `reviewed`), no_activity, no_activity_reason, weather_morning/midday/afternoon (`clear` / `cloudy` / `rain` / `heavy_rain`, null allowed), effective_hours numeric(4,1) 0–24, safety_briefing, briefing_participants, equipment_used, plan_tomorrow, notes, submitted_by/at, reviewed_by/at, review_comment, timestamps | Unique (project_id, report_date). Checks: a reason when no_activity; participants only with a briefing. No direct client writes. Audit (insert/update). |
| `daily_report_activities` | report_id (cascade), section_id → project_sections, stage_id → project_stages, progress_after numeric(5,2) 0–100, notes, sort_order | Replaced as a whole on each save. |
| `daily_report_obstacles` | report_id (cascade), category (`weather`, `row_land`, `material_late`, `equipment_broken`, `outage_permit`, `labor`, `other`), description | Replaced as a whole on each save. |

- **Progress log:** `progress_updates.daily_report_id` gets its FK to `daily_reports` (on delete set null).

### Functions
- **`save_daily_report(p_project, p_date, p_report jsonb, p_activities jsonb, p_obstacles jsonb) returns uuid`** (security definer).
  - **Caller:** Operasional (any project) or Lapangan with p_project ∈ `user_project_ids()`.
  - **Project and date:** the project is not closed, and p_date ≤ today.
  - **Field window:** for Lapangan, p_date ≥ today − `backdate_days`, unless the existing report is in `revision`.
  - **Existing report:** must be `submitted` or `revision`. A `reviewed` report is locked. The function upserts the report row; status becomes `submitted`, with submitted_by/at.
  - **No activity:** a reason is required, and activities and obstacles must be empty.
  - **Activities:** each stage and section must belong to the project and each value must be 0–100. A value below the current progress is refused ("Progres tidak boleh turun…"). The function calls `apply_stage_progress(..., 'daily_report', report_id, notes, auth.uid())` and then `check_progress_terms`.
  - **Obstacles:** a valid category and a description.
- **`review_daily_report(p_report, p_action, p_comment)`** (definer, Operasional only):
  - `reviewed` sets reviewed_by/at.
  - `revision` requires a comment, sets status and comment, and calls `notify_user(submitted_by, 'daily_report', 'Laporan harian perlu revisi', …, '/operations/daily-reports/<id>', 'report-revision:<id>:<time>')`.
- **`check_missing_daily_reports()`** (daily check): for projects with status `running` and no report dated yesterday, it notifies Operasional ("Laporan harian belum masuk", dedupe `report-missing:<project>:<date>`).
- **Views (invoker):**
  - **`daily_report_list`:** report columns plus project code/name.
    - `workforce` = attendance rows with status `present` on that project and date.
    - `activity_count`, `obstacle_count`, `photo_count` (attachments `daily_report` / `photo`).
  - **`daily_report_obstacle_summary`:** per project and category, the count and latest date.
  - **`missing_daily_reports`:** running projects without a report for yesterday, so the page lists them.
- **Updated functions:**
  - **`update_section_progress`:** lowering a value requires a non-empty note (PRJ-06 rule).
  - **`attendance_check`:** the field window uses `backdate_days`.
- **Attachments:** type `daily_report` (bucket `project-files`, category `photo`).
  - Read follows report visibility.
  - Write: Operasional, or Lapangan for a visible report that is not `reviewed`, while the report has fewer than 10 photos.

### RLS (PRD §13: Laporan harian L L — — — K+periksa K(P))
| Table | Read | Write |
|---|---|---|
| `daily_reports`, `daily_report_activities`, `daily_report_obstacles` | SA, Dir, Ops; Lapangan where the project ∈ `user_project_ids()` | none (functions only) |

### App structure
- **Libraries:** `lib/daily-reports/{labels,schema,queries,actions}.ts`. Labels cover weather, obstacle categories and statuses (Terkirim `secondary`, Perlu Revisi `warning`, Sudah Diperiksa `success`). Role constants: `REPORT_VIEW_ROLES`, `REPORT_MANAGE_ROLES` (operations, field).
- **Operasional → Laporan Harian (`/operations/daily-reports`):**
  - "Belum masuk kemarin" Alert listing projects.
  - DataTable with Project, Status and DateRange filters; export `daily-reports`.
- **Detail (`/operations/daily-reports/[id]`):**
  - Card per section: Cuaca & K3, Aktivitas (Table), Kendala, Rencana & alat.
  - Photos via AttachmentList (category `photo`), with an Alert "Foto belum ada" for reports with activity and no photo.
  - Actions:
    - Operasional: Sudah Diperiksa (AlertDialog); Minta Revisi (Dialog with Textarea).
    - Lapangan and Operasional: Ubah, when allowed.
    - Everyone: Cetak.
- **Field form (`/field/daily-reports/new?project&date`, `/field/daily-reports/[id]/edit`):** one form component used by Lapangan and Operasional.
  - Date Select (today … H−backdate).
  - "Tidak Ada Kegiatan" Switch with reason.
  - Three weather Selects, hours, briefing Switch with participants.
  - Activity rows: section Select, stage Select, progress InputGroup showing the current value; add/remove.
  - Obstacle rows: category Select, description.
  - Equipment, plan and notes Textareas.
  - Local draft in `localStorage` (key `daily-report:<project>:<date>`), saved on change, restored on load, cleared on success; all access in try/catch.
  - After sending, it goes to the detail page anchored at the photos.
- **Project tab Laporan Harian (`/projects/[id]/reports`):** a reports Table and the obstacle recap Card. Shown to SA, Dir, Ops and Lapangan.
- **Print (`/print/daily-reports/[id]`):**
  - Letterhead, a header table and sections on one page.
  - The photo page follows with `print:break-before-page`, a 2-column grid of plain `<img>` with signed URLs, time and file name.
- **Lapangan home:** adds the Laporan Harian Button and "Laporan hari ini: terkirim / belum dikirim".
- **Field attendance:** the date list uses `backdate_days`.

### shadcn components
Existing: Card, Table, Badge, Button, Dialog, AlertDialog, Select, Switch, Field, Input, InputGroup, Textarea, Alert, Empty, DropdownMenu, Separator. No new components.

### Seed (dev)
Reports for PRJ/AJ224/2026/001 on the last three days:
- two with activities (progress values equal to the seeded ones), obstacles ROW/Lahan/Warga and Cuaca, and one marked reviewed;
- one "Tidak Ada Kegiatan" (rain).

PRJ/AJ224/2026/003 has no report yesterday, so it appears as missing.

## Risks / Trade-offs
- **Photos are added after the report is sent (two steps):** this keeps uploads retryable on a weak signal. The "Foto belum ada" warning and the revision flow cover reports sent without photos.
- **Equipment as free text until change 13:** it is printed as entered.
- **Editing a report after progress was applied:** progress only moves up, so an edit can raise but never undo a value. Corrections downward go through Operasional with a reason.

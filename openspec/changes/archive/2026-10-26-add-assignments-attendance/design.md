# Design: add-assignments-attendance

## Context

- **Existing data:**
  - Employees (`employees`, generated `is_active`) and pay settings (`employee_pay_settings`, HCM/Finance/Direktur only).
  - Positions with required certificates (`position_required_certificates`).
  - Certificates with `certificate_status(expiry, on)` and `employee_certificate_list.is_current` (§11.5).
  - Lapangan accounts are linked to employees through `profiles.employee_id`.
- **Projects:** all project tables have RLS for office roles only. The Lapangan role (`field`) has no rows anywhere yet.
- **Shared infrastructure:**
  - Attachments use the dispatcher functions `attachment_bucket` / `can_read_attachment` / `can_write_attachment`.
  - `next_document_number(code, date)` issues document numbers.
  - `notify_roles` sends notifications.
  - `audit_log` accepts `override` entries.

## Goals / Non-Goals

**Goals**
- One assignment table that drives crews, the certificate check, Lapangan scoping and (later) payroll allocation.
- Attendance with one row per employee per date, written by Lapangan for their crew (H+3) and by HCM for everyone.
- Lapangan scoping in RLS, through one definer function.

**Non-Goals**
- The payroll-period lock and post-lock corrections (change 19 adds a lock trigger on `attendance`).
- Home pages for other roles (change 20).

## Decisions

### Tables (migration `…_assignments_attendance.sql`)
| Table | Columns | Rules |
|---|---|---|
| `assignments` | employee_id → employees, project_id → projects, position_id → positions (all restrict), start_date, end_date (≥ start, null = open), notes, override_reason, overridden_by, overridden_at, created_by, timestamps | **BEFORE INSERT/UPDATE trigger** (definer), detailed below. Column grants: insert (employee_id, project_id, position_id, start_date, end_date, notes, override_reason); update (end_date, notes). No delete. Audit, plus an `override` audit entry. |
| `attendance_days` | project_id → projects, work_date, created_by, created_at | Unique (project_id, work_date). One row per project day, created by `save_attendance`; it is the record the paper-sheet photos attach to. |
| `attendance` | employee_id → employees, work_date, status (`present`/`permit`/`sick`/`leave`/`absent`/`off`), overtime_hours numeric(4,1) 0–24, project_id (null = office), notes, recorded_by, timestamps | Unique (employee_id, work_date). Check: overtime only with `present`. **BEFORE INSERT/UPDATE trigger** (definer), detailed below. Insert/update only. |
| `employees` (altered) | + verification_status (`verified` default / `pending`), registered_by | Pending workers come from `register_local_worker`; HCM sets `verified` (audited by the existing trigger). |

**`assignments` trigger checks:**
- The employee is active on the start date.
- The project status is preparing, running or on_hold.
- No overlap with the employee's other assignments, taking a row lock on the employee to avoid races. The error names the current project.
- On insert, required certificates on the start date come from `assignment_fitness`; missing or expired ones refuse the save unless `override_reason` is given. With a reason, it sets overridden_by/at; when the employee is fit, the override fields are cleared.

**`attendance` trigger checks:**
- work_date ≤ today.
- The employee was active on work_date (join/exit).
- With project_id set, the employee has an assignment on that project covering work_date.
- For the Lapangan role, work_date ≥ today − 3.
- It sets recorded_by.

**Role gates:** BEFORE triggers run before RLS, so both triggers first refuse callers that may not write (42501) without revealing other records. Assignments allow only HCM, or Lapangan inside `register_local_worker` (transaction flag `app.registering_worker`). Attendance allows HCM, and Lapangan only for their projects and crew.

**Employee exit:** an AFTER UPDATE OF exit_date trigger on `employees` ends open assignments on the exit date. Later assignments get end_date = start_date.

### Functions
- **`assignment_fitness(p_employee, p_position, p_on)`** (security invoker): required certificate types of the position with the employee's current certificate status on that date: `missing` / `expired` / `expiring` / `valid` (§11.5, `certificate_status(expiry, p_on)`).
- **`assignment_list` (view, invoker):**
  - Assignment columns plus employee no, name, verification, project code/name, position name.
  - `state`: `upcoming` / `active` / `ended`, relative to `today_wib()`.
  - `cert_state`: the worst required-certificate status today (null when none is required) and `cert_issues` (e.g. "TKBT Tingkat 2 Kedaluwarsa").
- **`user_project_ids()`** (security definer, stable): projects where the signed-in user's linked employee has an assignment covering today (active profile only).
- **`user_crew_ids()`** (definer, stable): employees with an assignment on those projects (any dates, so recent history stays visible).
- **`save_attendance(p_project uuid, p_date date, p_rows jsonb)`** (security invoker, so RLS applies): upserts the project day (when p_project is set) and each `{employee_id, status, overtime_hours, notes}` with project_id = p_project. Returns the number of rows saved.
- **`attendance_recap(p_from, p_to)`** (invoker): per employee and project (null = office), the count of each status and the overtime sum.
- **`register_local_worker(p_project uuid, p_worker jsonb)`** (definer). It checks:
  - the caller has role `field` and p_project ∈ `user_project_ids()`;
  - the position is active and has no required certificates;
  - name, a 16-digit NIK unique among employees, phone, and daily wage > 0.

  It then inserts the employee: number from `next_document_number('local_worker', today)`, daily/field, join today, `pending`, registered_by. It adds pay settings (daily, daily_wage), inserts the assignment from today, and notifies HCM ("Pekerja baru menunggu verifikasi", link to the employee). It returns the employee id.
- **Document type** `local_worker`: `LOK/AJ224/{YYYY}/{SEQ:3}`, yearly.

### RLS (PRD §13)
| Table | Read | Write |
|---|---|---|
| `assignments` | SA, Dir, HCM, Ops; Lapangan where project ∈ `user_project_ids()` | HCM (insert; update end/notes) |
| `attendance`, `attendance_days` | SA, Dir, Fin, HCM, Ops; Lapangan where project ∈ `user_project_ids()` | HCM all; Lapangan where project ∈ `user_project_ids()` (insert/update) |
| `projects` (+ policy) | Lapangan where id ∈ `user_project_ids()` | — |
| `project_stages`, `project_sections`, `section_progress`, `progress_updates` (+ policy) | Lapangan where the project ∈ `user_project_ids()` | — |
| `employees` (+ policy) | Lapangan where id ∈ `user_crew_ids()` or own employee | — (local workers via function) |
| `employee_certificates` (+ policy) | Lapangan where employee ∈ `user_crew_ids()` | — |

- **Project documents for Lapangan:** these are readable for the projects they can see, because the attachment check follows project visibility. Contract and addendum files stay limited to contract roles, and Lapangan cannot upload.
- **Payroll RLS:** pay settings stay unreadable for Lapangan.
- **Attachments:** a new type `attendance_day` (bucket `project-files`, category `sheet`). Read follows `attendance_days` visibility; write is HCM and Lapangan for a visible day.

### App structure
- **Libraries:**
  - `lib/assignments/{labels,schema,queries,actions}.ts`.
  - `lib/attendance/{labels,schema,queries,actions}.ts`.
  - `lib/field/queries.ts`: the Lapangan's projects and today's status.
- **SDM → Penugasan (`/hr/assignments`):**
  - DataTable with search, Project / Status / Override filters and export `assignments`.
  - "Tambah Penugasan" Dialog. Picking the employee fills the position; the start date runs a fitness check through a server action and shows each required certificate with its status Badge.
  - When the employee is unfit, an Alert explains it and an override reason Textarea is required before saving.
  - "Akhiri" Dialog (end date).
- **SDM → Absensi (`/hr/attendance`):**
  - Scope Select (Kantor or a project) and a DatePicker.
  - Shared `AttendanceSheet`: one row per person with name, position, certificate and verification Badges, a status Select, an overtime Input, "Tandai Semua Hadir" and "Simpan".
  - For a project day, an AttachmentList for the sheet photo.
  - Link to Rekap.
- **Rekap (`/hr/attendance/recap`):** DateRangeFilter (default this month), Project and Tipe filters, a Table per employee/project, export `attendance-recap`.
- **Lapangan:**
  - Home `/`: Card per active project with large Buttons (`size="lg"`) Absensi Hari Ini and Tambah Pekerja Lokal, and the status "Absensi hari ini x/y kru" with a Progress bar.
  - `/field/attendance`: project Select when there are several; date Select limited to today … H−3; `AttendanceSheet` stacked for 375 px; sheet photo.
  - `/field/workers/new`: Field form.
  - Sidebar group Lapangan: Absensi Hari Ini, Tambah Pekerja Lokal.
- **Project tab Tim & Absensi (`/projects/[id]/team`):**
  - Crew table with certificate state and override.
  - Attendance of a chosen date (read-only) with links to the input pages for HCM and Lapangan.
  - Shown to SA, Dir, Fin (attendance only), HCM, Ops and Lapangan.
- **Project access for Lapangan:**
  - `PROJECT_VIEW_ROLES` gains `field`.
  - The project layout shows Ringkasan, Seksi & Progres, Tim & Absensi and Dokumen (read-only) to Lapangan; Daftar Proyek stays out of their menu.
- **Employees:**
  - The list gets a Verifikasi filter (Menunggu Verifikasi).
  - The employee page shows the Badge and, for HCM, a "Verifikasi" button (AlertDialog).
- **Import:** template `attendance` (HCM) with No Karyawan*, Tanggal*, Status*, Jam Lembur, Kode Proyek, Catatan. Rows go through the same trigger rules.

### shadcn components
Existing only: Card, Table, Badge, Button, Dialog, AlertDialog, Select, Field, Input, InputGroup, Textarea, Progress, Alert, Empty, DropdownMenu, Tabs, Calendar/Popover (DatePicker). The field pages are full pages (not overlays), so no Drawer is needed.

### Seed (dev)
- **Assignments to PRJ/AJ224/2026/001 from its start date:**
  - Lukman Hakim (Mandor, linked to the Lapangan account), Budi Santoso, Joko Susilo, Rudi Hartono, Dedi Kurniawan.
  - Eko Prasetyo (Safety Officer): fit at start, P3K expired since, so he is marked red.
- **Other assignments:** Andi Wijaya (Driver without SIM B1) to PRJ/AJ224/2026/003 with an override by HCM. Slamet Riyadi stays unassigned (expired TKBT 2) for the refusal check.
- **Attendance:** project 1 crew for the last five working days (mixed statuses, some overtime) and office staff for the last three days; today is left empty.

## Risks / Trade-offs
- **Lapangan scoping is computed per query through definer functions:** these are small indexed lookups (assignments by employee and dates).
- **H+3 is checked against the server date in WIB:** a crew without signal for more than three days needs HCM to enter the sheet.
- **No audit of ordinary attendance edits:** rows keep recorded_by/updated_at. Audited corrections start with the payroll lock (change 19).
- **Pending workers can be attended and paid only after verification (change 19):** HCM sees them in the list filter and gets a notification.

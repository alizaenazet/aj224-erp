# Proposal: add-assignments-attendance

## Why

Crews are assigned to projects by phone and spreadsheet, and nobody checks certificates at that moment, so uncertified linesmen climb towers. Attendance is kept on paper sheets that reach the office late, which delays payroll. Lapangan accounts also cannot be given any project data until the system knows where each person works. This change records project assignments with a certificate check and audited override, field and office attendance with a recap, local workers registered from the field, and turns on Lapangan project scoping with a mobile home.

## What Changes

- **Penugasan proyek (HCM-05, Wajib):**
  - Fields: employee, project, position on the project, start date, optional end date.
  - At most one active assignment per employee (date ranges may not overlap).
  - Active assignments define the project crew and the projects a Lapangan account can open.
  - Ending an employee (exit date) ends their open assignments.
- **Validasi sertifikat (HCM-06, Wajib):**
  - An assignment is refused when a required certificate of the position is missing or expired on the start date (§11.5).
  - HCM can override with a reason; the override is written to the audit log and marked on the assignment.
  - Crew whose required certificate is expired during the assignment are marked red in crew and attendance lists.
- **Absensi lapangan (HCM-09, Wajib):**
  - Lapangan opens "Absensi Hari Ini" and sees the crew of their project.
  - Each person gets a status (Hadir, Izin, Sakit, Cuti, Alpa, Libur) and overtime hours; "Tandai Semua Hadir" fills the list.
  - An optional photo of the paper sheet can be attached.
  - One record per employee per date; Lapangan may enter up to H+3.
- **Absensi kantor (HCM-10, Wajib):** HCM fills office staff attendance in the same format, or imports it (new template).
- **Rekap absensi (HCM-11, Wajib, first part):**
  - Recap per period per employee and project, exportable.
  - The lock after payroll approval and the audited corrections come with `add-payroll`, which owns payroll periods.
- **Pekerja lokal (HCM-12, Wajib):**
  - Lapangan adds a local worker with name, NIK KTP, phone, position (only positions without required certificates) and daily wage.
  - The worker is "Menunggu Verifikasi HCM", is assigned to the project at once and can be recorded in attendance.
  - HCM is notified and verifies. Payroll will refuse unverified workers (`add-payroll`).
- **Lapangan scoping (UMM-02, PRD §6):** Lapangan sees only projects of their active assignment, plus that project's sections and progress, crew, crew certificates, assignments and attendance, including through direct addresses and the API.
- **Beranda Lapangan (DSB-04, field part, Wajib):** a mobile home with large buttons for the actions available now (Absensi Hari Ini, Tambah Pekerja Lokal) and today's status (crew recorded of crew assigned). Later changes add their buttons.
- **Project tab:** Tim & Absensi.

## Capabilities

### New Capabilities
- `hcm/assignments`: Project assignments, the certificate check with override, and crew lists.
- `hcm/attendance`: Field and office attendance, the H+3 rule and the recap.
- `dashboard/home`: Home page per role; this change adds the Lapangan home.

### Modified Capabilities
- `hcm/employees`: Lapangan views their crew and registers local workers for HCM verification; leaving ends assignments.
- `hcm/certifications`: Lapangan views the certificates of their crew.
- `projects/projects`: Lapangan sees the projects of their active assignment.
- `projects/progress`: Lapangan views sections and progress of their projects.
- `platform/data-import`: Adds the Absensi template for HCM.

## Impact

- **Database:**
  - Tables `assignments`, `attendance_days` and `attendance`; employees gain `verification_status`.
  - Functions `user_project_ids`, `assignment_fitness`, `register_local_worker`, `save_attendance` and `verify_employee`.
  - Views `assignment_list` and `attendance_recap`.
  - Lapangan RLS policies on projects, sections, progress, employees, certificates, assignments and attendance.
  - Attachment type `attendance_day`, document type `local_worker`.
  - Audit (including override entries), seed data.
- **App:**
  - `/hr/assignments` and `/hr/attendance` (with recap).
  - `/field/attendance` and `/field/workers/new`.
  - Project tab `/projects/[id]/team`; Lapangan home on `/`.
  - Verification on the employee page and a filter on the list.
  - Exports `assignments` and `attendance-recap`; import template `attendance`.
- **Dependencies:** none new.

## Out of scope

- Attendance period lock and audited corrections after payroll approval (`add-payroll`, HCM-11).
- Home pages of other roles and the Direktur override panel (`add-dashboards`, DSB-01 … DSB-04).
- Working hours for LTIFR (`add-k3-incidents` reads attendance).
- Shift times, GPS check-in and fingerprint devices (PRD §7.2).

## Open questions

- Whether Izin/Sakit/Cuti are paid (PRD §19) affects payroll only; attendance records the status as entered.

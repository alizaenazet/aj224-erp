# Tasks: add-assignments-attendance

## 1. Database

- [x] 1.1 Write migration `<ts>_assignments_attendance.sql`: `assignments` (checks, fitness, override audit, column grants), employee exit trigger, `attendance_days`, `attendance` (checks), employees verification columns, functions `assignment_fitness` / `user_project_ids` / `user_crew_ids` / `save_attendance` / `attendance_recap` / `register_local_worker`, view `assignment_list`, document type `local_worker`, attachment type `attendance_day`, RLS (incl. Lapangan policies on projects, progress, employees, certificates); seed assignments and attendance; verify `pnpm db:reset` and `pnpm db:types`
- [x] 1.2 SQL check assignments as HCM: Budi assigned; overlap refused; Slamet (expired) refused without reason and saved with one (override audit entry); Joko (expiring) fit; closed project refused; exit date ends the assignment; Operasional/Finance cannot write, Finance reads nothing
- [x] 1.3 SQL check attendance and scoping: Lapangan Lukman sees only project 1 (projects, sections, crew, crew certificates, assignments), saves today's crew attendance, is refused for H−4, another project's crew and a future date; overtime without Hadir refused; HCM saves office attendance; recap counts; `register_local_worker` creates a pending Helper with an assignment and notifies HCM, refuses Linesman and a duplicate NIK

## 2. Library, export and import

- [x] 2.1 Add `lib/assignments/*`, `lib/attendance/*`, `lib/field/*`, audit labels (assignments, override), attachment config `attendance_day`, exports `assignments` and `attendance-recap`, import template `attendance`, navigation (SDM → Penugasan, Absensi; Lapangan group); add `field` to project view roles; verify `tsc` passes

## 3. Pages

- [x] 3.1 Add Penugasan (list, add dialog with fitness preview and override, end dialog); verify as HCM: assign Budi to project 3 after ending his project 1 assignment, Slamet refused then saved with override (badge + audit entry), filter Override; as Operasional read-only
- [x] 3.2 Add Absensi (HCM: Kantor and project scope, sheet photo) and Rekap with export; verify as HCM: office day with Tandai Semua Hadir and one Cuti, recap for this month matches, export matches; as Finance read-only
- [x] 3.3 Add the Lapangan home, `/field/attendance` and `/field/workers/new`; verify at 375 px as Lapangan Lukman: home shows project 1 and 0/n, Tandai Semua Hadir with one Sakit and overtime saves, home shows n/n, add local worker Agus (Helper) who appears in the list as Menunggu Verifikasi; HCM gets the notification and verifies him
- [x] 3.4 Add the Tim & Absensi tab and Lapangan project access; verify as Lapangan: project 1 opens with Ringkasan (no contract value), Seksi & Progres read-only, Tim & Absensi; project 3 address shows not found; Eko marked red in the crew list; as Marketing no Tim & Absensi tab

## 4. Integration

- [x] 4.1 Run `pnpm lint` and `pnpm build`; confirm no server or console errors; check the field pages at 375 px and the HCM pages on desktop

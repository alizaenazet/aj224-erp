# Design: add-certifications-training

## Context

See proposal.md. Building blocks already in place:
- **Master data:** `certificate_types` (validity_months, null = lifetime), `positions`, `position_required_certificates`.
- **System parameters:** `system_parameters.cert_expiry_warning_days` (default 60).
- **Employees:** `employees` (`is_active`).
- **Attachments:** the attachment service (`can_read_attachment` / `can_write_attachment` / `attachment_bucket`, bucket `employee-files`).
- **Platform services:** `notify_roles(... dedupe_key)`, `scheduled_checks` with `run_daily_checks()` at 06:00 WIB, `today_wib()`, the audit trigger, and the list kit.

## Goals / Non-Goals

**Goals:**
- One SQL definition of certificate status (§11.5) used by lists, the employee page, training needs and reminders.
- Training results that create certificates in the database, so every client gets the same behaviour.

**Non-Goals:**
- Assignment checks (HCM-06) and the Operasional reminder for assigned crew.
- Lapangan access.
- Training costs.

## Decisions

### Tables (migration `…_certifications_training.sql`)
| Table | Key fields | Notes |
|---|---|---|
| `trainings` | name, kind (`internal`/`external`), organizer, start_date, end_date (≥ start), location, certificate_type_id → certificate_types (restrict, nullable), notes, created_by, timestamps | Created first, because certificates reference it. A BEFORE DELETE trigger refuses deleting a training that has a Lulus participant ("Pelatihan dengan peserta Lulus tidak dapat dihapus"). |
| `employee_certificates` | employee_id → employees (restrict), certificate_type_id → certificate_types (restrict), certificate_no, issuer, issued_date (required), expiry_date (null = lifetime, ≥ issued), notes, training_id → trainings (set null), created_by, timestamps | Index on (employee_id, certificate_type_id, expiry_date desc nulls first). Audit trigger on insert and update. |
| `training_participants` | pk (training_id, employee_id), result (`pending`/`passed`/`failed`, default pending), certificate_id → employee_certificates (set null), timestamps | See the participant triggers below. |

### Status in one place (§11.5)
- **`certificate_status(p_expiry date, p_on date default today_wib())`** (stable SQL) returns:
  - `valid` when the expiry is null or `p_expiry > p_on + warning days`;
  - `expiring` when `p_on ≤ p_expiry ≤ p_on + warning days`;
  - `expired` when `p_expiry < p_on`.
  - The warning days come from `system_parameters`.
- **View `employee_certificate_list`** (`security_invoker = true`):
  - Columns: certificate columns, employee name, number, active flag and position, type name, `status`, `days_left` (expiry − today), and `is_current`.
  - `is_current` is `row_number() over (partition by employee, type order by expiry desc nulls first, issued desc, created desc) = 1`. Lifetime certificates sort first, i.e. they are the latest.
- **View `training_needs`** (`security_invoker = true`, and the role check SA/Dir/HCM/Ops inside the view so Finance cannot read misleading "missing" rows through the API):
  - One row per active employee × certificate required by their position whose current certificate is missing, expired or expiring.
  - Columns: employee, position, type, current certificate id, expiry date and `status` (`missing`/`expired`/`expiring`).
- **Fit for position:** the employee page computes Layak Tugas from the required types and the `is_current` rows (`valid` or `expiring` = OK). The assignment change will add the SQL check for a start date using `certificate_status(expiry, start_date)`.

### Participant triggers (HCM-07)
- **BEFORE INSERT:** the employee must be active ("Karyawan nonaktif tidak dapat menjadi peserta").
- **BEFORE INSERT OR UPDATE OF result:**
  - When the result is `passed`, certificate_id is null and the training has a type: insert the certificate. Its fields are the employee, the type, issuer = organizer, issued = coalesce(end_date, start_date), expiry = issued + validity_months (null for lifetime) and training_id. Then set `new.certificate_id`.
  - When the result changes away from `passed`: keep the old id for the AFTER trigger and set `new.certificate_id = null`.
- **AFTER UPDATE OF result:** delete `old.certificate_id` when it was created by this training (`training_id = new.training_id`). The delete runs after the row is updated, so the FK `set null` has nothing to touch.
- The triggers run as the invoker; HCM has the rights on certificates, and the audit log names HCM.

### Reminders (HCM-04)
- **`check_certificate_expiry()`** (security definer, execute revoked from API roles) is registered in `scheduled_checks` as `certificate-expiry`. For current certificates of active employees with status `expiring` or `expired`, it calls `notify_roles('{hcm}', 'certificate', …)`:
  - **Expiring:** title "Sertifikat segera kedaluwarsa", dedupe `cert-expiring:<id>`, link `/hr/certificates?status=expiring`.
  - **Expired:** title "Sertifikat kedaluwarsa", dedupe `cert-expired:<id>`, link `/hr/certificates?status=expired`.
  - The body is "<Nama> · <Jenis> berakhir <25 Okt 2026>.", formatted by `format_date_id(date)` with Indonesian month abbreviations.
- Dedupe keys make each state fire once per certificate. A renewal creates a new current row, so the old one is no longer checked.

### RLS (PRD §13)
- `employee_certificates`, `trainings`, `training_participants`:
  - select: `super_admin`, `director`, `hcm`, `operations`
  - insert/update/delete: `hcm`
- **Attachments:** the functions are replaced to add `employee_certificate`:
  - bucket: `employee-files`
  - read: the certificate is visible to the caller
  - write: `hcm`, category `scan`, and the certificate exists
  - Path: `employee_certificate/<id>/scan/<file>`. The storage policies already delegate by path.

### Audit
- `employee_certificates` is audited (insert, update).
- Labels: type, number, issuer, dates and notes.
- `AUDIT_REFS` gains `employee_certificates.certificate_type_id → certificate_types.name` and `employee_id → employees.full_name`.

### App structure
- **`lib/certifications/`:** labels (status labels and badge variants), schema (`certificateSchema`, which checks expiry ≥ issued), queries (`queryCertificates`, `employeeCertificates`, `positionRequirements`, `certificateTypeOptions`), actions (`saveCertificate`, `deleteCertificate`).
- **`lib/trainings/`:** labels, schema (`trainingSchema`), queries (`queryTrainings`, `getTraining`, `queryTrainingNeeds`, `participantOptions`), actions (`createTraining` with participants, `updateTraining`, `deleteTraining`, `addParticipants`, `removeParticipant`, `setParticipantResult`).
- **Routes** (readers SA/Dir/HCM/Ops; editing HCM):
  - `/hr/certificates`: list. Default sort is expiry ascending, nulls last. Status filter: valid, expiring, expired, problem.
  - `/hr/trainings`, `/hr/trainings/new` (reads `?certificate_type=&employees=` from training needs), `/hr/trainings/[id]` (participants, results, add/remove), `/hr/trainings/[id]/edit`.
  - `/hr/training-needs`: grouped Cards per type, each with a checkbox table and "Buat pelatihan".
  - Employee page: a new "Sertifikat" tab with:
    - a "Sertifikat wajib jabatan" card showing status per required type and a Layak Tugas badge;
    - a certificates table with Diperbarui rows, scan link or upload, edit/delete (HCM) and Riwayat (SA/Dir).
- **Navigation:** SDM gains Sertifikat (`BadgeCheckIcon`), Pelatihan (`GraduationCapIcon`) and Kebutuhan Pelatihan (`ListChecksIcon`).
- **Exports:** `certificates`, `trainings`, `training-needs` (same queries and readers).
- **Attachments config:** gains `employee_certificate` (category `scan`, single file). The revalidation path becomes a pattern, `/hr/employees/[id]` with type `page`, because a certificate id does not name the employee page.

### Layout fix found during verification
`SidebarInset` gets `min-w-0` and the inner page wrapper becomes a `div`. Without `min-w-0`, a wide table widened the whole page instead of scrolling inside its container (it also affected Pengguna & Peran). There was also a nested `<main>`. The date picker's year range now runs 30 years ahead, so certificate expiries such as 2031 can be picked.

### shadcn components
Existing: Card, Table, Badge, Button, Dialog, AlertDialog, Field, Input, Textarea, Select, Popover + Calendar (DatePicker), Command, Checkbox, Tabs, Empty, DropdownMenu, Skeleton. New compositions: `components/certifications/*` and `components/trainings/*` (including an `EmployeeMultiPicker`: Popover + Command with check marks). No new primitives.

### Seed (dev; dates relative to the reset day)
- **Certificates:**
  - Oki SKTTK valid.
  - Lukman TKBT 1 expiring (+30 days).
  - Budi TKBT 2: an expired old certificate plus a valid renewal.
  - Slamet TKBT 2 expired (−15 days).
  - Joko SIO expiring (+45).
  - Eko: Ahli K3 Umum valid, P3K expired (−5).
  - Dedi TKBT 1 lifetime-style extra.
  - Andi has no SIM B1.
- **Training:** "Pelatihan TKBT Tingkat 2 Angkatan September" (Eksternal), with Budi Lulus (certificate created by the trigger) and Slamet Tidak Lulus.

## Risks / Trade-offs
- **Window-function view:** filtering `is_current` cannot use indexes, which is fine for a few hundred employees. A materialised current-certificate table can come later if needed.
- **Dedupe keys:** each reminder fires once per certificate and state. If an expiry date is edited back into the window after a reminder, there is no new reminder, which is acceptable for v1.
- **Removing a passed result deletes the generated certificate,** even if HCM had added its number. The confirmation dialog says so.

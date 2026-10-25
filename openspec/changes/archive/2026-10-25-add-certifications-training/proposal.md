# Proposal: add-certifications-training

## Why

Field workers climb towers with K3 certificates that nobody tracks, and certificates expire unnoticed (PRD §3, §4). HCM needs one place for every employee's certificates, with a status computed the same way everywhere (§11.5), reminders before and at expiry, and a training record that turns passed participants into certificates. Assignment validation (HCM-06, change `add-assignments-attendance`) depends on this data.

## What Changes

- **Sertifikat karyawan (HCM-03, Wajib):**
  - Fields: type, number, issuer, issue date, expiry date (empty = seumur hidup), notes and a scanned file.
  - When HCM picks a type and issue date, the expiry date is suggested from the type's validity.
  - Status is computed automatically per §11.5: Berlaku, Segera Kedaluwarsa (within the "segera kedaluwarsa" parameter, default 60 days) or Kedaluwarsa.
  - A newer certificate of the same type supersedes the older one.
  - The employee page shows each required certificate of the position and whether the employee is Layak Tugas (§11.5).
- **Pengingat sertifikat (HCM-04, Wajib):**
  - A Sertifikat list shows current certificates, filtered to Segera Kedaluwarsa and Kedaluwarsa.
  - The daily 06:00 WIB check notifies HCM once when a certificate enters the warning window and once when it expires.
- **Pelatihan (HCM-07, Wajib):**
  - Fields: name, Internal/Eksternal, organizer, dates, location, the certificate type it produces, and participants with result (Lulus/Tidak Lulus).
  - Participants who pass automatically get a new or renewed certificate. Its number and file can be completed later.
- **Kebutuhan pelatihan (HCM-08, Wajib):**
  - Lists active employees whose required certificates are missing, expired or expiring, grouped per certificate type.
  - Selected employees can start a new training directly.
- **Menu:** SDM → Sertifikat, Pelatihan, Kebutuhan Pelatihan; a Sertifikat tab on the employee page.

## Capabilities

### New Capabilities
- `hcm/certifications`: Employee certificates, status per §11.5, Layak Tugas per position, expiry list and reminders.
- `hcm/training`: Training records with participants and results, automatic certificates, and the training-needs list.

### Modified Capabilities
None. Certificate scans use the existing attachment service (`platform/attachments`) with a new record type, without changing its rules.

## Impact

- **Database:**
  - Tables `employee_certificates`, `trainings`, `training_participants`.
  - Functions `certificate_status(expiry, on_date)` and `check_certificate_expiry()` (registered in `scheduled_checks`).
  - Views `employee_certificate_list` and `training_needs` (security invoker).
  - Trigger that creates or removes the certificate of a passed participant.
  - Attachment functions gain the `employee_certificate` record type.
  - RLS; audit on certificates.
  - Dev seed certificates (valid, expiring, expired, missing) and one training.
- **App:**
  - `/hr/certificates`, `/hr/trainings` (list, new, detail, edit) and `/hr/training-needs`.
  - Sertifikat tab on `/hr/employees/[id]`.
  - Exports `certificates`, `trainings` and `training-needs`.
- **Dependencies:** none new.

## Out of scope

- Notifying Operasional when the employee holds an active assignment (second half of HCM-04): it needs assignments, so `add-assignments-attendance` extends the daily check.
- Assignment validation and override (HCM-06); Lapangan read access to crew certificates.
- Training costs: recorded later as expenses or supplier bills in category Pelatihan & Sertifikasi (`add-payables-expenses`).
- Certificate import (`add-data-import`); email reminders (`add-email-notifications`).

## Open questions (PRD §19)

- **Q10 (required certificates per position):** the seeded map and validities stay editable in Master Data. Statuses and needs follow whatever HCM configures.

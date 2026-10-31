# Proposal: fix-hcm-gaps

## Why

Before manual testing of HR/HCM, v1 was checked against PRD §10.10, §11.5 and §13. The check found defects in features that already exist: attendance import refused every row, one stale record blocked a whole attendance sheet, an employee who had left could still be assigned, Operasional never got the certificate reminder that HCM-04 asks for, a deleted certificate left its scan behind, and training edits did not reach the certificates the training had issued. This change fixes those defects only. It adds no features.

## What Changes

- **Absensi impor (HCM-10, UMM-13):** imported rows are saved through the same path as the sheet, so they are accepted; a row for a recorded date still replaces it.
- **Lembar absensi (HCM-09, HCM-10):**
  - Saving sends only new or changed rows, so an older record that no longer passes the crew rules (an assignment ended since) does not block the rest.
  - Stored notes are kept when a status changes.
  - HCM can open project attendance for Persiapan projects, as Lapangan already can.
- **Penugasan (HCM-01, HCM-05):**
  - An assignment of an employee with an exit date must end by that date.
  - An end date cannot be extended or cleared past the exit date, or on a completed or closed project.
  - The crew list leaves out people who left before the sheet date.
  - The form offers only active positions.
- **Pengingat sertifikat (HCM-04):** the daily check also notifies Operasional when the employee is on an active assignment, naming the project. This is the follow-up promised in `add-certifications-training`.
- **Sertifikat (HCM-03):** deleting a certificate removes its scan file and attachment record.
- **Pelatihan (HCM-07):**
  - Changing a training's organizer or dates updates the certificates it issued.
  - Adding a certificate type issues certificates to participants who already passed.
  - Changing the type is refused while certificates from the training exist.
- **Setup:** `.env.example` names `SUPABASE_SECRET_KEY`, which invites and deactivation need.

## Capabilities

### Modified Capabilities
- `hcm/assignments`: exit-date rule on assignments and end-date changes; crew list without people who left.
- `hcm/attendance`: import saves rows; the sheet saves changed rows and keeps notes.
- `hcm/certifications`: Operasional reminder for assigned crew; deletion removes the scan.
- `hcm/training`: training edits reach issued certificates.

## Impact

- **Database:** migration `20261031114104_hcm_fixes.sql` replaces `assignments_check` and `check_certificate_expiry`, and adds trigger `trainings_sync_certificates`. No table or column changes; generated types unchanged.
- **App:**
  - Import: `lib/import/templates/attendance.ts`.
  - Attendance: `components/attendance/attendance-sheet.tsx`, `lib/attendance/queries.ts`.
  - Assignments: `lib/assignments/queries.ts`, `app/(app)/hr/assignments/page.tsx`.
  - Certificates: `lib/certifications/actions.ts`.
  - Setup: `.env.example`.
- **Not changed (deferred by design):**
  - The attendance lock after payroll approval (HCM-11) and the payslip block for unverified workers (HCM-12) belong to `add-payroll`.
  - Showing overrides on the Direktur dashboard (HCM-06) belongs to `add-dashboards`.

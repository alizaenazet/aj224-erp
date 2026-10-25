# Proposal: add-platform-services

## Why

Most later modules need the same database services: an audit trail for sensitive data, automatic document numbers, cancelling instead of deleting, in-app notifications, and a morning job that turns due dates into reminders. Building them once, before the modules, keeps every module consistent and avoids each one inventing its own version.

## What Changes

- **Audit log (UMM-08, Wajib).**
  - A generic audit trail records who changed what and when, with old and new values. Tables opt in with one trigger.
  - User administration (invites, role changes, deactivation) is the first audited data. Finance, payroll, locked attendance, stock opname, parameters and overrides attach in their own changes.
  - Super Admin and Direktur can open the history of a single record and a global Log Audit page (PRD §13).
- **In-app notifications (UMM-06, Wajib).**
  - A bell in the app header shows the unread count and recent notifications. Each notification links to its page and can be marked read.
  - A "Notifikasi" page lists all of them.
  - Notifications are created only by database logic (triggers, scheduled checks) and only reach the intended recipients.
- **Document numbering (UMM-10, Wajib).** Automatic numbers for tender, proyek, invoice, surat jalan and insiden with configurable formats (e.g. `INV/AJ224/2026/10/001`) and monthly or yearly reset. Numbers never repeat, even under concurrent saves.
- **Cancel instead of delete (UMM-11, Wajib).** A database guard that refuses hard deletes on transaction tables, plus a common shape for cancellation: status Batal, who, when and a required reason. Each transaction table adopts it in its own change.
- **Daily scheduled checks (PRD §15).**
  - A pg_cron job runs every morning at 06:00 WIB and executes each registered check (certificates, due dates, termin, missing daily reports).
  - Each run is logged; a failing check doesn't stop the others.
  - Modules register their checks in their own changes.
- A shared "today in WIB" function for all date rules (H+3 limits, certificate status, due dates).

## Capabilities

### New Capabilities
- `platform/audit-log`: Recording changes to sensitive records and letting Super Admin and Direktur review them.
- `platform/notifications`: Delivering in-app notifications to the right users and letting them read and clear them.
- `platform/document-numbering`: Generating unique, formatted document numbers per document type and period.
- `platform/record-cancellation`: Keeping transactions permanent; cancelling them with a reason instead of deleting.
- `platform/scheduled-checks`: Running registered daily checks reliably and recording each run.

### Modified Capabilities
- None. The `access-control` behavior is unchanged. Inviting a user now also writes an audit entry, which is specified under `platform/audit-log`.

## Impact

- **Database:** tables `audit_log`, `notifications`, `document_types`, `document_sequences`, `scheduled_checks`, `job_runs`; functions for audit, notify, numbering, delete guard, `today_wib()`, the daily runner; the pg_cron extension and one cron job; an audit trigger on `profiles`; an insert policy on `profiles` for Super Admin.
- **App:**
  - A notification bell in the header and a `/notifications` page.
  - Pengaturan → Log Audit (`/settings/audit-log`).
  - A "Riwayat" action on Pengguna & Peran.
  - The invite action now inserts the profile as the signed-in Super Admin, so the audit shows who invited.
- **Dependencies:** shadcn popover, pagination and scroll-area.

## Out of scope

- **Attachments (UMM-03):** moved to `add-employee-records`, where the first real attachment type (employee documents) lets the access rules be tested end to end.
- **The "Perlu Tindakan" list on Beranda:** built from live data per role in `add-dashboards` (DSB-04). This change provides only the notification bell and list.
- **Email delivery:** the daily digest (UMM-07) and urgent K3 email come in `add-email-notifications`.
- **Realtime push for the bell:** optional in PRD §15. Notifications load when a page opens.
- **The UI for editing document number formats:** part of Parameter Sistem (MST-10) in `add-master-data`.

## Open questions (PRD §19)

None of the §19 questions affect this change.

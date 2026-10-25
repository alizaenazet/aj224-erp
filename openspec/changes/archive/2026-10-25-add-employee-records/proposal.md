# Proposal: add-employee-records

## Why

HCM keeps employee data, documents and pay settings in separate files today (PRD §3). Payroll, certification, assignment and attendance all need one employee record to hang off. Field (Lapangan) accounts also have to be tied to an employee, so the system knows which projects they may see. This change creates that record, keeps salary data apart from everything else, and adds the shared file-attachment service (UMM-03) through its first real use: employee documents.

## What Changes

- **Data karyawan (HCM-01, Wajib):**
  - Fields: employee number (NIK karyawan, unique), name, NIK KTP (16 digits, unique), place and date of birth, address, phone, emergency contact, blood type, employment status (Tetap/Kontrak/Harian Lepas), work type (Kantor/Lapangan), position, join and exit dates, bank account, BPJS number and photo.
  - HCM creates and edits; Super Admin, Direktur, Finance and Operasional view (PRD §13).
  - Deactivating an employee (exit date) marks them Nonaktif. A linked user account is deactivated at the same moment (PRD §14).
- **Dokumen & pengaturan gaji (HCM-02, Wajib):**
  - Employee documents (KTP, KK, kontrak kerja, ijazah, lainnya), visible to HCM and Direktur.
  - Pay settings: Harian or Bulanan, daily wage or base salary, fixed allowance, meal allowance per day, field allowance per day, overtime rate per hour, fixed deduction (BPJS). Kept in a separate table that only HCM, Finance and Direktur can read and only HCM can change. Every change is audited.
- **Lampiran (UMM-03, Wajib):**
  - A shared attachment service: private storage per domain, files opened only through short-lived signed links for users who may see the record, PDF/JPG/PNG/XLSX up to 10 MB.
  - Photos are compressed on the device to at most 1 MB, and a failed upload can be retried.
  - Later modules (projects, field photos, finance proofs, K3) register their own record types.
- **Account ↔ employee link (MST-01):** Super Admin links a user account to an employee on Pengguna & Peran. One employee has at most one account.
- **Menu:** SDM → Karyawan.

## Capabilities

### New Capabilities
- `hcm/employees`: Employee master records, status and the link to user accounts.
- `hcm/pay-settings`: Restricted per-employee pay settings used by payroll.
- `platform/attachments`: Uploading, viewing and removing files attached to records with access following the record.

### Modified Capabilities
- `access-control`: User administration gains linking an account to an employee (MST-01).

## Impact

- **Database:**
  - Tables `employees`, `employee_pay_settings`, `attachments`; `profiles.employee_id` (unique FK).
  - Access helpers `can_read_attachment` / `can_write_attachment`.
  - Private bucket `employee-files` (photo and documents; access per category).
  - Audit triggers on employees and pay settings; pay audit entries visible to Direktur only. A trigger that deactivates the linked profile.
  - Dev seed employees.
- **App:**
  - `/hr/employees` (list), `/hr/employees/new`, `/hr/employees/[id]` (detail with documents and pay), `/hr/employees/[id]/edit`.
  - Shared `AttachmentList`.
  - "Hubungkan karyawan" on Pengguna & Peran.
  - Export `employees`.
- **Dependencies:** `browser-image-compression`; shadcn `command`.

## Out of scope

- Certificates and training: `add-certifications-training`.
- Assignments, attendance and new workers added by Lapangan (HCM-05, HCM-09 … HCM-12): `add-assignments-attendance`. Lapangan read access to crew data comes with assignments.
- Pay calculation: `add-payroll`.
- Bulk import of employees: `add-data-import`.

## Open questions (PRD §19)

- **Q2 (piece-rate pay) and Q11 (paid sick leave):** they affect payroll calculation, not the stored settings. Pay settings stay generic (Harian/Bulanan plus manual components).

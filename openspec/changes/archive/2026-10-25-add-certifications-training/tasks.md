# Tasks: add-certifications-training

## 1. Database

- [x] 1.1 Write migration `<ts>_certifications_training.sql`: trainings, employee_certificates, training_participants, `certificate_status`, `format_date_id`, views `employee_certificate_list` and `training_needs`, participant and training-delete triggers, `check_certificate_expiry` + scheduled check, attachment functions with `employee_certificate`, RLS, audit trigger; add dev certificates and a training to `supabase/seed.sql`; verify `pnpm db:reset` and `pnpm db:types` succeed
- [x] 1.2 SQL check statuses and needs: statuses of the seeded certificates match §11.5 (expiring +30, expired −15, lifetime valid); Budi's old certificate is not current; training needs list Slamet (expired), Andi (missing), Lukman and Joko (expiring), Eko P3K (expired); marking Slamet Lulus creates a certificate with expiry = issue + 60 months and changing back removes it; an inactive employee cannot be added as participant
- [x] 1.3 SQL check access and reminders: HCM writes, Operasional/Direktur/Super Admin read only, Finance and Marketing read no certificates, trainings or needs; running `run_daily_checks()` twice gives each HCM user exactly one reminder per expiring/expired current certificate and none for Budi's superseded one; a certificate scan path is readable by Operasional and not by Finance

## 2. Certificates

- [x] 2.1 Add `lib/certifications/*`, audit labels/refs, attachment config for `employee_certificate`, navigation items and the `certificates` export; verify `tsc` passes
- [x] 2.2 Add `/hr/certificates` (list, toolbar, export); verify as HCM: Bermasalah shows only expiring/expired soonest first, search by name and certificate number, export matches; as Operasional read-only; as Finance "Akses ditolak"
- [x] 2.3 Add the Sertifikat tab on the employee page (required-certificate card, Layak Tugas, table, dialog, scan upload, delete, Riwayat); verify as HCM: TKBT Tingkat 2 issued 1 Okt 2026 suggests expiry 1 Okt 2031, lifetime shows "Seumur hidup", expiry before issue refused, Budi's old certificate shows Diperbarui, Andi (Driver) shows SIM B1 Belum ada and Belum Layak Tugas, Lukman shows Layak Tugas with an expiring certificate, a PDF scan uploads and opens

## 3. Trainings

- [x] 3.1 Add `lib/trainings/*`, navigation items and the `trainings` / `training-needs` exports; verify `tsc` passes
- [x] 3.2 Add `/hr/trainings` list, new/edit pages with the participant picker, and the detail page with results; verify as HCM: create "Pelatihan TKBT Tingkat 2" (Eksternal, 3–5 Nov 2026) with Slamet and Agus, marking Slamet Lulus gives him a TKBT Tingkat 2 certificate issued 5 Nov 2026 expiring 5 Nov 2031, changing to Tidak Lulus removes it, a training without certificate type creates none, filter Eksternal + date range and export match; as Direktur read-only
- [x] 3.3 Add `/hr/training-needs`; verify as HCM: groups per type with Slamet and Andi, selecting Slamet → "Buat pelatihan" opens the new form with TKBT Tingkat 2 and Slamet prefilled

## 4. Reminders and integration

- [x] 4.1 Run `run_daily_checks()` locally and verify as HCM that the bell shows "Sertifikat segera kedaluwarsa" / "Sertifikat kedaluwarsa" with links to the filtered list, and that a second run adds none
- [x] 4.2 Run `pnpm lint` and `pnpm build`; confirm no server or console errors on the new pages; check the certificate list and training needs at 375 px

## Workflow follow-up

- Archive the change with `/opsx:archive` after verification.

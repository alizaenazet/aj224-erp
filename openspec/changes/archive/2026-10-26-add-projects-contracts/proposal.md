# Proposal: add-projects-contracts

## Why

Projects are the centre of the ERP: progress, crews, tools, materials, costs, invoices and incidents all hang off a project (PRD §9). Today contracts, addenda, payment terms and budgets live in separate Excel files, and the contract value used in reports is unclear after addenda. This change creates the project record, its contract with addendum history, the payment-term schedule, the budget per cost category, project documents and the project page with its tabs, and turns a won tender into a project without retyping.

## What Changes

- **Daftar proyek (PRJ-01, Wajib):**
  - Columns: code, name, client, status (Persiapan, Berjalan, Tertunda, Selesai, Ditutup) and contract value.
  - Filters: status and client.
  - The progress column arrives with `add-sections-progress`.
- **Proyek & lokasi (MST-04):**
  - Every project gets an automatic code (document number `project`).
  - It also gets exactly one project location, created by the system.
- **Data kontrak (PRJ-02, Wajib):**
  - Fields: contract/SPK number, date, contract value before PPN, PPN yes/no, start and target finish dates, maintenance period, scope and contract documents.
  - Addenda record number, date, new value and schedule change.
  - Reports use the value after the latest addendum, and the history is kept.
- **Jadwal termin (PRJ-03, Wajib):**
  - Terms are Uang Muka, Termin 1…n and Retensi, each as a percentage or an amount.
  - Each term has a condition: progress ≥ X%, a date, or manual.
  - Statuses run Belum Waktunya → Siap Ditagih → Ditagih → Lunas.
  - A warning shows when the terms do not total 100% of the contract value.
  - Finance or Operasional can mark a term Siap Ditagih by hand, and Finance is notified.
  - Automatic Siap Ditagih (progress and date) comes with `add-sections-progress`. Ditagih and Lunas come from invoices in `add-receivables`.
- **RAB per kategori (PRJ-04, Wajib):**
  - Budget per cost category (MST-05).
  - The RAB & Biaya tab shows Anggaran, Realisasi, Sisa and % Terpakai, yellow at ≥ 80% and red above 100%.
  - Realisasi reads a shared cost view that the finance changes fill.
- **Ringkasan (PRJ-09, Wajib, first part):** contract value after addenda, term schedule status, total RAB and planned profit (§11.3 Laba Rencana). Later changes add progress, billing, costs, team, tools, incidents and issues.
- **Dokumen proyek (PRJ-10, Wajib):** documents per type (kontrak, addendum, BAP, BAST, gambar, izin, korespondensi, lainnya).
- **Konversi tender (MKT-09, Wajib):**
  - "Buat Proyek" on a won tender opens a project form prefilled from the tender.
  - One tender makes at most one project, and both pages link to each other.
- **Menu:** Proyek → Daftar Proyek. The project page has tabs Ringkasan, Kontrak & Termin, RAB & Biaya and Dokumen; later changes add their tabs.

## Capabilities

### New Capabilities
- `projects/projects`: Project records, codes, status, project location, list, project page and documents.
- `projects/contracts`: Contract data, addenda and the payment-term schedule.
- `projects/budget`: Budget per cost category with realization.

### Modified Capabilities
- `marketing/tenders`: Adds converting a won tender into a project (MKT-09).

## Impact

- **Database:**
  - Tables `projects`, `project_contracts`, `project_addenda`, `project_terms` and `project_budgets`.
  - Views `project_overview` (current contract value and finish date) and `project_category_costs` (realization, empty until the finance changes).
  - Function `set_project_status`, function `mark_term_ready` with a Finance notification, and a location-creation trigger.
  - Attachment record type `project` with bucket `project-files`.
  - RLS, audit and seed data.
- **App:**
  - `/projects` (list), `/projects/new`, and `/projects/[id]` with tab routes `/projects/[id]/contract`, `/budget` and `/documents`.
  - Edit page; "Buat Proyek" on the tender page.
  - Export `projects`.
- **Dependencies:** none.

## Out of scope

- Sections and progress, the progress column and automatic Siap Ditagih (`add-sections-progress`).
- Invoices and payments that set Ditagih/Lunas (`add-receivables`).
- Cost realization sources (`add-payables-expenses`, `add-payroll`).
- Health status and the closing checklist (`add-project-pl`): status Ditutup is not offered until then.
- Lapangan access, which follows assignments in `add-assignments-attendance`.

# Proposal: add-clients-tenders

## Why

Marketing tracks clients and tenders in scattered spreadsheets: offer revisions get lost, bid deadlines are missed, and nobody knows the real win rate or which tenders deserve attention first (PRD §3, §4). Tender data is also the start of every project. This change gives Marketing one client book, a tender pipeline with revision history and reminders, a priority list by weighted value, and analytics computed per §11.1.

## What Changes

- **Data klien (MKT-01, Wajib):**
  - Fields: company name, type (Kontraktor EPC, BUMN, PLN, Swasta), address, NPWP, default payment term, notes, and several contacts (name, position, phone, email).
  - The client page shows tender history, tender value won and the client's win rate.
- **Log aktivitas & tindak lanjut (MKT-02, Sebaiknya):**
  - Visits, calls and meetings per client (optionally per tender), each with an optional follow-up date.
  - A Tindak Lanjut list shows due follow-ups. The owner gets a notification on the due date.
- **Data tender (MKT-03, Wajib):**
  - Fields: package name, client, end owner, location, voltage (150/275/500 kV), length (kms), tower count, scope, info date, bid deadline, bid value, cost estimate (HPP), PIC, documents (RKS, BoQ, surat penawaran) and notes.
  - Planned margin and weighted value are computed (§11.1).
- **Status tender (MKT-04, Wajib):**
  - Statuses: Prospek → Persiapan Penawaran → Penawaran Dikirim → Negosiasi → Menang / Kalah / Batal (Tidak Ikut), with a closing date.
  - Kalah requires a reason (Harga, Teknis, Jadwal, Relasi, Administrasi, Lainnya). The winner and the winning price are optional.
- **Riwayat revisi penawaran (MKT-05, Wajib):** every change of the bid value is stored automatically with date, old → new value, note and user.
- **Pengingat batas penawaran (MKT-06, Wajib):** the daily check notifies Marketing at H-3 and H-1 for tenders in Prospek or Persiapan Penawaran.
- **Peluang & prioritas (MKT-07, Wajib):**
  - Marketing enters the win chance (%).
  - Active tenders are sorted by weighted value, with the client's historical win rate shown as reference.
  - Tenders with a bid deadline within 7 days are labelled "Mendesak".
- **Analitik tender (MKT-08, Wajib):** win rate by count and by value per period, per client and per voltage; lost-reason recap; pipeline value per status.
- **Menu:** Marketing → Klien, Tender, Analitik Tender.

## Capabilities

### New Capabilities
- `marketing/clients`: Clients, contacts, activity log and follow-ups.
- `marketing/tenders`: Tender data, status flow, bid revision history, documents, deadline reminders and the priority list.
- `marketing/tender-analytics`: Win rates, lost reasons and pipeline per §11.1.

### Modified Capabilities
None. Tender documents use the attachment service with a new record type. Follow-up and deadline reminders use the existing notifications and daily checks.

## Impact

- **Database:**
  - Tables `clients`, `client_contacts`, `client_activities`, `tenders` (generated planned margin and weighted value), `tender_bid_revisions`.
  - View `client_tender_stats`; functions `tender_win_stats`, `tender_lost_reasons`, `tender_pipeline`, `list_people`.
  - Daily checks `check_tender_deadlines` and `check_client_followups`.
  - Attachment record type `tender` with bucket `marketing-files`.
  - RLS; audit on clients and tenders.
  - Dev seed clients, contacts, activities and tenders.
- **App:**
  - `/marketing/clients` (list, new, detail with tabs, edit) and `/marketing/follow-ups`.
  - `/marketing/tenders` (priority list, new, detail, edit, status dialog).
  - `/marketing/tender-analytics`.
  - Exports `clients`, `tenders`, `follow-ups`.
- **Dependencies:** none new.

## Out of scope

- "Buat Proyek" from a won tender (MKT-09), the client's projects and total contract value: `add-projects-contracts`. Until then the client page shows the tender value won.
- The Marketing home "Perlu Tindakan" list (DSB-04): `add-dashboards`. Until then, due follow-ups are reached through the notification and the Tindak Lanjut list.
- Client and tender-history import: `add-data-import`.

## Open questions (PRD §19)

None block this change. Voltage options follow MKT-03 (150, 275, 500 kV).

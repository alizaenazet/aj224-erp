# Proposal: add-equipment-mobilization

## Why

Pullers, tensioners, pulleys and other stringing tools move between the warehouse and many sites, and nobody knows at a glance where each one is, in what condition, or how long rented tools have been on site. Shortfalls on arrival are found weeks later. This change records tools with their stock per location and condition, moves them with printable delivery notes (surat jalan) that the receiving site confirms, records condition changes with history, and lists active rented tools for checking vendor invoices.

## What Changes

- **Data alat (ALT-01, Wajib):**
  - Fields: code, name, category (Mesin Utama, Alat Bantu, Alat Ukur, Kendaraan, APD) and photo.
  - Tracking is either Per Unit (serial number, always quantity 1) or Per Jumlah.
  - Ownership is Milik Sendiri or Sewa (supplier and rental rate per day or month).
  - The opening stock is entered when the tool is created; tools can be imported from Excel.
- **Stok per lokasi & kondisi (ALT-02, Wajib):**
  - Quantity per location (warehouse or project) per condition: Baik, Rusak, Dalam Perbaikan, Hilang.
  - Total = all locations and conditions plus quantities in transit.
- **Surat jalan (ALT-03, Wajib):**
  - Fields: origin → destination, date, vehicle, driver, and lines of tool, condition and quantity.
  - Statuses run Dikirim → Diterima; origin stock drops when sent, destination stock grows when received.
  - Numbered `SJ/…`, printable, and cancellable with a reason before receipt (stock returns).
  - Transport cost is recorded later through bills/expenses referring to the note number.
- **Konfirmasi penerimaan (ALT-04, Wajib):**
  - The receiver (Lapangan at the destination project, or Operasional) confirms per line the quantity received in good and damaged condition.
  - Any shortfall needs a note and a photo, is recorded as Rusak/Hilang at the destination, and notifies Operasional.
- **Perubahan kondisi (ALT-05, Wajib):**
  - Report tools broken, lost or repaired at a location, with a note and an optional photo.
  - Every change is kept as history. Operasional can also adjust stock with a reason.
- **Riwayat alat (ALT-06, Wajib):** movements and condition history per tool; for Per Unit tools, the stay at each project in days.
- **Alat sewa aktif (ALT-07, Sebaiknya):** rented tools currently on projects, with project, start date, rate and estimated running rental cost.
- **Screens:**
  - Operasional → Alat and Surat Jalan, plus a project tab Alat.
  - Lapangan home: a "Terima Alat" button with pending incoming notes.
  - Lapangan is notified when a note is sent to their project.

## Capabilities

### New Capabilities
- `equipment/tools`: Tools, stock per location and condition, condition changes, adjustments, history and active rentals.
- `equipment/delivery-notes`: Delivery notes with sending, receipt confirmation, shortfalls, cancellation and printing. Materials reuse it in `add-material-stock`.

### Modified Capabilities
- `dashboard/home`: The Lapangan home shows incoming notes to receive.
- `platform/data-import`: Adds the Alat template for Operasional.

## Impact

- **Database:**
  - Tables `tools`, `tool_stock`, `tool_movements`, `delivery_notes` and `delivery_note_tool_lines`.
  - Functions `create_tool`, `send_delivery_note`, `receive_delivery_note`, `cancel_delivery_note`, `change_tool_condition`, `adjust_tool_stock`, `user_location_ids` and `notify_project_field`.
  - Views `tool_overview`, `tool_stays` and `active_rentals`.
  - Attachment types `tool` and `delivery_note`.
  - RLS, audit and seed.
- **App:**
  - `/operations/tools` (list, new, detail, rentals) and `/operations/delivery-notes` (list, new, detail with receipt).
  - `/projects/[id]/equipment`, `/print/delivery-notes/[id]`.
  - Exports `tools` and `delivery-notes`; import template `tools`; menu Operasional → Alat, Surat Jalan.
- **Dependencies:** none.

## Out of scope

- Transport and rental costs (`add-payables-expenses`), which refer to the note number.
- Material lines on delivery notes (`add-material-stock`).
- Maintenance schedules and tool depreciation (not in PRD v1).

## Open questions

- Format of the delivery note used today (PRD §19 Q6): the print layout follows the PRD fields until a sample arrives.

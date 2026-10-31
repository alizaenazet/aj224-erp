# Design: add-equipment-mobilization

## Context

- **Master data:**
  - Locations exist (`locations`: warehouse/project; each project has its own location through `projects.location_id`).
  - Item categories of kind `tool`, suppliers (category `equipment_rental`), and the document type `delivery_note` (`SJ/AJ224/{YYYY}/{MM}/{SEQ:3}`).
- **Lapangan scoping:** `user_project_ids()`.
- **Notifications:** `notify_roles` / `notify_user`.
- **Shared infrastructure:** attachments with dispatcher functions, the print layout, and the import engine.

## Goals / Non-Goals

**Goals**
- One stock table per tool, location and condition, changed only by definer functions that also write a movement row. The movement ledger gives the history, stays and rentals.
- A delivery note model that materials can reuse with their own line table in change 14.

**Non-Goals**
- Costs of transport or rental (finance changes) and maintenance plans.

## Decisions

### Tables (migration `…_equipment_mobilization.sql`)
| Table | Columns | Rules |
|---|---|---|
| `tools` | code (unique, case-insensitive), name, category_id → item_categories (kind `tool`), tracking (`unit` / `quantity`), serial_no (required for `unit`, unique when set), ownership (`owned` / `rented`), supplier_id → suppliers, rental_rate ≥ 0, rental_period (`day` / `month`), notes, is_active, timestamps | Check: rented ⇒ supplier, rate and period. A trigger checks the category kind. Insert only via `create_tool`. Update: Operasional on descriptive columns (not tracking). Audit. |
| `tool_stock` | (tool_id, location_id, condition) PK, quantity int > 0 | Condition `good` / `damaged` / `repair` / `lost`. Zero rows are deleted. No client writes. |
| `tool_movements` | id identity, tool_id, kind (`opening`, `send`, `receive`, `shortfall`, `condition`, `adjust`, `cancel`), from/to location, from/to condition, quantity > 0, delivery_note_id, note, created_by, created_at clock_timestamp | The ledger. No client writes. |
| `delivery_notes` | number (unique), from_location_id, to_location_id (≠ from), note_date, vehicle, driver, notes, status (`sent` / `received` / `cancelled`), sent_by/at, received_by/at, receipt_note, cancelled_at, cancel_reason, timestamps | No client writes. Audit; cancelling is an audit `cancel` through `cancelled_at`/`cancel_reason`. |
| `delivery_note_tool_lines` | note_id (cascade), tool_id, condition (as sent), quantity > 0, received_good, received_damaged, missing, receipt_note, sort_order | received_good + received_damaged + missing = quantity once received. |

### Functions (security definer, role checks inside)
- **`tool_stock_change(tool, location, condition, delta)`** (internal): upserts a quantity; refuses below zero with "Stok <code> di <lokasi> (<kondisi>) tidak cukup: tersedia N"; deletes zero rows.
- **`create_tool(p_tool jsonb, p_location, p_condition, p_quantity) returns uuid`** (Operasional): a Per Unit tool takes exactly 1. Writes the opening movement.
- **`send_delivery_note(p_note jsonb, p_lines jsonb) returns uuid`** (Operasional):
  - Checks: locations are different and active; each tool is active; conditions are good, damaged or repair; quantity > 0.
  - Lines with the same tool and condition are merged.
  - Takes the number from `next_document_number('delivery_note', note_date)` and deducts origin stock, writing `send` movements.
  - If the destination is a project location, calls `notify_project_field(project, …)`.
- **`receive_delivery_note(p_note, p_lines jsonb, p_receipt_note) returns void`** (Operasional, or Lapangan for a destination in `user_location_ids()`):
  - The note must be `sent`, with good + damaged ≤ quantity per line.
  - A line with damage or shortfall needs a note. Any discrepancy needs ≥ 1 `receipt` photo on the note.
  - Adds good / damaged / lost (missing) stock at the destination, writing `receive` / `shortfall` movements.
  - Sets the note `received` and, on a discrepancy, calls `notify_roles(operations, 'Selisih penerimaan surat jalan')`.
- **`cancel_delivery_note(p_note, p_reason)`** (Operasional): the note must be `sent`; the reason is required. Returns stock to the origin in the sent condition (`cancel` movements) and sets status `cancelled`.
- **`change_tool_condition(p_tool, p_location, p_from, p_to, p_quantity, p_note)`** (Operasional anywhere, or Lapangan at `user_location_ids()`): the note is required; writes a `condition` movement.
- **`adjust_tool_stock(p_tool, p_location, p_condition, p_delta, p_reason)`** (Operasional): the reason is required. A Per Unit tool total stays ≤ 1. Writes an `adjust` movement and an `audit_log` entry (table `tools`, action `update`, reason).
- **`user_location_ids()`**: locations of `user_project_ids()`.
- **`notify_project_field(p_project, p_category, p_title, p_body, p_link, p_dedupe)`**: notifies active Lapangan profiles linked to employees with an active assignment on the project.

### Views (security invoker)
- **`tool_overview`:**
  - Tool columns plus category and supplier names.
  - Quantities `good`, `damaged`, `repair`, `lost`, and `in_transit` (lines of `sent` notes).
  - `total` = stock + in transit.
- **`tool_stays`:** for Per Unit tools, each arrival (`opening`, `receive`, or `cancel` back to the origin) at a location, with the next `send` from that location as its end. Gives `start_at`, `end_at` (null = still there) and `days` = end date (or today) − start date.
- **`active_rentals`:** rented tools with stock at project locations.
  - Columns: project, quantity (excluding Hilang), `since` = latest arrival there, days and the rate.
  - `estimated_cost` = rate × quantity × days (daily), or × ceil(days ÷ 30) (monthly).

### RLS (PRD §13: Alat & surat jalan L L — L — K K(P: terima, lapor kondisi))
| Table | Read | Write |
|---|---|---|
| `tools` | SA, Dir, Fin, Ops; Lapangan for tools in stock, movements or notes at their locations | Ops update (column grants); insert via function |
| `tool_stock`, `tool_movements` | SA, Dir, Fin, Ops; Lapangan where the location (from/to) ∈ `user_location_ids()` | none |
| `delivery_notes`, `delivery_note_tool_lines` | SA, Dir, Fin, Ops; Lapangan where from/to ∈ `user_location_ids()` | none |

- **Attachments** (bucket `project-files`):
  - `tool`: categories `photo` (single) and `condition`.
    - Read follows tool visibility.
    - Write: `photo` for Operasional; `condition` for Operasional and Lapangan.
  - `delivery_note`: category `receipt`.
    - Read follows note visibility.
    - Write: Operasional, or Lapangan for a destination they can see while the note is `sent`.

### App structure
- **Libraries:** `lib/equipment/{labels,schema,queries,actions}.ts`.
  - Labels: conditions (Baik `success`, Rusak `destructive`, Dalam Perbaikan `warning`, Hilang `outline`), tracking, ownership, note statuses (Dikirim `secondary`, Diterima `success`, Batal `outline`).
  - Roles: `EQUIPMENT_VIEW_ROLES`, `EQUIPMENT_MANAGE_ROLES`.
- **Operasional → Alat (`/operations/tools`):**
  - DataTable over `tool_overview` with search, Kategori / Kepemilikan / Lokasi filters and export `tools`.
  - "Tambah Alat" page with the opening stock, and a "Sewa aktif" link.
- **Tool page (`/operations/tools/[id]`):**
  - Info Card with a photo (AttachmentList single) and an edit Dialog.
  - Stock Table per location and condition with the row action "Ubah kondisi" (Dialog), and a "Penyesuaian stok" button (Dialog with location and condition, so stock can also be added at a new location).
  - History Table, and a stays Table for Per Unit tools.
- **Rentals (`/operations/tools/rentals`):** Table and total.
- **Operasional → Surat Jalan (`/operations/delivery-notes`):** DataTable with Status/Lokasi filters and export `delivery-notes`. Lapangan sees theirs, filtered by RLS.
- **New note (`/operations/delivery-notes/new`):**
  - Origin and destination Selects, DatePicker, vehicle, driver and notes.
  - Lines: a tool Combobox limited to tools with stock at the origin, a condition Select with the available quantity shown, and a quantity input.
- **Note page (`/operations/delivery-notes/[id]`):**
  - Header and lines.
  - While Dikirim, the receiver sees the receipt form: per line Baik/Rusak inputs, the computed missing count and a line note; a receipt note; photos (AttachmentList `receipt`); and Konfirmasi.
  - Operasional also gets Batalkan (Dialog with reason). Everyone gets Cetak.
- **Print (`/print/delivery-notes/[id]`):** letterhead, details, lines Table and three signature boxes.
- **Project tab Alat (`/projects/[id]/equipment`):** stock at the project location with "Ubah kondisi"; notes to and from the location.
- **Lapangan:** home line "n surat jalan menunggu diterima" with a "Terima Alat" button; sidebar item Surat Jalan.
- **Import:** template `tools` (Operasional) with Kode*, Nama*, Kategori*, Pelacakan*, No. Seri, Kepemilikan*, Supplier, Tarif Sewa, Periode Sewa, Lokasi*, Kondisi*, Jumlah*. Rows go through `create_tool`.

### shadcn components
Existing: Card, Table, Badge, Button, Dialog, AlertDialog, Select, Field, Input, InputGroup, Textarea, Alert, Empty, DropdownMenu, Combobox composition, DatePicker. No new primitives.

### Seed (dev)
- **Supplier:** rental supplier "CV Sarana Stringing" (`equipment_rental`).
- **Tools:**
  - Per Unit: puller PL-01 and tensioner TN-01 (rented, Rp 750.000/day).
  - Per Jumlah: pulley PUL-150, come-along CA-03, running board RB-01; plus a genset.
  - Opening stock at Gudang Lamongan.
- **Delivery notes:**
  - Received at PRJ/AJ224/2026/001 about 40 days ago: PL-01, TN-01 and 30 pulleys.
  - Dikirim to it yesterday, waiting for Lukman: 10 more pulleys and 2 come-alongs.
- **Condition change:** 2 pulleys Rusak at the project.

## Risks / Trade-offs
- **Lost on arrival is recorded at the destination:** this keeps the stock where the shortfall was found, and Operasional can investigate or adjust.
- **Movement times are server times:** stays count calendar days in WIB.
- **Lapangan sees the rental rate of rented tools at their site:** the rate is not part of the pay data rules, and the rentals list itself is office-only.

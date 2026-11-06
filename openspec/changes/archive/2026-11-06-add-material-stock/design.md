# Design: add-material-stock

## Context
Tools (change 13) already have stock per location, a movement ledger and surat jalan with receipt confirmation, all written through `security definer` RPCs that lock the stock row. Materials follow the same shape with three differences: quantities are decimals (m, kg, liter), there is no condition, and titipan material needs a per-project reconciliation. `locations` has one row per project (MST-04) and `user_location_ids()` already scopes Lapangan.

## Goals / Non-Goals
**Goals:** one stock-changing path (`material_post`), surat jalan reused instead of a second transfer document, reconciliation computed from source rows so cancellations drop out naturally.

**Non-Goals:** valuation, purchase orders, material lines on the daily report, per-line seksi.

## Decisions
- **Tables**
  | Table | Key columns |
  |---|---|
  | `materials` | code (unique lower), name, `unit_code` → units, `category_id` → item_categories (kind material, trigger), ownership `company`/`client`, `min_stock` numeric(14,3) null, notes, is_active; audited |
  | `material_stock` | (material_id, location_id) PK, quantity numeric(14,3) ≥ 0. Rows are kept at 0 so "kept at this location" survives for the minimum check |
  | `material_transactions` | kind `opening`/`receipt`/`usage`/`return`/`opname`, location_id, txn_date, source `supplier`/`client` (receipt), supplier_id, doc_no, section_id (usage), notes, status `active`/`cancelled`, cancel_reason, created_by; audited |
  | `material_transaction_lines` | transaction_id, material_id, quantity (> 0; for opname the counted qty ≥ 0), system_quantity (opname only) |
  | `material_movements` | ledger: material_id, location_id, kind, quantity (> 0), delta (stock change), transaction_id / delivery_note_id, note, created_by, created_at |
  | `delivery_note_material_lines` | note_id, material_id, quantity, received_quantity, missing, receipt_note |
- **Functions** (all `security definer`, role checks inside, `search_path = ''`):
  - `material_post(material, location, delta, kind, quantity, txn, note_id, note)`: internal; locks the stock row, refuses negative results with the material code, location name and available quantity, writes the ledger.
  - `create_material(p_material jsonb, p_location uuid, p_quantity numeric)`: Operasional; optional opening stock as an `opening` transaction (used by the form and the import).
  - `record_material_transaction(p_txn jsonb, p_lines jsonb)`: receipt (Operasional anywhere; Lapangan at `user_location_ids()`), usage (project locations only; section must belong to that project), return (Operasional, titipan only, project locations). Lapangan dates are limited to `backdate_days()`; no future dates. Lines with the same material are merged.
  - `record_stock_opname(p_location, p_date, p_reason, p_lines)`: Operasional; system quantity read under lock, differences posted, one audit_log row listing differences.
  - `cancel_material_transaction(p_txn, p_reason)`: Operasional; receipt/usage/return/opening; posts reversing movements (kind `cancel`).
  - `send_delivery_note`, `receive_delivery_note` gain `p_material_lines jsonb default '[]'` (old signatures dropped); `cancel_delivery_note` also restores material lines. At least one tool or material line.
  - `check_material_min_stock()`: registered in `scheduled_checks` (sort 60), reads view `material_low_stock`, notifies Operasional with dedupe `material-min:<material>:<location>:<date>`.
- **Views** (`security_invoker`): `material_overview` (totals + low-stock count), `material_low_stock` (company materials below minimum at active warehouses and projects not Selesai/Ditutup), `material_reconciliation` (per project × titipan material from transactions, delivery note lines, opname lines and stock; excludes cancelled rows). Formula: on hand = received(+opening) + in − out − used − returned − shrinkage, where in counts the sent quantity of received notes and shrinkage = shortfalls + net negative opname.
- **RLS:** office readers (SA, Direktur, Finance, Operasional) read all; Lapangan reads materials (master list) and rows whose location is in `user_location_ids()`; lines follow their parent. No direct insert/delete; Operasional may update `materials` (name, category, ownership, min_stock, notes, is_active) through column grants. HCM and Marketing get nothing.
- **Attachments:** entity `material_transaction`, category `document`, bucket `project-files`; write by Operasional or by Lapangan on an active transaction at their location.
- **UI (shadcn):** Data Table + toolbar filters for lists; Card + Table for stock per location and ledger; Combobox for material and section; DatePicker; AlertDialog for cancel; Dialog not needed (edit is its own page, like tools). Field screens use Button size lg.
- **Single cost source:** not affected; no money is recorded here.

## Risks / Trade-offs
- [Changing the surat jalan RPC signatures] → old two-argument functions are dropped in the same migration and types regenerated, so no stale overload remains.
- [Unit change after movements would rescale history] → `unit_code` and `code` are not updatable.
- [Opname races with usage] → both lock the same stock row; the opname reads the system quantity inside the lock.

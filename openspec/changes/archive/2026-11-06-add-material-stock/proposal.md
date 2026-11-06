# Proposal: add-material-stock

## Why
Material is the last Stage 2 module and the second half of the Operasional menu (PRD §9). Without it, stock of consumables and client-supplied material (titipan klien) is invisible, the project close checklist (PRJ-11) cannot check material reconciliation, and the field team has no "Terima/Pakai Material" action.

## What Changes
- **Material data (MAT-01, Wajib):** code, name, unit, category, ownership (Milik Perusahaan / Titipan Klien), minimum stock for consumables. Quantities only, no value (A3).
- **Stock per location** (material × location), changed only through recorded transactions, never below zero.
- **Receipt (MAT-02, Wajib):** into a location from a supplier (nota no.) or from the client (surat jalan/BA no.), with document photos. Lapangan may receive at their project.
- **Usage (MAT-03, Wajib):** at a project location with date, optional seksi and notes; quantity limited to available stock. Lapangan may record usage at their project.
- **Return to client:** titipan material handed back from a project (needed for MAT-06).
- **Transfer (MAT-04, Wajib):** the existing surat jalan carries material lines next to tool lines: Dikirim takes stock from the origin, Diterima adds what arrived, and a shortfall needs a note and photo and notifies Operasional.
- **Stock opname (MAT-05, Wajib):** counted quantities per location with a reason; differences are posted and audited.
- **Titipan reconciliation (MAT-06, Wajib):** per project and client material: received from client, transferred in/out, used, returned, shrinkage and on hand; Excel export for the berita acara.
- **Minimum stock (MAT-07, Sebaiknya):** a daily check notifies Operasional when a company material is below its minimum at a location.
- **Cancel (UMM-11):** receipt, usage and return can be cancelled with a reason; stock is reversed.
- **Screens:** Operasional → Material & Stok and Transaksi Material; project tab Material; Lapangan menu and home buttons Terima Material / Pakai Material.
- **Import (UMM-13):** material list with optional opening stock per location. Exports for materials, transactions and reconciliation (UMM-04).

## Capabilities

### New Capabilities
- `materials/stock`: material master, stock per location, receipt, usage, return, opname, cancellation, minimum stock and access.
- `materials/reconciliation`: titipan reconciliation per project.

### Modified Capabilities
- `equipment/delivery-notes`: a surat jalan may carry material lines (send, receive with shortfall, cancel, print).
- `dashboard/home`: Lapangan home gains Terima Material and Pakai Material.

## Impact
- New migration `<ts>_material_stock.sql`: tables `materials`, `material_stock`, `material_transactions`, `material_transaction_lines`, `material_movements`, `delivery_note_material_lines`; functions for transactions, opname, cancel and minimum check; delivery note functions extended; views; RLS; attachment type `material_transaction`.
- New `lib/materials/*`, `components/materials/*`, pages under `app/(app)/operations/materials`, `app/(app)/operations/material-transactions`, project tab `material`.
- Edited: surat jalan form, receipt, detail and print; `lib/navigation.ts`; field home; export and import registries.
- Out of scope (PRD §7.2): stock valuation (FIFO/average), purchase orders. Material cost is recorded by Finance (change D).
- PRD §19 Q3 (are main materials always client-supplied?): no dependency; ownership is chosen per material.

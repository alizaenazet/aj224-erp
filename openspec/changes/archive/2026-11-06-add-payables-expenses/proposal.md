# Proposal: add-payables-expenses

## Why
Project costs live in scattered Excel files, supplier due dates are missed and field cash is not accounted for (PRD §3.2 Keuangan). Without cost records the RAB tab shows no realisation and the P/L (change E) cannot be computed.

## What Changes
- **Supplier bills (FIN-06, Wajib):** supplier, nota/faktur number, date, due date (default from the supplier's payment term), optional PPN, attachments, optional surat jalan reference (ALT-03 transport costs); lines with description, amount, **project or Kantor/Umum and cost category per line**, so one bill can be split.
- **Supplier payments (FIN-07, Wajib):** partial or full, date, source account, method, proof; Belum Dibayar → Dibayar Sebagian → Lunas.
- **Payables (FIN-08, Wajib):** list by due group (terlambat, minggu ini, minggu depan) with aging; Finance notified H-3.
- **Direct expenses (FIN-09, Wajib):** date, project or Kantor/Umum, category, amount, payee, method, receipt photo; "Tanpa Nota" requires a note.
- **Field cash (FIN-10, Wajib):** Finance records top-ups to a project's PIC and returns; the PIC (Lapangan) records spending with a receipt photo as Biaya Proyek, Kasbon Karyawan or Pembayaran Gaji; Finance approves or rejects with a reason; the balance (§11.3) is always visible to the PIC and Finance. Only approved Biaya Proyek becomes project cost; approved Kasbon Karyawan becomes a kasbon. The field form keeps a local draft (UMM-12).
- **Office overhead (FIN-13, Wajib):** bill lines and expenses on Kantor/Umum are company costs outside project P/L.
- **Kasbon ledger (PAY-05 base, Wajib):** kasbon per employee with date, amount, installment and description, recorded by HCM/Finance or created from field cash; balance shown. Payroll (change F) deducts installments.
- **Single cost source (§11.3):** one view combines bill lines, direct expenses and approved field-cash project costs; the RAB tab realisation (PRJ-04, FIN-11 base) reads it.
- **Opening balances (UMM-13):** open supplier bills, project cost to date per category, open kasbon.
- **Screens:** Keuangan → Tagihan Supplier & Utang, Pengeluaran, Kas Lapangan; SDM → Kasbon; Lapangan menu and home button Catat Pengeluaran.

## Capabilities

### New Capabilities
- `finance/payables`: supplier bills, payments, payables list, aging, reminder, opening bills.
- `finance/expenses`: direct expenses, office overhead, cost opening balances, the combined cost view.
- `finance/field-cash`: top-ups, spending, verification, returns, balance.
- `payroll/kasbon`: kasbon records and balance.

### Modified Capabilities
- `projects/budget`: realisation comes from the combined cost view.
- `dashboard/home`: Lapangan home shows the field cash balance and Catat Pengeluaran.

## Impact
- Migration `<ts>_payables_expenses.sql`: `supplier_bills`, `supplier_bill_lines`, `supplier_payments`, `expenses`, `field_cash_movements`, `field_cash_expenses`, `kasbons`; RPCs; views `cost_entries`, `project_category_costs` (replaced), `supplier_bill_list`, `payable_aging`, `field_cash_balances`, `kasbon_balances`; daily check; attachments; RLS; audit; `is_pay_table` extended with `kasbons`.
- New `lib/{bills,expenses,field-cash,kasbon}/*`, components and pages under `app/(app)/finance/{bills,expenses,field-cash}` and `app/(app)/hr/kasbon`; shared `lib/local-draft.ts`.
- PRD §19 Q5 (approval limits): no approval chain (PRD §7.2); Finance records and verifies.

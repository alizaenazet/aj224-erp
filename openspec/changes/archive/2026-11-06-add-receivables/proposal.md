# Proposal: add-receivables

## Why
Termin that reach "Siap Ditagih" cannot be billed in the system, so Ditagih/Lunas never happen, receivables and their due dates are invisible, and the project P/L (change E) has no recognised revenue (PRD §3.2 Keuangan, goal 2).

## What Changes
- **Invoice from a termin (FIN-01, Wajib):** from a Siap Ditagih termin: gross (termin value), manual deductions (down-payment return, retention, other), DPP, PPN (only when the company is PKP and the contract is subject to PPN, at the PPN rate parameter), total; invoice date; due date defaulting to the client's payment term; BAP attachment. Status Draft → Terbit → Dibayar Sebagian → Lunas, or Batal. Numbered on issue (`INV/AJ224/YYYY/MM/NNN`). A4 print with letterhead, bank account and amount in words (terbilang).
- **Other invoices (FIN-02, Wajib):** non-termin invoices (e.g. extra work) still tied to a project.
- **Incoming payments (FIN-03, Wajib):** date, amount received, PPh withheld + slip number, company bank account, transfer proof; partial payments; Lunas when received + PPh = total. Payments can be cancelled with a reason.
- **Receivables list (FIN-04, Wajib):** unpaid invoices with balance, due date, days overdue (red when overdue); daily notification to Finance at H-7 and once when overdue.
- **Aging (FIN-05, Wajib):** per client and project in buckets Belum Jatuh Tempo · 1–30 · 31–60 · 61–90 · > 90 (PRD §11.4).
- **Termin status (PRJ-03):** issuing sets the termin to Ditagih, full payment to Lunas, cancelling returns it to Siap Ditagih.
- **Opening balances (UMM-13):** import open (or historical) invoices with what was already received.
- **Screens:** Keuangan → Invoice & Piutang (list, aging), invoice page, Buat Invoice on ready termin in Kontrak & Termin.

## Capabilities

### New Capabilities
- `finance/receivables`: invoices, payments, receivables list, aging, reminders, print, import and access.

### Modified Capabilities
- `projects/contracts`: termin Ditagih/Lunas driven by invoices; Buat Invoice from the termin table.

## Impact
- Migration `<ts>_receivables.sql`: `invoices`, `invoice_payments`; functions `save_invoice`, `issue_invoice`, `record_invoice_payment`, `cancel_invoice_payment`, `cancel_invoice`, `import_opening_invoice`, `check_receivables`; views `invoice_list`, `receivable_aging`; bucket `finance-files`; attachments `invoice`, `invoice_payment`; RLS; audit.
- New `lib/finance/receivables/*`, `components/finance/*`, pages `app/(app)/finance/invoices/**`, print `app/(print)/print/invoices/[id]`; `terbilang()` in `lib/format.ts`.
- Operasional keeps "status saja" through the termin status; it gets no invoice access (PRD §13).
- PRD §19 Q1 (PKP status, client PPh): PPN follows `company_profile.is_pkp` and the contract flag; PPh is entered per payment.
- Out of scope (PRD §7.2): e-Faktur, journals.

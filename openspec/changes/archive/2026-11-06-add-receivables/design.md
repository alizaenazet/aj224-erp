# Design: add-receivables

## Context
`project_terms.status` already has `not_due → ready → invoiced → paid`; `term_set_ready` and the date/progress checks move terms to `ready`. `company_profile.is_pkp`, `project_contracts.ppn_applicable`, `system_parameters.ppn_rate`, `clients.payment_term_days` and `company_bank_accounts` exist. Document type `invoice` is seeded.

## Goals / Non-Goals
**Goals:** amounts stored and checked in SQL (no TypeScript arithmetic for money), one internal function that recomputes invoice and termin status after every payment change, views that change E (P/L) and G (dashboard) reuse.

**Non-Goals:** multi-line invoices, e-Faktur, credit notes.

## Decisions
- **Tables**
  | Table | Key columns |
  |---|---|
  | `invoices` | number (unique, null while Draft), project_id, term_id null (unique among non-cancelled), kind `term`/`other`/`opening`, description, invoice_date, due_date, gross_amount, dp_deduction, retention_deduction, other_deduction (+ note), dpp, ppn_rate, ppn_amount, total, status `draft`/`issued`/`partial`/`paid`/`cancelled`, notes, issued_at/by, cancel_reason/at; checks `dpp = gross − deductions ≥ 0`, `total = dpp + ppn_amount`; audited |
  | `invoice_payments` | invoice_id, payment_date, amount_received, pph_amount, pph_slip_no, bank_account_id, notes, is_opening, status `active`/`cancelled`, cancel_reason; audited |
- **PPN:** `save_invoice` sets `ppn_rate` = parameter when `is_pkp and ppn_applicable`, else 0, and `ppn_amount = round(dpp × rate / 100)`. Opening invoices take the imported PPN as is.
- **Functions** (`security definer`, Finance only unless noted): `save_invoice(p_id, p_values)` (Draft create/update), `issue_invoice`, `record_invoice_payment`, `cancel_invoice_payment`, `cancel_invoice`, `import_opening_invoice(p_values)`, internal `invoice_refresh(p_invoice)` (status from active payments; termin `invoiced`/`paid`), `check_receivables()` (daily, sort 70; dedupe `invoice-due7:<id>`, `invoice-overdue:<id>`).
- **Views:** `invoice_list` (balance = total − received − PPh for issued/partial/paid; `days_overdue`; `aging_bucket`), `receivable_aging` (per project/client sums by bucket). Both `security_invoker`.
- **Single cost source:** invoices are revenue, not cost; no cost rows are written.
- **RLS:** read SA, Direktur, Marketing, Finance; no direct writes. Attachments in new bucket `finance-files`: `invoice` (`bap`, `other`), `invoice_payment` (`proof`), write Finance.
- **UI:** Data Table + filters; detail with Cards, payments Table and a Dialog form; `ReasonDialogButton` for cancels; print page with `terbilang()`.

## Risks / Trade-offs
- [Rounding PPN] → rupiah rounding in SQL only; the form shows the server's numbers after save.
- [Editing a termin value after invoicing] → termin edit is already blocked once Ditagih.

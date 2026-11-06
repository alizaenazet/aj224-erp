# Design: add-payables-expenses

## Context
`project_category_costs` is an empty placeholder read by the RAB tab (`lib/projects/queries.ts`). Suppliers carry `payment_term_days`; cost categories, `company_bank_accounts`, `company_profile.is_pkp` and `backdate_days()` exist. Salary-data isolation uses `is_pay_table()` for audit entries.

## Goals / Non-Goals
**Goals:** one cost view (`cost_entries`) that every later report reads; all writes through RPCs; field-cash balance in SQL.

**Non-Goals:** PO/approval chains, cash-book accounting, payroll deductions (change F).

## Decisions
- **Tables:** `supplier_bills` (supplier, bill_no, dates, ppn_amount, subtotal, total, status, delivery_note_id, is_opening), `supplier_bill_lines` (description, amount, project_id null = Kantor/Umum, cost_category_id), `supplier_payments`, `expenses` (project null = Kantor/Umum, category, amount, payee, method, no_receipt + note, delivery_note_id, is_opening, status), `field_cash_movements` (kind topup/return, project, PIC employee, amount, method, account, status), `field_cash_expenses` (project, date, kind project_cost/kasbon/wage_payment, category, employee, installment, amount, description, no_receipt, status pending/approved/rejected/cancelled, verify fields), `kasbons` (employee, date, amount, installment_amount, source manual/field_cash/opening, field_cash_expense_id unique, status).
- **Functions:** `save_supplier_bill(p_id, p_bill, p_lines)`, `record_supplier_payment`, `cancel_supplier_payment`, `cancel_supplier_bill`, `import_opening_bill`, `save_expense`, `cancel_expense`, `record_field_cash_movement`, `cancel_field_cash_movement`, `record_field_cash_expense`, `verify_field_cash_expense(p_id, p_approve, p_reason)` (creates the kasbon), `cancel_field_cash_expense`, `save_kasbon`, `cancel_kasbon`, internal `supplier_bill_refresh`, daily `check_payables` (sort 80).
- **Cost view `cost_entries`** (`security_invoker`): bill lines of non-cancelled, non-opening bills (+ PPN share when not PKP) ∪ non-cancelled expenses ∪ approved field-cash project costs; columns source, source_id, entry_date, project_id, cost_category_id, amount, description. `project_category_costs` becomes its per project × category aggregate (same columns, so the RAB tab is unchanged). Change F adds payroll allocations.
- **Other views:** `supplier_bill_list` (paid, balance, days_overdue, due_group, aging_bucket), `payable_aging`, `field_cash_balances` (per project, §11.3), `field_cash_ledger` (union for the project page), `kasbon_balances` (installments added by change F).
- **RLS:** bills/payments/expenses read SA, Direktur, Finance, Operasional; field cash also Lapangan on `user_project_ids()`; kasbons read Finance, HCM, Direktur only and `is_pay_table` includes `kasbons`. No direct writes.
- **Attachments (bucket `finance-files`):** `supplier_bill` (invoice, other), `supplier_payment` (proof), `expense` (receipt), `field_cash_expense` (receipt; Lapangan while pending), `field_cash_movement` (proof).
- **Single cost source check:** payments, top-ups, returns, kasbon and wage payments never enter `cost_entries`; opening bills are excluded because cost to cut-off is imported once per category as opening expenses.
- **UI:** Data Tables with filters; bill form with line rows (Combobox project incl. "Kantor/Umum", Select category, RupiahInput); Dialogs for payments, top-ups and returns; `ReasonDialogButton` for cancel/reject; mobile spending form with `lib/local-draft.ts`.

## Risks / Trade-offs
- [PPN split for non-PKP rounds per line] → shares are rounded to rupiah; the last line is not adjusted, a difference of a few rupiah is accepted.
- [Lapangan sees kasbon amounts it recorded] → only in its own project ledger; the kasbon list stays salary-restricted.

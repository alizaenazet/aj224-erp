# Design: add-project-pl

## Context
`project_overview` gives contract value (after addenda) and progress/planned progress (0–100); `project_budgets` holds RAB; `cost_entries` (change D) is the single cost source; `invoice_list` (change C) holds DPP and receipts; `field_cash_balances`, `tool_stock`, `material_stock`, `delivery_notes` and `project_terms` give the closing checklist; `system_parameters` holds the health thresholds.

## Goals / Non-Goals
**Goals:** every P/L number in SQL (`project_financials`), reused by the Ringkasan tab, Laporan L/R and the dashboard (G).

**Non-Goals:** accounting statements, accruals, valuation.

## Decisions
- **`project_cost_by_category`** (view): per project × category: budget, actual (from `cost_entries`), remaining, used %, and max(budget, actual) for the final estimate. The RAB tab keeps `project_category_costs`.
- **`project_financials`** (view, `security_invoker`): one row per project with the §11.3 figures, `cost_index`, `schedule_deviation`, `health` (`normal`/`warning`/`critical`), `billed_total` (Σ total of issued invoices), `received_total` (Σ received + PPh), `cash_in`, `cash_out`, `cash_position`, `field_cash_balance`. Supplier payments are attributed to projects by each bill's line share. Opening rows (opening invoices' opening payments, opening expenses) are left out of cash. Change F adds payroll allocations (cost) and paid payroll (cash out).
- **`company_monthly_summary(p_year int)`** (`security invoker`): 12 rows with revenue, project_cost, overhead, profit, cash_in, cash_out.
- **`project_close_checklist(p_project)`** → rows (key, label, ok, detail); **`close_project(p_project, p_note)`**: project must be `completed`; Finance/Operasional need every item ok; Direktur may close with a note when items fail (audit `override`, table `projects`). `set_project_status` still refuses `closed`.
- **RLS:** views are `security_invoker`; P/L pages are limited to SA, Direktur, Finance, Operasional in the app; Marketing sees invoices but not costs because cost tables deny it.
- **UI:** Laporan L/R Table + Badge health + export; monthly Table with year Select; Ringkasan Cards; close Dialog listing checklist items with Badges.
- **Single cost source:** read-only change.

## Risks / Trade-offs
- [Ringkasan for roles without cost access] → financial cards are shown only to P/L roles; others see operational cards.

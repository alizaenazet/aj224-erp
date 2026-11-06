# Proposal: add-dashboards

## Why
Every module now records its data, but Beranda still shows only a greeting for office roles: management has no single view of contracts, receivables, payables, safety and project health, and each role must hunt for its pending work (PRD §3.2 Manajemen, §9 Beranda).

## What Changes
- **Direktur dashboard (DSB-01, Wajib):** cards for active contract value, unbilled value, receivables (total and overdue), payables (total and due in 7 days), win rate this year and pipeline value, LTI-free days, active crew with certificate problems and overrides (HCM-06), payroll awaiting approval — each links to its detail list.
- **Project health table (DSB-02, Wajib):** per active project: actual vs planned progress, % of RAB used, gross profit, margin, Normal/Waspada/Kritis (PRD §11.3) and the most frequent obstacle.
- **Charts (DSB-03, Sebaiknya):** receivable aging, incidents per month, tender pipeline per status, cost per category per project.
- **Beranda per role (DSB-04, Wajib):** "Perlu Tindakan" for Marketing (priority tenders, deadlines ≤ 7 days, due follow-ups), Finance (termin Siap Ditagih, receivables and payables due, field cash to verify, payroll to pay), HCM (certificate problems, workers awaiting verification, projects without attendance yesterday, returned payroll), Operasional (missing daily reports, tool discrepancies, open incidents and overdue actions, minimum stock); Super Admin gets admin shortcuts; Lapangan keeps the field home. Every item links to its action page.
- No email (decision 2026-11-06): UMM-07 digest and K3-02 email are not built; the bell and these lists carry reminders.

## Capabilities

### New Capabilities
- `dashboard/director`: Direktur cards, health table and charts.

### Modified Capabilities
- `dashboard/home`: per-role Perlu Tindakan lists for office roles.

## Impact
- No migration: reads `project_financials`, `invoice_list`, `receivable_aging`, `supplier_bill_list`, `tender_win_stats`, `tender_pipeline`, `k3_stats`, `incident_monthly`, `assignment_list`, `payroll_periods`, `project_term_list`, `field_cash_balances`, `employee_certificate_list`, `missing_daily_reports`, `material_low_stock`, `daily_report_obstacle_summary`, `project_cost_by_category`.
- New `lib/dashboard/queries.ts`, `components/dashboard/*`; `app/(app)/page.tsx` renders per role.

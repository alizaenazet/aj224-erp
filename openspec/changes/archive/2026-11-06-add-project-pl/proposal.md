# Proposal: add-project-pl

## Why
With revenue (change C) and costs (change D) recorded, management still cannot see profit per project, early warnings, or a company monthly picture, and projects can never be closed (PRD goal 1, §3.2 Manajemen).

## What Changes
- **Realisation per category (FIN-11, Wajib):** per project and cost category from the single cost source, equal to the RAB tab.
- **Project P/L (FIN-12, Wajib):** contract value, work done, recognised revenue, unbilled, cost per category, gross profit, margin, planned profit, estimated final cost, projected profit and project cash position per PRD §11.3; Excel export.
- **Health status (§11.3, DSB-02 base):** cost index and schedule deviation against the system thresholds → Normal / Waspada / Kritis.
- **Monthly company summary (FIN-14, Sebaiknya):** per month revenue (issued invoices), project cost, overhead, simple profit, cash in and cash out.
- **Ringkasan tab (PRJ-09, Wajib):** progress vs plan, health, contract value, billed, received, cost, gross profit, active crew, tools on site, incidents and latest obstacles.
- **Project closing (PRJ-11, Wajib):** checklist (tools demobilised, material stock cleared/reconciled, field cash zero, all non-retention termin paid); Ditutup only from Selesai when the checklist passes, or by Direktur override with a note (audited).
- **Screens:** Keuangan → Laporan L/R (projects + monthly summary); Ringkasan tab; Tutup Proyek dialog.

## Capabilities

### New Capabilities
- `finance/project-pl`: realisation, P/L, health, monthly summary and access.

### Modified Capabilities
- `projects/projects`: Ringkasan figures and the closing checklist with Direktur override.

## Impact
- Migration `<ts>_project_pl.sql`: views `project_financials`, `project_cost_by_category`; functions `company_monthly_summary`, `project_close_checklist`, `close_project`; `set_project_status` keeps refusing `closed`.
- New `lib/pl/*`, `components/pl/*`, page `app/(app)/finance/pl`, Ringkasan tab and project actions updated.
- Payroll allocations join the cost source and cash position in change F.
- PRD §19 Q12 (may Operasional see contract value and profit?): follows §13 (Operasional L on L/R); kept as a role list so it can change.

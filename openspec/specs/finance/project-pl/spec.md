# finance/project-pl Specification

## Purpose
Shows profit and early warnings per project and a simple monthly company picture, computed from recorded revenue and costs only (FIN-11, FIN-12, FIN-14, PRD §11.3).

## Requirements

### Requirement: Project P/L figures
For each project the system SHALL compute: contract value (after the last addendum, before PPN); work done = contract value × progress; recognised revenue = Σ DPP of invoices Terbit, Dibayar Sebagian or Lunas; unbilled = work done − revenue; cost = Σ the single cost source; gross profit = revenue − cost; margin = gross profit ÷ revenue (— when revenue is 0); planned profit = contract value − total RAB; estimated final cost = Σ per category of max(RAB, cost); projected profit = contract value − estimated final cost; cash position = Σ payments received − (supplier payments attributed by line share + direct expenses + top-ups net of returns), excluding opening-balance rows. (FIN-11, FIN-12)

#### Scenario: Gross profit
- **WHEN** a project has revenue Rp 2.100.000.000 and cost Rp 162.500.000
- **THEN** gross profit is Rp 1.937.500.000 and margin 92,26%

#### Scenario: Estimated final cost
- **WHEN** RAB Sewa Alat is Rp 5.000.000 with cost Rp 9.000.000 and RAB Upah is Rp 300.000.000 with cost Rp 150.000.000
- **THEN** those two categories add Rp 309.000.000 to the estimated final cost

### Requirement: Health status
The health status SHALL use cost index = (cost ÷ total RAB × 100) − progress and schedule deviation = progress − planned progress: Kritis when cost index > the critical threshold, deviation < −critical, or cost > total RAB; otherwise Waspada when cost index > the warning threshold or deviation < −warning; otherwise Normal; thresholds come from Parameter Sistem (default 10/20). Without RAB only the schedule rule applies. (PRD §11.3, MST-10)

#### Scenario: Behind schedule
- **WHEN** progress is 15% against a plan of 33% and cost is within RAB
- **THEN** the deviation is −18 and the status is Waspada

### Requirement: Laporan L/R
Keuangan → Laporan L/R SHALL list every project with the figures above and its health, with project status filter and Excel export, and SHALL show a monthly company summary for a chosen year: revenue (DPP of issued invoices by invoice month), project cost, office overhead, simple profit, cash in and cash out. (FIN-12, FIN-14, UMM-04)

#### Scenario: Monthly overhead
- **WHEN** a Rp 1.000.000 Kantor/Umum bill line is dated this month
- **THEN** this month's overhead includes it and no project P/L does

### Requirement: P/L access
Super Admin, Direktur, Finance and Operasional SHALL read P/L figures; Marketing, HCM and Lapangan SHALL NOT. (PRD §13)

#### Scenario: HCM
- **WHEN** HCM opens /finance/pl
- **THEN** access is denied

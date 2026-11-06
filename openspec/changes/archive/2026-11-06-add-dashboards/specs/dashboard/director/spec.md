# Spec Delta: dashboard/director

## Purpose
Gives Direktur one page with the company's key numbers, project health and trends, each linked to its details (DSB-01 … DSB-03).

## ADDED Requirements

### Requirement: Direktur cards
Beranda for Direktur SHALL show cards for: active contract value (projects Persiapan, Berjalan, Tertunda), unbilled value (Σ positive work done − recognised revenue), receivables total and overdue, payables total and due within 7 days, win rate (count) this year and pipeline value of active tenders, company LTI-free days, active crew with expired/missing certificates and with overrides, and periods awaiting payroll approval; each card SHALL link to the list behind it. (DSB-01, HCM-06)

#### Scenario: Click through
- **WHEN** Direktur clicks the receivables card
- **THEN** Invoice & Piutang opens filtered to open invoices

### Requirement: Project health table
Beranda for Direktur SHALL list active projects with progress vs plan, % RAB used, gross profit, margin, health status per PRD §11.3 and the obstacle category reported most often. (DSB-02)

#### Scenario: Waspada project
- **WHEN** a project is 18 points behind plan
- **THEN** its row shows Waspada

### Requirement: Charts
Beranda for Direktur SHALL show bar charts for receivable aging buckets, incidents per month this year, tender pipeline value per status, and cost per category for active projects, using the theme chart colours. (DSB-03)

#### Scenario: Aging chart
- **WHEN** Rp 1.331.000.000 is 1–30 days overdue
- **THEN** the aging chart's 1–30 bar shows that value with an Indonesian-formatted tooltip

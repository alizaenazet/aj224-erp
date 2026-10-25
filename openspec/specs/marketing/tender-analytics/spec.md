# marketing/tender-analytics Specification

## Purpose
Shows how Marketing performs over time: win rates by count and by value, per client and per voltage, why tenders are lost, and how much value sits in the pipeline (MKT-08, PRD §11.1).

## Requirements

### Requirement: Win rates per period
Analitik Tender SHALL compute, for tenders closed in the chosen period (by closing date; default the current year), the win rate by count = Menang ÷ (Menang + Kalah) × 100% and by value = Σ bid value Menang ÷ Σ bid value (Menang + Kalah) × 100%, excluding Batal; when there are no Menang or Kalah tenders the rate SHALL show "—". (MKT-08, PRD §11.1)

#### Scenario: Win rate by count and value
- **WHEN** a period has Menang tenders worth Rp 10 M and Rp 6 M and one Kalah tender worth Rp 4 M, plus one Batal
- **THEN** win rate by count is 66,7% and by value is 80,0%

#### Scenario: Period filter
- **WHEN** the period is set to 2025
- **THEN** only tenders closed in 2025 are counted

### Requirement: Win rates per client and voltage
Analitik Tender SHALL show the same counts, values and win rates per client and per voltage for the chosen period. (MKT-08)

#### Scenario: Per voltage
- **WHEN** the period has 150 kV tenders 1 Menang and 1 Kalah, and 500 kV tenders 1 Menang
- **THEN** 150 kV shows 50,0% and 500 kV shows 100,0%

### Requirement: Lost reasons
Analitik Tender SHALL recap Kalah tenders of the period per reason with count and bid value. (MKT-08)

#### Scenario: Reason recap
- **WHEN** two tenders were lost on Harga and one on Teknis
- **THEN** Harga shows 2 and Teknis shows 1

### Requirement: Pipeline per status
Analitik Tender SHALL show, for current active tenders regardless of period, the count, total bid value and total weighted value per status. (MKT-08, PRD §11.1)

#### Scenario: Pipeline
- **WHEN** there are two Negosiasi tenders worth Rp 8 M (40%) and Rp 2 M (50%)
- **THEN** Negosiasi shows 2 tenders, Rp 10 M and weighted Rp 4,2 M

### Requirement: Analytics access
Analitik Tender SHALL be available to Marketing, Super Admin, Direktur, Finance and Operasional and not to HCM or Lapangan; the numbers SHALL come from the database functions shared by all pages. (PRD §13, §11)

#### Scenario: HCM refused
- **WHEN** an HCM user opens Analitik Tender
- **THEN** they see "Akses ditolak"

# Spec Delta: finance/expenses

## ADDED Requirements

### Requirement: Payroll in the cost source
The single cost source SHALL include payroll allocations of approved and paid periods as Upah & Gaji per project (and Kantor/Umum), readable in aggregate by every cost reader without exposing individual pay. (PAY-08, FIN-11)

#### Scenario: RAB after approval
- **WHEN** a period with Rp 12.000.000 allocated to Kediri – Pare is approved
- **THEN** that project's Upah & Gaji realisation grows by Rp 12.000.000 for Operasional too

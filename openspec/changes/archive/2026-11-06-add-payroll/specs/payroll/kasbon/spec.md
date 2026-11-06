# Spec Delta: payroll/kasbon

## ADDED Requirements

### Requirement: Kasbon balance after payroll
A kasbon's deducted amount SHALL be the sum of its installments in Disetujui or Dibayar periods, its balance = amount − deducted (never negative), and a kasbon with deductions SHALL NOT be cancelled. (PAY-05)

#### Scenario: After approval
- **WHEN** a Rp 1.000.000 kasbon with installment Rp 250.000 is deducted in an approved period
- **THEN** its balance is Rp 750.000

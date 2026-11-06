# payroll/kasbon Specification

## Purpose
Keeps employee cash advances (kasbon) with their installment plan and balance, as salary data visible only to HCM, Finance and Direktur (PAY-05).

## Requirements

### Requirement: Kasbon records
HCM and Finance SHALL record a kasbon with employee, date, amount > 0, installment per pay period (> 0, at most the amount) and description; an approved field-cash Kasbon Karyawan SHALL create one automatically. A kasbon SHALL be cancelled with a reason while nothing has been deducted. The balance SHALL be amount − installments deducted and never negative. (PAY-05)

#### Scenario: From field cash
- **WHEN** Finance approves a field-cash Kasbon Karyawan of Rp 1.000.000 for Slamet with installment Rp 250.000
- **THEN** SDM → Kasbon lists a Rp 1.000.000 kasbon for Slamet with balance Rp 1.000.000

### Requirement: Opening kasbon
HCM SHALL import open kasbon balances per employee (NIK karyawan, date, remaining amount, installment). (UMM-13)

#### Scenario: Import
- **WHEN** HCM imports Rp 600.000 remaining for an employee with installment Rp 200.000
- **THEN** the kasbon appears with balance Rp 600.000

### Requirement: Kasbon access
Only HCM, Finance and Direktur SHALL read kasbon data; Super Admin, Operasional, Marketing and Lapangan SHALL NOT; kasbon audit entries are visible to Direktur only. (PRD §6, §13)

#### Scenario: Super Admin
- **WHEN** Super Admin opens /hr/kasbon
- **THEN** access is denied

### Requirement: Kasbon balance after payroll
A kasbon's deducted amount SHALL be the sum of its installments in Disetujui or Dibayar periods, its balance = amount − deducted (never negative), and a kasbon with deductions SHALL NOT be cancelled. (PAY-05)

#### Scenario: After approval
- **WHEN** a Rp 1.000.000 kasbon with installment Rp 250.000 is deducted in an approved period
- **THEN** its balance is Rp 750.000

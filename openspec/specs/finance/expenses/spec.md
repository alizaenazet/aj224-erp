# finance/expenses Specification

## Purpose
Records costs paid without a supplier bill and combines every cost source into one realisation per project and category, without double counting (FIN-09, FIN-11 base, FIN-13).

## Requirements

### Requirement: Direct expense
Finance SHALL record an expense with date, project or Kantor/Umum, cost category, amount > 0, payee, method (tunai/transfer), description and a receipt photo; an expense without a receipt SHALL require "Tanpa Nota" and a note. Expenses SHALL be cancelled with a reason, not deleted. (FIN-09, UMM-11)

#### Scenario: Tanpa nota
- **WHEN** Finance records Rp 2.000.000 kompensasi warga with Tanpa Nota and note "Diserahkan ke kepala desa"
- **THEN** it is saved and counts as project cost

### Requirement: Single cost source
Project cost realisation SHALL be the sum of non-cancelled supplier bill lines (without PPN when the company is PKP, with PPN spread over the lines when not), non-cancelled direct expenses (including imported opening cost) and approved field-cash Biaya Proyek, per project and category; opening supplier bills, supplier payments, field-cash top-ups and returns, kasbon and field-cash wage payments SHALL NOT be costs. Kantor/Umum costs SHALL be office overhead outside project P/L. (FIN-11, FIN-13, PRD §11.3)

#### Scenario: Bill and expense in one category
- **WHEN** a project has a bill line of Rp 9.000.000 and an expense of Rp 1.000.000 in Sewa Alat & Kendaraan
- **THEN** the RAB tab shows Rp 10.000.000 realised for that category

### Requirement: Cost opening balance
Finance SHALL import project cost to cut-off as one row per project and category; each row counts as cost. (UMM-13, PRD §16)

#### Scenario: Import
- **WHEN** Finance imports Rp 150.000.000 Upah & Gaji for PRJ-…-001
- **THEN** the RAB tab realisation for Upah & Gaji includes it

### Requirement: Expense access
Finance SHALL manage expenses; Super Admin, Direktur and Operasional SHALL read them; Marketing, HCM and Lapangan SHALL NOT. (PRD §13)

#### Scenario: Operasional reads
- **WHEN** Operasional opens Pengeluaran
- **THEN** the list is shown without create or cancel actions

### Requirement: Payroll in the cost source
The single cost source SHALL include payroll allocations of approved and paid periods as Upah & Gaji per project (and Kantor/Umum), readable in aggregate by every cost reader without exposing individual pay. (PAY-08, FIN-11)

#### Scenario: RAB after approval
- **WHEN** a period with Rp 12.000.000 allocated to Kediri – Pare is approved
- **THEN** that project's Upah & Gaji realisation grows by Rp 12.000.000 for Operasional too

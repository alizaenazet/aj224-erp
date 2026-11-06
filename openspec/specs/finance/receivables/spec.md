# finance/receivables Specification

## Purpose
Bills clients from termin and other work, records payments with PPh withholding, and shows what is still owed and how old it is (FIN-01 … FIN-05).

## Requirements

### Requirement: Invoice from a termin
Finance SHALL create a Draft invoice from a termin in Siap Ditagih with gross defaulting to the termin value, optional deductions (pengembalian uang muka, retensi, lainnya with a note), DPP = gross − deductions (never negative), PPN = DPP × PPN rate rounded to rupiah only when the company is PKP and the contract is subject to PPN (otherwise 0), total = DPP + PPN, invoice date and a due date defaulting to invoice date + the client's payment term. A termin SHALL have at most one invoice that is not Batal. (FIN-01, PRD §11.4)

#### Scenario: PKP termin invoice
- **WHEN** Finance creates an invoice for Termin 1 worth Rp 500.000.000 with an uang muka return of Rp 100.000.000, the company is PKP, the contract has PPN and the rate is 11%
- **THEN** DPP is Rp 400.000.000, PPN Rp 44.000.000 and total Rp 444.000.000

#### Scenario: Second invoice for the same termin
- **WHEN** Finance creates another invoice for a termin that already has a Draft invoice
- **THEN** it is refused

### Requirement: Other invoices
Finance SHALL create an invoice not tied to a termin for a project, with a description and gross amount, following the same deduction, PPN, numbering and payment rules. (FIN-02)

#### Scenario: Extra work
- **WHEN** Finance creates "Pekerjaan tambah crossing jalan" for a project
- **THEN** the invoice is saved as Draft without a termin

### Requirement: Issue, edit and cancel
Only Draft invoices SHALL be edited. Issuing SHALL assign the next invoice number for the invoice date, set status Terbit and set its termin to Ditagih. Finance SHALL cancel an invoice with a reason only when it has no active payment; the termin SHALL return to Siap Ditagih and the invoice stays visible as Batal. (FIN-01, UMM-10, UMM-11, PRJ-03)

#### Scenario: Issue
- **WHEN** Finance issues the Draft invoice of Termin 1 dated 6 Nov 2026
- **THEN** it gets number INV/AJ224/2026/11/001 and Termin 1 shows Ditagih

### Requirement: Incoming payments
Finance SHALL record a payment on a Terbit or Dibayar Sebagian invoice with date, amount received, PPh withheld (amount and slip number), company bank account, notes and transfer proof; received + PPh SHALL NOT exceed the remaining balance. The invoice SHALL become Dibayar Sebagian, or Lunas when received + PPh equals the total, and its termin Lunas. A payment SHALL be cancelled with a reason, recomputing the status. (FIN-03, PRJ-03)

#### Scenario: Paid with PPh withheld
- **WHEN** an invoice of Rp 444.000.000 receives Rp 436.000.000 and PPh Rp 8.000.000
- **THEN** the invoice and its termin are Lunas

#### Scenario: Partial
- **WHEN** it first receives Rp 200.000.000
- **THEN** it is Dibayar Sebagian with balance Rp 244.000.000

### Requirement: Receivables and reminders
Invoice & Piutang SHALL list invoices with number, project, client, date, due date, total, received, balance and days overdue, with search, filters (status, project, client, overdue only, date range) and Excel export; an overdue invoice SHALL be marked red. The daily check SHALL notify Finance once when an unpaid invoice is due within 7 days and once when it becomes overdue (a missed run still sends them). (FIN-04, UMM-04, UMM-09)

#### Scenario: Overdue
- **WHEN** an invoice with a balance had its due date 12 days ago
- **THEN** the list shows 12 hari terlambat in red

### Requirement: Aging
The aging view SHALL sum open balances per client and project into Belum Jatuh Tempo, 1–30, 31–60, 61–90 and > 90 days by days overdue, with totals and Excel export; Draft and Batal invoices SHALL NOT count. (FIN-05, PRD §11.4)

#### Scenario: Bucket
- **WHEN** an invoice is 45 days overdue with balance Rp 50.000.000
- **THEN** it adds Rp 50.000.000 to the 31–60 column of its client

### Requirement: Print
An invoice SHALL print on A4 with the letterhead, client name, address and NPWP, project and contract number, the amount breakdown, the amount in words (terbilang), the default bank account and a signature box. (FIN-01, UMM-05)

#### Scenario: Terbilang
- **WHEN** the total is Rp 444.000.000
- **THEN** the print shows "empat ratus empat puluh empat juta rupiah"

### Requirement: Opening balances
Finance SHALL import invoices from before cut-off (project code, original number, date, due date, description, DPP, PPN, amount already received); each becomes an issued invoice with its original number, with the received part recorded as an opening payment; rows with unknown projects, duplicate numbers, PPN above DPP or received above total SHALL be reported. (UMM-13)

#### Scenario: Partly paid opening invoice
- **WHEN** a row has DPP 100.000.000, PPN 11.000.000 and received 50.000.000
- **THEN** the invoice shows balance Rp 61.000.000 and status Dibayar Sebagian

### Requirement: Receivables access
Finance SHALL manage invoices and payments; Super Admin, Direktur and Marketing SHALL read them; Operasional, HCM and Lapangan SHALL NOT read invoices (Operasional sees the termin status only). Direct table writes SHALL be refused. (PRD §13)

#### Scenario: Operasional
- **WHEN** an Operasional user opens /finance/invoices
- **THEN** the access denied message is shown

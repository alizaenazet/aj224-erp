# Spec Delta: finance/payables

## Purpose
Records supplier bills split by project and cost category, their payments and due dates, so no supplier is paid late without notice (FIN-06 … FIN-08).

## ADDED Requirements

### Requirement: Supplier bill
Finance SHALL record a bill with supplier, nota/faktur number, date, due date (default date + the supplier's payment term), optional PPN amount, notes, optional surat jalan reference and at least one line; every line SHALL have a description, an amount > 0, a project or Kantor/Umum, and a cost category. A bill SHALL be edited only while it has no active payment. (FIN-06, ALT-03)

#### Scenario: Split bill
- **WHEN** Finance records CV Sarana Stringing nota NS-221 with lines "Sewa tensioner" Rp 9.000.000 on PRJ-…-001 (Sewa Alat & Kendaraan) and "Sewa genset kantor" Rp 1.000.000 on Kantor/Umum
- **THEN** the bill totals Rp 10.000.000 and each line counts as cost of its project or office

#### Scenario: Line without category
- **WHEN** a line has no cost category
- **THEN** saving is refused

### Requirement: Supplier payments
Finance SHALL record partial or full payments with date, amount, source account, method and proof, never above the remaining balance; status SHALL be Belum Dibayar, Dibayar Sebagian or Lunas. Payments and bills SHALL be cancelled with a reason; a bill with active payments SHALL NOT be cancelled. Payments are not costs. (FIN-07, UMM-11, §11.3)

#### Scenario: Partial payment
- **WHEN** Rp 4.000.000 of a Rp 10.000.000 bill is paid
- **THEN** the bill is Dibayar Sebagian with balance Rp 6.000.000

### Requirement: Payables and reminder
Tagihan Supplier & Utang SHALL list bills with supplier, number, date, due date, total, paid, balance and a due group (Terlambat, Minggu ini, Minggu depan, Nanti), with filters, search and export; an aging view SHALL sum open balances per supplier in the PRD §11.4 buckets. The daily check SHALL notify Finance once when an unpaid bill is 3 days from its due date. (FIN-08)

#### Scenario: H-3
- **WHEN** an unpaid bill is due in 3 days and the daily check runs
- **THEN** Finance gets "Tagihan supplier jatuh tempo 3 hari lagi" once

### Requirement: Opening bills
Finance SHALL import open supplier bills from before cut-off (supplier, number, date, due date, total, PPN, already paid); they count in payables but SHALL NOT count as cost, because project cost to cut-off is imported separately. (UMM-13, §11.3)

#### Scenario: Opening bill not a cost
- **WHEN** an opening bill of Rp 5.000.000 is imported
- **THEN** payables include it and project realisation does not

### Requirement: Payables access
Finance SHALL manage bills and payments; Super Admin, Direktur and Operasional SHALL read them; Marketing, HCM and Lapangan SHALL NOT. (PRD §13)

#### Scenario: Marketing
- **WHEN** Marketing opens /finance/bills
- **THEN** access is denied

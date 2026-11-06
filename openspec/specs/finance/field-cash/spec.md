# finance/field-cash Specification

## Purpose
Tracks operating cash given to a project's PIC and how it is spent, verified by Finance, with an always-current balance (FIN-10, PRD §11.3).

## Requirements

### Requirement: Top-up and return
Finance SHALL record a top-up (date, project, PIC, amount, method, account) and a return of remaining cash to the office; both SHALL be cancelled with a reason. Top-ups and returns are not costs. (FIN-10)

#### Scenario: Top-up
- **WHEN** Finance tops up Rp 20.000.000 to Kediri – Pare
- **THEN** the project's field cash balance grows by Rp 20.000.000

### Requirement: Field spending
Lapangan (their project) and Finance SHALL record spending with date (Lapangan up to the backdate limit), kind (Biaya Proyek with a cost category, Kasbon Karyawan with an employee and installment, Pembayaran Gaji with an employee), amount, description and receipt photo (or Tanpa Nota with a note); it starts as Menunggu Verifikasi and Finance is notified. The phone form SHALL keep a local draft until it is sent. (FIN-10, UMM-12)

#### Scenario: Lapangan records fuel
- **WHEN** Lukman records Rp 1.500.000 solar as Biaya Proyek BBM & Transportasi with a receipt photo
- **THEN** it shows Menunggu Verifikasi and the balance drops by Rp 1.500.000

### Requirement: Verification
Finance SHALL approve or reject (with a reason) pending spending. Only approved Biaya Proyek SHALL become project cost; an approved Kasbon Karyawan SHALL create a kasbon for that employee; a rejected item SHALL no longer reduce the balance and its recorder SHALL be notified. (FIN-10, PAY-05)

#### Scenario: Reject
- **WHEN** Finance rejects Rp 500.000 with reason "Nota tidak terbaca"
- **THEN** the balance rises by Rp 500.000 again and the recorder gets a notification

### Requirement: Balance
The field cash balance per project SHALL be Σ top-ups − Σ spending (Menunggu + Disetujui) − Σ returns, excluding cancelled rows, shown to Finance on Kas Lapangan and to the PIC on the home page and project ledger. (FIN-10, PRD §11.3)

#### Scenario: Balance after spending
- **WHEN** a project had Rp 20.000.000 top-up, Rp 1.500.000 approved and Rp 500.000 pending
- **THEN** the balance is Rp 18.000.000

### Requirement: Field cash access
Finance SHALL manage everything; Lapangan SHALL record spending and see the ledger only of their projects; Super Admin, Direktur and Operasional SHALL read; Marketing and HCM SHALL NOT. (PRD §13)

#### Scenario: Other project
- **WHEN** Lukman opens the field cash of a project he is not assigned to
- **THEN** it is not found

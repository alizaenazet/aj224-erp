# payroll/payroll Specification

## Purpose
Turns attendance, pay settings and kasbon into approved, paid payslips and allocates wage cost to projects (PAY-01 … PAY-09, PRD §11.7).

## Requirements

### Requirement: Pay period
HCM SHALL create a period with name, start and end date (end ≥ start) and group Lapangan, Kantor or Semua; a period SHALL be refused when it overlaps a non-cancelled period whose group covers the same employees (Semua covers both). (PAY-01)

#### Scenario: Overlap
- **WHEN** HCM creates Lapangan 1–15 Nov while Semua 1–30 Nov exists
- **THEN** it is refused

### Requirement: Generate draft payroll
HCM SHALL generate (and regenerate while Draft or Dikembalikan) slips for every employee of the group who was employed during the period and has pay settings, computing per PRD §11.7: daily-paid — upah = daily wage × Hadir days, uang makan = meal × Hadir days, tunjangan lapangan = field allowance × Hadir days on a project, lembur = hours × rate; monthly — (base + fixed allowance) × active days ÷ days in the month (full month = full pay), minus base ÷ divisor × Alpa days, plus daily components and overtime; gross = the sum + incentives + corrections. Slips SHALL be flagged when attendance has fewer recorded days than active days, and when the worker is still Menunggu Verifikasi HCM. (PAY-02, HCM-12)

#### Scenario: Daily worker
- **WHEN** a daily worker (Rp 175.000/day, meal Rp 25.000, field Rp 30.000, overtime Rp 20.000/hour) has 10 Hadir days on a project and 4 overtime hours
- **THEN** gross is Rp 2.380.000

#### Scenario: Monthly Alpa
- **WHEN** a monthly employee with base Rp 5.200.000 (divisor 26) has 1 Alpa day in a full period
- **THEN** the Alpa deduction is Rp 200.000

### Requirement: Adjustments and deductions
HCM SHALL add per slip, with a required note: incentive/bonus/borongan (earning), PPh 21 and other deductions, and a prior-period correction (±). BPJS is the fixed deduction from pay settings. Kasbon installment SHALL be min(installment, balance) per kasbon and SHALL be reduced so net pay is never negative; net = gross − deductions. Adjustments survive regeneration. (PAY-03, PAY-05, §11.7)

#### Scenario: Kasbon reduced to keep net ≥ 0
- **WHEN** gross is Rp 300.000, BPJS Rp 100.000 and the kasbon installment Rp 250.000
- **THEN** the kasbon deduction is Rp 200.000 and net Rp 0

### Requirement: Approval flow
HCM SHALL submit a Draft or Dikembalikan period, which recomputes the slips and locks that period's attendance until it is returned (Direktur notified); Direktur SHALL approve it or return it with a note (HCM notified). Approval SHALL be refused while any slip is for an unverified worker. Approval SHALL be refused if attendance no longer matches the slips; on approval kasbon installments count against balances, allocations are written and Finance is notified. (PAY-04, HCM-11, HCM-12)

#### Scenario: Unverified worker
- **WHEN** Direktur approves a period containing a slip for a local worker Menunggu Verifikasi HCM
- **THEN** approval is refused naming the worker

### Requirement: Payment
Finance SHALL mark all or selected slips of an approved period paid with date and method (transfer/tunai); the period becomes Dibayar when every slip is paid. Finance SHALL export the transfer list (name, bank, account number, holder, net amount). (PAY-06)

#### Scenario: Pay all
- **WHEN** Finance pays all slips by transfer on 30 Nov
- **THEN** the period shows Dibayar

### Requirement: Cost allocation
On approval each slip's gross SHALL be split: project P gets gross × Hadir days on P ÷ total Hadir days; Hadir days without project go to Kantor/Umum; with no Hadir days the whole gross goes to the active assignment project or Kantor/Umum. Allocations SHALL total the gross exactly and SHALL appear as Upah & Gaji in project realisation; deductions SHALL NOT reduce project cost. Paid allocations reduce project cash position. (PAY-08, §11.3)

#### Scenario: Two projects
- **WHEN** a worker with gross Rp 3.000.000 was Hadir 6 days on P1 and 4 days on P2
- **THEN** P1 gets Rp 1.800.000 and P2 Rp 1.200.000 of Upah & Gaji

### Requirement: Payslip and recap
Each slip SHALL print on A4 with the letterhead and all components; Finance/HCM SHALL print all slips of a project in one go. The recap per period per project/group SHALL be exportable. (PAY-07, PAY-09, UMM-05)

#### Scenario: Bulk print
- **WHEN** HCM prints the slips of Kediri – Pare for a period
- **THEN** one page per crew member prints

### Requirement: Payroll access
Only HCM, Finance and Direktur SHALL read payroll data: HCM prepares, Direktur approves or returns, Finance pays; Super Admin, Operasional, Marketing and Lapangan SHALL NOT read it. (PRD §6, §13)

#### Scenario: Super Admin
- **WHEN** Super Admin opens /hr/payroll
- **THEN** access is denied

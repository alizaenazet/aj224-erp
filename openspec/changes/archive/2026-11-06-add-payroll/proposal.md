# Proposal: add-payroll

## Why
Payroll is rebuilt by hand from paper attendance, kasbon is deducted by memory, and wage cost never reaches project P/L (PRD §3.2 HCM/Keuangan, metric "payroll ≤ 2 hari kerja").

## What Changes
- **Pay periods (PAY-01, Wajib):** start–end dates for Lapangan, Kantor or Semua; no overlapping period for the same employee.
- **Draft payroll (PAY-02, Wajib):** generated from attendance, pay settings and kasbon per PRD §11.7 (daily: wage, meal, field allowance, overtime; monthly: base + fixed allowance, prorated by active days, Alpa deduction = base ÷ divisor, daily components, overtime); flags for incomplete attendance and unverified workers.
- **Manual adjustments (PAY-03, Wajib):** incentive/bonus/borongan, PPh 21, other deduction, prior-period correction — each with a note; kept when the draft is regenerated.
- **Approval flow (PAY-04, Wajib):** Draft (HCM) → Diajukan → Disetujui (Direktur) or Dikembalikan with a note → Dibayar (Finance). Approval is refused while any slip is for an unverified worker (HCM-12). After approval the slips and that period's attendance are locked (HCM-11).
- **Kasbon deduction (PAY-05, Wajib):** installment = min(installment, balance); reduced so net pay is never negative; balance counts approved periods.
- **Payment (PAY-06, Wajib):** Finance marks slips paid, all or selected, with date and method; transfer list export (name, bank, account, amount).
- **Payslip print (PAY-07, Wajib):** A4 per employee and bulk per project.
- **Cost allocation (PAY-08, Wajib):** on approval, gross pay per employee is split to projects by present days (rest to Kantor/Umum; no present days → active assignment or office) and enters the single cost source as Upah & Gaji; paid allocations reduce project cash position.
- **Recap (PAY-09, Wajib):** per period per project and group, exportable.
- **Locked attendance corrections (HCM-11):** only HCM, with a reason, audited; the money effect is added to the next payroll as a prior-period correction.

## Capabilities

### New Capabilities
- `payroll/payroll`: periods, generation, adjustments, approval, payment, payslips, allocation, recap and access.

### Modified Capabilities
- `payroll/kasbon`: balance after approved deductions.
- `hcm/attendance`: lock after approval and audited corrections.
- `finance/expenses`: payroll allocations join the single cost source.

## Impact
- Migration `<ts>_payroll.sql`: `payroll_periods`, `payslips`, `payslip_adjustments`, `kasbon_installments`, `payroll_allocations`, `attendance_corrections`; functions `create_payroll_period`, `generate_payroll`, `save_payslip_adjustment`, `delete_payslip_adjustment`, `submit_payroll`, `return_payroll`, `approve_payroll`, `pay_payslips`, `correct_attendance`; attendance lock trigger; views `payroll_cost_entries`, replaced `cost_entries`, `kasbon_balances`, `project_financials` cash, `company_monthly_summary`; RLS; `is_pay_table`.
- New `lib/payroll/*`, `components/payroll/*`, pages `app/(app)/hr/payroll/**`, print pages for payslips.
- PRD §19 Q2/Q11 (borongan, paid sick leave): borongan via manual incentive; only Hadir is paid, as §11.7 states.

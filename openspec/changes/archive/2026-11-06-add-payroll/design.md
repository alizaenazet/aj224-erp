# Design: add-payroll

## Context
`employee_pay_settings` (pay_type, daily_wage, base_salary, fixed_allowance, meal/field allowance per day, overtime rate, fixed_deduction) and `attendance` (status, overtime_hours, project_id null = office) exist; `kasbons` and `kasbon_balances` come from change D; `cost_entries` is the single cost source; `system_parameters.monthly_salary_divisor` defaults to 26.

## Goals / Non-Goals
**Goals:** all money arithmetic in one SQL function (`generate_payroll`), status transitions as RPCs, payroll cost visible in aggregate to every cost reader.

**Non-Goals:** PPh 21/BPJS engines (PRD §7.2), payslip e-mail, bank file formats beyond Excel.

## Decisions
- **Tables:** `payroll_periods` (name, period_start, period_end, group field/office/all, status draft/submitted/returned/approved/paid/cancelled, return_note, submitted/approved/paid stamps); `payslips` (period, employee, snapshot of pay settings, day counts, components, gross, deductions, net, flags, status draft/paid, paid_at, payment_method; unique period × employee); `payslip_adjustments` (period, employee, kind incentive/pph21/other_deduction/correction, amount, note); `kasbon_installments` (kasbon, payslip, amount); `payroll_allocations` (payslip, project null = office, days, amount); `attendance_corrections` (employee, work_date, old/new status and overtime, reason, applied_period_id).
- **`generate_payroll(p_period)`:** deletes and rebuilds the period's slips, installments; adjustments are keyed by period × employee so they survive. Active days = overlap of period with employment; prior-period corrections not yet applied add a `correction_amount` (daily: Δpresent × (wage + meal [+ field when on project]) + Δovertime × rate; monthly: −ΔAlpa × base ÷ divisor + Δovertime × rate).
- **Lock:** trigger `attendance_lock` (before insert/update/delete) refuses dates covered by an approved/paid period of the employee's group unless the session flag `app.attendance_correction` is set by `correct_attendance` (HCM only, audited via `log_audit_event`).
- **Allocation:** written in `approve_payroll`; rounding remainder goes to the largest share so the sum equals gross.
- **Cost source:** owner view `payroll_cost_entries` (filtered to SA, Direktur, Finance, Operasional; one row per allocation, no employee data) is unioned into `cost_entries`; `project_financials` cash out adds allocations of paid slips; `company_monthly_summary` adds paid payroll to cash out.
- **RLS:** all payroll tables readable by Finance, HCM, Direktur only and added to `is_pay_table`; no direct writes.
- **UI:** period list + create Dialog; period page with role-specific actions (Generate/Ajukan for HCM, Setujui/Kembalikan for Direktur, Bayar for Finance), slips Table with flag Badges, correction Dialog; slip page with adjustments; print pages (single, bulk per project).

## Risks / Trade-offs
- [Regenerating after manual edits] → adjustments are stored outside slips; slips themselves have no manual fields.
- [Monthly staff on two-weekly periods] → proration uses active days ÷ period days; HCM should use monthly periods for office staff (documented in the UI).

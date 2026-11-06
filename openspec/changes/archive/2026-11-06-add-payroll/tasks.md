# Tasks: add-payroll

## 1. Database

- [x] 1.1 Write migration `<ts>_payroll.sql` (tables, generate/transition/correction functions, lock trigger, payroll cost view, replaced `cost_entries`, `kasbon_balances`, `project_financials`, `company_monthly_summary`, RLS, `is_pay_table`, seed); verify `supabase db reset` and `pnpm db:types`
- [x] 1.2 SQL check: daily and monthly examples; kasbon reduced to keep net ≥ 0; overlap refused; unverified blocks approval; approval writes allocations equal to gross, locks attendance, counts kasbon; correction audited and applied next period; RAB shows payroll for Operasional; pay all → Dibayar
- [x] 1.3 SQL check access: SA, Operasional, Marketing, Lapangan read no payroll rows

## 2. Library and pages

- [x] 2.1 Add `lib/payroll/*` (labels, schema, queries, actions, exports), menu SDM → Payroll; verify `tsc --noEmit`
- [x] 2.2 Period list and page, slip page with adjustments, correction dialog, print single and bulk; verify HCM generate → submit, Direktur return/approve, Finance pay and transfer export

## 3. Integration

- [x] 3.1 Run `pnpm lint` and `pnpm build`; smoke-fetch routes per role

## Verification notes
- SQL (2026-11-06): daily Budi 5 days → upah 875.000 + makan 125.000 + lapangan 175.000 + lembur 100.000 + insentif 150.000 = 1.425.000, BPJS 100.000, kasbon 250.000; monthly field Eko prorated 6/31 days (1.403.226); office full month = base + allowance; BPJS capped at available pay; allocations equal gross per slip (total 6.473.226 to Upah & Gaji, visible to Operasional); kasbon balance 750.000 after approval; overlap refused; Lapangan edit on a locked day refused; HCM correction audited and carried into the next draft (−235.000); unverified worker blocks approval naming him; pay all → Dibayar. SA, Operasional, Marketing and Lapangan read no payroll rows.
- Browser: HCM routes, slip page, single and bulk print, exports load (transfer export denied for HCM); HCM submitted the office draft, Direktur approved it, Finance marked all paid and downloaded the transfer list.
- `pnpm lint` and `pnpm build` pass.

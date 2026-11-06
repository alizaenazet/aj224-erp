# Tasks: add-project-pl

## 1. Database

- [x] 1.1 Write migration `<ts>_project_pl.sql` (`project_cost_by_category`, `project_financials`, `company_monthly_summary`, `project_close_checklist`, `close_project`); verify `supabase db reset` and `pnpm db:types`
- [x] 1.2 SQL check: figures for Kediri – Pare match the spec (revenue, cost, gross profit, estimated final cost); Tuban health Waspada (−18 deviation); monthly overhead; checklist items and refusal; Direktur override audited

## 2. Library and pages

- [x] 2.1 Add `lib/pl/*` (labels, queries, actions, exports), menu Keuangan → Laporan L/R; verify `tsc --noEmit`
- [x] 2.2 Laporan L/R page with monthly summary and exports; Ringkasan tab figures; Tutup Proyek dialog; verify as Finance, Operasional, Direktur; HCM and Marketing denied

## 3. Integration

- [x] 3.1 Run `pnpm lint` and `pnpm build`; smoke-fetch routes per role

## Verification notes
- SQL (2026-11-06): Kediri – Pare revenue 2,1 M, cost 162,5 jt (office line excluded), gross profit 1.937,5 jt, margin 92,26%, cash position 974,4 jt (1 M received − 3,6 jt supplier share − 2 jt expense − 20 jt top-up); Tuban deviation −18,33 → Waspada; monthly summary splits overhead (Oct: 1 jt) from project cost; checklist lists tools, material, field cash and termin blockers; Operasional close refused, Direktur needs a note and the override is audited; close from a non-Selesai project refused. Marketing, HCM and Lapangan get no P/L rows.
- Browser: Finance — Laporan L/R and exports load, Ringkasan shows the Keuangan card; crew card limited to assignment readers. Direktur — Tutup Proyek dialog on a Selesai project shows the checklist and closes with an override note.
- `pnpm lint` and `pnpm build` pass.

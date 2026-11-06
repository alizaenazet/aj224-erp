# Tasks: add-payables-expenses

## 1. Database

- [x] 1.1 Write migration `<ts>_payables_expenses.sql` (tables, RPCs, views incl. `cost_entries` and replaced `project_category_costs`, daily check, attachments, RLS, audit, `is_pay_table`, seed); verify `supabase db reset` and `pnpm db:types`
- [x] 1.2 SQL check: split bill lines → project and office costs; line without category refused; partial/full payment and overpayment; cancel rules; opening bill excluded from cost; expense Tanpa Nota needs note; field cash balance example; approve Biaya Proyek → cost; approve Kasbon → kasbon row; reject restores balance and notifies; Lapangan back-date limit; H-3 reminder once
- [x] 1.3 SQL check access: Marketing/HCM read no bills or expenses; Lapangan only its project's field cash; SA and Operasional read no kasbon; direct writes refused

## 2. Library

- [x] 2.1 Add `lib/{bills,expenses,field-cash,kasbon}/*`, `lib/local-draft.ts` (daily report form uses it), attachment entities, audit labels, exports, import templates `opening-bills`, `opening-costs`, `opening-kasbon`, menu items; verify `tsc --noEmit`

## 3. Pages

- [x] 3.1 Tagihan Supplier & Utang (list, aging, form, detail with payments) and Pengeluaran (list, form, detail); verify as Finance and read-only as Operasional
- [x] 3.2 Kas Lapangan (balances, project ledger, top-up/return, verification) and the spending form with local draft; verify as Lapangan at 375 px and Finance approve/reject
- [x] 3.3 SDM → Kasbon list and form; RAB tab shows realisation; Lapangan home balance and button; verify as HCM and Finance; SA denied

## 4. Integration

- [x] 4.1 Run `pnpm lint` and `pnpm build`; smoke-fetch routes per role

## Verification notes
- SQL (2026-11-06): cost_entries = rental line 9 jt (project) + genset 1 jt (Kantor/Umum) + kompensasi 2 jt + approved solar 1,5 jt + opening wages 150 jt; approved kasbon (1 jt), pending spending, payments, top-ups and the opening bill (5 jt) are not costs. Field cash balance 20 jt − 2,5 jt approved − 0,5 jt pending = 17 jt; reject restores to 17,5 jt and notifies Lukman; approved kasbon created a kasbon row. Line without category, overpayment, cancel with payments, Tanpa Nota without note, Lapangan back-date H+6 and other-project spending all refused; H-3 reminder once. Marketing reads no bills; HCM reads kasbon but no bills; Super Admin reads bills but no kasbon; Lapangan reads only its project's field cash.
- Browser: Finance — every route loads, RAB tab shows realisation (9.000.000, 150.000.000), pending spending approved from the ledger. Super Admin — kasbon page and export denied, no create actions. Lapangan at 375 px — home shows Kas lapangan Rp 17.000.000 and Catat Pengeluaran; draft restored after reload, submitted and cleared; other project ledger not found; office finance pages denied.
- `pnpm lint` and `pnpm build` pass.

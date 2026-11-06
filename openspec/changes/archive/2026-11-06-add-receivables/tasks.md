# Tasks: add-receivables

## 1. Database

- [x] 1.1 Write migration `<ts>_receivables.sql` (tables, functions, views, daily check, bucket `finance-files`, attachment types, RLS, audit, seed); verify `supabase db reset` and `pnpm db:types`
- [x] 1.2 SQL check: PPN example (DPP 400 jt → PPN 44 jt); second invoice for a termin refused; issue numbers INV/… and sets termin Ditagih; partial then full payment with PPh → Lunas and termin Lunas; overpayment refused; cancel with payment refused; cancel payment reopens; cancel invoice returns termin to Siap Ditagih; aging buckets; H-7/overdue notifications once; opening import
- [x] 1.3 SQL check access: Operasional, HCM, Lapangan read nothing; Marketing read-only; direct writes refused

## 2. Library

- [x] 2.1 Add `lib/finance/receivables/{labels,schema,queries,actions,exports}.ts`, `terbilang()` in `lib/format.ts`, attachment entities, audit labels, exports `invoices` and `receivable-aging`, import template `opening-invoices`, menu Keuangan → Invoice & Piutang; verify `tsc --noEmit`

## 3. Pages

- [x] 3.1 Invoice list and aging, new/edit invoice (termin and other), invoice page with issue, payments, cancel, attachments, print; Buat Invoice in Kontrak & Termin; verify as Finance end to end and print terbilang
- [x] 3.2 Verify as Marketing (read-only) and Operasional (denied; termin status visible)

## 4. Integration

- [x] 4.1 Run `pnpm lint` and `pnpm build`; smoke-fetch routes per role

## Verification notes
- SQL (2026-11-06): Termin 1 Rp 500 jt − uang muka 100 jt → DPP 400 jt, PPN 44 jt, total 444 jt (PKP + contract PPN, 11%); second invoice for the termin refused; issue numbered INV/AJ224/2026/11/001 and termin → Ditagih; 200 jt → Dibayar Sebagian, sisa 244 jt; overpayment refused with the remaining balance; PPh without slip number refused; 236 jt + PPh 8 jt → Lunas and termin Lunas; cancel with payments refused; cancelling payments reopens; cancel invoice → termin Siap Ditagih; opening import with received 50 jt → sisa 61 jt, 31–60 bucket; duplicate number refused; daily check notifies Finance once ("Invoice lewat jatuh tempo"). Operasional, HCM and Lapangan read no invoices; Marketing, SA and Direktur read; Marketing cannot write.
- Browser as Finance: all routes load; issued the Tuban draft and recorded a full payment from the dialog (Lunas); invoice print shows letterhead, client NPWP, DPP/PPN/total, terbilang and the bank account. As Operasional: invoice pages, print and export refused; Kontrak & Termin still shows Ditagih without invoice links.
- `pnpm lint`, `tsc --noEmit` and `pnpm build` pass.

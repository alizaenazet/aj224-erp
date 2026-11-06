# Tasks: add-material-stock

## 1. Database

- [x] 1.1 Write migration `<ts>_material_stock.sql` (tables, `material_post`, `create_material`, `record_material_transaction`, `record_stock_opname`, `cancel_material_transaction`, extended surat jalan functions, views, minimum check, attachment type, RLS, audit, seed materials); verify `supabase db reset` and `pnpm db:types` succeed
- [x] 1.2 SQL check as Operasional and Lapangan: receipt grows stock; usage above stock refused; Lapangan at another location refused and back-dated past H+3 refused; return only titipan; opname posts differences and writes audit; cancel reverses; surat jalan with material lines deducts on send, shortfall needs note/photo and notifies, cancel restores; reconciliation numbers match the spec example; minimum check notifies once
- [x] 1.3 SQL check access: HCM and Marketing read nothing; Finance read-only; Lapangan sees only its location rows; direct inserts refused

## 2. Library, export and import

- [x] 2.1 Add `lib/materials/{labels,schema,queries,actions}.ts`, attachment entity, audit labels, exports `materials`, `material-transactions`, `material-reconciliation`, import template `materials`, menu items; verify `pnpm exec tsc --noEmit`

## 3. Pages

- [x] 3.1 Material & Stok list, new/edit material, material detail (stock per location, history); verify as Operasional: create GRS-01, edit, filter by location, export
- [x] 3.2 Transaksi Material list, new receipt/usage/return form, detail with document photos and cancel, stock opname page, reconciliation page; verify as Operasional: receipt, usage over stock refused, opname with reason, cancel, reconciliation export
- [x] 3.3 Surat jalan form, receipt form, detail and print with material lines; verify as Operasional send grease + pulleys, as Lapangan receive with shortfall
- [x] 3.4 Project tab Material and Lapangan menu/home buttons; verify at 375 px as Lapangan: Terima Material and Pakai Material from the home, tab shows only own project

## 4. Integration

- [x] 4.1 Run `pnpm lint` and `pnpm build`; smoke-fetch every new route per role for non-200s and server errors

## Verification notes
- SQL (2026-11-06): Lapangan receipt at warehouse and return refused, usage above stock refused with the available quantity, back-date beyond H+3 refused; return of company material refused; opname 15 → 14 kg audited with reason; cancel reverses stock; opname cannot be cancelled; material-only surat jalan: shortfall needs a photo, 8 of 10 kg received, 2 kg recorded as shortfall, Operasional notified; reconciliation 3.000 received / 1.800 used / 150 returned / 10 shrinkage / 1.040 on hand; minimum check notifies once per material/location/day. HCM and Marketing read nothing; Finance cannot update or create.
- Browser: Operasional receipt of 12,5 kg through the form, then cancel with reason (shows Batal). Lapangan at 375 px: home shows Terima Material/Pakai Material; return form and office list denied; other project's Material tab not found; export 403.
- `pnpm lint`, `tsc --noEmit` and `pnpm build` pass; no server errors.

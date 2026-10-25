# Tasks: add-master-data

## 1. Database

- [x] 1.1 Write migration `<ts>_master_data.sql` (all tables, seeds, is_active_user(), RLS per role, audit triggers on company_profile/system_parameters/document_types, stage total deferred trigger, save_stage_template, set_position_required_certificates, set_default_bank_account, company-assets bucket + storage policies); verify `pnpm db:reset` and `pnpm db:types` succeed
- [x] 1.2 SQL check seeds: 12 cost categories (Overhead Kantor is_overhead), 10 positions, 7 certificate types, 8 stages totalling 100, 9 item categories, 6 units, GDG-LMG location, one company profile and one parameters row with PRD defaults
- [x] 1.3 SQL check rules as roles: Finance can insert a supplier and a cost category but not a unit; HCM cannot read suppliers; Operasional reads suppliers but cannot insert; Marketing cannot insert a location; a client cannot insert a project-type location; changing a stage weight so the total is 105 fails with "Total bobot harus 100 (sekarang 105)"; Waspada ≥ Kritis is refused; a parameter change by Super Admin writes an audit entry

## 2. Master kit

- [x] 2.1 Run `pnpm exec shadcn add tabs switch textarea`; add `lib/master-data/entities.ts`, `schema.ts`, `queries.ts`, `actions.ts` and the error-code mapping in `lib/actions.ts`; verify `tsc` passes
- [x] 2.2 Add `components/master-data/*` (view, record dialog, delete dialog), the master-data layout with role tabs, index page, `[entity]` page and per-entity exports; verify as Finance: Supplier and Kategori Biaya tabs only, add "CV Sinar Baja", duplicate name refused, deactivate shows Nonaktif, export contains the list
- [x] 2.3 Verify as HCM: Jabatan and Jenis Sertifikat tabs; set TKBT Tingkat 2 required for Linesman/Pemanjat and see it listed; a certificate type without validity shows "Seumur hidup"; as Operasional: Supplier tab is read-only and Lokasi/Kategori/Satuan are editable; add warehouse GDG-TBN
- [x] 2.4 Verify deleting an unused cost category works, and that deleting a category referenced by a temporary SQL row is refused with the "sudah dipakai" message

## 3. Special editors

- [x] 3.1 Add the stage template editor; verify as Operasional that Sagging 20 + Clamping 10 saves, Jumper 10 alone shows the total error and does not save, and Finance cannot see the tab
- [x] 3.2 Add Profil Perusahaan (form, logo upload, bank accounts with default); verify as Super Admin: address change saved, a PNG logo uploads and a 3 MB file is refused, a second account made default leaves one default, PKP change appears in Log Audit; as Direktur the page is read-only
- [x] 3.3 Add Parameter Sistem (parameters form + document format editor); verify as Super Admin: backdate 3 → 5 saved and shown in Log Audit as "Batas input mundur: 3 → 5", Waspada 25 with Kritis 20 refused, invoice format without `{SEQ:n}` refused; as Direktur read-only

## 4. Print base

- [x] 4.1 Add the print route group, Letterhead, PrintPage, PrintToolbar, `@page` A4 and print light tokens, and `/print/letterhead`; verify the preview shows logo, name, address and NPWP, the Cetak button is hidden in print emulation, and dark theme prints dark-on-white

## 5. Integration

- [x] 5.1 Add the three Pengaturan menu items; run `pnpm lint` and `pnpm build`; confirm no server or console errors on the new pages

## Workflow follow-up

- Archive the change with `/opsx:archive` after verification.

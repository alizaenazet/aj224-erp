# Tasks: add-projects-contracts

## 1. Database

- [x] 1.1 Write migration `<ts>_projects_contracts.sql`: projects (code + location trigger, tender guard, status via function), project_contracts, project_addenda, project_terms, project_budgets, views `project_overview` / `project_term_list` / `project_category_costs` / `project_budget_summary`, functions `create_project` / `set_project_status` / `mark_term_ready`, attachment type `project` + bucket `project-files`, RLS, audit; add three dev projects to `supabase/seed.sql`; verify `pnpm db:reset` and `pnpm db:types`
- [x] 1.2 SQL check: codes and project locations created; contract value after addendum 01 = 10,5 M and a schedule-only addendum keeps it; term amounts follow it and total 100%; planned profit; Ditutup refused; a second project from the same tender and a project from a non-won tender refused; Overhead category refused in RAB
- [x] 1.3 SQL check access: Marketing/Finance create and edit, Super Admin/Direktur/Operasional read only, HCM reads projects but no contracts/terms/budget, Marketing no budget, Lapangan nothing; term status not client-writable; mark ready by Operasional notifies Finance once; contract documents hidden from HCM

## 2. Library and navigation

- [x] 2.1 Add `lib/projects/*`, audit labels/refs, attachment config for `project`, the Proyek → Daftar Proyek menu item and the `projects` export; verify `tsc` passes

## 3. Pages

- [x] 3.1 Add the project list (filters, export) and the create/edit pages with contract fields; "Buat Proyek" and the project link on the tender page; verify as Marketing: create from the won Kediri tender (prefilled, contract value from the bid), second creation not offered; as Finance create a direct project and filter Berjalan + client; export matches
- [x] 3.2 Add the project layout with header, status menu and tab nav, and the Ringkasan tab; verify as Operasional: Persiapan → Berjalan recorded in Riwayat; Ditutup not offered; as HCM only Ringkasan and Dokumen without values
- [x] 3.3 Add the Kontrak & Termin tab (contract dialog, addenda, terms with warning, mark ready); verify as Finance: addendum 01 → 10,5 M updates list and amounts, schedule-only addendum, 95% warning, manual term marked ready by Operasional notifies Finance
- [x] 3.4 Add the RAB & Biaya tab (editable per category, realization from the view, colors) and the Dokumen tab; verify as Finance: enter RAB and see totals and planned profit, Overhead not offered; Operasional uploads a BAP that HCM can open, HCM cannot see Kontrak files; Marketing has no RAB tab

## 4. Integration

- [x] 4.1 Run `pnpm lint` and `pnpm build`; confirm no server or console errors; check the project list and page at 375 px

## Workflow follow-up

- Archive the change with `/opsx:archive` after verification.

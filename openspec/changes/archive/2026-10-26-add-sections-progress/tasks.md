# Tasks: add-sections-progress

## 1. Database

- [x] 1.1 Write migration `<ts>_sections_progress.sql`: `project_stages` (template copy trigger on projects, deferred 100 total), `project_sections` (kms generated, delete guard), `section_progress`, `progress_updates`, views `section_progress_summary` / `project_progress`, `project_overview` with progress columns, `section_planned_progress`, `project_progress_curve`, functions `apply_stage_progress` / `update_section_progress` / `save_project_stages` / `check_progress_terms` / `check_term_dates` (registered daily check), term trigger, RLS, audit; seed sections and dated progress; verify `pnpm db:reset` and `pnpm db:types`
- [x] 1.2 SQL check formulas: S-03 = 35%; project progress weighted by kms; planned progress before/inside/after a schedule; deviation; curve rows for project 1 (weeks, actual null after today)
- [x] 1.3 SQL check rules as roles: Operasional updates progress (log row with source manual) and sections; Finance/Marketing read only and direct progress writes refused; HCM and Lapangan see nothing; weights ≠ 100 refused; section with progress not deletable; closed project refused; progress crossing a term's condition sets it Siap Ditagih by Sistem and notifies Finance once; a past-date term is set ready on save and by `check_term_dates`

## 2. Library, export and import

- [x] 2.1 Run `pnpm exec shadcn add progress chart`; add `lib/progress/*`, audit labels for sections and stages, the `project-progress` export (columns from `load`, `ExportButton` params) and the `sections` import template; allow Operasional on Impor Data; verify `tsc` passes

## 3. Pages

- [x] 3.1 Add the Seksi & Progres tab (tiles, matrix, section dialog, stage editor, progress dialog, log); verify as Operasional: add S-05 (kms auto), update progress with a note (log shows it), weights ≠ 100 refused in the editor, delete of a section with progress refused
- [x] 3.2 Add the curve, the Ringkasan progress card and the list Progres column; verify as Direktur: curve shows plan and actual, Ringkasan deviation matches the tab, list shows progress; as HCM no Seksi & Progres tab and no progress on Ringkasan
- [x] 3.3 Verify term automation in the browser as Operasional → Finance: raise progress past Termin 1's condition, the term shows Siap Ditagih (Sistem) and Finance has the notification
- [x] 3.4 Verify the matrix export and the Seksi Tarik import as Operasional: export rows and total match the tab; import two sections with one duplicate row (row error shown)

## 4. Integration

- [x] 4.1 Run `pnpm lint` and `pnpm build`; confirm no server or console errors; check the Seksi & Progres tab at 375 px

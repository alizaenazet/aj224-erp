# Tasks: add-daily-reports

## 1. Database

- [x] 1.1 Write migration `<ts>_daily_reports.sql`: `daily_reports`, `daily_report_activities`, `daily_report_obstacles`, FK on `progress_updates.daily_report_id`, functions `save_daily_report` / `review_daily_report` / `check_missing_daily_reports` (registered), views `daily_report_list` / `daily_report_obstacle_summary` / `missing_daily_reports`, attachment type `daily_report` with the 10-photo limit, updated `update_section_progress` (reason to lower) and `attendance_check` (`backdate_days`), RLS, audit; seed reports; verify `pnpm db:reset` and `pnpm db:types`
- [x] 1.2 SQL check as Lapangan and Operasional: report with activity updates progress (log source daily_report with report id) and terms; lower value refused; no-activity needs a reason; H−4 refused, revision allows edit; reviewed is locked; another project refused; Finance/HCM/Marketing see nothing; review with revision notifies the reporter; missing check notifies Operasional once; lowering on the progress tab without a note refused; attendance window follows `backdate_days`

## 2. Library, export and navigation

- [x] 2.1 Add `lib/daily-reports/*`, audit labels, attachment config `daily_report`, export `daily-reports`, menu items (Operasional → Laporan Harian, Lapangan → Laporan Harian), backdate parameter in field attendance; verify `tsc` passes

## 3. Pages

- [x] 3.1 Add the field form with local draft; verify at 375 px as Lapangan: send today's report with S-03 to 60% (matrix updates), reload keeps a draft, add two photos on the detail page, home shows the report sent
- [x] 3.2 Add the list (missing projects, filters, export), detail with review and the project tab with the obstacle recap; verify as Operasional: missing PRJ/AJ224/2026/003 listed, ask revision (Lapangan notified and edits), then mark reviewed (no more edits); obstacle recap counts; export matches
- [x] 3.3 Add the print layout; verify the report page and the photo page in print preview; Direktur can view and print, Finance is refused

## 4. Integration

- [x] 4.1 Run `pnpm lint` and `pnpm build`; confirm no server or console errors; check the field form and detail at 375 px

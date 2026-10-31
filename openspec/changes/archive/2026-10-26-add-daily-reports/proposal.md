# Proposal: add-daily-reports

## Why

Site teams send daily progress as WhatsApp photos, so the office rebuilds progress by hand, issues are noticed late and no record exists for the client report. This change adds the daily report from the field: weather, working hours, safety briefing, activities that update section progress, obstacles by category, plan for tomorrow and photos. It also adds the office review, a reminder for missing reports, and a printable A4 report for the main contractor.

## What Changes

- **Laporan harian (OPS-01, Wajib):**
  - One report per project per date with:
    - weather for morning, midday and afternoon (Cerah, Berawan, Hujan, Hujan Lebat);
    - effective working hours;
    - safety briefing/toolbox meeting (yes/no and number of participants);
    - activity lines (section, stage, cumulative progress after today, notes);
    - workforce (counted from that day's attendance), main equipment used, obstacles, plan for tomorrow, and photos (1–10).
  - "Tidak Ada Kegiatan" with a reason replaces the details on days without work.
  - Input is allowed up to H+3, using the system parameter `backdate_days` (assumption A5).
  - Section progress is updated when the report is sent; the progress log names the report.
  - Progress cannot go down through a report. Operasional lowers progress on the progress tab, and a reason is now required for that.
- **Kategori kendala (OPS-02, Wajib):**
  - Obstacles are recorded with a category (Cuaca, ROW/Lahan/Warga, Material Belum Datang, Alat Rusak, Izin Padam/Crossing, Tenaga Kerja, Lainnya) and a description.
  - A recap per category is shown per project.
- **Pemeriksaan laporan (OPS-03, Wajib):**
  - Operasional sees incoming reports and marks them Sudah Diperiksa, or asks for a revision with a comment; the reporter is notified.
  - Running projects without a report (or "Tidak Ada Kegiatan") for yesterday are listed for Operasional and notified each morning. The "Perlu Tindakan" home list comes with `add-dashboards`.
- **Cetak laporan harian (OPS-04, Wajib):** an A4 print layout with the letterhead: the report on one page, photos on attachment pages.
- **Draf lokal (UMM-12, Sebaiknya):** the field form keeps its input on the device until it is sent, so a reload or lost signal loses nothing.
- **Screens:**
  - Operasional → Laporan Harian (list, missing reports, detail, review).
  - Project tab Laporan Harian with the obstacle recap.
  - Lapangan home button and status for today's report.
- **Consistency fix:** field attendance also reads `backdate_days` instead of a fixed three days.

## Capabilities

### New Capabilities
- `daily-reports/reports`: Daily reports, obstacles, review, missing-report reminders, printing and local drafts.

### Modified Capabilities
- `projects/progress`: Progress from daily reports; lowering progress needs a reason.
- `hcm/attendance`: The entry window follows the `backdate_days` parameter.
- `dashboard/home`: The Lapangan home adds the daily report button and today's report status.

## Impact

- **Database:**
  - Tables `daily_reports`, `daily_report_activities` and `daily_report_obstacles`.
  - Functions `save_daily_report`, `review_daily_report` and `check_missing_daily_reports` (daily check).
  - Views `daily_report_list` and `daily_report_obstacle_summary`.
  - Attachment type `daily_report`.
  - `progress_updates.daily_report_id` gets its foreign key.
  - `update_section_progress` and `attendance_check` are updated.
  - RLS and seed.
- **App:**
  - `/operations/daily-reports` (list and `[id]` detail).
  - `/field/daily-reports/new` and `/field/daily-reports/[id]/edit`.
  - `/projects/[id]/reports`, `/print/daily-reports/[id]`.
  - Export `daily-reports`; menu Operasional → Laporan Harian and Lapangan → Laporan Harian.
- **Dependencies:** none.

## Out of scope

- Links from "alat utama" to tool records (`add-equipment-mobilization`): equipment is free text for now.
- Material usage on the report (`add-material-stock`).
- The "Perlu Tindakan" home lists of office roles (`add-dashboards`).
- Offline sending (PWA sync); only the local draft is kept.

## Open questions

- Report format required by the main contractor (PRD §19 Q6): the print layout follows the PRD fields until a sample arrives.

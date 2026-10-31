# Design: add-sections-progress

## Context

`add-projects-contracts` created projects, terms (with progress, date and manual conditions) and the internal `term_set_ready(term, by)` that notifies Finance. The stage template (`stage_templates`, MST-08) exists with weights that must total 100. Daily checks run through `scheduled_checks` and `run_daily_checks()`. Imports use the template engine in `lib/import`, and exports the registry in `lib/export/registry.ts`.

## Goals / Non-Goals

**Goals**
- Sections, per-project stages and stage progress with a log of every change and its source.
- One SQL definition of section progress, project progress, planned progress and deviation (§11.2), used by the tab, Ringkasan, the list, the curve and term automation.
- Automatic Siap Ditagih for progress and date terms.

**Non-Goals**
- Daily-report entry of progress (change 12 calls the same internal function with source `daily_report`).
- Lapangan visibility (change 11 adds project scoping to these policies).
- Health status (change 17).

## Decisions

### Tables (migration `…_sections_progress.sql`)
| Table | Columns | Rules |
|---|---|---|
| `project_stages` | project_id → projects (cascade), name, weight numeric(5,2) (> 0, ≤ 100), sort_order, timestamps | Unique (project_id, lower(name)). **Deferred constraint trigger:** a project's weights total 100 when it has stages. **AFTER INSERT trigger on `projects`** (security definer) copies the active `stage_templates` rows. Audit. |
| `project_sections` | project_id → projects (cascade), code (unique per project, case-insensitive), tower_from, tower_to, tower_count ≥ 0, length_km numeric(10,3) > 0, circuits int 1–4, **kms generated** = length_km × circuits, planned_start, planned_finish (≥ start), sort_order, notes, timestamps | Both planned dates required (the plan needs them). **Delete guard:** refused when any progress row of the section is > 0. Audit. |
| `section_progress` | (section_id, stage_id) PK, progress numeric(5,2) 0–100, updated_at, updated_by | Current values; a missing row means 0%. Cascades from sections and stages. **No client insert/update/delete.** |
| `progress_updates` | id identity, project_id, section_id, stage_id, old_progress, new_progress, source (`manual` / `daily_report`), daily_report_id uuid null (FK added by change 12), note, created_by, created_at default clock_timestamp() | The progress log. Insert only through functions; cascades from sections and stages. |

### §11.2 formulas (security invoker views and functions)
- **`section_progress_summary` (view):** section columns plus
  - `progress` = Σ(stage weight × progress) ÷ Σ stage weight, over the project's stages (missing progress = 0);
  - `planned_progress` = `section_planned_progress(planned_start, planned_finish, today_wib())`;
  - `state` = `not_started` (0), `in_progress`, `done` (100).
- **`section_planned_progress(start, finish, on)`** (immutable SQL): 0 before start, 100 on or after finish, else (on − start) ÷ (finish − start) × 100.
- **`project_progress` (view):** per project with sections: `total_kms`, `progress` = Σ(section progress × kms) ÷ Σ kms, `planned_progress` (same weighting), `deviation` = progress − planned (points).
- **`project_overview`** is replaced with the same columns plus `progress`, `planned_progress` (left join of `project_progress`; null for roles that cannot read sections, e.g. HCM).
- **`project_progress_curve(p_project)`** (security invoker, SQL): one row per week (Monday–Sunday) from the Monday of the earliest planned start to the Sunday after the latest planned finish (at least through this week): `week_end`, `planned` (plan at week_end), `actual` (for weeks ending on or before today; per section and stage the latest logged `new_progress` with created_at before the end of week_end in WIB, then the same weighting with the current stages and sections). Weeks after today have `actual` null.

### Functions
- **`apply_stage_progress(section, stage, progress, source, report, note, by)`** (internal, security definer, not callable through the API): no-op when unchanged; otherwise upserts `section_progress` and inserts the log row.
- **`update_section_progress(p_section uuid, p_progress jsonb, p_note text)`** (security definer): Operasional only; refuses closed projects, stages of another project and values outside 0–100; applies each `{stage_id, progress}`; then `check_progress_terms(project)`.
- **`save_project_stages(p_project uuid, p_stages jsonb)`** (security invoker, like `save_stage_template`): rows with id are updated, without id inserted, missing ones deleted (their progress cascades). RLS limits it to Operasional; the deferred trigger enforces the total. It then calls `check_progress_terms` through a definer wrapper.
- **`check_progress_terms(p_project)`** (internal, definer): for `not_due` terms with condition `progress` and condition_progress ≤ project progress, calls `term_set_ready(term, null)` (ready_by null = Sistem). Also called by an AFTER INSERT/UPDATE/DELETE row trigger on `project_sections` (kms or sections change the weighting).
- **`check_term_dates()`** (daily check, registered in `scheduled_checks`): `not_due` date terms with condition_date ≤ `today_wib()` → `term_set_ready(term, null)`.
- **Term trigger:** AFTER INSERT OR UPDATE OF condition_type, condition_progress, condition_date on `project_terms` (definer) evaluates that one term at once (progress already reached or date already passed).
- `term_set_ready` already dedupes the notification per term (`term-ready:<id>`).

### RLS (PRD §13: Seksi & progres L L L L — K K(P))
| Table | Read | Write |
|---|---|---|
| `project_stages` | Super Admin, Direktur, Marketing, Finance, Operasional | Operasional (insert/update/delete) |
| `project_sections` | same | Operasional (insert/update/delete) |
| `section_progress`, `progress_updates` | same | none (functions only) |

HCM and Lapangan get no policy. Change 11 adds Lapangan rows for assigned projects. Policies use `has_role(...)` and `is_active_user()` as in earlier changes.

### App structure
- **Labels/queries/actions:** `lib/progress/{labels,schema,queries,actions}.ts`.
  - Role constants: `PROGRESS_VIEW_ROLES` (SA, Dir, Mkt, Fin, Ops) and `PROGRESS_MANAGE_ROLES` (Ops).
  - Actions: `saveSection`, `deleteSection`, `saveProjectStages`, `updateSectionProgress`.
- **Tab `/projects/[id]/progress` (Seksi & Progres):**
  - Tiles: Progres aktual (with Progress bar), Rencana hari ini, Deviasi (points), Total kms.
  - Matrix card: Table of sections × stages; cell Badge `outline` (belum), `secondary` (berjalan), `success` (selesai); kms, section progress, plan. Footer total row. Actions for Operasional: Tambah seksi, Atur tahapan, Impor seksi (link to Impor Data); per row: Perbarui progres, Ubah, Hapus. Export button `project-progress`.
  - Dialogs: section form; stage editor (name, weight, order, remove; live total that must be 100); progress form (number input 0–100 per stage, note).
  - Curve card: shadcn Chart (Recharts LineChart) with planned (dashed, `--muted-foreground`) and actual (`--primary`) series; the theme's `chart-*` tokens are greys of similar lightness, so these two tokens keep the lines distinct in both themes.
  - Log card: last 50 log rows (time, section, stage, old → new, source, by, note).
- **Ringkasan:** Progres card (actual with Progress bar, planned, deviation) for progress roles.
- **List:** Progres column for progress roles.
- **Export:** `project-progress` with the project id as a parameter. Its columns depend on the project's stages, so the export definition may return columns from `load` (registry and route extended). `ExportButton` gains optional extra params.
- **Import:** template `sections` (roles: operations) with columns Kode Proyek*, Kode Seksi*, Tower Awal*, Tower Akhir*, Jumlah Tower, Panjang (km)*, Jumlah Sirkuit*, Rencana Mulai*, Rencana Selesai*, Catatan. The Impor Data menu and page allow Operasional.

### shadcn components
Existing: Card, Table, Badge, Button, Dialog, AlertDialog, DropdownMenu, Field, Input, InputGroup, Textarea, Empty, Alert, Tabs. New: `progress` and `chart` via `pnpm exec shadcn add progress chart`.

### Seed (dev)
- **Project 1 (Kediri – Pare, Berjalan):** sections S-01 … S-04 with schedules around today, so the plan is part-way. S-03 is 4,2 km × 2 circuits with Pulley 100%, Pilot Wire 100%, Konduktor 50% (= 35%, the PRD example). Other sections have mixed progress. Log rows are spread over past weeks so the curve has history.
- **Project 3 (Tuban, Berjalan):** one short section.
- Seed progress goes through `apply_stage_progress` with dated log rows.

## Risks / Trade-offs
- **Removing a stage deletes its progress:** the UI warns in the stage editor; the change is audited through `project_stages`.
- **Curve from current stages and sections:** if weights change later, past weeks are recomputed with the new weights. This keeps one definition; the log itself is unchanged.
- **Term automation fires on any progress increase:** a mistaken progress entry can set a term ready. Readiness is not reversed automatically; Finance simply does not invoice it, and a correction is visible in the log.
- **Weekly curve size:** a two-year project has about 105 points, computed on request.
- **Removals are not in the audit log:** the audit trigger records inserts and updates. A section can only be removed while it has no progress, and a removed stage's progress log rows go with it; the stage editor warns before saving.

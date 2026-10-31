# Design: add-projects-contracts

## Context

See proposal.md. Building blocks already in place:
- **Platform services:** `next_document_number('project', date)` (format `PRJ/AJ224/{YYYY}/{SEQ:3}`), `locations` (clients may insert warehouses only), `cost_categories` (with `is_overhead`), the audit trigger, `notify_roles`.
- **Attachments:** functions and `attachment_bucket`.
- **Tenders:** `tenders` (status `won`).
- **UI kit:** the list kit, `DatePicker`, `RupiahInput`, `list_people`.

## Goals / Non-Goals

**Goals:**
- One project record with a stable code and its own location.
- Contract numbers that always reflect the latest addendum, from one SQL view.
- Payment terms whose amounts follow the contract value.
- A project page shell that later changes extend with tabs.

**Non-Goals:**
- Progress and automatic term readiness (change 10).
- Invoices (change 15).
- Cost sources (changes 16, 19).
- Health and closing (change 17).
- Lapangan scoping (change 11).

## Decisions

### Tables (migration `…_projects_contracts.sql`)
| Table | Key fields | Notes |
|---|---|---|
| `projects` | code (unique; set by trigger when null), name, client_id → clients (restrict), tender_id → tenders (unique, restrict), end_owner, site, voltage_kv (150/275/500), length_kms ≥ 0, tower_count ≥ 0, start_date, target_finish_date (≥ start), status (`preparing`/`running`/`on_hold`/`completed`/`closed`, default `preparing`), location_id → locations (unique, set by trigger), notes, created_by, timestamps | **BEFORE INSERT trigger** (security definer): sets the code from `next_document_number('project', coalesce(start_date, today_wib()))` and inserts the project location. The location code is the project code with non-alphanumerics → `-`, upper case, 20 chars max. **Tender guard:** the tender must be `won` and belong to the same client. Audit. Delete revoked. `status` is not client-updatable (column grants); it changes through `set_project_status`. |
| `project_contracts` | project_id pk (cascade), contract_no, contract_date, contract_value ≥ 0, ppn_applicable (default true), maintenance_months 0–120, scope, timestamps | Audit. |
| `project_addenda` | project_id, addendum_no (unique per project), addendum_date, new_value ≥ 0 (nullable), new_finish_date (nullable), description, created_by, created_at | Check: new_value or new_finish_date is set. Insert-only (update/delete revoked). Audit on insert. |
| `project_terms` | project_id, sort_order, name, kind (`down_payment`/`progress`/`retention`), percent (0 < p ≤ 100) xor amount (≥ 0), condition_type (`progress`/`date`/`manual`), condition_progress (0–100, required for progress), condition_date (required for date), status (`not_due`/`ready`/`invoiced`/`paid`), ready_at, ready_by, notes, timestamps | Clients cannot update status, ready_at or ready_by (column grants). Delete only while `not_due` (trigger). Audit. |
| `project_budgets` | project_id, cost_category_id → cost_categories (restrict), amount ≥ 0, notes, timestamps; unique (project, category) | A trigger refuses Overhead Kantor ("Kategori overhead tidak dipakai di RAB proyek"). Audit. |

### One definition of the contract numbers (security invoker views)
- **`project_overview`:**
  - Columns: project columns, client name, contract_no, ppn_applicable, maintenance_months, `base_contract_value`, `contract_value` (latest addendum with `new_value` by addendum_date then created_at, else the contract value), `finish_date`, `addendum_count`.
  - For roles without contract access (HCM) the contract columns are null, because the joined tables are filtered by RLS.
  - `finish_date` is stored on `projects` (not client-writable) so HCM, who cannot read addenda, sees the same date. A BEFORE INSERT/UPDATE OF target_finish_date trigger and an AFTER INSERT trigger on addenda with a new finish date set it to the latest addendum's `new_finish_date` (by addendum_date then created_at), else target_finish_date. Changes are audited with the project.
- **`project_term_list`:** term columns plus `amount_value` = amount, or round(percent × contract_value ÷ 100, 2).
- **`project_category_costs`:** (project_id, cost_category_id, amount). Defined now as an empty `select … where false`. The finance changes replace it with the real union of cost sources (§11.3), so the RAB tab never changes.
- **`project_budget_summary`:** per project, total RAB, contract value and planned profit. Used by Ringkasan and the list.

### Functions
- **`create_project(p_project jsonb, p_contract jsonb)`** (security invoker): inserts the project and its contract in one transaction and returns the id. RLS applies, so only Marketing or Finance succeed.
- **`set_project_status(p_project uuid, p_status text)`** (security definer):
  - Only `finance`/`operations` may call it.
  - `closed` is refused ("Penutupan proyek memerlukan checklist penutupan."); change 17 replaces this function.
  - The status update fires the audit trigger with the caller as actor.
- **`mark_term_ready(p_term uuid)`** (security definer):
  - Only `finance`/`operations` may call it, and the term must be `not_due`.
  - It sets status, ready_at and ready_by.
  - It calls `notify_roles('{finance}', 'term', 'Termin siap ditagih', '<kode> · <nama termin> · <Rp>', '/projects/<id>/contract', 'term-ready:<id>')`.
  - Change 10 reuses its internals for automatic readiness.

### RLS (PRD §13)
- **projects:**
  - select: `super_admin`, `director`, `marketing`, `finance`, `hcm`, `operations`
  - insert/update (non-status columns): `marketing`, `finance`
- **project_contracts, project_addenda, project_terms:**
  - select: `super_admin`, `director`, `marketing`, `finance`, `operations`
  - insert/update: `marketing`, `finance`
  - delete: terms only (guarded)
- **project_budgets:**
  - select: `super_admin`, `director`, `finance`, `operations`
  - write: `finance`, `operations`
- **Attachments:** `project` maps to bucket `project-files` (private, 10 MB).
  - read: the project is visible, and category `contract`/`addendum` additionally needs a contract role
  - write: `marketing`, `finance`, `operations`, with category in (`contract`, `addendum`, `bap`, `bast`, `drawing`, `permit`, `correspondence`, `other`)

### App structure
- **`lib/projects/`:**
  - `labels.ts`: statuses, term kinds/conditions/statuses, document categories, role lists.
  - `schema.ts`: project, contract, addendum, term, budget rows.
  - `queries.ts`: list from `project_overview`, project, terms, addenda, budget lines with realization, options.
  - `actions.ts`: create (RPC), update, status, contract save, add addendum, term CRUD, mark ready, save budget lines.
- **Routes:**
  - `/projects` (list; readers above).
  - `/projects/new` (Marketing/Finance; `?tender=<id>` prefills from a won tender).
  - `/projects/[id]/edit`.
  - `/projects/[id]` with `layout.tsx`: the header and tab nav sit inside Suspense; tabs are links, active by pathname.
    - `page.tsx` (Ringkasan).
    - `contract/page.tsx` (contract card, addenda, terms).
    - `budget/page.tsx`.
    - `documents/page.tsx`.
  - The tab list is filtered by role.
- **Tender page:**
  - A won tender without a project shows "Buat Proyek" (Marketing) → `/projects/new?tender=<id>`.
  - A tender with a project shows a link to it.
- **Project header:** code, name, client, status badge, tender link. Actions: Ubah (Mkt/Fin), status menu (Fin/Ops), Riwayat (SA/Dir).
- **Navigation:** Proyek → Daftar Proyek (`FolderKanbanIcon`).
- **Export:** `projects`.

### shadcn components
Existing components only: Card, Table, Badge, Button, Dialog, AlertDialog, DropdownMenu, Field, Input, InputGroup, Select, Textarea, Switch, Tabs (TabsTrigger as links for the tab nav), Empty, Alert. No new primitives.
- **Status colors:** the RAB % Terpakai bands and the terms warning need yellow and green. This change adds `--warning` and `--success` theme tokens (light and dark) in `app/globals.css`, Badge variants `warning`/`success` and an Alert variant `warning`; % Terpakai uses `secondary` (normal), `warning` (≥ 80%) and `destructive` (> 100%). Certificate "Segera Kedaluwarsa" moves to the `warning` variant too.

### Seed (dev; relative dates)
- **Project 1:** from won tender "Stringing SUTT 150 kV Kediri – Pare" (status Berjalan).
  - Contract Rp 10.000.000.000 with PPN; addendum 01 → Rp 10.500.000.000.
  - Terms: Uang Muka 20%, Termin 1 35% at ≥ 50%, Termin 2 40% at ≥ 100%, Retensi 5% on a date.
  - RAB Rp 9.000.000.000 over categories.
- **Project 2:** from won tender "Pembangunan SUTET 500 kV Paiton – Grati Seksi 2" (Persiapan).
- **Project 3:** direct, "Perbaikan Tower SUTT 150 kV Tuban" (Berjalan), one Manual term.

## Risks / Trade-offs
- **`project_category_costs` is empty until the finance changes:** realization shows 0 meanwhile. This is intended; the column is final.
- **Column grants for status fields:** they keep status changes in audited functions. The functions are the only writers, so later automation (change 10) reuses them.
- **The location code is derived from the project code:** a custom number format longer than 20 characters is truncated. Uniqueness is still enforced; a collision would surface as a clear error.

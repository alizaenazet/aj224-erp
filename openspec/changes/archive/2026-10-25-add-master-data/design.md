# Design: add-master-data

## Context

See proposal.md. Available building blocks:
- RLS helpers `has_role()` and `current_app_role()`; the audit trigger `audit_row_change(key_column)`; `document_types`.
- The list kit: `DataTable`, toolbar, `SelectFilter`, export registry, `lib/list/params`.
- The page conventions in `openspec/config.yaml`: Suspense per page, `connection()`, `ActionResult`.

## Goals / Non-Goals

**Goals:**
- One config-driven kit for the seven simple master lists, so each is a config entry instead of a hand-built page.
- Special editors only where the rules need them: stage weights (total 100), company profile, parameters.
- The print base.

**Non-Goals:** project locations, per-project stages, consumers of parameters.

## Decisions

### Tables (migration `…_master_data.sql`)
| Table | Key fields | Notes |
|---|---|---|
| `company_profile` | `id boolean pk default true check (id)`, name, address, phone, email, npwp, is_pkp (default false), logo_path | single row, seeded "UD. AJ224" / "Lamongan, Jawa Timur"; audit trigger |
| `company_bank_accounts` | bank_name, account_number, account_holder, is_default, is_active | partial unique index on `is_default` where true; `set_default_bank_account(id)` (invoker) |
| `suppliers` | name, category (check list), contact_name, phone, email, address, npwp, bank_name, bank_account_number, bank_account_holder, payment_term_days (≥0, default 30), notes, is_active | unique `lower(name)` |
| `locations` | code (unique), name, type (`warehouse`/`project`), address, is_active | seed GDG-LMG Gudang Lamongan; clients may only insert `warehouse` |
| `cost_categories` | code (unique), name (unique lower), is_overhead, is_active, sort_order | 12 PRD seeds; later cost tables reference with `on delete restrict` |
| `certificate_types` | name (unique lower), validity_months (null = lifetime, >0), description, is_active | 7 seeds |
| `positions` | name (unique lower), is_active, sort_order | 10 seeds |
| `position_required_certificates` | position_id, certificate_type_id (pk both, cascade on position) | seeded starting map (Q10), `set_position_required_certificates(position, ids[])` (invoker) |
| `stage_templates` | name (unique lower), default_weight numeric(5,2) > 0, sort_order, is_active | 8 seeds; deferred constraint trigger: active weights total 100, message `Total bobot harus 100 (sekarang N)`; `save_stage_template(jsonb)` (invoker) upserts and deletes in one transaction |
| `item_categories` | kind (`tool`/`material`), name, is_active | unique (kind, lower(name)); seeds |
| `units` | code pk, name, is_active | seeds m, kg, pcs, set, drum, liter |
| `system_parameters` | single row; backdate_days, cert_expiry_warning_days, health_warning_points, health_critical_points, ppn_rate, standard_work_hours, monthly_salary_divisor | CHECK bounds from the spec; audit trigger |

`updated_at` triggers are on every table with that column. `document_types` also gets the audit trigger (key `code`).

### RLS (PRD §13)
- **Helper:** `public.is_active_user()` returns `current_app_role() is not null`.
- **Reads:** company_profile, bank accounts, locations, cost categories, positions, certificate types, requirements, stages, item categories, units and system_parameters are readable by every active user, because forms everywhere need them. Suppliers are readable by `super_admin`, `director`, `finance` and `operations`.
- **Writes (insert/update/delete):**
  - company profile, bank accounts, parameters, document_types → `super_admin`
  - suppliers, cost categories → `super_admin`, `finance`
  - positions, certificate types, requirements → `super_admin`, `hcm`
  - locations, stages, item categories, units → `super_admin`, `operations`
- **Locations:** the client insert check requires `type = 'warehouse'`.
- **Storage:** bucket `company-assets` (private, 1 MB, png/jpeg/webp). Active users may read; `super_admin` may insert, update and delete.

### Error mapping
`dbErrorMessage` (lib/actions.ts) gains:
- `23503` (FK restrict): "Data sudah dipakai sehingga tidak dapat dihapus. Nonaktifkan saja."
- `23514` (check): "Nilai di luar batas yang diizinkan."
- `P0001` messages already pass through, e.g. the stage-total message.

### Config-driven master kit
- **`lib/master-data/entities.ts`** (client-safe) holds one `MasterEntity` per key: `suppliers`, `locations`, `cost-categories`, `positions`, `certificate-types`, `item-categories`, `units`. Each entry has:
  - table, select, title, singular label, description
  - `viewRoles` / `manageRoles`, plus an optional `deleteRoles` override
  - `fields` (text, email, textarea, number, select, switch, certificates), each with label, required, bounds and options, and `list` / `format` for list columns
  - `searchColumns`, optional `filter` (param + options, e.g. kind), `orderBy`, `exportFileBase`
- **`lib/master-data/schema.ts`** builds a zod schema from `fields`. The client form and the server action share it.
- **`lib/master-data/queries.ts`** (server) has `queryMaster(entity, params, { page })`: search `or(ilike…)`, `status` (active/inactive), the entity filter, and ordering.
- **`lib/master-data/actions.ts`** (server) has `saveMasterRecord(key, id | null, values)`, `setMasterRecordActive(key, id, active)` and `deleteMasterRecord(key, id)`. They run `assertRole(entity.manageRoles)` and zod, then write through the user's client so RLS still applies. Positions then call `set_position_required_certificates`.
- **Export:** `lib/export/registry.ts` generates one export per entity (`master-<key>`) from its list fields plus Status.
- **UI:**
  - `components/master-data/master-data-view.tsx`: toolbar (search, status, entity filter, export, "Tambah …" when allowed), `DataTable` (columns from config plus row actions Ubah / Nonaktifkan / Aktifkan / Hapus), `MasterRecordDialog` (RHF + zod fields: Input, Textarea, Select, Switch, a Checkbox list for certificates) and `AlertDialog` for delete.
- **Routes:**
  - `app/(app)/settings/master-data/layout.tsx`: tab navigation (shadcn Tabs whose triggers are links) inside Suspense, filtered by the role's `viewRoles`.
  - `page.tsx`: cards linking to the tabs the role can use.
  - `[entity]/page.tsx`: the generic view, with `generateStaticParams` for the 7 keys; unknown keys 404.
  - `stages/page.tsx`: the stage editor.

### Special editors
- **Stage template (`/settings/master-data/stages`):** one form listing all stages in order (name, weight, active, move up/down, add row, remove row) with a live total that turns into an error message when it isn't 100. "Simpan" calls `save_stage_template(jsonb)`; the deferred trigger has the final say.
- **Profil Perusahaan (`/settings/company`):**
  - A profile form (disabled for Direktur).
  - Logo upload: client-side type and size check, browser upload to `company-assets/logo/<timestamp>.<ext>`, then `setCompanyLogo(path)`. The previous logo object is removed.
  - Bank accounts as a small DataTable with Dialog add/edit, "Jadikan utama" (`set_default_bank_account`) and activate/deactivate.
  - "Pratinjau Kop Surat" link.
- **Parameter Sistem (`/settings/parameters`):** a parameters form (zod bounds matching the DB checks, disabled for Direktur) and a document formats table with an edit Dialog (format must match `{SEQ:n}`; reset period select).

### Print base (UMM-05)
- **Route group `app/(print)/`:** layout without the app shell. `PrintToolbar` (client) has "Cetak" (`window.print()`) and "Kembali", is `print:hidden` and requires an active profile.
- **`components/print/letterhead.tsx`** (server) reads `company_profile` and signs the logo URL for 10 minutes. It renders the logo (plain `img`, because the signed URL is dynamic), name, address, contact and NPWP, then a Separator.
- **`components/print/print-page.tsx`:** A4-width container (`max-w-[210mm]`, print: no shadow or margins).
- **`globals.css`:**
  - `@page { size: A4; margin: 15mm; }`.
  - `@media print` re-declares the light theme tokens under `.dark`, so printouts are always dark-on-white.
  - These are theme variables, so they're allowed by the shadcn-only rule.
- **Preview:** `/print/letterhead` for `super_admin` and `director`, linked from Profil Perusahaan.

### Navigation
Pengaturan gets:
- Profil Perusahaan: `super_admin`, `director`.
- Master Data: `super_admin`, `director`, `finance`, `hcm`, `operations`.
- Parameter Sistem: `super_admin`, `director`.

## Risks / Trade-offs

- [The config-driven kit hides per-entity quirks] → Special editors cover the rules that don't fit (stage totals, company profile, parameters). The config supports per-field bounds and filters.
- [Seeded certificate requirements and validities may not match client practice (Q10)] → They are editable by HCM and flagged in the proposal.
- [A deferred trigger only reports at commit] → `save_stage_template` runs as one RPC call, so the error comes back from that call. The UI also blocks totals other than 100 before sending.

## Migration Plan

One migration, with seeds included (they are production defaults, not dev data). Hosted: the storage bucket is created by the migration. Rollback means dropping the tables and bucket, before any module references them.

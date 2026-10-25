# Design: add-clients-tenders

## Context

See proposal.md. Building blocks already in place:
- **RLS helpers:** `has_role`, `is_active_user`, `today_wib`.
- **Platform services:** audit trigger, `notify_roles` / `notify_user` with dedupe, `scheduled_checks`, attachments (functions plus `attachment_bucket`), `format_date_id`.
- **List kit and UI:** list kit with exports, `DatePicker`, `RupiahInput`.
- **Profiles RLS:** only Super Admin and Direktur read other profiles, so Marketing cannot list PIC names directly.

## Goals / Non-Goals

**Goals:**
- §11.1 numbers (margin, weighted value, win rates) defined once in SQL.
- Bid revisions captured by the database, so no client can skip them.
- A priority list that is the default view of Tender.

**Non-Goals:**
- Projects (MKT-09) and the home page.
- Import.
- Charts: analytics are tables now; the chart component comes with `add-dashboards`.

## Decisions

### Tables (migration `…_clients_tenders.sql`)
| Table | Key fields | Notes |
|---|---|---|
| `clients` | name (unique `lower(btrim)`), kind (`epc`/`bumn`/`pln`/`private`), address, npwp, payment_term_days (0–365, default 30), notes, is_active, created_by, timestamps | audit (insert, update) |
| `client_contacts` | client_id (cascade), name, position, phone, email, notes, timestamps | — |
| `tenders` | name, client_id (restrict), end_owner, location, voltage_kv (150/275/500, nullable), length_kms numeric(10,2) ≥ 0, tower_count ≥ 0, scope, info_date, bid_deadline date, bid_value numeric(16,2) ≥ 0, estimated_cost numeric(16,2) ≥ 0, pic_id → profiles, win_probability 0–100, status, closed_date, lost_reason, lost_note, winner_name, winner_price, notes, `bid_revision_note` (transient), created_by, timestamps | See the computed columns and checks below. Audit (insert, update). Delete revoked. |
| `client_activities` | client_id (cascade), tender_id → tenders (set null; must belong to the client, checked by trigger), activity_date, kind (`visit`/`call`/`meeting`/`other`), notes (required), follow_up_date, follow_up_done_at, owner_id default `auth.uid()`, timestamps | — |
| `tender_bid_revisions` | tender_id (cascade, deferrable), revised_at (default `clock_timestamp()`), old_value, new_value, note, revised_by | Written only by the tender trigger (security definer); readable like tenders. `clock_timestamp()` keeps several revisions in one transaction (insert, then edit) in order. |

**`tenders` computed columns** (generated, stored):
- `planned_margin` = (bid − cost) ÷ bid × 100, rounded to 2 decimals; null unless bid > 0 and cost is set.
- `weighted_value` = bid × win_probability ÷ 100.

**`tenders` checks:**
- `closed_date` is set exactly when the status is `won`, `lost` or `cancelled`.
- `lost_reason` is required when the status is `lost`, and allowed only then.
- `winner_name` and `winner_price` are allowed only for `lost`.

### Triggers
- **`tenders_bid_revision`** (BEFORE INSERT OR UPDATE OF bid_value, security definer):
  - When bid_value changes (or is set on insert), insert a revision with old and new values, `new.bid_revision_note` and `auth.uid()`.
  - Then clear `new.bid_revision_note`, so the note is per revision and never stored on the tender.
- **`tenders_status_guard`** (BEFORE UPDATE OF status or BEFORE INSERT):
  - A closed_date in the future is refused ("Tanggal penutupan tidak boleh melewati hari ini").
  - When the status becomes active again, the trigger clears closed_date, lost_reason, lost_note, winner_name and winner_price.
- **`client_activities_tender_guard`:** the tender must belong to the activity's client.

### Numbers (PRD §11.1) — database functions, security invoker
- **`client_tender_stats` (view):** per client: tender count, won/lost counts and values, `win_rate_count` and `win_rate_value` (null when there is no won or lost tender). All-time; used by the client list and page and the priority list.
- **`tender_win_stats(p_from date, p_to date)`:** rows per dimension `all` / `client` / `voltage` with key, label, won/lost counts and values, and both win rates, for tenders closed in [from, to].
- **`tender_lost_reasons(p_from, p_to)`:** reason, count, value.
- **`tender_pipeline()`:** per active status: count, Σ bid value, Σ weighted value.
- The UI formats the rates; it never computes them. The tender form shows no margin or weighted-value preview; both appear on the tender page after saving.

### People names
`list_people(p_roles app_role[] default null)` is security definer. It requires an active caller and returns `id, full_name, role` of active profiles, optionally filtered by role. It is used for the PIC picker (Marketing) and to show PIC and activity-author names. Profiles RLS stays as it is.

### Reminders (daily checks)
- **`check_tender_deadlines()`:** for tenders in `prospect`/`preparing` with `bid_deadline = today + 3` or `today + 1`, call `notify_roles('{marketing}', 'tender', 'Batas penawaran N hari lagi', '<paket> · <klien> · batas <tanggal>.', '/marketing/tenders/<id>', 'tender-deadline-<N>:<id>:<deadline>')`.
- **`check_client_followups()`:** for open follow-ups with `follow_up_date ≤ today`, call `notify_user(owner, 'follow_up', 'Tindak lanjut jatuh tempo', '<klien> · <tanggal>: <catatan singkat>', '/marketing/follow-ups', 'follow-up:<id>:<date>')`.
- Both are registered in `scheduled_checks` with execute revoked from API roles.

### RLS (PRD §13)
- **clients, client_contacts:**
  - select: `super_admin`, `director`, `marketing`, `finance`, `operations`
  - write: `super_admin`, `marketing`
- **client_activities:**
  - select: as clients
  - insert: `super_admin`, `marketing` with `owner_id = auth.uid()`
  - update/delete: the owner or `super_admin`
- **tenders:**
  - select: as clients
  - insert/update: `marketing`
  - delete: revoked
- **tender_bid_revisions:** select as tenders; no client writes.
- **Views and functions:** security invoker, so they follow these policies. HCM and Lapangan see nothing.
- **Attachments:** `tender` maps to bucket `marketing-files` (private, 10 MB, pdf/jpeg/png/xlsx).
  - read: the tender is visible
  - write: `marketing`, with category in (`rks`, `boq`, `offer_letter`, `other`)
  - Storage policies for the new bucket use `can_access_attachment_path`.

### App structure
- **`lib/clients/`:** labels (kinds, activity kinds), schema (client, contact, activity), queries (list with stats, detail, contacts, activities, follow-ups, options), actions (save/delete client, contact CRUD, activity CRUD, mark follow-up done).
- **`lib/tenders/`:** labels (statuses, lost reasons, voltages, urgency helper), schema (tender, status change), queries (priority list, detail, revisions, people), actions (create/update tender with revision note, change status).
- **`lib/tenders/analytics.ts`:** calls the three functions.
- **Routes:**
  - `/marketing/clients`, `/marketing/clients/new`, `/marketing/clients/[id]` (tabs Ringkasan, Kontak, Aktivitas, Tender), `/marketing/clients/[id]/edit`
  - `/marketing/follow-ups`
  - `/marketing/tenders` (default status filter "aktif", sort weighted value desc), `/marketing/tenders/new`, `/marketing/tenders/[id]`, `/marketing/tenders/[id]/edit`
  - `/marketing/tender-analytics`
- **Tender page:**
  - Header: status badge, Mendesak label, and Ubah, Ubah Status and Riwayat actions.
  - Cards: data (margin, weighted value), revision history, documents (AttachmentList) and the tender's activities.
- **Navigation:** Marketing → Klien (`Building2Icon`), Tender (`FileTextIcon`), Analitik Tender (`ChartColumnIcon`), for SA, Dir, Mkt, Fin, Ops.
- **Exports:** `clients`, `tenders`, `follow-ups`.

### shadcn components
Existing components only: Card, Tabs, Table, Badge, Button, Dialog, AlertDialog, Field, Input, InputGroup, Textarea, Select, Popover + Calendar, Command, DropdownMenu, Empty, Skeleton, Alert, Separator.

### Seed (dev; dates relative to the reset day)
- **Clients:** 6, one per type plus extras, with contacts.
- **Tenders:** 10 across all statuses and voltages, with:
  - deadlines at +3, +1 and +5 days (urgent);
  - won and lost tenders closed this year and last year, with reasons;
  - a cancelled tender;
  - two bid revisions on one tender.
- **Activities:** follow-ups due today, overdue and in the future.

## Risks / Trade-offs
- **Transient `bid_revision_note` column:** it carries the revision note through the trigger. It is always null at rest, which is simpler than a separate RPC.
- **Generated columns:** they keep §11.1 in one place. Changing the formula later needs a migration.
- **`list_people` exposes names and roles of active staff to any active user.** That is acceptable inside one company and needed for PIC and author names.

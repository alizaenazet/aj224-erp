# Design: add-platform-services

## Context

See proposal.md. The `access-control` capability provides `profiles`, `has_role()` and the app shell. Conventions are in `openspec/config.yaml`:
- Pages wrap their data in Suspense.
- `lib/supabase/server.ts` calls `connection()`.
- Server actions return `ActionResult`.
- RLS is on every table.

## Goals / Non-Goals

**Goals:** reusable database services with a one-line opt-in per table (an audit trigger, a delete guard, a numbering call, notify calls, check registration), and the first UI on top of them (bell, Notifikasi, Log Audit, Riwayat).

**Non-Goals:** attachments, email, realtime, editing number formats in the UI.

## Decisions

### Shared helpers
`public.today_wib()` (STABLE) returns `(now() at time zone 'Asia/Jakarta')::date`. Every date rule uses it instead of `current_date`.

### Audit log
**Table `audit_log`:**
- `id` identity, `table_name`, `record_id text`.
- `action` in (`insert`, `update`, `cancel`, `override`).
- `actor_id` (nullable, profiles, on delete set null), `created_at`.
- `old_values` / `new_values` jsonb holding only the changed fields, plus `changed_fields text[]` and `reason`.
- Index on (`table_name`, `record_id`, `created_at desc`).

**Trigger function `audit_row_change()`** (SECURITY DEFINER), attached `AFTER INSERT OR UPDATE`:
- The record key is `to_jsonb(NEW) ->> coalesce(TG_ARGV[0], 'id')`.
- Updates compare old and new JSON per key, ignoring `updated_at`, and are skipped when nothing changed.
- An update that sets `cancelled_at` from null logs `cancel` with `reason = NEW.cancel_reason`.
- The actor is `auth.uid()` (null means Sistem).

**`log_audit_event(table, record_id, action, reason, data)`** (SECURITY DEFINER) records explicit events such as overrides. Execute is revoked from client roles; module functions call it.

**RLS:** select for `has_role('super_admin','director')`. No insert, update or delete grants for clients.

**First audited table: `profiles`.**
- The invite action now inserts the profile with the signed-in client, so `auth.uid()` is the inviter.
- That needs an INSERT policy for `has_role('super_admin')` and `grant insert (id, full_name, email, role)`.
- The Auth Admin invite call still uses the service role.

**UI:**
- `components/audit/audit-history-sheet.tsx` is a Sheet. It loads entries for (table, id) through the server action `getRecordHistory`, which runs `assertRole(['super_admin','director'])` and reads under RLS.
- `lib/audit/labels.ts` maps table and field names to Indonesian labels; modules extend it.
- Pengguna & Peran gets a "Riwayat" action for Super Admin and Direktur.
- `/settings/audit-log` is a server page: Select filter by table, 50 rows per page through the `?table=&page=` search params, and shadcn Pagination.

### Notifications
**Table `notifications`:**
- `id`, `recipient_id` (profiles, cascade), `category`, `title`, `body`, `link`, `dedupe_key`, `created_at`, `read_at`.
- `unique (recipient_id, dedupe_key)`; index on (`recipient_id`, `read_at`, `created_at desc`).

**Functions (SECURITY DEFINER, execute revoked from client roles):**
- `notify_user(recipient, category, title, body, link, dedupe_key)` inserts with `on conflict do nothing`, and skips inactive profiles.
- `notify_roles(roles app_role[], …)` loops over active profiles holding those roles.

**RLS:**
- select: own rows.
- update: own rows, with a column grant on `read_at` only.
- No insert or delete for clients.

**UI:**
- `NotificationBellLoader` (server, inside Suspense in the header) fetches the unread count and the latest 10.
- `NotificationBell` (client) is a Popover with Badge count, a list, "Tandai semua dibaca" and "Lihat semua". Choosing an item calls `markNotificationRead(id)`, then `router.push(link)`.
- `/notifications` is a paginated list (50 per page).
- Actions live in `lib/notifications/actions.ts`; the bell updates through `router.refresh()`.

### Document numbering
**Table `document_types`:**
- `code` pk (`tender`, `project`, `invoice`, `delivery_note`, `incident`), `label`, `format`, `reset_period` (`month` | `year` | `never`).
- Seeded with the defaults: `TND/AJ224/{YYYY}/{SEQ:3}` (year), `PRJ/AJ224/{YYYY}/{SEQ:3}` (year), `INV/AJ224/{YYYY}/{MM}/{SEQ:3}` (month), `SJ/AJ224/{YYYY}/{MM}/{SEQ:3}` (month), `K3/AJ224/{YYYY}/{SEQ:3}` (year).
- RLS: all authenticated may select; `has_role('super_admin')` may update (UI in MST-10).

**Table `document_sequences`:** (`doc_type`, `period_key`) pk, `last_value`. No client access.

**`next_document_number(code, doc_date date default today_wib())`** (SECURITY DEFINER):
- The period key is `YYYY-MM`, `YYYY` or `all`.
- It runs an atomic `insert … on conflict do update set last_value = last_value + 1 returning`; the row lock serializes concurrent callers, so there are no duplicates.
- It renders the tokens with `regexp_replace` and `lpad`.
- Execute is revoked from client roles. Module insert triggers call it.

### Record cancellation
- **`prevent_hard_delete()` trigger function** raises `Data transaksi tidak dapat dihapus. Gunakan Batal dengan alasan.` Transaction tables attach it `BEFORE DELETE`. DELETE grants are also revoked from clients on those tables.
- **Column convention** for transaction tables: `cancelled_at timestamptz`, `cancelled_by uuid references profiles`, `cancel_reason text`, plus `check (cancelled_at is null or length(btrim(cancel_reason)) > 0)`. Reporting views filter `cancelled_at is null`. The audit trigger logs the cancellation.
- The UI pieces (CancelDialog, "Batal" Badge) arrive with the first transaction module, which is the first place they can be exercised.

### Scheduled checks
- **pg_cron:** `create extension if not exists pg_cron`.
- **Tables:**
  - `scheduled_checks`: `name` pk, `function_name regprocedure`, `description`, `enabled`, `sort_order`.
  - `job_runs`: identity, `check_name`, `started_at`, `finished_at`, `status`, `message`.
  - Both have RLS: select for `has_role('super_admin')`; no client writes.
- **`run_daily_checks()`** (SECURITY DEFINER) loops over enabled checks in order. For each it inserts a `running` row, `EXECUTE format('select %s', function_name)`, and marks it `success`. Inside a `BEGIN … EXCEPTION` block it marks `failed` with `SQLERRM`.
- **Schedule:** `cron.schedule('aj224-daily-checks', '0 23 * * *', 'select public.run_daily_checks()')`, which is 23:00 UTC = 06:00 WIB. The email digest (UMM-07) runs at 07:00 WIB later.
- **Registration:** modules insert into `scheduled_checks` in their migration.

### Navigation
Pengaturan gets "Log Audit" (`/settings/audit-log`, roles `super_admin`, `director`). Notifikasi is reached from the bell, not the menu.

## Risks / Trade-offs

- [Audit volume grows over time] → Only opted-in tables are audited, and only changed fields are stored. The (table, record) index keeps history lookups fast. Archiving is a v2 concern.
- [Dynamic EXECUTE in the runner] → `function_name` is a `regprocedure`, so only existing functions can be registered, and only migrations can write the table.
- [The cron job runs as the postgres role] → Check functions are SECURITY DEFINER and use `today_wib()`. Notifications created by checks have no actor.
- [Number formats can be edited later] → Existing documents keep their stored number. The sequence continues per period key regardless of format text.

## Migration Plan

1. One migration `…_platform_services.sql` adds all objects, the profiles audit trigger and insert policy, the seeded document types and the cron schedule.
2. Hosted: pg_cron must be enabled (Supabase dashboard → Database → Extensions). The migration's `create extension` covers it when permitted.
3. Rollback: `cron.unschedule('aj224-daily-checks')`, then drop the objects. Business data is unaffected.

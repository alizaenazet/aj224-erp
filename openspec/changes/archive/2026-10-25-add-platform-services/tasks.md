# Tasks: add-platform-services

## 1. Database

- [x] 1.1 Write migration `<ts>_platform_services.sql` (today_wib, audit_log + audit_row_change + log_audit_event, notifications + notify_user/notify_roles, document_types seed + document_sequences + next_document_number, prevent_hard_delete, scheduled_checks + job_runs + run_daily_checks + pg_cron schedule, profiles audit trigger and Super Admin insert policy, RLS and grants); verify `pnpm db:reset` applies it and `pnpm db:types` regenerates types
- [x] 1.2 SQL check as Finance: audit_log returns 0 rows, insert into audit_log/notifications is refused, next_document_number and notify_roles calls are refused; as Super Admin and Direktur audit_log is readable
- [x] 1.3 SQL check numbering: first invoice of 2026-10 is `INV/AJ224/2026/10/001`, next is `002`, first of 2026-11 is `001`; a `SJ-{YY}{MM}-{SEQ:4}` format yields `SJ-2703-0012` for the 12th in March 2027; two concurrent sessions get different numbers
- [x] 1.4 SQL check notifications and cancellation: notify_roles('finance') reaches only active Finance users, a repeated dedupe key gives one row, a deactivated user gets none; on a temporary table with prevent_hard_delete and the cancel columns, delete is refused with the Indonesian message and an empty cancel_reason is refused
- [x] 1.5 SQL check scheduled checks: register two temporary checks where one raises, run run_daily_checks(), and confirm job_runs shows one success and one failed with its message; confirm the cron job `aj224-daily-checks` is scheduled at `0 23 * * *`; confirm today_wib() equals the Jakarta date

## 2. Audit UI

- [x] 2.1 Change the invite action to insert the profile with the signed-in client; verify as Super Admin that inviting a user writes a "Dibuat" audit entry with the Super Admin as actor (SQL)
- [x] 2.2 Add `lib/audit/labels.ts`, `getRecordHistory` action and `AuditHistorySheet`; add "Riwayat" to Pengguna & Peran for Super Admin and Direktur; verify as Direktur that Maya's history shows a role change made by Super Admin with old and new Peran
- [x] 2.3 Add `/settings/audit-log` (table filter, 50 per page, Pagination) and the "Log Audit" menu item; verify as Super Admin the filter by Pengguna works, and as HCM the page shows Akses ditolak and the menu omits it

## 3. Notifications UI

- [x] 3.1 Run `pnpm exec shadcn add popover pagination scroll-area`; add `lib/notifications/actions.ts` (markNotificationRead, markAllNotificationsRead) and the header bell (server loader in Suspense + client Popover); verify as Finance, after notifying Finance three times via SQL, that the bell shows 3, opening one marks it read and navigates to its link, and "Tandai semua dibaca" clears the count
- [x] 3.2 Add `/notifications` (50 per page, unread marked); verify as Finance with 60 notifications that two pages are available

## 4. Integration

- [x] 4.1 Run `pnpm lint` and `pnpm build`, and confirm no server or browser console errors on `/`, `/settings/users`, `/settings/audit-log` and `/notifications`

## Workflow follow-up

- Archive the change with `/opsx:archive` after verification.

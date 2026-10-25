# Tasks: add-clients-tenders

## 1. Database

- [x] 1.1 Write migration `<ts>_clients_tenders.sql`: clients, client_contacts, tenders (generated planned_margin and weighted_value, status checks), client_activities, tender_bid_revisions, triggers (bid revision, status guard, activity tender guard), view `client_tender_stats`, functions `tender_win_stats` / `tender_lost_reasons` / `tender_pipeline` / `list_people`, daily checks `check_tender_deadlines` / `check_client_followups`, attachment type `tender` + bucket `marketing-files` + storage policies, RLS, audit; add dev clients, contacts, tenders and activities to `supabase/seed.sql`; verify `pnpm db:reset` and `pnpm db:types` succeed
- [x] 1.2 SQL check numbers: planned margin 15,0% for 12,5 M / 10,625 M; weighted value at 40%; win rates by count and value for a known period (Batal excluded); per voltage and per client; lost reasons; pipeline per status; bid change writes a revision with note and clears the note column; Kalah without reason refused; future closing date refused; reopening clears closing data
- [x] 1.3 SQL check access and reminders: Marketing writes clients/tenders/activities, Super Admin writes clients but not tenders, Direktur/Finance/Operasional read only, HCM and Lapangan read nothing; activity edit by another Marketing user refused; tender delete refused; daily checks give H-3 / H-1 tender reminders only for Prospek/Persiapan and one follow-up reminder to the author, without repeats

## 2. Clients

- [x] 2.1 Add `lib/clients/*`, `list_people` helper usage, navigation items and the `clients` / `follow-ups` exports; verify `tsc` passes
- [x] 2.2 Add client list, new/edit pages and the detail page (Ringkasan with stats, Kontak, Aktivitas, Tender); verify as Marketing: create PT Mitra Transmisi Nusantara (EPC, 45 days), duplicate name refused, add a contact, log a visit with follow-up, client stats show win rate with Batal excluded, filter PLN and export match
- [x] 2.3 Add `/marketing/follow-ups`; verify as Marketing: due and overdue first, mark done removes it; another user's activity has no edit action

## 3. Tenders

- [x] 3.1 Add `lib/tenders/*`, navigation item and the `tenders` export; verify `tsc` passes
- [x] 3.2 Add the tender priority list, new/edit pages (revision note when the bid value changes) and the detail page (data, margin, weighted value, revisions, documents, activities, Riwayat); verify as Marketing: 12,5 M / 10,625 M shows 15,0%, 40% shows Rp 5.000.000.000 weighted, changing the bid with a note adds a revision, a BoQ XLSX uploads and Finance can open it, urgent tenders show Mendesak, default sort is weighted value
- [x] 3.3 Add the status dialog; verify as Marketing: Kalah without reason refused, Kalah with Harga + winner saves, Menang with closing date, reopening clears closing data; as Super Admin no edit or status actions; as HCM "Akses ditolak"

## 4. Analytics and integration

- [x] 4.1 Add `/marketing/tender-analytics` (period filter, summary cards, per client, per voltage, lost reasons, pipeline); verify the seeded numbers against a manual §11.1 calculation for this year and last year, and HCM is refused
- [x] 4.2 Run `run_daily_checks()` and verify the Marketing bell shows the H-3 / H-1 reminders and the author gets the follow-up reminder
- [x] 4.3 Run `pnpm lint` and `pnpm build`; confirm no server or console errors; check the tender list and client page at 375 px

## Workflow follow-up

- Archive the change with `/opsx:archive` after verification.

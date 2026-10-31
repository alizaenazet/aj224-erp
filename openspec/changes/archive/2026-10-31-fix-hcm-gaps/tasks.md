# Tasks: fix-hcm-gaps

## 1. Database

- [x] 1.1 Write migration `20261031114104_hcm_fixes.sql` (`assignments_check` exit-date and extension rules, `check_certificate_expiry` Operasional reminder, `trainings_sync_certificates`); apply with `supabase migration up --local`; `pnpm db:types` unchanged
- [x] 1.2 SQL check as HCM: back-dated open assignment for Wahyu (left 31 Aug) refused, one ending 31 Aug accepted, re-opening it refused; setting Rudi's exit date still ends his assignment; certificate check notifies HCM (4) and Operasional (3, with project) and a second run adds nothing; re-dating the TKBT 2 training moves its certificate's issue and expiry dates; changing its type refused; adding a type to a workshop with a passed participant issues and links a certificate

## 2. App

- [x] 2.1 Attendance import through `save_attendance` per project day with row retry; sheet sends changed rows only and keeps notes; HCM project options include Persiapan; crew list drops people who left; assignment form shows active positions; `.env.example` names `SUPABASE_SECRET_KEY`; `tsc` and `lint` pass
- [x] 2.2 Browser check as HCM: import of 4 rows saves 3 (1 new, 2 replacing) and names the bad NIK; with Rudi's assignment ended early, changing Joko on 29 Okt saves ("Absensi 1 orang disimpan."); changing Sari's status keeps her imported note; uploading then deleting Dedi's certificate removes the scan file and attachment row
- [x] 2.3 Browser check as Lapangan at 375 px: home and Absensi Hari Ini; Tandai Semua Hadir saves 5; saving again reports no changes

## 3. Integration

- [x] 3.1 Every menu and detail route opened as each of the seven roles: no server or render errors; denied pages match PRD §13; `pnpm build` passes; `pnpm db:reset` applies all migrations and the seed

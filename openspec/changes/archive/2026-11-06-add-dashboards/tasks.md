# Tasks: add-dashboards

## 1. Library and components

- [x] 1.1 Add `lib/dashboard/queries.ts` and components `StatCard`, `ActionList`, `HealthTable`, `DashboardCharts`; verify `tsc --noEmit`

## 2. Beranda

- [x] 2.1 Beranda per role; verify in the browser as Direktur (cards link, health table, charts), Finance, Marketing, HCM, Operasional, Super Admin and Lapangan (unchanged field home)

## 3. Integration

- [x] 3.1 Run `pnpm lint` and `pnpm build`; smoke-fetch Beranda per role

## Verification notes
- Browser (2026-11-06): Direktur — eight cards with real figures (active contract Rp 18,3 M across 3 projects, receivables Rp 1,331 M all overdue, payables Rp 6 jt due ≤ 7 days, win rate 66,7%, LTI-free 45 days, 2 crew with certificate problems, 1 override), health table, horizontal bar charts for aging, incidents per month, pipeline and cost per category per project (labels checked for collisions). Finance, Marketing (Mendesak label), HCM and Operasional Perlu Tindakan lists render with their seeded items; no server errors.
- Charts use one series in `--chart-2`; the theme's chart tokens are a neutral ramp, so no categorical colour encoding is used (validator: contrast ≥ 3:1 on both surfaces).
- Found while testing: auth forms submitted via GET before hydration, putting credentials in the URL; all three auth forms now use method="post".
- `pnpm lint`, `tsc --noEmit` and `pnpm build` pass.

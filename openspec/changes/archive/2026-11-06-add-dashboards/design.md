# Design: add-dashboards

## Context
All numbers already exist as views/functions; RLS and the owner P/L views decide what each role may see.

## Decisions
- `lib/dashboard/queries.ts`: one function per role (`directorDashboard`, `financeActions`, `marketingActions`, `hcmActions`, `operationsActions`) returning plain rows; no new SQL.
- Components: `StatCard` (Card as link), `ActionList` (Card with up to 5 items + "lihat semua"), `HealthTable`, `DashboardCharts` (client; shadcn Chart = Recharts BarChart with `chart-1…5` tokens, Rupiah tooltips).
- `app/(app)/page.tsx` switches on role; Lapangan keeps `FieldHome`.
- Shadcn components: Card, Badge, Table, Chart, Empty states via muted text.

## Risks / Trade-offs
- [Many small queries on Beranda] → each role runs only its own set (≤ 8 queries); scale is small (A11).

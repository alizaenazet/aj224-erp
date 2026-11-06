import Link from "next/link";
import { MobileList } from "@/components/app/mobile-list";
import { HealthBadge } from "@/components/pl/health-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatRupiah } from "@/lib/format";
import type { FinancialRow, MonthlyRow } from "@/lib/pl/labels";

const pct = (value: number | null) => (value === null ? "—" : `${formatNumber(value, 1)}%`);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Laporan L/R per proyek (FIN-12). */
export function PlTable({ rows }: { rows: FinancialRow[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Tidak ada proyek.</p>;
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proyek</TableHead>
              <TableHead className="text-right">Nilai kontrak</TableHead>
              <TableHead className="text-right">Progres / rencana</TableHead>
              <TableHead className="text-right">Pendapatan diakui</TableHead>
              <TableHead className="text-right">Belum ditagih</TableHead>
              <TableHead className="text-right">Biaya</TableHead>
              <TableHead className="text-right">Laba kotor</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-right">Laba rencana</TableHead>
              <TableHead className="text-right">Proyeksi laba akhir</TableHead>
              <TableHead className="text-right">Posisi kas</TableHead>
              <TableHead>Kesehatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.project_id}>
                <TableCell className="max-w-56 whitespace-normal">
                  <Link href={`/projects/${row.project_id}`} className="font-medium underline-offset-4 hover:underline">
                    {row.code}
                  </Link>
                  <div className="text-xs text-muted-foreground">{row.name}</div>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(row.contract_value)}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {pct(row.progress)} / {pct(row.planned_progress)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(row.revenue)}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(row.unbilled)}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatRupiah(row.cost)}
                  {row.cost_used_pct !== null ? <div className="text-xs text-muted-foreground">{pct(row.cost_used_pct)} RAB</div> : null}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(row.gross_profit)}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">{pct(row.margin)}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(row.planned_profit)}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(row.projected_profit)}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(row.cash_position)}</TableCell>
                <TableCell>
                  <HealthBadge health={row.health} />
                  <div className="text-xs whitespace-nowrap text-muted-foreground">
                    deviasi {formatNumber(row.schedule_deviation, 1)}
                    {row.cost_index !== null ? ` · indeks ${formatNumber(row.cost_index, 1)}` : ""}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <MobileList
        rows={rows.map((row) => ({
          key: row.project_id,
          title: (
            <>
              <Link href={`/projects/${row.project_id}`} className="underline-offset-4 hover:underline">
                {row.code}
              </Link>
              <span className="text-xs font-normal text-muted-foreground">{row.name}</span>
            </>
          ),
          aside: <HealthBadge health={row.health} />,
          fields: [
            { key: "contract", label: "Nilai kontrak", value: formatRupiah(row.contract_value) },
            { key: "progress", label: "Progres / rencana", value: `${pct(row.progress)} / ${pct(row.planned_progress)}` },
            { key: "revenue", label: "Pendapatan diakui", value: formatRupiah(row.revenue) },
            { key: "unbilled", label: "Belum ditagih", value: formatRupiah(row.unbilled) },
            {
              key: "cost",
              label: "Biaya",
              value: row.cost_used_pct !== null ? `${formatRupiah(row.cost)} (${pct(row.cost_used_pct)} RAB)` : formatRupiah(row.cost),
            },
            { key: "profit", label: "Laba kotor", value: `${formatRupiah(row.gross_profit)} · ${pct(row.margin)}` },
            { key: "planned", label: "Laba rencana", value: formatRupiah(row.planned_profit) },
            { key: "projected", label: "Proyeksi laba akhir", value: formatRupiah(row.projected_profit) },
            { key: "cash", label: "Posisi kas", value: formatRupiah(row.cash_position) },
            {
              key: "deviation",
              label: "Deviasi · indeks",
              value: `${formatNumber(row.schedule_deviation, 1)}${row.cost_index !== null ? ` · ${formatNumber(row.cost_index, 1)}` : ""}`,
            },
          ],
        }))}
      />
    </>
  );
}

/** Ringkasan bulanan perusahaan (FIN-14). */
export function MonthlySummaryTable({ rows }: { rows: MonthlyRow[] }) {
  const columns = [
    ["revenue", "Pendapatan"],
    ["project_cost", "Biaya proyek"],
    ["overhead", "Overhead"],
    ["profit", "Laba sederhana"],
    ["cash_in", "Kas masuk"],
    ["cash_out", "Kas keluar"],
  ] as const;
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bulan</TableHead>
              {columns.map(([key, label]) => (
                <TableHead key={key} className="text-right">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.month}>
                <TableCell>{MONTHS[Number(row.month.slice(5, 7)) - 1]}</TableCell>
                {columns.map(([key]) => (
                  <TableCell key={key} className="text-right whitespace-nowrap tabular-nums">
                    {row[key] ? formatRupiah(row[key]) : "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              {columns.map(([key]) => (
                <TableCell key={key} className="text-right font-medium whitespace-nowrap tabular-nums">
                  {formatRupiah(rows.reduce((sum, row) => sum + row[key], 0))}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <MobileList
        rows={rows.map((row) => ({
          key: row.month,
          title: MONTHS[Number(row.month.slice(5, 7)) - 1],
          fields: columns.map(([key, label]) => ({ key, label, value: row[key] ? formatRupiah(row[key]) : "—" })),
        }))}
      />
    </>
  );
}

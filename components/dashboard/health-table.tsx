import Link from "next/link";
import { MobileList } from "@/components/app/mobile-list";
import { HealthBadge } from "@/components/pl/health-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatRupiah } from "@/lib/format";
import type { FinancialRow } from "@/lib/pl/labels";

/** Tabel kesehatan proyek (DSB-02). */
export function HealthTable({ rows }: { rows: (FinancialRow & { top_obstacle: string | null })[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Tidak ada proyek aktif.</p>;
  const pct = (value: number | null) => (value === null ? "—" : `${formatNumber(value, 1)}%`);
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proyek</TableHead>
              <TableHead className="text-right">Progres / rencana</TableHead>
              <TableHead className="text-right">Biaya thd RAB</TableHead>
              <TableHead className="text-right">Laba kotor</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kendala terbanyak</TableHead>
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
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {pct(row.progress)} / {pct(row.planned_progress)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{pct(row.cost_used_pct)}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(row.gross_profit)}</TableCell>
                <TableCell className="text-right tabular-nums">{pct(row.margin)}</TableCell>
                <TableCell>
                  <HealthBadge health={row.health} />
                </TableCell>
                <TableCell className="whitespace-normal">{row.top_obstacle ?? "—"}</TableCell>
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
            { key: "progress", label: "Progres / rencana", value: `${pct(row.progress)} / ${pct(row.planned_progress)}` },
            { key: "cost", label: "Biaya thd RAB", value: pct(row.cost_used_pct) },
            { key: "profit", label: "Laba kotor", value: formatRupiah(row.gross_profit) },
            { key: "margin", label: "Margin", value: pct(row.margin) },
            { key: "obstacle", label: "Kendala terbanyak", value: row.top_obstacle ?? "—", full: true },
          ],
        }))}
      />
    </>
  );
}

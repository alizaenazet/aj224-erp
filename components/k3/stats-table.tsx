import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import type { K3StatsRow } from "@/lib/k3/labels";

/** Ringkasan K3 per proyek plus baris perusahaan (K3-05). */
export function K3StatsTable({ rows }: { rows: K3StatsRow[] }) {
  const n = (value: number) => (value ? formatNumber(value) : "—");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Proyek</TableHead>
          <TableHead className="text-right">Near Miss</TableHead>
          <TableHead className="text-right">P3K</TableHead>
          <TableHead className="text-right">Medis</TableHead>
          <TableHead className="text-right">LTI</TableHead>
          <TableHead className="text-right">Fatal</TableHead>
          <TableHead className="text-right">Properti</TableHead>
          <TableHead className="text-right">Tindakan terbuka</TableHead>
          <TableHead className="text-right">Jam kerja</TableHead>
          <TableHead className="text-right">LTIFR</TableHead>
          <TableHead className="text-right">Hari tanpa LTI</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.project_id ?? "company"} className={row.project_id ? undefined : "font-medium"}>
            <TableCell className="whitespace-normal">{row.project_code ?? row.project_name}</TableCell>
            <TableCell className="text-right tabular-nums">{n(row.near_miss)}</TableCell>
            <TableCell className="text-right tabular-nums">{n(row.first_aid)}</TableCell>
            <TableCell className="text-right tabular-nums">{n(row.medical)}</TableCell>
            <TableCell className="text-right tabular-nums">{n(row.lti)}</TableCell>
            <TableCell className="text-right tabular-nums">{n(row.fatal)}</TableCell>
            <TableCell className="text-right tabular-nums">{n(row.property)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {n(row.open_actions)}
              {row.overdue_actions ? ` (${row.overdue_actions} terlambat)` : ""}
            </TableCell>
            <TableCell className="text-right tabular-nums">{n(row.work_hours)}</TableCell>
            <TableCell className="text-right tabular-nums">{row.ltifr === null ? "—" : formatNumber(row.ltifr, 2)}</TableCell>
            <TableCell className="text-right tabular-nums">{row.lti_free_days === null ? "—" : formatNumber(row.lti_free_days)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import type { AgingRow } from "@/lib/invoices/labels";

const COLUMNS = [
  ["current_amount", "Belum Jatuh Tempo"],
  ["d1_30", "1–30 hari"],
  ["d31_60", "31–60 hari"],
  ["d61_90", "61–90 hari"],
  ["d90_plus", "> 90 hari"],
  ["total_balance", "Total"],
] as const;

/** Umur piutang per klien dan proyek (FIN-05). */
export function AgingTable({ rows }: { rows: AgingRow[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Tidak ada piutang terbuka.</p>;
  const sum = (key: (typeof COLUMNS)[number][0]) => rows.reduce((total, row) => total + row[key], 0);
  const money = (value: number) => (value ? formatRupiah(value) : "—");
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Klien</TableHead>
          <TableHead>Proyek</TableHead>
          {COLUMNS.map(([key, label]) => (
            <TableHead key={key} className="text-right">
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.project_id}>
            <TableCell className="max-w-64 whitespace-normal">{row.client_name ?? "—"}</TableCell>
            <TableCell className="whitespace-nowrap">{row.project_code}</TableCell>
            {COLUMNS.map(([key]) => (
              <TableCell key={key} className={key === "total_balance" ? "text-right font-medium tabular-nums" : "text-right tabular-nums"}>
                {money(row[key])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2} className="font-medium">
            Total
          </TableCell>
          {COLUMNS.map(([key]) => (
            <TableCell key={key} className="text-right font-medium tabular-nums">
              {money(sum(key))}
            </TableCell>
          ))}
        </TableRow>
      </TableFooter>
    </Table>
  );
}

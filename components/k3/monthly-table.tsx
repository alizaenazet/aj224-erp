import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLASSIFICATION_SHORT, CLASSIFICATIONS } from "@/lib/k3/labels";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Insiden per bulan dan klasifikasi (K3-05). */
export function IncidentMonthlyTable({ rows }: { rows: { month: string; classification: string; count: number }[] }) {
  const months = [...new Set(rows.map((row) => row.month))].sort();
  if (!months.length) return <p className="text-sm text-muted-foreground">Belum ada insiden pada periode ini.</p>;
  const cell = (month: string, classification: string) =>
    rows.filter((row) => row.month === month && row.classification === classification).reduce((sum, row) => sum + row.count, 0);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bulan</TableHead>
          {CLASSIFICATIONS.map((value) => (
            <TableHead key={value} className="text-right">
              {CLASSIFICATION_SHORT[value]}
            </TableHead>
          ))}
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {months.map((month) => (
          <TableRow key={month}>
            <TableCell className="whitespace-nowrap">
              {MONTHS[Number(month.slice(5, 7)) - 1]} {month.slice(0, 4)}
            </TableCell>
            {CLASSIFICATIONS.map((value) => (
              <TableCell key={value} className="text-right tabular-nums">
                {cell(month, value) || "—"}
              </TableCell>
            ))}
            <TableCell className="text-right font-medium tabular-nums">
              {rows.filter((row) => row.month === month).reduce((sum, row) => sum + row.count, 0)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

import { MobileList } from "@/components/app/mobile-list";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";

type Row = {
  supplier_id: string;
  supplier_name: string;
  current_amount: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90_plus: number;
  total_balance: number;
};

const COLUMNS = [
  ["current_amount", "Belum Jatuh Tempo"],
  ["d1_30", "1–30 hari"],
  ["d31_60", "31–60 hari"],
  ["d61_90", "61–90 hari"],
  ["d90_plus", "> 90 hari"],
  ["total_balance", "Total"],
] as const;

/** Umur utang per supplier (FIN-08, PRD §11.4). */
export function PayableAgingTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Tidak ada utang terbuka.</p>;
  const money = (value: number) => (value ? formatRupiah(value) : "—");
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              {COLUMNS.map(([key, label]) => (
                <TableHead key={key} className="text-right">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.supplier_id}>
                <TableCell className="whitespace-normal">{row.supplier_name}</TableCell>
                {COLUMNS.map(([key]) => (
                  <TableCell key={key} className="text-right tabular-nums">
                    {money(row[key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              {COLUMNS.map(([key]) => (
                <TableCell key={key} className="text-right font-medium tabular-nums">
                  {money(rows.reduce((sum, row) => sum + row[key], 0))}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <MobileList
        rows={[
          ...rows.map((row) => ({
            key: row.supplier_id,
            title: row.supplier_name,
            fields: COLUMNS.map(([key, label]) => ({ key, label, value: money(row[key]) })),
          })),
          {
            key: "total",
            title: "Total",
            fields: COLUMNS.map(([key, label]) => ({ key, label, value: money(rows.reduce((sum, row) => sum + row[key], 0)) })),
          },
        ]}
      />
    </>
  );
}

import { MobileList } from "@/components/app/mobile-list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatQuantity, type ReconciliationRow } from "@/lib/materials/labels";

/** Rekonsiliasi material titipan per proyek (MAT-06). */
export function ReconciliationTable({ rows, showProject = true }: { rows: ReconciliationRow[]; showProject?: boolean }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Belum ada pergerakan material titipan.</p>;
  const qty = (value: number, unit: string) => (value ? `${formatQuantity(value)} ${unit}` : "—");
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {showProject ? <TableHead>Proyek</TableHead> : null}
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Diterima</TableHead>
              <TableHead className="text-right">Transfer masuk</TableHead>
              <TableHead className="text-right">Transfer keluar</TableHead>
              <TableHead className="text-right">Terpakai</TableHead>
              <TableHead className="text-right">Dikembalikan</TableHead>
              <TableHead className="text-right">Susut</TableHead>
              <TableHead className="text-right">Sisa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.project_id}-${row.material_id}`}>
                {showProject ? <TableCell className="whitespace-nowrap">{row.project_code}</TableCell> : null}
                <TableCell className="max-w-72 whitespace-normal">
                  <span className="font-medium">{row.material_code}</span>
                  <div className="text-xs text-muted-foreground">{row.material_name}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{qty(row.received, row.unit_code)}</TableCell>
                <TableCell className="text-right tabular-nums">{qty(row.transferred_in, row.unit_code)}</TableCell>
                <TableCell className="text-right tabular-nums">{qty(row.transferred_out, row.unit_code)}</TableCell>
                <TableCell className="text-right tabular-nums">{qty(row.used, row.unit_code)}</TableCell>
                <TableCell className="text-right tabular-nums">{qty(row.returned, row.unit_code)}</TableCell>
                <TableCell className="text-right tabular-nums">{qty(row.shrinkage, row.unit_code)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{qty(row.on_hand, row.unit_code)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <MobileList
        rows={rows.map((row) => ({
          key: `${row.project_id}-${row.material_id}`,
          title: (
            <>
              {row.material_code}
              <span className="text-xs font-normal text-muted-foreground">
                {showProject ? `${row.project_code} · ` : ""}
                {row.material_name}
              </span>
            </>
          ),
          fields: [
            { key: "on_hand", label: "Sisa", value: <span className="font-medium">{qty(row.on_hand, row.unit_code)}</span> },
            { key: "received", label: "Diterima", value: qty(row.received, row.unit_code) },
            { key: "in", label: "Transfer masuk", value: qty(row.transferred_in, row.unit_code) },
            { key: "out", label: "Transfer keluar", value: qty(row.transferred_out, row.unit_code) },
            { key: "used", label: "Terpakai", value: qty(row.used, row.unit_code) },
            { key: "returned", label: "Dikembalikan", value: qty(row.returned, row.unit_code) },
            { key: "shrinkage", label: "Susut", value: qty(row.shrinkage, row.unit_code) },
          ],
        }))}
      />
    </>
  );
}

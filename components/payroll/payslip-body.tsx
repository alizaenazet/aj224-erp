import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatDate, formatNumber, formatRupiah, terbilang } from "@/lib/format";
import type { PayslipRow } from "@/lib/payroll/labels";

/** Slip lines shared by the slip page and the A4 print (PAY-07). */
export function PayslipBody({ slip, withWords = false }: { slip: PayslipRow; withWords?: boolean }) {
  const earnings: [string, number][] = [
    ...(slip.pay_type === "daily"
      ? ([[`Upah (${slip.present_days} hari × ${formatRupiah(slip.daily_wage)})`, slip.wage_amount]] as [string, number][])
      : ([[`Gaji pokok + tunjangan tetap (${slip.active_days} hari aktif)`, slip.base_amount]] as [string, number][])),
    ...(slip.absence_deduction ? ([[`Potongan alpa (${slip.absent_days} hari)`, -slip.absence_deduction]] as [string, number][]) : []),
    [`Uang makan (${slip.present_days} hari)`, slip.meal_amount],
    [`Tunjangan lapangan (${slip.project_days} hari)`, slip.field_amount],
    [`Lembur (${formatNumber(slip.overtime_hours, 1)} jam)`, slip.overtime_amount],
    ["Insentif / bonus / borongan", slip.incentive_amount],
    ["Koreksi periode lalu", slip.correction_amount],
  ];
  const deductions: [string, number][] = [
    ["BPJS", slip.bpjs_deduction],
    ["PPh 21", slip.pph21_deduction],
    ["Potongan lain", slip.other_deduction],
    ["Cicilan kasbon", slip.kasbon_deduction],
  ];
  const rows = (items: [string, number][]) =>
    items
      .filter(([, value], index) => value !== 0 || index === 0)
      .map(([label, value]) => (
        <TableRow key={label}>
          <TableCell className="whitespace-normal">{label}</TableCell>
          <TableCell className="text-right whitespace-nowrap tabular-nums">{formatRupiah(value)}</TableCell>
        </TableRow>
      ));
  return (
    <div className="flex flex-col gap-4 text-sm">
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {[
          ["Nama", `${slip.full_name} (${slip.employee_no})`],
          ["Jabatan", slip.position_name ?? "—"],
          ["Periode", `${formatDate(slip.range_start)} – ${formatDate(slip.range_end)}`],
          ["Proyek", slip.projects ?? "—"],
          ["Hadir / Alpa", `${slip.present_days} / ${slip.absent_days} hari`],
          ["Rekening", slip.bank_account_number ? `${slip.bank_name ?? ""} ${slip.bank_account_number}` : "—"],
        ].map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="font-medium">Pendapatan</span>
          <Table>
            <TableBody>
              {rows(earnings)}
              <TableRow>
                <TableCell className="font-medium">Pendapatan bruto</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatRupiah(slip.gross)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-medium">Potongan</span>
          <Table>
            <TableBody>
              {rows(deductions)}
              <TableRow>
                <TableCell className="font-medium">Total potongan</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatRupiah(slip.total_deductions)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t pt-3">
        <span className="font-semibold">Gaji bersih</span>
        <span className="text-lg font-semibold tabular-nums">{formatRupiah(slip.net)}</span>
      </div>
      {withWords ? <p className="capitalize italic">{terbilang(slip.net)}</p> : null}
    </div>
  );
}

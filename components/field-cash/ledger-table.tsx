"use client";

import { CheckIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ReasonDialogButton } from "@/components/app/reason-dialog-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cancelMovement, verifyFieldExpense } from "@/lib/bills/actions";
import { FIELD_KIND_LABELS, FIELD_STATUS_LABELS, FIELD_STATUS_VARIANTS, type LedgerRow } from "@/lib/bills/labels";
import { formatDate, formatRupiah } from "@/lib/format";

function ApproveButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const result = await verifyFieldExpense({ id, approve: true, reason: "" });
        setPending(false);
        if (result.ok) {
          toast.success(result.message);
          router.refresh();
        } else toast.error(result.error);
      }}
    >
      <CheckIcon />
      Setujui
    </Button>
  );
}

/** Buku kas lapangan per proyek (FIN-10) with Finance verification. */
export function LedgerTable({ rows, canVerify }: { rows: LedgerRow[]; canVerify: boolean }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Belum ada transaksi kas lapangan.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>Jenis</TableHead>
          <TableHead>Keterangan</TableHead>
          <TableHead className="text-right">Masuk</TableHead>
          <TableHead className="text-right">Keluar</TableHead>
          <TableHead>Status</TableHead>
          {canVerify ? <TableHead className="text-right">Aksi</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const isMovement = row.kind === "topup" || row.kind === "return";
          const incoming = row.kind === "topup";
          return (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap">{formatDate(row.entry_date)}</TableCell>
              <TableCell className="whitespace-nowrap">{FIELD_KIND_LABELS[row.kind] ?? row.kind}</TableCell>
              <TableCell className="max-w-80 whitespace-normal">
                {isMovement ? (
                  row.description ?? "—"
                ) : (
                  <Link href={`/finance/field-cash/expenses/${row.id}`} className="underline-offset-4 hover:underline">
                    {row.description}
                  </Link>
                )}
                <div className="text-xs text-muted-foreground">
                  {[row.category_name, row.employee_name, row.no_receipt ? "tanpa nota" : null].filter(Boolean).join(" · ")}
                </div>
                {row.reject_reason ? <div className="text-xs text-destructive">Ditolak: {row.reject_reason}</div> : null}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">{incoming ? formatRupiah(row.amount) : "—"}</TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">{incoming ? "—" : formatRupiah(row.amount)}</TableCell>
              <TableCell>
                <Badge variant={FIELD_STATUS_VARIANTS[row.status] ?? "outline"}>{FIELD_STATUS_LABELS[row.status] ?? row.status}</Badge>
              </TableCell>
              {canVerify ? (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!isMovement && row.status === "pending" ? (
                      <>
                        <ApproveButton id={row.id} />
                        <ReasonDialogButton
                          label="Tolak"
                          icon={<XIcon />}
                          variant="outline"
                          title="Tolak pengeluaran?"
                          description="Dana kembali menjadi tanggungan PIC; pencatat menerima notifikasi."
                          confirmLabel="Tolak"
                          reasonLabel="Alasan penolakan"
                          action={(reason) => verifyFieldExpense({ id: row.id, approve: false, reason })}
                        />
                      </>
                    ) : null}
                    {isMovement && row.status === "active" ? (
                      <ReasonDialogButton
                        label="Batalkan"
                        variant="outline"
                        title="Batalkan transaksi?"
                        description="Saldo kas lapangan dihitung ulang."
                        confirmLabel="Batalkan"
                        action={(reason) => cancelMovement({ id: row.id, reason })}
                      />
                    ) : null}
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

"use client";

import { ReasonDialogButton } from "@/components/app/reason-dialog-button";
import { cancelTransaction } from "@/lib/materials/actions";

/** Cancel a receipt, usage or return (UMM-11); stock is reversed. */
export function CancelTransactionButton({ id }: { id: string }) {
  return (
    <ReasonDialogButton
      label="Batalkan"
      title="Batalkan transaksi?"
      description="Efek stok dibalik. Transaksi tetap terlihat dengan tanda Batal."
      confirmLabel="Batalkan transaksi"
      action={(reason) => cancelTransaction({ id, reason })}
    />
  );
}

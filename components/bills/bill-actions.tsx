"use client";

import { MoneyDialogButton } from "@/components/bills/payment-dialog";
import { ReasonDialogButton } from "@/components/app/reason-dialog-button";
import { cancelBill, cancelBillPayment, recordBillPayment } from "@/lib/bills/actions";
import { formatRupiah } from "@/lib/format";

type Banks = { value: string; label: string; isDefault: boolean }[];

export function BillPaymentButton({ billId, balance, banks, today }: { billId: string; balance: number; banks: Banks; today: string }) {
  return (
    <MoneyDialogButton
      label="Catat pembayaran"
      title="Pembayaran ke supplier"
      description={`Sisa utang ${formatRupiah(balance)}. Pembayaran bukan biaya; biaya tercatat saat tagihan dibuat.`}
      defaultAmount={balance}
      banks={banks}
      today={today}
      submit={(entry) =>
        recordBillPayment({
          billId,
          values: { payment_date: entry.date, amount: entry.amount, method: entry.method, bank_account_id: entry.bank_account_id, notes: entry.notes },
        })
      }
    />
  );
}

export function CancelBillButton({ id }: { id: string }) {
  return (
    <ReasonDialogButton
      label="Batalkan"
      title="Batalkan tagihan?"
      description="Tagihan tetap terlihat dengan tanda Batal dan tidak dihitung sebagai biaya maupun utang."
      confirmLabel="Batalkan tagihan"
      action={(reason) => cancelBill({ id, reason })}
    />
  );
}

export function CancelBillPaymentButton({ id }: { id: string }) {
  return (
    <ReasonDialogButton
      label="Batalkan"
      variant="outline"
      title="Batalkan pembayaran?"
      description="Status tagihan dihitung ulang."
      confirmLabel="Batalkan pembayaran"
      action={(reason) => cancelBillPayment({ id, reason })}
    />
  );
}

"use client";

import { MoneyDialogButton } from "@/components/bills/payment-dialog";
import { recordMovement } from "@/lib/bills/actions";

type Banks = { value: string; label: string; isDefault: boolean }[];

/** Top-up to the PIC and return of remaining cash (FIN-10). */
export function MovementButtons({ projectId, balance, banks, today }: { projectId: string; balance: number; banks: Banks; today: string }) {
  const submit = (kind: "topup" | "return") => (entry: { date: string; amount: number; method: "transfer" | "cash"; bank_account_id: string | null; notes: string | null }) =>
    recordMovement({
      project_id: projectId,
      kind,
      movement_date: entry.date,
      amount: entry.amount,
      pic_employee_id: null,
      method: entry.method,
      bank_account_id: entry.bank_account_id,
      notes: entry.notes,
    });
  return (
    <>
      <MoneyDialogButton
        label="Top-up"
        title="Top-up kas lapangan"
        description="Perpindahan dana ke PIC proyek; bukan biaya."
        defaultAmount={null}
        banks={banks}
        today={today}
        submit={submit("topup")}
      />
      <MoneyDialogButton
        label="Pengembalian"
        variant="outline"
        title="Pengembalian sisa dana"
        description="Sisa kas lapangan yang dikembalikan PIC ke kantor."
        defaultAmount={balance > 0 ? balance : null}
        banks={banks}
        today={today}
        submit={submit("return")}
      />
    </>
  );
}

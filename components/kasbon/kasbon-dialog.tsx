"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { ReasonDialogButton } from "@/components/app/reason-dialog-button";
import { RupiahInput } from "@/components/app/rupiah-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cancelKasbon, saveKasbon } from "@/lib/bills/actions";
import { kasbonSchema } from "@/lib/bills/schema";

/** Catat kasbon (PAY-05) by HCM or Finance. */
export function KasbonDialogButton({ employees, today }: { employees: ComboboxOption[]; today: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [employee, setEmployee] = useState("");
  const [date, setDate] = useState<string | null>(today);
  const [amount, setAmount] = useState<number | null>(null);
  const [installment, setInstallment] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    const parsed = kasbonSchema.safeParse({
      employee_id: employee,
      kasbon_date: date,
      amount: amount ?? 0,
      installment_amount: installment ?? amount ?? 0,
      description,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
      return;
    }
    setPending(true);
    const result = await saveKasbon(parsed.data);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Kasbon baru
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat kasbon</DialogTitle>
            <DialogDescription>Cicilan dipotong otomatis di payroll; saldo tidak pernah negatif.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="kasbon-employee">Karyawan *</FieldLabel>
              <Combobox id="kasbon-employee" value={employee} onChange={setEmployee} options={employees} placeholder="Pilih karyawan" />
            </Field>
            <Field>
              <FieldLabel htmlFor="kasbon-date">Tanggal *</FieldLabel>
              <DatePicker id="kasbon-date" value={date} onChange={setDate} max={today} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="kasbon-amount">Jumlah *</FieldLabel>
                <RupiahInput id="kasbon-amount" value={amount} onChange={setAmount} />
              </Field>
              <Field>
                <FieldLabel htmlFor="kasbon-installment">Cicilan per periode *</FieldLabel>
                <RupiahInput id="kasbon-installment" value={installment} onChange={setInstallment} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="kasbon-description">Keterangan</FieldLabel>
              <Input id="kasbon-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={300} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button onClick={() => void submit()} disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan kasbon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CancelKasbonButton({ id }: { id: string }) {
  return (
    <ReasonDialogButton
      label="Batalkan"
      variant="outline"
      title="Batalkan kasbon?"
      description="Kasbon tetap terlihat dengan tanda Batal dan tidak dipotong di payroll."
      confirmLabel="Batalkan kasbon"
      action={(reason) => cancelKasbon({ id, reason })}
    />
  );
}

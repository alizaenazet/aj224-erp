"use client";

import { BanknoteIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { RupiahInput } from "@/components/app/rupiah-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActionResult } from "@/lib/actions";

export type MoneyEntry = {
  date: string;
  amount: number;
  method: "transfer" | "cash";
  bank_account_id: string | null;
  notes: string | null;
};

/** Date + amount + method + account dialog used for supplier payments, top-ups and returns. */
export function MoneyDialogButton({
  label,
  title,
  description,
  defaultAmount,
  banks,
  today,
  submit,
  variant = "default",
}: {
  label: string;
  title: string;
  description: string;
  defaultAmount: number | null;
  banks: { value: string; label: string; isDefault: boolean }[];
  today: string;
  submit: (entry: MoneyEntry) => Promise<ActionResult<unknown>>;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string | null>(today);
  const [amount, setAmount] = useState<number | null>(defaultAmount);
  const [method, setMethod] = useState<"transfer" | "cash">("transfer");
  const [bank, setBank] = useState(banks.find((option) => option.isDefault)?.value ?? banks[0]?.value ?? "");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  async function save() {
    if (!date || !amount) {
      toast.error("Isi tanggal dan jumlah.");
      return;
    }
    setPending(true);
    const result = await submit({ date, amount, method, bank_account_id: method === "transfer" ? bank || null : null, notes: notes || null });
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
      <Button variant={variant} onClick={() => setOpen(true)}>
        <BanknoteIcon />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="money-date">Tanggal *</FieldLabel>
              <DatePicker id="money-date" value={date} onChange={setDate} max={today} />
            </Field>
            <Field>
              <FieldLabel htmlFor="money-amount">Jumlah *</FieldLabel>
              <RupiahInput id="money-amount" value={amount} onChange={setAmount} />
            </Field>
            <Field>
              <FieldLabel htmlFor="money-method">Metode</FieldLabel>
              <Select value={method} onValueChange={(value) => setMethod(value as "transfer" | "cash")}>
                <SelectTrigger id="money-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="cash">Tunai</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {method === "transfer" ? (
              <Field>
                <FieldLabel htmlFor="money-bank">Rekening perusahaan</FieldLabel>
                <Select value={bank} onValueChange={setBank}>
                  <SelectTrigger id="money-bank" className="w-full">
                    <SelectValue placeholder="Pilih rekening" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="money-notes">Catatan</FieldLabel>
              <Input id="money-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={300} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button onClick={() => void save()} disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

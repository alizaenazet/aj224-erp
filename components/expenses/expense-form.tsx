"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { RupiahInput } from "@/components/app/rupiah-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { saveExpense } from "@/lib/bills/actions";
import { OFFICE } from "@/lib/bills/labels";
import { expenseSchema } from "@/lib/bills/schema";

/** Pengeluaran langsung (FIN-09): project or Kantor/Umum, category, receipt photo after saving. */
export function ExpenseForm({
  projects,
  categories,
  deliveryNotes,
  today,
  defaultProject,
}: {
  projects: ComboboxOption[];
  categories: ComboboxOption[];
  deliveryNotes: ComboboxOption[];
  today: string;
  defaultProject: string | null;
}) {
  const router = useRouter();
  const [date, setDate] = useState<string | null>(today);
  const [project, setProject] = useState(defaultProject ?? "");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [payee, setPayee] = useState("");
  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [description, setDescription] = useState("");
  const [noReceipt, setNoReceipt] = useState(false);
  const [noReceiptNote, setNoReceiptNote] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!project) {
      toast.error("Pilih proyek atau Kantor/Umum.");
      return;
    }
    const parsed = expenseSchema.safeParse({
      expense_date: date,
      project_id: project === OFFICE ? null : project,
      cost_category_id: category,
      amount: amount ?? 0,
      payee,
      method,
      description,
      no_receipt: noReceipt,
      no_receipt_note: noReceiptNote,
      delivery_note_id: note,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
      return;
    }
    setPending(true);
    const result = await saveExpense({ id: null, values: parsed.data });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/finance/expenses/${result.data?.id}${noReceipt ? "" : "#nota"}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran langsung</CardTitle>
          <CardDescription>Pembayaran tanpa tagihan supplier. Lampirkan foto nota setelah disimpan.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="expense-date">Tanggal *</FieldLabel>
              <DatePicker id="expense-date" value={date} onChange={setDate} max={today} />
            </Field>
            <Field>
              <FieldLabel htmlFor="expense-project">Proyek *</FieldLabel>
              <Combobox
                id="expense-project"
                value={project}
                onChange={setProject}
                options={[{ value: OFFICE, label: "Kantor/Umum (overhead)" }, ...projects]}
                placeholder="Proyek / Kantor"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="expense-category">Kategori biaya *</FieldLabel>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="expense-category" className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="expense-amount">Jumlah *</FieldLabel>
              <RupiahInput id="expense-amount" value={amount} onChange={setAmount} />
            </Field>
            <Field>
              <FieldLabel htmlFor="expense-payee">Penerima</FieldLabel>
              <Input id="expense-payee" value={payee} onChange={(event) => setPayee(event.target.value)} maxLength={120} />
            </Field>
            <Field>
              <FieldLabel htmlFor="expense-method">Metode</FieldLabel>
              <Select value={method} onValueChange={(value) => setMethod(value as "cash" | "transfer")}>
                <SelectTrigger id="expense-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="expense-description">Keterangan *</FieldLabel>
              <Input id="expense-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={300} />
            </Field>
            <Field>
              <FieldLabel htmlFor="expense-note">Surat jalan terkait</FieldLabel>
              <Combobox id="expense-note" value={note} onChange={setNote} options={deliveryNotes} placeholder="Untuk biaya angkut (opsional)" />
            </Field>
            <Field orientation="horizontal" className="md:col-span-2">
              <Switch id="expense-no-receipt" checked={noReceipt} onCheckedChange={setNoReceipt} />
              <FieldLabel htmlFor="expense-no-receipt">Tanpa Nota</FieldLabel>
            </Field>
            {noReceipt ? (
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="expense-no-receipt-note">Keterangan tanpa nota *</FieldLabel>
                <Input id="expense-no-receipt-note" value={noReceiptNote} onChange={(event) => setNoReceiptNote(event.target.value)} maxLength={300} />
              </Field>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button onClick={() => void submit()} disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan pengeluaran"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/finance/expenses">Batal</Link>
        </Button>
      </div>
    </div>
  );
}

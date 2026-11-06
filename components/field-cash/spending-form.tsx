"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { RupiahInput } from "@/components/app/rupiah-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { recordFieldExpense } from "@/lib/bills/actions";
import { FIELD_KIND_LABELS } from "@/lib/bills/labels";
import { fieldExpenseSchema } from "@/lib/bills/schema";
import { clearDraft, readDraft, writeDraft } from "@/lib/local-draft";

type Kind = "project_cost" | "kasbon" | "wage_payment";
type Draft = {
  project: string;
  date: string | null;
  kind: Kind;
  category: string;
  employee: string;
  installment: number | null;
  amount: number | null;
  description: string;
  noReceipt: boolean;
  noReceiptNote: string;
};

const DRAFT_KEY = "field-cash-expense";

/** Catat pengeluaran kas lapangan (FIN-10) with a device draft (UMM-12); photo is added after saving. */
export function SpendingForm({
  projects,
  categories,
  employees,
  defaultProject,
  today,
  minDate,
}: {
  projects: ComboboxOption[];
  categories: ComboboxOption[];
  employees: ComboboxOption[];
  defaultProject: string | null;
  today: string;
  minDate: string | null;
}) {
  const router = useRouter();
  const initialProject = defaultProject && projects.some((option) => option.value === defaultProject) ? defaultProject : (projects[0]?.value ?? "");
  const [values, setValues] = useState<Draft>({
    project: initialProject,
    date: today,
    kind: "project_cost",
    category: "",
    employee: "",
    installment: null,
    amount: null,
    description: "",
    noReceipt: false,
    noReceiptNote: "",
  });
  const [restored, setRestored] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const draft = readDraft<Draft>(DRAFT_KEY);
    if (draft) {
      setValues({ ...draft, project: projects.some((option) => option.value === draft.project) ? draft.project : initialProject });
      setRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<Draft>) =>
    setValues((current) => {
      const next = { ...current, ...patch };
      writeDraft(DRAFT_KEY, next);
      return next;
    });

  async function submit() {
    const parsed = fieldExpenseSchema.safeParse({
      project_id: values.project,
      expense_date: values.date,
      kind: values.kind,
      cost_category_id: values.kind === "project_cost" ? values.category : null,
      employee_id: values.kind === "project_cost" ? null : values.employee,
      installment_amount: values.kind === "kasbon" ? values.installment : null,
      amount: values.amount ?? 0,
      description: values.description,
      no_receipt: values.noReceipt,
      no_receipt_note: values.noReceiptNote,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
      return;
    }
    setPending(true);
    const result = await recordFieldExpense(parsed.data);
    setPending(false);
    if (!result.ok) {
      toast.error(`${result.error} Isian tetap tersimpan di perangkat.`);
      return;
    }
    clearDraft(DRAFT_KEY);
    toast.success(result.message);
    router.push(`/finance/field-cash/expenses/${result.data?.id}${values.noReceipt ? "" : "#nota"}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {restored ? (
        <Alert>
          <AlertDescription>Isian terakhir yang belum terkirim dipulihkan dari perangkat ini.</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran kas lapangan</CardTitle>
          <CardDescription>Menunggu verifikasi Finance setelah disimpan. Foto nota ditambahkan di halaman berikutnya.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="spend-project">Proyek *</FieldLabel>
              <Combobox id="spend-project" value={values.project} onChange={(value) => set({ project: value })} options={projects} placeholder="Pilih proyek" />
            </Field>
            <Field>
              <FieldLabel htmlFor="spend-date">Tanggal *</FieldLabel>
              <DatePicker id="spend-date" value={values.date} onChange={(value) => set({ date: value })} max={today} min={minDate ?? undefined} />
            </Field>
            <Field>
              <FieldLabel htmlFor="spend-kind">Jenis *</FieldLabel>
              <Select value={values.kind} onValueChange={(value) => set({ kind: value as Kind })}>
                <SelectTrigger id="spend-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["project_cost", "kasbon", "wage_payment"] as const).map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {FIELD_KIND_LABELS[kind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {values.kind === "project_cost" ? (
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="spend-category">Kategori biaya *</FieldLabel>
                <Select value={values.category} onValueChange={(value) => set({ category: value })}>
                  <SelectTrigger id="spend-category" className="w-full">
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
            ) : (
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="spend-employee">Karyawan *</FieldLabel>
                <Combobox id="spend-employee" value={values.employee} onChange={(value) => set({ employee: value })} options={employees} placeholder="Pilih karyawan" />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="spend-amount">Jumlah *</FieldLabel>
              <RupiahInput id="spend-amount" value={values.amount} onChange={(value) => set({ amount: value })} />
            </Field>
            {values.kind === "kasbon" ? (
              <Field>
                <FieldLabel htmlFor="spend-installment">Cicilan per periode gaji</FieldLabel>
                <RupiahInput id="spend-installment" value={values.installment} onChange={(value) => set({ installment: value })} />
                <FieldDescription>Kosongkan bila dipotong sekaligus.</FieldDescription>
              </Field>
            ) : null}
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="spend-description">Keterangan *</FieldLabel>
              <Input id="spend-description" value={values.description} onChange={(event) => set({ description: event.target.value })} maxLength={300} />
            </Field>
            <Field orientation="horizontal" className="md:col-span-2">
              <Switch id="spend-no-receipt" checked={values.noReceipt} onCheckedChange={(checked) => set({ noReceipt: checked })} />
              <FieldLabel htmlFor="spend-no-receipt">Tanpa Nota</FieldLabel>
            </Field>
            {values.noReceipt ? (
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="spend-no-receipt-note">Keterangan tanpa nota *</FieldLabel>
                <Input id="spend-no-receipt-note" value={values.noReceiptNote} onChange={(event) => set({ noReceiptNote: event.target.value })} maxLength={300} />
              </Field>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>
      <Button size="lg" onClick={() => void submit()} disabled={pending}>
        {pending ? "Mengirim…" : "Kirim pengeluaran"}
      </Button>
    </div>
  );
}

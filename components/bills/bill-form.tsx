"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { RupiahInput } from "@/components/app/rupiah-input";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveBill } from "@/lib/bills/actions";
import { OFFICE } from "@/lib/bills/labels";
import { billSchema, type BillInput } from "@/lib/bills/schema";
import { formatRupiah } from "@/lib/format";

type Line = { key: string; description: string; amount: number | null; project: string; category: string };
let keySeed = 0;
const nextKey = () => `bill-line-${++keySeed}`;

/** Tagihan supplier (FIN-06): every line has a project or Kantor/Umum and a cost category. */
export function BillForm({
  billId,
  defaults,
  suppliers,
  projects,
  categories,
  deliveryNotes,
  today,
}: {
  billId?: string;
  defaults?: Partial<BillInput>;
  suppliers: ComboboxOption[];
  projects: ComboboxOption[];
  categories: ComboboxOption[];
  deliveryNotes: ComboboxOption[];
  today: string;
}) {
  const router = useRouter();
  const projectOptions = [{ value: OFFICE, label: "Kantor/Umum (overhead)" }, ...projects];
  const [supplier, setSupplier] = useState(defaults?.supplier_id ?? "");
  const [billNo, setBillNo] = useState(defaults?.bill_no ?? "");
  const [date, setDate] = useState<string | null>(defaults?.bill_date ?? today);
  const [due, setDue] = useState<string | null>(defaults?.due_date ?? null);
  const [ppn, setPpn] = useState<number | null>(defaults?.ppn_amount ?? 0);
  const [note, setNote] = useState(defaults?.delivery_note_id ?? "");
  const [notes, setNotes] = useState(defaults?.notes ?? "");
  const [lines, setLines] = useState<Line[]>(
    defaults?.lines?.length
      ? defaults.lines.map((line) => ({
          key: nextKey(),
          description: line.description,
          amount: line.amount,
          project: line.project_id ?? OFFICE,
          category: line.cost_category_id,
        }))
      : [{ key: nextKey(), description: "", amount: null, project: "", category: "" }],
  );
  const [pending, setPending] = useState(false);
  const subtotal = lines.reduce((sum, line) => sum + (line.amount ?? 0), 0);

  const update = (key: string, patch: Partial<Line>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  async function submit() {
    if (lines.some((line) => !line.project)) {
      toast.error("Pilih proyek atau Kantor/Umum di setiap baris.");
      return;
    }
    const parsed = billSchema.safeParse({
      supplier_id: supplier,
      bill_no: billNo,
      bill_date: date,
      due_date: due,
      ppn_amount: ppn ?? 0,
      delivery_note_id: note,
      notes,
      lines: lines.map((line) => ({
        description: line.description,
        amount: line.amount ?? 0,
        project_id: line.project === OFFICE ? null : line.project,
        cost_category_id: line.category,
      })),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
      return;
    }
    setPending(true);
    const result = await saveBill({ id: billId ?? null, values: parsed.data });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/finance/bills/${billId ?? result.data?.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="bill-supplier">Supplier *</FieldLabel>
              <Combobox id="bill-supplier" value={supplier} onChange={setSupplier} options={suppliers} placeholder="Pilih supplier" />
            </Field>
            <Field>
              <FieldLabel htmlFor="bill-no">No. nota/faktur *</FieldLabel>
              <Input id="bill-no" value={billNo} onChange={(event) => setBillNo(event.target.value)} maxLength={60} />
            </Field>
            <Field>
              <FieldLabel htmlFor="bill-date">Tanggal nota *</FieldLabel>
              <DatePicker id="bill-date" value={date} onChange={setDate} max={today} />
            </Field>
            <Field>
              <FieldLabel htmlFor="bill-due">Jatuh tempo</FieldLabel>
              <DatePicker id="bill-due" value={due} onChange={setDue} min={date ?? undefined} clearable />
              <FieldDescription>Kosongkan untuk memakai termin pembayaran supplier.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="bill-ppn">PPN (opsional)</FieldLabel>
              <RupiahInput id="bill-ppn" value={ppn} onChange={setPpn} />
            </Field>
            <Field>
              <FieldLabel htmlFor="bill-note">Surat jalan terkait</FieldLabel>
              <Combobox
                id="bill-note"
                value={note}
                onChange={setNote}
                options={deliveryNotes}
                placeholder="Untuk biaya angkut (opsional)"
                searchPlaceholder="Cari nomor surat jalan"
              />
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="bill-notes">Catatan</FieldLabel>
              <Textarea id="bill-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rincian</CardTitle>
          <CardDescription>Satu tagihan dapat dibagi ke beberapa proyek; baris tanpa proyek/kategori tidak dapat disimpan.</CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLines((current) => [...current, { key: nextKey(), description: "", amount: null, project: "", category: "" }])}
            >
              <PlusIcon />
              Baris
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {lines.map((line, index) => (
            <div key={line.key} className="grid gap-3 md:grid-cols-12 md:items-end">
              <Field className="md:col-span-4">
                <FieldLabel htmlFor={`line-desc-${index}`}>Uraian</FieldLabel>
                <Input
                  id={`line-desc-${index}`}
                  value={line.description}
                  onChange={(event) => update(line.key, { description: event.target.value })}
                  maxLength={300}
                />
              </Field>
              <Field className="md:col-span-3">
                <FieldLabel htmlFor={`line-project-${index}`}>Proyek</FieldLabel>
                <Combobox
                  id={`line-project-${index}`}
                  value={line.project}
                  onChange={(value) => update(line.key, { project: value })}
                  options={projectOptions}
                  placeholder="Proyek / Kantor"
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel htmlFor={`line-category-${index}`}>Kategori</FieldLabel>
                <Select value={line.category} onValueChange={(value) => update(line.key, { category: value })}>
                  <SelectTrigger id={`line-category-${index}`} className="w-full">
                    <SelectValue placeholder="Pilih" />
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
              <Field className="md:col-span-2">
                <FieldLabel htmlFor={`line-amount-${index}`}>Jumlah</FieldLabel>
                <RupiahInput id={`line-amount-${index}`} value={line.amount} onChange={(value) => update(line.key, { amount: value })} />
              </Field>
              <Button
                variant="ghost"
                size="icon"
                disabled={lines.length === 1}
                onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                aria-label={`Hapus baris ${index + 1}`}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
          <dl className="flex flex-wrap justify-end gap-6 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatRupiah(subtotal)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-medium tabular-nums">{formatRupiah(subtotal + (ppn ?? 0))}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => void submit()} disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan tagihan"}
        </Button>
        <Button asChild variant="outline">
          <Link href={billId ? `/finance/bills/${billId}` : "/finance/bills"}>Batal</Link>
        </Button>
      </div>
    </div>
  );
}

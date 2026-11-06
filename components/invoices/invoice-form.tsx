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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/format";
import { saveInvoice } from "@/lib/invoices/actions";
import { invoiceSchema, type InvoiceInput } from "@/lib/invoices/schema";

type Props = {
  invoiceId?: string;
  kind: "term" | "other";
  /** Termin being billed (kind term). */
  term?: { id: string; label: string; projectLabel: string; amount: number } | null;
  defaults?: Partial<InvoiceInput>;
  projects: ComboboxOption[];
  /** Preview only, per project; the server sets the PPN rate (PKP + contract). */
  ppnByProject: Record<string, number>;
  today: string;
};

/** Draft invoice from a termin (FIN-01) or for other work (FIN-02). Amounts are recomputed by the server. */
export function InvoiceForm({ invoiceId, kind, term, defaults, projects, ppnByProject, today }: Props) {
  const router = useRouter();
  const [project, setProject] = useState(defaults?.project_id ?? "");
  const [description, setDescription] = useState(defaults?.description ?? "");
  const [date, setDate] = useState<string | null>(defaults?.invoice_date ?? today);
  const [due, setDue] = useState<string | null>(defaults?.due_date ?? null);
  const [gross, setGross] = useState<number | null>(defaults?.gross_amount ?? term?.amount ?? null);
  const [dp, setDp] = useState<number | null>(defaults?.dp_deduction ?? 0);
  const [retention, setRetention] = useState<number | null>(defaults?.retention_deduction ?? 0);
  const [other, setOther] = useState<number | null>(defaults?.other_deduction ?? 0);
  const [otherNote, setOtherNote] = useState(defaults?.other_deduction_note ?? "");
  const [notes, setNotes] = useState(defaults?.notes ?? "");
  const [pending, setPending] = useState(false);

  const ppnRate = ppnByProject[project] ?? 0;
  const dpp = (gross ?? 0) - (dp ?? 0) - (retention ?? 0) - (other ?? 0);
  const ppn = Math.round((Math.max(dpp, 0) * ppnRate) / 100);

  async function submit() {
    const parsed = invoiceSchema.safeParse({
      kind,
      project_id: kind === "other" ? project : null,
      term_id: kind === "term" ? term?.id : null,
      description,
      invoice_date: date,
      due_date: due,
      gross_amount: gross ?? 0,
      dp_deduction: dp ?? 0,
      retention_deduction: retention ?? 0,
      other_deduction: other ?? 0,
      other_deduction_note: otherNote,
      notes,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
      return;
    }
    setPending(true);
    const result = await saveInvoice({ id: invoiceId ?? null, values: parsed.data });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/finance/invoices/${result.data?.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{kind === "term" ? `Invoice ${term?.label ?? "termin"}` : "Invoice non-termin"}</CardTitle>
          <CardDescription>
            {kind === "term" ? term?.projectLabel : "Mis. pekerjaan tambah; tetap terikat ke proyek."} Nomor diberikan saat invoice
            diterbitkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            {kind === "other" ? (
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="invoice-project">Proyek *</FieldLabel>
                <Combobox
                  id="invoice-project"
                  value={project}
                  onChange={setProject}
                  options={projects}
                  placeholder="Pilih proyek"
                  searchPlaceholder="Cari kode atau nama proyek"
                  disabled={Boolean(invoiceId)}
                />
              </Field>
            ) : null}
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="invoice-description">Uraian{kind === "other" ? " *" : ""}</FieldLabel>
              <Input
                id="invoice-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={300}
                placeholder={kind === "term" ? term?.label : "Mis. Pekerjaan tambah crossing jalan"}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="invoice-date">Tanggal invoice *</FieldLabel>
              <DatePicker id="invoice-date" value={date} onChange={setDate} />
            </Field>
            <Field>
              <FieldLabel htmlFor="invoice-due">Jatuh tempo</FieldLabel>
              <DatePicker id="invoice-due" value={due} onChange={setDue} min={date ?? undefined} clearable />
              <FieldDescription>Kosongkan untuk memakai termin pembayaran klien.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nilai</CardTitle>
          <CardDescription>
            {ppnRate ? `PPN ${ppnRate}% (perusahaan PKP dan kontrak kena PPN).` : "Tanpa PPN (perusahaan non-PKP atau kontrak tidak kena PPN)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="invoice-gross">Nilai bruto *</FieldLabel>
              <RupiahInput id="invoice-gross" value={gross} onChange={setGross} />
            </Field>
            <Field>
              <FieldLabel htmlFor="invoice-dp">Pengembalian uang muka</FieldLabel>
              <RupiahInput id="invoice-dp" value={dp} onChange={setDp} />
            </Field>
            <Field>
              <FieldLabel htmlFor="invoice-retention">Retensi</FieldLabel>
              <RupiahInput id="invoice-retention" value={retention} onChange={setRetention} />
            </Field>
            <Field>
              <FieldLabel htmlFor="invoice-other">Potongan lain</FieldLabel>
              <RupiahInput id="invoice-other" value={other} onChange={setOther} />
            </Field>
            {other ? (
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="invoice-other-note">Keterangan potongan lain *</FieldLabel>
                <Input id="invoice-other-note" value={otherNote} onChange={(event) => setOtherNote(event.target.value)} maxLength={200} />
              </Field>
            ) : null}
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="invoice-notes">Catatan</FieldLabel>
              <Textarea id="invoice-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} />
            </Field>
          </FieldGroup>
          <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-3">
            {[
              ["DPP", dpp],
              [`PPN (perkiraan)`, ppn],
              ["Total (perkiraan)", dpp + ppn],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex flex-col gap-1">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium tabular-nums">{formatRupiah(value as number)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => void submit()} disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan draft"}
        </Button>
        <Button asChild variant="outline">
          <Link href={invoiceId ? `/finance/invoices/${invoiceId}` : "/finance/invoices"}>Batal</Link>
        </Button>
      </div>
    </div>
  );
}

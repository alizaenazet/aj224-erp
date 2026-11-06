"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Combobox } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recordTransaction } from "@/lib/materials/actions";
import {
  TXN_KIND_LABELS,
  TXN_SOURCE_LABELS,
  TXN_SOURCES,
  formatQuantity,
  type MaterialOwnership,
  type RecordableKind,
  type TxnSource,
} from "@/lib/materials/labels";
import { transactionSchema } from "@/lib/materials/schema";

type Option = { value: string; label: string };
type MaterialChoice = { id: string; code: string; name: string; unit_code: string; ownership: MaterialOwnership };
type Line = { key: string; material_id: string; quantity: string };

let keySeed = 0;
const nextKey = () => `mline-${++keySeed}`;

const DESCRIPTIONS: Record<RecordableKind, string> = {
  receipt: "Stok lokasi bertambah. Lampirkan foto nota atau BA serah terima setelah disimpan.",
  usage: "Stok lokasi proyek berkurang; jumlah tidak boleh melebihi stok.",
  return: "Material titipan dikembalikan ke klien dari lokasi proyek.",
};

/** Penerimaan (MAT-02), Pemakaian (MAT-03) or Kembali ke klien. */
export function TransactionForm({
  kind,
  locations,
  defaultLocation,
  materials,
  suppliers,
  stock,
  sections,
  today,
  minDate,
}: {
  kind: RecordableKind;
  locations: (Option & { type: string })[];
  defaultLocation: string | null;
  materials: MaterialChoice[];
  suppliers: Option[];
  stock: { material_id: string; location_id: string; quantity: number }[];
  sections: (Option & { location_id: string })[];
  today: string;
  /** Earliest date for Lapangan (H+3 rule); null for Operasional. */
  minDate: string | null;
}) {
  const router = useRouter();
  const usable = kind === "receipt" ? locations : locations.filter((location) => location.type === "project");
  const [location, setLocation] = useState(
    defaultLocation && usable.some((option) => option.value === defaultLocation) ? defaultLocation : (usable[0]?.value ?? ""),
  );
  const [date, setDate] = useState<string | null>(today);
  const [source, setSource] = useState<TxnSource>("client");
  const [supplier, setSupplier] = useState("");
  const [docNo, setDocNo] = useState("");
  const [section, setSection] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ key: nextKey(), material_id: "", quantity: "" }]);
  const [pending, setPending] = useState(false);

  const available = (materialId: string) =>
    stock.find((row) => row.material_id === materialId && row.location_id === location)?.quantity ?? 0;

  const materialOptions = useMemo(() => {
    const list = kind === "return" ? materials.filter((material) => material.ownership === "client") : materials;
    const filtered = kind === "receipt" ? list : list.filter((material) => available(material.id) > 0);
    return filtered.map((material) => ({
      value: material.id,
      label: `${material.code} — ${material.name}`,
      description: kind === "receipt" ? material.unit_code : `Tersedia ${formatQuantity(available(material.id))} ${material.unit_code}`,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials, kind, location, stock]);

  const sectionOptions = sections.filter((option) => option.location_id === location);
  const unitOf = (materialId: string) => materials.find((material) => material.id === materialId)?.unit_code ?? "";

  function update(key: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function submit() {
    const parsed = transactionSchema.safeParse({
      kind,
      location_id: location,
      txn_date: date,
      source: kind === "receipt" ? source : null,
      supplier_id: kind === "receipt" && source === "supplier" ? supplier : null,
      doc_no: docNo,
      section_id: kind === "usage" ? section : null,
      notes,
      lines: lines.map((line) => ({ material_id: line.material_id, quantity: line.quantity })),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
      return;
    }
    setPending(true);
    const result = await recordTransaction(parsed.data);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/operations/material-transactions/${result.data?.id}`);
  }

  if (!usable.length) {
    return <p className="text-sm text-muted-foreground">Tidak ada lokasi proyek yang dapat dipilih.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{TXN_KIND_LABELS[kind]}</CardTitle>
          <CardDescription>{DESCRIPTIONS[kind]}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="txn-location">Lokasi *</FieldLabel>
              <Select
                value={location}
                onValueChange={(value) => {
                  setLocation(value);
                  setSection("");
                  if (kind !== "receipt") setLines([{ key: nextKey(), material_id: "", quantity: "" }]);
                }}
              >
                <SelectTrigger id="txn-location" className="w-full">
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  {usable.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="txn-date">Tanggal *</FieldLabel>
              <DatePicker id="txn-date" value={date} onChange={setDate} max={today} min={minDate ?? undefined} />
              {minDate ? <FieldDescription>Paling lambat H+3 dari tanggal kejadian.</FieldDescription> : null}
            </Field>
            {kind === "receipt" ? (
              <>
                <Field>
                  <FieldLabel htmlFor="txn-source">Sumber *</FieldLabel>
                  <Select value={source} onValueChange={(value) => setSource(value as TxnSource)}>
                    <SelectTrigger id="txn-source" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TXN_SOURCES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {TXN_SOURCE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {source === "supplier" && suppliers.length ? (
                  <Field>
                    <FieldLabel htmlFor="txn-supplier">Supplier</FieldLabel>
                    <Combobox
                      id="txn-supplier"
                      value={supplier}
                      onChange={setSupplier}
                      options={suppliers}
                      placeholder="Pilih supplier"
                      searchPlaceholder="Cari supplier"
                    />
                  </Field>
                ) : null}
              </>
            ) : null}
            <Field>
              <FieldLabel htmlFor="txn-doc">
                {kind === "receipt"
                  ? source === "supplier"
                    ? "No. nota"
                    : "No. surat jalan / BA klien"
                  : kind === "return"
                    ? "No. BA pengembalian"
                    : "No. dokumen"}
              </FieldLabel>
              <Input id="txn-doc" value={docNo} onChange={(event) => setDocNo(event.target.value)} maxLength={60} />
            </Field>
            {kind === "usage" ? (
              <Field>
                <FieldLabel htmlFor="txn-section">Seksi</FieldLabel>
                <Combobox
                  id="txn-section"
                  value={section}
                  onChange={setSection}
                  options={sectionOptions}
                  placeholder="Pilih seksi (opsional)"
                  searchPlaceholder="Cari seksi"
                  emptyText="Belum ada seksi."
                />
              </Field>
            ) : null}
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="txn-notes">Keterangan</FieldLabel>
              <Textarea id="txn-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Material</CardTitle>
          <CardAction>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLines((current) => [...current, { key: nextKey(), material_id: "", quantity: "" }])}
            >
              <PlusIcon />
              Material
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {lines.map((line, index) => (
            <div key={line.key} className="flex flex-col gap-3 md:flex-row md:items-start">
              <Field className="flex-1">
                <FieldLabel htmlFor={`txn-material-${index}`}>Material</FieldLabel>
                <Combobox
                  id={`txn-material-${index}`}
                  value={line.material_id}
                  onChange={(value) => update(line.key, { material_id: value })}
                  options={materialOptions}
                  placeholder="Pilih material"
                  searchPlaceholder="Cari kode atau nama"
                  emptyText={kind === "receipt" ? "Material belum terdaftar." : "Tidak ada stok di lokasi ini."}
                />
              </Field>
              <Field className="md:w-44">
                <FieldLabel htmlFor={`txn-quantity-${index}`}>Jumlah{line.material_id ? ` (${unitOf(line.material_id)})` : ""}</FieldLabel>
                <Input
                  id={`txn-quantity-${index}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={line.quantity}
                  onChange={(event) => update(line.key, { quantity: event.target.value })}
                />
                {line.material_id && kind !== "receipt" ? (
                  <FieldDescription>Tersedia {formatQuantity(available(line.material_id))}</FieldDescription>
                ) : null}
              </Field>
              <Button
                variant="ghost"
                size="icon"
                className="md:mt-6"
                disabled={lines.length === 1}
                onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                aria-label={`Hapus baris ${index + 1}`}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button size="lg" onClick={() => void submit()} disabled={pending}>
        {pending ? "Menyimpan…" : `Simpan ${TXN_KIND_LABELS[kind].toLowerCase()}`}
      </Button>
    </div>
  );
}

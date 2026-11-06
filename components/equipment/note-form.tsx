"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Combobox } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sendDeliveryNote } from "@/lib/equipment/actions";
import { CONDITION_LABELS, CONDITIONS, SENDABLE_CONDITIONS, type ToolCondition } from "@/lib/equipment/labels";
import { deliveryNoteSchema } from "@/lib/equipment/schema";
import { formatQuantity } from "@/lib/materials/labels";

type StockItem = {
  tool_id: string;
  location_id: string;
  condition: ToolCondition;
  quantity: number;
  tool_code: string;
  tool_name: string;
};

type MaterialStockItem = {
  material_id: string;
  location_id: string;
  quantity: number;
  material_code: string;
  material_name: string;
  unit_code: string;
};

type Line = { key: string; tool_id: string; condition: (typeof SENDABLE_CONDITIONS)[number]; quantity: string };
type MaterialLine = { key: string; material_id: string; quantity: string };

let keySeed = 0;
const nextKey = () => `line-${++keySeed}`;

/** Buat surat jalan (ALT-03): stock leaves the origin when sent. */
export function NoteForm({
  locations,
  stock,
  materialStock,
  today,
}: {
  locations: { value: string; label: string }[];
  stock: StockItem[];
  materialStock: MaterialStockItem[];
  today: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(locations[0]?.value ?? "");
  const [to, setTo] = useState("");
  const [date, setDate] = useState<string | null>(today);
  const [vehicle, setVehicle] = useState("");
  const [driver, setDriver] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [materialLines, setMaterialLines] = useState<MaterialLine[]>([]);
  const [pending, setPending] = useState(false);

  const atOrigin = useMemo(() => stock.filter((item) => item.location_id === from), [stock, from]);
  const toolOptions = useMemo(() => {
    const seen = new Map<string, { value: string; label: string; description: string }>();
    const byCondition = [...atOrigin].sort((a, b) => CONDITIONS.indexOf(a.condition) - CONDITIONS.indexOf(b.condition));
    for (const item of byCondition) {
      if (item.condition === "lost") continue;
      const current = seen.get(item.tool_id);
      const part = `${CONDITION_LABELS[item.condition]} ${item.quantity}`;
      seen.set(item.tool_id, {
        value: item.tool_id,
        label: `${item.tool_code} — ${item.tool_name}`,
        description: current ? `${current.description} · ${part}` : part,
      });
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [atOrigin]);

  const materialsAtOrigin = useMemo(() => materialStock.filter((item) => item.location_id === from), [materialStock, from]);
  const materialOptions = useMemo(
    () =>
      materialsAtOrigin
        .map((item) => ({
          value: item.material_id,
          label: `${item.material_code} — ${item.material_name}`,
          description: `Tersedia ${formatQuantity(item.quantity)} ${item.unit_code}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [materialsAtOrigin],
  );
  const materialAt = (materialId: string) => materialsAtOrigin.find((item) => item.material_id === materialId);

  function updateMaterial(key: string, patch: Partial<MaterialLine>) {
    setMaterialLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  const available = (toolId: string, condition: ToolCondition) =>
    atOrigin.find((item) => item.tool_id === toolId && item.condition === condition)?.quantity ?? 0;

  function update(key: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function submit() {
    const parsed = deliveryNoteSchema.safeParse({
      from_location_id: from,
      to_location_id: to,
      note_date: date,
      vehicle,
      driver,
      notes,
      lines: lines.map((line) => ({ tool_id: line.tool_id, condition: line.condition, quantity: line.quantity })),
      material_lines: materialLines.map((line) => ({ material_id: line.material_id, quantity: line.quantity })),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
      return;
    }
    setPending(true);
    const result = await sendDeliveryNote(parsed.data);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/operations/delivery-notes/${result.data?.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="note-from">Lokasi asal *</FieldLabel>
              <Select
                value={from}
                onValueChange={(value) => {
                  setFrom(value);
                  setLines([]);
                  setMaterialLines([]);
                }}
              >
                <SelectTrigger id="note-from" className="w-full">
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="note-to">Lokasi tujuan *</FieldLabel>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger id="note-to" className="w-full">
                  <SelectValue placeholder="Pilih lokasi" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((option) => option.value !== from)
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="note-date">Tanggal *</FieldLabel>
              <DatePicker id="note-date" value={date} onChange={setDate} max={today} />
            </Field>
            <Field>
              <FieldLabel htmlFor="note-vehicle">Kendaraan</FieldLabel>
              <Input id="note-vehicle" value={vehicle} onChange={(event) => setVehicle(event.target.value)} maxLength={60} placeholder="Mis. Truk L 9123 AB" />
            </Field>
            <Field>
              <FieldLabel htmlFor="note-driver">Sopir</FieldLabel>
              <Input id="note-driver" value={driver} onChange={(event) => setDriver(event.target.value)} maxLength={60} />
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="note-notes">Catatan</FieldLabel>
              <Textarea id="note-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} />
              <FieldDescription>Biaya angkut dicatat terpisah di tagihan/pengeluaran dengan menyebut nomor surat jalan.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar alat</CardTitle>
          <CardDescription>
            Hanya alat yang ada di lokasi asal; jumlah tidak boleh melebihi stok per kondisi. Isi alat, material, atau
            keduanya.
          </CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLines((current) => [...current, { key: nextKey(), tool_id: "", condition: "good", quantity: "1" }])}
            >
              <PlusIcon />
              Alat
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {lines.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada alat.</p> : null}
          {lines.map((line, index) => {
            const max = line.tool_id ? available(line.tool_id, line.condition) : 0;
            return (
              <div key={line.key} className="flex flex-col gap-3 md:flex-row md:items-start">
                <Field className="flex-1">
                  <FieldLabel htmlFor={`line-tool-${index}`}>Alat</FieldLabel>
                  <Combobox
                    id={`line-tool-${index}`}
                    value={line.tool_id}
                    onChange={(value) => update(line.key, { tool_id: value })}
                    options={toolOptions}
                    placeholder="Pilih alat"
                    searchPlaceholder="Cari kode atau nama alat"
                    emptyText="Tidak ada alat di lokasi asal."
                  />
                </Field>
                <Field className="md:w-44">
                  <FieldLabel htmlFor={`line-condition-${index}`}>Kondisi</FieldLabel>
                  <Select value={line.condition} onValueChange={(value) => update(line.key, { condition: value as Line["condition"] })}>
                    <SelectTrigger id={`line-condition-${index}`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SENDABLE_CONDITIONS.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {CONDITION_LABELS[condition]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="md:w-32">
                  <FieldLabel htmlFor={`line-quantity-${index}`}>Jumlah</FieldLabel>
                  <Input
                    id={`line-quantity-${index}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={max || undefined}
                    value={line.quantity}
                    onChange={(event) => update(line.key, { quantity: event.target.value })}
                  />
                  {line.tool_id ? <FieldDescription>Tersedia {max}</FieldDescription> : null}
                </Field>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:mt-6"
                  onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                  aria-label={`Hapus baris ${index + 1}`}
                >
                  <Trash2Icon />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar material</CardTitle>
          <CardDescription>Material yang ada di lokasi asal (MAT-04); jumlah tidak boleh melebihi stok.</CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMaterialLines((current) => [...current, { key: nextKey(), material_id: "", quantity: "" }])}
            >
              <PlusIcon />
              Material
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {materialLines.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada material.</p> : null}
          {materialLines.map((line, index) => {
            const item = line.material_id ? materialAt(line.material_id) : undefined;
            return (
              <div key={line.key} className="flex flex-col gap-3 md:flex-row md:items-start">
                <Field className="flex-1">
                  <FieldLabel htmlFor={`mline-material-${index}`}>Material</FieldLabel>
                  <Combobox
                    id={`mline-material-${index}`}
                    value={line.material_id}
                    onChange={(value) => updateMaterial(line.key, { material_id: value })}
                    options={materialOptions}
                    placeholder="Pilih material"
                    searchPlaceholder="Cari kode atau nama material"
                    emptyText="Tidak ada material di lokasi asal."
                  />
                </Field>
                <Field className="md:w-40">
                  <FieldLabel htmlFor={`mline-quantity-${index}`}>Jumlah{item ? ` (${item.unit_code})` : ""}</FieldLabel>
                  <Input
                    id={`mline-quantity-${index}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={line.quantity}
                    onChange={(event) => updateMaterial(line.key, { quantity: event.target.value })}
                  />
                  {item ? <FieldDescription>Tersedia {formatQuantity(item.quantity)}</FieldDescription> : null}
                </Field>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:mt-6"
                  onClick={() => setMaterialLines((current) => current.filter((entry) => entry.key !== line.key))}
                  aria-label={`Hapus material ${index + 1}`}
                >
                  <Trash2Icon />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => void submit()} disabled={pending}>
          {pending ? "Mengirim…" : "Kirim surat jalan"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/operations/delivery-notes">Batal</Link>
        </Button>
      </div>
    </div>
  );
}

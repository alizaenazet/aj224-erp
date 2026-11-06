"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Combobox } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { recordOpname } from "@/lib/materials/actions";
import { formatQuantity } from "@/lib/materials/labels";
import { opnameSchema } from "@/lib/materials/schema";

type Option = { value: string; label: string };
type MaterialChoice = { id: string; code: string; name: string; unit_code: string };

/** Stok opname per lokasi (MAT-05): only counted rows are sent; differences are audited. */
export function OpnameForm({
  locations,
  materials,
  stock,
  today,
}: {
  locations: Option[];
  materials: MaterialChoice[];
  stock: { material_id: string; location_id: string; quantity: number }[];
  today: string;
}) {
  const router = useRouter();
  const [location, setLocation] = useState(locations[0]?.value ?? "");
  const [date, setDate] = useState<string | null>(today);
  const [reason, setReason] = useState("");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const rows = useMemo(() => {
    const here = stock.filter((row) => row.location_id === location).map((row) => row.material_id);
    const ids = [...new Set([...here, ...extra])];
    return ids
      .map((id) => {
        const material = materials.find((item) => item.id === id);
        return material
          ? { ...material, system: stock.find((row) => row.material_id === id && row.location_id === location)?.quantity ?? 0 }
          : null;
      })
      .filter((row) => row !== null)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [stock, location, extra, materials]);

  const addOptions = materials
    .filter((material) => !rows.some((row) => row.id === material.id))
    .map((material) => ({ value: material.id, label: `${material.code} — ${material.name}` }));

  async function submit() {
    const parsed = opnameSchema.safeParse({
      location_id: location,
      txn_date: date,
      reason,
      lines: rows
        .filter((row) => (counts[row.id] ?? "") !== "")
        .map((row) => ({ material_id: row.id, counted_quantity: counts[row.id] })),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
      return;
    }
    setPending(true);
    const result = await recordOpname(parsed.data);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/operations/material-transactions/${result.data?.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="opname-location">Lokasi *</FieldLabel>
              <Select
                value={location}
                onValueChange={(value) => {
                  setLocation(value);
                  setCounts({});
                  setExtra([]);
                }}
              >
                <SelectTrigger id="opname-location" className="w-full">
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
              <FieldLabel htmlFor="opname-date">Tanggal hitung *</FieldLabel>
              <DatePicker id="opname-date" value={date} onChange={setDate} max={today} />
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="opname-reason">Alasan *</FieldLabel>
              <Textarea
                id="opname-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={300}
                placeholder="Mis. Opname bulanan, penutupan proyek"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hasil hitung fisik</CardTitle>
          <CardDescription>Isi jumlah hitung hanya untuk material yang dihitung; baris kosong tidak diubah.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Sistem</TableHead>
                <TableHead className="w-40">Hitung fisik</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const value = counts[row.id] ?? "";
                const diff = value === "" ? null : Number(value) - row.system;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-72 whitespace-normal">
                      <span className="font-medium">{row.code}</span>
                      <div className="text-xs text-muted-foreground">{row.name}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatQuantity(row.system)} {row.unit_code}
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={`Hitung fisik ${row.code}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={value}
                        onChange={(event) => setCounts((current) => ({ ...current, [row.id]: event.target.value }))}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {diff === null ? "—" : `${diff > 0 ? "+" : ""}${formatQuantity(diff)}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Field>
            <FieldLabel htmlFor="opname-add">Tambah material lain</FieldLabel>
            <Combobox
              id="opname-add"
              value=""
              onChange={(value) => setExtra((current) => [...current, value])}
              options={addOptions}
              placeholder="Pilih material yang ditemukan di lokasi"
              searchPlaceholder="Cari kode atau nama"
            />
          </Field>
        </CardContent>
      </Card>

      <div>
        <Button onClick={() => void submit()} disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan stok opname"}
        </Button>
      </div>
    </div>
  );
}

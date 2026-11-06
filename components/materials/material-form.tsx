"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createMaterial, updateMaterial } from "@/lib/materials/actions";
import { MATERIAL_OWNERSHIP_LABELS, MATERIAL_OWNERSHIPS } from "@/lib/materials/labels";
import { materialSchema, type MaterialInput } from "@/lib/materials/schema";

type Option = { value: string; label: string };

type MaterialFormProps = {
  materialId?: string;
  defaultValues?: Partial<MaterialInput>;
  isActive?: boolean;
  categories: Option[];
  units: Option[];
  locations: Option[];
};

/** Create (with optional opening stock) or edit a material (MAT-01). */
export function MaterialForm({ materialId, defaultValues, isActive = true, categories, units, locations }: MaterialFormProps) {
  const router = useRouter();
  const editing = Boolean(materialId);
  const form = useForm<MaterialInput>({
    resolver: zodResolver(materialSchema) as unknown as Resolver<MaterialInput>,
    defaultValues: { code: "", name: "", ownership: "company", min_stock: null, notes: null, ...defaultValues },
  });
  const [active, setActive] = useState(isActive);
  const [openingLocation, setOpeningLocation] = useState(locations[0]?.value ?? "");
  const [openingQuantity, setOpeningQuantity] = useState("");

  async function onSubmit(values: MaterialInput) {
    const result = materialId
      ? await updateMaterial({ id: materialId, values, isActive: active })
      : await createMaterial({
          material: values,
          opening: { location_id: openingQuantity ? openingLocation : null, quantity: openingQuantity ? Number(openingQuantity) : null },
        });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/operations/materials/${materialId ?? (result.data as { id: string } | undefined)?.id}`);
  }

  const select = (name: "category_id" | "unit_code" | "ownership", label: string, options: Option[], disabled = false) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`material-${name}`}>{label}</FieldLabel>
          <Select value={(field.value as string | null) ?? ""} onValueChange={field.onChange} disabled={disabled}>
            <SelectTrigger id={`material-${name}`} className="w-full" aria-invalid={fieldState.invalid}>
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>Data material</FieldLegend>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Controller
            name="code"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="material-code">Kode *</FieldLabel>
                <Input id="material-code" {...field} maxLength={30} disabled={editing} aria-invalid={fieldState.invalid} />
                {editing ? <FieldDescription>Kode dan satuan tidak dapat diubah.</FieldDescription> : null}
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="material-name">Nama *</FieldLabel>
                <Input id="material-name" {...field} maxLength={120} aria-invalid={fieldState.invalid} />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          {select("unit_code", "Satuan *", units, editing)}
          {select("category_id", "Kategori *", categories)}
          {select(
            "ownership",
            "Kepemilikan *",
            MATERIAL_OWNERSHIPS.map((value) => ({ value, label: MATERIAL_OWNERSHIP_LABELS[value] })),
          )}
          <Controller
            name="min_stock"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="material-min">Stok minimum</FieldLabel>
                <Input
                  id="material-min"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value === "" ? null : event.target.value)}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>Untuk consumable milik perusahaan; pengingat harian bila di bawah minimum per lokasi.</FieldDescription>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="md:col-span-2">
                <FieldLabel htmlFor="material-notes">Catatan</FieldLabel>
                <Textarea id="material-notes" value={field.value ?? ""} onChange={field.onChange} maxLength={500} />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          {editing ? (
            <Field orientation="horizontal">
              <Switch id="material-active" checked={active} onCheckedChange={setActive} />
              <FieldLabel htmlFor="material-active">Aktif</FieldLabel>
            </Field>
          ) : null}
        </FieldGroup>
      </FieldSet>

      {editing ? null : (
        <FieldSet>
          <FieldLegend>Saldo awal (opsional)</FieldLegend>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="opening-location">Lokasi</FieldLabel>
              <Select value={openingLocation} onValueChange={setOpeningLocation}>
                <SelectTrigger id="opening-location" className="w-full">
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
              <FieldLabel htmlFor="opening-quantity">Jumlah</FieldLabel>
              <Input
                id="opening-quantity"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={openingQuantity}
                onChange={(event) => setOpeningQuantity(event.target.value)}
              />
              <FieldDescription>Kosongkan bila belum ada stok.</FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button asChild variant="outline">
          <Link href={materialId ? `/operations/materials/${materialId}` : "/operations/materials"}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}

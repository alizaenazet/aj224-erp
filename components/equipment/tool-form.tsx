"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { RupiahInput } from "@/components/app/rupiah-input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTool, updateTool } from "@/lib/equipment/actions";
import {
  CONDITION_LABELS,
  OWNERSHIP_LABELS,
  OWNERSHIPS,
  RENTAL_PERIOD_LABELS,
  RENTAL_PERIODS,
  SENDABLE_CONDITIONS,
  TRACKING_LABELS,
  TRACKINGS,
} from "@/lib/equipment/labels";
import { toolSchema, type OpeningInput, type ToolInput } from "@/lib/equipment/schema";

type Option = { value: string; label: string };

type ToolFormProps = {
  toolId?: string;
  defaultValues?: Partial<ToolInput>;
  categories: Option[];
  suppliers: Option[];
  locations: Option[];
  onDone?: () => void;
};

/** Create (with opening stock) or edit a tool (ALT-01). */
export function ToolForm({ toolId, defaultValues, categories, suppliers, locations, onDone }: ToolFormProps) {
  const router = useRouter();
  const editing = Boolean(toolId);
  const form = useForm<ToolInput>({
    resolver: zodResolver(toolSchema) as unknown as Resolver<ToolInput>,
    defaultValues: {
      code: "",
      name: "",
      tracking: "quantity",
      serial_no: null,
      ownership: "owned",
      supplier_id: null,
      rental_rate: null,
      rental_period: null,
      notes: null,
      ...defaultValues,
    },
  });
  const [tracking, ownership] = useWatch({ control: form.control, name: ["tracking", "ownership"] });
  const [opening, setOpening] = useState<OpeningInput>({
    location_id: locations[0]?.value ?? "",
    condition: "good",
    quantity: 1,
  });

  async function onSubmit(values: ToolInput) {
    const result = toolId
      ? await updateTool({ id: toolId, values })
      : await createTool({ tool: values, opening: { ...opening, quantity: values.tracking === "unit" ? 1 : opening.quantity } });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    if (onDone) onDone();
    else router.push(`/operations/tools/${toolId ?? (result.data as { id: string } | undefined)?.id}`);
  }

  const select = (name: "category_id" | "tracking" | "ownership" | "supplier_id" | "rental_period", label: string, options: Option[], disabled = false) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`tool-${name}`}>{label}</FieldLabel>
          <Select value={(field.value as string | null) ?? ""} onValueChange={field.onChange} disabled={disabled}>
            <SelectTrigger id={`tool-${name}`} className="w-full" aria-invalid={fieldState.invalid}>
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

  const text = (name: "code" | "name" | "serial_no", label: string, max: number, disabled = false) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`tool-${name}`}>{label}</FieldLabel>
          <Input
            id={`tool-${name}`}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            maxLength={max}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>Data alat</FieldLegend>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          {text("code", "Kode *", 30, editing)}
          {text("name", "Nama *", 120)}
          {select("category_id", "Kategori *", categories)}
          {select("tracking", "Pelacakan *", TRACKINGS.map((value) => ({ value, label: TRACKING_LABELS[value] })), editing)}
          {tracking === "unit" ? text("serial_no", "No. seri *", 60) : null}
          {select("ownership", "Kepemilikan *", OWNERSHIPS.map((value) => ({ value, label: OWNERSHIP_LABELS[value] })))}
          {ownership === "rented" ? (
            <>
              {select("supplier_id", "Supplier sewa *", suppliers)}
              <Controller
                name="rental_rate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="tool-rate">Tarif sewa *</FieldLabel>
                    <RupiahInput id="tool-rate" value={field.value} onChange={field.onChange} invalid={fieldState.invalid} />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              {select("rental_period", "Periode sewa *", RENTAL_PERIODS.map((value) => ({ value, label: RENTAL_PERIOD_LABELS[value] })))}
            </>
          ) : null}
          <Controller
            name="notes"
            control={form.control}
            render={({ field }) => (
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="tool-notes">Catatan</FieldLabel>
                <Textarea id="tool-notes" value={field.value ?? ""} onChange={field.onChange} maxLength={500} />
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      {editing ? null : (
        <FieldSet>
          <FieldLegend>Saldo awal</FieldLegend>
          <FieldDescription>Stok awal alat di satu lokasi; pindah lokasi berikutnya lewat surat jalan.</FieldDescription>
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="opening-location">Lokasi *</FieldLabel>
              <Select value={opening.location_id} onValueChange={(value) => setOpening((current) => ({ ...current, location_id: value }))}>
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
              <FieldLabel htmlFor="opening-condition">Kondisi *</FieldLabel>
              <Select
                value={opening.condition}
                onValueChange={(value) => setOpening((current) => ({ ...current, condition: value as OpeningInput["condition"] }))}
              >
                <SelectTrigger id="opening-condition" className="w-full">
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
            <Field>
              <FieldLabel htmlFor="opening-quantity">Jumlah *</FieldLabel>
              <Input
                id="opening-quantity"
                type="number"
                inputMode="numeric"
                min={1}
                value={tracking === "unit" ? 1 : opening.quantity}
                disabled={tracking === "unit"}
                onChange={(event) => setOpening((current) => ({ ...current, quantity: Number(event.target.value) }))}
              />
              {tracking === "unit" ? <FieldDescription>Alat Per Unit selalu berjumlah 1.</FieldDescription> : null}
            </Field>
          </FieldGroup>
        </FieldSet>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : editing ? "Simpan perubahan" : "Simpan alat"}
        </Button>
        {onDone ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Batal
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/operations/tools">Batal</Link>
          </Button>
        )}
      </div>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/format";
import { saveSection } from "@/lib/progress/actions";
import type { SectionRow } from "@/lib/progress/labels";
import { sectionSchema, type SectionInput } from "@/lib/progress/schema";

type SectionFormProps = {
  projectId: string;
  section: SectionRow | null;
  nextOrder: number;
  onDone: () => void;
};

/** Add or edit a pulling section (PRJ-05). */
export function SectionForm({ projectId, section, nextOrder, onDone }: SectionFormProps) {
  const form = useForm<SectionInput>({
    resolver: zodResolver(sectionSchema) as unknown as Resolver<SectionInput>,
    defaultValues: section
      ? {
          code: section.code,
          tower_from: section.tower_from,
          tower_to: section.tower_to,
          tower_count: section.tower_count,
          length_km: section.length_km,
          circuits: section.circuits,
          planned_start: section.planned_start,
          planned_finish: section.planned_finish,
          sort_order: section.sort_order,
          notes: section.notes,
        }
      : {
          code: "",
          tower_from: "",
          tower_to: "",
          tower_count: null,
          circuits: 2,
          sort_order: nextOrder,
          notes: null,
        },
  });
  const [length, circuits] = useWatch({ control: form.control, name: ["length_km", "circuits"] });
  const kms = Number(length) > 0 && Number(circuits) > 0 ? Number(length) * Number(circuits) : null;

  async function onSubmit(values: SectionInput) {
    const result = await saveSection({ projectId, sectionId: section?.id, values });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  const text = (name: "code" | "tower_from" | "tower_to", label: string, placeholder: string) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`section-${name}`}>{label} *</FieldLabel>
          <Input
            id={`section-${name}`}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            maxLength={20}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );

  const date = (name: "planned_start" | "planned_finish", label: string) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`section-${name}`}>{label} *</FieldLabel>
          <DatePicker id={`section-${name}`} value={field.value} onChange={field.onChange} invalid={fieldState.invalid} />
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <FieldGroup className="grid gap-4 sm:grid-cols-3">
        {text("code", "Kode seksi", "S-05")}
        {text("tower_from", "Tower awal", "T.21")}
        {text("tower_to", "Tower akhir", "T.27")}
        <Controller
          name="tower_count"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="section-tower-count">Jumlah tower</FieldLabel>
              <Input
                id="section-tower-count"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="length_km"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="section-length">Panjang *</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="section-length"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.001"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>km</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="circuits"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="section-circuits">Jumlah sirkuit *</FieldLabel>
              <Select value={field.value ? String(field.value) : ""} onValueChange={(value) => field.onChange(Number(value))}>
                <SelectTrigger id="section-circuits" className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((count) => (
                    <SelectItem key={count} value={String(count)}>
                      {count} sirkuit
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>kms = {kms === null ? "—" : formatNumber(kms, 3)}</FieldDescription>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        {date("planned_start", "Rencana mulai")}
        {date("planned_finish", "Rencana selesai")}
        <Controller
          name="sort_order"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="section-order">Urutan</FieldLabel>
              <Input
                id="section-order"
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value === "" ? "" : Number(event.target.value))}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-3">
              <FieldLabel htmlFor="section-notes">Catatan</FieldLabel>
              <Input
                id="section-notes"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={500}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

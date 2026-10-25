"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateSystemParameters } from "@/lib/parameters/actions";
import { parametersSchema, type ParametersInput } from "@/lib/parameters/schema";

type ParameterKey = keyof ParametersInput;

const FIELDS: { name: ParameterKey; label: string; unit: string; description: string; step?: string }[] = [
  {
    name: "backdate_days",
    label: "Batas input mundur",
    unit: "hari",
    description: "Absensi dan laporan harian boleh diisi paling lambat H+N.",
  },
  {
    name: "cert_expiry_warning_days",
    label: "Batas segera kedaluwarsa",
    unit: "hari",
    description: "Sertifikat berstatus Segera Kedaluwarsa dalam rentang ini.",
  },
  {
    name: "health_warning_points",
    label: "Ambang Waspada",
    unit: "poin",
    description: "Indeks biaya atau deviasi jadwal di atas nilai ini = Waspada.",
    step: "0.5",
  },
  {
    name: "health_critical_points",
    label: "Ambang Kritis",
    unit: "poin",
    description: "Indeks biaya atau deviasi jadwal di atas nilai ini = Kritis.",
    step: "0.5",
  },
  { name: "ppn_rate", label: "Tarif PPN", unit: "%", description: "Dipakai bila perusahaan PKP.", step: "0.01" },
  {
    name: "standard_work_hours",
    label: "Jam kerja standar",
    unit: "jam/hari",
    description: "Dipakai untuk jam kerja K3 (LTIFR).",
    step: "0.5",
  },
  {
    name: "monthly_salary_divisor",
    label: "Pembagi gaji harian",
    unit: "hari",
    description: "Potongan alpa staf bulanan = gaji pokok ÷ pembagi.",
  },
];

/** Tunable business-rule parameters (MST-10). */
export function ParametersForm({
  values,
  canEdit,
}: {
  values: Record<ParameterKey, number>;
  canEdit: boolean;
}) {
  const form = useForm<ParametersInput>({
    resolver: zodResolver(parametersSchema) as unknown as Resolver<ParametersInput>,
    defaultValues: values,
  });

  async function onSubmit(input: ParametersInput) {
    const result = await updateSystemParameters(input);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <fieldset disabled={!canEdit} className="contents">
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          {FIELDS.map((field) => (
            <Controller
              key={field.name}
              name={field.name}
              control={form.control}
              render={({ field: control, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`param-${field.name}`}>
                    {field.label} ({field.unit})
                  </FieldLabel>
                  <Input
                    id={`param-${field.name}`}
                    type="number"
                    inputMode="decimal"
                    step={field.step ?? "1"}
                    {...control}
                    value={String(control.value ?? "")}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>{field.description}</FieldDescription>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          ))}
        </FieldGroup>
        {canEdit ? (
          <div className="pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Menyimpan…" : "Simpan parameter"}
            </Button>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}

"use client";

import { Controller, type Control } from "react-hook-form";
import { DatePicker } from "@/components/app/date-picker";
import { RupiahInput } from "@/components/app/rupiah-input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ContractInput } from "@/lib/projects/schema";

export type ContractFormValues = { contract: ContractInput };

export const EMPTY_CONTRACT: ContractInput = {
  contract_no: null,
  contract_date: null,
  contract_value: 0,
  ppn_applicable: true,
  maintenance_months: null,
  scope: null,
};

/** PRJ-02 contract fields, shared by the new-project form and the contract dialog. */
export function ContractFields({ control }: { control: Control<ContractFormValues> }) {
  return (
    <FieldGroup className="grid gap-4 md:grid-cols-2">
      <Controller
        name="contract.contract_no"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="contract-no">Nomor kontrak/SPK</FieldLabel>
            <Input
              id="contract-no"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              maxLength={80}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
      <Controller
        name="contract.contract_date"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="contract-date">Tanggal kontrak</FieldLabel>
            <DatePicker id="contract-date" value={field.value} onChange={field.onChange} clearable invalid={fieldState.invalid} />
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
      <Controller
        name="contract.contract_value"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="contract-value">Nilai kontrak awal *</FieldLabel>
            <RupiahInput
              id="contract-value"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={fieldState.invalid}
            />
            <FieldDescription>Sebelum PPN. Perubahan nilai dicatat lewat addendum.</FieldDescription>
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
      <Controller
        name="contract.maintenance_months"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="contract-maintenance">Masa pemeliharaan</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="contract-maintenance"
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                step={1}
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>bulan</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
      <Controller
        name="contract.ppn_applicable"
        control={control}
        render={({ field }) => (
          <Field orientation="horizontal" className="md:col-span-2">
            <FieldContent>
              <FieldLabel htmlFor="contract-ppn">Dikenakan PPN</FieldLabel>
              <FieldDescription>Tarif PPN mengikuti parameter sistem saat faktur dibuat.</FieldDescription>
            </FieldContent>
            <Switch id="contract-ppn" checked={field.value} onCheckedChange={field.onChange} />
          </Field>
        )}
      />
      <Controller
        name="contract.scope"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="md:col-span-2">
            <FieldLabel htmlFor="contract-scope">Lingkup pekerjaan</FieldLabel>
            <Textarea
              id="contract-scope"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              maxLength={2000}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
    </FieldGroup>
  );
}

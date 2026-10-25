"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveMasterRecord } from "@/lib/master-data/actions";
import type { FieldOption, MasterEntity, MasterField } from "@/lib/master-data/entities";
import { buildMasterSchema, initialValues } from "@/lib/master-data/schema";

type FormValues = Record<string, unknown>;

type MasterRecordDialogProps = {
  entity: MasterEntity;
  /** Row being edited, or null for a new record. */
  row: Record<string, unknown> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificateOptions?: FieldOption[];
};

/** Create / edit form for one master record, built from the entity config. */
export function MasterRecordDialog(props: MasterRecordDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        {props.open ? (
          <RecordForm key={String(props.row?.[props.entity.idColumn] ?? "new")} {...props} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RecordForm({ entity, row, onOpenChange, certificateOptions = [] }: MasterRecordDialogProps) {
  const mode = row ? "edit" : "create";
  const schema = buildMasterSchema(entity.fields, mode);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: initialValues(entity.fields, row),
  });

  async function onSubmit(values: FormValues) {
    const id = row ? String(row[entity.idColumn]) : null;
    const result = await saveMasterRecord(entity.key, id, values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onOpenChange(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>{row ? `Ubah ${entity.singular}` : `Tambah ${entity.singular}`}</DialogTitle>
        <DialogDescription>{entity.description}</DialogDescription>
      </DialogHeader>
      <FieldGroup className="py-4">
        {entity.fields.map((field) => {
          if (mode === "edit" && field.editable === false) return null;
          if (mode === "create" && entity.insertValues && field.name in entity.insertValues) return null;
          return (
            <Controller
              key={field.name}
              name={field.name}
              control={form.control}
              render={({ field: control, fieldState }) => (
                <FormField
                  field={field}
                  value={control.value}
                  onChange={control.onChange}
                  onBlur={control.onBlur}
                  invalid={fieldState.invalid}
                  error={fieldState.error}
                  certificateOptions={certificateOptions}
                />
              )}
            />
          );
        })}
      </FieldGroup>
      <DialogFooter>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type FormFieldProps = {
  field: MasterField;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  invalid: boolean;
  error?: { message?: string };
  certificateOptions: FieldOption[];
};

function FormField({ field, value, onChange, onBlur, invalid, error, certificateOptions }: FormFieldProps) {
  const id = `field-${field.name}`;
  const label = field.required ? `${field.label} *` : field.label;
  const errorNode = invalid ? <FieldError errors={[error]} /> : null;

  if (field.type === "switch") {
    return (
      <Field orientation="horizontal" data-invalid={invalid}>
        <FieldContent>
          <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
          {field.description ? <FieldDescription>{field.description}</FieldDescription> : null}
        </FieldContent>
        <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />
      </Field>
    );
  }

  if (field.type === "certificates") {
    const selected = new Set((value as string[]) ?? []);
    return (
      <Field data-invalid={invalid}>
        <FieldLabel>{field.label}</FieldLabel>
        {certificateOptions.length === 0 ? (
          <FieldDescription>Belum ada jenis sertifikat aktif.</FieldDescription>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {certificateOptions.map((option) => (
              <Field key={option.value} orientation="horizontal">
                <Checkbox
                  id={`${id}-${option.value}`}
                  checked={selected.has(option.value)}
                  onCheckedChange={(checked) => {
                    const next = new Set(selected);
                    if (checked) next.add(option.value);
                    else next.delete(option.value);
                    onChange([...next]);
                  }}
                />
                <FieldLabel htmlFor={`${id}-${option.value}`} className="font-normal">
                  {option.label}
                </FieldLabel>
              </Field>
            ))}
          </div>
        )}
        {errorNode}
      </Field>
    );
  }

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {field.type === "select" ? (
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger id={id} aria-invalid={invalid} className="w-full">
            <SelectValue placeholder={`Pilih ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "textarea" ? (
        <Textarea
          id={id}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={invalid}
          maxLength={field.maxLength}
        />
      ) : (
        <Input
          id={id}
          type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
          inputMode={field.type === "number" ? "numeric" : undefined}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder}
          aria-invalid={invalid}
          maxLength={field.maxLength}
          min={field.min}
          max={field.max}
        />
      )}
      {field.description ? <FieldDescription>{field.description}</FieldDescription> : null}
      {errorNode}
    </Field>
  );
}

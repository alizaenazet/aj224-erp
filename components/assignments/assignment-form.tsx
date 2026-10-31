"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import { DatePicker } from "@/components/app/date-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { checkAssignmentFitness, createAssignment } from "@/lib/assignments/actions";
import { isFit, type FitnessRow } from "@/lib/assignments/labels";
import { assignmentSchema, type AssignmentInput } from "@/lib/assignments/schema";
import { CERTIFICATE_STATUS_LABELS, CERTIFICATE_STATUS_VARIANTS } from "@/lib/certifications/labels";
import { formatDate } from "@/lib/format";

type EmployeeOption = ComboboxOption & { position_id: string };

type AssignmentFormProps = {
  employees: EmployeeOption[];
  projects: ComboboxOption[];
  positions: { value: string; label: string }[];
  today: string;
  defaultProjectId?: string;
  onDone: () => void;
};

/** New assignment with the certificate check before saving (HCM-05, HCM-06). */
export function AssignmentForm({ employees, projects, positions, today, defaultProjectId, onDone }: AssignmentFormProps) {
  const form = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema) as unknown as Resolver<AssignmentInput>,
    defaultValues: {
      project_id: defaultProjectId,
      start_date: today,
      end_date: null,
      notes: null,
      override_reason: null,
    },
  });
  const [employeeId, positionId, startDate] = useWatch({
    control: form.control,
    name: ["employee_id", "position_id", "start_date"],
  });
  const [fitness, setFitness] = useState<{ key: string; rows: FitnessRow[] } | null>(null);
  const fitnessKey = employeeId && positionId && startDate ? `${employeeId}|${positionId}|${startDate}` : null;
  const current = fitness && fitness.key === fitnessKey ? fitness.rows : null;
  const unfit = current !== null && !isFit(current);

  useEffect(() => {
    if (!fitnessKey) return;
    let cancelled = false;
    void checkAssignmentFitness({ employeeId, positionId, startDate }).then((result) => {
      if (cancelled) return;
      if (result.ok) setFitness({ key: fitnessKey, rows: result.data ?? [] });
      else toast.error(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [fitnessKey, employeeId, positionId, startDate]);

  async function onSubmit(values: AssignmentInput) {
    if (unfit && !values.override_reason) {
      form.setError("override_reason", { message: "Isi alasan override karena sertifikat wajib belum lengkap." });
      return;
    }
    const result = await createAssignment({ ...values, override_reason: unfit ? values.override_reason : null });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="employee_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="assignment-employee">Karyawan *</FieldLabel>
              <Combobox
                id="assignment-employee"
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  const employee = employees.find((option) => option.value === value);
                  if (employee) form.setValue("position_id", employee.position_id, { shouldValidate: true });
                }}
                options={employees}
                placeholder="Pilih karyawan"
                searchPlaceholder="Cari nama atau NIK karyawan"
                emptyText="Tidak ada karyawan aktif yang cocok."
                invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="project_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="assignment-project">Proyek *</FieldLabel>
              <Combobox
                id="assignment-project"
                value={field.value}
                onChange={field.onChange}
                options={projects}
                placeholder="Pilih proyek"
                searchPlaceholder="Cari kode atau nama proyek"
                emptyText="Tidak ada proyek aktif yang cocok."
                invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="position_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="assignment-position">Jabatan di proyek *</FieldLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="assignment-position" className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((option) => (
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
        <Controller
          name="start_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="assignment-start">Tanggal mulai *</FieldLabel>
              <DatePicker id="assignment-start" value={field.value} onChange={field.onChange} invalid={fieldState.invalid} />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="end_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="assignment-end">Tanggal selesai</FieldLabel>
              <DatePicker id="assignment-end" value={field.value} onChange={field.onChange} clearable invalid={fieldState.invalid} />
              <FieldDescription>Kosongkan bila belum ditentukan.</FieldDescription>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Field className="sm:col-span-2">
          <FieldLabel>Sertifikat wajib jabatan</FieldLabel>
          {!fitnessKey ? (
            <FieldDescription>Pilih karyawan, jabatan dan tanggal mulai untuk memeriksa sertifikat.</FieldDescription>
          ) : current === null ? (
            <FieldDescription>Memeriksa sertifikat…</FieldDescription>
          ) : current.length === 0 ? (
            <FieldDescription>Jabatan ini tidak memerlukan sertifikat.</FieldDescription>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {current.map((row) => (
                <li key={row.certificate_type_id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>{row.certificate_type_name}</span>
                  <span className="flex items-center gap-2">
                    {row.expiry_date ? (
                      <span className="text-xs text-muted-foreground">s.d. {formatDate(row.expiry_date)}</span>
                    ) : null}
                    <Badge variant={CERTIFICATE_STATUS_VARIANTS[row.status]}>{CERTIFICATE_STATUS_LABELS[row.status]}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Field>
        {unfit ? (
          <>
            <Alert variant="destructive" className="sm:col-span-2">
              <AlertTitle>Belum Layak Tugas</AlertTitle>
              <AlertDescription>
                Sertifikat wajib belum ada atau kedaluwarsa pada tanggal mulai. Penugasan hanya dapat disimpan dengan alasan
                override, yang tercatat di log audit.
              </AlertDescription>
            </Alert>
            <Controller
              name="override_reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor="assignment-override">Alasan override *</FieldLabel>
                  <Textarea
                    id="assignment-override"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    maxLength={500}
                    placeholder="Mis. ujian ulang TKBT dijadwalkan minggu depan"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </>
        ) : null}
        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="assignment-notes">Catatan</FieldLabel>
              <Textarea
                id="assignment-notes"
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
        <Button type="submit" disabled={form.formState.isSubmitting || (fitnessKey !== null && current === null)}>
          {form.formState.isSubmitting ? "Menyimpan…" : unfit ? "Simpan dengan override" : "Simpan penugasan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

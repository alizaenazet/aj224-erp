"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { EmployeeMultiPicker } from "@/components/trainings/employee-multi-picker";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createTraining, updateTraining } from "@/lib/trainings/actions";
import { TRAINING_KIND_LABELS, type EmployeeOption } from "@/lib/trainings/labels";
import { trainingSchema, type TrainingInput } from "@/lib/trainings/schema";

const NO_CERTIFICATE = "none";

type TrainingFormProps = {
  /** Edit mode when set (participants are managed on the detail page). */
  trainingId?: string;
  defaultValues?: Partial<TrainingInput>;
  certificateTypes: { value: string; label: string }[];
  /** Create mode: participant options and the preselected ones. */
  employees?: EmployeeOption[];
  initialParticipants?: string[];
};

/** Create or edit a training (HCM-07). */
export function TrainingForm({
  trainingId,
  defaultValues,
  certificateTypes,
  employees = [],
  initialParticipants = [],
}: TrainingFormProps) {
  const router = useRouter();
  const form = useForm<TrainingInput>({
    resolver: zodResolver(trainingSchema) as unknown as Resolver<TrainingInput>,
    defaultValues: {
      organizer: null,
      end_date: null,
      location: null,
      certificate_type_id: null,
      notes: null,
      ...defaultValues,
    },
  });
  const [participants, setParticipants] = useState<string[]>(initialParticipants);
  const byId = new Map(employees.map((employee) => [employee.id, employee]));
  const cancelHref = trainingId ? `/hr/trainings/${trainingId}` : "/hr/trainings";

  async function onSubmit(values: TrainingInput) {
    const result = trainingId
      ? await updateTraining({ id: trainingId, values })
      : await createTraining({ values, employeeIds: participants });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/hr/trainings/${result.data?.id ?? trainingId}`);
  }

  const text = (name: "name" | "organizer" | "location", label: string, required = false, max = 120) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`training-${name}`}>{required ? `${label} *` : label}</FieldLabel>
          <Input
            id={`training-${name}`}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            maxLength={max}
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
        <FieldLegend>Pelatihan</FieldLegend>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          {text("name", "Nama pelatihan", true, 150)}
          <Controller
            name="kind"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="training-kind">Jenis *</FieldLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="training-kind" aria-invalid={fieldState.invalid} className="w-full">
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRAINING_KIND_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          {text("organizer", "Penyelenggara")}
          {text("location", "Lokasi")}
          <Controller
            name="start_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="training-start">Tanggal mulai *</FieldLabel>
                <DatePicker
                  id="training-start"
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? undefined)}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="end_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="training-end">Tanggal selesai</FieldLabel>
                <DatePicker
                  id="training-end"
                  value={field.value}
                  onChange={field.onChange}
                  clearable
                  invalid={fieldState.invalid}
                />
                <FieldDescription>Tanggal terbit sertifikat peserta Lulus.</FieldDescription>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          <Controller
            name="certificate_type_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="training-certificate">Sertifikat yang dihasilkan</FieldLabel>
                <Select
                  value={field.value ?? NO_CERTIFICATE}
                  onValueChange={(value) => field.onChange(value === NO_CERTIFICATE ? null : value)}
                >
                  <SelectTrigger id="training-certificate" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CERTIFICATE}>Tanpa sertifikat</SelectItem>
                    {certificateTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Peserta Lulus otomatis mendapat sertifikat ini.</FieldDescription>
              </Field>
            )}
          />
          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="md:col-span-2">
                <FieldLabel htmlFor="training-notes">Catatan</FieldLabel>
                <Textarea
                  id="training-notes"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  maxLength={500}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  Biaya pelatihan dicatat lewat Pengeluaran atau Tagihan Supplier kategori Pelatihan &
                  Sertifikasi.
                </FieldDescription>
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      {trainingId ? null : (
        <FieldSet>
          <FieldLegend>Peserta</FieldLegend>
          <div className="flex flex-col gap-3">
            <div>
              <EmployeeMultiPicker employees={employees} selected={participants} onChange={setParticipants} />
            </div>
            {participants.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIK Karyawan</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>
                      <span className="sr-only">Hapus</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((id) => {
                    const employee = byId.get(id);
                    return (
                      <TableRow key={id}>
                        <TableCell>{employee?.employee_no ?? "—"}</TableCell>
                        <TableCell className="font-medium">{employee?.full_name ?? "Karyawan nonaktif"}</TableCell>
                        <TableCell>{employee?.position ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Hapus ${employee?.full_name ?? "peserta"}`}
                            onClick={() => setParticipants(participants.filter((other) => other !== id))}
                          >
                            <XIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada peserta. Peserta juga dapat ditambahkan setelah pelatihan disimpan.
              </p>
            )}
          </div>
        </FieldSet>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : trainingId ? "Simpan perubahan" : "Simpan pelatihan"}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}

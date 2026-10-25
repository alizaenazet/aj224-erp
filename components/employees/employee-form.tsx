"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { Button } from "@/components/ui/button";
import {
  Field,
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
import { Textarea } from "@/components/ui/textarea";
import { createEmployee, updateEmployee } from "@/lib/employees/actions";
import {
  BLOOD_TYPES,
  EMPLOYMENT_STATUS_LABELS,
  WORK_TYPE_LABELS,
} from "@/lib/employees/labels";
import { employeeSchema, type EmployeeInput } from "@/lib/employees/schema";

type Option = { value: string; label: string };
type FieldName = keyof EmployeeInput;

type FieldConfig = {
  name: FieldName;
  label: string;
  required?: boolean;
  kind?: "text" | "textarea" | "date" | "select";
  options?: Option[];
  placeholder?: string;
  inputMode?: "numeric" | "tel";
  maxLength?: number;
  /** Spans both columns. */
  wide?: boolean;
};

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

function sections(positions: Option[]): { legend: string; fields: FieldConfig[] }[] {
  return [
    {
      legend: "Identitas",
      fields: [
        { name: "employee_no", label: "NIK karyawan", required: true, placeholder: "AJ-0101", maxLength: 30 },
        { name: "full_name", label: "Nama lengkap", required: true, maxLength: 120 },
        { name: "nik_ktp", label: "NIK KTP", inputMode: "numeric", placeholder: "16 digit", maxLength: 16 },
        { name: "phone", label: "No. HP", inputMode: "tel", placeholder: "0812-xxxx-xxxx", maxLength: 20 },
        { name: "birth_place", label: "Tempat lahir", maxLength: 80 },
        { name: "birth_date", label: "Tanggal lahir", kind: "date" },
        {
          name: "blood_type",
          label: "Golongan darah",
          kind: "select",
          options: BLOOD_TYPES.map((type) => ({ value: type, label: type })),
        },
        { name: "address", label: "Alamat", kind: "textarea", maxLength: 300, wide: true },
      ],
    },
    {
      legend: "Kontak darurat",
      fields: [
        { name: "emergency_contact_name", label: "Nama", maxLength: 120 },
        { name: "emergency_contact_phone", label: "No. HP", inputMode: "tel", maxLength: 20 },
      ],
    },
    {
      legend: "Pekerjaan",
      fields: [
        {
          name: "employment_status",
          label: "Status kerja",
          required: true,
          kind: "select",
          options: toOptions(EMPLOYMENT_STATUS_LABELS),
        },
        { name: "work_type", label: "Tipe", required: true, kind: "select", options: toOptions(WORK_TYPE_LABELS) },
        { name: "position_id", label: "Jabatan", required: true, kind: "select", options: positions },
        { name: "join_date", label: "Tanggal masuk", required: true, kind: "date" },
      ],
    },
    {
      legend: "Rekening & BPJS",
      fields: [
        { name: "bank_name", label: "Bank", placeholder: "BRI", maxLength: 60 },
        { name: "bank_account_number", label: "No. rekening", maxLength: 40 },
        { name: "bank_account_holder", label: "Atas nama", maxLength: 120 },
        { name: "bpjs_number", label: "No. BPJS", maxLength: 30 },
      ],
    },
  ];
}

type EmployeeFormProps = {
  /** Edit mode when set. */
  employeeId?: string;
  defaultValues?: EmployeeInput;
  positions: Option[];
};

/** Create or edit an employee (HCM-01). */
export function EmployeeForm({ employeeId, defaultValues, positions }: EmployeeFormProps) {
  const router = useRouter();
  const form = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema) as unknown as Resolver<EmployeeInput>,
    defaultValues,
  });
  const cancelHref = employeeId ? `/hr/employees/${employeeId}` : "/hr/employees";

  async function onSubmit(values: EmployeeInput) {
    const result = employeeId
      ? await updateEmployee({ id: employeeId, values })
      : await createEmployee(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/hr/employees/${result.data?.id ?? employeeId}`);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      {sections(positions).map((section) => (
        <FieldSet key={section.legend}>
          <FieldLegend>{section.legend}</FieldLegend>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            {section.fields.map((config) => (
              <Controller
                key={config.name}
                name={config.name}
                control={form.control}
                render={({ field, fieldState }) => {
                  const id = `employee-${config.name}`;
                  const value = (field.value as string | null | undefined) ?? "";
                  return (
                    <Field data-invalid={fieldState.invalid} className={config.wide ? "md:col-span-2" : undefined}>
                      <FieldLabel htmlFor={id}>
                        {config.required ? `${config.label} *` : config.label}
                      </FieldLabel>
                      {config.kind === "select" ? (
                        <Select value={value} onValueChange={field.onChange}>
                          <SelectTrigger id={id} aria-invalid={fieldState.invalid} className="w-full">
                            <SelectValue placeholder={`Pilih ${config.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {(config.options ?? []).map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : config.kind === "date" ? (
                        <DatePicker
                          id={id}
                          value={value || null}
                          onChange={field.onChange}
                          clearable={!config.required}
                          invalid={fieldState.invalid}
                        />
                      ) : config.kind === "textarea" ? (
                        <Textarea
                          id={id}
                          value={value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          maxLength={config.maxLength}
                          aria-invalid={fieldState.invalid}
                        />
                      ) : (
                        <Input
                          id={id}
                          value={value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          inputMode={config.inputMode}
                          placeholder={config.placeholder}
                          maxLength={config.maxLength}
                          aria-invalid={fieldState.invalid}
                        />
                      )}
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  );
                }}
              />
            ))}
          </FieldGroup>
        </FieldSet>
      ))}

      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : employeeId ? "Simpan perubahan" : "Simpan karyawan"}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}

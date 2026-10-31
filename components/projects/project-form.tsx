"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Control, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DatePicker } from "@/components/app/date-picker";
import {
  ContractFields,
  EMPTY_CONTRACT,
  type ContractFormValues,
} from "@/components/projects/contract-fields";
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
import { Textarea } from "@/components/ui/textarea";
import { createProject, updateProject } from "@/lib/projects/actions";
import { contractSchema, projectSchema, type ContractInput, type ProjectInput } from "@/lib/projects/schema";
import { VOLTAGES } from "@/lib/tenders/labels";

const NONE = "none";

const createSchema = z.object({ project: projectSchema, contract: contractSchema });
const editSchema = z.object({ project: projectSchema });

type FormValues = { project: ProjectInput; contract?: ContractInput };
type Option = { value: string; label: string };

const EMPTY_PROJECT: ProjectInput = {
  name: "",
  client_id: "",
  end_owner: null,
  site: null,
  voltage_kv: null,
  length_kms: null,
  tower_count: null,
  start_date: null,
  target_finish_date: null,
  notes: null,
};

type ProjectFormProps = {
  /** Set when editing; the contract is then edited on the Kontrak tab. */
  projectId?: string;
  defaultValues?: { project?: Partial<ProjectInput>; contract?: Partial<ContractInput> };
  clients: Option[];
  /** Won tender the new project comes from (MKT-09); its client is fixed. */
  tender?: { id: string; name: string } | null;
  /** Client cannot change (a project from a tender keeps the tender's client). */
  lockClient?: boolean;
};

/** Create (project + contract) or edit (project data) a project (PRJ-01, PRJ-02). */
export function ProjectForm({ projectId, defaultValues, clients, tender, lockClient }: ProjectFormProps) {
  const router = useRouter();
  const editing = Boolean(projectId);
  const form = useForm<FormValues>({
    resolver: zodResolver(editing ? editSchema : createSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      project: { ...EMPTY_PROJECT, ...defaultValues?.project },
      ...(editing ? {} : { contract: { ...EMPTY_CONTRACT, ...defaultValues?.contract } }),
    },
  });
  const cancelHref = projectId ? `/projects/${projectId}` : tender ? `/marketing/tenders/${tender.id}` : "/projects";

  async function onSubmit(values: FormValues) {
    const result = projectId
      ? await updateProject({ id: projectId, values: values.project })
      : await createProject({ project: values.project, contract: values.contract!, tenderId: tender?.id ?? null });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/projects/${result.data?.id ?? projectId}`);
  }

  const text = (name: "name" | "end_owner" | "site", label: string, required: boolean, max: number) => (
    <Controller
      name={`project.${name}`}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={name === "name" ? "md:col-span-2" : undefined}>
          <FieldLabel htmlFor={`project-${name}`}>{required ? `${label} *` : label}</FieldLabel>
          <Input
            id={`project-${name}`}
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

  const number = (name: "length_kms" | "tower_count", label: string, unit: string, step: string) => (
    <Controller
      name={`project.${name}`}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`project-${name}`}>{label}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`project-${name}`}
              type="number"
              inputMode="decimal"
              min={0}
              step={step}
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>{unit}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );

  const date = (name: "start_date" | "target_finish_date", label: string) => (
    <Controller
      name={`project.${name}`}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`project-${name}`}>{label}</FieldLabel>
          <DatePicker id={`project-${name}`} value={field.value} onChange={field.onChange} clearable invalid={fieldState.invalid} />
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>Proyek</FieldLegend>
        {tender ? (
          <FieldDescription>
            Dibuat dari tender{" "}
            <Link href={`/marketing/tenders/${tender.id}`} className="underline-offset-4 hover:underline">
              {tender.name}
            </Link>
            . Kode proyek dan lokasi gudang proyek dibuat otomatis.
          </FieldDescription>
        ) : editing ? null : (
          <FieldDescription>Kode proyek dan lokasi gudang proyek dibuat otomatis saat disimpan.</FieldDescription>
        )}
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          {text("name", "Nama proyek", true, 200)}
          <Controller
            name="project.client_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="project-client">Klien *</FieldLabel>
                <Select value={field.value || ""} onValueChange={field.onChange} disabled={Boolean(tender) || lockClient}>
                  <SelectTrigger id="project-client" aria-invalid={fieldState.invalid} className="w-full">
                    <SelectValue placeholder="Pilih klien" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((option) => (
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
          {text("end_owner", "Pemilik akhir", false, 120)}
          {text("site", "Lokasi pekerjaan", false, 150)}
          <Controller
            name="project.voltage_kv"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="project-voltage">Tegangan</FieldLabel>
                <Select
                  value={field.value ? String(field.value) : NONE}
                  onValueChange={(value) => field.onChange(value === NONE ? null : Number(value))}
                >
                  <SelectTrigger id="project-voltage" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Belum diketahui</SelectItem>
                    {VOLTAGES.map((kv) => (
                      <SelectItem key={kv} value={String(kv)}>
                        {kv} kV
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          {number("length_kms", "Panjang", "kms", "0.01")}
          {number("tower_count", "Jumlah tower", "tower", "1")}
          {date("start_date", "Tanggal mulai")}
          {date("target_finish_date", "Target selesai")}
          <Controller
            name="project.notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="md:col-span-2">
                <FieldLabel htmlFor="project-notes">Catatan</FieldLabel>
                <Textarea
                  id="project-notes"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  maxLength={1000}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      {editing ? null : (
        <FieldSet>
          <FieldLegend>Kontrak</FieldLegend>
          <ContractFields control={form.control as unknown as Control<ContractFormValues>} />
        </FieldSet>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : editing ? "Simpan perubahan" : "Simpan proyek"}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}

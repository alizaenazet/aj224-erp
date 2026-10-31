"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { RupiahInput } from "@/components/app/rupiah-input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerLocalWorker } from "@/lib/field/actions";
import { localWorkerSchema, type LocalWorkerInput } from "@/lib/field/schema";

type Option = { value: string; label: string };

/** Tambah pekerja lokal (HCM-12): minimal data, pending HCM verification. */
export function LocalWorkerForm({ projects, positions }: { projects: Option[]; positions: Option[] }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.value ?? "");
  const form = useForm<LocalWorkerInput>({
    resolver: zodResolver(localWorkerSchema) as unknown as Resolver<LocalWorkerInput>,
    defaultValues: { full_name: "", nik_ktp: "", phone: "" },
  });

  async function onSubmit(values: LocalWorkerInput) {
    const result = await registerLocalWorker({ projectId, values });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/field/attendance?project=${projectId}`);
  }

  const text = (
    name: "full_name" | "nik_ktp" | "phone",
    label: string,
    options: { inputMode?: "numeric" | "tel"; maxLength: number; placeholder?: string },
  ) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`worker-${name}`}>{label} *</FieldLabel>
          <Input
            id={`worker-${name}`}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputMode={options.inputMode}
            maxLength={options.maxLength}
            placeholder={options.placeholder}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        {projects.length > 1 ? (
          <Field className="md:col-span-2">
            <FieldLabel htmlFor="worker-project">Proyek *</FieldLabel>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="worker-project" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.value} value={project.value}>
                    {project.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        {text("full_name", "Nama lengkap", { maxLength: 120 })}
        {text("nik_ktp", "NIK KTP", { inputMode: "numeric", maxLength: 16, placeholder: "16 angka" })}
        {text("phone", "No. HP", { inputMode: "tel", maxLength: 20, placeholder: "08…" })}
        <Controller
          name="position_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="worker-position">Jabatan *</FieldLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="worker-position" className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.value} value={position.value}>
                      {position.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Hanya jabatan tanpa sertifikat wajib.</FieldDescription>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="daily_wage"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="worker-wage">Upah harian *</FieldLabel>
              <RupiahInput
                id="worker-wage"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>
      <FieldDescription>
        Pekerja langsung masuk daftar absensi proyek dengan status Menunggu Verifikasi HCM.
      </FieldDescription>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !projectId}>
          {form.formState.isSubmitting ? "Menyimpan…" : "Simpan pekerja"}
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Batal</Link>
        </Button>
      </div>
    </form>
  );
}

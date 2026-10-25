"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateCompanyProfile } from "@/lib/company/actions";
import type { CompanyProfile } from "@/lib/company/queries";
import { companyProfileSchema, type CompanyProfileInput } from "@/lib/company/schema";

type TextKey = "name" | "address" | "phone" | "email" | "npwp";

const TEXT_FIELDS: { name: TextKey; label: string; multiline?: boolean }[] = [
  { name: "name", label: "Nama perusahaan *" },
  { name: "address", label: "Alamat", multiline: true },
  { name: "phone", label: "Telepon" },
  { name: "email", label: "Email" },
  { name: "npwp", label: "NPWP" },
];

/** Company identity used on letterheads and invoices (MST-02). */
export function CompanyProfileForm({
  profile,
  canEdit,
}: {
  profile: CompanyProfile;
  canEdit: boolean;
}) {
  const form = useForm<CompanyProfileInput>({
    resolver: zodResolver(companyProfileSchema) as unknown as Resolver<CompanyProfileInput>,
    defaultValues: {
      name: profile.name,
      address: profile.address ?? "",
      phone: profile.phone ?? "",
      email: profile.email ?? "",
      npwp: profile.npwp ?? "",
      is_pkp: profile.is_pkp,
    },
  });

  async function onSubmit(values: CompanyProfileInput) {
    const result = await updateCompanyProfile(values);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <fieldset disabled={!canEdit} className="contents">
        <FieldGroup>
          {TEXT_FIELDS.map((field) => (
            <Controller
              key={field.name}
              name={field.name}
              control={form.control}
              render={({ field: control, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`company-${field.name}`}>{field.label}</FieldLabel>
                  {field.multiline ? (
                    <Textarea
                      id={`company-${field.name}`}
                      {...control}
                      value={control.value ?? ""}
                      aria-invalid={fieldState.invalid}
                    />
                  ) : (
                    <Input
                      id={`company-${field.name}`}
                      {...control}
                      value={control.value ?? ""}
                      aria-invalid={fieldState.invalid}
                    />
                  )}
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          ))}
          <Controller
            name="is_pkp"
            control={form.control}
            render={({ field }) => (
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="company-pkp">Pengusaha Kena Pajak (PKP)</FieldLabel>
                  <FieldDescription>
                    Bila aktif, invoice memungut PPN dan biaya dihitung tanpa PPN.
                  </FieldDescription>
                </FieldContent>
                <Switch id="company-pkp" checked={field.value} onCheckedChange={field.onChange} />
              </Field>
            )}
          />
          {canEdit ? (
            <div>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Menyimpan…" : "Simpan profil"}
              </Button>
            </div>
          ) : null}
        </FieldGroup>
      </fieldset>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { saveCertificate } from "@/lib/certifications/actions";
import type { CertificateRow } from "@/lib/certifications/labels";
import type { CertificateTypeOption } from "@/lib/certifications/queries";
import { certificateSchema, suggestExpiry, type CertificateInput } from "@/lib/certifications/schema";

type CertificateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  /** Edit mode when set. */
  certificate: CertificateRow | null;
  types: CertificateTypeOption[];
};

/** Add or edit one certificate (HCM-03). */
export function CertificateDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  certificate,
  types,
}: CertificateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{certificate ? "Ubah sertifikat" : "Tambah sertifikat"}</DialogTitle>
          <DialogDescription>{employeeName}</DialogDescription>
        </DialogHeader>
        {open ? (
          <CertificateForm
            employeeId={employeeId}
            certificate={certificate}
            types={types}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CertificateForm({
  employeeId,
  certificate,
  types,
  onDone,
}: {
  employeeId: string;
  certificate: CertificateRow | null;
  types: CertificateTypeOption[];
  onDone: () => void;
}) {
  const form = useForm<CertificateInput>({
    resolver: zodResolver(certificateSchema) as unknown as Resolver<CertificateInput>,
    defaultValues: certificate
      ? {
          certificate_type_id: certificate.certificate_type_id,
          certificate_no: certificate.certificate_no,
          issuer: certificate.issuer,
          issued_date: certificate.issued_date,
          expiry_date: certificate.expiry_date,
          notes: certificate.notes,
        }
      : { certificate_no: null, issuer: null, expiry_date: null, notes: null },
  });
  // Suggest the expiry until HCM sets one by hand (or when editing).
  const [expiryTouched, setExpiryTouched] = useState(certificate !== null);
  const typeOptions = types.filter(
    (type) => type.active || type.value === certificate?.certificate_type_id,
  );

  function suggest(typeId: string | undefined, issued: string | undefined) {
    if (expiryTouched || !typeId || !issued) return;
    const type = types.find((option) => option.value === typeId);
    form.setValue("expiry_date", suggestExpiry(issued, type?.validityMonths ?? null));
  }

  const selectedTypeId = useWatch({ control: form.control, name: "certificate_type_id" });
  const selectedType = types.find((option) => option.value === selectedTypeId);

  async function onSubmit(values: CertificateInput) {
    const result = await saveCertificate({
      employeeId,
      certificateId: certificate?.id,
      values,
    });
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
          name="certificate_type_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="certificate-type">Jenis sertifikat *</FieldLabel>
              <Select
                value={field.value ?? ""}
                onValueChange={(value) => {
                  field.onChange(value);
                  suggest(value, form.getValues("issued_date"));
                }}
              >
                <SelectTrigger id="certificate-type" aria-invalid={fieldState.invalid} className="w-full">
                  <SelectValue placeholder="Pilih jenis sertifikat" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType ? (
                <FieldDescription>
                  {selectedType.validityMonths
                    ? `Masa berlaku standar ${selectedType.validityMonths} bulan.`
                    : "Berlaku seumur hidup; kosongkan tanggal kedaluwarsa."}
                </FieldDescription>
              ) : null}
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="certificate_no"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="certificate-no">Nomor sertifikat</FieldLabel>
              <Input
                id="certificate-no"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={60}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="issuer"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="certificate-issuer">Penerbit</FieldLabel>
              <Input
                id="certificate-issuer"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={120}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="issued_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="certificate-issued">Tanggal terbit *</FieldLabel>
              <DatePicker
                id="certificate-issued"
                value={field.value}
                onChange={(value) => {
                  field.onChange(value ?? undefined);
                  suggest(form.getValues("certificate_type_id"), value ?? undefined);
                }}
                invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="expiry_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="certificate-expiry">Tanggal kedaluwarsa</FieldLabel>
              <DatePicker
                id="certificate-expiry"
                value={field.value}
                onChange={(value) => {
                  setExpiryTouched(true);
                  field.onChange(value);
                }}
                placeholder="Seumur hidup"
                clearable
                invalid={fieldState.invalid}
              />
              <FieldDescription>Kosongkan bila berlaku seumur hidup.</FieldDescription>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="certificate-notes">Catatan</FieldLabel>
              <Textarea
                id="certificate-notes"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={300}
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

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveClient } from "@/lib/clients/actions";
import { CLIENT_KIND_LABELS } from "@/lib/clients/labels";
import { clientSchema, type ClientInput } from "@/lib/clients/schema";

/** Create or edit a client (MKT-01). */
export function ClientForm({ clientId, defaultValues }: { clientId?: string; defaultValues?: ClientInput }) {
  const router = useRouter();
  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema) as unknown as Resolver<ClientInput>,
    defaultValues: defaultValues ?? {
      address: null,
      npwp: null,
      notes: null,
      payment_term_days: 30,
      is_active: true,
    },
  });
  const cancelHref = clientId ? `/marketing/clients/${clientId}` : "/marketing/clients";

  async function onSubmit(values: ClientInput) {
    const result = await saveClient({ id: clientId, values });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/marketing/clients/${result.data?.id ?? clientId}`);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="client-name">Nama perusahaan *</FieldLabel>
              <Input
                id="client-name"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={150}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="kind"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="client-kind">Jenis *</FieldLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="client-kind" aria-invalid={fieldState.invalid} className="w-full">
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CLIENT_KIND_LABELS).map(([value, label]) => (
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
        <Controller
          name="npwp"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="client-npwp">NPWP</FieldLabel>
              <Input
                id="client-npwp"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={30}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="payment_term_days"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="client-term">Termin pembayaran default *</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="client-term"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={365}
                  value={String(field.value ?? "")}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>hari</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>Dipakai untuk jatuh tempo invoice ke klien ini.</FieldDescription>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="address"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="md:col-span-2">
              <FieldLabel htmlFor="client-address">Alamat</FieldLabel>
              <Textarea
                id="client-address"
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
        <Controller
          name="notes"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="md:col-span-2">
              <FieldLabel htmlFor="client-notes">Catatan</FieldLabel>
              <Textarea
                id="client-notes"
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
        <Controller
          name="is_active"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="client-active">Aktif</FieldLabel>
                <FieldDescription>Klien nonaktif tidak ditawarkan untuk tender baru.</FieldDescription>
              </FieldContent>
              <Switch id="client-active" checked={field.value} onCheckedChange={field.onChange} />
            </Field>
          )}
        />
      </FieldGroup>
      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : clientId ? "Simpan perubahan" : "Simpan klien"}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}

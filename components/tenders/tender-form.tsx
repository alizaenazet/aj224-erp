"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { RupiahInput } from "@/components/app/rupiah-input";
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
import { formatRupiah } from "@/lib/format";
import { createTender, updateTender } from "@/lib/tenders/actions";
import { VOLTAGES } from "@/lib/tenders/labels";
import { tenderSchema, type TenderInput } from "@/lib/tenders/schema";

const NONE = "none";

type Option = { value: string; label: string };

type TenderFormProps = {
  tenderId?: string;
  defaultValues?: Partial<TenderInput>;
  clients: Option[];
  pics: Option[];
};

/** Create or edit a tender (MKT-03); a changed bid value asks for a revision note (MKT-05). */
export function TenderForm({ tenderId, defaultValues, clients, pics }: TenderFormProps) {
  const router = useRouter();
  const form = useForm<TenderInput>({
    resolver: zodResolver(tenderSchema) as unknown as Resolver<TenderInput>,
    defaultValues: {
      end_owner: null,
      location: null,
      voltage_kv: null,
      length_kms: null,
      tower_count: null,
      scope: null,
      info_date: null,
      bid_deadline: null,
      bid_value: null,
      estimated_cost: null,
      pic_id: null,
      win_probability: null,
      notes: null,
      ...defaultValues,
    },
  });
  const [revisionNote, setRevisionNote] = useState("");
  const bidValue = useWatch({ control: form.control, name: "bid_value" });
  const bidChanged = (defaultValues?.bid_value ?? null) !== (bidValue ?? null);
  const cancelHref = tenderId ? `/marketing/tenders/${tenderId}` : "/marketing/tenders";

  async function onSubmit(values: TenderInput) {
    const note = bidChanged ? revisionNote : undefined;
    const result = tenderId
      ? await updateTender({ id: tenderId, values, revisionNote: note })
      : await createTender({ values, revisionNote: note });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push(`/marketing/tenders/${result.data?.id ?? tenderId}`);
  }

  const text = (name: "name" | "end_owner" | "location", label: string, required = false, max = 150) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={name === "name" ? "md:col-span-2" : undefined}>
          <FieldLabel htmlFor={`tender-${name}`}>{required ? `${label} *` : label}</FieldLabel>
          <Input
            id={`tender-${name}`}
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

  const select = (name: "client_id" | "pic_id", label: string, options: Option[], required: boolean) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`tender-${name}`}>{required ? `${label} *` : label}</FieldLabel>
          <Select
            value={field.value ?? (required ? "" : NONE)}
            onValueChange={(value) => field.onChange(value === NONE ? null : value)}
          >
            <SelectTrigger id={`tender-${name}`} aria-invalid={fieldState.invalid} className="w-full">
              <SelectValue placeholder={`Pilih ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {required ? null : <SelectItem value={NONE}>Belum ditentukan</SelectItem>}
              {options.map((option) => (
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
  );

  const number = (name: "length_kms" | "tower_count", label: string, unit: string, step: string) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`tender-${name}`}>{label}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`tender-${name}`}
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

  const date = (name: "info_date" | "bid_deadline", label: string) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`tender-${name}`}>{label}</FieldLabel>
          <DatePicker id={`tender-${name}`} value={field.value} onChange={field.onChange} clearable invalid={fieldState.invalid} />
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );

  const money = (name: "bid_value" | "estimated_cost", label: string, description?: string) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`tender-${name}`}>{label}</FieldLabel>
          <RupiahInput
            id={`tender-${name}`}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            invalid={fieldState.invalid}
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>Paket</FieldLegend>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          {text("name", "Nama paket", true, 200)}
          {select("client_id", "Klien", clients, true)}
          {text("end_owner", "Pemilik akhir", false, 120)}
          {text("location", "Lokasi")}
          <Controller
            name="voltage_kv"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="tender-voltage">Tegangan</FieldLabel>
                <Select
                  value={field.value ? String(field.value) : NONE}
                  onValueChange={(value) => field.onChange(value === NONE ? null : Number(value))}
                >
                  <SelectTrigger id="tender-voltage" className="w-full">
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
          <Controller
            name="scope"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="md:col-span-2">
                <FieldLabel htmlFor="tender-scope">Lingkup pekerjaan</FieldLabel>
                <Textarea
                  id="tender-scope"
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

      <FieldSet>
        <FieldLegend>Penawaran</FieldLegend>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          {date("info_date", "Tanggal informasi")}
          {date("bid_deadline", "Batas penawaran")}
          {money("bid_value", "Nilai penawaran", "Setiap perubahan nilai tersimpan di riwayat revisi.")}
          {money("estimated_cost", "Estimasi biaya (HPP)")}
          {bidChanged && tenderId ? (
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="tender-revision-note">Catatan revisi penawaran</FieldLabel>
              <Input
                id="tender-revision-note"
                value={revisionNote}
                onChange={(event) => setRevisionNote(event.target.value)}
                maxLength={300}
                placeholder="Mis. negosiasi harga besi"
              />
              <FieldDescription>
                Nilai penawaran berubah dari {formatRupiah(defaultValues?.bid_value ?? null)} menjadi{" "}
                {formatRupiah(bidValue ?? null)}.
              </FieldDescription>
            </Field>
          ) : null}
          <Controller
            name="win_probability"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="tender-probability">Peluang menang</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="tender-probability"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    step={5}
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value === "" ? null : Number(event.target.value))}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>%</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
          {select("pic_id", "PIC", pics, false)}
          <FieldDescription className="md:col-span-2">
            Margin rencana dan nilai tertimbang dihitung otomatis setelah disimpan.
          </FieldDescription>
          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="md:col-span-2">
                <FieldLabel htmlFor="tender-notes">Catatan</FieldLabel>
                <Textarea
                  id="tender-notes"
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

      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : tenderId ? "Simpan perubahan" : "Simpan tender"}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}

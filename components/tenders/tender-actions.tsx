"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FlagIcon, HistoryIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { RupiahInput } from "@/components/app/rupiah-input";
import { AuditHistorySheet } from "@/components/audit/audit-history-sheet";
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
import { changeTenderStatus } from "@/lib/tenders/actions";
import {
  CLOSED_STATUSES,
  LOST_REASON_LABELS,
  TENDER_STATUS_LABELS,
  type Tender,
} from "@/lib/tenders/labels";
import { tenderStatusSchema, type TenderStatusInput } from "@/lib/tenders/schema";

type TenderActionsProps = {
  tender: Pick<
    Tender,
    "id" | "name" | "status" | "closed_date" | "lost_reason" | "lost_note" | "winner_name" | "winner_price"
  >;
  today: string;
  canManage: boolean;
  canViewHistory: boolean;
};

/** Ubah, Ubah Status (MKT-04) and Riwayat on the tender page. */
export function TenderActions({ tender, today, canManage, canViewHistory }: TenderActionsProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <>
      {canViewHistory ? (
        <Button variant="outline" onClick={() => setHistoryOpen(true)}>
          <HistoryIcon />
          Riwayat
        </Button>
      ) : null}
      {canManage ? (
        <>
          <Button asChild variant="outline">
            <Link href={`/marketing/tenders/${tender.id}/edit`}>
              <PencilIcon />
              Ubah
            </Link>
          </Button>
          <Button onClick={() => setStatusOpen(true)}>
            <FlagIcon />
            Ubah Status
          </Button>
          <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Ubah status tender</DialogTitle>
                <DialogDescription>{tender.name}</DialogDescription>
              </DialogHeader>
              {statusOpen ? (
                <StatusForm tender={tender} today={today} onDone={() => setStatusOpen(false)} />
              ) : null}
            </DialogContent>
          </Dialog>
        </>
      ) : null}
      <AuditHistorySheet
        target={historyOpen ? { table: "tenders", recordId: tender.id, title: tender.name } : null}
        onOpenChange={setHistoryOpen}
      />
    </>
  );
}

function StatusForm({
  tender,
  today,
  onDone,
}: {
  tender: TenderActionsProps["tender"];
  today: string;
  onDone: () => void;
}) {
  const form = useForm<TenderStatusInput>({
    resolver: zodResolver(tenderStatusSchema) as unknown as Resolver<TenderStatusInput>,
    defaultValues: {
      status: tender.status,
      closed_date: tender.closed_date ?? today,
      lost_reason: tender.lost_reason,
      lost_note: tender.lost_note,
      winner_name: tender.winner_name,
      winner_price: tender.winner_price,
    },
  });
  const status = useWatch({ control: form.control, name: "status" });
  const closed = CLOSED_STATUSES.includes(status);
  const lost = status === "lost";

  async function onSubmit(values: TenderStatusInput) {
    const result = await changeTenderStatus({
      id: tender.id,
      values: { ...values, closed_date: closed ? values.closed_date : null },
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
          name="status"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="tender-status">Status *</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="tender-status" aria-invalid={fieldState.invalid} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TENDER_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {CLOSED_STATUSES.includes(tender.status) && !closed ? (
                <FieldDescription>Membuka kembali tender menghapus data penutupannya.</FieldDescription>
              ) : null}
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        {closed ? (
          <Controller
            name="closed_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="tender-closed">Tanggal penutupan *</FieldLabel>
                <DatePicker id="tender-closed" value={field.value} onChange={field.onChange} max={today} />
                <FieldDescription>Dipakai untuk periode analitik.</FieldDescription>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        ) : null}
        {lost ? (
          <>
            <Controller
              name="lost_reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tender-lost-reason">Alasan kalah *</FieldLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="tender-lost-reason" aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Pilih alasan" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOST_REASON_LABELS).map(([value, label]) => (
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
              name="winner_name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tender-winner">Pemenang</FieldLabel>
                  <Input
                    id="tender-winner"
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
              name="winner_price"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tender-winner-price">Harga pemenang</FieldLabel>
                  <RupiahInput
                    id="tender-winner-price"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              name="lost_note"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                  <FieldLabel htmlFor="tender-lost-note">Keterangan</FieldLabel>
                  <Textarea
                    id="tender-lost-note"
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
          </>
        ) : null}
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : "Simpan status"}
        </Button>
      </DialogFooter>
    </form>
  );
}

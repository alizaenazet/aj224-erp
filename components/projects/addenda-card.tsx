"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FilePlusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { RupiahInput } from "@/components/app/rupiah-input";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatRupiah, todayWib } from "@/lib/format";
import { addAddendum } from "@/lib/projects/actions";
import type { AddendumRow } from "@/lib/projects/labels";
import { addendumSchema, type AddendumInput } from "@/lib/projects/schema";

/** Addendum history, newest first; addenda are never edited (PRJ-02). */
export function AddendaCard({
  projectId,
  addenda,
  canManage,
}: {
  projectId: string;
  addenda: AddendumRow[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Addendum</CardTitle>
        <CardDescription>Tidak bisa diubah setelah disimpan; koreksi dicatat dengan addendum baru.</CardDescription>
        {canManage ? (
          <CardAction>
            <Button size="sm" onClick={() => setOpen(true)}>
              <PlusIcon />
              Tambah addendum
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {addenda.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FilePlusIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada addendum</EmptyTitle>
              <EmptyDescription>Nilai dan jadwal mengikuti kontrak awal.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nilai baru</TableHead>
                <TableHead>Target selesai baru</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addenda.map((addendum) => (
                <TableRow key={addendum.id}>
                  <TableCell className="font-medium">{addendum.addendum_no}</TableCell>
                  <TableCell>{formatDate(addendum.addendum_date)}</TableCell>
                  <TableCell>{addendum.new_value === null ? "Tetap" : formatRupiah(addendum.new_value)}</TableCell>
                  <TableCell>{addendum.new_finish_date ? formatDate(addendum.new_finish_date) : "Tetap"}</TableCell>
                  <TableCell className="max-w-80 whitespace-normal">{addendum.description ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {canManage ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah addendum</DialogTitle>
              <DialogDescription>Isi nilai kontrak baru, target selesai baru, atau keduanya.</DialogDescription>
            </DialogHeader>
            {open ? <AddendumForm projectId={projectId} onDone={() => setOpen(false)} /> : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
}

function AddendumForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const form = useForm<AddendumInput>({
    resolver: zodResolver(addendumSchema) as unknown as Resolver<AddendumInput>,
    defaultValues: {
      addendum_no: "",
      addendum_date: todayWib(),
      new_value: null,
      new_finish_date: null,
      description: null,
    },
  });

  async function onSubmit(values: AddendumInput) {
    const result = await addAddendum({ projectId, values });
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
          name="addendum_no"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="addendum-no">Nomor addendum *</FieldLabel>
              <Input
                id="addendum-no"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={60}
                placeholder="Mis. ADD-02"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="addendum_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="addendum-date">Tanggal *</FieldLabel>
              <DatePicker id="addendum-date" value={field.value} onChange={field.onChange} invalid={fieldState.invalid} />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="new_value"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="addendum-value">Nilai kontrak baru</FieldLabel>
              <RupiahInput
                id="addendum-value"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
                placeholder="Kosongkan jika tetap"
              />
              <FieldDescription>Sebelum PPN.</FieldDescription>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="new_finish_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="addendum-finish">Target selesai baru</FieldLabel>
              <DatePicker
                id="addendum-finish"
                value={field.value}
                onChange={field.onChange}
                clearable
                invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor="addendum-description">Keterangan</FieldLabel>
              <Textarea
                id="addendum-description"
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
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : "Simpan addendum"}
        </Button>
      </DialogFooter>
    </form>
  );
}

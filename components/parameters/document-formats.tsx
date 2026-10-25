"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateDocumentFormat } from "@/lib/parameters/actions";
import {
  RESET_PERIODS,
  documentFormatSchema,
  type DocumentFormatInput,
} from "@/lib/parameters/schema";

export type DocumentType = {
  code: string;
  label: string;
  format: string;
  reset_period: "month" | "year" | "never";
};

const resetLabel = (value: string) =>
  RESET_PERIODS.find((period) => period.value === value)?.label ?? value;

/** Document number formats per type (UMM-10, MST-10). */
export function DocumentFormats({ types, canEdit }: { types: DocumentType[]; canEdit: boolean }) {
  const [editing, setEditing] = useState<DocumentType | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dokumen</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Reset nomor</TableHead>
            {canEdit ? (
              <TableHead>
                <span className="sr-only">Tindakan</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {types.map((type) => (
            <TableRow key={type.code}>
              <TableCell className="font-medium">{type.label}</TableCell>
              <TableCell className="font-mono">{type.format}</TableCell>
              <TableCell>{resetLabel(type.reset_period)}</TableCell>
              {canEdit ? (
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(type)}
                    aria-label={`Ubah format ${type.label}`}
                  >
                    <PencilIcon />
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          {editing ? (
            <FormatForm key={editing.code} type={editing} onDone={() => setEditing(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FormatForm({ type, onDone }: { type: DocumentType; onDone: () => void }) {
  const form = useForm<DocumentFormatInput>({
    resolver: zodResolver(documentFormatSchema),
    defaultValues: { format: type.format, reset_period: type.reset_period },
  });

  async function onSubmit(values: DocumentFormatInput) {
    const result = await updateDocumentFormat(type.code, values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <DialogHeader>
        <DialogTitle>Format nomor {type.label}</DialogTitle>
        <DialogDescription>
          Token: {"{YYYY}"} tahun, {"{YY}"} tahun 2 digit, {"{MM}"} bulan, {"{SEQ:n}"} nomor urut n digit.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup className="py-4">
        <Controller
          name="format"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="doc-format">Format *</FieldLabel>
              <Input id="doc-format" {...field} className="font-mono" aria-invalid={fieldState.invalid} />
              <FieldDescription>Contoh: INV/AJ224/{"{YYYY}"}/{"{MM}"}/{"{SEQ:3}"}</FieldDescription>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="reset_period"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="doc-reset">Reset nomor urut</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="doc-reset" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESET_PERIODS.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

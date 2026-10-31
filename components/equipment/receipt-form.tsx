"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConditionBadge } from "@/components/equipment/badges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { receiveDeliveryNote } from "@/lib/equipment/actions";
import type { NoteLine } from "@/lib/equipment/labels";

type Draft = { good: string; damaged: string; note: string };

/** Konfirmasi penerimaan (ALT-04): per line Baik/Rusak; the rest is recorded as Hilang. */
export function ReceiptForm({ noteId, lines, hasPhoto }: { noteId: string; lines: NoteLine[]; hasPhoto: boolean }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(lines.map((line) => [line.id, { good: String(line.quantity), damaged: "0", note: "" }])),
  );
  const [receiptNote, setReceiptNote] = useState("");
  const [pending, setPending] = useState(false);

  const missing = (line: NoteLine) => {
    const draft = drafts[line.id];
    return line.quantity - (Number(draft.good) || 0) - (Number(draft.damaged) || 0);
  };
  const discrepancy = lines.some((line) => missing(line) !== 0 || (Number(drafts[line.id].damaged) || 0) > 0);

  function update(id: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  async function submit() {
    setPending(true);
    const result = await receiveDeliveryNote({
      id: noteId,
      values: {
        lines: lines.map((line) => ({
          line_id: line.id,
          received_good: Number(drafts[line.id].good) || 0,
          received_damaged: Number(drafts[line.id].damaged) || 0,
          receipt_note: drafts[line.id].note,
        })),
        receipt_note: receiptNote,
      },
    });
    setPending(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konfirmasi penerimaan</CardTitle>
        <CardDescription>
          Isi jumlah yang tiba dalam kondisi Baik dan Rusak. Sisanya tercatat Hilang di lokasi tujuan.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {lines.map((line) => {
          const gap = missing(line);
          return (
            <div key={line.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{line.tool_code}</span>
                <span className="text-muted-foreground">{line.tool_name}</span>
                <span>· dikirim {line.quantity}</span>
                <ConditionBadge condition={line.condition} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor={`good-${line.id}`}>Diterima Baik</FieldLabel>
                  <Input
                    id={`good-${line.id}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={line.quantity}
                    value={drafts[line.id].good}
                    onChange={(event) => update(line.id, { good: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`damaged-${line.id}`}>Diterima Rusak</FieldLabel>
                  <Input
                    id={`damaged-${line.id}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={line.quantity}
                    value={drafts[line.id].damaged}
                    onChange={(event) => update(line.id, { damaged: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Tidak ada (Hilang)</FieldLabel>
                  <Input value={String(gap)} disabled aria-invalid={gap < 0} />
                  {gap < 0 ? <FieldDescription>Melebihi jumlah kirim.</FieldDescription> : null}
                </Field>
              </div>
              {gap !== 0 || (Number(drafts[line.id].damaged) || 0) > 0 ? (
                <Field>
                  <FieldLabel htmlFor={`note-${line.id}`}>Keterangan selisih *</FieldLabel>
                  <Input
                    id={`note-${line.id}`}
                    value={drafts[line.id].note}
                    onChange={(event) => update(line.id, { note: event.target.value })}
                    maxLength={300}
                    placeholder="Mis. 1 pecah, 1 tidak ada di truk"
                  />
                </Field>
              ) : null}
            </div>
          );
        })}
        <Field>
          <FieldLabel htmlFor="receipt-note">Catatan penerimaan</FieldLabel>
          <Textarea id="receipt-note" value={receiptNote} onChange={(event) => setReceiptNote(event.target.value)} maxLength={500} />
        </Field>
        {discrepancy && !hasPhoto ? (
          <Alert variant="warning">
            <AlertDescription>Ada selisih: lampirkan minimal satu foto di bagian Foto penerimaan sebelum konfirmasi.</AlertDescription>
          </Alert>
        ) : null}
        <Button size="lg" onClick={() => void submit()} disabled={pending}>
          {pending ? "Menyimpan…" : "Konfirmasi penerimaan"}
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRupiah } from "@/lib/format";
import { addAdjustment, deleteAdjustment } from "@/lib/payroll/actions";
import { ADJUSTMENT_LABELS, type AdjustmentRow } from "@/lib/payroll/labels";

/** PAY-03: manual components with a required note; the slip is recomputed. */
export function AdjustmentEditor({
  periodId,
  employeeId,
  adjustments,
  editable,
}: {
  periodId: string;
  employeeId: string;
  adjustments: AdjustmentRow[];
  editable: boolean;
}) {
  const router = useRouter();
  const [kind, setKind] = useState("incentive");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  async function run(call: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setPending(true);
    const result = await call();
    setPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Gagal.");
      return false;
    }
    toast.success(result.message ?? "Tersimpan.");
    router.refresh();
    return true;
  }

  return (
    <div className="flex flex-col gap-4">
      {adjustments.length ? (
        <ul className="flex flex-col gap-2 text-sm">
          {adjustments.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-medium">{ADJUSTMENT_LABELS[item.kind]}</span>
                <span className="text-muted-foreground">{item.note}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums">{formatRupiah(item.amount)}</span>
                {editable ? (
                  <Button variant="ghost" size="icon" aria-label="Hapus penyesuaian" disabled={pending} onClick={() => void run(() => deleteAdjustment({ id: item.id }))}>
                    <Trash2Icon />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada penyesuaian manual.</p>
      )}
      {editable ? (
        <FieldGroup className="grid gap-3 md:grid-cols-4 md:items-end">
          <Field>
            <FieldLabel htmlFor="adj-kind">Jenis</FieldLabel>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger id="adj-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ADJUSTMENT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="adj-amount">Jumlah (Rp){kind === "correction" ? " ±" : ""}</FieldLabel>
            <Input id="adj-amount" type="number" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="adj-note">Keterangan *</FieldLabel>
            <Input id="adj-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} />
          </Field>
          <Button
            disabled={pending}
            onClick={async () => {
              const ok = await run(() => addAdjustment({ period_id: periodId, employee_id: employeeId, kind: kind as "incentive", amount: Number(amount), note }));
              if (ok) {
                setAmount("");
                setNote("");
              }
            }}
          >
            Tambah
          </Button>
        </FieldGroup>
      ) : null}
    </div>
  );
}

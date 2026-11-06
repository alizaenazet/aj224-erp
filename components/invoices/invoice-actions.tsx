"use client";

import { BanknoteIcon, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import { ReasonDialogButton } from "@/components/app/reason-dialog-button";
import { RupiahInput } from "@/components/app/rupiah-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRupiah } from "@/lib/format";
import { cancelInvoice, cancelPayment, issueInvoice, recordPayment } from "@/lib/invoices/actions";
import { paymentSchema } from "@/lib/invoices/schema";

/** Terbitkan and Batalkan an invoice (FIN-01, UMM-11). */
export function InvoiceStatusActions({ id, canIssue, canCancel }: { id: string; canIssue: boolean; canCancel: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function issue() {
    setPending(true);
    const result = await issueInvoice({ id });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  return (
    <>
      {canIssue ? (
        <Button onClick={() => void issue()} disabled={pending}>
          <SendIcon />
          {pending ? "Menerbitkan…" : "Terbitkan"}
        </Button>
      ) : null}
      {canCancel ? (
        <ReasonDialogButton
          label="Batalkan"
          title="Batalkan invoice?"
          description="Invoice tetap terlihat dengan tanda Batal dan tidak dihitung; termin kembali Siap Ditagih."
          confirmLabel="Batalkan invoice"
          action={(reason) => cancelInvoice({ id, reason })}
        />
      ) : null}
    </>
  );
}

/** Catat pembayaran masuk (FIN-03) in a Dialog. */
export function PaymentDialogButton({
  invoiceId,
  balance,
  banks,
  today,
}: {
  invoiceId: string;
  balance: number;
  banks: { value: string; label: string; isDefault: boolean }[];
  today: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string | null>(today);
  const [received, setReceived] = useState<number | null>(balance);
  const [pph, setPph] = useState<number | null>(0);
  const [slip, setSlip] = useState("");
  const [bank, setBank] = useState(banks.find((option) => option.isDefault)?.value ?? banks[0]?.value ?? "");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    const parsed = paymentSchema.safeParse({
      payment_date: date,
      amount_received: received ?? 0,
      pph_amount: pph ?? 0,
      pph_slip_no: slip,
      bank_account_id: bank,
      notes,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
      return;
    }
    setPending(true);
    const result = await recordPayment({ invoiceId, values: parsed.data });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <BanknoteIcon />
        Catat pembayaran
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat pembayaran masuk</DialogTitle>
            <DialogDescription>Sisa tagihan {formatRupiah(balance)}. Lunas bila diterima + PPh = total invoice.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="payment-date">Tanggal *</FieldLabel>
              <DatePicker id="payment-date" value={date} onChange={setDate} max={today} />
            </Field>
            <Field>
              <FieldLabel htmlFor="payment-received">Jumlah diterima *</FieldLabel>
              <RupiahInput id="payment-received" value={received} onChange={setReceived} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="payment-pph">Potongan PPh oleh klien</FieldLabel>
                <RupiahInput id="payment-pph" value={pph} onChange={setPph} />
              </Field>
              <Field>
                <FieldLabel htmlFor="payment-slip">No. bukti potong</FieldLabel>
                <Input id="payment-slip" value={slip} onChange={(event) => setSlip(event.target.value)} maxLength={60} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="payment-bank">Rekening tujuan</FieldLabel>
              <Select value={bank} onValueChange={setBank}>
                <SelectTrigger id="payment-bank" className="w-full">
                  <SelectValue placeholder="Pilih rekening" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {banks.length ? null : <FieldDescription>Tambahkan rekening di Profil Perusahaan.</FieldDescription>}
            </Field>
            <Field>
              <FieldLabel htmlFor="payment-notes">Catatan</FieldLabel>
              <Input id="payment-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={300} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button onClick={() => void submit()} disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CancelPaymentButton({ id }: { id: string }) {
  return (
    <ReasonDialogButton
      label="Batalkan"
      variant="outline"
      title="Batalkan pembayaran?"
      description="Status invoice dan termin dihitung ulang."
      confirmLabel="Batalkan pembayaran"
      action={(reason) => cancelPayment({ id, reason })}
    />
  );
}

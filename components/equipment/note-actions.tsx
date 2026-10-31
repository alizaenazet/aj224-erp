"use client";

import { BanIcon, PrinterIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cancelDeliveryNote } from "@/lib/equipment/actions";

/** Print and (Operasional, while Dikirim) cancel a delivery note (ALT-03, UMM-11). */
export function NoteActions({ noteId, canCancel }: { noteId: string; canCancel: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    const result = await cancelDeliveryNote({ id: noteId, reason });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setOpen(false);
  }

  return (
    <>
      <Button asChild variant="outline">
        <Link href={`/print/delivery-notes/${noteId}`} target="_blank">
          <PrinterIcon />
          Cetak
        </Link>
      </Button>
      {canCancel ? (
        <Button variant="destructive" onClick={() => setOpen(true)}>
          <BanIcon />
          Batalkan
        </Button>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan surat jalan?</DialogTitle>
            <DialogDescription>Semua alat kembali ke lokasi asal dalam kondisi saat dikirim.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="cancel-reason">Alasan *</FieldLabel>
            <Textarea id="cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} />
          </Field>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Kembali
            </Button>
            <Button variant="destructive" disabled={pending || !reason.trim()} onClick={() => void submit()}>
              {pending ? "Membatalkan…" : "Batalkan surat jalan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

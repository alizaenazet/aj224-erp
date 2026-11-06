"use client";

import { LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { closeProject } from "@/lib/pl/actions";
import type { ChecklistItem } from "@/lib/pl/labels";

/** Tutup proyek (PRJ-11): checklist, and a Direktur override note when items fail. */
export function CloseProjectButton({ projectId, checklist, isDirector }: { projectId: string; checklist: ChecklistItem[]; isDirector: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const allOk = checklist.every((item) => item.ok);
  const canClose = allOk || (isDirector && note.trim().length > 0);

  async function submit() {
    setPending(true);
    const result = await closeProject({ id: projectId, note });
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
      <Button variant="outline" onClick={() => setOpen(true)}>
        <LockIcon />
        Tutup Proyek
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup proyek</DialogTitle>
            <DialogDescription>
              {allOk
                ? "Semua syarat penutupan terpenuhi."
                : isDirector
                  ? "Ada syarat yang belum terpenuhi. Direktur dapat menutup dengan catatan override (tercatat di log audit)."
                  : "Proyek hanya dapat ditutup bila semua syarat terpenuhi, atau oleh Direktur dengan catatan override."}
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-3 text-sm">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.detail}</span>
                </div>
                <Badge variant={item.ok ? "success" : "destructive"}>{item.ok ? "Terpenuhi" : "Belum"}</Badge>
              </li>
            ))}
          </ul>
          {!allOk && isDirector ? (
            <Field>
              <FieldLabel htmlFor="close-note">Catatan override *</FieldLabel>
              <Textarea id="close-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
            </Field>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Kembali
            </Button>
            <Button onClick={() => void submit()} disabled={pending || !canClose}>
              {pending ? "Menutup…" : allOk ? "Tutup proyek" : "Tutup dengan override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { BanIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
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
import type { ActionResult } from "@/lib/actions";

type Props = {
  /** Button text, e.g. "Batalkan". */
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  /** Receives the typed reason; the result is shown as a toast. */
  action: (reason: string) => Promise<ActionResult<unknown>>;
  icon?: ReactNode;
  variant?: "destructive" | "outline" | "default" | "secondary";
  /** Reason label; required unless `optional`. */
  reasonLabel?: string;
  optional?: boolean;
};

/** A button that asks for a reason in a Dialog before an irreversible action (UMM-11). */
export function ReasonDialogButton({
  label,
  title,
  description,
  confirmLabel,
  action,
  icon = <BanIcon />,
  variant = "destructive",
  reasonLabel = "Alasan",
  optional = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    const result = await action(reason);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setOpen(false);
    setReason("");
    router.refresh();
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {icon}
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="reason-dialog-text">
              {reasonLabel}
              {optional ? "" : " *"}
            </FieldLabel>
            <Textarea id="reason-dialog-text" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} />
          </Field>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Kembali
            </Button>
            <Button
              variant={variant === "outline" ? "default" : variant}
              disabled={pending || (!optional && !reason.trim())}
              onClick={() => void submit()}
            >
              {pending ? "Menyimpan…" : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

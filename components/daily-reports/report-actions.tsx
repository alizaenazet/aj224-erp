"use client";

import { CheckCheckIcon, MessageSquareWarningIcon, PencilIcon, PrinterIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { reviewDailyReport } from "@/lib/daily-reports/actions";

type ReportActionsProps = {
  report: { id: string; project_id: string; status: string };
  canReview: boolean;
  canEdit: boolean;
};

/** Review (OPS-03), edit and print actions on a daily report. */
export function ReportActions({ report, canReview, canEdit }: ReportActionsProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(action: "reviewed" | "revision") {
    setPending(true);
    const result = await reviewDailyReport({
      id: report.id,
      projectId: report.project_id,
      values: { action, comment: action === "revision" ? comment : null },
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setReviewOpen(false);
    setRevisionOpen(false);
  }

  const reviewable = canReview && report.status !== "reviewed";

  return (
    <>
      <Button asChild variant="outline">
        <Link href={`/print/daily-reports/${report.id}`} target="_blank">
          <PrinterIcon />
          Cetak
        </Link>
      </Button>
      {canEdit ? (
        <Button asChild variant="outline">
          <Link href={`/field/daily-reports/${report.id}/edit`}>
            <PencilIcon />
            Ubah
          </Link>
        </Button>
      ) : null}
      {reviewable ? (
        <>
          <Button variant="outline" onClick={() => setRevisionOpen(true)}>
            <MessageSquareWarningIcon />
            Minta Revisi
          </Button>
          <Button onClick={() => setReviewOpen(true)}>
            <CheckCheckIcon />
            Sudah Diperiksa
          </Button>
        </>
      ) : null}

      <AlertDialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai Sudah Diperiksa?</AlertDialogTitle>
            <AlertDialogDescription>Laporan yang sudah diperiksa tidak dapat diubah lagi.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void submit("reviewed");
              }}
            >
              Sudah Diperiksa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Minta revisi</DialogTitle>
            <DialogDescription>Pelapor menerima notifikasi dan dapat mengubah laporan.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="revision-comment">Komentar revisi *</FieldLabel>
            <Textarea
              id="revision-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              placeholder="Mis. foto aktivitas T.15 belum ada"
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setRevisionOpen(false)}>
              Batal
            </Button>
            <Button disabled={pending || !comment.trim()} onClick={() => void submit("revision")}>
              {pending ? "Mengirim…" : "Kirim permintaan revisi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

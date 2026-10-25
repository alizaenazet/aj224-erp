"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { deleteTraining } from "@/lib/trainings/actions";

/** Ubah and Hapus on the training page (HCM). */
export function TrainingActions({ trainingId, name }: { trainingId: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirmDelete() {
    setPending(true);
    const result = await deleteTraining(trainingId);
    setPending(false);
    if (!result.ok) {
      setOpen(false);
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push("/hr/trainings");
  }

  return (
    <>
      <Button asChild variant="outline">
        <Link href={`/hr/trainings/${trainingId}/edit`}>
          <PencilIcon />
          Ubah
        </Link>
      </Button>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Trash2Icon />
        Hapus
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pelatihan?</AlertDialogTitle>
            <AlertDialogDescription>
              {name} dan daftar pesertanya dihapus. Pelatihan dengan peserta Lulus tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { HistoryIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AuditHistorySheet } from "@/components/audit/audit-history-sheet";
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
import { deleteClient } from "@/lib/clients/actions";

type ClientActionsProps = {
  client: { id: string; name: string };
  canManage: boolean;
  canViewHistory: boolean;
};

/** Ubah, Hapus (clients without tenders) and Riwayat on the client page. */
export function ClientActions({ client, canManage, canViewHistory }: ClientActionsProps) {
  const router = useRouter();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirmDelete() {
    setPending(true);
    const result = await deleteClient(client.id);
    setPending(false);
    if (!result.ok) {
      setConfirmOpen(false);
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.push("/marketing/clients");
  }

  return (
    <>
      {canViewHistory ? (
        <Button variant="outline" onClick={() => setHistoryOpen(true)}>
          <HistoryIcon />
          Riwayat
        </Button>
      ) : null}
      {canManage ? (
        <>
          <Button asChild variant="outline">
            <Link href={`/marketing/clients/${client.id}/edit`}>
              <PencilIcon />
              Ubah
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            <Trash2Icon />
            Hapus
          </Button>
        </>
      ) : null}
      <AuditHistorySheet
        target={historyOpen ? { table: "clients", recordId: client.id, title: client.name } : null}
        onOpenChange={setHistoryOpen}
      />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus klien?</AlertDialogTitle>
            <AlertDialogDescription>
              {client.name} beserta kontak dan aktivitasnya dihapus. Klien yang sudah punya tender tidak dapat
              dihapus; nonaktifkan saja.
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

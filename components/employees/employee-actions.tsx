"use client";

import { HistoryIcon, PencilIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { setEmployeeActive } from "@/lib/employees/actions";

type EmployeeActionsProps = {
  employee: { id: string; full_name: string; is_active: boolean; join_date: string };
  /** Today in WIB (yyyy-MM-dd): latest allowed exit date. */
  today: string;
  canManage: boolean;
  canViewHistory: boolean;
};

/** Header actions on the employee page: edit, (de)activate, history. */
export function EmployeeActions({ employee, today, canManage, canViewHistory }: EmployeeActionsProps) {
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exitDate, setExitDate] = useState<string | null>(today);
  const [pending, setPending] = useState(false);

  async function submit(nextExitDate: string | null) {
    setPending(true);
    const result = await setEmployeeActive({ employeeId: employee.id, exitDate: nextExitDate });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setDeactivateOpen(false);
    setReactivateOpen(false);
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
            <Link href={`/hr/employees/${employee.id}/edit`}>
              <PencilIcon />
              Ubah
            </Link>
          </Button>
          {employee.is_active ? (
            <Button
              variant="destructive"
              onClick={() => {
                setExitDate(today);
                setDeactivateOpen(true);
              }}
            >
              <UserXIcon />
              Nonaktifkan
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setReactivateOpen(true)}>
              <UserCheckIcon />
              Aktifkan kembali
            </Button>
          )}
        </>
      ) : null}

      <AuditHistorySheet
        target={historyOpen ? { table: "employees", recordId: employee.id, title: employee.full_name } : null}
        onOpenChange={setHistoryOpen}
      />

      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nonaktifkan {employee.full_name}?</DialogTitle>
            <DialogDescription>
              Karyawan nonaktif tidak dapat ditugaskan atau diabsen. Akun pengguna yang terhubung
              dengan karyawan ini langsung dinonaktifkan.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="exit-date">Tanggal keluar *</FieldLabel>
            <DatePicker id="exit-date" value={exitDate} onChange={setExitDate} min={employee.join_date} max={today} />
            <FieldDescription>Paling lambat hari ini.</FieldDescription>
          </Field>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setDeactivateOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" disabled={pending || !exitDate} onClick={() => void submit(exitDate)}>
              {pending ? "Menyimpan…" : "Nonaktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={reactivateOpen} onOpenChange={setReactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktifkan kembali {employee.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tanggal keluar dihapus. Akun pengguna yang terhubung tetap nonaktif sampai diaktifkan
              Super Admin di Pengguna & Peran.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void submit(null);
              }}
            >
              Aktifkan kembali
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

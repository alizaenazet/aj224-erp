"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AuditHistorySheet } from "@/components/audit/audit-history-sheet";
import { DataTable } from "@/components/data-table/data-table";
import { ChangeRoleDialog } from "@/components/users/change-role-dialog";
import { LinkEmployeeDialog } from "@/components/users/link-employee-dialog";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { EmployeeLinkOption } from "@/lib/employees/queries";
import { formatDateTime } from "@/lib/format";
import { resendInvite, setUserActive } from "@/lib/users/actions";
import { USER_STATUS_LABELS, type UserRow } from "@/lib/users/labels";

const STATUS_VARIANTS: Record<string, "secondary" | "outline" | "destructive"> = {
  active: "secondary",
  invited: "outline",
  inactive: "destructive",
};

type UsersTableProps = {
  users: UserRow[];
  canManage: boolean;
  currentUserId: string;
  /** Active employees for "Hubungkan Karyawan" (Super Admin only). */
  employeeOptions: EmployeeLinkOption[];
};

export function UsersTable({ users, canManage, currentUserId, employeeOptions }: UsersTableProps) {
  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null);
  const [linkTarget, setLinkTarget] = useState<UserRow | null>(null);
  // Kept after closing so the dialog text stays stable during its exit animation.
  const [activeTarget, setActiveTarget] = useState<UserRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{
    table: string;
    recordId: string;
    title: string;
  } | null>(null);

  async function confirmActiveChange() {
    if (!activeTarget) return;
    setPending(true);
    const result = await setUserActive({
      userId: activeTarget.id,
      active: !activeTarget.is_active,
    });
    setPending(false);
    setConfirmOpen(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  const columns = useMemo<ColumnDef<UserRow, unknown>[]>(() => {
    async function onResend(user: UserRow) {
      const result = await resendInvite(user.id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
    }

    return [
      {
        id: "full_name",
        header: "Nama",
        cell: ({ row }) => <span className="font-medium">{row.original.full_name}</span>,
      },
      { id: "email", header: "Email", cell: ({ row }) => row.original.email },
      {
        id: "role",
        header: "Peran",
        cell: ({ row }) => <Badge variant="outline">{ROLE_LABELS[row.original.role]}</Badge>,
      },
      {
        id: "employee",
        header: "Karyawan",
        cell: ({ row }) =>
          row.original.employee_name ??
          (row.original.role === "field" ? (
            <Badge variant="outline">Belum terhubung</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANTS[row.original.status] ?? "outline"}>
            {USER_STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
      {
        id: "last_sign_in_at",
        header: "Login Terakhir",
        cell: ({ row }) => formatDateTime(row.original.last_sign_in_at),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Tindakan</span>,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Tindakan untuk ${user.full_name}`}>
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() =>
                      setHistoryTarget({ table: "profiles", recordId: user.id, title: user.full_name })
                    }
                  >
                    Riwayat
                  </DropdownMenuItem>
                  {canManage ? (
                    <>
                      <DropdownMenuItem onSelect={() => setRoleTarget(user)}>
                        Ubah Peran
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setLinkTarget(user)}>
                        Hubungkan Karyawan
                      </DropdownMenuItem>
                      {user.status === "invited" ? (
                        <DropdownMenuItem onSelect={() => onResend(user)}>
                          Kirim Ulang Undangan
                        </DropdownMenuItem>
                      ) : null}
                      {user.id !== currentUserId || !user.is_active ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant={user.is_active ? "destructive" : "default"}
                            onSelect={() => {
                              setActiveTarget(user);
                              setConfirmOpen(true);
                            }}
                          >
                            {user.is_active ? "Nonaktifkan" : "Aktifkan"}
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [canManage, currentUserId]);

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        sortableColumns={["full_name", "last_sign_in_at"]}
        getRowId={(row) => row.id}
      />

      <AuditHistorySheet
        target={historyTarget}
        onOpenChange={(open) => {
          if (!open) setHistoryTarget(null);
        }}
      />

      <LinkEmployeeDialog
        user={linkTarget}
        employees={employeeOptions}
        onOpenChange={(open) => {
          if (!open) setLinkTarget(null);
        }}
      />

      <ChangeRoleDialog
        user={roleTarget}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null);
        }}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activeTarget?.is_active ? "Nonaktifkan akun?" : "Aktifkan akun?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeTarget?.is_active
                ? `${activeTarget.full_name} langsung tidak bisa masuk atau membuka data sampai akunnya diaktifkan kembali.`
                : `${activeTarget?.full_name} dapat masuk kembali dengan kata sandi yang sama.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={activeTarget?.is_active ? "destructive" : "default"}
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void confirmActiveChange();
              }}
            >
              {activeTarget?.is_active ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

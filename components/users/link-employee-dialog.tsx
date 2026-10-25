"use client";

import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EmployeeLinkOption } from "@/lib/employees/queries";
import { linkEmployee } from "@/lib/users/actions";
import type { UserRow } from "@/lib/users/labels";

type LinkEmployeeDialogProps = {
  /** User to link; null closes the dialog. */
  user: UserRow | null;
  employees: EmployeeLinkOption[];
  onOpenChange: (open: boolean) => void;
};

/** Super Admin links an account to an active employee (MST-01). */
export function LinkEmployeeDialog({ user, employees, onOpenChange }: LinkEmployeeDialogProps) {
  const [pending, setPending] = useState(false);

  async function save(employeeId: string | null) {
    if (!user) return;
    setPending(true);
    const result = await linkEmployee({ userId: user.id, employeeId });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onOpenChange(false);
  }

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hubungkan karyawan</DialogTitle>
          <DialogDescription>
            {user?.full_name}. Akun Lapangan harus terhubung agar aksesnya mengikuti penugasan proyek.
          </DialogDescription>
        </DialogHeader>
        <Command className="rounded-lg border">
          <CommandInput placeholder="Cari nama atau NIK karyawan" />
          <CommandList>
            <CommandEmpty>Tidak ada karyawan aktif yang cocok.</CommandEmpty>
            <CommandGroup>
              {employees.map((employee) => {
                const linkedElsewhere =
                  employee.linkedProfileId !== null && employee.linkedProfileId !== user?.id;
                const selected = employee.id === user?.employee_id;
                return (
                  <CommandItem
                    key={employee.id}
                    value={`${employee.full_name} ${employee.employee_no}`}
                    disabled={pending || linkedElsewhere}
                    onSelect={() => {
                      if (!selected) void save(employee.id);
                    }}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{employee.full_name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {employee.employee_no}
                        {employee.position ? ` · ${employee.position}` : ""}
                        {linkedElsewhere ? ` · Terhubung: ${employee.linkedProfileName}` : ""}
                      </span>
                    </div>
                    {selected ? <CheckIcon /> : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <DialogFooter>
          {user?.employee_id ? (
            <Button variant="outline" disabled={pending} onClick={() => void save(null)}>
              Lepas tautan
            </Button>
          ) : null}
          <Button variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

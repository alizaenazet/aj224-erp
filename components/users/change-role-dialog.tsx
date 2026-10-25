"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RoleSelect } from "@/components/users/role-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { AppRole } from "@/lib/auth/roles";
import { changeUserRole } from "@/lib/users/actions";

type ChangeRoleDialogProps = {
  user: { id: string; full_name: string; role: AppRole } | null;
  onOpenChange: (open: boolean) => void;
};

export function ChangeRoleDialog({ user, onOpenChange }: ChangeRoleDialogProps) {
  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {user ? (
          <ChangeRoleForm
            key={user.id}
            user={user}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleForm({
  user,
  onDone,
}: {
  user: { id: string; full_name: string; role: AppRole };
  onDone: () => void;
}) {
  const [role, setRole] = useState<AppRole>(user.role);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    const result = await changeUserRole({ userId: user.id, role });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    onDone();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ubah Peran</DialogTitle>
        <DialogDescription>
          Peran baru untuk {user.full_name} langsung berlaku untuk akses data.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup className="py-4">
        <Field>
          <FieldLabel htmlFor="change-role">Peran</FieldLabel>
          <RoleSelect id="change-role" value={role} onValueChange={setRole} />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button onClick={save} disabled={pending || role === user.role}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
      </DialogFooter>
    </>
  );
}

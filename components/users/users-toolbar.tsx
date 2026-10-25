"use client";

import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
import { APP_ROLES, ROLE_LABELS } from "@/lib/auth/roles";
import { USER_STATUS_LABELS } from "@/lib/users/labels";

const ROLE_OPTIONS = APP_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));
const STATUS_OPTIONS = Object.entries(USER_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function UsersToolbar({ canManage }: { canManage: boolean }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari nama atau email"
      filters={
        <>
          <SelectFilter param="role" allLabel="Semua peran" options={ROLE_OPTIONS} />
          <SelectFilter param="status" allLabel="Semua status" options={STATUS_OPTIONS} />
        </>
      }
      actions={
        <>
          <ExportButton exportKey="users" />
          {canManage ? <InviteUserDialog /> : null}
        </>
      }
    />
  );
}

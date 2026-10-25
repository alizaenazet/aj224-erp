"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AuditChanges } from "@/components/audit/audit-changes";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Badge } from "@/components/ui/badge";
import {
  AUDIT_TABLE_LABELS,
  auditActionLabel,
  auditTableLabel,
  type AuditEntry,
} from "@/lib/audit/labels";
import { formatDateTime } from "@/lib/format";

const COLUMNS: ColumnDef<AuditEntry, unknown>[] = [
  {
    id: "created_at",
    header: "Waktu",
    cell: ({ row }) => formatDateTime(row.original.created_at),
  },
  { id: "actor", header: "Pengguna", cell: ({ row }) => row.original.actor_name ?? "Sistem" },
  {
    id: "table_name",
    header: "Jenis data",
    cell: ({ row }) => auditTableLabel(row.original.table_name),
  },
  {
    id: "action",
    header: "Tindakan",
    cell: ({ row }) => <Badge variant="outline">{auditActionLabel(row.original.action)}</Badge>,
  },
  {
    id: "changes",
    header: "Perubahan",
    cell: ({ row }) => (
      <div className="whitespace-normal">
        <AuditChanges entry={row.original} />
      </div>
    ),
  },
];

/** `tables`: the audit tables this role may filter by. */
export function AuditLogToolbar({ tables }: { tables: string[] }) {
  const tableOptions = tables.map((value) => ({ value, label: AUDIT_TABLE_LABELS[value] ?? value }));
  return (
    <DataTableToolbar
      filters={
        <>
          <SelectFilter param="table" allLabel="Semua jenis data" options={tableOptions} />
          <DateRangeFilter />
        </>
      }
      actions={<ExportButton exportKey="audit-log" />}
    />
  );
}

export function AuditLogTable({ entries }: { entries: AuditEntry[] }) {
  return (
    <DataTable
      columns={COLUMNS}
      data={entries}
      sortableColumns={["created_at"]}
      getRowId={(row) => String(row.id)}
    />
  );
}

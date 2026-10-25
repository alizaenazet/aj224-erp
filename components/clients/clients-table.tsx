"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ListTodoIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CLIENT_KIND_LABELS,
  CLIENT_STATUS_LABELS,
  formatRate,
  type ClientRow,
} from "@/lib/clients/labels";

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

export function ClientsToolbar({ canManage }: { canManage: boolean }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari nama atau NPWP"
      filters={
        <>
          <SelectFilter param="kind" allLabel="Semua jenis" options={toOptions(CLIENT_KIND_LABELS)} />
          <SelectFilter param="status" allLabel="Aktif & nonaktif" options={toOptions(CLIENT_STATUS_LABELS)} />
        </>
      }
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/marketing/follow-ups">
              <ListTodoIcon />
              Tindak Lanjut
            </Link>
          </Button>
          <ExportButton exportKey="clients" />
          {canManage ? (
            <Button asChild>
              <Link href="/marketing/clients/new">
                <PlusIcon />
                Tambah Klien
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

const COLUMNS: ColumnDef<ClientRow, unknown>[] = [
  {
    id: "name",
    header: "Nama Perusahaan",
    cell: ({ row }) => (
      <Link href={`/marketing/clients/${row.original.id}`} className="font-medium underline-offset-4 hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "kind",
    header: "Jenis",
    cell: ({ row }) => <Badge variant="outline">{CLIENT_KIND_LABELS[row.original.kind]}</Badge>,
  },
  { id: "payment_term", header: "Termin", cell: ({ row }) => `${row.original.payment_term_days} hari` },
  { id: "tenders", header: "Tender", cell: ({ row }) => row.original.stats.tender_count },
  { id: "win_rate", header: "Win Rate", cell: ({ row }) => formatRate(row.original.stats.win_rate_count) },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "secondary" : "destructive"}>
        {row.original.is_active ? "Aktif" : "Nonaktif"}
      </Badge>
    ),
  },
];

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  return <DataTable columns={COLUMNS} data={clients} sortableColumns={["name"]} getRowId={(row) => row.id} />;
}

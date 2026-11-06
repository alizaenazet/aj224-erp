"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PackageMinusIcon, PackagePlusIcon, Undo2Icon } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { TXN_KIND_LABELS, TXN_SOURCE_LABELS, type TxnRow } from "@/lib/materials/labels";

const KIND_OPTIONS = Object.entries(TXN_KIND_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "cancelled", label: "Batal" },
];

export function TransactionsToolbar({ locations, canManage }: { locations: { value: string; label: string }[]; canManage: boolean }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari no. dokumen atau keterangan"
      filters={
        <>
          <SelectFilter param="kind" allLabel="Semua jenis" options={KIND_OPTIONS} />
          <SelectFilter param="status" allLabel="Semua status" options={STATUS_OPTIONS} />
          <SelectFilter param="location" allLabel="Semua lokasi" options={locations} />
          <DateRangeFilter />
        </>
      }
      actions={
        <>
          <ExportButton exportKey="material-transactions" />
          {canManage ? (
            <>
              <Button asChild variant="outline">
                <Link href="/operations/material-transactions/new?kind=return">
                  <Undo2Icon />
                  Kembali ke klien
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/operations/material-transactions/new?kind=usage">
                  <PackageMinusIcon />
                  Pemakaian
                </Link>
              </Button>
              <Button asChild>
                <Link href="/operations/material-transactions/new?kind=receipt">
                  <PackagePlusIcon />
                  Penerimaan
                </Link>
              </Button>
            </>
          ) : null}
        </>
      }
    />
  );
}

export const TXN_COLUMNS: ColumnDef<TxnRow, unknown>[] = [
  {
    id: "txn_date",
    header: "Tanggal",
    cell: ({ row }) => (
      <Link
        href={`/operations/material-transactions/${row.original.id}`}
        className="font-medium whitespace-nowrap underline-offset-4 hover:underline"
      >
        {formatDate(row.original.txn_date)}
      </Link>
    ),
  },
  {
    id: "kind",
    header: "Jenis",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline">{TXN_KIND_LABELS[row.original.kind]}</Badge>
        {row.original.status === "cancelled" ? <Badge variant="destructive">Batal</Badge> : null}
      </div>
    ),
  },
  { id: "location", header: "Lokasi", cell: ({ row }) => <span className="whitespace-normal">{row.original.location_name}</span> },
  {
    id: "doc",
    header: "Dokumen",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span>{row.original.doc_no ?? "—"}</span>
        {row.original.source ? (
          <span className="text-xs text-muted-foreground">
            {TXN_SOURCE_LABELS[row.original.source]}
            {row.original.supplier_name ? ` · ${row.original.supplier_name}` : ""}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    id: "summary", meta: { mobile: "full" },
    header: "Material",
    cell: ({ row }) => (
      <div className="flex max-w-96 flex-col gap-1 whitespace-normal">
        <span>{row.original.summary || "—"}</span>
        {row.original.section_code ? <span className="text-xs text-muted-foreground">Seksi {row.original.section_code}</span> : null}
      </div>
    ),
  },
];

/** Transaksi Material (MAT-02 … MAT-05). */
export function TransactionsTable({ rows }: { rows: TxnRow[] }) {
  return <DataTable columns={TXN_COLUMNS} data={rows} getRowId={(row) => row.id} />;
}

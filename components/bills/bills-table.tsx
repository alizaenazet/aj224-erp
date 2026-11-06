"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClockIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BILL_STATUS_LABELS, BILL_STATUS_VARIANTS, DUE_GROUP_LABELS, type BillRow } from "@/lib/bills/labels";
import { formatDate, formatRupiah } from "@/lib/format";

const STATUS = Object.entries(BILL_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const DUE = Object.entries(DUE_GROUP_LABELS).map(([value, label]) => ({ value, label }));

export function BillsToolbar({ suppliers, canManage }: { suppliers: { value: string; label: string }[]; canManage: boolean }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari no. nota, supplier, atau catatan"
      filters={
        <>
          <SelectFilter param="due" allLabel="Semua jatuh tempo" options={DUE} />
          <SelectFilter param="status" allLabel="Semua status" options={STATUS} />
          <SelectFilter param="supplier" allLabel="Semua supplier" options={suppliers} />
          <DateRangeFilter />
        </>
      }
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/finance/bills/aging">
              <CalendarClockIcon />
              Umur utang
            </Link>
          </Button>
          <ExportButton exportKey="bills" />
          {canManage ? (
            <Button asChild>
              <Link href="/finance/bills/new">
                <PlusIcon />
                Tagihan baru
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

export function BillStatusBadge({ status }: { status: string }) {
  return <Badge variant={BILL_STATUS_VARIANTS[status] ?? "outline"}>{BILL_STATUS_LABELS[status] ?? status}</Badge>;
}

const COLUMNS: ColumnDef<BillRow, unknown>[] = [
  {
    id: "bill",
    header: "Nota",
    cell: ({ row }) => (
      <Link href={`/finance/bills/${row.original.id}`} className="flex flex-col gap-1 underline-offset-4 hover:underline">
        <span className="font-medium whitespace-nowrap">{row.original.bill_no}</span>
        <span className="text-xs text-muted-foreground">{row.original.supplier_name}</span>
      </Link>
    ),
  },
  { id: "projects", header: "Proyek", cell: ({ row }) => <span className="max-w-48 whitespace-normal">{row.original.projects ?? "—"}</span> },
  { id: "bill_date", header: "Tanggal", cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.bill_date)}</span> },
  {
    id: "due",
    header: "Jatuh tempo",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="whitespace-nowrap">{formatDate(row.original.due_date)}</span>
        {row.original.due_group === "overdue" ? (
          <Badge variant="destructive">{row.original.days_overdue} hari terlambat</Badge>
        ) : row.original.due_group === "this_week" ? (
          <Badge variant="warning">Minggu ini</Badge>
        ) : null}
      </div>
    ),
  },
  { id: "total", header: "Total", cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatRupiah(row.original.total)}</span> },
  { id: "balance", header: "Sisa", cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatRupiah(row.original.balance)}</span> },
  { id: "status", header: "Status", cell: ({ row }) => <BillStatusBadge status={row.original.status} /> },
];

/** Tagihan Supplier & Utang (FIN-06 … FIN-08). */
export function BillsTable({ rows }: { rows: BillRow[] }) {
  return <DataTable columns={COLUMNS} data={rows} getRowId={(row) => row.id} />;
}

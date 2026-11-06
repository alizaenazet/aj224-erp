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
import { formatDate, formatRupiah } from "@/lib/format";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_VARIANTS, type InvoiceRow } from "@/lib/invoices/labels";

type Option = { value: string; label: string };
const STATUS_OPTIONS = Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function InvoicesToolbar({ projects, clients, canManage }: { projects: Option[]; clients: Option[]; canManage: boolean }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari nomor, uraian, atau klien"
      filters={
        <>
          <SelectFilter param="status" allLabel="Semua status" options={STATUS_OPTIONS} />
          <SelectFilter param="project" allLabel="Semua proyek" options={projects} />
          <SelectFilter param="client" allLabel="Semua klien" options={clients} />
          <SelectFilter param="overdue" allLabel="Semua jatuh tempo" options={[{ value: "1", label: "Lewat jatuh tempo" }]} />
          <DateRangeFilter />
        </>
      }
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/finance/invoices/aging">
              <CalendarClockIcon />
              Umur piutang
            </Link>
          </Button>
          <ExportButton exportKey="invoices" />
          {canManage ? (
            <Button asChild>
              <Link href="/finance/invoices/new">
                <PlusIcon />
                Invoice non-termin
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceRow["status"] }) {
  return <Badge variant={INVOICE_STATUS_VARIANTS[status]}>{INVOICE_STATUS_LABELS[status]}</Badge>;
}

const COLUMNS: ColumnDef<InvoiceRow, unknown>[] = [
  {
    id: "number",
    header: "Nomor",
    cell: ({ row }) => (
      <Link href={`/finance/invoices/${row.original.id}`} className="font-medium whitespace-nowrap underline-offset-4 hover:underline">
        {row.original.number ?? "Draft"}
      </Link>
    ),
  },
  {
    id: "project",
    header: "Proyek / klien",
    cell: ({ row }) => (
      <div className="flex max-w-72 flex-col gap-1 whitespace-normal">
        <span>{row.original.client_name ?? "—"}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.project_code} · {row.original.term_name ?? row.original.description}
        </span>
      </div>
    ),
  },
  { id: "invoice_date", header: "Tanggal", cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.invoice_date)}</span> },
  {
    id: "due_date",
    header: "Jatuh tempo",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="whitespace-nowrap">{formatDate(row.original.due_date)}</span>
        {row.original.days_overdue > 0 ? <Badge variant="destructive">{row.original.days_overdue} hari terlambat</Badge> : null}
      </div>
    ),
  },
  { id: "total", header: "Total", cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatRupiah(row.original.total)}</span> },
  {
    id: "balance",
    header: "Sisa",
    cell: ({ row }) => (
      <span className={row.original.days_overdue > 0 ? "font-medium whitespace-nowrap text-destructive tabular-nums" : "whitespace-nowrap tabular-nums"}>
        {row.original.status === "draft" || row.original.status === "cancelled" ? "—" : formatRupiah(row.original.balance)}
      </span>
    ),
  },
  { id: "status", meta: { mobile: "aside" }, header: "Status", cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} /> },
];

/** Invoice & Piutang (FIN-01 … FIN-04). */
export function InvoicesTable({ rows }: { rows: InvoiceRow[] }) {
  return <DataTable columns={COLUMNS} data={rows} getRowId={(row) => row.id} />;
}

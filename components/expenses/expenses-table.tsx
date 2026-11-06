"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { ReasonDialogButton } from "@/components/app/reason-dialog-button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cancelExpense } from "@/lib/bills/actions";
import { METHOD_LABELS, OFFICE, type ExpenseRow } from "@/lib/bills/labels";
import { formatDate, formatRupiah } from "@/lib/format";

type Option = { value: string; label: string };

export function ExpensesToolbar({ projects, categories, canManage }: { projects: Option[]; categories: Option[]; canManage: boolean }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari keterangan atau penerima"
      filters={
        <>
          <SelectFilter param="project" allLabel="Semua proyek" options={[{ value: OFFICE, label: "Kantor/Umum" }, ...projects]} />
          <SelectFilter param="category" allLabel="Semua kategori" options={categories} />
          <SelectFilter param="status" allLabel="Semua status" options={[{ value: "active", label: "Aktif" }, { value: "cancelled", label: "Batal" }]} />
          <DateRangeFilter />
        </>
      }
      actions={
        <>
          <ExportButton exportKey="expenses" />
          {canManage ? (
            <Button asChild>
              <Link href="/finance/expenses/new">
                <PlusIcon />
                Pengeluaran baru
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

export function CancelExpenseButton({ id }: { id: string }) {
  return (
    <ReasonDialogButton
      label="Batalkan"
      title="Batalkan pengeluaran?"
      description="Pengeluaran tetap terlihat dengan tanda Batal dan tidak dihitung sebagai biaya."
      confirmLabel="Batalkan pengeluaran"
      action={(reason) => cancelExpense({ id, reason })}
    />
  );
}

const COLUMNS: ColumnDef<ExpenseRow, unknown>[] = [
  {
    id: "date",
    header: "Tanggal",
    cell: ({ row }) => (
      <Link href={`/finance/expenses/${row.original.id}`} className="font-medium whitespace-nowrap underline-offset-4 hover:underline">
        {formatDate(row.original.expense_date)}
      </Link>
    ),
  },
  { id: "project", header: "Proyek", cell: ({ row }) => <span className="whitespace-nowrap">{row.original.project_code ?? "Kantor/Umum"}</span> },
  { id: "category", header: "Kategori", cell: ({ row }) => <span className="whitespace-normal">{row.original.category_name}</span> },
  {
    id: "description",
    header: "Keterangan",
    cell: ({ row }) => (
      <div className="flex max-w-80 flex-col gap-1 whitespace-normal">
        <span>{row.original.description}</span>
        <span className="text-xs text-muted-foreground">
          {[row.original.payee, METHOD_LABELS[row.original.method]].filter(Boolean).join(" · ")}
        </span>
      </div>
    ),
  },
  { id: "amount", header: "Jumlah", cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatRupiah(row.original.amount)}</span> },
  {
    id: "flags",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.status === "cancelled" ? <Badge variant="destructive">Batal</Badge> : <Badge variant="secondary">Aktif</Badge>}
        {row.original.no_receipt ? <Badge variant="warning">Tanpa nota</Badge> : null}
        {row.original.is_opening ? <Badge variant="outline">Saldo awal</Badge> : null}
      </div>
    ),
  },
];

/** Pengeluaran langsung (FIN-09, FIN-13). */
export function ExpensesTable({ rows }: { rows: ExpenseRow[] }) {
  return <DataTable columns={COLUMNS} data={rows} getRowId={(row) => row.id} />;
}

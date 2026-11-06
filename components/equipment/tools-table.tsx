"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { HandCoinsIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OWNERSHIP_LABELS, TRACKING_LABELS, type ToolRow } from "@/lib/equipment/labels";

const OWNERSHIP_OPTIONS = Object.entries(OWNERSHIP_LABELS).map(([value, label]) => ({ value, label }));
type Option = { value: string; label: string };

export function ToolsToolbar({
  categories,
  locations,
  canManage,
}: {
  categories: Option[];
  locations: Option[];
  canManage: boolean;
}) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari kode, nama, atau no. seri"
      filters={
        <>
          <SelectFilter param="category" allLabel="Semua kategori" options={categories} />
          <SelectFilter param="ownership" allLabel="Semua kepemilikan" options={OWNERSHIP_OPTIONS} />
          <SelectFilter param="location" allLabel="Semua lokasi" options={locations} />
        </>
      }
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/operations/tools/rentals">
              <HandCoinsIcon />
              Sewa aktif
            </Link>
          </Button>
          <ExportButton exportKey="tools" />
          {canManage ? (
            <Button asChild>
              <Link href="/operations/tools/new">
                <PlusIcon />
                Tambah Alat
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

const count = (value: number) => (value ? value : "—");

const COLUMNS: ColumnDef<ToolRow, unknown>[] = [
  {
    id: "code",
    header: "Kode",
    cell: ({ row }) => (
      <Link href={`/operations/tools/${row.original.id}`} className="font-medium whitespace-nowrap underline-offset-4 hover:underline">
        {row.original.code}
      </Link>
    ),
  },
  {
    id: "name", meta: { mobile: "title" },
    header: "Alat",
    cell: ({ row }) => (
      <div className="flex max-w-80 flex-col gap-1 whitespace-normal">
        <span>{row.original.name}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.category_name} · {TRACKING_LABELS[row.original.tracking]}
          {row.original.serial_no ? ` · ${row.original.serial_no}` : ""}
        </span>
      </div>
    ),
  },
  {
    id: "ownership",
    header: "Kepemilikan",
    cell: ({ row }) => (
      <Badge variant={row.original.ownership === "rented" ? "warning" : "outline"}>{OWNERSHIP_LABELS[row.original.ownership]}</Badge>
    ),
  },
  { id: "good", header: "Baik", cell: ({ row }) => count(row.original.good) },
  { id: "damaged", header: "Rusak", cell: ({ row }) => count(row.original.damaged) },
  { id: "repair", header: "Perbaikan", cell: ({ row }) => count(row.original.repair) },
  { id: "lost", header: "Hilang", cell: ({ row }) => count(row.original.lost) },
  { id: "in_transit", header: "Di jalan", cell: ({ row }) => count(row.original.in_transit) },
  { id: "total", header: "Total", cell: ({ row }) => <span className="font-medium">{row.original.total}</span> },
];

/** Daftar alat dengan stok per kondisi (ALT-01, ALT-02). */
export function ToolsTable({ tools }: { tools: ToolRow[] }) {
  return <DataTable columns={COLUMNS} data={tools} sortableColumns={["code", "name"]} getRowId={(row) => row.id} />;
}

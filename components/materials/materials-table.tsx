"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardCheckIcon, ListIcon, PlusIcon, ScaleIcon } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MATERIAL_OWNERSHIP_LABELS, formatQuantity, type MaterialRow } from "@/lib/materials/labels";

const OWNERSHIP_OPTIONS = Object.entries(MATERIAL_OWNERSHIP_LABELS).map(([value, label]) => ({ value, label }));
const LOW_OPTIONS = [{ value: "1", label: "Di bawah minimum" }];
type Option = { value: string; label: string };

export function MaterialsToolbar({
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
      searchPlaceholder="Cari kode atau nama material"
      filters={
        <>
          <SelectFilter param="category" allLabel="Semua kategori" options={categories} />
          <SelectFilter param="ownership" allLabel="Semua kepemilikan" options={OWNERSHIP_OPTIONS} />
          <SelectFilter param="location" allLabel="Semua lokasi" options={locations} />
          <SelectFilter param="low" allLabel="Semua stok" options={LOW_OPTIONS} />
        </>
      }
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/operations/material-transactions">
              <ListIcon />
              Transaksi
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/operations/materials/reconciliation">
              <ScaleIcon />
              Rekonsiliasi titipan
            </Link>
          </Button>
          {canManage ? (
            <Button asChild variant="outline">
              <Link href="/operations/materials/opname">
                <ClipboardCheckIcon />
                Stok opname
              </Link>
            </Button>
          ) : null}
          <ExportButton exportKey="materials" />
          {canManage ? (
            <Button asChild>
              <Link href="/operations/materials/new">
                <PlusIcon />
                Tambah Material
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

function columns(byLocation: boolean): ColumnDef<MaterialRow, unknown>[] {
  return [
    {
      id: "code",
      header: "Kode",
      cell: ({ row }) => (
        <Link href={`/operations/materials/${row.original.id}`} className="font-medium whitespace-nowrap underline-offset-4 hover:underline">
          {row.original.code}
        </Link>
      ),
    },
    {
      id: "name",
      header: "Material",
      cell: ({ row }) => (
        <div className="flex max-w-80 flex-col gap-1 whitespace-normal">
          <span>{row.original.name}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.category_name}
            {row.original.is_active ? "" : " · Nonaktif"}
          </span>
        </div>
      ),
    },
    {
      id: "ownership",
      header: "Kepemilikan",
      cell: ({ row }) => (
        <Badge variant={row.original.ownership === "client" ? "secondary" : "outline"}>
          {MATERIAL_OWNERSHIP_LABELS[row.original.ownership]}
        </Badge>
      ),
    },
    ...(byLocation
      ? [
          {
            id: "at_location",
            header: "Di lokasi",
            cell: ({ row }: { row: { original: MaterialRow } }) => (
              <span className="font-medium tabular-nums">
                {formatQuantity(row.original.at_location ?? 0)} {row.original.unit_code}
              </span>
            ),
          } satisfies ColumnDef<MaterialRow, unknown>,
        ]
      : []),
    {
      id: "on_hand",
      header: "Stok",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatQuantity(row.original.on_hand)} {row.original.unit_code}
        </span>
      ),
    },
    {
      id: "in_transit",
      header: "Di jalan",
      cell: ({ row }) => (row.original.in_transit ? formatQuantity(row.original.in_transit) : "—"),
    },
    {
      id: "min_stock",
      header: "Minimum",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular-nums">{row.original.min_stock === null ? "—" : formatQuantity(row.original.min_stock)}</span>
          {row.original.low_locations ? <Badge variant="warning">{row.original.low_locations} lokasi kurang</Badge> : null}
        </div>
      ),
    },
  ];
}

/** Material & Stok (MAT-01, MAT-07). */
export function MaterialsTable({ materials, byLocation }: { materials: MaterialRow[]; byLocation: boolean }) {
  return <DataTable columns={columns(byLocation)} data={materials} sortableColumns={["code", "name"]} getRowId={(row) => row.id} />;
}

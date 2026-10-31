"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { NoteStatusBadge } from "@/components/equipment/badges";
import { Button } from "@/components/ui/button";
import { NOTE_STATUS_LABELS, type NoteRow } from "@/lib/equipment/labels";
import { formatDate } from "@/lib/format";

const STATUS_OPTIONS = Object.entries(NOTE_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function NotesToolbar({ locations, canCreate }: { locations: { value: string; label: string }[]; canCreate: boolean }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari nomor surat jalan"
      filters={
        <>
          <SelectFilter param="status" allLabel="Semua status" options={STATUS_OPTIONS} />
          {locations.length ? <SelectFilter param="location" allLabel="Semua lokasi" options={locations} /> : null}
          <DateRangeFilter />
        </>
      }
      actions={
        <>
          <ExportButton exportKey="delivery-notes" />
          {canCreate ? (
            <Button asChild>
              <Link href="/operations/delivery-notes/new">
                <PlusIcon />
                Buat Surat Jalan
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

const COLUMNS: ColumnDef<NoteRow, unknown>[] = [
  {
    id: "number",
    header: "Nomor",
    cell: ({ row }) => (
      <Link
        href={`/operations/delivery-notes/${row.original.id}`}
        className="font-medium whitespace-nowrap underline-offset-4 hover:underline"
      >
        {row.original.number}
      </Link>
    ),
  },
  { id: "note_date", header: "Tanggal", cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.note_date)}</span> },
  {
    id: "route",
    header: "Asal → Tujuan",
    cell: ({ row }) => (
      <div className="flex max-w-96 flex-col whitespace-normal">
        <span>{row.original.from_location}</span>
        <span className="text-xs text-muted-foreground">→ {row.original.to_location}</span>
      </div>
    ),
  },
  { id: "status", header: "Status", cell: ({ row }) => <NoteStatusBadge status={row.original.status} /> },
  { id: "lines", header: "Baris", cell: ({ row }) => row.original.line_count },
];

/** Daftar surat jalan (ALT-03). */
export function NotesTable({ notes }: { notes: NoteRow[] }) {
  return <DataTable columns={COLUMNS} data={notes} sortableColumns={[]} getRowId={(row) => row.id} />;
}

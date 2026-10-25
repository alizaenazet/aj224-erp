"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TRAINING_KIND_LABELS, formatTrainingDates, type TrainingRow } from "@/lib/trainings/labels";

const KIND_OPTIONS = Object.entries(TRAINING_KIND_LABELS).map(([value, label]) => ({ value, label }));

export function TrainingsToolbar({ canManage }: { canManage: boolean }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari nama pelatihan atau penyelenggara"
      filters={
        <>
          <SelectFilter param="kind" allLabel="Semua jenis" options={KIND_OPTIONS} />
          <DateRangeFilter placeholder="Tanggal mulai" />
        </>
      }
      actions={
        <>
          <ExportButton exportKey="trainings" />
          {canManage ? (
            <Button asChild>
              <Link href="/hr/trainings/new">
                <PlusIcon />
                Tambah Pelatihan
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

const COLUMNS: ColumnDef<TrainingRow, unknown>[] = [
  {
    id: "name",
    header: "Nama Pelatihan",
    cell: ({ row }) => (
      <Link href={`/hr/trainings/${row.original.id}`} className="font-medium underline-offset-4 hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "kind",
    header: "Jenis",
    cell: ({ row }) => <Badge variant="outline">{TRAINING_KIND_LABELS[row.original.kind]}</Badge>,
  },
  { id: "organizer", header: "Penyelenggara", cell: ({ row }) => row.original.organizer ?? "—" },
  {
    id: "start_date",
    header: "Tanggal",
    cell: ({ row }) => formatTrainingDates(row.original.start_date, row.original.end_date),
  },
  { id: "certificate", header: "Sertifikat", cell: ({ row }) => row.original.certificate_type?.name ?? "—" },
  { id: "participants", header: "Peserta", cell: ({ row }) => row.original.participants.length },
  {
    id: "passed",
    header: "Lulus",
    cell: ({ row }) => row.original.participants.filter((participant) => participant.result === "passed").length,
  },
];

export function TrainingsTable({ trainings }: { trainings: TrainingRow[] }) {
  return (
    <DataTable
      columns={COLUMNS}
      data={trainings}
      sortableColumns={["start_date", "name"]}
      getRowId={(row) => row.id}
    />
  );
}

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChartColumnIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { ClassificationBadge, IncidentStatusBadge } from "@/components/k3/badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { CLASSIFICATION_LABELS, INCIDENT_STATUS_LABELS, type IncidentRow } from "@/lib/k3/labels";

const CLASS_OPTIONS = Object.entries(CLASSIFICATION_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(INCIDENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function IncidentsToolbar({ projects, canReport }: { projects: { value: string; label: string }[]; canReport: boolean }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari nomor, kronologi, atau tower"
      filters={
        <>
          <SelectFilter param="project" allLabel="Semua proyek" options={projects} />
          <SelectFilter param="classification" allLabel="Semua klasifikasi" options={CLASS_OPTIONS} />
          <SelectFilter param="status" allLabel="Semua status" options={STATUS_OPTIONS} />
          <DateRangeFilter />
        </>
      }
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/operations/incidents/summary">
              <ChartColumnIcon />
              Ringkasan K3
            </Link>
          </Button>
          <ExportButton exportKey="incidents" />
          {canReport ? (
            <Button asChild>
              <Link href="/operations/incidents/new">
                <PlusIcon />
                Lapor Insiden
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

const COLUMNS: ColumnDef<IncidentRow, unknown>[] = [
  {
    id: "number",
    header: "Nomor",
    cell: ({ row }) => (
      <Link href={`/operations/incidents/${row.original.id}`} className="font-medium whitespace-nowrap underline-offset-4 hover:underline">
        {row.original.number}
      </Link>
    ),
  },
  { id: "occurred_at", header: "Waktu", cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.occurred_at)}</span> },
  {
    id: "project",
    header: "Proyek",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="whitespace-nowrap">{row.original.project_code}</span>
        <span className="text-xs text-muted-foreground">
          {[row.original.section_code, row.original.location_note].filter(Boolean).join(" · ") || "—"}
        </span>
      </div>
    ),
  },
  { id: "classification", header: "Klasifikasi", cell: ({ row }) => <ClassificationBadge classification={row.original.classification} /> },
  {
    id: "chronology",
    header: "Kronologi",
    cell: ({ row }) => <span className="line-clamp-2 max-w-96 whitespace-normal">{row.original.chronology}</span>,
  },
  { id: "status", header: "Status", cell: ({ row }) => <IncidentStatusBadge status={row.original.status} /> },
  {
    id: "actions",
    header: "Tindakan",
    cell: ({ row }) =>
      row.original.action_count ? (
        <div className="flex flex-wrap gap-1">
          <span className="tabular-nums">
            {row.original.action_count - row.original.open_actions}/{row.original.action_count} selesai
          </span>
          {row.original.overdue_actions ? <Badge variant="destructive">{row.original.overdue_actions} terlambat</Badge> : null}
        </div>
      ) : (
        "—"
      ),
  },
];

/** Daftar insiden K3 (K3-01 … K3-04). */
export function IncidentsTable({ rows }: { rows: IncidentRow[] }) {
  return <DataTable columns={COLUMNS} data={rows} getRowId={(row) => row.id} />;
}

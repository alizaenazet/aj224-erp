"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate, formatRupiah } from "@/lib/format";
import { formatProgress } from "@/lib/progress/labels";
import { PROJECT_STATUS_LABELS, type ProjectRow } from "@/lib/projects/labels";

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function ProjectsToolbar({
  clients,
  canCreate,
}: {
  clients: { value: string; label: string }[];
  canCreate: boolean;
}) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari kode atau nama proyek"
      filters={
        <>
          <SelectFilter param="status" allLabel="Semua status" options={STATUS_OPTIONS} />
          {clients.length ? <SelectFilter param="client" allLabel="Semua klien" options={clients} /> : null}
        </>
      }
      actions={
        <>
          <ExportButton exportKey="projects" />
          {canCreate ? (
            <Button asChild>
              <Link href="/projects/new">
                <PlusIcon />
                Tambah Proyek
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

/** Daftar Proyek (PRJ-01); progress and the contract value only for roles that may see them. */
export function ProjectsTable({
  projects,
  showValues,
  showProgress,
}: {
  projects: ProjectRow[];
  showValues: boolean;
  showProgress: boolean;
}) {
  const columns = useMemo<ColumnDef<ProjectRow, unknown>[]>(() => {
    const base: ColumnDef<ProjectRow, unknown>[] = [
      { id: "code", header: "Kode", cell: ({ row }) => <span className="whitespace-nowrap">{row.original.code}</span> },
      {
        id: "name", meta: { mobile: "title" },
        header: "Proyek",
        cell: ({ row }) => (
          <div className="flex max-w-96 flex-col gap-1 whitespace-normal">
            <Link href={`/projects/${row.original.id}`} className="font-medium underline-offset-4 hover:underline">
              {row.original.name}
            </Link>
            {row.original.client_name ? (
              <span className="text-xs text-muted-foreground">{row.original.client_name}</span>
            ) : null}
          </div>
        ),
      },
      { id: "status", meta: { mobile: "aside" }, header: "Status", cell: ({ row }) => <ProjectStatusBadge status={row.original.status} /> },
      {
        id: "start_date",
        header: "Jadwal",
        cell: ({ row }) =>
          row.original.start_date || row.original.finish_date ? (
            <span className="whitespace-nowrap">
              {formatDate(row.original.start_date)} – {formatDate(row.original.finish_date)}
            </span>
          ) : (
            "—"
          ),
      },
    ];
    if (showProgress) {
      base.push({
        id: "progress",
        header: "Progres",
        cell: ({ row }) =>
          row.original.progress === null ? (
            <span className="text-muted-foreground">Belum ada seksi</span>
          ) : (
            <div className="flex min-w-28 items-center gap-2">
              <Progress value={Number(row.original.progress)} className="w-16" />
              <span className="whitespace-nowrap tabular-nums">{formatProgress(row.original.progress)}</span>
            </div>
          ),
      });
    }
    if (showValues) {
      base.push({
        id: "contract_value",
        header: "Nilai Kontrak",
        cell: ({ row }) => <span className="whitespace-nowrap">{formatRupiah(row.original.contract_value)}</span>,
      });
    }
    return base;
  }, [showValues, showProgress]);

  return (
    <DataTable
      columns={columns}
      data={projects}
      sortableColumns={["code", "name", "start_date"]}
      getRowId={(row) => row.id}
    />
  );
}

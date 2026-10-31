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
import {
  REPORT_STATUS_LABELS,
  REPORT_STATUS_VARIANTS,
  describeWeather,
  type ReportRow,
} from "@/lib/daily-reports/labels";
import { formatDate, formatNumber } from "@/lib/format";

const STATUS_OPTIONS = Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function ReportsToolbar({
  projects,
  canCreate,
}: {
  projects: { value: string; label: string }[];
  canCreate: boolean;
}) {
  return (
    <DataTableToolbar
      filters={
        <>
          <SelectFilter param="project" allLabel="Semua proyek" options={projects} />
          <SelectFilter param="status" allLabel="Semua status" options={STATUS_OPTIONS} />
          <DateRangeFilter />
        </>
      }
      actions={
        <>
          <ExportButton exportKey="daily-reports" />
          {canCreate ? (
            <Button asChild>
              <Link href="/field/daily-reports/new">
                <PlusIcon />
                Buat Laporan
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

/** Laporan harian list (OPS-03); `showProject` off on the project tab. */
export function ReportsTable({ reports, showProject = true }: { reports: ReportRow[]; showProject?: boolean }) {
  const columns: ColumnDef<ReportRow, unknown>[] = [
    {
      id: "report_date",
      header: "Tanggal",
      cell: ({ row }) => (
        <Link
          href={`/operations/daily-reports/${row.original.id}`}
          className="font-medium whitespace-nowrap underline-offset-4 hover:underline"
        >
          {formatDate(row.original.report_date)}
        </Link>
      ),
    },
    ...(showProject
      ? [
          {
            id: "project_code",
            header: "Proyek",
            cell: ({ row }: { row: { original: ReportRow } }) => (
              <span className="whitespace-nowrap">{row.original.project_code}</span>
            ),
          } satisfies ColumnDef<ReportRow, unknown>,
        ]
      : []),
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={REPORT_STATUS_VARIANTS[row.original.status]}>{REPORT_STATUS_LABELS[row.original.status]}</Badge>
          {row.original.no_activity ? <Badge variant="outline">Tidak ada kegiatan</Badge> : null}
        </div>
      ),
    },
    { id: "weather", header: "Cuaca", cell: ({ row }) => <span className="whitespace-nowrap">{describeWeather(row.original)}</span> },
    { id: "workforce", header: "Tenaga Kerja", cell: ({ row }) => formatNumber(row.original.workforce) },
    {
      id: "counts",
      header: "Aktivitas · Kendala · Foto",
      cell: ({ row }) =>
        row.original.no_activity ? (
          "—"
        ) : (
          <span className="whitespace-nowrap">
            {row.original.activity_count} · {row.original.obstacle_count} ·{" "}
            {row.original.photo_count ? row.original.photo_count : <Badge variant="warning">Foto belum ada</Badge>}
          </span>
        ),
    },
  ];

  return <DataTable columns={columns} data={reports} sortableColumns={["report_date"]} getRowId={(row) => row.id} />;
}

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DateRangeFilter } from "@/components/data-table/date-range-filter";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import type { RecapRow } from "@/lib/attendance/labels";
import { WORK_TYPE_LABELS } from "@/lib/employees/labels";
import { formatNumber } from "@/lib/format";

const TYPE_OPTIONS = Object.entries(WORK_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function RecapToolbar({ projects }: { projects: { value: string; label: string }[] }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari nama atau NIK karyawan"
      filters={
        <>
          <DateRangeFilter placeholder="Bulan ini" />
          <SelectFilter
            param="project"
            allLabel="Kantor & semua proyek"
            options={[{ value: "office", label: "Kantor" }, ...projects]}
          />
          <SelectFilter param="type" allLabel="Semua tipe" options={TYPE_OPTIONS} />
        </>
      }
      actions={<ExportButton exportKey="attendance-recap" />}
    />
  );
}

const count = (value: number) => (value ? formatNumber(value) : "—");

const COLUMNS: ColumnDef<RecapRow, unknown>[] = [
  {
    id: "employee",
    header: "Karyawan",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Link href={`/hr/employees/${row.original.employee_id}`} className="font-medium underline-offset-4 hover:underline">
          {row.original.employee_name}
        </Link>
        <span className="text-xs text-muted-foreground">{row.original.employee_no}</span>
      </div>
    ),
  },
  { id: "project", header: "Proyek", cell: ({ row }) => row.original.project_code ?? "Kantor" },
  { id: "present", header: "Hadir", cell: ({ row }) => <span className="font-medium">{count(row.original.present)}</span> },
  { id: "permit", header: "Izin", cell: ({ row }) => count(row.original.permit) },
  { id: "sick", header: "Sakit", cell: ({ row }) => count(row.original.sick) },
  { id: "leave", header: "Cuti", cell: ({ row }) => count(row.original.leave) },
  { id: "absent", header: "Alpa", cell: ({ row }) => count(row.original.absent) },
  { id: "off", header: "Libur", cell: ({ row }) => count(row.original.off) },
  {
    id: "overtime",
    header: "Lembur",
    cell: ({ row }) => (row.original.overtime_hours ? `${formatNumber(row.original.overtime_hours, 1)} jam` : "—"),
  },
];

/** Rekap absensi per karyawan dan proyek (HCM-11). */
export function RecapTable({ rows }: { rows: RecapRow[] }) {
  return (
    <DataTable
      columns={COLUMNS}
      data={rows}
      sortableColumns={[]}
      getRowId={(row) => `${row.employee_id}-${row.project_id ?? "office"}`}
    />
  );
}

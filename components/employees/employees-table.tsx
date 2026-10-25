"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import {
  EMPLOYMENT_STATUS_LABELS,
  WORK_TYPE_LABELS,
  type EmployeeRow,
} from "@/lib/employees/labels";
import { formatDate } from "@/lib/format";

const COLUMNS: ColumnDef<EmployeeRow, unknown>[] = [
  { id: "employee_no", header: "NIK Karyawan", cell: ({ row }) => row.original.employee_no },
  {
    id: "full_name",
    header: "Nama",
    cell: ({ row }) => (
      <Link href={`/hr/employees/${row.original.id}`} className="font-medium underline-offset-4 hover:underline">
        {row.original.full_name}
      </Link>
    ),
  },
  { id: "position", header: "Jabatan", cell: ({ row }) => row.original.position?.name ?? "—" },
  {
    id: "work_type",
    header: "Tipe",
    cell: ({ row }) => <Badge variant="outline">{WORK_TYPE_LABELS[row.original.work_type]}</Badge>,
  },
  {
    id: "employment_status",
    header: "Status Kerja",
    cell: ({ row }) => EMPLOYMENT_STATUS_LABELS[row.original.employment_status],
  },
  { id: "phone", header: "No. HP", cell: ({ row }) => row.original.phone ?? "—" },
  { id: "join_date", header: "Tanggal Masuk", cell: ({ row }) => formatDate(row.original.join_date) },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "secondary" : "destructive"}>
        {row.original.is_active ? "Aktif" : "Nonaktif"}
      </Badge>
    ),
  },
];

export function EmployeesTable({ employees }: { employees: EmployeeRow[] }) {
  return (
    <DataTable
      columns={COLUMNS}
      data={employees}
      sortableColumns={["employee_no", "full_name", "join_date"]}
      getRowId={(row) => row.id}
    />
  );
}

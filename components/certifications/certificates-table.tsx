"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { CertificateStatusBadge } from "@/components/certifications/certificate-status-badge";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import {
  CERTIFICATE_FILTER_LABELS,
  describeDaysLeft,
  type CertificateRow,
} from "@/lib/certifications/labels";
import { formatDate } from "@/lib/format";

const STATUS_OPTIONS = Object.entries(CERTIFICATE_FILTER_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function CertificatesToolbar({ types }: { types: { value: string; label: string }[] }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari nama, NIK karyawan, atau nomor sertifikat"
      filters={
        <>
          <SelectFilter param="status" allLabel="Semua status" options={STATUS_OPTIONS} />
          <SelectFilter param="type" allLabel="Semua jenis" options={types} />
        </>
      }
      actions={<ExportButton exportKey="certificates" />}
    />
  );
}

const COLUMNS: ColumnDef<CertificateRow, unknown>[] = [
  { id: "employee_no", header: "NIK Karyawan", cell: ({ row }) => row.original.employee_no },
  {
    id: "employee_name",
    header: "Nama",
    cell: ({ row }) => (
      <Link
        href={`/hr/employees/${row.original.employee_id}?tab=certificates`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {row.original.employee_name}
      </Link>
    ),
  },
  { id: "type", header: "Jenis Sertifikat", cell: ({ row }) => row.original.certificate_type_name },
  { id: "certificate_no", header: "Nomor", cell: ({ row }) => row.original.certificate_no ?? "—" },
  {
    id: "expiry_date",
    header: "Kedaluwarsa",
    cell: ({ row }) =>
      row.original.expiry_date ? formatDate(row.original.expiry_date) : "Seumur hidup",
  },
  { id: "days_left", header: "Sisa", cell: ({ row }) => describeDaysLeft(row.original.days_left) },
  { id: "status", header: "Status", cell: ({ row }) => <CertificateStatusBadge status={row.original.status} /> },
];

/** Current certificates (HCM-04), soonest expiry first by default. */
export function CertificatesTable({ certificates }: { certificates: CertificateRow[] }) {
  return (
    <DataTable
      columns={COLUMNS}
      data={certificates}
      sortableColumns={["expiry_date", "employee_name"]}
      getRowId={(row) => row.id}
    />
  );
}

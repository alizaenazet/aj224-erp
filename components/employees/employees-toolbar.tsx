"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Button } from "@/components/ui/button";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  VERIFICATION_LABELS,
  WORK_TYPE_LABELS,
} from "@/lib/employees/labels";

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const TYPE_OPTIONS = toOptions(WORK_TYPE_LABELS);
const EMPLOYMENT_OPTIONS = toOptions(EMPLOYMENT_STATUS_LABELS);
const STATUS_OPTIONS = toOptions(EMPLOYEE_STATUS_LABELS);
const VERIFICATION_OPTIONS = toOptions(VERIFICATION_LABELS);

type EmployeesToolbarProps = {
  positions: { value: string; label: string }[];
  canManage: boolean;
};

export function EmployeesToolbar({ positions, canManage }: EmployeesToolbarProps) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari nama, NIK karyawan, atau no. HP"
      filters={
        <>
          <SelectFilter param="type" allLabel="Semua tipe" options={TYPE_OPTIONS} />
          <SelectFilter param="employment" allLabel="Semua status kerja" options={EMPLOYMENT_OPTIONS} />
          <SelectFilter param="position" allLabel="Semua jabatan" options={positions} />
          <SelectFilter param="status" allLabel="Aktif & nonaktif" options={STATUS_OPTIONS} />
          <SelectFilter param="verification" allLabel="Semua verifikasi" options={VERIFICATION_OPTIONS} />
        </>
      }
      actions={
        <>
          <ExportButton exportKey="employees" />
          {canManage ? (
            <Button asChild>
              <Link href="/hr/employees/new">
                <PlusIcon />
                Tambah Karyawan
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

"use client";

import { GraduationCapIcon, ListChecksIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CertificateStatusBadge } from "@/components/certifications/certificate-status-badge";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { TrainingNeedRow } from "@/lib/trainings/labels";

export function TrainingNeedsToolbar({ types }: { types: { value: string; label: string }[] }) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari nama atau NIK karyawan"
      filters={<SelectFilter param="type" allLabel="Semua jenis" options={types} />}
      actions={<ExportButton exportKey="training-needs" />}
    />
  );
}

type Group = { typeId: string; typeName: string; rows: TrainingNeedRow[] };

function groupByType(rows: TrainingNeedRow[]): Group[] {
  const groups = new Map<string, Group>();
  for (const row of rows) {
    const group = groups.get(row.certificate_type_id) ?? {
      typeId: row.certificate_type_id,
      typeName: row.certificate_type_name,
      rows: [],
    };
    group.rows.push(row);
    groups.set(row.certificate_type_id, group);
  }
  return [...groups.values()];
}

/** HCM-08: who needs which certificate, grouped per type. */
export function TrainingNeedsView({ rows, canManage }: { rows: TrainingNeedRow[]; canManage: boolean }) {
  const groups = groupByType(rows);

  if (groups.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListChecksIcon />
          </EmptyMedia>
          <EmptyTitle>Tidak ada kebutuhan pelatihan</EmptyTitle>
          <EmptyDescription>
            Semua karyawan aktif memiliki sertifikat wajib jabatannya yang masih berlaku.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <NeedGroup key={group.typeId} group={group} canManage={canManage} />
      ))}
    </div>
  );
}

function NeedGroup({ group, canManage }: { group: Group; canManage: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = selected.length === group.rows.length;
  const href = `/hr/trainings/new?certificate_type=${group.typeId}&employees=${selected.join(",")}`;

  function toggle(employeeId: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, employeeId] : current.filter((id) => id !== employeeId),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{group.typeName}</CardTitle>
        <CardDescription>{group.rows.length} karyawan perlu pelatihan atau perpanjangan.</CardDescription>
        {canManage ? (
          <CardAction>
            {selected.length ? (
              <Button asChild size="sm">
                <Link href={href}>
                  <GraduationCapIcon />
                  Buat pelatihan ({selected.length})
                </Link>
              </Button>
            ) : (
              <Button size="sm" disabled>
                <GraduationCapIcon />
                Buat pelatihan
              </Button>
            )}
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {canManage ? (
                <TableHead className="w-8">
                  <Checkbox
                    checked={allSelected ? true : selected.length ? "indeterminate" : false}
                    onCheckedChange={(checked) =>
                      setSelected(checked === true ? group.rows.map((row) => row.employee_id) : [])
                    }
                    aria-label={`Pilih semua untuk ${group.typeName}`}
                  />
                </TableHead>
              ) : null}
              <TableHead>NIK Karyawan</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kedaluwarsa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.rows.map((row) => (
              <TableRow key={row.employee_id}>
                {canManage ? (
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(row.employee_id)}
                      onCheckedChange={(checked) => toggle(row.employee_id, checked === true)}
                      aria-label={`Pilih ${row.employee_name}`}
                    />
                  </TableCell>
                ) : null}
                <TableCell>{row.employee_no}</TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/hr/employees/${row.employee_id}?tab=certificates`}
                    className="underline-offset-4 hover:underline"
                  >
                    {row.employee_name}
                  </Link>
                </TableCell>
                <TableCell>{row.position_name}</TableCell>
                <TableCell>
                  <CertificateStatusBadge status={row.status} />
                </TableCell>
                <TableCell>{row.expiry_date ? formatDate(row.expiry_date) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

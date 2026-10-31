"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/app/date-picker";
import type { ComboboxOption } from "@/components/app/combobox";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { CertStateBadge } from "@/components/assignments/cert-state-badge";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { endAssignment } from "@/lib/assignments/actions";
import {
  ASSIGNMENT_STATE_LABELS,
  ASSIGNMENT_STATE_VARIANTS,
  type AssignmentRow,
} from "@/lib/assignments/labels";
import { VERIFICATION_LABELS } from "@/lib/employees/labels";
import { formatDate } from "@/lib/format";

const STATE_OPTIONS = Object.entries(ASSIGNMENT_STATE_LABELS).map(([value, label]) => ({ value, label }));
const OVERRIDE_OPTIONS = [{ value: "1", label: "Dengan override" }];

type FormOptions = {
  employees: (ComboboxOption & { position_id: string })[];
  projects: ComboboxOption[];
  positions: { value: string; label: string }[];
};

export function AssignmentsToolbar({
  projects,
  canManage,
  formOptions,
  today,
}: {
  projects: { value: string; label: string }[];
  canManage: boolean;
  formOptions: FormOptions | null;
  today: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DataTableToolbar
        searchPlaceholder="Cari nama atau NIK karyawan"
        filters={
          <>
            <SelectFilter param="project" allLabel="Semua proyek" options={projects} />
            <SelectFilter param="state" allLabel="Semua status" options={STATE_OPTIONS} />
            <SelectFilter param="override" allLabel="Semua penugasan" options={OVERRIDE_OPTIONS} />
          </>
        }
        actions={
          <>
            <ExportButton exportKey="assignments" />
            {canManage ? (
              <Button onClick={() => setOpen(true)}>
                <PlusIcon />
                Tambah Penugasan
              </Button>
            ) : null}
          </>
        }
      />
      {canManage && formOptions ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah penugasan</DialogTitle>
              <DialogDescription>
                Sertifikat wajib jabatan diperiksa pada tanggal mulai. Satu karyawan hanya boleh punya satu penugasan aktif.
              </DialogDescription>
            </DialogHeader>
            {open ? <AssignmentForm {...formOptions} today={today} onDone={() => setOpen(false)} /> : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

/** Penugasan list with certificate state and override badges (HCM-05, HCM-06). */
export function AssignmentsTable({
  assignments,
  canManage,
  today,
}: {
  assignments: AssignmentRow[];
  canManage: boolean;
  today: string;
}) {
  // Kept after closing so the dialog text stays stable during its exit animation.
  const [target, setTarget] = useState<AssignmentRow | null>(null);
  const [open, setOpen] = useState(false);
  const [endDate, setEndDate] = useState<string | null>(today);
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!target || !endDate) return;
    setPending(true);
    const result = await endAssignment({ id: target.id, values: { end_date: endDate, notes: null } });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    setOpen(false);
  }

  const columns = useMemo<ColumnDef<AssignmentRow, unknown>[]>(() => {
    const base: ColumnDef<AssignmentRow, unknown>[] = [
      {
        id: "employee_name",
        header: "Karyawan",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <Link
              href={`/hr/employees/${row.original.employee_id}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {row.original.employee_name}
            </Link>
            <span className="text-xs text-muted-foreground">{row.original.employee_no}</span>
          </div>
        ),
      },
      {
        id: "project_code",
        header: "Proyek",
        cell: ({ row }) => (
          <Link href={`/projects/${row.original.project_id}/team`} className="whitespace-nowrap underline-offset-4 hover:underline">
            {row.original.project_code}
          </Link>
        ),
      },
      { id: "position", header: "Jabatan", cell: ({ row }) => row.original.position_name },
      {
        id: "start_date",
        header: "Periode",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatDate(row.original.start_date)} – {row.original.end_date ? formatDate(row.original.end_date) : "sekarang"}
          </span>
        ),
      },
      {
        id: "state",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Badge variant={ASSIGNMENT_STATE_VARIANTS[row.original.state]}>
              {ASSIGNMENT_STATE_LABELS[row.original.state]}
            </Badge>
            {row.original.verification_status === "pending" ? (
              <Badge variant="warning">{VERIFICATION_LABELS.pending}</Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: "cert",
        header: "Sertifikat",
        cell: ({ row }) => (
          <div className="flex max-w-64 flex-wrap gap-1 whitespace-normal">
            {row.original.cert_state ? (
              <CertStateBadge state={row.original.cert_state} issues={row.original.cert_issues} />
            ) : (
              <span className="text-muted-foreground">Tidak wajib</span>
            )}
            {row.original.overridden_at ? (
              <Badge variant="destructive" title={row.original.override_reason ?? undefined}>
                Override
              </Badge>
            ) : null}
          </div>
        ),
      },
    ];
    if (canManage) {
      base.push({
        id: "actions",
        header: () => <span className="sr-only">Tindakan</span>,
        cell: ({ row }) =>
          row.original.state === "ended" ? null : (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Tindakan untuk ${row.original.employee_name}`}>
                    <MoreHorizontalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      setTarget(row.original);
                      setEndDate(today < row.original.start_date ? row.original.start_date : today);
                      setOpen(true);
                    }}
                  >
                    Akhiri penugasan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
      });
    }
    return base;
  }, [canManage, today]);

  return (
    <>
      <DataTable
        columns={columns}
        data={assignments}
        sortableColumns={["employee_name", "project_code", "start_date"]}
        getRowId={(row) => row.id}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Akhiri penugasan {target?.employee_name}?</DialogTitle>
            <DialogDescription>
              {target ? `${target.project_code} · ${target.position_name}` : null}. Setelah tanggal selesai, karyawan tidak
              lagi masuk daftar kru proyek ini.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="assignment-end-date">Tanggal selesai *</FieldLabel>
            <DatePicker
              id="assignment-end-date"
              value={endDate}
              onChange={setEndDate}
              min={target?.start_date}
            />
            <FieldDescription>Hari terakhir karyawan bekerja di proyek ini.</FieldDescription>
          </Field>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button disabled={pending || !endDate} onClick={() => void submit()}>
              {pending ? "Menyimpan…" : "Akhiri"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

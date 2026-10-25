"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { MasterRecordDialog } from "@/components/master-data/master-record-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteMasterRecord, setMasterRecordActive } from "@/lib/master-data/actions";
import { getMasterEntity, type FieldOption } from "@/lib/master-data/entities";

type Row = Record<string, unknown>;

const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

type MasterDataViewProps = {
  entityKey: string;
  rows: Row[];
  canManage: boolean;
  certificateOptions?: FieldOption[];
};

/** List + toolbar + dialogs for one master entity (MST-03 … MST-09). */
export function MasterDataView({ entityKey, rows, canManage, certificateOptions }: MasterDataViewProps) {
  const entity = getMasterEntity(entityKey)!;
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const idOf = (row: Row) => String(row[entity.idColumn]);
  const nameOf = (row: Row) => String(row.name ?? row.code ?? "");

  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => {
    async function toggleActive(row: Row) {
      const result = await setMasterRecordActive(entity.key, idOf(row), !row.is_active);
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
    }

    const listColumns: ColumnDef<Row, unknown>[] = entity.fields
      .filter((field) => field.list)
      .map((field, index) => ({
        id: field.name,
        header: field.label,
        cell: ({ row }) => {
          const value = field.format
            ? field.format(row.original[field.name], row.original)
            : String(row.original[field.name] ?? "—");
          return index === 0 ? <span className="font-medium">{value}</span> : value;
        },
      }));

    return [
      ...listColumns,
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? "secondary" : "destructive"}>
            {row.original.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        ),
      },
      ...(canManage
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">Tindakan</span>,
              cell: ({ row }) => {
                if (entity.readOnlyRow?.(row.original)) return null;
                return (
                  <div className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Tindakan untuk ${nameOf(row.original)}`}>
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditRow(row.original);
                            setFormOpen(true);
                          }}
                        >
                          Ubah
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void toggleActive(row.original)}>
                          {row.original.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => {
                            setDeleteRow(row.original);
                            setDeleteOpen(true);
                          }}
                        >
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              },
            } satisfies ColumnDef<Row, unknown>,
          ]
        : []),
    ];
    // idOf/nameOf only read entity, which is stable for this key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, canManage]);

  async function confirmDelete() {
    if (!deleteRow) return;
    setPending(true);
    const result = await deleteMasterRecord(entity.key, idOf(deleteRow));
    setPending(false);
    setDeleteOpen(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        searchPlaceholder={entity.searchColumns.length > 0 ? entity.searchPlaceholder : undefined}
        filters={
          <>
            {entity.filter ? (
              <SelectFilter
                param={entity.filter.param}
                allLabel={entity.filter.allLabel}
                options={entity.filter.options}
              />
            ) : null}
            <SelectFilter param="status" allLabel="Semua status" options={STATUS_OPTIONS} />
          </>
        }
        actions={
          <>
            <ExportButton exportKey={`master-${entity.key}`} />
            {canManage ? (
              <Button
                onClick={() => {
                  setEditRow(null);
                  setFormOpen(true);
                }}
              >
                <PlusIcon />
                Tambah {entity.singular}
              </Button>
            ) : null}
          </>
        }
      />

      <DataTable columns={columns} data={rows} getRowId={idOf} />

      <MasterRecordDialog
        entity={entity}
        row={editRow}
        open={formOpen}
        onOpenChange={setFormOpen}
        certificateOptions={certificateOptions}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {entity.singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRow ? nameOf(deleteRow) : ""} akan dihapus permanen. Data yang sudah
              dipakai tidak dapat dihapus; nonaktifkan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

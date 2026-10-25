"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, SearchXIcon } from "lucide-react";
import { useListParams } from "@/components/data-table/use-list-params";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
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

type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  /** Column ids the server can sort by (`?sort=id.asc|desc`). */
  sortableColumns?: readonly string[];
  getRowId?: (row: T) => string;
};

/**
 * Server-driven data table (UMM-09): the server filters, sorts and
 * paginates; this renders rows and writes sorting to the URL.
 */
export function DataTable<T>({
  columns,
  data,
  sortableColumns = [],
  getRowId,
}: DataTableProps<T>) {
  const { get, update, reset } = useListParams();
  const [sortColumn, sortDirection] = (get("sort") ?? "").split(".");
  const sorting: SortingState = sortColumn
    ? [{ id: sortColumn, desc: sortDirection === "desc" }]
    : [];

  const table = useReactTable({
    data,
    columns,
    getRowId,
    manualSorting: true,
    state: { sorting },
    getCoreRowModel: getCoreRowModel(),
  });

  function toggleSort(columnId: string) {
    const current = sorting[0];
    const next =
      current?.id === columnId ? (current.desc ? "asc" : "desc") : "asc";
    update({ sort: `${columnId}.${next}` });
  }

  if (data.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>Tidak ada data yang cocok</EmptyTitle>
          <EmptyDescription>Ubah pencarian atau filter, atau reset filter.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={reset}>
            Reset filter
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const sortable = sortableColumns.includes(header.column.id);
              const active = sorting[0]?.id === header.column.id ? sorting[0] : null;
              const label = header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext());

              return (
                <TableHead key={header.id}>
                  {sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-2"
                      onClick={() => toggleSort(header.column.id)}
                    >
                      {label}
                      {active ? (
                        active.desc ? <ArrowDownIcon /> : <ArrowUpIcon />
                      ) : (
                        <ArrowUpDownIcon />
                      )}
                    </Button>
                  ) : (
                    label
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

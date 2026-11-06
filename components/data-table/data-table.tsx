"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Cell,
  type ColumnDef,
  type Header,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, SearchXIcon } from "lucide-react";
import { MobileList, type MobileRow } from "@/components/app/mobile-list";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * Phone layout (below md). "title" heads the card (default: the first
     * column), "aside" sits right of the title (status), "full" spans the
     * card width (long text), "hidden" is left out. Row buttons (id
     * "actions" with no text header) go to the card footer.
     */
    mobile?: "title" | "aside" | "full" | "hidden";
  }
}

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

  const headers = table.getHeaderGroups()[0]?.headers ?? [];

  return (
    <>
      <div className="hidden md:block">
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
      </div>
      {sortableColumns.length ? (
        <MobileSort headers={headers} sortableColumns={sortableColumns} sorting={sorting} onChange={(value) => update({ sort: value })} />
      ) : null}
      <MobileList rows={table.getRowModel().rows.map((row) => toMobileRow(row.id, row.getVisibleCells(), headers))} />
    </>
  );
}

function headerLabel<T>(header: Header<T, unknown> | undefined) {
  if (!header || header.isPlaceholder) return null;
  return flexRender(header.column.columnDef.header, header.getContext());
}

/** One table row as a phone card, following each column's meta.mobile. */
function toMobileRow<T>(key: string, cells: Cell<T, unknown>[], headers: Header<T, unknown>[]): MobileRow {
  const hasTitle = cells.some((cell) => cell.column.columnDef.meta?.mobile === "title");
  const render = (cell: Cell<T, unknown>) => flexRender(cell.column.columnDef.cell, cell.getContext());
  const row: MobileRow = { key, title: null, fields: [] };
  const titles: React.ReactNode[] = [];
  const asides: React.ReactNode[] = [];

  cells.forEach((cell, index) => {
    const mode = cell.column.columnDef.meta?.mobile;
    if (mode === "hidden") return;
    // Row buttons (an "actions" column without a text header) go to the footer.
    if (cell.column.id === "actions" && typeof cell.column.columnDef.header !== "string") {
      row.actions = render(cell);
    } else if (mode === "title" || (!hasTitle && index === 0)) {
      titles.push(<div key={cell.id}>{render(cell)}</div>);
    } else if (mode === "aside") {
      asides.push(<div key={cell.id}>{render(cell)}</div>);
    } else {
      const header = headers.find((item) => item.column.id === cell.column.id);
      row.fields.push({ key: cell.id, label: headerLabel(header), value: render(cell), full: mode === "full" });
    }
  });

  row.title = titles;
  row.aside = asides.length ? asides : undefined;
  return row;
}

/** Sorting on phones, where the column headers are not shown. */
function MobileSort<T>({
  headers,
  sortableColumns,
  sorting,
  onChange,
}: {
  headers: Header<T, unknown>[];
  sortableColumns: readonly string[];
  sorting: SortingState;
  onChange: (value: string) => void;
}) {
  const current = sorting[0] ? `${sorting[0].id}.${sorting[0].desc ? "desc" : "asc"}` : "";
  const options = headers
    .filter((header) => sortableColumns.includes(header.column.id))
    .flatMap((header) => [
      { value: `${header.column.id}.asc`, label: headerLabel(header), arrow: "↑" },
      { value: `${header.column.id}.desc`, label: headerLabel(header), arrow: "↓" },
    ]);

  return (
    <div className="md:hidden">
      <Select value={current} onValueChange={onChange}>
        <SelectTrigger className="w-full" aria-label="Urutkan">
          <SelectValue placeholder="Urutkan" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              Urutkan: {option.label} {option.arrow}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

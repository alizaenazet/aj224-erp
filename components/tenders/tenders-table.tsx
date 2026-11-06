"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { TenderStatusBadge, TenderUrgencyBadge } from "@/components/tenders/tender-badges";
import { Button } from "@/components/ui/button";
import { formatRate } from "@/lib/clients/labels";
import { formatDate, formatRupiah } from "@/lib/format";
import { TENDER_STATUS_LABELS, VOLTAGES, type TenderRow } from "@/lib/tenders/labels";

// "Aktif" is the default (no parameter), so only the other choices are listed.
const STATUS_OPTIONS = [
  { value: "all", label: "Semua status" },
  ...Object.entries(TENDER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];
const VOLTAGE_OPTIONS = VOLTAGES.map((kv) => ({ value: String(kv), label: `${kv} kV` }));

export function TendersToolbar({
  clients,
  canManage,
}: {
  clients: { value: string; label: string }[];
  canManage: boolean;
}) {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari paket, klien, atau lokasi"
      filters={
        <>
          <SelectFilter param="status" allLabel="Tender aktif" options={STATUS_OPTIONS} />
          <SelectFilter param="client" allLabel="Semua klien" options={clients} />
          <SelectFilter param="voltage" allLabel="Semua tegangan" options={VOLTAGE_OPTIONS} />
        </>
      }
      actions={
        <>
          <ExportButton exportKey="tenders" />
          {canManage ? (
            <Button asChild>
              <Link href="/marketing/tenders/new">
                <PlusIcon />
                Tambah Tender
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  );
}

/** Tender list; by default the MKT-07 priority list (weighted value first). */
export function TendersTable({ tenders, today }: { tenders: TenderRow[]; today: string }) {
  const columns = useMemo<ColumnDef<TenderRow, unknown>[]>(
    () => [
      {
        id: "name",
        header: "Paket",
        cell: ({ row }) => (
          <div className="flex max-w-80 flex-col gap-1 whitespace-normal">
            <Link
              href={`/marketing/tenders/${row.original.id}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {row.original.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {row.original.client?.name ?? "—"}
              {row.original.voltage_kv ? ` · ${row.original.voltage_kv} kV` : ""}
            </span>
          </div>
        ),
      },
      {
        id: "bid_deadline",
        header: "Batas Penawaran",
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <span>{formatDate(row.original.bid_deadline)}</span>
            <TenderUrgencyBadge status={row.original.status} bidDeadline={row.original.bid_deadline} today={today} />
          </div>
        ),
      },
      { id: "bid_value", header: "Nilai Penawaran", cell: ({ row }) => formatRupiah(row.original.bid_value) },
      {
        id: "win_probability",
        header: "Peluang",
        cell: ({ row }) => (row.original.win_probability === null ? "—" : `${row.original.win_probability}%`),
      },
      { id: "weighted_value", header: "Nilai Tertimbang", cell: ({ row }) => formatRupiah(row.original.weighted_value) },
      {
        id: "client_win_rate",
        header: "Win Rate Klien",
        cell: ({ row }) => formatRate(row.original.client_stats?.win_rate_count),
      },
      { id: "status", meta: { mobile: "aside" }, header: "Status", cell: ({ row }) => <TenderStatusBadge status={row.original.status} /> },
      { id: "pic", header: "PIC", cell: ({ row }) => row.original.pic_name ?? "—" },
    ],
    [today],
  );

  return (
    <DataTable
      columns={columns}
      data={tenders}
      sortableColumns={["name", "bid_deadline", "bid_value", "weighted_value"]}
      getRowId={(row) => row.id}
    />
  );
}

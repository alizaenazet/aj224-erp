"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FOLLOW_UP_BADGES, followUpState } from "@/components/clients/activity-log";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setFollowUpDone } from "@/lib/clients/actions";
import {
  ACTIVITY_KIND_LABELS,
  FOLLOW_UP_FILTER_LABELS,
  type ActivityRow,
} from "@/lib/clients/labels";
import { formatDate } from "@/lib/format";

// "Belum selesai" is the default, so it is not offered as a separate value.
const STATUS_OPTIONS = [
  { value: "done", label: FOLLOW_UP_FILTER_LABELS.done },
  { value: "all", label: FOLLOW_UP_FILTER_LABELS.all },
];

export function FollowUpsToolbar() {
  return (
    <DataTableToolbar
      searchPlaceholder="Cari catatan"
      filters={<SelectFilter param="status" allLabel={FOLLOW_UP_FILTER_LABELS.open} options={STATUS_OPTIONS} />}
      actions={<ExportButton exportKey="follow-ups" />}
    />
  );
}

type FollowUpsTableProps = {
  rows: ActivityRow[];
  today: string;
  canLog: boolean;
  currentUserId: string;
  isSuperAdmin: boolean;
};

/** Tindak Lanjut (MKT-02): due and overdue first. */
export function FollowUpsTable({ rows, today, canLog, currentUserId, isSuperAdmin }: FollowUpsTableProps) {
  const [pending, setPending] = useState(false);

  const columns = useMemo<ColumnDef<ActivityRow, unknown>[]>(() => {
    async function toggle(activity: ActivityRow) {
      setPending(true);
      const result = await setFollowUpDone({ activityId: activity.id, done: !activity.follow_up_done_at });
      setPending(false);
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
    }

    return [
      {
        id: "follow_up_date",
        header: "Tindak Lanjut",
        cell: ({ row }) => {
          const state = followUpState(row.original, today);
          return (
            <div className="flex flex-col items-start gap-1">
              <span>{formatDate(row.original.follow_up_date)}</span>
              {state ? <Badge variant={FOLLOW_UP_BADGES[state].variant}>{FOLLOW_UP_BADGES[state].label}</Badge> : null}
            </div>
          );
        },
      },
      {
        id: "client",
        header: "Klien",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Link
              href={`/marketing/clients/${row.original.client_id}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {row.original.client_name}
            </Link>
            {row.original.tender_name ? (
              <span className="text-xs text-muted-foreground">{row.original.tender_name}</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "activity", meta: { mobile: "full" },
        header: "Aktivitas",
        cell: ({ row }) => (
          <div className="flex max-w-96 flex-col gap-1 whitespace-normal">
            <span className="text-xs text-muted-foreground">
              {ACTIVITY_KIND_LABELS[row.original.kind]} · {formatDate(row.original.activity_date)}
            </span>
            <span>{row.original.notes}</span>
          </div>
        ),
      },
      { id: "owner", header: "Dicatat oleh", cell: ({ row }) => row.original.owner_name ?? "—" },
      {
        id: "actions",
        header: () => <span className="sr-only">Tindakan</span>,
        cell: ({ row }) =>
          canLog && (isSuperAdmin || row.original.owner_id === currentUserId) ? (
            <div className="text-right">
              <Button variant="outline" size="sm" disabled={pending} onClick={() => void toggle(row.original)}>
                {row.original.follow_up_done_at ? "Buka kembali" : "Tandai selesai"}
              </Button>
            </div>
          ) : null,
      },
    ];
  }, [today, canLog, currentUserId, isSuperAdmin, pending]);

  return <DataTable columns={columns} data={rows} getRowId={(row) => row.id} />;
}

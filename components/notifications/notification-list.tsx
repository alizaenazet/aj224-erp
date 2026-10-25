"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { useOpenNotification } from "@/components/notifications/use-open-notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { markAllNotificationsRead } from "@/lib/notifications/actions";

type ListItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
};

const STATUS_OPTIONS = [
  { value: "unread", label: "Belum dibaca" },
  { value: "read", label: "Dibaca" },
];

export function NotificationToolbar({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();

  async function markAll() {
    const result = await markAllNotificationsRead();
    if (result.ok) toast.success(result.message);
    else toast.error(result.error);
    router.refresh();
  }

  return (
    <DataTableToolbar
      searchPlaceholder="Cari judul notifikasi"
      filters={<SelectFilter param="status" allLabel="Semua status" options={STATUS_OPTIONS} />}
      actions={
        <>
          <ExportButton exportKey="notifications" />
          {hasUnread ? (
            <Button variant="outline" onClick={markAll}>
              Tandai semua dibaca
            </Button>
          ) : null}
        </>
      }
    />
  );
}

export function NotificationList({ items }: { items: ListItem[] }) {
  const openNotification = useOpenNotification();

  const columns = useMemo<ColumnDef<ListItem, unknown>[]>(
    () => [
      {
        id: "created_at",
        header: "Waktu",
        cell: ({ row }) => formatDateTime(row.original.created_at),
      },
      {
        id: "title",
        header: "Notifikasi",
        cell: ({ row }) => (
          <div className="whitespace-normal">
            <Button
              variant="link"
              className="h-auto p-0 text-left whitespace-normal"
              onClick={() => void openNotification(row.original)}
            >
              {row.original.title}
            </Button>
            {row.original.body ? (
              <p className="text-sm text-muted-foreground">{row.original.body}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.read_at ? "outline" : "default"}>
            {row.original.read_at ? "Dibaca" : "Belum dibaca"}
          </Badge>
        ),
      },
    ],
    [openNotification],
  );

  return <DataTable columns={columns} data={items} getRowId={(row) => row.id} />;
}

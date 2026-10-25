"use client";

import Link from "next/link";
import { BellIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useOpenNotification } from "@/components/notifications/use-open-notification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/format";
import { markAllNotificationsRead } from "@/lib/notifications/actions";

type BellItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
};

type NotificationBellProps = {
  unreadCount: number;
  items: BellItem[];
};

/** Header bell: unread count and the latest notifications (UMM-06). */
export function NotificationBell({ unreadCount, items }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const openNotification = useOpenNotification();

  async function markAll() {
    const result = await markAllNotificationsRead();
    if (!result.ok) toast.error(result.error);
    router.refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `Notifikasi, ${unreadCount} belum dibaca`
              : "Notifikasi"
          }
        >
          <BellIcon />
          {unreadCount > 0 ? (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 p-3">
          <span className="text-sm font-medium">Notifikasi</span>
          {unreadCount > 0 ? (
            <Button variant="link" size="sm" onClick={markAll}>
              Tandai semua dibaca
            </Button>
          ) : null}
        </div>
        <Separator />
        {items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Belum ada notifikasi.</p>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="flex flex-col">
              {items.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="h-auto flex-col items-start gap-1 rounded-none px-3 py-2 text-left whitespace-normal"
                  onClick={() => {
                    setOpen(false);
                    void openNotification(item);
                  }}
                >
                  <span className={item.read_at ? "font-normal" : "font-semibold"}>
                    {item.title}
                  </span>
                  {item.body ? (
                    <span className="text-xs text-muted-foreground">{item.body}</span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(item.created_at)}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
        <Separator />
        <div className="p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              Lihat semua
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { markNotificationRead } from "@/lib/notifications/actions";

/** Marks a notification read, then opens its link (or just refreshes). */
export function useOpenNotification() {
  const router = useRouter();

  return async function openNotification(notification: {
    id: string;
    link: string | null;
    read_at: string | null;
  }) {
    if (!notification.read_at) await markNotificationRead(notification.id);
    if (notification.link) router.push(notification.link);
    router.refresh();
  };
}

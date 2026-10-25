import { NotificationBell } from "@/components/notifications/notification-bell";
import { getSession } from "@/lib/auth/session";
import { NOTIFICATION_SELECT, type NotificationItem } from "@/lib/notifications/queries";
import { createClient } from "@/lib/supabase/server";

/** Loads the bell's data on the server; render inside Suspense. */
export async function NotificationBellLoader() {
  const { profile } = await getSession();
  if (!profile?.is_active) return null;

  const supabase = await createClient();
  const [{ count }, { data }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
    supabase
      .from("notifications")
      .select(NOTIFICATION_SELECT)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <NotificationBell
      unreadCount={count ?? 0}
      items={(data ?? []) as NotificationItem[]}
    />
  );
}

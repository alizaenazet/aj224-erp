import "server-only";

import {
  PAGE_SIZE,
  likePattern,
  parseEnum,
  parsePage,
  parseText,
  type RawSearchParams,
} from "@/lib/list/params";
import { createClient } from "@/lib/supabase/server";

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
};

export const NOTIFICATION_SELECT = "id, title, body, link, created_at, read_at";

export const NOTIFICATION_STATUSES = ["unread", "read"] as const;

export function parseNotificationListParams(raw: RawSearchParams) {
  return {
    q: parseText(raw.q),
    status: parseEnum(raw.status, NOTIFICATION_STATUSES),
    page: parsePage(raw.page),
  };
}

export type NotificationListParams = ReturnType<typeof parseNotificationListParams>;

/** The signed-in user's notifications (RLS: own rows); `page: null` = all. */
export async function queryNotifications(
  params: NotificationListParams,
  { page }: { page: number | null },
) {
  const supabase = await createClient();
  let query = supabase.from("notifications").select(NOTIFICATION_SELECT, { count: "exact" });

  if (params.q) query = query.ilike("title", likePattern(params.q));
  if (params.status === "unread") query = query.is("read_at", null);
  if (params.status === "read") query = query.not("read_at", "is", null);

  query = query.order("created_at", { ascending: false }).order("id");
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  return { rows: (data ?? []) as NotificationItem[], count: count ?? 0, error };
}

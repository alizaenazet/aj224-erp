import "server-only";

import {
  CLIENT_KINDS,
  CLIENT_STATUSES,
  EMPTY_STATS,
  FOLLOW_UP_FILTERS,
  type ActivityRow,
  type ClientRow,
  type ClientStats,
  type ContactRow,
} from "@/lib/clients/labels";
import {
  PAGE_SIZE,
  isUuid,
  likePattern,
  parseEnum,
  parsePage,
  parseSort,
  parseText,
  type RawSearchParams,
} from "@/lib/list/params";
import { peopleNames } from "@/lib/people";
import { createClient } from "@/lib/supabase/server";

const CLIENT_SELECT = "id, name, kind, address, npwp, payment_term_days, notes, is_active";

/** client id → §11.1 stats from the client_tender_stats view. */
async function statsFor(clientIds: string[]) {
  const stats = new Map<string, ClientStats>();
  if (clientIds.length === 0) return stats;
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_tender_stats")
    .select("client_id, tender_count, won_count, lost_count, won_value, lost_value, win_rate_count, win_rate_value")
    .in("client_id", clientIds);
  for (const { client_id, ...row } of data ?? []) {
    if (client_id) stats.set(client_id, { ...EMPTY_STATS, ...(row as Partial<ClientStats>) });
  }
  return stats;
}

export function parseClientListParams(raw: RawSearchParams) {
  return {
    q: parseText(raw.q),
    kind: parseEnum(raw.kind, CLIENT_KINDS),
    status: parseEnum(raw.status, CLIENT_STATUSES),
    sort: parseSort(raw.sort, ["name"] as const, { column: "name", ascending: true }),
    page: parsePage(raw.page),
  };
}

export type ClientListParams = ReturnType<typeof parseClientListParams>;

/** Klien list with tender stats (MKT-01); `page: null` returns all rows (export). */
export async function queryClients(params: ClientListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("clients").select(CLIENT_SELECT, { count: "exact" });

  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`name.ilike.${pattern},npwp.ilike.${pattern}`);
  }
  if (params.kind) query = query.eq("kind", params.kind);
  if (params.status) query = query.eq("is_active", params.status === "active");

  query = query.order("name", { ascending: params.sort.ascending }).order("id");
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  const stats = await statsFor((data ?? []).map((row) => row.id));
  const rows = (data ?? []).map((row) => ({ ...row, stats: stats.get(row.id) ?? EMPTY_STATS })) as ClientRow[];
  return { rows, count: count ?? 0, error };
}

/** One client with stats, or null when missing or not visible. */
export async function getClient(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select(CLIENT_SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  const stats = await statsFor([id]);
  return { ...data, stats: stats.get(id) ?? EMPTY_STATS } as ClientRow;
}

export async function clientContacts(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_contacts")
    .select("id, client_id, name, position, phone, email, notes")
    .eq("client_id", clientId)
    .order("name");
  return (data ?? []) as ContactRow[];
}

const ACTIVITY_SELECT =
  "id, client_id, tender_id, activity_date, kind, notes, follow_up_date, follow_up_done_at, owner_id, client:clients(name), tender:tenders(name)";

type ActivityQueryRow = Omit<ActivityRow, "client_name" | "tender_name" | "owner_name"> & {
  client: { name: string } | null;
  tender: { name: string } | null;
};

async function withNames(rows: ActivityQueryRow[]): Promise<ActivityRow[]> {
  const names = await peopleNames();
  return rows.map(({ client, tender, ...row }) => ({
    ...row,
    client_name: client?.name ?? "—",
    tender_name: tender?.name ?? null,
    owner_name: row.owner_id ? (names.get(row.owner_id) ?? "Pengguna nonaktif") : null,
  }));
}

/** Activity log of a client or of one tender, newest first (MKT-02). */
export async function listActivities(filter: { clientId?: string; tenderId?: string }) {
  const supabase = await createClient();
  let query = supabase.from("client_activities").select(ACTIVITY_SELECT);
  if (filter.clientId) query = query.eq("client_id", filter.clientId);
  if (filter.tenderId) query = query.eq("tender_id", filter.tenderId);
  const { data } = await query
    .order("activity_date", { ascending: false })
    .order("created_at", { ascending: false });
  return withNames((data ?? []) as unknown as ActivityQueryRow[]);
}

export function parseFollowUpParams(raw: RawSearchParams) {
  return {
    q: parseText(raw.q),
    status: parseEnum(raw.status, FOLLOW_UP_FILTERS) ?? "open",
    page: parsePage(raw.page),
  };
}

/** Tindak Lanjut: follow-ups, due and overdue first (MKT-02). */
export async function queryFollowUps(
  params: ReturnType<typeof parseFollowUpParams>,
  { page }: { page: number | null },
) {
  const supabase = await createClient();
  let query = supabase
    .from("client_activities")
    .select(ACTIVITY_SELECT, { count: "exact" })
    .not("follow_up_date", "is", null);

  if (params.status === "open") query = query.is("follow_up_done_at", null);
  if (params.status === "done") query = query.not("follow_up_done_at", "is", null);
  if (params.q) query = query.ilike("notes", likePattern(params.q));

  query = query.order("follow_up_date", { ascending: params.status !== "done" }).order("id");
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  return { rows: await withNames((data ?? []) as unknown as ActivityQueryRow[]), count: count ?? 0, error };
}

/** Active clients for the tender form (plus the current one). */
export async function clientOptions({ includeId }: { includeId?: string } = {}) {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("id, name, is_active").order("name");
  return (data ?? [])
    .filter((client) => client.is_active || client.id === includeId)
    .map((client) => ({ value: client.id, label: client.name }));
}

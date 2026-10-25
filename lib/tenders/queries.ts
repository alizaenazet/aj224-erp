import "server-only";

import { EMPTY_STATS, type ClientStats } from "@/lib/clients/labels";
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
import { listPeople, peopleNames } from "@/lib/people";
import { createClient } from "@/lib/supabase/server";
import {
  ACTIVE_STATUSES,
  TENDER_FILTERS,
  type BidRevision,
  type Tender,
  type TenderRow,
} from "@/lib/tenders/labels";

const LIST_SELECT =
  "id, name, client_id, client:clients(name), location, voltage_kv, bid_deadline, bid_value, estimated_cost, win_probability, planned_margin, weighted_value, status, closed_date, pic_id";

export const TENDER_SORTS = ["weighted_value", "bid_deadline", "bid_value", "name"] as const;

export function parseTenderListParams(raw: RawSearchParams) {
  const client = parseText(raw.client);
  const voltage = Number(parseText(raw.voltage));
  return {
    q: parseText(raw.q),
    status: parseEnum(raw.status, TENDER_FILTERS) ?? "active",
    client: isUuid(client) ? client : null,
    voltage: [150, 275, 500].includes(voltage) ? voltage : null,
    // MKT-07: highest weighted value first by default.
    sort: parseSort(raw.sort, TENDER_SORTS, { column: "weighted_value", ascending: false }),
    page: parsePage(raw.page),
  };
}

export type TenderListParams = ReturnType<typeof parseTenderListParams>;

/** Adds PIC names and the client's historical win rate (MKT-07 reference). */
async function decorate<T extends { client_id: string; pic_id: string | null }>(rows: T[]) {
  const supabase = await createClient();
  const clientIds = [...new Set(rows.map((row) => row.client_id))];
  const [names, { data: stats }] = await Promise.all([
    peopleNames(),
    clientIds.length
      ? supabase
          .from("client_tender_stats")
          .select("client_id, tender_count, won_count, lost_count, won_value, lost_value, win_rate_count, win_rate_value")
          .in("client_id", clientIds)
      : Promise.resolve({ data: [] }),
  ]);
  const statsByClient = new Map(
    (stats ?? []).map(({ client_id, ...row }) => [client_id, { ...EMPTY_STATS, ...(row as Partial<ClientStats>) }]),
  );
  return rows.map((row) => ({
    ...row,
    pic_name: row.pic_id ? (names.get(row.pic_id) ?? "Pengguna nonaktif") : null,
    client_stats: statsByClient.get(row.client_id) ?? null,
  }));
}

/** Tender list; default = active tenders by weighted value (priority, MKT-07). */
export async function queryTenders(params: TenderListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("tenders").select(LIST_SELECT, { count: "exact" });

  if (params.q) {
    const pattern = likePattern(params.q);
    // Client names are matched through their ids (no or() across embedded tables).
    const { data: clients } = await supabase.from("clients").select("id").ilike("name", pattern);
    const clientIds = (clients ?? []).map((client) => client.id);
    query = query.or(
      [`name.ilike.${pattern}`, `location.ilike.${pattern}`, clientIds.length ? `client_id.in.(${clientIds.join(",")})` : null]
        .filter(Boolean)
        .join(","),
    );
  }
  if (params.status === "active") query = query.in("status", ACTIVE_STATUSES as string[]);
  else if (params.status !== "all") query = query.eq("status", params.status);
  if (params.client) query = query.eq("client_id", params.client);
  if (params.voltage) query = query.eq("voltage_kv", params.voltage);

  query = query
    .order(params.sort.column, { ascending: params.sort.ascending, nullsFirst: false })
    .order("name")
    .order("id");
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  const rows = (await decorate((data ?? []) as unknown as TenderRow[])) as TenderRow[];
  return { rows, count: count ?? 0, error };
}

/** One tender with its client, or null when missing or not visible. */
export async function getTender(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenders")
    .select(
      `${LIST_SELECT}, end_owner, length_kms, tower_count, scope, info_date, lost_reason, lost_note, winner_name, winner_price, notes`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [tender] = await decorate([data as unknown as Tender]);
  return tender as Tender;
}

/** Bid value history, newest first (MKT-05). */
export async function tenderRevisions(tenderId: string): Promise<BidRevision[]> {
  const supabase = await createClient();
  const [{ data }, names] = await Promise.all([
    supabase
      .from("tender_bid_revisions")
      .select("id, revised_at, old_value, new_value, note, revised_by")
      .eq("tender_id", tenderId)
      .order("revised_at", { ascending: false }),
    peopleNames(),
  ]);
  return (data ?? []).map(({ revised_by, ...row }) => ({
    ...row,
    revised_by_name: revised_by ? (names.get(revised_by) ?? "Pengguna nonaktif") : null,
  }));
}

/** Tenders of a client for the client page. */
export async function clientTenders(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenders")
    .select(LIST_SELECT)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as TenderRow[];
}

/** PIC options: active Marketing users. */
export async function picOptions() {
  const people = await listPeople(["marketing"]);
  return people.map((person) => ({ value: person.id, label: person.full_name }));
}

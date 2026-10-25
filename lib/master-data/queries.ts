import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PAGE_SIZE,
  likePattern,
  parseEnum,
  parsePage,
  parseText,
  type RawSearchParams,
} from "@/lib/list/params";
import type { MasterEntity } from "@/lib/master-data/entities";
import { createClient } from "@/lib/supabase/server";

export const MASTER_STATUSES = ["active", "inactive"] as const;

export function parseMasterListParams(entity: MasterEntity, raw: RawSearchParams) {
  return {
    q: parseText(raw.q),
    status: parseEnum(raw.status, MASTER_STATUSES),
    filter: entity.filter
      ? parseEnum(raw[entity.filter.param], entity.filter.options.map((option) => option.value))
      : null,
    page: parsePage(raw.page),
  };
}

export type MasterListParams = ReturnType<typeof parseMasterListParams>;

/** Rows of a master entity under RLS; `page: null` returns all (export). */
export async function queryMaster(
  entity: MasterEntity,
  params: MasterListParams,
  { page }: { page: number | null },
) {
  // Table names come from config, so use the untyped client surface.
  const supabase = (await createClient()) as unknown as SupabaseClient;
  let query = supabase.from(entity.table).select(entity.select, { count: "exact" });

  if (params.q && entity.searchColumns.length > 0) {
    const pattern = likePattern(params.q);
    query = query.or(entity.searchColumns.map((column) => `${column}.ilike.${pattern}`).join(","));
  }
  if (params.status) query = query.eq("is_active", params.status === "active");
  if (entity.filter && params.filter) query = query.eq(entity.filter.column, params.filter);

  for (const order of entity.orderBy) {
    query = query.order(order.column, { ascending: order.ascending });
  }
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  return {
    rows: (data ?? []) as unknown as Record<string, unknown>[],
    count: count ?? 0,
    error,
  };
}

/** Active certificate types for the position form's checklist. */
export async function certificateTypeOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificate_types")
    .select("id, name")
    .eq("is_active", true)
    .order("name");
  return (data ?? []).map((row) => ({ value: row.id, label: row.name }));
}

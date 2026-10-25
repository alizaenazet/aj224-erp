import "server-only";

import { AUDIT_REFS, AUDIT_TABLE_LABELS, PAY_AUDIT_TABLES, type AuditEntry } from "@/lib/audit/labels";
import type { AppRole } from "@/lib/auth/roles";
import {
  PAGE_SIZE,
  parseDateRange,
  parseEnum,
  parsePage,
  parseSort,
  type RawSearchParams,
} from "@/lib/list/params";
import { createClient } from "@/lib/supabase/server";

type AuditRow = Omit<AuditEntry, "actor_name"> & { actor_id: string | null };

export const AUDIT_SELECT =
  "id, table_name, record_id, action, actor_id, created_at, old_values, new_values, changed_fields, reason";

/**
 * Adds the actor's name (audit_log has no FK to profiles) and swaps
 * referenced ids for their names (AUDIT_REFS), e.g. position_id → "Helper".
 */
export async function enrichAuditRows(rows: AuditRow[]): Promise<AuditEntry[]> {
  const supabase = await createClient();
  const actorIds = [...new Set(rows.map((row) => row.actor_id).filter(Boolean))] as string[];

  const refIds = new Map<string, { column: string; ids: Set<string> }>();
  for (const row of rows) {
    for (const [field, ref] of Object.entries(AUDIT_REFS[row.table_name] ?? {})) {
      for (const values of [row.old_values, row.new_values]) {
        const id = values?.[field];
        if (typeof id !== "string") continue;
        const entry = refIds.get(ref.table) ?? { column: ref.column, ids: new Set<string>() };
        entry.ids.add(id);
        refIds.set(ref.table, entry);
      }
    }
  }

  const [actors, ...refs] = await Promise.all([
    actorIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", actorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    ...[...refIds].map(async ([table, { column, ids }]) => {
      const { data } = await supabase
        .from(table as "positions")
        .select(`id, ${column}`)
        .in("id", [...ids]);
      const names = new Map<string, string>();
      for (const item of (data ?? []) as unknown as Record<string, string>[]) {
        names.set(item.id, item[column]);
      }
      return [table, names] as const;
    }),
  ]);

  const actorNames = new Map((actors.data ?? []).map((profile) => [profile.id, profile.full_name]));
  const refNames = new Map(refs);

  function resolve(table: string, values: Record<string, unknown> | null) {
    const tableRefs = AUDIT_REFS[table];
    if (!values || !tableRefs) return values;
    const resolved = { ...values };
    for (const [field, ref] of Object.entries(tableRefs)) {
      const id = values[field];
      if (typeof id === "string") resolved[field] = refNames.get(ref.table)?.get(id) ?? "(tidak tersedia)";
    }
    return resolved;
  }

  return rows.map(({ actor_id, ...row }) => ({
    ...row,
    old_values: resolve(row.table_name, row.old_values),
    new_values: resolve(row.table_name, row.new_values),
    actor_name: actor_id ? (actorNames.get(actor_id) ?? "Pengguna terhapus") : null,
  }));
}

/** Tables the role may filter Log Audit by (pay tables: Direktur only). */
export function auditTablesForRole(role: AppRole) {
  return Object.keys(AUDIT_TABLE_LABELS).filter(
    (table) => role === "director" || !PAY_AUDIT_TABLES.includes(table),
  );
}

export function parseAuditListParams(raw: RawSearchParams, tables = Object.keys(AUDIT_TABLE_LABELS)) {
  return {
    table: parseEnum(raw.table, tables),
    range: parseDateRange(raw),
    sort: parseSort(raw.sort, ["created_at"] as const, { column: "created_at", ascending: false }),
    page: parsePage(raw.page),
  };
}

export type AuditListParams = ReturnType<typeof parseAuditListParams>;

/** Global audit log; `page: null` returns all rows (export). */
export async function queryAuditLog(params: AuditListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("audit_log").select(AUDIT_SELECT, { count: "exact" });

  if (params.table) query = query.eq("table_name", params.table);
  if (params.range.gte) query = query.gte("created_at", params.range.gte);
  if (params.range.lt) query = query.lt("created_at", params.range.lt);

  query = query
    .order("created_at", { ascending: params.sort.ascending })
    .order("id", { ascending: params.sort.ascending });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  const rows = error ? [] : await enrichAuditRows((data ?? []) as AuditRow[]);
  return { rows, count: count ?? 0, error };
}

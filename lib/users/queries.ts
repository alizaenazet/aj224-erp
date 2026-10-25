import "server-only";

import { APP_ROLES } from "@/lib/auth/roles";
import {
  PAGE_SIZE,
  likePattern,
  parseEnum,
  parsePage,
  parseSort,
  parseText,
  type RawSearchParams,
} from "@/lib/list/params";
import { createClient } from "@/lib/supabase/server";
import type { UserRow } from "@/lib/users/labels";

export { USER_STATUS_LABELS, type UserRow } from "@/lib/users/labels";

export const USER_STATUSES = ["active", "invited", "inactive"] as const;
export const USER_SORTS = ["full_name", "last_sign_in_at"] as const;

export function parseUserListParams(raw: RawSearchParams) {
  return {
    q: parseText(raw.q),
    role: parseEnum(raw.role, APP_ROLES),
    status: parseEnum(raw.status, USER_STATUSES),
    sort: parseSort(raw.sort, USER_SORTS, { column: "full_name", ascending: true }),
    page: parsePage(raw.page),
  };
}

export type UserListParams = ReturnType<typeof parseUserListParams>;

/** Users for Pengguna & Peran; `page: null` returns all rows (export). */
export async function queryUsers(params: UserListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.rpc("list_users", undefined, { count: "exact" });

  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`full_name.ilike.${pattern},email.ilike.${pattern}`);
  }
  if (params.role) query = query.eq("role", params.role);
  if (params.status) query = query.eq("status", params.status);

  query = query.order(params.sort.column, {
    ascending: params.sort.ascending,
    nullsFirst: false,
  });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  return { rows: (data ?? []) as UserRow[], count: count ?? 0, error };
}

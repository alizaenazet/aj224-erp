import "server-only";

import { cache } from "react";
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
import {
  PROJECT_STATUSES,
  type AddendumRow,
  type BudgetLine,
  type ProjectRow,
  type TermRow,
} from "@/lib/projects/labels";
import { peopleNames } from "@/lib/people";
import { createClient } from "@/lib/supabase/server";

const OVERVIEW_SELECT =
  "id, code, name, client_id, client_name, tender_id, end_owner, site, voltage_kv, length_kms, tower_count, start_date, target_finish_date, status, location_id, notes, contract_no, contract_date, ppn_applicable, maintenance_months, scope, base_contract_value, contract_value, finish_date, addendum_count, progress, planned_progress";

export const PROJECT_SORTS = ["code", "name", "start_date"] as const;

export function parseProjectListParams(raw: RawSearchParams) {
  const client = parseText(raw.client);
  return {
    q: parseText(raw.q),
    status: parseEnum(raw.status, PROJECT_STATUSES),
    client: isUuid(client) ? client : null,
    sort: parseSort(raw.sort, PROJECT_SORTS, { column: "code", ascending: false }),
    page: parsePage(raw.page),
  };
}

export type ProjectListParams = ReturnType<typeof parseProjectListParams>;

/** Daftar Proyek (PRJ-01); `page: null` returns all rows (export). */
export async function queryProjects(params: ProjectListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("project_overview").select(OVERVIEW_SELECT, { count: "exact" });

  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`code.ilike.${pattern},name.ilike.${pattern}`);
  }
  if (params.status) query = query.eq("status", params.status);
  if (params.client) query = query.eq("client_id", params.client);

  query = query.order(params.sort.column, { ascending: params.sort.ascending, nullsFirst: false }).order("id");
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  return { rows: (data ?? []) as ProjectRow[], count: count ?? 0, error };
}

/** One project (overview), or null when missing or not visible; shared by layout and tabs. */
export const getProject = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("project_overview").select(OVERVIEW_SELECT).eq("id", id).maybeSingle();
  return data as ProjectRow | null;
});

export async function projectAddenda(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_addenda")
    .select("id, addendum_no, addendum_date, new_value, new_finish_date, description, created_at")
    .eq("project_id", projectId)
    .order("addendum_date", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as AddendumRow[];
}

export async function projectTerms(projectId: string): Promise<TermRow[]> {
  const supabase = await createClient();
  const [{ data }, names] = await Promise.all([
    supabase
      .from("project_term_list")
      .select(
        "id, project_id, sort_order, name, kind, percent, amount, amount_value, condition_type, condition_progress, condition_date, status, ready_at, ready_by, notes",
      )
      .eq("project_id", projectId)
      .order("sort_order")
      .order("created_at"),
    peopleNames(),
  ]);
  return (data ?? []).map(({ ready_by, ...row }) => ({
    ...(row as Omit<TermRow, "ready_by_name">),
    ready_by_name: ready_by ? (names.get(ready_by) ?? null) : null,
  }));
}

/** RAB vs realization per project cost category (PRJ-04). */
export async function projectBudgetLines(projectId: string): Promise<BudgetLine[]> {
  const supabase = await createClient();
  const [{ data: categories }, { data: budgets }, { data: costs }] = await Promise.all([
    supabase
      .from("cost_categories")
      .select("id, code, name, is_active, sort_order")
      .eq("is_overhead", false)
      .order("sort_order"),
    supabase.from("project_budgets").select("cost_category_id, amount, notes").eq("project_id", projectId),
    supabase.from("project_category_costs").select("cost_category_id, amount").eq("project_id", projectId),
  ]);

  const budgetByCategory = new Map((budgets ?? []).map((row) => [row.cost_category_id, row]));
  const actualByCategory = new Map<string, number>();
  for (const row of costs ?? []) {
    if (!row.cost_category_id) continue;
    actualByCategory.set(row.cost_category_id, (actualByCategory.get(row.cost_category_id) ?? 0) + Number(row.amount ?? 0));
  }

  return (categories ?? [])
    .filter((category) => category.is_active || budgetByCategory.has(category.id) || actualByCategory.has(category.id))
    .map((category) => ({
      cost_category_id: category.id,
      code: category.code,
      name: category.name,
      budget: Number(budgetByCategory.get(category.id)?.amount ?? 0),
      actual: actualByCategory.get(category.id) ?? 0,
      notes: budgetByCategory.get(category.id)?.notes ?? null,
    }));
}

/** Total RAB and planned profit (§11.3 Laba Rencana) from project_budget_summary. */
export async function projectBudgetSummary(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_budget_summary")
    .select("contract_value, total_budget, planned_profit")
    .eq("project_id", projectId)
    .maybeSingle();
  return data;
}

/** Project created from a tender, if any (MKT-09 link). */
export async function projectForTender(tenderId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id, code").eq("tender_id", tenderId).maybeSingle();
  return data;
}

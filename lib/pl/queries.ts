import "server-only";

import { parseEnum, type RawSearchParams } from "@/lib/list/params";
import type { ChecklistItem, FinancialRow, MonthlyRow } from "@/lib/pl/labels";
import { PROJECT_STATUSES } from "@/lib/projects/labels";
import { createClient } from "@/lib/supabase/server";

const SELECT =
  "project_id, code, name, status, client_name, contract_value, progress, planned_progress, total_budget, cost, final_cost, revenue, billed_total, received_total, cash_in, supplier_paid, payroll_paid, expenses_paid, cash_out, field_cash_balance, work_done, unbilled, gross_profit, margin, planned_profit, projected_profit, cash_position, cost_used_pct, cost_index, schedule_deviation, health";

const NUMERIC = [
  "contract_value", "progress", "planned_progress", "total_budget", "cost", "final_cost", "revenue", "billed_total",
  "received_total", "cash_in", "supplier_paid", "payroll_paid", "expenses_paid", "cash_out", "field_cash_balance", "work_done", "unbilled", "gross_profit", "planned_profit",
  "projected_profit", "cash_position", "schedule_deviation",
] as const;

function toRow(row: Record<string, unknown>): FinancialRow {
  const result = { ...row } as Record<string, unknown>;
  for (const key of NUMERIC) result[key] = Number(row[key] ?? 0);
  for (const key of ["margin", "cost_used_pct", "cost_index"]) result[key] = row[key] === null ? null : Number(row[key]);
  return result as unknown as FinancialRow;
}

export function parsePlParams(raw: RawSearchParams) {
  const year = Number(typeof raw.year === "string" ? raw.year : NaN);
  return {
    status: parseEnum(raw.status, PROJECT_STATUSES),
    health: parseEnum(raw.health, ["normal", "warning", "critical"] as const),
    year: Number.isInteger(year) && year > 2000 && year < 2100 ? year : new Date().getFullYear(),
  };
}

export type PlParams = ReturnType<typeof parsePlParams>;

/** Laporan L/R per project (FIN-12). */
export async function queryFinancials(params: Pick<PlParams, "status" | "health">) {
  const supabase = await createClient();
  let query = supabase.from("project_financials").select(SELECT);
  if (params.status) query = query.eq("status", params.status);
  if (params.health) query = query.eq("health", params.health);
  const { data, error } = await query.order("code", { ascending: false });
  const rows = (data ?? []).map(toRow);
  return { rows, count: rows.length, error };
}

export async function projectFinancials(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("project_financials").select(SELECT).eq("project_id", projectId).maybeSingle();
  return data ? toRow(data) : null;
}

/** FIN-14 */
export async function monthlySummary(year: number): Promise<MonthlyRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("company_monthly_summary", { p_year: year });
  return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
    month: String(row.month),
    revenue: Number(row.revenue),
    project_cost: Number(row.project_cost),
    overhead: Number(row.overhead),
    profit: Number(row.profit),
    cash_in: Number(row.cash_in),
    cash_out: Number(row.cash_out),
  }));
}

/** PRJ-11 */
export async function closeChecklist(projectId: string): Promise<ChecklistItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("project_close_checklist", { p_project: projectId });
  return (data ?? []) as ChecklistItem[];
}

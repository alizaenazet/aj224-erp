import "server-only";

import { cache } from "react";
import { isUuid } from "@/lib/list/params";
import type { AdjustmentRow, PayslipRow, PeriodRow, RecapRow } from "@/lib/payroll/labels";
import { createClient } from "@/lib/supabase/server";

const SLIP_NUMBERS = [
  "daily_wage", "base_salary", "fixed_allowance", "meal_rate", "field_rate", "overtime_rate", "overtime_hours", "wage_amount",
  "base_amount", "absence_deduction", "meal_amount", "field_amount", "overtime_amount", "incentive_amount", "correction_amount",
  "gross", "bpjs_deduction", "pph21_deduction", "other_deduction", "kasbon_deduction", "total_deductions", "net",
] as const;

function toSlip(row: Record<string, unknown>): PayslipRow {
  const result = { ...row } as Record<string, unknown>;
  for (const key of SLIP_NUMBERS) result[key] = Number(row[key] ?? 0);
  return result as unknown as PayslipRow;
}

function toPeriod(row: Record<string, unknown>): PeriodRow {
  return {
    ...(row as unknown as PeriodRow),
    slip_count: Number(row.slip_count ?? 0),
    gross_total: Number(row.gross_total ?? 0),
    net_total: Number(row.net_total ?? 0),
    flagged: Number(row.flagged ?? 0),
  };
}

/** PAY-01 list with totals (summed in payroll_period_list). */
export async function listPeriods(): Promise<PeriodRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payroll_period_list")
    .select("*")
    .order("period_start", { ascending: false });
  return (data ?? []).map(toPeriod);
}

export const getPeriod = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("payroll_period_list").select("*").eq("id", id).maybeSingle();
  return data ? toPeriod(data) : null;
});

export async function periodSlips(periodId: string, projectId?: string | null): Promise<PayslipRow[]> {
  const supabase = await createClient();
  let query = supabase.from("payslip_list").select("*").eq("period_id", periodId);
  if (projectId) query = query.eq("main_project_id", projectId);
  const { data } = await query.order("full_name");
  return (data ?? []).map(toSlip);
}

export const getSlip = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("payslip_list").select("*").eq("id", id).maybeSingle();
  return data ? toSlip(data) : null;
});

export async function slipAdjustments(periodId: string, employeeId: string): Promise<AdjustmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payslip_adjustments")
    .select("id, employee_id, kind, amount, note")
    .eq("period_id", periodId)
    .eq("employee_id", employeeId)
    .order("created_at");
  return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function slipKasbon(slipId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("kasbon_installments").select("id, amount, kasbon:kasbons(kasbon_date, description)").eq("payslip_id", slipId);
  return (data ?? []).map((row) => ({ id: row.id, amount: Number(row.amount), label: row.kasbon?.description ?? "Kasbon", date: row.kasbon?.kasbon_date ?? null }));
}

/** PAY-09 */
export async function periodRecap(periodId: string): Promise<RecapRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("payroll_recap").select("project_id, project_code, employees, days, allocated").eq("period_id", periodId);
  return (data ?? []).map((row) => ({ ...(row as unknown as RecapRow), allocated: Number(row.allocated) })).sort((a, b) => a.project_code.localeCompare(b.project_code));
}

import "server-only";

import { cache } from "react";
import type { BillRow, ExpenseRow, FieldBalanceRow, KasbonRow, LedgerRow } from "@/lib/bills/labels";
import {
  PAGE_SIZE,
  isUuid,
  likePattern,
  parseDateRange,
  parseEnum,
  parsePage,
  parseText,
  type RawSearchParams,
} from "@/lib/list/params";
import { createClient } from "@/lib/supabase/server";

const num = (value: unknown) => Number(value ?? 0);
const NO_ID = "00000000-0000-0000-0000-000000000000";

// ---------------------------------------------------------------------------
// Supplier bills (FIN-06 … FIN-08)
// ---------------------------------------------------------------------------
const BILL_SELECT =
  "id, supplier_id, supplier_name, bill_no, bill_date, due_date, subtotal, ppn_amount, total, status, delivery_note_id, delivery_note_number, notes, is_opening, cancel_reason, paid, balance, days_overdue, due_group, projects";

function toBillRow(row: Record<string, unknown>): BillRow {
  return {
    ...(row as unknown as BillRow),
    subtotal: num(row.subtotal),
    ppn_amount: num(row.ppn_amount),
    total: num(row.total),
    paid: num(row.paid),
    balance: num(row.balance),
  };
}

export function parseBillListParams(raw: RawSearchParams) {
  const supplier = parseText(raw.supplier);
  return {
    q: parseText(raw.q),
    status: parseEnum(raw.status, ["unpaid", "partial", "paid", "cancelled"] as const),
    due: parseEnum(raw.due, ["overdue", "this_week", "next_week", "later"] as const),
    supplier: isUuid(supplier) ? supplier : null,
    range: parseDateRange(raw),
    page: parsePage(raw.page),
  };
}

export type BillListParams = ReturnType<typeof parseBillListParams>;

export async function queryBills(params: BillListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("supplier_bill_list").select(BILL_SELECT, { count: "exact" });
  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`bill_no.ilike.${pattern},supplier_name.ilike.${pattern},notes.ilike.${pattern}`);
  }
  if (params.status) query = query.eq("status", params.status);
  if (params.due) query = query.eq("due_group", params.due);
  if (params.supplier) query = query.eq("supplier_id", params.supplier);
  if (params.range.from) query = query.gte("bill_date", params.range.from);
  if (params.range.to) query = query.lte("bill_date", params.range.to);
  query = query.order("due_date").order("bill_date", { ascending: false });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await query;
  return { rows: (data ?? []).map(toBillRow), count: count ?? 0, error };
}

export const getBill = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("supplier_bill_list").select(BILL_SELECT).eq("id", id).maybeSingle();
  return data ? toBillRow(data) : null;
});

export async function billLines(billId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_bill_lines")
    .select("id, description, amount, project_id, cost_category_id, project:projects(code), category:cost_categories(name)")
    .eq("bill_id", billId)
    .order("sort_order");
  return (data ?? []).map((row) => ({
    id: row.id,
    description: row.description,
    amount: num(row.amount),
    project_id: row.project_id,
    project_code: row.project?.code ?? null,
    cost_category_id: row.cost_category_id,
    category_name: row.category?.name ?? "—",
  }));
}

export async function billPayments(billId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_payments")
    .select("id, payment_date, amount, method, notes, is_opening, status, cancel_reason, bank:company_bank_accounts(bank_name, account_number)")
    .eq("bill_id", billId)
    .order("payment_date");
  return (data ?? []).map((row) => ({
    id: row.id,
    payment_date: row.payment_date,
    amount: num(row.amount),
    method: row.method,
    notes: row.notes,
    is_opening: row.is_opening,
    status: row.status,
    cancel_reason: row.cancel_reason,
    bank_label: row.bank ? `${row.bank.bank_name} ${row.bank.account_number}` : null,
  }));
}

export async function queryPayableAging() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payable_aging")
    .select("supplier_id, supplier_name, current_amount, d1_30, d31_60, d61_90, d90_plus, total_balance")
    .order("supplier_name");
  const rows = (data ?? []).map((row) => ({
    supplier_id: row.supplier_id as string,
    supplier_name: row.supplier_name as string,
    current_amount: num(row.current_amount),
    d1_30: num(row.d1_30),
    d31_60: num(row.d31_60),
    d61_90: num(row.d61_90),
    d90_plus: num(row.d90_plus),
    total_balance: num(row.total_balance),
  }));
  return { rows, count: rows.length, error };
}

/** Choices shared by the bill, expense and field cash forms. */
export async function costFormOptions() {
  const supabase = await createClient();
  const [{ data: suppliers }, { data: projects }, { data: categories }, { data: banks }, { data: notes }] = await Promise.all([
    supabase.from("suppliers").select("id, name").eq("is_active", true).order("name"),
    supabase.from("projects").select("id, code, name").neq("status", "closed").order("code", { ascending: false }),
    supabase.from("cost_categories").select("id, name, is_overhead").eq("is_active", true).order("sort_order"),
    supabase.from("company_bank_accounts").select("id, bank_name, account_number, is_default").eq("is_active", true),
    supabase.from("delivery_notes").select("id, number").neq("status", "cancelled").order("note_date", { ascending: false }).limit(200),
  ]);
  return {
    suppliers: (suppliers ?? []).map((row) => ({ value: row.id, label: row.name })),
    projects: (projects ?? []).map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` })),
    categories: (categories ?? []).map((row) => ({ value: row.id, label: row.name, isOverhead: row.is_overhead })),
    banks: (banks ?? []).map((row) => ({ value: row.id, label: `${row.bank_name} ${row.account_number}`, isDefault: row.is_default })),
    deliveryNotes: (notes ?? []).map((row) => ({ value: row.id, label: row.number })),
  };
}

// ---------------------------------------------------------------------------
// Direct expenses (FIN-09)
// ---------------------------------------------------------------------------
const EXPENSE_SELECT =
  "id, expense_date, project_id, cost_category_id, amount, payee, method, description, no_receipt, no_receipt_note, is_opening, status, cancel_reason, project:projects(code), category:cost_categories(name)";

type RawExpense = Omit<ExpenseRow, "project_code" | "category_name"> & {
  project: { code: string } | null;
  category: { name: string } | null;
};

function toExpenseRow(row: RawExpense): ExpenseRow {
  const { project, category, ...rest } = row;
  return { ...rest, amount: num(rest.amount), project_code: project?.code ?? null, category_name: category?.name ?? "—" };
}

export function parseExpenseListParams(raw: RawSearchParams) {
  const project = parseText(raw.project);
  const category = parseText(raw.category);
  return {
    q: parseText(raw.q),
    project: project === "office" ? "office" : isUuid(project) ? project : null,
    category: isUuid(category) ? category : null,
    status: parseEnum(raw.status, ["active", "cancelled"] as const),
    range: parseDateRange(raw),
    page: parsePage(raw.page),
  };
}

export type ExpenseListParams = ReturnType<typeof parseExpenseListParams>;

export async function queryExpenses(params: ExpenseListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("expenses").select(EXPENSE_SELECT, { count: "exact" });
  if (params.q) query = query.or(`description.ilike.${likePattern(params.q)},payee.ilike.${likePattern(params.q)}`);
  if (params.project === "office") query = query.is("project_id", null);
  else if (params.project) query = query.eq("project_id", params.project);
  if (params.category) query = query.eq("cost_category_id", params.category);
  if (params.status) query = query.eq("status", params.status);
  if (params.range.from) query = query.gte("expense_date", params.range.from);
  if (params.range.to) query = query.lte("expense_date", params.range.to);
  query = query.order("expense_date", { ascending: false }).order("created_at", { ascending: false });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await query;
  return { rows: ((data ?? []) as unknown as RawExpense[]).map(toExpenseRow), count: count ?? 0, error };
}

export const getExpense = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("expenses").select(EXPENSE_SELECT).eq("id", id).maybeSingle();
  return data ? toExpenseRow(data as unknown as RawExpense) : null;
});

// ---------------------------------------------------------------------------
// Field cash (FIN-10)
// ---------------------------------------------------------------------------
const BALANCE_SELECT = "project_id, project_code, project_name, topups, returns, approved, pending, pending_count, balance";

function toBalance(row: Record<string, unknown>): FieldBalanceRow {
  return {
    ...(row as unknown as FieldBalanceRow),
    topups: num(row.topups),
    returns: num(row.returns),
    approved: num(row.approved),
    pending: num(row.pending),
    balance: num(row.balance),
  };
}

export async function fieldCashBalances() {
  const supabase = await createClient();
  const { data } = await supabase.from("field_cash_balances").select(BALANCE_SELECT).order("project_code");
  return (data ?? []).map(toBalance);
}

export async function fieldCashBalance(projectId: string) {
  if (!isUuid(projectId)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("field_cash_balances").select(BALANCE_SELECT).eq("project_id", projectId).maybeSingle();
  return data ? toBalance(data) : null;
}

export async function fieldCashLedger(projectId: string): Promise<LedgerRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("field_cash_ledger")
    .select("id, kind, entry_date, amount, description, category_name, employee_name, status, reject_reason, no_receipt")
    .eq("project_id", projectId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id as string,
    kind: row.kind as string,
    entry_date: row.entry_date as string,
    amount: num(row.amount),
    description: row.description,
    category_name: row.category_name,
    employee_name: row.employee_name,
    status: row.status as string,
    reject_reason: row.reject_reason,
    no_receipt: Boolean(row.no_receipt),
  }));
}

export const getFieldExpense = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("field_cash_expenses")
    .select("*, project:projects(code, name), category:cost_categories(name), employee:employees(full_name)")
    .eq("id", id)
    .maybeSingle();
  return data;
});

/** Projects a user may record field spending for (Lapangan: own projects). */
export async function fieldCashFormOptions(role: string) {
  const supabase = await createClient();
  let projectQuery = supabase.from("projects").select("id, code, name").neq("status", "closed");
  if (role === "field") {
    const { data } = await supabase.rpc("user_project_ids");
    const ids = ((data ?? []) as unknown as string[]).map(String);
    projectQuery = projectQuery.in("id", ids.length ? ids : [NO_ID]);
  }
  const [{ data: projects }, { data: categories }, { data: employees }] = await Promise.all([
    projectQuery.order("code", { ascending: false }),
    supabase.from("cost_categories").select("id, name").eq("is_active", true).eq("is_overhead", false).order("sort_order"),
    supabase.from("employees").select("id, employee_no, full_name").eq("is_active", true).order("full_name"),
  ]);
  return {
    projects: (projects ?? []).map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` })),
    categories: (categories ?? []).map((row) => ({ value: row.id, label: row.name })),
    employees: (employees ?? []).map((row) => ({ value: row.id, label: row.full_name, description: row.employee_no })),
  };
}

// ---------------------------------------------------------------------------
// Kasbon (PAY-05)
// ---------------------------------------------------------------------------
export function parseKasbonListParams(raw: RawSearchParams) {
  return {
    q: parseText(raw.q),
    status: parseEnum(raw.status, ["active", "cancelled"] as const),
    open: parseText(raw.open) === "1",
    page: parsePage(raw.page),
  };
}

export type KasbonListParams = ReturnType<typeof parseKasbonListParams>;

export async function queryKasbons(params: KasbonListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase
    .from("kasbon_balances")
    .select("id, employee_id, employee_no, full_name, kasbon_date, amount, installment_amount, description, source, status, cancel_reason, deducted, balance", {
      count: "exact",
    });
  if (params.q) query = query.or(`full_name.ilike.${likePattern(params.q)},employee_no.ilike.${likePattern(params.q)}`);
  if (params.status) query = query.eq("status", params.status);
  if (params.open) query = query.gt("balance", 0);
  query = query.order("kasbon_date", { ascending: false });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await query;
  const rows: KasbonRow[] = (data ?? []).map((row) => ({
    ...(row as unknown as KasbonRow),
    amount: num(row.amount),
    installment_amount: num(row.installment_amount),
    deducted: num(row.deducted),
    balance: num(row.balance),
  }));
  return { rows, count: count ?? 0, error };
}

export async function employeeOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("employees").select("id, employee_no, full_name").eq("is_active", true).order("full_name");
  return (data ?? []).map((row) => ({ value: row.id, label: row.full_name, description: row.employee_no }));
}

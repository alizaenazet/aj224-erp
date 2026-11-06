import "server-only";

import { cache } from "react";
import { INVOICE_STATUSES, type AgingRow, type InvoicePayment, type InvoiceRow } from "@/lib/invoices/labels";
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

const INVOICE_SELECT =
  "id, number, project_id, project_code, project_name, client_id, client_name, term_id, term_name, kind, description, invoice_date, due_date, gross_amount, dp_deduction, retention_deduction, other_deduction, other_deduction_note, dpp, ppn_rate, ppn_amount, total, status, notes, issued_at, cancel_reason, created_at, received, pph, balance, days_overdue, aging_bucket";

const MONEY = ["gross_amount", "dp_deduction", "retention_deduction", "other_deduction", "dpp", "ppn_rate", "ppn_amount", "total", "received", "pph", "balance"] as const;

function toInvoiceRow(row: Record<string, unknown>): InvoiceRow {
  const result = { ...row } as Record<string, unknown>;
  for (const key of MONEY) result[key] = Number(row[key] ?? 0);
  return result as unknown as InvoiceRow;
}

export function parseInvoiceListParams(raw: RawSearchParams) {
  const project = parseText(raw.project);
  const client = parseText(raw.client);
  return {
    q: parseText(raw.q),
    status: parseEnum(raw.status, INVOICE_STATUSES),
    project: isUuid(project) ? project : null,
    client: isUuid(client) ? client : null,
    overdue: parseText(raw.overdue) === "1",
    open: parseText(raw.open) === "1",
    range: parseDateRange(raw),
    page: parsePage(raw.page),
  };
}

export type InvoiceListParams = ReturnType<typeof parseInvoiceListParams>;

/** Invoice & Piutang (FIN-01 … FIN-04); `page: null` for export. */
export async function queryInvoices(params: InvoiceListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("invoice_list").select(INVOICE_SELECT, { count: "exact" });
  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`number.ilike.${pattern},description.ilike.${pattern},client_name.ilike.${pattern}`);
  }
  if (params.status) query = query.eq("status", params.status);
  if (params.project) query = query.eq("project_id", params.project);
  if (params.client) query = query.eq("client_id", params.client);
  if (params.overdue) query = query.gt("days_overdue", 0);
  if (params.open) query = query.in("status", ["issued", "partial"]);
  if (params.range.from) query = query.gte("invoice_date", params.range.from);
  if (params.range.to) query = query.lte("invoice_date", params.range.to);
  query = query.order("invoice_date", { ascending: false }).order("created_at", { ascending: false });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await query;
  return { rows: (data ?? []).map(toInvoiceRow), count: count ?? 0, error };
}

export const getInvoice = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("invoice_list").select(INVOICE_SELECT).eq("id", id).maybeSingle();
  return data ? toInvoiceRow(data) : null;
});

export async function invoicePayments(invoiceId: string): Promise<InvoicePayment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoice_payments")
    .select("id, payment_date, amount_received, pph_amount, pph_slip_no, notes, is_opening, status, cancel_reason, bank:company_bank_accounts(bank_name, account_number)")
    .eq("invoice_id", invoiceId)
    .order("payment_date")
    .order("created_at");
  return (data ?? []).map((row) => ({
    id: row.id,
    payment_date: row.payment_date,
    amount_received: Number(row.amount_received),
    pph_amount: Number(row.pph_amount),
    pph_slip_no: row.pph_slip_no,
    bank_label: row.bank ? `${row.bank.bank_name} ${row.bank.account_number}` : null,
    notes: row.notes,
    is_opening: row.is_opening,
    status: row.status as InvoicePayment["status"],
    cancel_reason: row.cancel_reason,
  }));
}

/** Aging per client and project (FIN-05). */
export async function queryAging(params: { project: string | null; client: string | null }) {
  const supabase = await createClient();
  let query = supabase
    .from("receivable_aging")
    .select("client_id, client_name, project_id, project_code, project_name, current_amount, d1_30, d31_60, d61_90, d90_plus, total_balance");
  if (params.project) query = query.eq("project_id", params.project);
  if (params.client) query = query.eq("client_id", params.client);
  const { data, error } = await query.order("client_name").order("project_code");
  const rows: AgingRow[] = (data ?? []).map((row) => ({
    client_id: row.client_id,
    client_name: row.client_name,
    project_id: row.project_id as string,
    project_code: row.project_code as string,
    project_name: row.project_name as string,
    current_amount: Number(row.current_amount ?? 0),
    d1_30: Number(row.d1_30 ?? 0),
    d31_60: Number(row.d31_60 ?? 0),
    d61_90: Number(row.d61_90 ?? 0),
    d90_plus: Number(row.d90_plus ?? 0),
    total_balance: Number(row.total_balance ?? 0),
  }));
  return { rows, count: rows.length, error };
}

/** Invoices per termin of a project (Kontrak & Termin links). */
export async function termInvoices(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, number, term_id, status")
    .eq("project_id", projectId)
    .not("term_id", "is", null)
    .neq("status", "cancelled");
  return Object.fromEntries((data ?? []).map((row) => [row.term_id as string, { id: row.id, label: row.number ?? "Draft" }]));
}

/** Choices for the invoice and payment forms. */
export async function invoiceFormOptions() {
  const supabase = await createClient();
  const [{ data: projects }, { data: terms }, { data: banks }, { data: clients }, { data: params }, { data: company }, { data: contracts }] = await Promise.all([
    supabase.from("projects").select("id, code, name").neq("status", "closed").order("code", { ascending: false }),
    supabase.from("project_term_list").select("id, project_id, name, amount_value, status").eq("status", "ready").order("sort_order"),
    supabase.from("company_bank_accounts").select("id, bank_name, account_number, is_default").eq("is_active", true).order("bank_name"),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("system_parameters").select("ppn_rate").maybeSingle(),
    supabase.from("company_profile").select("is_pkp").maybeSingle(),
    supabase.from("project_contracts").select("project_id, ppn_applicable"),
  ]);
  const rate = Number(params?.ppn_rate ?? 11);
  // Same rule as save_invoice: PPN only when the company is PKP and the contract has PPN.
  const ppnByProject = Object.fromEntries(
    (contracts ?? []).map((row) => [row.project_id, company?.is_pkp && row.ppn_applicable ? rate : 0]),
  ) as Record<string, number>;
  return {
    projects: (projects ?? []).map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` })),
    terms: (terms ?? []).map((row) => ({
      value: row.id as string,
      project_id: row.project_id as string,
      label: row.name as string,
      amount: Number(row.amount_value ?? 0),
    })),
    banks: (banks ?? []).map((row) => ({ value: row.id, label: `${row.bank_name} ${row.account_number}`, isDefault: row.is_default })),
    clients: (clients ?? []).map((row) => ({ value: row.id, label: row.name })),
    ppnByProject,
  };
}

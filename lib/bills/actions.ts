"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import {
  billPaymentSchema,
  billSchema,
  expenseSchema,
  fieldExpenseSchema,
  kasbonSchema,
  movementSchema,
  type BillInput,
  type BillPaymentInput,
  type ExpenseInput,
  type FieldExpenseInput,
  type KasbonInput,
  type MovementInput,
} from "@/lib/bills/schema";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid("Data tidak valid.");
const reasonSchema = z.string().trim().min(1, "Isi alasan.").max(300);

function refresh() {
  revalidatePath("/finance", "layout");
  revalidatePath("/hr/kasbon", "layout");
  revalidatePath("/projects/[id]", "layout");
  revalidatePath("/");
}

type Rpc = (supabase: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ data: unknown; error: Parameters<typeof dbErrorMessage>[0] | null }>;

/** Runs one RPC for the allowed roles and maps the result (all change D writes). */
async function run<T = undefined>(roles: ("finance" | "hcm" | "field")[], call: Rpc, message: string): Promise<ActionResult<T>> {
  const auth = await assertRole(roles);
  if (!auth.ok) return auth;
  const supabase = await createClient();
  const { data, error } = await call(supabase);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  refresh();
  return { ok: true, message, data: (typeof data === "string" ? { id: data } : undefined) as T };
}

function invalid(error: z.ZodError): ActionResult<never> {
  return { ok: false, error: firstZodError(error) };
}

/** FIN-06: create (id null) or edit a bill with its lines. */
export async function saveBill(input: { id: string | null; values: BillInput }) {
  const parsed = billSchema.safeParse(input.values);
  if (!parsed.success) return invalid(parsed.error);
  const { lines, ...bill } = parsed.data;
  // null id = new bill (the generated types do not allow null).
  return run<{ id: string }>(["finance"], (s) => s.rpc("save_supplier_bill", { p_id: input.id as string, p_bill: bill, p_lines: lines }), "Tagihan disimpan.");
}

export async function cancelBill(input: { id: string; reason: string }) {
  const reason = reasonSchema.safeParse(input.reason);
  if (!reason.success || !idSchema.safeParse(input.id).success) return { ok: false as const, error: "Isi alasan pembatalan." };
  return run(["finance"], (s) => s.rpc("cancel_supplier_bill", { p_bill: input.id, p_reason: reason.data }), "Tagihan dibatalkan.");
}

/** FIN-07 */
export async function recordBillPayment(input: { billId: string; values: BillPaymentInput }) {
  const parsed = billPaymentSchema.safeParse(input.values);
  if (!parsed.success) return invalid(parsed.error);
  return run(["finance"], (s) => s.rpc("record_supplier_payment", { p_bill: input.billId, p_values: parsed.data }), "Pembayaran dicatat.");
}

export async function cancelBillPayment(input: { id: string; reason: string }) {
  const reason = reasonSchema.safeParse(input.reason);
  if (!reason.success) return invalid(reason.error);
  return run(["finance"], (s) => s.rpc("cancel_supplier_payment", { p_payment: input.id, p_reason: reason.data }), "Pembayaran dibatalkan.");
}

/** FIN-09 */
export async function saveExpense(input: { id: string | null; values: ExpenseInput }) {
  const parsed = expenseSchema.safeParse(input.values);
  if (!parsed.success) return invalid(parsed.error);
  return run<{ id: string }>(["finance"], (s) => s.rpc("save_expense", { p_id: input.id as string, p_values: parsed.data }), "Pengeluaran disimpan.");
}

export async function cancelExpense(input: { id: string; reason: string }) {
  const reason = reasonSchema.safeParse(input.reason);
  if (!reason.success) return invalid(reason.error);
  return run(["finance"], (s) => s.rpc("cancel_expense", { p_id: input.id, p_reason: reason.data }), "Pengeluaran dibatalkan.");
}

/** FIN-10 top-up / return */
export async function recordMovement(values: MovementInput) {
  const parsed = movementSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  return run(
    ["finance"],
    (s) => s.rpc("record_field_cash_movement", { p_values: parsed.data }),
    parsed.data.kind === "topup" ? "Top-up kas lapangan dicatat." : "Pengembalian dana dicatat.",
  );
}

export async function cancelMovement(input: { id: string; reason: string }) {
  const reason = reasonSchema.safeParse(input.reason);
  if (!reason.success) return invalid(reason.error);
  return run(["finance"], (s) => s.rpc("cancel_field_cash_movement", { p_id: input.id, p_reason: reason.data }), "Dibatalkan.");
}

/** FIN-10 spending (Lapangan for their project, Finance). */
export async function recordFieldExpense(values: FieldExpenseInput) {
  const parsed = fieldExpenseSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  return run<{ id: string }>(
    ["finance", "field"],
    (s) => s.rpc("record_field_cash_expense", { p_values: parsed.data }),
    "Pengeluaran dicatat dan menunggu verifikasi Finance.",
  );
}

export async function verifyFieldExpense(input: { id: string; approve: boolean; reason: string }) {
  if (!input.approve && !input.reason.trim()) return { ok: false as const, error: "Isi alasan penolakan." };
  return run(
    ["finance"],
    (s) => s.rpc("verify_field_cash_expense", { p_id: input.id, p_approve: input.approve, p_reason: input.reason }),
    input.approve ? "Pengeluaran disetujui." : "Pengeluaran ditolak.",
  );
}

export async function cancelFieldExpense(input: { id: string; reason: string }) {
  const reason = reasonSchema.safeParse(input.reason);
  if (!reason.success) return invalid(reason.error);
  return run(["finance"], (s) => s.rpc("cancel_field_cash_expense", { p_id: input.id, p_reason: reason.data }), "Pengeluaran dibatalkan.");
}

/** PAY-05 */
export async function saveKasbon(values: KasbonInput) {
  const parsed = kasbonSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  return run(["finance", "hcm"], (s) => s.rpc("save_kasbon", { p_values: parsed.data }), "Kasbon dicatat.");
}

export async function cancelKasbon(input: { id: string; reason: string }) {
  const reason = reasonSchema.safeParse(input.reason);
  if (!reason.success) return invalid(reason.error);
  return run(["finance", "hcm"], (s) => s.rpc("cancel_kasbon", { p_id: input.id, p_reason: reason.data }), "Kasbon dibatalkan.");
}

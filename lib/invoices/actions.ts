"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import { invoiceSchema, paymentSchema, type InvoiceInput, type PaymentInput } from "@/lib/invoices/schema";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid("Data tidak valid.");
const reasonSchema = z.string().trim().min(1, "Isi alasan pembatalan.").max(300);

function revalidateInvoices() {
  revalidatePath("/finance", "layout");
  revalidatePath("/projects/[id]", "layout");
  revalidatePath("/");
}

/** FIN-01/FIN-02: create (id null) or edit a Draft. */
export async function saveInvoice(input: { id: string | null; values: InvoiceInput }): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["finance"]);
  if (!auth.ok) return auth;
  if (input.id && !idSchema.safeParse(input.id).success) return { ok: false, error: "Invoice tidak valid." };
  const parsed = invoiceSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const supabase = await createClient();
  // null = new invoice (the generated types do not allow null).
  const { data, error } = await supabase.rpc("save_invoice", { p_id: input.id as string, p_values: parsed.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateInvoices();
  return { ok: true, message: "Draft invoice disimpan.", data: { id: data as string } };
}

export async function issueInvoice(input: { id: string }): Promise<ActionResult> {
  const auth = await assertRole(["finance"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: "Invoice tidak valid." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("issue_invoice", { p_id: id.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateInvoices();
  return { ok: true, message: `Invoice diterbitkan: ${data as string}.` };
}

export async function cancelInvoice(input: { id: string; reason: string }): Promise<ActionResult> {
  const auth = await assertRole(["finance"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  const reason = reasonSchema.safeParse(input.reason);
  if (!id.success) return { ok: false, error: "Invoice tidak valid." };
  if (!reason.success) return { ok: false, error: firstZodError(reason.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_invoice", { p_id: id.data, p_reason: reason.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateInvoices();
  return { ok: true, message: "Invoice dibatalkan." };
}

/** FIN-03 */
export async function recordPayment(input: { invoiceId: string; values: PaymentInput }): Promise<ActionResult> {
  const auth = await assertRole(["finance"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.invoiceId);
  if (!id.success) return { ok: false, error: "Invoice tidak valid." };
  const parsed = paymentSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_invoice_payment", { p_invoice: id.data, p_values: parsed.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateInvoices();
  return { ok: true, message: "Pembayaran dicatat." };
}

export async function cancelPayment(input: { id: string; reason: string }): Promise<ActionResult> {
  const auth = await assertRole(["finance"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  const reason = reasonSchema.safeParse(input.reason);
  if (!id.success) return { ok: false, error: "Pembayaran tidak valid." };
  if (!reason.success) return { ok: false, error: firstZodError(reason.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_invoice_payment", { p_payment: id.data, p_reason: reason.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateInvoices();
  return { ok: true, message: "Pembayaran dibatalkan." };
}

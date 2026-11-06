"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import {
  materialSchema,
  opnameSchema,
  openingSchema,
  transactionSchema,
  type MaterialInput,
  type OpeningInput,
  type OpnameInput,
  type TransactionInput,
} from "@/lib/materials/schema";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid("Data tidak valid.");

function revalidateMaterials() {
  revalidatePath("/operations/materials", "layout");
  revalidatePath("/operations/material-transactions", "layout");
  revalidatePath("/operations/delivery-notes", "layout");
  revalidatePath("/projects/[id]", "layout");
  revalidatePath("/");
}

/** MAT-01: a new material with optional opening stock. */
export async function createMaterial(input: { material: MaterialInput; opening: OpeningInput }): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const material = materialSchema.safeParse(input.material);
  if (!material.success) return { ok: false, error: firstZodError(material.error) };
  const opening = openingSchema.safeParse(input.opening);
  if (!opening.success) return { ok: false, error: firstZodError(opening.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_material", {
    p_material: material.data,
    p_location: opening.data.location_id ?? undefined,
    p_quantity: opening.data.quantity ?? undefined,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Kode material sudah dipakai." };
    return { ok: false, error: dbErrorMessage(error) };
  }
  revalidateMaterials();
  return { ok: true, message: "Material ditambahkan.", data: { id: data as string } };
}

export async function updateMaterial(input: { id: string; values: MaterialInput; isActive: boolean }): Promise<ActionResult> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: "Material tidak valid." };
  const parsed = materialSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  // Code and unit are fixed after creation (column grants).
  const values = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .update({
      name: values.name,
      category_id: values.category_id,
      ownership: values.ownership,
      min_stock: values.min_stock,
      notes: values.notes,
      is_active: input.isActive,
    })
    .eq("id", id.data)
    .select("id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Material tidak ditemukan." };
  revalidateMaterials();
  return { ok: true, message: "Data material disimpan." };
}

/** MAT-02, MAT-03 and returns; Lapangan only at their project (checked in SQL). */
export async function recordTransaction(input: TransactionInput): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["operations", "field"]);
  if (!auth.ok) return auth;
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const { lines, ...txn } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_material_transaction", { p_txn: txn, p_lines: lines });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateMaterials();
  const message = { receipt: "Penerimaan dicatat.", usage: "Pemakaian dicatat.", return: "Pengembalian dicatat." }[txn.kind];
  return { ok: true, message, data: { id: data as string } };
}

/** MAT-05 */
export async function recordOpname(input: OpnameInput): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const parsed = opnameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_stock_opname", {
    p_location: parsed.data.location_id,
    p_date: parsed.data.txn_date,
    p_reason: parsed.data.reason,
    p_lines: parsed.data.lines,
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateMaterials();
  return { ok: true, message: "Stok opname disimpan.", data: { id: data as string } };
}

export async function cancelTransaction(input: { id: string; reason: string }): Promise<ActionResult> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: "Transaksi tidak valid." };
  const reason = z.string().trim().min(1, "Isi alasan pembatalan.").max(300).safeParse(input.reason);
  if (!reason.success) return { ok: false, error: firstZodError(reason.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_material_transaction", { p_txn: id.data, p_reason: reason.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateMaterials();
  return { ok: true, message: "Transaksi dibatalkan; stok dikembalikan." };
}

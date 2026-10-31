"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import {
  adjustmentSchema,
  conditionChangeSchema,
  deliveryNoteSchema,
  openingSchema,
  receiptSchema,
  toolSchema,
  type AdjustmentInput,
  type ConditionChangeInput,
  type DeliveryNoteInput,
  type OpeningInput,
  type ReceiptInput,
  type ToolInput,
} from "@/lib/equipment/schema";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid("Data tidak valid.");

function revalidateEquipment() {
  revalidatePath("/operations/tools", "layout");
  revalidatePath("/operations/delivery-notes", "layout");
  revalidatePath("/projects/[id]", "layout");
  revalidatePath("/");
}

/** ALT-01: a new tool with its opening stock. */
export async function createTool(input: { tool: ToolInput; opening: OpeningInput }): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const tool = toolSchema.safeParse(input.tool);
  if (!tool.success) return { ok: false, error: firstZodError(tool.error) };
  const opening = openingSchema.safeParse(input.opening);
  if (!opening.success) return { ok: false, error: firstZodError(opening.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_tool", {
    p_tool: tool.data,
    p_location: opening.data.location_id,
    p_condition: opening.data.condition,
    p_quantity: opening.data.quantity,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Kode atau no. seri alat sudah dipakai." };
    return { ok: false, error: dbErrorMessage(error) };
  }
  revalidateEquipment();
  return { ok: true, message: "Alat ditambahkan.", data: { id: data as string } };
}

export async function updateTool(input: { id: string; values: ToolInput }): Promise<ActionResult> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: "Alat tidak valid." };
  const parsed = toolSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  // Code and tracking are fixed after creation (column grants).
  const values = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tools")
    .update({
      name: values.name,
      category_id: values.category_id,
      serial_no: values.serial_no,
      ownership: values.ownership,
      notes: values.notes,
      supplier_id: values.ownership === "rented" ? values.supplier_id : null,
      rental_rate: values.ownership === "rented" ? values.rental_rate : null,
      rental_period: values.ownership === "rented" ? values.rental_period : null,
    })
    .eq("id", id.data)
    .select("id");
  if (error) {
    if (error.code === "23505") return { ok: false, error: "No. seri sudah dipakai alat lain." };
    return { ok: false, error: dbErrorMessage(error) };
  }
  if (!data?.length) return { ok: false, error: "Alat tidak ditemukan." };
  revalidateEquipment();
  return { ok: true, message: "Data alat disimpan." };
}

/** ALT-05: Operasional anywhere, Lapangan at their project locations. */
export async function changeToolCondition(input: { toolId: string; values: ConditionChangeInput }): Promise<ActionResult> {
  const auth = await assertRole(["operations", "field"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.toolId);
  if (!id.success) return { ok: false, error: "Alat tidak valid." };
  const parsed = conditionChangeSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("change_tool_condition", {
    p_tool: id.data,
    p_location: parsed.data.location_id,
    p_from: parsed.data.from,
    p_to: parsed.data.to,
    p_quantity: parsed.data.quantity,
    p_note: parsed.data.note,
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateEquipment();
  return { ok: true, message: "Kondisi alat diperbarui." };
}

export async function adjustToolStock(input: { toolId: string; values: AdjustmentInput }): Promise<ActionResult> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.toolId);
  if (!id.success) return { ok: false, error: "Alat tidak valid." };
  const parsed = adjustmentSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_tool_stock", {
    p_tool: id.data,
    p_location: parsed.data.location_id,
    p_condition: parsed.data.condition,
    p_delta: parsed.data.delta,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateEquipment();
  return { ok: true, message: "Stok disesuaikan." };
}

/** ALT-03: send a delivery note; stock leaves the origin. */
export async function sendDeliveryNote(input: DeliveryNoteInput): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const parsed = deliveryNoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const { lines, ...note } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_delivery_note", { p_note: note, p_lines: lines });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateEquipment();
  return { ok: true, message: "Surat jalan dikirim.", data: { id: data as string } };
}

/** ALT-04: confirm what arrived; shortfalls become Hilang at the destination. */
export async function receiveDeliveryNote(input: { id: string; values: ReceiptInput }): Promise<ActionResult> {
  const auth = await assertRole(["operations", "field"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: "Surat jalan tidak valid." };
  const parsed = receiptSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("receive_delivery_note", {
    p_note: id.data,
    p_lines: parsed.data.lines,
    p_receipt_note: parsed.data.receipt_note ?? "",
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateEquipment();
  return { ok: true, message: "Penerimaan dikonfirmasi." };
}

export async function cancelDeliveryNote(input: { id: string; reason: string }): Promise<ActionResult> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: "Surat jalan tidak valid." };
  const reason = z.string().trim().min(1, "Isi alasan pembatalan.").max(300).safeParse(input.reason);
  if (!reason.success) return { ok: false, error: firstZodError(reason.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_delivery_note", { p_note: id.data, p_reason: reason.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateEquipment();
  return { ok: true, message: "Surat jalan dibatalkan; stok kembali ke lokasi asal." };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  tenderSchema,
  tenderStatusSchema,
  type TenderInput,
  type TenderStatusInput,
} from "@/lib/tenders/schema";

const LIST_PATH = "/marketing/tenders";
const idSchema = z.uuid("Tender tidak valid.");
const noteSchema = z.string().trim().max(300, "Catatan revisi maksimal 300 karakter.").optional();

function revalidateTender(id: string, clientId?: string) {
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  revalidatePath("/marketing/tender-analytics");
  if (clientId) revalidatePath(`/marketing/clients/${clientId}`);
}

export async function createTender(input: {
  values: TenderInput;
  revisionNote?: string;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["marketing"]);
  if (!auth.ok) return auth;

  const parsed = tenderSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const note = noteSchema.safeParse(input.revisionNote);
  if (!note.success) return { ok: false, error: firstZodError(note.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenders")
    .insert({ ...parsed.data, bid_revision_note: note.data || null })
    .select("id")
    .single();
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateTender(data.id, parsed.data.client_id);
  return { ok: true, message: "Tender ditambahkan.", data: { id: data.id } };
}

/** Saves tender data; a changed bid value is recorded with `revisionNote` (MKT-05). */
export async function updateTender(input: {
  id: string;
  values: TenderInput;
  revisionNote?: string;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["marketing"]);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  const parsed = tenderSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const note = noteSchema.safeParse(input.revisionNote);
  if (!note.success) return { ok: false, error: firstZodError(note.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenders")
    .update({ ...parsed.data, bid_revision_note: note.data || null })
    .eq("id", id.data)
    .select("id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Tender tidak ditemukan." };

  revalidateTender(id.data, parsed.data.client_id);
  return { ok: true, message: "Data tender disimpan.", data: { id: id.data } };
}

/** MKT-04 status change; closing data is cleared by the database on reopen. */
export async function changeTenderStatus(input: {
  id: string;
  values: TenderStatusInput;
}): Promise<ActionResult> {
  const auth = await assertRole(["marketing"]);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  const parsed = tenderStatusSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { status } = parsed.data;
  const lost = status === "lost";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenders")
    .update({
      status,
      closed_date: parsed.data.closed_date,
      lost_reason: lost ? parsed.data.lost_reason : null,
      lost_note: lost ? parsed.data.lost_note : null,
      winner_name: lost ? parsed.data.winner_name : null,
      winner_price: lost ? parsed.data.winner_price : null,
    })
    .eq("id", id.data)
    .select("client_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Tender tidak ditemukan." };

  revalidateTender(id.data, data[0].client_id);
  return { ok: true, message: "Status tender diperbarui." };
}

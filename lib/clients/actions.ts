"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import {
  activitySchema,
  clientSchema,
  contactSchema,
  type ActivityInput,
  type ClientInput,
  type ContactInput,
} from "@/lib/clients/schema";
import { createClient } from "@/lib/supabase/server";

const LIST_PATH = "/marketing/clients";
const MANAGERS = ["super_admin", "marketing"] as const;
const idSchema = z.uuid("Data tidak valid.");

function revalidateClient(clientId?: string) {
  revalidatePath(LIST_PATH);
  if (clientId) revalidatePath(`${LIST_PATH}/${clientId}`);
  revalidatePath("/marketing/follow-ups");
  revalidatePath("/marketing/tenders/[id]", "page");
}

export async function saveClient(input: {
  id?: string;
  values: ClientInput;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const parsed = clientSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  if (input.id) {
    const id = idSchema.safeParse(input.id);
    if (!id.success) return { ok: false, error: "Klien tidak valid." };
    const { data, error } = await supabase.from("clients").update(parsed.data).eq("id", id.data).select("id");
    if (error) return { ok: false, error: dbErrorMessage(error) };
    if (!data?.length) return { ok: false, error: "Klien tidak ditemukan." };
    revalidateClient(id.data);
    return { ok: true, message: "Data klien disimpan.", data: { id: id.data } };
  }

  const { data, error } = await supabase.from("clients").insert(parsed.data).select("id").single();
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateClient();
  return { ok: true, message: "Klien ditambahkan.", data: { id: data.id } };
}

/** Deletes a client without tenders (with its contacts and activities). */
export async function deleteClient(clientId: string): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(clientId);
  if (!id.success) return { ok: false, error: "Klien tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").delete().eq("id", id.data).select("id");
  if (error) {
    if (error.code === "23503") {
      return { ok: false, error: "Klien sudah punya tender sehingga tidak dapat dihapus. Nonaktifkan saja." };
    }
    return { ok: false, error: dbErrorMessage(error) };
  }
  if (!data?.length) return { ok: false, error: "Klien tidak ditemukan." };

  revalidateClient();
  return { ok: true, message: "Klien dihapus." };
}

export async function saveContact(input: {
  clientId: string;
  contactId?: string;
  values: ContactInput;
}): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const clientId = idSchema.safeParse(input.clientId);
  if (!clientId.success) return { ok: false, error: "Klien tidak valid." };
  const parsed = contactSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = input.contactId
    ? await supabase
        .from("client_contacts")
        .update(parsed.data)
        .eq("id", input.contactId)
        .eq("client_id", clientId.data)
    : await supabase.from("client_contacts").insert({ ...parsed.data, client_id: clientId.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateClient(clientId.data);
  return { ok: true, message: input.contactId ? "Kontak diperbarui." : "Kontak ditambahkan." };
}

export async function deleteContact(contactId: string): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(contactId);
  if (!id.success) return { ok: false, error: "Kontak tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("client_contacts").delete().eq("id", id.data).select("client_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Kontak tidak ditemukan." };

  revalidateClient(data[0].client_id);
  return { ok: true, message: "Kontak dihapus." };
}

/** Logs (no `activityId`) or edits an activity; authors edit their own (RLS). */
export async function saveActivity(input: {
  clientId: string;
  activityId?: string;
  values: ActivityInput;
}): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const clientId = idSchema.safeParse(input.clientId);
  if (!clientId.success) return { ok: false, error: "Klien tidak valid." };
  const parsed = activitySchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  if (input.activityId) {
    const { data, error } = await supabase
      .from("client_activities")
      .update(parsed.data)
      .eq("id", input.activityId)
      .select("id");
    if (error) return { ok: false, error: dbErrorMessage(error) };
    if (!data?.length) return { ok: false, error: "Hanya pencatat aktivitas yang dapat mengubahnya." };
  } else {
    const { error } = await supabase
      .from("client_activities")
      .insert({ ...parsed.data, client_id: clientId.data, owner_id: auth.profile.id });
    if (error) return { ok: false, error: dbErrorMessage(error) };
  }

  revalidateClient(clientId.data);
  return { ok: true, message: input.activityId ? "Aktivitas diperbarui." : "Aktivitas dicatat." };
}

export async function deleteActivity(activityId: string): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(activityId);
  if (!id.success) return { ok: false, error: "Aktivitas tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("client_activities").delete().eq("id", id.data).select("client_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Hanya pencatat aktivitas yang dapat menghapusnya." };

  revalidateClient(data[0].client_id);
  return { ok: true, message: "Aktivitas dihapus." };
}

/** Marks a follow-up done (or open again). */
export async function setFollowUpDone(input: { activityId: string; done: boolean }): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.activityId);
  if (!id.success) return { ok: false, error: "Aktivitas tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_activities")
    .update({ follow_up_done_at: input.done ? new Date().toISOString() : null })
    .eq("id", id.data)
    .not("follow_up_date", "is", null)
    .select("client_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Hanya pencatat aktivitas yang dapat mengubahnya." };

  revalidateClient(data[0].client_id);
  return { ok: true, message: input.done ? "Tindak lanjut ditandai selesai." : "Tindak lanjut dibuka kembali." };
}

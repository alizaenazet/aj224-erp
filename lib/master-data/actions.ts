"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import { getMasterEntity } from "@/lib/master-data/entities";
import { buildMasterSchema } from "@/lib/master-data/schema";
import { createClient } from "@/lib/supabase/server";

async function untypedClient() {
  // Table names come from config, so use the untyped client surface (RLS applies).
  return (await createClient()) as unknown as SupabaseClient;
}

/** Creates (id null) or updates a master record; RLS enforces the role too. */
export async function saveMasterRecord(
  key: string,
  id: string | null,
  values: Record<string, unknown>,
): Promise<ActionResult> {
  const entity = getMasterEntity(key);
  if (!entity) return { ok: false, error: "Data tidak dikenal." };

  const auth = await assertRole(entity.manageRoles);
  if (!auth.ok) return auth;

  const parsed = buildMasterSchema(entity.fields, id ? "edit" : "create").safeParse(values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { required_certificates: certificateIds, ...record } = parsed.data as Record<string, unknown>;
  const supabase = await untypedClient();

  const query = id
    ? supabase.from(entity.table).update(record).eq(entity.idColumn, id)
    : supabase.from(entity.table).insert({ ...record, ...entity.insertValues });
  const { data, error } = await query.select(entity.idColumn);

  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Data tidak ditemukan atau tidak dapat diubah." };

  if (Array.isArray(certificateIds)) {
    const savedId = (data[0] as Record<string, string>)[entity.idColumn];
    const { error: linkError } = await supabase.rpc("set_position_required_certificates", {
      p_position_id: savedId,
      p_certificate_type_ids: certificateIds,
    });
    if (linkError) return { ok: false, error: dbErrorMessage(linkError) };
  }

  revalidatePath(`/settings/master-data/${key}`);
  return { ok: true, message: id ? `${entity.singular} diperbarui.` : `${entity.singular} ditambahkan.` };
}

export async function setMasterRecordActive(
  key: string,
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const entity = getMasterEntity(key);
  if (!entity) return { ok: false, error: "Data tidak dikenal." };

  const auth = await assertRole(entity.manageRoles);
  if (!auth.ok) return auth;

  const supabase = await untypedClient();
  const { data, error } = await supabase
    .from(entity.table)
    .update({ is_active: active })
    .eq(entity.idColumn, id)
    .select(entity.idColumn);

  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Data tidak ditemukan atau tidak dapat diubah." };

  revalidatePath(`/settings/master-data/${key}`);
  return { ok: true, message: active ? `${entity.singular} diaktifkan.` : `${entity.singular} dinonaktifkan.` };
}

/** Deletes an unused record; a used one is refused by its foreign keys. */
export async function deleteMasterRecord(key: string, id: string): Promise<ActionResult> {
  const entity = getMasterEntity(key);
  if (!entity) return { ok: false, error: "Data tidak dikenal." };

  const auth = await assertRole(entity.manageRoles);
  if (!auth.ok) return auth;

  const supabase = await untypedClient();
  const { data, error } = await supabase
    .from(entity.table)
    .delete()
    .eq(entity.idColumn, id)
    .select(entity.idColumn);

  if (error) return { ok: false, error: dbErrorMessage(error, "Data gagal dihapus.") };
  if (!data?.length) return { ok: false, error: "Data tidak ditemukan atau tidak dapat dihapus." };

  revalidatePath(`/settings/master-data/${key}`);
  return { ok: true, message: `${entity.singular} dihapus.` };
}

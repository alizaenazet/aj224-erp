"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import {
  ALLOWED_FILE_TYPES,
  ATTACHMENT_ENTITIES,
  MAX_FILE_BYTES,
  type AttachmentEntityType,
} from "@/lib/attachments/config";
import { APP_ROLES } from "@/lib/auth/roles";
import { assertRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const ENTITY_TYPES = Object.keys(ATTACHMENT_ENTITIES) as [AttachmentEntityType, ...AttachmentEntityType[]];

const registerSchema = z
  .object({
    entityType: z.enum(ENTITY_TYPES),
    entityId: z.uuid(),
    category: z.string().regex(/^[a-z_]+$/),
    path: z.string().min(1).max(300),
    fileName: z.string().trim().min(1).max(200),
    mimeType: z.string().refine((type) => type in ALLOWED_FILE_TYPES, "Jenis berkas tidak didukung."),
    sizeBytes: z.number().int().min(1).max(MAX_FILE_BYTES, "Ukuran berkas maksimal 10 MB."),
  })
  .refine((input) => input.category in ATTACHMENT_ENTITIES[input.entityType].categories, {
    message: "Kategori berkas tidak valid.",
  })
  .refine((input) => input.path.startsWith(`${input.entityType}/${input.entityId}/${input.category}/`), {
    message: "Lokasi berkas tidak valid.",
  });

export type RegisterAttachmentInput = z.infer<typeof registerSchema>;

/**
 * Records a file the browser already uploaded to Storage. Access is decided
 * by RLS (can_write_attachment); single-file categories drop older files.
 */
export async function registerAttachment(input: RegisterAttachmentInput): Promise<ActionResult> {
  const auth = await assertRole(APP_ROLES);
  if (!auth.ok) return auth;

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const { entityType, entityId, category, path, fileName, mimeType, sizeBytes } = parsed.data;
  const entity = ATTACHMENT_ENTITIES[entityType];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      category,
      bucket: entity.bucket,
      path,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      uploaded_by: auth.profile.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: dbErrorMessage(error, "Berkas gagal disimpan. Coba lagi.") };

  if ((entity.single as readonly string[]).includes(category)) {
    const { data: older } = await supabase
      .from("attachments")
      .delete()
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("category", category)
      .neq("id", data.id)
      .select("path");
    if (older?.length) {
      await supabase.storage.from(entity.bucket).remove(older.map((row) => row.path));
    }
  }

  revalidatePath(entity.path(entityId), "page");
  return { ok: true, message: `${entity.categories[category]} diunggah.` };
}

/** Removes an attachment row and its stored file (UMM-03). */
export async function deleteAttachment(id: string): Promise<ActionResult> {
  const auth = await assertRole(APP_ROLES);
  if (!auth.ok) return auth;

  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Berkas tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attachments")
    .delete()
    .eq("id", parsed.data)
    .select("entity_type, entity_id, bucket, path");

  if (error) return { ok: false, error: dbErrorMessage(error, "Berkas gagal dihapus. Coba lagi.") };
  const row = data?.[0];
  if (!row) return { ok: false, error: "Berkas tidak ditemukan atau Anda tidak berhak menghapusnya." };

  const { error: storageError } = await supabase.storage.from(row.bucket).remove([row.path]);
  if (storageError) console.error("attachment storage remove failed", row.path, storageError.message);

  const entity = ATTACHMENT_ENTITIES[row.entity_type as AttachmentEntityType];
  if (entity) revalidatePath(entity.path(row.entity_id), "page");
  return { ok: true, message: "Berkas dihapus." };
}

import "server-only";

import type { AttachmentEntityType, AttachmentRow } from "@/lib/attachments/config";
import { createClient } from "@/lib/supabase/server";

/** Attachments of one record visible to the signed-in user, newest first. */
export async function listAttachments(
  entityType: AttachmentEntityType,
  entityId: string,
  { exclude = [] }: { exclude?: string[] } = {},
) {
  const supabase = await createClient();
  let query = supabase
    .from("attachments")
    .select("id, category, file_name, mime_type, size_bytes, created_at")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (exclude.length) query = query.not("category", "in", `(${exclude.join(",")})`);

  const { data, error } = await query;
  return { rows: (data ?? []) as AttachmentRow[], error };
}

/** Signed URL of the newest file in a category (e.g. a photo), or null. */
export async function signedAttachmentUrl(
  entityType: AttachmentEntityType,
  entityId: string,
  category: string,
  expiresIn = 3600,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attachments")
    .select("bucket, path")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("category", category)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  const { data: signed } = await supabase.storage
    .from(data.bucket)
    .createSignedUrl(data.path, expiresIn);
  return signed?.signedUrl ?? null;
}

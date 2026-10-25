"use client";

import { useState } from "react";
import { toast } from "sonner";
import { registerAttachment } from "@/lib/attachments/actions";
import {
  ATTACHMENT_ENTITIES,
  MAX_PHOTO_BYTES,
  fileExtension,
  fileMimeType,
  isImageType,
  validateFile,
  type AttachmentEntityType,
} from "@/lib/attachments/config";
import { createClient } from "@/lib/supabase/client";

export type UploadItem = {
  key: string;
  /** Prepared (compressed) file, kept so "Coba lagi" needs no new pick. */
  file: File;
  category: string;
  status: "preparing" | "uploading" | "failed";
  error?: string;
};

/** Photos ≤ 1 MB on the device before upload (UMM-03, PRD §14). */
async function compressPhoto(file: File, mimeType: string) {
  if (file.size <= MAX_PHOTO_BYTES) return file;

  const { default: imageCompression } = await import("browser-image-compression");
  const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
  let result: Blob = await imageCompression(file, { ...options, fileType: mimeType });
  let type = mimeType;

  // PNGs often stay large; JPEG gets them under the limit.
  if (result.size > MAX_PHOTO_BYTES) {
    result = await imageCompression(file, { ...options, fileType: "image/jpeg" });
    type = "image/jpeg";
  }
  if (result.size > MAX_PHOTO_BYTES) {
    throw new Error("Foto tidak dapat diperkecil sampai 1 MB. Gunakan foto lain.");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([result], `${baseName}.${fileExtension(type)}`, { type });
}

/**
 * Uploads files straight to Storage, then records them with
 * registerAttachment. Failed uploads stay in the list for a retry.
 */
export function useAttachmentUpload({
  entityType,
  entityId,
  onUploaded,
}: {
  entityType: AttachmentEntityType;
  entityId: string;
  onUploaded?: () => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const bucket = ATTACHMENT_ENTITIES[entityType].bucket;

  function patch(key: string, changes: Partial<UploadItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...changes } : item)));
  }

  function remove(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  async function send(item: UploadItem) {
    patch(item.key, { status: "uploading", error: undefined });
    const mimeType = fileMimeType(item.file) ?? item.file.type;
    const path = `${entityType}/${entityId}/${item.category}/${crypto.randomUUID()}.${fileExtension(mimeType)}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, item.file, { contentType: mimeType, upsert: false });
    if (uploadError) {
      patch(item.key, {
        status: "failed",
        error: "Unggah gagal. Periksa koneksi lalu coba lagi.",
      });
      return;
    }

    const result = await registerAttachment({
      entityType,
      entityId,
      category: item.category,
      path,
      fileName: item.file.name,
      mimeType,
      sizeBytes: item.file.size,
    }).catch(() => ({ ok: false as const, error: "Unggah gagal. Periksa koneksi lalu coba lagi." }));

    if (!result.ok) {
      await supabase.storage.from(bucket).remove([path]);
      patch(item.key, { status: "failed", error: result.error });
      return;
    }

    remove(item.key);
    toast.success(result.message);
    onUploaded?.();
  }

  async function add(file: File, category: string) {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    const key = crypto.randomUUID();
    const mimeType = fileMimeType(file)!;
    setItems((current) => [...current, { key, file, category, status: "preparing" }]);

    let prepared = file;
    if (isImageType(mimeType)) {
      try {
        prepared = await compressPhoto(file, mimeType);
      } catch (cause) {
        remove(key);
        toast.error(cause instanceof Error ? cause.message : "Foto gagal dikompres.");
        return;
      }
    }

    const item: UploadItem = { key, file: prepared, category, status: "uploading" };
    patch(key, { file: prepared });
    await send(item);
  }

  function retry(key: string) {
    const item = items.find((candidate) => candidate.key === key);
    if (item) void send(item);
  }

  return { items, add, retry, dismiss: remove };
}

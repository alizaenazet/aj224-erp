import type { PostgrestError } from "@supabase/supabase-js";
import type { ZodError } from "zod";

/** Result returned by every server action to its form or button. */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string };

export function firstZodError(error: ZodError) {
  return error.issues[0]?.message ?? "Data tidak valid.";
}

/**
 * Database errors raised by our own triggers and functions carry an
 * Indonesian message (errcode P0001); pass those through, hide the rest.
 */
export function dbErrorMessage(error: PostgrestError, fallback = "Gagal menyimpan data. Coba lagi.") {
  if (error.code === "P0001" && error.message) return error.message;
  if (error.code === "42501") return "Anda tidak memiliki akses untuk tindakan ini.";
  if (error.code === "23505") return "Data yang sama sudah ada.";
  if (error.code === "23503") {
    return "Data sudah dipakai sehingga tidak dapat dihapus. Nonaktifkan saja.";
  }
  if (error.code === "23514") return "Nilai di luar batas yang diizinkan.";
  return fallback;
}

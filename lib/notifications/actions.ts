"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/actions";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

/** Marks one of the signed-in user's notifications as read (RLS: own rows). */
export async function markNotificationRead(id: string): Promise<ActionResult> {
  const { profile } = await getSession();
  if (!profile?.is_active) return { ok: false, error: "Sesi Anda berakhir." };
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Data tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  return error ? { ok: false, error: "Notifikasi gagal diperbarui." } : { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const { profile } = await getSession();
  if (!profile?.is_active) return { ok: false, error: "Sesi Anda berakhir." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", profile.id)
    .is("read_at", null);

  return error
    ? { ok: false, error: "Notifikasi gagal diperbarui." }
    : { ok: true, message: "Semua notifikasi ditandai dibaca." };
}

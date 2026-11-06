"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** PRJ-11: close a Selesai project; Direktur may override with a note. */
export async function closeProject(input: { id: string; note: string }): Promise<ActionResult> {
  const auth = await assertRole(["finance", "operations", "director"]);
  if (!auth.ok) return auth;
  if (!z.uuid().safeParse(input.id).success) return { ok: false, error: "Proyek tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_project", { p_project: input.id, p_note: input.note.trim().slice(0, 500) });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidatePath("/projects", "layout");
  revalidatePath("/finance/pl");
  return { ok: true, message: "Proyek ditutup." };
}

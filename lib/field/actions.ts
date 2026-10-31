"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import { localWorkerSchema, type LocalWorkerInput } from "@/lib/field/schema";
import { createClient } from "@/lib/supabase/server";

/** Registers a local worker on the user's project, pending HCM verification (HCM-12). */
export async function registerLocalWorker(input: {
  projectId: string;
  values: LocalWorkerInput;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["field"]);
  if (!auth.ok) return auth;

  const projectId = z.uuid().safeParse(input.projectId);
  if (!projectId.success) return { ok: false, error: "Pilih proyek." };
  const parsed = localWorkerSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_local_worker", {
    p_project: projectId.data,
    p_worker: { ...parsed.data, phone: parsed.data.phone.replace(/[ -]/g, "") },
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidatePath("/");
  revalidatePath("/field/attendance");
  revalidatePath(`/projects/${projectId.data}`, "layout");
  return {
    ok: true,
    message: `${parsed.data.full_name} ditambahkan dan menunggu verifikasi HCM.`,
    data: { id: data as string },
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import {
  documentFormatSchema,
  parametersSchema,
  type DocumentFormatInput,
  type ParametersInput,
} from "@/lib/parameters/schema";
import { createClient } from "@/lib/supabase/server";

const PAGE = "/settings/parameters";

/** Saves MST-10 parameters; the change is audited by a DB trigger. */
export async function updateSystemParameters(input: ParametersInput): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const parsed = parametersSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("system_parameters").update(parsed.data).eq("id", true);
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidatePath(PAGE);
  return { ok: true, message: "Parameter sistem disimpan." };
}

export async function updateDocumentFormat(
  code: string,
  input: DocumentFormatInput,
): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const parsed = documentFormatSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_types")
    .update(parsed.data)
    .eq("code", code)
    .select("code");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Jenis dokumen tidak ditemukan." };

  revalidatePath(PAGE);
  return { ok: true, message: "Format nomor dokumen disimpan." };
}

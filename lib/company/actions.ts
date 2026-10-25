"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import {
  bankAccountSchema,
  companyProfileSchema,
  type BankAccountInput,
  type CompanyProfileInput,
} from "@/lib/company/schema";
import { createClient } from "@/lib/supabase/server";

const PAGE = "/settings/company";

export async function updateCompanyProfile(input: CompanyProfileInput): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const parsed = companyProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("company_profile").update(parsed.data).eq("id", true);
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidatePath(PAGE);
  return { ok: true, message: "Profil perusahaan disimpan." };
}

const logoPathSchema = z.string().regex(/^logo\/[\w.-]+\.(png|jpe?g|webp)$/i, "Berkas logo tidak valid.");

/** Points the profile at a newly uploaded logo and removes the old file. */
export async function setCompanyLogo(path: string): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const parsed = logoPathSchema.safeParse(path);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data: current } = await supabase.from("company_profile").select("logo_path").maybeSingle();

  const { error } = await supabase
    .from("company_profile")
    .update({ logo_path: parsed.data })
    .eq("id", true);
  if (error) return { ok: false, error: dbErrorMessage(error) };

  if (current?.logo_path && current.logo_path !== parsed.data) {
    await supabase.storage.from("company-assets").remove([current.logo_path]);
  }

  revalidatePath(PAGE);
  return { ok: true, message: "Logo diperbarui." };
}

export async function saveBankAccount(id: string | null, input: BankAccountInput): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const parsed = bankAccountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("company_bank_accounts").update(parsed.data).eq("id", id)
    : await supabase.from("company_bank_accounts").insert(parsed.data);
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidatePath(PAGE);
  return { ok: true, message: id ? "Rekening diperbarui." : "Rekening ditambahkan." };
}

export async function setDefaultBankAccount(id: string): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_default_bank_account", { p_account_id: id });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidatePath(PAGE);
  return { ok: true, message: "Rekening utama diperbarui." };
}

export async function setBankAccountActive(id: string, active: boolean): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data: account } = await supabase
    .from("company_bank_accounts")
    .select("is_default")
    .eq("id", id)
    .maybeSingle();
  if (!active && account?.is_default) {
    return { ok: false, error: "Rekening utama tidak dapat dinonaktifkan. Pilih rekening utama lain dulu." };
  }

  const { error } = await supabase.from("company_bank_accounts").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidatePath(PAGE);
  return { ok: true, message: active ? "Rekening diaktifkan." : "Rekening dinonaktifkan." };
}

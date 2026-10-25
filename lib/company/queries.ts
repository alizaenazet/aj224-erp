import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CompanyProfile = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  npwp: string | null;
  is_pkp: boolean;
  logo_path: string | null;
};

export type BankAccount = {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_default: boolean;
  is_active: boolean;
};

/** Company profile plus a short-lived signed URL for the logo (MST-02). */
export async function getCompanyProfile() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_profile")
    .select("name, address, phone, email, npwp, is_pkp, logo_path")
    .maybeSingle();

  let logoUrl: string | null = null;
  if (data?.logo_path) {
    const { data: signed } = await supabase.storage
      .from("company-assets")
      .createSignedUrl(data.logo_path, 600);
    logoUrl = signed?.signedUrl ?? null;
  }

  return { profile: data as CompanyProfile | null, logoUrl };
}

export async function listBankAccounts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_bank_accounts")
    .select("id, bank_name, account_number, account_holder, is_default, is_active")
    .order("is_default", { ascending: false })
    .order("bank_name");
  return (data ?? []) as BankAccount[];
}

import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAnyRole, type AppRole } from "./roles";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  is_active: boolean;
};

/**
 * Reads the signed-in user and their profile once per request. Authorization
 * always uses the profile row (not JWT claims) so deactivation and role
 * changes apply immediately.
 */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;

  if (!userId) {
    return { userId: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  return { userId, profile: profile as Profile | null };
});

/** Signed-in, active user with a role, or a redirect to the right auth page. */
export async function requireProfile(): Promise<Profile> {
  const { userId, profile } = await getSession();

  if (!userId) redirect("/auth/login");
  if (!profile) redirect("/auth/no-role");
  if (!profile.is_active) redirect("/auth/signout?reason=inactive");

  return profile;
}

/** The profile when its role is allowed, otherwise null (render AccessDenied). */
export async function requireRole(roles: readonly AppRole[]) {
  const profile = await requireProfile();
  return hasAnyRole(profile.role, roles) ? profile : null;
}

export type ActionAuth =
  | { ok: true; profile: Profile }
  | { ok: false; error: string };

/** Role check for server actions: returns an error result instead of redirecting. */
export async function assertRole(roles: readonly AppRole[]): Promise<ActionAuth> {
  const { profile } = await getSession();

  if (!profile || !profile.is_active) {
    return { ok: false, error: "Sesi Anda berakhir. Silakan masuk kembali." };
  }
  if (!hasAnyRole(profile.role, roles)) {
    return { ok: false, error: "Anda tidak memiliki akses untuk tindakan ini." };
  }

  return { ok: true, profile };
}

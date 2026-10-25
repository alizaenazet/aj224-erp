import type { Database } from "@/lib/supabase/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const APP_ROLES = [
  "super_admin",
  "director",
  "marketing",
  "finance",
  "hcm",
  "operations",
  "field",
] as const satisfies readonly AppRole[];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  director: "Direktur",
  marketing: "Marketing",
  finance: "Finance",
  hcm: "HCM",
  operations: "Operasional",
  field: "Lapangan",
};

export function hasAnyRole(role: AppRole, roles: readonly AppRole[]) {
  return roles.includes(role);
}

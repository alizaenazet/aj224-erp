import type { AppRole } from "@/lib/auth/roles";

export const USER_STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  invited: "Menunggu Undangan",
  inactive: "Nonaktif",
};

export type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  is_active: boolean;
  status: string;
  last_sign_in_at: string | null;
  employee_id: string | null;
  employee_name: string | null;
};

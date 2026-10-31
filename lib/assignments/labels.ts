// Assignment labels (HCM-05, HCM-06), shared by client and server.

/** Roles that see assignments (PRD §13: Penugasan); Lapangan sees their own projects. */
export const ASSIGNMENT_VIEW_ROLES = ["super_admin", "director", "hcm", "operations"] as const;
export const ASSIGNMENT_MANAGE_ROLES = ["hcm"] as const;

export const ASSIGNMENT_STATES = ["upcoming", "active", "ended"] as const;
export type AssignmentState = (typeof ASSIGNMENT_STATES)[number];
export const ASSIGNMENT_STATE_LABELS: Record<AssignmentState, string> = {
  upcoming: "Akan datang",
  active: "Aktif",
  ended: "Selesai",
};
export const ASSIGNMENT_STATE_VARIANTS: Record<AssignmentState, "outline" | "default" | "secondary"> = {
  upcoming: "outline",
  active: "default",
  ended: "secondary",
};

/** Worst required-certificate status of a crew member (null = none required). */
export type CertState = "missing" | "expired" | "expiring" | "valid";
export const CERT_STATE_LABELS: Record<CertState, string> = {
  missing: "Sertifikat belum ada",
  expired: "Sertifikat kedaluwarsa",
  expiring: "Segera kedaluwarsa",
  valid: "Sertifikat berlaku",
};
export const CERT_STATE_VARIANTS: Record<CertState, "destructive" | "warning" | "success"> = {
  missing: "destructive",
  expired: "destructive",
  expiring: "warning",
  valid: "success",
};

/** A row of the assignment_list view. */
export type AssignmentRow = {
  id: string;
  employee_id: string;
  project_id: string;
  position_id: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  override_reason: string | null;
  overridden_at: string | null;
  employee_no: string;
  employee_name: string;
  work_type: string;
  verification_status: "verified" | "pending";
  employee_active: boolean;
  project_code: string;
  project_name: string;
  project_status: string;
  position_name: string;
  state: AssignmentState;
  cert_state: CertState | null;
  cert_issues: string | null;
};

/** One required certificate checked for an assignment (assignment_fitness). */
export type FitnessRow = {
  certificate_type_id: string;
  certificate_type_name: string;
  status: CertState;
  expiry_date: string | null;
};

/** Fit when no required certificate is missing or expired (§11.5). */
export function isFit(rows: FitnessRow[]) {
  return rows.every((row) => row.status === "valid" || row.status === "expiring");
}

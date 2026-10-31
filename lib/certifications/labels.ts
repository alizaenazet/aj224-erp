// Certificate status labels (PRD §11.5), shared by client and server.

export const CERTIFICATE_STATUSES = ["valid", "expiring", "expired"] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];
/** Status of a required certificate, which may be missing. */
export type RequirementStatus = CertificateStatus | "missing";

export const CERTIFICATE_STATUS_LABELS: Record<RequirementStatus, string> = {
  valid: "Berlaku",
  expiring: "Segera Kedaluwarsa",
  expired: "Kedaluwarsa",
  missing: "Belum ada",
};

export const CERTIFICATE_STATUS_VARIANTS: Record<RequirementStatus, "secondary" | "warning" | "destructive"> = {
  valid: "secondary",
  expiring: "warning",
  expired: "destructive",
  missing: "destructive",
};

/** List filter: one status, or Bermasalah (expiring + expired). */
export const CERTIFICATE_FILTERS = ["valid", "expiring", "expired", "problem"] as const;
export const CERTIFICATE_FILTER_LABELS: Record<(typeof CERTIFICATE_FILTERS)[number], string> = {
  valid: "Berlaku",
  expiring: "Segera Kedaluwarsa",
  expired: "Kedaluwarsa",
  problem: "Bermasalah",
};

/** Roles that see certificates and trainings (PRD §13). */
export const CERTIFICATE_VIEW_ROLES = ["super_admin", "director", "hcm", "operations"] as const;

/** Fit for a position when every required certificate is valid or expiring (§11.5). */
export function isFitStatus(status: RequirementStatus) {
  return status === "valid" || status === "expiring";
}

/** A row of the employee_certificate_list view. */
export type CertificateRow = {
  id: string;
  employee_id: string;
  certificate_type_id: string;
  certificate_no: string | null;
  issuer: string | null;
  issued_date: string;
  expiry_date: string | null;
  notes: string | null;
  training_id: string | null;
  employee_no: string;
  employee_name: string;
  employee_active: boolean;
  certificate_type_name: string;
  status: CertificateStatus;
  days_left: number | null;
  is_current: boolean;
};

/** "30 hari lagi", "Lewat 15 hari", "Seumur hidup" */
export function describeDaysLeft(daysLeft: number | null) {
  if (daysLeft === null) return "Seumur hidup";
  if (daysLeft < 0) return `Lewat ${-daysLeft} hari`;
  if (daysLeft === 0) return "Hari ini";
  return `${daysLeft} hari lagi`;
}

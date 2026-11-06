// K3 incident labels and row types (K3-01 … K3-05), shared by client and server.

/** PRD §13: Insiden K3 — SA/Dir/HCM view, Operasional manage, Lapangan report (P). */
export const K3_VIEW_ROLES = ["super_admin", "director", "hcm", "operations", "field"] as const;
export const K3_OFFICE_VIEW_ROLES = ["super_admin", "director", "hcm", "operations"] as const;
export const K3_MANAGE_ROLES = ["operations"] as const;
export const K3_REPORT_ROLES = ["operations", "field"] as const;

export const CLASSIFICATIONS = ["near_miss", "first_aid", "medical", "lti", "fatal", "property"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];
export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  near_miss: "Near Miss",
  first_aid: "P3K / First Aid",
  medical: "Perawatan Medis",
  lti: "Hari Kerja Hilang (LTI)",
  fatal: "Fatal",
  property: "Kerusakan Properti/Alat",
};
export const CLASSIFICATION_SHORT: Record<Classification, string> = {
  near_miss: "Near Miss",
  first_aid: "P3K",
  medical: "Medis",
  lti: "LTI",
  fatal: "Fatal",
  property: "Properti",
};
export const CLASSIFICATION_VARIANTS: Record<Classification, "outline" | "secondary" | "warning" | "destructive"> = {
  near_miss: "outline",
  first_aid: "secondary",
  medical: "warning",
  lti: "destructive",
  fatal: "destructive",
  property: "secondary",
};

export const INCIDENT_STATUSES = ["reported", "investigating", "closed", "cancelled"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: "Dilaporkan",
  investigating: "Investigasi",
  closed: "Ditutup",
  cancelled: "Batal",
};
export const INCIDENT_STATUS_VARIANTS: Record<IncidentStatus, "warning" | "secondary" | "success" | "outline"> = {
  reported: "warning",
  investigating: "secondary",
  closed: "success",
  cancelled: "outline",
};

export const ROOT_CAUSES = ["human", "equipment", "method", "environment", "material"] as const;
export type RootCause = (typeof ROOT_CAUSES)[number];
export const ROOT_CAUSE_LABELS: Record<RootCause, string> = {
  human: "Manusia",
  equipment: "Alat",
  method: "Metode",
  environment: "Lingkungan",
  material: "Material",
};

export const INVOLVEMENTS = ["victim", "involved"] as const;
export type Involvement = (typeof INVOLVEMENTS)[number];
export const INVOLVEMENT_LABELS: Record<Involvement, string> = { victim: "Korban", involved: "Terlibat" };

export type IncidentRow = {
  id: string;
  number: string;
  project_id: string;
  project_code: string;
  project_name: string;
  occurred_at: string;
  occurred_on: string;
  section_id: string | null;
  section_code: string | null;
  location_note: string | null;
  classification: Classification;
  chronology: string;
  body_parts: string | null;
  witnesses: string | null;
  immediate_action: string | null;
  status: IncidentStatus;
  direct_cause: string | null;
  root_cause: RootCause | null;
  lost_days: number;
  investigated_by: string | null;
  investigated_at: string | null;
  closed_by: string | null;
  closed_at: string | null;
  cancel_reason: string | null;
  reported_by: string | null;
  created_at: string;
  action_count: number;
  open_actions: number;
  overdue_actions: number;
};

export type IncidentPerson = {
  id: string;
  employee_id: string | null;
  employee_name: string | null;
  external_name: string | null;
  involvement: Involvement;
  injury: string | null;
};

export type IncidentAction = {
  id: string;
  description: string;
  pic_employee_id: string;
  pic_name: string;
  due_date: string;
  status: "open" | "done";
  done_note: string | null;
  done_at: string | null;
  overdue: boolean;
};

export type K3StatsRow = {
  project_id: string | null;
  project_code: string | null;
  project_name: string;
  near_miss: number;
  first_aid: number;
  medical: number;
  lti: number;
  fatal: number;
  property: number;
  total: number;
  open_actions: number;
  overdue_actions: number;
  work_hours: number;
  ltifr: number | null;
  last_lti_date: string | null;
  lti_free_days: number | null;
};

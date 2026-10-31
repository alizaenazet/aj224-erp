// Project, contract and term labels (PRJ-01 … PRJ-04, PRJ-10).
import { formatDate } from "@/lib/format";

export const PROJECT_STATUSES = ["preparing", "running", "on_hold", "completed", "closed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  preparing: "Persiapan",
  running: "Berjalan",
  on_hold: "Tertunda",
  completed: "Selesai",
  closed: "Ditutup",
};
export const PROJECT_STATUS_VARIANTS: Record<ProjectStatus, "outline" | "default" | "secondary" | "destructive"> = {
  preparing: "outline",
  running: "default",
  on_hold: "destructive",
  completed: "secondary",
  closed: "secondary",
};
/** Statuses users may choose; Ditutup needs the closing checklist (PRJ-11). */
export const SETTABLE_STATUSES: readonly ProjectStatus[] = ["preparing", "running", "on_hold", "completed"];

export const TERM_KINDS = ["down_payment", "progress", "retention"] as const;
export type TermKind = (typeof TERM_KINDS)[number];
export const TERM_KIND_LABELS: Record<TermKind, string> = {
  down_payment: "Uang Muka",
  progress: "Termin",
  retention: "Retensi",
};

export const TERM_CONDITIONS = ["progress", "date", "manual"] as const;
export type TermCondition = (typeof TERM_CONDITIONS)[number];
export const TERM_CONDITION_LABELS: Record<TermCondition, string> = {
  progress: "Progres",
  date: "Tanggal",
  manual: "Manual",
};

export const TERM_STATUSES = ["not_due", "ready", "invoiced", "paid"] as const;
export type TermStatus = (typeof TERM_STATUSES)[number];
export const TERM_STATUS_LABELS: Record<TermStatus, string> = {
  not_due: "Belum Waktunya",
  ready: "Siap Ditagih",
  invoiced: "Ditagih",
  paid: "Lunas",
};
export const TERM_STATUS_VARIANTS: Record<TermStatus, "outline" | "default" | "secondary"> = {
  not_due: "outline",
  ready: "default",
  invoiced: "secondary",
  paid: "secondary",
};

export const PROJECT_DOCUMENT_CATEGORIES: Record<string, string> = {
  contract: "Kontrak",
  addendum: "Addendum",
  bap: "BAP",
  bast: "BAST",
  drawing: "Gambar",
  permit: "Izin",
  correspondence: "Korespondensi",
  other: "Lainnya",
};
/** Contract files are limited to roles that see contract data. */
export const CONTRACT_DOCUMENT_CATEGORIES = ["contract", "addendum"];

// Roles (PRD §13: Proyek data kontrak & termin, RAB).
/** Lapangan sees only the projects of their active assignment (RLS, UMM-02). */
export const PROJECT_VIEW_ROLES = ["super_admin", "director", "marketing", "finance", "hcm", "operations", "field"] as const;
export const PROJECT_MANAGE_ROLES = ["marketing", "finance"] as const;
export const CONTRACT_VIEW_ROLES = ["super_admin", "director", "marketing", "finance", "operations"] as const;
export const PROJECT_STATUS_ROLES = ["finance", "operations"] as const;
export const TERM_READY_ROLES = ["finance", "operations"] as const;
export const BUDGET_VIEW_ROLES = ["super_admin", "director", "finance", "operations"] as const;
export const BUDGET_MANAGE_ROLES = ["finance", "operations"] as const;
export const PROJECT_DOCUMENT_MANAGE_ROLES = ["marketing", "finance", "operations"] as const;

/** A row of the project_overview view (contract columns null without access). */
export type ProjectRow = {
  id: string;
  code: string;
  name: string;
  client_id: string;
  client_name: string | null;
  tender_id: string | null;
  end_owner: string | null;
  site: string | null;
  voltage_kv: number | null;
  length_kms: number | null;
  tower_count: number | null;
  start_date: string | null;
  target_finish_date: string | null;
  status: ProjectStatus;
  location_id: string | null;
  notes: string | null;
  contract_no: string | null;
  contract_date: string | null;
  ppn_applicable: boolean | null;
  maintenance_months: number | null;
  scope: string | null;
  base_contract_value: number | null;
  contract_value: number | null;
  finish_date: string | null;
  addendum_count: number;
  /** §11.2 progress and plan; null without sections or for roles that cannot see progress. */
  progress: number | null;
  planned_progress: number | null;
};

export type AddendumRow = {
  id: string;
  addendum_no: string;
  addendum_date: string;
  new_value: number | null;
  new_finish_date: string | null;
  description: string | null;
  created_at: string;
};

/** A row of the project_term_list view. */
export type TermRow = {
  id: string;
  project_id: string;
  sort_order: number;
  name: string;
  kind: TermKind;
  percent: number | null;
  amount: number | null;
  amount_value: number | null;
  condition_type: TermCondition;
  condition_progress: number | null;
  condition_date: string | null;
  status: TermStatus;
  ready_at: string | null;
  /** Who marked it Siap Ditagih; null when the system did (PRJ-03 automation). */
  ready_by_name: string | null;
  notes: string | null;
};

export type BudgetLine = {
  cost_category_id: string;
  code: string;
  name: string;
  budget: number;
  actual: number;
  notes: string | null;
};

/** "Progres ≥ 50%", "Tanggal 1 Okt 2027", "Manual". */
export function describeCondition(term: Pick<TermRow, "condition_type" | "condition_progress" | "condition_date">) {
  if (term.condition_type === "progress") {
    return `Progres ≥ ${Number(term.condition_progress ?? 0).toLocaleString("id-ID")}%`;
  }
  if (term.condition_type === "date") return `Tanggal ${formatDate(term.condition_date)}`;
  return "Manual";
}

/** % Terpakai band (PRJ-04): yellow from 80%, red above 100%. */
export function usageBand(budget: number, actual: number) {
  if (budget <= 0) return actual > 0 ? ("over" as const) : ("normal" as const);
  const used = (actual / budget) * 100;
  if (used > 100) return "over" as const;
  if (used >= 80) return "warning" as const;
  return "normal" as const;
}

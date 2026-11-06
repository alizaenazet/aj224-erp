// Project P/L labels and rows (FIN-11, FIN-12, FIN-14, PRD §11.3).

/** PRD §13: L/R proyek — SA, Direktur, Finance, Operasional read. */
export const PL_VIEW_ROLES = ["super_admin", "director", "finance", "operations"] as const;
/** PRJ-11: who may close (Direktur also by override). */
export const PROJECT_CLOSE_ROLES = ["finance", "operations", "director"] as const;

export const HEALTH_LABELS: Record<string, string> = { normal: "Normal", warning: "Waspada", critical: "Kritis" };
export const HEALTH_VARIANTS: Record<string, "success" | "warning" | "destructive"> = {
  normal: "success",
  warning: "warning",
  critical: "destructive",
};

export type FinancialRow = {
  project_id: string;
  code: string;
  name: string;
  status: string;
  client_name: string | null;
  contract_value: number;
  progress: number;
  planned_progress: number;
  total_budget: number;
  cost: number;
  final_cost: number;
  revenue: number;
  billed_total: number;
  received_total: number;
  cash_in: number;
  supplier_paid: number;
  payroll_paid: number;
  expenses_paid: number;
  cash_out: number;
  field_cash_balance: number;
  work_done: number;
  unbilled: number;
  gross_profit: number;
  margin: number | null;
  planned_profit: number;
  projected_profit: number;
  cash_position: number;
  cost_used_pct: number | null;
  cost_index: number | null;
  schedule_deviation: number;
  health: "normal" | "warning" | "critical";
};

export type MonthlyRow = {
  month: string;
  revenue: number;
  project_cost: number;
  overhead: number;
  profit: number;
  cash_in: number;
  cash_out: number;
};

export type ChecklistItem = { key: string; label: string; ok: boolean; detail: string };

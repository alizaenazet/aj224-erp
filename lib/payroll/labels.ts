// Payroll labels and rows (PAY-01 … PAY-09).

/** PRD §13: payroll — HCM prepares, Direktur approves, Finance pays; nobody else. */
export const PAYROLL_VIEW_ROLES = ["director", "finance", "hcm"] as const;

export const GROUP_LABELS: Record<string, string> = { field: "Lapangan", office: "Kantor", all: "Semua" };
export const PERIOD_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Diajukan",
  returned: "Dikembalikan",
  approved: "Disetujui",
  paid: "Dibayar",
  cancelled: "Batal",
};
export const PERIOD_STATUS_VARIANTS: Record<string, "outline" | "secondary" | "warning" | "success" | "destructive"> = {
  draft: "outline",
  submitted: "secondary",
  returned: "warning",
  approved: "success",
  paid: "success",
  cancelled: "destructive",
};
export const ADJUSTMENT_LABELS: Record<string, string> = {
  incentive: "Insentif / bonus / borongan",
  pph21: "Potongan PPh 21",
  other_deduction: "Potongan lain",
  correction: "Koreksi periode lalu",
};
export const ATTENDANCE_STATUS_OPTIONS = [
  { value: "present", label: "Hadir" },
  { value: "permit", label: "Izin" },
  { value: "sick", label: "Sakit" },
  { value: "leave", label: "Cuti" },
  { value: "absent", label: "Alpa" },
  { value: "off", label: "Libur" },
];

export type PeriodRow = {
  id: string;
  name: string;
  period_start: string;
  period_end: string;
  group_kind: string;
  status: string;
  notes: string | null;
  return_note: string | null;
  generated_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  slip_count: number;
  gross_total: number;
  net_total: number;
  flagged: number;
};

export type PayslipRow = {
  id: string;
  period_id: string;
  employee_id: string;
  employee_no: string;
  full_name: string;
  position_name: string | null;
  work_type: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  range_start: string;
  range_end: string;
  pay_type: string;
  daily_wage: number;
  base_salary: number;
  fixed_allowance: number;
  meal_rate: number;
  field_rate: number;
  overtime_rate: number;
  active_days: number;
  period_days: number;
  recorded_days: number;
  present_days: number;
  project_days: number;
  absent_days: number;
  overtime_hours: number;
  wage_amount: number;
  base_amount: number;
  absence_deduction: number;
  meal_amount: number;
  field_amount: number;
  overtime_amount: number;
  incentive_amount: number;
  correction_amount: number;
  gross: number;
  bpjs_deduction: number;
  pph21_deduction: number;
  other_deduction: number;
  kasbon_deduction: number;
  total_deductions: number;
  net: number;
  incomplete_attendance: boolean;
  unverified: boolean;
  status: string;
  paid_at: string | null;
  payment_method: string | null;
  projects: string | null;
  main_project_id: string | null;
};

export type AdjustmentRow = { id: string; employee_id: string; kind: string; amount: number; note: string };
export type RecapRow = { project_id: string | null; project_code: string; employees: number; days: number; allocated: number };

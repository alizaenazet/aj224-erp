// Supplier bill, expense, field cash and kasbon labels (FIN-06 … FIN-10, PAY-05).

/** PRD §13: Tagihan supplier & pengeluaran — SA/Dir/Operasional view, Finance manage. */
export const PAYABLE_VIEW_ROLES = ["super_admin", "director", "finance", "operations"] as const;
export const FINANCE_MANAGE_ROLES = ["finance"] as const;
/** Field cash: also Lapangan for their projects. */
export const FIELD_CASH_VIEW_ROLES = ["super_admin", "director", "finance", "operations", "field"] as const;
/** Kasbon is salary data (PRD §6). */
export const KASBON_VIEW_ROLES = ["director", "finance", "hcm"] as const;
export const KASBON_MANAGE_ROLES = ["finance", "hcm"] as const;

/** Combobox value for "no project" cost lines. */
export const OFFICE = "office";

export const BILL_STATUS_LABELS: Record<string, string> = {
  unpaid: "Belum Dibayar",
  partial: "Dibayar Sebagian",
  paid: "Lunas",
  cancelled: "Batal",
};
export const BILL_STATUS_VARIANTS: Record<string, "secondary" | "warning" | "success" | "outline"> = {
  unpaid: "secondary",
  partial: "warning",
  paid: "success",
  cancelled: "outline",
};
export const DUE_GROUP_LABELS: Record<string, string> = {
  overdue: "Terlambat",
  this_week: "Minggu ini",
  next_week: "Minggu depan",
  later: "Nanti",
};
export const METHOD_LABELS: Record<string, string> = { cash: "Tunai", transfer: "Transfer", opening: "Saldo awal" };

export const FIELD_KIND_LABELS: Record<string, string> = {
  topup: "Top-up",
  return: "Pengembalian ke kantor",
  project_cost: "Biaya Proyek",
  kasbon: "Kasbon Karyawan",
  wage_payment: "Pembayaran Gaji",
};
export const FIELD_STATUS_LABELS: Record<string, string> = {
  active: "Tercatat",
  pending: "Menunggu Verifikasi",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Batal",
};
export const FIELD_STATUS_VARIANTS: Record<string, "secondary" | "warning" | "success" | "destructive" | "outline"> = {
  active: "secondary",
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  cancelled: "outline",
};

export type BillRow = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  bill_no: string;
  bill_date: string;
  due_date: string;
  subtotal: number;
  ppn_amount: number;
  total: number;
  status: string;
  delivery_note_id: string | null;
  delivery_note_number: string | null;
  notes: string | null;
  is_opening: boolean;
  cancel_reason: string | null;
  paid: number;
  balance: number;
  days_overdue: number;
  due_group: string | null;
  projects: string | null;
};

export type ExpenseRow = {
  id: string;
  expense_date: string;
  project_id: string | null;
  project_code: string | null;
  cost_category_id: string;
  category_name: string;
  amount: number;
  payee: string | null;
  method: string;
  description: string;
  no_receipt: boolean;
  no_receipt_note: string | null;
  is_opening: boolean;
  status: string;
  cancel_reason: string | null;
};

export type FieldBalanceRow = {
  project_id: string;
  project_code: string;
  project_name: string;
  topups: number;
  returns: number;
  approved: number;
  pending: number;
  pending_count: number;
  balance: number;
};

export type LedgerRow = {
  id: string;
  kind: string;
  entry_date: string;
  amount: number;
  description: string | null;
  category_name: string | null;
  employee_name: string | null;
  status: string;
  reject_reason: string | null;
  no_receipt: boolean;
};

export type KasbonRow = {
  id: string;
  employee_id: string;
  employee_no: string;
  full_name: string;
  kasbon_date: string;
  amount: number;
  installment_amount: number;
  description: string | null;
  source: string;
  status: string;
  cancel_reason: string | null;
  deducted: number;
  balance: number;
};

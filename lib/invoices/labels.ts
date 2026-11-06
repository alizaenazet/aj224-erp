// Invoice and receivable labels (FIN-01 … FIN-05), shared by client and server.

/** PRD §13: Invoice & piutang — SA/Dir/Marketing view, Finance manage. */
export const INVOICE_VIEW_ROLES = ["super_admin", "director", "marketing", "finance"] as const;
export const INVOICE_MANAGE_ROLES = ["finance"] as const;

export const INVOICE_STATUSES = ["draft", "issued", "partial", "paid", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  issued: "Terbit",
  partial: "Dibayar Sebagian",
  paid: "Lunas",
  cancelled: "Batal",
};
export const INVOICE_STATUS_VARIANTS: Record<InvoiceStatus, "outline" | "secondary" | "warning" | "success"> = {
  draft: "outline",
  issued: "secondary",
  partial: "warning",
  paid: "success",
  cancelled: "outline",
};

export const INVOICE_KIND_LABELS: Record<string, string> = { term: "Termin", other: "Non-termin", opening: "Saldo awal" };

export const AGING_BUCKETS = ["current", "d1_30", "d31_60", "d61_90", "d90_plus"] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];
export const AGING_LABELS: Record<AgingBucket, string> = {
  current: "Belum Jatuh Tempo",
  d1_30: "1–30 hari",
  d31_60: "31–60 hari",
  d61_90: "61–90 hari",
  d90_plus: "> 90 hari",
};

export type InvoiceRow = {
  id: string;
  number: string | null;
  project_id: string;
  project_code: string;
  project_name: string;
  client_id: string | null;
  client_name: string | null;
  term_id: string | null;
  term_name: string | null;
  kind: "term" | "other" | "opening";
  description: string;
  invoice_date: string;
  due_date: string;
  gross_amount: number;
  dp_deduction: number;
  retention_deduction: number;
  other_deduction: number;
  other_deduction_note: string | null;
  dpp: number;
  ppn_rate: number;
  ppn_amount: number;
  total: number;
  status: InvoiceStatus;
  notes: string | null;
  issued_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  received: number;
  pph: number;
  balance: number;
  days_overdue: number;
  aging_bucket: AgingBucket | null;
};

export type InvoicePayment = {
  id: string;
  payment_date: string;
  amount_received: number;
  pph_amount: number;
  pph_slip_no: string | null;
  bank_label: string | null;
  notes: string | null;
  is_opening: boolean;
  status: "active" | "cancelled";
  cancel_reason: string | null;
};

export type AgingRow = {
  client_id: string | null;
  client_name: string | null;
  project_id: string;
  project_code: string;
  project_name: string;
  current_amount: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90_plus: number;
  total_balance: number;
};

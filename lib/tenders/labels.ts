// Tender labels and §11.1 display helpers (MKT-03 … MKT-08).
import type { ClientStats } from "@/lib/clients/labels";

export const TENDER_STATUSES = [
  "prospect",
  "preparing",
  "submitted",
  "negotiation",
  "won",
  "lost",
  "cancelled",
] as const;
export type TenderStatus = (typeof TENDER_STATUSES)[number];
export const TENDER_STATUS_LABELS: Record<TenderStatus, string> = {
  prospect: "Prospek",
  preparing: "Persiapan Penawaran",
  submitted: "Penawaran Dikirim",
  negotiation: "Negosiasi",
  won: "Menang",
  lost: "Kalah",
  cancelled: "Batal (Tidak Ikut)",
};
export const TENDER_STATUS_VARIANTS: Record<TenderStatus, "outline" | "secondary" | "default" | "destructive"> = {
  prospect: "outline",
  preparing: "outline",
  submitted: "outline",
  negotiation: "outline",
  won: "default",
  lost: "destructive",
  cancelled: "secondary",
};

export const ACTIVE_STATUSES: readonly TenderStatus[] = ["prospect", "preparing", "submitted", "negotiation"];
export const CLOSED_STATUSES: readonly TenderStatus[] = ["won", "lost", "cancelled"];
/** Not yet submitted: deadline reminders and urgency apply (MKT-06, MKT-07). */
export const OPEN_BID_STATUSES: readonly TenderStatus[] = ["prospect", "preparing"];

/** List filter: active (default), all, or one status. */
export const TENDER_FILTERS = ["active", "all", ...TENDER_STATUSES] as const;

export const LOST_REASONS = ["price", "technical", "schedule", "relationship", "administrative", "other"] as const;
export type LostReason = (typeof LOST_REASONS)[number];
export const LOST_REASON_LABELS: Record<LostReason, string> = {
  price: "Harga",
  technical: "Teknis",
  schedule: "Jadwal",
  relationship: "Relasi",
  administrative: "Administrasi",
  other: "Lainnya",
};

export const VOLTAGES = [150, 275, 500] as const;

/** Mendesak: deadline today … +7 days; Lewat batas: passed (open bids only, §11.1). */
export function tenderUrgency(status: TenderStatus, bidDeadline: string | null, today: string) {
  if (!bidDeadline || !OPEN_BID_STATUSES.includes(status)) return null;
  const days = Math.round((Date.parse(bidDeadline) - Date.parse(today)) / 86_400_000);
  if (days < 0) return "overdue" as const;
  if (days <= 7) return "urgent" as const;
  return null;
}

export type TenderRow = {
  id: string;
  name: string;
  client_id: string;
  client: { name: string } | null;
  location: string | null;
  voltage_kv: number | null;
  bid_deadline: string | null;
  bid_value: number | null;
  estimated_cost: number | null;
  win_probability: number | null;
  planned_margin: number | null;
  weighted_value: number | null;
  status: TenderStatus;
  closed_date: string | null;
  pic_id: string | null;
  pic_name: string | null;
  client_stats: ClientStats | null;
};

export type Tender = TenderRow & {
  end_owner: string | null;
  length_kms: number | null;
  tower_count: number | null;
  scope: string | null;
  info_date: string | null;
  lost_reason: LostReason | null;
  lost_note: string | null;
  winner_name: string | null;
  winner_price: number | null;
  notes: string | null;
};

export type BidRevision = {
  id: string;
  revised_at: string;
  old_value: number | null;
  new_value: number | null;
  note: string | null;
  revised_by_name: string | null;
};

/** "15,0%" */
export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

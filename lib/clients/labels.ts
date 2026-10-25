// Client and activity labels (MKT-01, MKT-02), shared by client and server.

export const CLIENT_KINDS = ["epc", "bumn", "pln", "private"] as const;
export type ClientKind = (typeof CLIENT_KINDS)[number];
export const CLIENT_KIND_LABELS: Record<ClientKind, string> = {
  epc: "Kontraktor EPC",
  bumn: "BUMN",
  pln: "PLN",
  private: "Swasta",
};

export const ACTIVITY_KINDS = ["visit", "call", "meeting", "other"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  visit: "Kunjungan",
  call: "Telepon",
  meeting: "Meeting",
  other: "Lainnya",
};

export const CLIENT_STATUSES = ["active", "inactive"] as const;
export const CLIENT_STATUS_LABELS: Record<(typeof CLIENT_STATUSES)[number], string> = {
  active: "Aktif",
  inactive: "Nonaktif",
};

export const FOLLOW_UP_FILTERS = ["open", "done", "all"] as const;
export const FOLLOW_UP_FILTER_LABELS: Record<(typeof FOLLOW_UP_FILTERS)[number], string> = {
  open: "Belum selesai",
  done: "Selesai",
  all: "Semua",
};

/** Roles that see clients, tenders and analytics (PRD §13). */
export const MARKETING_VIEW_ROLES = ["super_admin", "director", "marketing", "finance", "operations"] as const;
/** Roles that manage clients and contacts. */
export const CLIENT_MANAGE_ROLES = ["super_admin", "marketing"] as const;

/** Win-rate figures of a client (client_tender_stats, PRD §11.1). */
export type ClientStats = {
  tender_count: number;
  won_count: number;
  lost_count: number;
  won_value: number;
  lost_value: number;
  win_rate_count: number | null;
  win_rate_value: number | null;
};

export const EMPTY_STATS: ClientStats = {
  tender_count: 0,
  won_count: 0,
  lost_count: 0,
  won_value: 0,
  lost_value: 0,
  win_rate_count: null,
  win_rate_value: null,
};

export type ClientRow = {
  id: string;
  name: string;
  kind: ClientKind;
  address: string | null;
  npwp: string | null;
  payment_term_days: number;
  notes: string | null;
  is_active: boolean;
  stats: ClientStats;
};

export type ContactRow = {
  id: string;
  client_id: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type ActivityRow = {
  id: string;
  client_id: string;
  client_name: string;
  tender_id: string | null;
  tender_name: string | null;
  activity_date: string;
  kind: ActivityKind;
  notes: string;
  follow_up_date: string | null;
  follow_up_done_at: string | null;
  owner_id: string | null;
  owner_name: string | null;
};

/** "66,7%" or "—" when there is no Menang or Kalah tender. */
export function formatRate(rate: number | null | undefined) {
  if (rate === null || rate === undefined) return "—";
  return `${rate.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

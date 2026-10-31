// Tool and delivery note labels (ALT-01 … ALT-07), shared by client and server.

/** PRD §13: Alat & surat jalan — SA/Dir/Finance view, Operasional manage, Lapangan their sites. */
export const EQUIPMENT_VIEW_ROLES = ["super_admin", "director", "finance", "operations", "field"] as const;
export const EQUIPMENT_OFFICE_VIEW_ROLES = ["super_admin", "director", "finance", "operations"] as const;
export const EQUIPMENT_MANAGE_ROLES = ["operations"] as const;

export const CONDITIONS = ["good", "damaged", "repair", "lost"] as const;
export type ToolCondition = (typeof CONDITIONS)[number];
export const CONDITION_LABELS: Record<ToolCondition, string> = {
  good: "Baik",
  damaged: "Rusak",
  repair: "Dalam Perbaikan",
  lost: "Hilang",
};
export const CONDITION_VARIANTS: Record<ToolCondition, "success" | "destructive" | "warning" | "outline"> = {
  good: "success",
  damaged: "destructive",
  repair: "warning",
  lost: "outline",
};
/** Conditions a tool can be sent in. */
export const SENDABLE_CONDITIONS = ["good", "damaged", "repair"] as const;

export const TRACKINGS = ["unit", "quantity"] as const;
export type Tracking = (typeof TRACKINGS)[number];
export const TRACKING_LABELS: Record<Tracking, string> = { unit: "Per Unit", quantity: "Per Jumlah" };

export const OWNERSHIPS = ["owned", "rented"] as const;
export type Ownership = (typeof OWNERSHIPS)[number];
export const OWNERSHIP_LABELS: Record<Ownership, string> = { owned: "Milik Sendiri", rented: "Sewa" };

export const RENTAL_PERIODS = ["day", "month"] as const;
export type RentalPeriod = (typeof RENTAL_PERIODS)[number];
export const RENTAL_PERIOD_LABELS: Record<RentalPeriod, string> = { day: "per hari", month: "per bulan" };

export const NOTE_STATUSES = ["sent", "received", "cancelled"] as const;
export type NoteStatus = (typeof NOTE_STATUSES)[number];
export const NOTE_STATUS_LABELS: Record<NoteStatus, string> = {
  sent: "Dikirim",
  received: "Diterima",
  cancelled: "Batal",
};
export const NOTE_STATUS_VARIANTS: Record<NoteStatus, "secondary" | "success" | "outline"> = {
  sent: "secondary",
  received: "success",
  cancelled: "outline",
};

export const MOVEMENT_LABELS: Record<string, string> = {
  opening: "Saldo awal",
  send: "Dikirim",
  receive: "Diterima",
  shortfall: "Selisih (hilang)",
  condition: "Ubah kondisi",
  adjust: "Penyesuaian",
  cancel: "Surat jalan batal",
};

/** A row of the tool_overview view. */
export type ToolRow = {
  id: string;
  code: string;
  name: string;
  category_id: string;
  category_name: string;
  tracking: Tracking;
  serial_no: string | null;
  ownership: Ownership;
  supplier_id: string | null;
  supplier_name: string | null;
  rental_rate: number | null;
  rental_period: RentalPeriod | null;
  notes: string | null;
  is_active: boolean;
  good: number;
  damaged: number;
  repair: number;
  lost: number;
  in_transit: number;
  total: number;
};

export type StockRow = {
  tool_id: string;
  location_id: string;
  location_name: string;
  location_type: string;
  condition: ToolCondition;
  quantity: number;
};

export type MovementRow = {
  id: number;
  kind: string;
  from_location: string | null;
  to_location: string | null;
  from_condition: ToolCondition | null;
  to_condition: ToolCondition | null;
  quantity: number;
  note: string | null;
  note_number: string | null;
  delivery_note_id: string | null;
  created_by_name: string | null;
  created_at: string;
};

export type NoteRow = {
  id: string;
  number: string;
  from_location_id: string;
  to_location_id: string;
  from_location: string;
  to_location: string;
  note_date: string;
  vehicle: string | null;
  driver: string | null;
  notes: string | null;
  status: NoteStatus;
  sent_by: string | null;
  sent_at: string | null;
  received_by: string | null;
  received_at: string | null;
  receipt_note: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  line_count: number;
};

export type NoteLine = {
  id: string;
  tool_id: string;
  tool_code: string;
  tool_name: string;
  condition: ToolCondition;
  quantity: number;
  received_good: number | null;
  received_damaged: number | null;
  missing: number | null;
  receipt_note: string | null;
};

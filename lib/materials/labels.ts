// Material labels and row types (MAT-01 … MAT-07), shared by client and server.

/** PRD §13: Material & stok — SA/Dir/Finance view, Operasional manage, Lapangan their sites. */
export const MATERIAL_VIEW_ROLES = ["super_admin", "director", "finance", "operations", "field"] as const;
export const MATERIAL_OFFICE_VIEW_ROLES = ["super_admin", "director", "finance", "operations"] as const;
export const MATERIAL_MANAGE_ROLES = ["operations"] as const;
/** Roles that record receipts and usage (Lapangan only at their project). */
export const MATERIAL_RECORD_ROLES = ["operations", "field"] as const;

export const MATERIAL_OWNERSHIPS = ["company", "client"] as const;
export type MaterialOwnership = (typeof MATERIAL_OWNERSHIPS)[number];
export const MATERIAL_OWNERSHIP_LABELS: Record<MaterialOwnership, string> = {
  company: "Milik Perusahaan",
  client: "Titipan Klien",
};

export const TXN_KINDS = ["opening", "receipt", "usage", "return", "opname"] as const;
export type TxnKind = (typeof TXN_KINDS)[number];
export const TXN_KIND_LABELS: Record<TxnKind, string> = {
  opening: "Saldo awal",
  receipt: "Penerimaan",
  usage: "Pemakaian",
  return: "Kembali ke klien",
  opname: "Stok opname",
};
/** Kinds recorded through the transaction form. */
export const RECORDABLE_KINDS = ["receipt", "usage", "return"] as const;
export type RecordableKind = (typeof RECORDABLE_KINDS)[number];

export const TXN_SOURCES = ["supplier", "client"] as const;
export type TxnSource = (typeof TXN_SOURCES)[number];
export const TXN_SOURCE_LABELS: Record<TxnSource, string> = { supplier: "Supplier", client: "Klien" };

export const TXN_STATUSES = ["active", "cancelled"] as const;
export type TxnStatus = (typeof TXN_STATUSES)[number];

export const MOVEMENT_LABELS: Record<string, string> = {
  opening: "Saldo awal",
  receipt: "Penerimaan",
  usage: "Pemakaian",
  return: "Kembali ke klien",
  opname: "Stok opname",
  send: "Dikirim (surat jalan)",
  receive: "Diterima (surat jalan)",
  shortfall: "Selisih (hilang di jalan)",
  cancel: "Pembatalan",
};

/** Quantity with Indonesian decimals, up to 3 places. */
export function formatQuantity(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(Number(value));
}

export type MaterialRow = {
  id: string;
  code: string;
  name: string;
  unit_code: string;
  unit_name: string;
  category_id: string;
  category_name: string;
  ownership: MaterialOwnership;
  min_stock: number | null;
  notes: string | null;
  is_active: boolean;
  on_hand: number;
  in_transit: number;
  total: number;
  low_locations: number;
  /** Quantity at the filtered location (list filter only). */
  at_location?: number | null;
};

export type MaterialStockRow = {
  material_id: string;
  location_id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  quantity: number;
  material_code: string;
  material_name: string;
  unit_code: string;
  min_stock: number | null;
  ownership: MaterialOwnership;
};

export type TxnRow = {
  id: string;
  kind: TxnKind;
  location_id: string;
  location_name: string;
  project_id: string | null;
  txn_date: string;
  source: TxnSource | null;
  supplier_name: string | null;
  doc_no: string | null;
  section_code: string | null;
  notes: string | null;
  status: TxnStatus;
  cancel_reason: string | null;
  created_by: string | null;
  created_at: string;
  line_count: number;
  /** "ACSR-ZB 600 m, INS-150 24 set" */
  summary: string;
};

export type TxnLine = {
  id: string;
  material_id: string;
  material_code: string;
  material_name: string;
  unit_code: string;
  quantity: number;
  system_quantity: number | null;
};

export type MaterialMovementRow = {
  id: number;
  kind: string;
  location_name: string;
  quantity: number;
  delta: number;
  note: string | null;
  transaction_id: string | null;
  delivery_note_id: string | null;
  note_number: string | null;
  created_by_name: string | null;
  created_at: string;
};

export type ReconciliationRow = {
  project_id: string;
  project_code: string;
  project_name: string;
  material_id: string;
  material_code: string;
  material_name: string;
  unit_code: string;
  received: number;
  transferred_in: number;
  transferred_out: number;
  used: number;
  returned: number;
  shrinkage: number;
  on_hand: number;
};

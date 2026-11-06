import "server-only";

import { cache } from "react";
import {
  MATERIAL_OWNERSHIPS,
  TXN_KINDS,
  TXN_STATUSES,
  formatQuantity,
  type MaterialMovementRow,
  type MaterialRow,
  type MaterialStockRow,
  type ReconciliationRow,
  type TxnLine,
  type TxnRow,
} from "@/lib/materials/labels";
import {
  PAGE_SIZE,
  isUuid,
  likePattern,
  parseDateRange,
  parseEnum,
  parsePage,
  parseSort,
  parseText,
  type RawSearchParams,
} from "@/lib/list/params";
import { peopleNames } from "@/lib/people";
import { createClient } from "@/lib/supabase/server";

const NO_ID = "00000000-0000-0000-0000-000000000000";
const MATERIAL_SELECT =
  "id, code, name, unit_code, unit_name, category_id, category_name, ownership, min_stock, notes, is_active, on_hand, in_transit, total, low_locations";

function toMaterialRow(row: Record<string, unknown>): MaterialRow {
  return {
    ...(row as unknown as MaterialRow),
    min_stock: row.min_stock === null ? null : Number(row.min_stock),
    on_hand: Number(row.on_hand),
    in_transit: Number(row.in_transit),
    total: Number(row.total),
  };
}

export const MATERIAL_SORTS = ["code", "name"] as const;

export function parseMaterialListParams(raw: RawSearchParams) {
  const category = parseText(raw.category);
  const location = parseText(raw.location);
  return {
    q: parseText(raw.q),
    category: isUuid(category) ? category : null,
    ownership: parseEnum(raw.ownership, MATERIAL_OWNERSHIPS),
    location: isUuid(location) ? location : null,
    low: parseText(raw.low) === "1",
    sort: parseSort(raw.sort, MATERIAL_SORTS, { column: "code", ascending: true }),
    page: parsePage(raw.page),
  };
}

export type MaterialListParams = ReturnType<typeof parseMaterialListParams>;

/** Material & Stok (MAT-01, MAT-07); `page: null` for export. */
export async function queryMaterials(params: MaterialListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("material_overview").select(MATERIAL_SELECT, { count: "exact" });
  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`code.ilike.${pattern},name.ilike.${pattern}`);
  }
  if (params.category) query = query.eq("category_id", params.category);
  if (params.ownership) query = query.eq("ownership", params.ownership);
  if (params.low) query = query.gt("low_locations", 0);
  let atLocation = new Map<string, number>();
  if (params.location) {
    const { data } = await supabase.from("material_stock").select("material_id, quantity").eq("location_id", params.location);
    atLocation = new Map((data ?? []).map((row) => [row.material_id, Number(row.quantity)]));
    query = query.in("id", atLocation.size ? [...atLocation.keys()] : [NO_ID]);
  }
  query = query.order(params.sort.column, { ascending: params.sort.ascending });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await query;
  const rows = (data ?? []).map((row) => {
    const material = toMaterialRow(row);
    return params.location ? { ...material, at_location: atLocation.get(material.id) ?? 0 } : material;
  });
  return { rows, count: count ?? 0, error };
}

export const getMaterial = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("material_overview").select(MATERIAL_SELECT).eq("id", id).maybeSingle();
  return data ? toMaterialRow(data) : null;
});

type RawStock = {
  material_id: string;
  location_id: string;
  quantity: number;
  location: { code: string; name: string; type: string } | null;
  material: { code: string; name: string; unit_code: string; min_stock: number | null; ownership: string; is_active: boolean } | null;
};

function toStockRow(row: RawStock): MaterialStockRow {
  return {
    material_id: row.material_id,
    location_id: row.location_id,
    location_code: row.location?.code ?? "—",
    location_name: row.location?.name ?? "—",
    location_type: row.location?.type ?? "warehouse",
    quantity: Number(row.quantity),
    material_code: row.material?.code ?? "—",
    material_name: row.material?.name ?? "—",
    unit_code: row.material?.unit_code ?? "",
    min_stock: row.material?.min_stock === null || row.material?.min_stock === undefined ? null : Number(row.material.min_stock),
    ownership: (row.material?.ownership ?? "company") as MaterialStockRow["ownership"],
  };
}

const STOCK_SELECT =
  "material_id, location_id, quantity, location:locations(code, name, type), material:materials(code, name, unit_code, min_stock, ownership, is_active)";

/** Stock of one material per location (MAT-01). */
export async function materialStock(materialId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("material_stock").select(STOCK_SELECT).eq("material_id", materialId);
  return ((data ?? []) as unknown as RawStock[]).map(toStockRow).sort((a, b) => a.location_code.localeCompare(b.location_code));
}

/** Stock at one location (forms, project tab, opname). */
export async function locationMaterialStock(locationId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("material_stock").select(STOCK_SELECT).eq("location_id", locationId);
  return ((data ?? []) as unknown as RawStock[]).map(toStockRow).sort((a, b) => a.material_code.localeCompare(b.material_code));
}

/** All stock rows of active materials (surat jalan form). */
export async function allMaterialStock() {
  const supabase = await createClient();
  const { data } = await supabase.from("material_stock").select(STOCK_SELECT).gt("quantity", 0);
  return ((data ?? []) as unknown as RawStock[]).filter((row) => row.material?.is_active).map(toStockRow);
}

/** Ledger of one material, newest first. */
export async function materialMovements(materialId: string): Promise<MaterialMovementRow[]> {
  const supabase = await createClient();
  const [{ data }, names] = await Promise.all([
    supabase
      .from("material_movements")
      .select("id, kind, quantity, delta, note, transaction_id, delivery_note_id, created_by, created_at, location:locations(name), dn:delivery_notes(number)")
      .eq("material_id", materialId)
      .order("created_at", { ascending: false })
      .limit(200),
    peopleNames(),
  ]);
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    location_name: row.location?.name ?? "—",
    quantity: Number(row.quantity),
    delta: Number(row.delta),
    note: row.note,
    transaction_id: row.transaction_id,
    delivery_note_id: row.delivery_note_id,
    note_number: row.dn?.number ?? null,
    created_by_name: row.created_by ? (names.get(row.created_by) ?? null) : null,
    created_at: row.created_at,
  }));
}

/** Choices for the material form. */
export async function materialFormOptions() {
  const supabase = await createClient();
  const [{ data: categories }, { data: units }, { data: locations }] = await Promise.all([
    supabase.from("item_categories").select("id, name").eq("kind", "material").eq("is_active", true).order("name"),
    supabase.from("units").select("code, name").eq("is_active", true).order("name"),
    supabase.from("locations").select("id, code, name").eq("is_active", true).order("type", { ascending: false }).order("code"),
  ]);
  return {
    categories: (categories ?? []).map((row) => ({ value: row.id, label: row.name })),
    units: (units ?? []).map((row) => ({ value: row.code, label: `${row.name} (${row.code})` })),
    locations: (locations ?? []).map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` })),
  };
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
const TXN_SELECT =
  "id, kind, location_id, txn_date, source, doc_no, notes, status, cancel_reason, created_by, created_at, location:locations(name, project:projects(id)), supplier:suppliers(name), section:project_sections(code), lines:material_transaction_lines(quantity, material:materials(code, unit_code))";

type RawTxn = {
  id: string;
  kind: TxnRow["kind"];
  location_id: string;
  txn_date: string;
  source: TxnRow["source"];
  doc_no: string | null;
  notes: string | null;
  status: TxnRow["status"];
  cancel_reason: string | null;
  created_by: string | null;
  created_at: string;
  location: { name: string; project: { id: string }[] | { id: string } | null } | null;
  supplier: { name: string } | null;
  section: { code: string } | null;
  lines: { quantity: number; material: { code: string; unit_code: string } | null }[];
};

function toTxnRow(row: RawTxn): TxnRow {
  const project = Array.isArray(row.location?.project) ? row.location?.project[0] : row.location?.project;
  return {
    id: row.id,
    kind: row.kind,
    location_id: row.location_id,
    location_name: row.location?.name ?? "—",
    project_id: project?.id ?? null,
    txn_date: row.txn_date,
    source: row.source,
    supplier_name: row.supplier?.name ?? null,
    doc_no: row.doc_no,
    section_code: row.section?.code ?? null,
    notes: row.notes,
    status: row.status,
    cancel_reason: row.cancel_reason,
    created_by: row.created_by,
    created_at: row.created_at,
    line_count: row.lines?.length ?? 0,
    summary: (row.lines ?? [])
      .map((line) => `${line.material?.code ?? "—"} ${formatQuantity(line.quantity)} ${line.material?.unit_code ?? ""}`.trim())
      .join(", "),
  };
}

export function parseTxnListParams(raw: RawSearchParams) {
  const location = parseText(raw.location);
  return {
    q: parseText(raw.q),
    kind: parseEnum(raw.kind, TXN_KINDS),
    status: parseEnum(raw.status, TXN_STATUSES),
    location: isUuid(location) ? location : null,
    range: parseDateRange(raw),
    page: parsePage(raw.page),
  };
}

export type TxnListParams = ReturnType<typeof parseTxnListParams>;

/** Transaksi Material (MAT-02 … MAT-05); `page: null` for export. */
export async function queryTransactions(params: TxnListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("material_transactions").select(TXN_SELECT, { count: "exact" });
  if (params.q) query = query.or(`doc_no.ilike.${likePattern(params.q)},notes.ilike.${likePattern(params.q)}`);
  if (params.kind) query = query.eq("kind", params.kind);
  if (params.status) query = query.eq("status", params.status);
  if (params.location) query = query.eq("location_id", params.location);
  if (params.range.from) query = query.gte("txn_date", params.range.from);
  if (params.range.to) query = query.lte("txn_date", params.range.to);
  query = query.order("txn_date", { ascending: false }).order("created_at", { ascending: false });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await query;
  return { rows: ((data ?? []) as unknown as RawTxn[]).map(toTxnRow), count: count ?? 0, error };
}

export const getTransaction = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("material_transactions").select(TXN_SELECT).eq("id", id).maybeSingle();
  return data ? toTxnRow(data as unknown as RawTxn) : null;
});

export async function transactionLines(txnId: string): Promise<TxnLine[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("material_transaction_lines")
    .select("id, material_id, quantity, system_quantity, material:materials(code, name, unit_code)")
    .eq("transaction_id", txnId)
    .order("sort_order");
  return (data ?? []).map((row) => ({
    id: row.id,
    material_id: row.material_id,
    material_code: row.material?.code ?? "—",
    material_name: row.material?.name ?? "—",
    unit_code: row.material?.unit_code ?? "",
    quantity: Number(row.quantity),
    system_quantity: row.system_quantity === null ? null : Number(row.system_quantity),
  }));
}

/** Locations for the transaction form: all for Operasional, own sites for Lapangan. */
export async function transactionLocations(role: string) {
  const supabase = await createClient();
  let query = supabase.from("locations").select("id, code, name, type").eq("is_active", true);
  if (role === "field") {
    const { data } = await supabase.rpc("user_location_ids");
    const ids = ((data ?? []) as unknown as string[]).map(String);
    query = query.in("id", ids.length ? ids : [NO_ID]);
  }
  const { data } = await query.order("type", { ascending: false }).order("code");
  return (data ?? []).map((row) => ({ value: row.id, label: `${row.code} — ${row.name}`, type: row.type }));
}

/** Data for the receipt/usage/return form. */
export async function transactionFormData(role: string) {
  const supabase = await createClient();
  const [locations, { data: materials }, { data: suppliers }, { data: stock }, { data: projects }] = await Promise.all([
    transactionLocations(role),
    supabase.from("materials").select("id, code, name, unit_code, ownership").eq("is_active", true).order("code"),
    role === "operations"
      ? supabase.from("suppliers").select("id, name").eq("is_active", true).order("name")
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase.from("material_stock").select("material_id, location_id, quantity"),
    supabase.from("projects").select("id, location_id, sections:project_sections(id, code, tower_from, tower_to)"),
  ]);
  return {
    locations,
    materials: (materials ?? []).map((row) => ({ ...row, ownership: row.ownership as MaterialRow["ownership"] })),
    suppliers: (suppliers ?? []).map((row) => ({ value: row.id, label: row.name })),
    stock: (stock ?? []).map((row) => ({ ...row, quantity: Number(row.quantity) })),
    sections: (projects ?? []).flatMap((project) =>
      (project.sections ?? []).map((section) => ({
        location_id: project.location_id as string,
        value: section.id,
        label: `${section.code} (${section.tower_from}–${section.tower_to})`,
      })),
    ),
  };
}

// ---------------------------------------------------------------------------
// Reconciliation (MAT-06)
// ---------------------------------------------------------------------------
export function parseReconciliationParams(raw: RawSearchParams) {
  const project = parseText(raw.project);
  return { project: isUuid(project) ? project : null, q: parseText(raw.q) };
}

export type ReconciliationParams = ReturnType<typeof parseReconciliationParams>;

export async function queryReconciliation(params: ReconciliationParams) {
  const supabase = await createClient();
  let query = supabase
    .from("material_reconciliation")
    .select("project_id, project_code, project_name, material_id, material_code, material_name, unit_code, received, transferred_in, transferred_out, used, returned, shrinkage, on_hand");
  if (params.project) query = query.eq("project_id", params.project);
  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`material_code.ilike.${pattern},material_name.ilike.${pattern}`);
  }
  const { data, error } = await query.order("project_code").order("material_code");
  const rows: ReconciliationRow[] = (data ?? []).map((row) => ({
    project_id: row.project_id as string,
    project_code: row.project_code as string,
    project_name: row.project_name as string,
    material_id: row.material_id as string,
    material_code: row.material_code as string,
    material_name: row.material_name as string,
    unit_code: row.unit_code as string,
    received: Number(row.received),
    transferred_in: Number(row.transferred_in),
    transferred_out: Number(row.transferred_out),
    used: Number(row.used),
    returned: Number(row.returned),
    shrinkage: Number(row.shrinkage),
    on_hand: Number(row.on_hand),
  }));
  return { rows, count: rows.length, error };
}

/** Projects with a location, for filters. */
export async function projectOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id, code, name").not("location_id", "is", null).order("code");
  return (data ?? []).map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` }));
}

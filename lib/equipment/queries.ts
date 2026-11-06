import "server-only";

import { cache } from "react";
import {
  NOTE_STATUSES,
  OWNERSHIPS,
  type MovementRow,
  type NoteLine,
  type NoteMaterialLine,
  type NoteRow,
  type StockRow,
  type ToolCondition,
  type ToolRow,
} from "@/lib/equipment/labels";
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

const TOOL_SELECT =
  "id, code, name, category_id, category_name, tracking, serial_no, ownership, supplier_id, supplier_name, rental_rate, rental_period, notes, is_active, good, damaged, repair, lost, in_transit, total";

export const TOOL_SORTS = ["code", "name"] as const;

export function parseToolListParams(raw: RawSearchParams) {
  const category = parseText(raw.category);
  const location = parseText(raw.location);
  return {
    q: parseText(raw.q),
    category: isUuid(category) ? category : null,
    ownership: parseEnum(raw.ownership, OWNERSHIPS),
    location: isUuid(location) ? location : null,
    sort: parseSort(raw.sort, TOOL_SORTS, { column: "code", ascending: true }),
    page: parsePage(raw.page),
  };
}

export type ToolListParams = ReturnType<typeof parseToolListParams>;

/** Daftar alat with totals per condition (ALT-01, ALT-02); `page: null` for export. */
export async function queryTools(params: ToolListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("tool_overview").select(TOOL_SELECT, { count: "exact" });
  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`code.ilike.${pattern},name.ilike.${pattern},serial_no.ilike.${pattern}`);
  }
  if (params.category) query = query.eq("category_id", params.category);
  if (params.ownership) query = query.eq("ownership", params.ownership);
  if (params.location) {
    const { data } = await supabase.from("tool_stock").select("tool_id").eq("location_id", params.location);
    const ids = [...new Set((data ?? []).map((row) => row.tool_id))];
    query = query.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }
  query = query.order(params.sort.column, { ascending: params.sort.ascending });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await query;
  return { rows: (data ?? []) as ToolRow[], count: count ?? 0, error };
}

export const getTool = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("tool_overview").select(TOOL_SELECT).eq("id", id).maybeSingle();
  return data as ToolRow | null;
});

function stockRows(
  data: { tool_id: string; location_id: string; condition: string; quantity: number; location: { name: string; type: string } | null }[] | null,
): StockRow[] {
  return (data ?? []).map((row) => ({
    tool_id: row.tool_id,
    location_id: row.location_id,
    location_name: row.location?.name ?? "—",
    location_type: row.location?.type ?? "warehouse",
    condition: row.condition as ToolCondition,
    quantity: row.quantity,
  }));
}

/** Stock of one tool per location and condition (ALT-02). */
export async function toolStock(toolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tool_stock")
    .select("tool_id, location_id, condition, quantity, location:locations(name, type)")
    .eq("tool_id", toolId);
  return stockRows(data);
}

/** Stock at one location, with tool codes (send form, project tab). */
export async function locationStock(locationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tool_stock")
    .select("tool_id, location_id, condition, quantity, tool:tools(code, name, tracking), location:locations(name, type)")
    .eq("location_id", locationId);
  return (data ?? []).map((row) => ({
    ...stockRows([row])[0],
    tool_code: row.tool?.code ?? "—",
    tool_name: row.tool?.name ?? "—",
  }));
}

/** All stock rows with tool codes for the delivery note form. */
export async function allStock() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tool_stock")
    .select("tool_id, location_id, condition, quantity, tool:tools(code, name, is_active)");
  return (data ?? [])
    .filter((row) => row.tool?.is_active)
    .map((row) => ({
      tool_id: row.tool_id,
      location_id: row.location_id,
      condition: row.condition as ToolCondition,
      quantity: row.quantity,
      tool_code: row.tool?.code ?? "—",
      tool_name: row.tool?.name ?? "—",
    }));
}

/** Movement ledger of a tool, newest first (ALT-05, ALT-06). */
export async function toolMovements(toolId: string): Promise<MovementRow[]> {
  const supabase = await createClient();
  const [{ data }, names] = await Promise.all([
    supabase
      .from("tool_movements")
      .select(
        "id, kind, from_condition, to_condition, quantity, note, delivery_note_id, created_by, created_at, from:locations!tool_movements_from_location_id_fkey(name), to:locations!tool_movements_to_location_id_fkey(name), dn:delivery_notes(number)",
      )
      .eq("tool_id", toolId)
      .order("created_at", { ascending: false })
      .limit(200),
    peopleNames(),
  ]);
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    from_location: row.from?.name ?? null,
    to_location: row.to?.name ?? null,
    from_condition: row.from_condition as ToolCondition | null,
    to_condition: row.to_condition as ToolCondition | null,
    quantity: row.quantity,
    note: row.note,
    note_number: row.dn?.number ?? null,
    delivery_note_id: row.delivery_note_id,
    created_by_name: row.created_by ? (names.get(row.created_by) ?? null) : null,
    created_at: row.created_at,
  }));
}

/** Stays of a Per Unit tool in days (ALT-06). */
export async function toolStays(toolId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tool_stays")
    .select("location_id, location_name, location_type, start_at, end_at, days")
    .eq("tool_id", toolId)
    .order("start_at", { ascending: false });
  return data ?? [];
}

/** Rented tools on projects with the running cost (ALT-07). */
export async function activeRentals() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("active_rentals")
    .select("tool_id, code, name, supplier_name, rental_rate, rental_period, project_id, project_code, quantity, arrived_at, days, estimated_cost")
    .order("project_code")
    .order("code");
  return (data ?? []).map((row) => ({
    ...row,
    rental_rate: Number(row.rental_rate),
    estimated_cost: Number(row.estimated_cost),
  }));
}

/** Choices for the tool form. */
export async function toolFormOptions() {
  const supabase = await createClient();
  const [{ data: categories }, { data: suppliers }, { data: locations }] = await Promise.all([
    supabase.from("item_categories").select("id, name").eq("kind", "tool").eq("is_active", true).order("name"),
    supabase.from("suppliers").select("id, name").eq("category", "equipment_rental").eq("is_active", true).order("name"),
    supabase.from("locations").select("id, code, name").eq("is_active", true).order("type", { ascending: false }).order("code"),
  ]);
  return {
    categories: (categories ?? []).map((row) => ({ value: row.id, label: row.name })),
    suppliers: (suppliers ?? []).map((row) => ({ value: row.id, label: row.name })),
    locations: (locations ?? []).map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` })),
  };
}

const NOTE_SELECT =
  "id, number, from_location_id, to_location_id, note_date, vehicle, driver, notes, status, sent_by, sent_at, received_by, received_at, receipt_note, cancelled_at, cancel_reason, from:locations!delivery_notes_from_location_id_fkey(name), to:locations!delivery_notes_to_location_id_fkey(name), lines:delivery_note_tool_lines(count), material_lines:delivery_note_material_lines(count)";

type RawNote = Omit<NoteRow, "from_location" | "to_location" | "line_count"> & {
  from: { name: string } | null;
  to: { name: string } | null;
  lines: { count: number }[];
  material_lines: { count: number }[];
};

function toNoteRow(row: RawNote): NoteRow {
  const { from, to, lines, material_lines, ...rest } = row;
  return {
    ...rest,
    from_location: from?.name ?? "—",
    to_location: to?.name ?? "—",
    line_count: (lines?.[0]?.count ?? 0) + (material_lines?.[0]?.count ?? 0),
  };
}

export function parseNoteListParams(raw: RawSearchParams) {
  const location = parseText(raw.location);
  return {
    q: parseText(raw.q),
    status: parseEnum(raw.status, NOTE_STATUSES),
    location: isUuid(location) ? location : null,
    range: parseDateRange(raw),
    page: parsePage(raw.page),
  };
}

export type NoteListParams = ReturnType<typeof parseNoteListParams>;

/** Surat jalan list (ALT-03); `page: null` for export. */
export async function queryNotes(params: NoteListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("delivery_notes").select(NOTE_SELECT, { count: "exact" });
  if (params.q) query = query.ilike("number", likePattern(params.q));
  if (params.status) query = query.eq("status", params.status);
  if (params.location) query = query.or(`from_location_id.eq.${params.location},to_location_id.eq.${params.location}`);
  if (params.range.from) query = query.gte("note_date", params.range.from);
  if (params.range.to) query = query.lte("note_date", params.range.to);
  query = query.order("note_date", { ascending: false }).order("number", { ascending: false });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await query;
  return { rows: ((data ?? []) as unknown as RawNote[]).map(toNoteRow), count: count ?? 0, error };
}

export const getNote = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("delivery_notes").select(NOTE_SELECT).eq("id", id).maybeSingle();
  return data ? toNoteRow(data as unknown as RawNote) : null;
});

export async function noteLines(noteId: string): Promise<NoteLine[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_note_tool_lines")
    .select("id, tool_id, condition, quantity, received_good, received_damaged, missing, receipt_note, tool:tools(code, name)")
    .eq("note_id", noteId)
    .order("sort_order");
  return (data ?? []).map((row) => ({
    id: row.id,
    tool_id: row.tool_id,
    tool_code: row.tool?.code ?? "—",
    tool_name: row.tool?.name ?? "—",
    condition: row.condition as ToolCondition,
    quantity: row.quantity,
    received_good: row.received_good,
    received_damaged: row.received_damaged,
    missing: row.missing,
    receipt_note: row.receipt_note,
  }));
}

/** Material lines of a note (MAT-04). */
export async function noteMaterialLines(noteId: string): Promise<NoteMaterialLine[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_note_material_lines")
    .select("id, material_id, quantity, received_quantity, missing, receipt_note, material:materials(code, name, unit_code)")
    .eq("note_id", noteId)
    .order("sort_order");
  return (data ?? []).map((row) => ({
    id: row.id,
    material_id: row.material_id,
    material_code: row.material?.code ?? "—",
    material_name: row.material?.name ?? "—",
    unit_code: row.material?.unit_code ?? "",
    quantity: Number(row.quantity),
    received_quantity: row.received_quantity === null ? null : Number(row.received_quantity),
    missing: row.missing === null ? null : Number(row.missing),
    receipt_note: row.receipt_note,
  }));
}

/** Notes to or from a location, newest first (project tab). */
export async function notesForLocation(locationId: string) {
  return queryNotes(
    { q: null, status: null, location: locationId, range: { from: null, to: null, gte: null, lt: null }, page: 1 },
    { page: null },
  );
}

/** Locations a user may send between (all active). */
export async function locationOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("locations")
    .select("id, code, name, type")
    .eq("is_active", true)
    .order("type", { ascending: false })
    .order("code");
  return (data ?? []).map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` }));
}

/** Locations of the Lapangan user's active projects (receipt rights). */
export async function userLocationIds() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("user_location_ids");
  return new Set(((data ?? []) as unknown as string[]).map(String));
}

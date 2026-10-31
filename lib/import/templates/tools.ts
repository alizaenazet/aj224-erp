import "server-only";

import { dbErrorMessage } from "@/lib/actions";
import {
  CONDITION_LABELS,
  OWNERSHIP_LABELS,
  RENTAL_PERIOD_LABELS,
  SENDABLE_CONDITIONS,
  TRACKING_LABELS,
  type ToolCondition,
} from "@/lib/equipment/labels";
import { toolSchema, type ToolInput } from "@/lib/equipment/schema";
import { RowReader, normalizeName } from "@/lib/import/cells";
import type { ImportColumn, ImportTemplate, Prepared, RowError } from "@/lib/import/types";

type ToolImport = { tool: ToolInput; location_id: string; condition: ToolCondition; quantity: number };

const SENDABLE_LABELS = Object.fromEntries(SENDABLE_CONDITIONS.map((condition) => [condition, CONDITION_LABELS[condition]])) as Record<
  (typeof SENDABLE_CONDITIONS)[number],
  string
>;

const COLUMNS: ImportColumn[] = [
  { key: "code", header: "Kode", required: true, note: "Unik.", example: "PUL-150", width: 14 },
  { key: "name", header: "Nama", required: true, note: "Nama alat.", example: "Pulley stringing block 150 kV", width: 30 },
  { key: "category_id", header: "Kategori", required: true, note: "Kategori alat yang sudah ada.", example: "Alat Bantu", width: 16 },
  { key: "tracking", header: "Pelacakan", required: true, note: "Per Unit atau Per Jumlah.", example: "Per Jumlah", options: Object.values(TRACKING_LABELS) },
  { key: "serial_no", header: "No. Seri", note: "Wajib untuk Per Unit.", example: "", width: 16 },
  { key: "ownership", header: "Kepemilikan", required: true, note: "Milik Sendiri atau Sewa.", example: "Milik Sendiri", options: Object.values(OWNERSHIP_LABELS) },
  { key: "supplier_id", header: "Supplier Sewa", note: "Untuk Sewa: supplier kategori sewa alat.", example: "", width: 22 },
  { key: "rental_rate", header: "Tarif Sewa", note: "Untuk Sewa.", example: "", format: "rupiah" },
  { key: "rental_period", header: "Periode Sewa", note: "per hari atau per bulan.", example: "", options: Object.values(RENTAL_PERIOD_LABELS) },
  { key: "location_id", header: "Lokasi", required: true, note: "Kode lokasi (gudang/proyek).", example: "GDG-LMG", width: 22 },
  { key: "condition", header: "Kondisi", required: true, note: "Baik, Rusak atau Dalam Perbaikan.", example: "Baik", options: Object.values(SENDABLE_LABELS) },
  { key: "quantity", header: "Jumlah", required: true, note: "Per Unit selalu 1.", example: "30", format: "number" },
];

/** Daftar alat dengan saldo awal (ALT-01, UMM-13); each row goes through create_tool. */
export const toolsTemplate: ImportTemplate<ToolImport> = {
  key: "tools",
  title: "Alat",
  description: "Daftar alat beserta saldo awal per lokasi dan kondisi.",
  roles: ["operations"],
  fileBase: "templat-alat",
  columns: COLUMNS,

  async references(ctx) {
    const [{ data: categories }, { data: locations }, { data: suppliers }] = await Promise.all([
      ctx.supabase.from("item_categories").select("name").eq("kind", "tool").eq("is_active", true).order("name"),
      ctx.supabase.from("locations").select("code, name").eq("is_active", true).order("code"),
      ctx.supabase.from("suppliers").select("name").eq("category", "equipment_rental").eq("is_active", true).order("name"),
    ]);
    return [
      { title: "Kategori", values: (categories ?? []).map((row) => row.name) },
      { title: "Lokasi", values: (locations ?? []).map((row) => `${row.code} — ${row.name}`) },
      { title: "Supplier Sewa", values: (suppliers ?? []).map((row) => row.name) },
    ];
  },

  async prepare(rows, ctx) {
    const [{ data: categories }, { data: locations }, { data: suppliers }, { data: existing }] = await Promise.all([
      ctx.supabase.from("item_categories").select("id, name").eq("kind", "tool"),
      ctx.supabase.from("locations").select("id, code").eq("is_active", true),
      ctx.supabase.from("suppliers").select("id, name").eq("category", "equipment_rental"),
      ctx.supabase.from("tools").select("code"),
    ]);
    const categoryIds = new Map((categories ?? []).map((row) => [normalizeName(row.name), row.id]));
    const locationIds = new Map((locations ?? []).map((row) => [normalizeName(row.code), row.id]));
    const supplierIds = new Map((suppliers ?? []).map((row) => [normalizeName(row.name), row.id]));
    const seen = new Set((existing ?? []).map((row) => normalizeName(row.code)));

    const valid: Prepared<ToolImport>[] = [];
    const errors: RowError[] = [];

    for (const row of rows) {
      const reader = new RowReader(row, COLUMNS);
      const ownership = reader.choice("ownership", OWNERSHIP_LABELS);
      const tool = toolSchema.safeParse({
        code: reader.text("code"),
        name: reader.text("name"),
        category_id: reader.lookup("category_id", categoryIds, "Kategori"),
        tracking: reader.choice("tracking", TRACKING_LABELS),
        serial_no: reader.text("serial_no"),
        ownership,
        supplier_id: ownership === "rented" ? reader.lookup("supplier_id", supplierIds, "Supplier") : null,
        rental_rate: ownership === "rented" ? reader.number("rental_rate") : null,
        rental_period: ownership === "rented" ? reader.choice("rental_period", RENTAL_PERIOD_LABELS) : null,
        notes: null,
      });
      if (!tool.success) reader.zod(tool.error);
      const locationText = reader.text("location_id");
      const locationId = locationText ? reader.lookup("location_id", locationIds, "Lokasi") : null;
      if (!locationText) reader.fail("location_id", "Lokasi wajib diisi.");
      const condition = reader.choice("condition", SENDABLE_LABELS);
      const quantity = reader.number("quantity");
      if (quantity === null || !Number.isInteger(quantity) || quantity < 1) reader.fail("quantity", "Jumlah minimal 1.");
      if (tool.success && tool.data.tracking === "unit" && quantity !== 1) reader.fail("quantity", "Alat Per Unit selalu berjumlah 1.");
      if (tool.success && seen.has(normalizeName(tool.data.code))) reader.fail("code", "Kode alat sudah ada.");

      if (reader.errors.length || !tool.success || !locationId || !condition || quantity === null) {
        errors.push(...reader.errors);
        continue;
      }
      seen.add(normalizeName(tool.data.code));
      valid.push({ row: row.row, value: { tool: tool.data, location_id: locationId, condition, quantity } });
    }
    return { valid, errors };
  },

  async insert(valid, ctx) {
    let inserted = 0;
    const errors: RowError[] = [];
    for (const item of valid) {
      const { error } = await ctx.supabase.rpc("create_tool", {
        p_tool: item.value.tool,
        p_location: item.value.location_id,
        p_condition: item.value.condition,
        p_quantity: item.value.quantity,
      });
      if (error) errors.push({ row: item.row, message: dbErrorMessage(error, "Baris gagal disimpan.") });
      else inserted += 1;
    }
    return { inserted, errors };
  },
};

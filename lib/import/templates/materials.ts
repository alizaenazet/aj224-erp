import "server-only";

import { dbErrorMessage } from "@/lib/actions";
import { RowReader, normalizeName } from "@/lib/import/cells";
import type { ImportColumn, ImportTemplate, Prepared, RowError } from "@/lib/import/types";
import { MATERIAL_OWNERSHIP_LABELS } from "@/lib/materials/labels";
import { materialSchema, type MaterialInput } from "@/lib/materials/schema";

type MaterialImport = { material: MaterialInput; location_id: string | null; quantity: number | null };

const COLUMNS: ImportColumn[] = [
  { key: "code", header: "Kode", required: true, note: "Unik.", example: "GRS-01", width: 14 },
  { key: "name", header: "Nama", required: true, note: "Nama material.", example: "Grease konduktor", width: 30 },
  { key: "unit_code", header: "Satuan", required: true, note: "Kode satuan: m, kg, pcs, set, drum, liter.", example: "kg" },
  { key: "category_id", header: "Kategori", required: true, note: "Kategori material yang sudah ada.", example: "Consumable", width: 18 },
  {
    key: "ownership",
    header: "Kepemilikan",
    required: true,
    note: "Milik Perusahaan atau Titipan Klien.",
    example: "Milik Perusahaan",
    options: Object.values(MATERIAL_OWNERSHIP_LABELS),
  },
  { key: "min_stock", header: "Stok Minimum", note: "Untuk consumable.", example: "20", format: "number" },
  { key: "location_id", header: "Lokasi Saldo Awal", note: "Kode lokasi (gudang/proyek); kosongkan bila tanpa stok.", example: "GDG-LMG", width: 22 },
  { key: "quantity", header: "Jumlah Saldo Awal", note: "Hasil stok opname sebelum go-live.", example: "25", format: "number" },
];

/** Daftar material dengan saldo awal per lokasi (MAT-01, UMM-13); rows go through create_material. */
export const materialsTemplate: ImportTemplate<MaterialImport> = {
  key: "materials",
  title: "Material",
  description: "Daftar material beserta saldo awal per lokasi (termasuk titipan klien di proyek berjalan).",
  roles: ["operations"],
  fileBase: "templat-material",
  columns: COLUMNS,

  async references(ctx) {
    const [{ data: categories }, { data: locations }, { data: units }] = await Promise.all([
      ctx.supabase.from("item_categories").select("name").eq("kind", "material").eq("is_active", true).order("name"),
      ctx.supabase.from("locations").select("code, name").eq("is_active", true).order("code"),
      ctx.supabase.from("units").select("code, name").eq("is_active", true).order("code"),
    ]);
    return [
      { title: "Kategori", values: (categories ?? []).map((row) => row.name) },
      { title: "Satuan", values: (units ?? []).map((row) => `${row.code} — ${row.name}`) },
      { title: "Lokasi", values: (locations ?? []).map((row) => `${row.code} — ${row.name}`) },
    ];
  },

  async prepare(rows, ctx) {
    const [{ data: categories }, { data: locations }, { data: units }, { data: existing }] = await Promise.all([
      ctx.supabase.from("item_categories").select("id, name").eq("kind", "material"),
      ctx.supabase.from("locations").select("id, code").eq("is_active", true),
      ctx.supabase.from("units").select("code").eq("is_active", true),
      ctx.supabase.from("materials").select("code"),
    ]);
    const categoryIds = new Map((categories ?? []).map((row) => [normalizeName(row.name), row.id]));
    const locationIds = new Map((locations ?? []).map((row) => [normalizeName(row.code), row.id]));
    const unitCodes = new Map((units ?? []).map((row) => [normalizeName(row.code), row.code]));
    const seen = new Set((existing ?? []).map((row) => normalizeName(row.code)));

    const valid: Prepared<MaterialImport>[] = [];
    const errors: RowError[] = [];

    for (const row of rows) {
      const reader = new RowReader(row, COLUMNS);
      const material = materialSchema.safeParse({
        code: reader.text("code"),
        name: reader.text("name"),
        unit_code: reader.lookup("unit_code", unitCodes, "Satuan"),
        category_id: reader.lookup("category_id", categoryIds, "Kategori"),
        ownership: reader.choice("ownership", MATERIAL_OWNERSHIP_LABELS),
        min_stock: reader.number("min_stock"),
        notes: null,
      });
      if (!material.success) reader.zod(material.error);
      const quantity = reader.number("quantity");
      const locationText = reader.text("location_id");
      const locationId = locationText ? reader.lookup("location_id", locationIds, "Lokasi") : null;
      if (quantity !== null && quantity < 0) reader.fail("quantity", "Jumlah tidak boleh negatif.");
      if (quantity && !locationText) reader.fail("location_id", "Isi lokasi saldo awal.");
      if (material.success && seen.has(normalizeName(material.data.code))) reader.fail("code", "Kode material sudah ada.");

      if (reader.errors.length || !material.success) {
        errors.push(...reader.errors);
        continue;
      }
      seen.add(normalizeName(material.data.code));
      valid.push({ row: row.row, value: { material: material.data, location_id: locationId, quantity } });
    }
    return { valid, errors };
  },

  async insert(valid, ctx) {
    let inserted = 0;
    const errors: RowError[] = [];
    for (const item of valid) {
      const { error } = await ctx.supabase.rpc("create_material", {
        p_material: item.value.material,
        p_location: item.value.location_id ?? undefined,
        p_quantity: item.value.quantity ?? undefined,
      });
      if (error) errors.push({ row: item.row, message: dbErrorMessage(error, "Baris gagal disimpan.") });
      else inserted += 1;
    }
    return { inserted, errors };
  },
};

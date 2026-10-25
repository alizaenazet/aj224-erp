import "server-only";

import { RowReader, normalizeName } from "@/lib/import/cells";
import { insertPrepared } from "@/lib/import/insert";
import type { ImportColumn, ImportTemplate, Prepared, RowError } from "@/lib/import/types";
import { MASTER_ENTITIES, SUPPLIER_CATEGORIES } from "@/lib/master-data/entities";
import { buildMasterSchema } from "@/lib/master-data/schema";

const supplierSchema = buildMasterSchema(MASTER_ENTITIES.suppliers.fields, "create");
type SupplierImport = Record<string, unknown>;

const CATEGORY_LABELS = Object.fromEntries(SUPPLIER_CATEGORIES.map((option) => [option.value, option.label])) as Record<
  string,
  string
>;

const COLUMNS: ImportColumn[] = [
  { key: "name", header: "Nama", required: true, note: "Unik.", example: "CV Sinar Baja", width: 28 },
  {
    key: "category",
    header: "Kategori",
    required: true,
    note: SUPPLIER_CATEGORIES.map((option) => option.label).join(", ") + ".",
    example: "Material",
    options: SUPPLIER_CATEGORIES.map((option) => option.label),
  },
  { key: "contact_name", header: "Kontak", note: "Nama kontak.", example: "Bapak Hadi", width: 18 },
  { key: "phone", header: "Telepon", note: "Teks.", example: "031-3951234", width: 16 },
  { key: "email", header: "Email", note: "Alamat email.", example: "penjualan@contoh.co.id", width: 24 },
  { key: "address", header: "Alamat", note: "Teks.", example: "Jl. Raya Gresik 12", width: 28 },
  { key: "npwp", header: "NPWP", note: "Tulis sebagai teks.", example: "03.111.222.3-641.000", width: 22 },
  { key: "bank_name", header: "Bank", note: "Teks.", example: "BCA" },
  { key: "bank_account_number", header: "No. Rekening", note: "Tulis sebagai teks.", example: "1880-2201-55", width: 18 },
  { key: "bank_account_holder", header: "Atas Nama", note: "Teks.", example: "CV Sinar Baja", width: 20 },
  { key: "payment_term_days", header: "Termin Pembayaran (hari)", note: "0–365; kosong = 30.", example: "30", format: "number" },
  { key: "notes", header: "Catatan", note: "Teks.", example: "", width: 24 },
];

/** Supplier (MST-03; PRD §16). */
export const suppliersTemplate: ImportTemplate<SupplierImport> = {
  key: "suppliers",
  title: "Supplier",
  description: "Pemasok material, penyewaan alat, transportasi, akomodasi dan lainnya.",
  roles: ["super_admin", "finance"],
  fileBase: "templat-supplier",
  columns: COLUMNS,

  async prepare(rows, ctx) {
    const { data: existing } = await ctx.supabase.from("suppliers").select("name");
    const names = new Set((existing ?? []).map((row) => normalizeName(row.name)));

    const valid: Prepared<SupplierImport>[] = [];
    const errors: RowError[] = [];

    for (const row of rows) {
      const reader = new RowReader(row, COLUMNS);
      const parsed = supplierSchema.safeParse({
        name: reader.text("name") ?? "",
        category: reader.choice("category", CATEGORY_LABELS),
        contact_name: reader.text("contact_name"),
        phone: reader.text("phone"),
        email: reader.text("email"),
        address: reader.text("address"),
        npwp: reader.text("npwp"),
        bank_name: reader.text("bank_name"),
        bank_account_number: reader.text("bank_account_number"),
        bank_account_holder: reader.text("bank_account_holder"),
        payment_term_days: reader.number("payment_term_days") ?? 30,
        notes: reader.text("notes"),
      });
      if (!parsed.success) reader.zod(parsed.error);
      const name = parsed.success ? String(parsed.data.name) : null;
      if (name && names.has(normalizeName(name))) reader.fail("name", "Supplier dengan nama ini sudah ada.");

      if (reader.errors.length || !parsed.success || !name) {
        errors.push(...reader.errors);
        continue;
      }
      names.add(normalizeName(name));
      valid.push({ row: row.row, value: parsed.data });
    }

    return { valid, errors };
  },

  async insert(valid, ctx) {
    const { inserted, errors } = await insertPrepared(valid, (values) =>
      ctx.supabase
        .from("suppliers")
        .insert(values as never)
        .select("id"),
    );
    return { inserted: inserted.length, errors };
  },
};

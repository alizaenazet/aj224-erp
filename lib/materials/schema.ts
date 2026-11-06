import { z } from "zod";
import { MATERIAL_OWNERSHIPS, RECORDABLE_KINDS, TXN_SOURCES } from "@/lib/materials/labels";

// Shared by forms and actions; each schema accepts its own output.

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function emptyNumberToNull(value: unknown) {
  if (value === "" || value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value === "string") return Number(value.replace(",", "."));
  return value;
}

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.");

/** Positive quantity with at most 3 decimals. */
export const quantitySchema = (label: string, { allowZero = false } = {}) =>
  z.preprocess(
    emptyNumberToNull,
    z
      .number({ error: `${label} wajib diisi.` })
      .min(allowZero ? 0 : 0.001, allowZero ? `${label} tidak boleh negatif.` : `${label} harus lebih dari 0.`)
      .max(1_000_000_000, `${label} terlalu besar.`)
      .refine((value) => Math.round(value * 1000) === value * 1000, `${label} maksimal 3 angka desimal.`),
  );

/** MAT-01 */
export const materialSchema = z.object({
  code: z.string().trim().min(1, "Kode wajib diisi.").max(30, "Kode maksimal 30 karakter."),
  name: z.string().trim().min(1, "Nama wajib diisi.").max(120, "Nama maksimal 120 karakter."),
  unit_code: z.string().trim().min(1, "Pilih satuan."),
  category_id: z.uuid("Pilih kategori."),
  ownership: z.enum(MATERIAL_OWNERSHIPS),
  min_stock: z.preprocess(emptyNumberToNull, z.number().min(0, "Stok minimum tidak boleh negatif.").max(1_000_000_000).nullable()),
  notes: z.preprocess(emptyToNull, z.string().max(500, "Catatan maksimal 500 karakter.").nullable()),
});

export type MaterialInput = z.output<typeof materialSchema>;

/** Optional opening stock with a new material. */
export const openingSchema = z
  .object({
    location_id: z.preprocess(emptyToNull, z.uuid().nullable()),
    quantity: z.preprocess(emptyNumberToNull, z.number().min(0, "Jumlah tidak boleh negatif.").nullable()),
  })
  .refine((value) => !value.quantity || value.location_id, { path: ["location_id"], message: "Pilih lokasi saldo awal." });

export type OpeningInput = z.output<typeof openingSchema>;

const lineSchema = z.object({ material_id: z.uuid("Pilih material."), quantity: quantitySchema("Jumlah") });

/** MAT-02, MAT-03 and returns to the client. */
export const transactionSchema = z
  .object({
    kind: z.enum(RECORDABLE_KINDS),
    location_id: z.uuid("Pilih lokasi."),
    txn_date: dateText,
    source: z.preprocess(emptyToNull, z.enum(TXN_SOURCES).nullable()),
    supplier_id: z.preprocess(emptyToNull, z.uuid().nullable()),
    doc_no: z.preprocess(emptyToNull, z.string().max(60, "Nomor dokumen maksimal 60 karakter.").nullable()),
    section_id: z.preprocess(emptyToNull, z.uuid().nullable()),
    notes: z.preprocess(emptyToNull, z.string().max(500, "Catatan maksimal 500 karakter.").nullable()),
    lines: z.array(lineSchema).min(1, "Tambahkan minimal satu material."),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "receipt" && !value.source) {
      ctx.addIssue({ code: "custom", path: ["source"], message: "Pilih sumber penerimaan." });
    }
  });

export type TransactionInput = z.output<typeof transactionSchema>;

/** MAT-05 */
export const opnameSchema = z.object({
  location_id: z.uuid("Pilih lokasi."),
  txn_date: dateText,
  reason: z.string().trim().min(1, "Isi alasan stok opname.").max(300, "Alasan maksimal 300 karakter."),
  lines: z
    .array(z.object({ material_id: z.uuid("Pilih material."), counted_quantity: quantitySchema("Jumlah hitung", { allowZero: true }) }))
    .min(1, "Tambahkan minimal satu material."),
});

export type OpnameInput = z.output<typeof opnameSchema>;

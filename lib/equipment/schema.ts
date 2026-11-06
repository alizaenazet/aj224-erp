import { z } from "zod";
import { CONDITIONS, OWNERSHIPS, RENTAL_PERIODS, SENDABLE_CONDITIONS, TRACKINGS } from "@/lib/equipment/labels";
import { quantitySchema } from "@/lib/materials/schema";

// Shared by forms and actions; each schema accepts its own output.

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function emptyNumberToNull(value: unknown) {
  if (value === "" || value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value === "string") return Number(value);
  return value;
}

const quantity = (label: string) =>
  z.preprocess(
    emptyNumberToNull,
    z.number({ error: `${label} wajib diisi.` }).int(`${label} harus bilangan bulat.`).min(1, `${label} minimal 1.`).max(100000),
  );

/** ALT-01 descriptive fields of a tool. */
export const toolSchema = z
  .object({
    code: z.string().trim().min(1, "Kode wajib diisi.").max(30, "Kode maksimal 30 karakter."),
    name: z.string().trim().min(1, "Nama wajib diisi.").max(120, "Nama maksimal 120 karakter."),
    category_id: z.uuid("Pilih kategori."),
    tracking: z.enum(TRACKINGS),
    serial_no: z.preprocess(emptyToNull, z.string().max(60, "No. seri maksimal 60 karakter.").nullable()),
    ownership: z.enum(OWNERSHIPS),
    supplier_id: z.preprocess(emptyToNull, z.uuid().nullable()),
    rental_rate: z.preprocess(emptyNumberToNull, z.number().min(0).max(1_000_000_000).nullable()),
    rental_period: z.preprocess(emptyToNull, z.enum(RENTAL_PERIODS).nullable()),
    notes: z.preprocess(emptyToNull, z.string().max(500, "Catatan maksimal 500 karakter.").nullable()),
  })
  .superRefine((values, ctx) => {
    if (values.tracking === "unit" && !values.serial_no) {
      ctx.addIssue({ code: "custom", path: ["serial_no"], message: "No. seri wajib untuk alat Per Unit." });
    }
    if (values.ownership === "rented") {
      if (!values.supplier_id) ctx.addIssue({ code: "custom", path: ["supplier_id"], message: "Pilih supplier sewa." });
      if (values.rental_rate === null) ctx.addIssue({ code: "custom", path: ["rental_rate"], message: "Isi tarif sewa." });
      if (!values.rental_period) ctx.addIssue({ code: "custom", path: ["rental_period"], message: "Pilih periode sewa." });
    }
  });

export type ToolInput = z.output<typeof toolSchema>;

/** Opening stock entered with a new tool. */
export const openingSchema = z.object({
  location_id: z.uuid("Pilih lokasi."),
  condition: z.enum(SENDABLE_CONDITIONS),
  quantity: quantity("Jumlah awal"),
});

export type OpeningInput = z.output<typeof openingSchema>;

export const conditionChangeSchema = z
  .object({
    location_id: z.uuid(),
    from: z.enum(CONDITIONS),
    to: z.enum(CONDITIONS),
    quantity: quantity("Jumlah"),
    note: z.string().trim().min(1, "Isi catatan.").max(300, "Catatan maksimal 300 karakter."),
  })
  .refine((values) => values.from !== values.to, { path: ["to"], message: "Pilih kondisi baru yang berbeda." });

export type ConditionChangeInput = z.output<typeof conditionChangeSchema>;

export const adjustmentSchema = z.object({
  location_id: z.uuid("Pilih lokasi."),
  condition: z.enum(CONDITIONS),
  delta: z.preprocess(
    emptyNumberToNull,
    z.number({ error: "Isi jumlah." }).int("Jumlah harus bilangan bulat.").refine((value) => value !== 0, "Jumlah tidak boleh 0."),
  ),
  reason: z.string().trim().min(1, "Isi alasan.").max(300, "Alasan maksimal 300 karakter."),
});

export type AdjustmentInput = z.output<typeof adjustmentSchema>;

/** ALT-03 delivery note as sent. */
export const deliveryNoteSchema = z
  .object({
    from_location_id: z.uuid("Pilih lokasi asal."),
    to_location_id: z.uuid("Pilih lokasi tujuan."),
    note_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid."),
    vehicle: z.preprocess(emptyToNull, z.string().max(60).nullable()),
    driver: z.preprocess(emptyToNull, z.string().max(60).nullable()),
    notes: z.preprocess(emptyToNull, z.string().max(500).nullable()),
    lines: z
      .array(
        z.object({
          tool_id: z.uuid("Pilih alat."),
          condition: z.enum(SENDABLE_CONDITIONS),
          quantity: quantity("Jumlah"),
        }),
      ),
    // MAT-04: material lines on the same note.
    material_lines: z.array(z.object({ material_id: z.uuid("Pilih material."), quantity: quantitySchema("Jumlah material") })),
  })
  .refine((values) => values.from_location_id !== values.to_location_id, {
    path: ["to_location_id"],
    message: "Lokasi tujuan harus berbeda dari asal.",
  })
  .refine((values) => values.lines.length + values.material_lines.length > 0, {
    path: ["lines"],
    message: "Tambahkan minimal satu alat atau material.",
  });

export type DeliveryNoteInput = z.output<typeof deliveryNoteSchema>;

/** ALT-04 receipt per line. */
export const receiptSchema = z.object({
  lines: z.array(
    z.object({
      line_id: z.uuid(),
      received_good: z.number().int().min(0),
      received_damaged: z.number().int().min(0),
      receipt_note: z.preprocess(emptyToNull, z.string().max(300).nullable()),
    }),
  ),
  material_lines: z.array(
    z.object({
      line_id: z.uuid(),
      received_quantity: z.number().min(0),
      receipt_note: z.preprocess(emptyToNull, z.string().max(300).nullable()),
    }),
  ),
  receipt_note: z.preprocess(emptyToNull, z.string().max(500).nullable()),
});

export type ReceiptInput = z.output<typeof receiptSchema>;

import { z } from "zod";
import { LOST_REASONS, TENDER_STATUSES } from "@/lib/tenders/labels";

// Shared by forms and actions; each schema accepts its own output.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AMOUNT = 1_000_000_000_000;

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

const optionalText = (label: string, max: number) =>
  z.preprocess(emptyToNull, z.string().max(max, `${label} maksimal ${max} karakter.`).nullable());

const optionalDate = (label: string) =>
  z.preprocess(emptyToNull, z.string().regex(ISO_DATE, `${label} tidak valid.`).nullable());

const optionalNumber = (label: string, { min = 0, max = MAX_AMOUNT, int = false } = {}) => {
  let number = z.number({ error: `${label} harus angka.` }).min(min, `${label} minimal ${min}.`).max(max, `${label} terlalu besar.`);
  if (int) number = number.int(`${label} harus bilangan bulat.`);
  return z.preprocess(emptyNumberToNull, number.nullable());
};

/** MKT-03 tender data (status has its own dialog). */
export const tenderSchema = z.object({
  name: z
    .string({ error: "Nama paket wajib diisi." })
    .trim()
    .min(1, "Nama paket wajib diisi.")
    .max(200, "Nama paket maksimal 200 karakter."),
  client_id: z.uuid("Pilih klien."),
  end_owner: optionalText("Pemilik akhir", 120),
  location: optionalText("Lokasi", 150),
  voltage_kv: z.preprocess(
    emptyNumberToNull,
    z.union([z.literal(150), z.literal(275), z.literal(500)], "Pilih tegangan.").nullable(),
  ),
  length_kms: optionalNumber("Panjang", { max: 100_000 }),
  tower_count: optionalNumber("Jumlah tower", { max: 100_000, int: true }),
  scope: optionalText("Lingkup pekerjaan", 1000),
  info_date: optionalDate("Tanggal informasi"),
  bid_deadline: optionalDate("Batas penawaran"),
  bid_value: optionalNumber("Nilai penawaran"),
  estimated_cost: optionalNumber("Estimasi biaya"),
  pic_id: z.preprocess(emptyToNull, z.uuid("PIC tidak valid.").nullable()),
  win_probability: optionalNumber("Peluang menang", { max: 100, int: true }),
  notes: optionalText("Catatan", 1000),
});

export type TenderInput = z.output<typeof tenderSchema>;

/** MKT-04 status change; Kalah needs a reason. */
export const tenderStatusSchema = z
  .object({
    status: z.enum(TENDER_STATUSES, "Pilih status."),
    closed_date: optionalDate("Tanggal penutupan"),
    lost_reason: z.preprocess(emptyToNull, z.enum(LOST_REASONS, "Pilih alasan kalah.").nullable()),
    lost_note: optionalText("Keterangan", 500),
    winner_name: optionalText("Pemenang", 150),
    winner_price: optionalNumber("Harga pemenang"),
  })
  .superRefine((values, ctx) => {
    if (values.status === "lost" && !values.lost_reason) {
      ctx.addIssue({ code: "custom", path: ["lost_reason"], message: "Alasan kalah wajib diisi." });
    }
  });

export type TenderStatusInput = z.output<typeof tenderStatusSchema>;

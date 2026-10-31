import { z } from "zod";
import { TERM_CONDITIONS, TERM_KINDS } from "@/lib/projects/labels";

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

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(1, `${label} wajib diisi.`)
    .max(max, `${label} maksimal ${max} karakter.`);

const optionalDate = (label: string) =>
  z.preprocess(emptyToNull, z.string().regex(ISO_DATE, `${label} tidak valid.`).nullable());

const requiredDate = (label: string) =>
  z.string({ error: `${label} wajib diisi.` }).regex(ISO_DATE, `${label} wajib diisi.`);

const optionalNumber = (label: string, { min = 0, max = MAX_AMOUNT, int = false } = {}) => {
  let number = z
    .number({ error: `${label} harus angka.` })
    .min(min, `${label} minimal ${min}.`)
    .max(max, `${label} terlalu besar.`);
  if (int) number = number.int(`${label} harus bilangan bulat.`);
  return z.preprocess(emptyNumberToNull, number.nullable());
};

/** PRJ-01 project data. */
export const projectSchema = z
  .object({
    name: requiredText("Nama proyek", 200),
    client_id: z.uuid("Pilih klien."),
    end_owner: optionalText("Pemilik akhir", 120),
    site: optionalText("Lokasi pekerjaan", 150),
    voltage_kv: z.preprocess(
      emptyNumberToNull,
      z.union([z.literal(150), z.literal(275), z.literal(500)], "Pilih tegangan.").nullable(),
    ),
    length_kms: optionalNumber("Panjang", { max: 100_000 }),
    tower_count: optionalNumber("Jumlah tower", { max: 100_000, int: true }),
    start_date: optionalDate("Tanggal mulai"),
    target_finish_date: optionalDate("Target selesai"),
    notes: optionalText("Catatan", 1000),
  })
  .refine((values) => !values.start_date || !values.target_finish_date || values.target_finish_date >= values.start_date, {
    path: ["target_finish_date"],
    message: "Target selesai tidak boleh sebelum tanggal mulai.",
  });

export type ProjectInput = z.output<typeof projectSchema>;

/** PRJ-02 contract data. */
export const contractSchema = z.object({
  contract_no: optionalText("Nomor kontrak/SPK", 80),
  contract_date: optionalDate("Tanggal kontrak"),
  contract_value: z.preprocess(
    emptyNumberToNull,
    z
      .number({ error: "Nilai kontrak wajib diisi." })
      .min(0, "Nilai kontrak tidak boleh negatif.")
      .max(MAX_AMOUNT, "Nilai kontrak terlalu besar."),
  ),
  ppn_applicable: z.boolean(),
  maintenance_months: optionalNumber("Masa pemeliharaan", { max: 120, int: true }),
  scope: optionalText("Lingkup", 2000),
});

export type ContractInput = z.output<typeof contractSchema>;

/** PRJ-02 addendum: a new value, a new finish date, or both. */
export const addendumSchema = z
  .object({
    addendum_no: requiredText("Nomor addendum", 60),
    addendum_date: requiredDate("Tanggal addendum"),
    new_value: optionalNumber("Nilai baru"),
    new_finish_date: optionalDate("Target selesai baru"),
    description: optionalText("Keterangan", 1000),
  })
  .refine((values) => values.new_value !== null || values.new_finish_date !== null, {
    path: ["new_value"],
    message: "Isi nilai kontrak baru atau target selesai baru.",
  });

export type AddendumInput = z.output<typeof addendumSchema>;

/** PRJ-03 payment term: a percentage or an amount, and its condition. */
export const termSchema = z
  .object({
    name: requiredText("Nama termin", 80),
    kind: z.enum(TERM_KINDS, "Pilih jenis termin."),
    sort_order: z.coerce.number({ error: "Urutan harus angka." }).int().min(1).max(99),
    value_type: z.enum(["percent", "amount"]),
    percent: optionalNumber("Persentase", { max: 100 }),
    amount: optionalNumber("Nilai"),
    condition_type: z.enum(TERM_CONDITIONS, "Pilih syarat."),
    condition_progress: optionalNumber("Progres syarat", { max: 100 }),
    condition_date: optionalDate("Tanggal syarat"),
    notes: optionalText("Catatan", 500),
  })
  .superRefine((values, ctx) => {
    if (values.value_type === "percent" && (values.percent === null || values.percent <= 0)) {
      ctx.addIssue({ code: "custom", path: ["percent"], message: "Persentase wajib diisi (lebih dari 0)." });
    }
    if (values.value_type === "amount" && values.amount === null) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Nilai termin wajib diisi." });
    }
    if (values.condition_type === "progress" && values.condition_progress === null) {
      ctx.addIssue({ code: "custom", path: ["condition_progress"], message: "Isi progres syarat (0–100%)." });
    }
    if (values.condition_type === "date" && values.condition_date === null) {
      ctx.addIssue({ code: "custom", path: ["condition_date"], message: "Isi tanggal syarat." });
    }
  });

export type TermInput = z.output<typeof termSchema>;

/** PRJ-04 budget lines; an empty amount removes the line. */
export const budgetLinesSchema = z.array(
  z.object({
    cost_category_id: z.uuid(),
    amount: optionalNumber("Anggaran"),
    notes: optionalText("Catatan", 300),
  }),
);

export type BudgetLinesInput = z.output<typeof budgetLinesSchema>;

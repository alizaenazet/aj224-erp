import { z } from "zod";

// Shared by forms and actions; each schema accepts its own output.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(1, `${label} wajib diisi.`)
    .max(max, `${label} maksimal ${max} karakter.`);

const requiredDate = (label: string) =>
  z.string({ error: `${label} wajib diisi.` }).regex(ISO_DATE, `${label} wajib diisi.`);

const requiredNumber = (label: string) =>
  z.preprocess(emptyNumberToNull, z.number({ error: `${label} wajib diisi.` }));

/** PRJ-05 pulling section; kms is computed by the database. */
export const sectionSchema = z
  .object({
    code: requiredText("Kode seksi", 20),
    tower_from: requiredText("Tower awal", 20),
    tower_to: requiredText("Tower akhir", 20),
    tower_count: z.preprocess(
      emptyNumberToNull,
      z.number({ error: "Jumlah tower harus angka." }).int("Jumlah tower harus bilangan bulat.").min(0).max(1000).nullable(),
    ),
    length_km: requiredNumber("Panjang").pipe(
      z.number().gt(0, "Panjang harus lebih dari 0.").max(1000, "Panjang terlalu besar."),
    ),
    circuits: requiredNumber("Jumlah sirkuit").pipe(
      z.number().int("Jumlah sirkuit harus bilangan bulat.").min(1, "Jumlah sirkuit 1–4.").max(4, "Jumlah sirkuit 1–4."),
    ),
    planned_start: requiredDate("Rencana mulai"),
    planned_finish: requiredDate("Rencana selesai"),
    sort_order: z.coerce.number({ error: "Urutan harus angka." }).int().min(0).max(9999),
    notes: z.preprocess(emptyToNull, z.string().max(500, "Catatan maksimal 500 karakter.").nullable()),
  })
  .refine((values) => values.planned_finish >= values.planned_start, {
    path: ["planned_finish"],
    message: "Rencana selesai tidak boleh sebelum rencana mulai.",
  });

export type SectionInput = z.output<typeof sectionSchema>;

/** PRJ-06 stage list of one project; weights total 100. */
export const stagesSchema = z
  .array(
    z.object({
      id: z.uuid().nullable(),
      name: requiredText("Nama tahapan", 60),
      weight: requiredNumber("Bobot").pipe(
        z.number().gt(0, "Bobot harus lebih dari 0.").max(100, "Bobot maksimal 100."),
      ),
      sort_order: z.number().int(),
    }),
  )
  .min(1, "Proyek harus memiliki minimal satu tahapan.")
  .superRefine((stages, ctx) => {
    const total = Math.round(stages.reduce((sum, stage) => sum + stage.weight, 0) * 100) / 100;
    if (total !== 100) {
      ctx.addIssue({ code: "custom", message: `Total bobot harus 100 (sekarang ${String(total).replace(".", ",")}).` });
    }
    const names = stages.map((stage) => stage.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: "custom", message: "Nama tahapan tidak boleh sama." });
    }
  });

export type StagesInput = z.output<typeof stagesSchema>;

/** PRJ-06 cumulative progress per stage of one section. */
export const sectionProgressSchema = z.object({
  values: z.array(
    z.object({
      stage_id: z.uuid(),
      progress: requiredNumber("Progres").pipe(
        z.number().min(0, "Progres minimal 0%.").max(100, "Progres maksimal 100%."),
      ),
    }),
  ),
  note: z.preprocess(emptyToNull, z.string().max(300, "Catatan maksimal 300 karakter.").nullable()),
});

export type SectionProgressInput = z.output<typeof sectionProgressSchema>;

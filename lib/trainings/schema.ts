import { z } from "zod";
import { TRAINING_KINDS } from "@/lib/trainings/labels";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const optionalText = (label: string, max: number) =>
  z.preprocess(emptyToNull, z.string().max(max, `${label} maksimal ${max} karakter.`).nullable());

/** HCM-07 training; accepts its own output (zodResolver passes it on). */
export const trainingSchema = z
  .object({
    name: z
      .string({ error: "Nama pelatihan wajib diisi." })
      .trim()
      .min(1, "Nama pelatihan wajib diisi.")
      .max(150, "Nama pelatihan maksimal 150 karakter."),
    kind: z.enum(TRAINING_KINDS, "Pilih jenis pelatihan."),
    organizer: optionalText("Penyelenggara", 120),
    start_date: z
      .string({ error: "Tanggal mulai wajib diisi." })
      .regex(ISO_DATE, "Tanggal mulai wajib diisi."),
    end_date: z.preprocess(emptyToNull, z.string().regex(ISO_DATE, "Tanggal selesai tidak valid.").nullable()),
    location: optionalText("Lokasi", 120),
    certificate_type_id: z.preprocess(emptyToNull, z.uuid("Jenis sertifikat tidak valid.").nullable()),
    notes: optionalText("Catatan", 500),
  })
  .refine((values) => !values.end_date || values.end_date >= values.start_date, {
    path: ["end_date"],
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
  });

export type TrainingInput = z.output<typeof trainingSchema>;

export const employeeIdsSchema = z.array(z.uuid("Karyawan tidak valid.")).max(200, "Maksimal 200 peserta.");

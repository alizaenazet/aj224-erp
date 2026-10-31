import { z } from "zod";

// Shared by the form and the action; accepts its own output.

function emptyNumberToNull(value: unknown) {
  if (value === "" || value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value === "string") return Number(value);
  return value;
}

/** HCM-12 local worker: the minimal data Lapangan collects on site. */
export const localWorkerSchema = z.object({
  full_name: z
    .string({ error: "Nama wajib diisi." })
    .trim()
    .min(1, "Nama wajib diisi.")
    .max(120, "Nama maksimal 120 karakter."),
  nik_ktp: z
    .string({ error: "NIK KTP wajib diisi." })
    .trim()
    .regex(/^\d{16}$/, "NIK KTP harus 16 angka."),
  phone: z
    .string({ error: "No. HP wajib diisi." })
    .trim()
    .regex(/^\+?[0-9][0-9 -]{7,18}$/, "No. HP tidak valid."),
  position_id: z.uuid("Pilih jabatan."),
  daily_wage: z.preprocess(
    emptyNumberToNull,
    z
      .number({ error: "Upah harian wajib diisi." })
      .gt(0, "Upah harian wajib diisi.")
      .max(100_000_000, "Upah harian terlalu besar."),
  ),
});

export type LocalWorkerInput = z.output<typeof localWorkerSchema>;

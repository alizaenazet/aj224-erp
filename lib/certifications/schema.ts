import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const optionalText = (label: string, max: number) =>
  z.preprocess(emptyToNull, z.string().max(max, `${label} maksimal ${max} karakter.`).nullable());

/** HCM-03 certificate; accepts its own output (zodResolver passes it on). */
export const certificateSchema = z
  .object({
    certificate_type_id: z.uuid("Pilih jenis sertifikat."),
    certificate_no: optionalText("Nomor sertifikat", 60),
    issuer: optionalText("Penerbit", 120),
    issued_date: z
      .string({ error: "Tanggal terbit wajib diisi." })
      .regex(ISO_DATE, "Tanggal terbit wajib diisi."),
    expiry_date: z.preprocess(
      emptyToNull,
      z.string().regex(ISO_DATE, "Tanggal kedaluwarsa tidak valid.").nullable(),
    ),
    notes: optionalText("Catatan", 300),
  })
  .refine((values) => !values.expiry_date || values.expiry_date >= values.issued_date, {
    path: ["expiry_date"],
    message: "Tanggal kedaluwarsa tidak boleh sebelum tanggal terbit.",
  });

export type CertificateInput = z.output<typeof certificateSchema>;

/** Expiry suggested from the type's validity; null for lifetime types. */
export function suggestExpiry(issuedDate: string, validityMonths: number | null) {
  if (!validityMonths || !ISO_DATE.test(issuedDate)) return null;
  const [year, month, day] = issuedDate.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + validityMonths, 1));
  // Same day of month, clamped to the month's last day (as Postgres does).
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

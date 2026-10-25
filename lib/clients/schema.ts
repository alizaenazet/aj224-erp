import { z } from "zod";
import { ACTIVITY_KINDS, CLIENT_KINDS } from "@/lib/clients/labels";

// Shared by forms and actions; each schema accepts its own output.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const optionalText = (label: string, max: number) =>
  z.preprocess(emptyToNull, z.string().max(max, `${label} maksimal ${max} karakter.`).nullable());

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(1, `${label} wajib diisi.`)
    .max(max, `${label} maksimal ${max} karakter.`);

/** MKT-01 client. */
export const clientSchema = z.object({
  name: requiredText("Nama perusahaan", 150),
  kind: z.enum(CLIENT_KINDS, "Pilih jenis klien."),
  address: optionalText("Alamat", 300),
  npwp: optionalText("NPWP", 30),
  payment_term_days: z.coerce
    .number({ error: "Termin pembayaran harus angka." })
    .int("Termin pembayaran harus bilangan bulat.")
    .min(0, "Termin pembayaran minimal 0 hari.")
    .max(365, "Termin pembayaran maksimal 365 hari."),
  notes: optionalText("Catatan", 500),
  is_active: z.boolean(),
});

export type ClientInput = z.output<typeof clientSchema>;

/** MKT-01 contact person. */
export const contactSchema = z.object({
  name: requiredText("Nama", 120),
  position: optionalText("Jabatan", 80),
  phone: z.preprocess(
    emptyToNull,
    z.string().regex(/^[0-9+\-\s]{8,20}$/, "No. HP hanya angka, spasi, + atau -, 8–20 karakter.").nullable(),
  ),
  email: z.preprocess(emptyToNull, z.email("Format email tidak valid.").nullable()),
  notes: optionalText("Catatan", 300),
});

export type ContactInput = z.output<typeof contactSchema>;

/** MKT-02 activity with optional follow-up. */
export const activitySchema = z.object({
  activity_date: z
    .string({ error: "Tanggal wajib diisi." })
    .regex(ISO_DATE, "Tanggal wajib diisi."),
  kind: z.enum(ACTIVITY_KINDS, "Pilih jenis aktivitas."),
  notes: requiredText("Catatan", 1000),
  tender_id: z.preprocess(emptyToNull, z.uuid("Tender tidak valid.").nullable()),
  follow_up_date: z.preprocess(emptyToNull, z.string().regex(ISO_DATE, "Tanggal tindak lanjut tidak valid.").nullable()),
});

export type ActivityInput = z.output<typeof activitySchema>;

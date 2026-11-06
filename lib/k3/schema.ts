import { z } from "zod";
import { CLASSIFICATIONS, INVOLVEMENTS, ROOT_CAUSES } from "@/lib/k3/labels";

// Shared by forms and actions; each schema accepts its own output.

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const optionalText = (max: number) => z.preprocess(emptyToNull, z.string().max(max, `Maksimal ${max} karakter.`).nullable());

/** K3-01 */
export const incidentSchema = z.object({
  project_id: z.uuid("Pilih proyek."),
  occurred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Isi tanggal kejadian."),
  occurred_time: z.string().regex(/^\d{2}:\d{2}$/, "Isi jam kejadian."),
  section_id: z.preprocess(emptyToNull, z.uuid().nullable()),
  location_note: optionalText(120),
  classification: z.enum(CLASSIFICATIONS, { error: "Pilih klasifikasi." }),
  chronology: z.string().trim().min(1, "Isi kronologi kejadian.").max(3000, "Kronologi maksimal 3000 karakter."),
  body_parts: optionalText(300),
  witnesses: optionalText(300),
  immediate_action: optionalText(1000),
  people: z.array(
    z
      .object({
        employee_id: z.preprocess(emptyToNull, z.uuid().nullable()),
        external_name: optionalText(120),
        involvement: z.enum(INVOLVEMENTS),
        injury: optionalText(200),
      })
      .refine((person) => Boolean(person.employee_id) !== Boolean(person.external_name), {
        message: "Setiap orang terlibat: pilih karyawan atau isi nama pihak luar.",
      }),
  ),
});

export type IncidentInput = z.output<typeof incidentSchema>;

/** K3-03 */
export const investigationSchema = z.object({
  direct_cause: optionalText(1000),
  root_cause: z.enum(ROOT_CAUSES, { error: "Pilih akar masalah." }),
  lost_days: z.coerce.number({ error: "Isi hari kerja hilang." }).int().min(0, "Tidak boleh negatif.").max(3650),
});

export type InvestigationInput = z.output<typeof investigationSchema>;

/** K3-04 */
export const actionSchema = z.object({
  description: z.string().trim().min(1, "Isi uraian tindakan.").max(500),
  pic_employee_id: z.uuid("Pilih PIC."),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Isi tenggat."),
});

export type ActionInput = z.output<typeof actionSchema>;

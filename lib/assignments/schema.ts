import { z } from "zod";

// Shared by forms and actions; each schema accepts its own output.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const optionalDate = (label: string) =>
  z.preprocess(emptyToNull, z.string().regex(ISO_DATE, `${label} tidak valid.`).nullable());

/** HCM-05 assignment; the override reason is required only when the employee is not fit (HCM-06). */
export const assignmentSchema = z
  .object({
    employee_id: z.uuid("Pilih karyawan."),
    project_id: z.uuid("Pilih proyek."),
    position_id: z.uuid("Pilih jabatan."),
    start_date: z.string({ error: "Tanggal mulai wajib diisi." }).regex(ISO_DATE, "Tanggal mulai wajib diisi."),
    end_date: optionalDate("Tanggal selesai"),
    notes: z.preprocess(emptyToNull, z.string().max(500, "Catatan maksimal 500 karakter.").nullable()),
    override_reason: z.preprocess(emptyToNull, z.string().max(500, "Alasan maksimal 500 karakter.").nullable()),
  })
  .refine((values) => !values.end_date || values.end_date >= values.start_date, {
    path: ["end_date"],
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
  });

export type AssignmentInput = z.output<typeof assignmentSchema>;

export const endAssignmentSchema = z.object({
  end_date: z.string({ error: "Tanggal selesai wajib diisi." }).regex(ISO_DATE, "Tanggal selesai wajib diisi."),
  notes: z.preprocess(emptyToNull, z.string().max(500, "Catatan maksimal 500 karakter.").nullable()),
});

export type EndAssignmentInput = z.output<typeof endAssignmentSchema>;

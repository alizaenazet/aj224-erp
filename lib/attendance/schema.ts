import { z } from "zod";
import { ATTENDANCE_STATUSES } from "@/lib/attendance/labels";

// Shared by forms and actions; each schema accepts its own output.

/** One saved sheet: a project day (or kantor) with one row per person (HCM-09, HCM-10). */
export const attendanceSheetSchema = z.object({
  project_id: z.uuid().nullable(),
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid."),
  rows: z
    .array(
      z
        .object({
          employee_id: z.uuid(),
          status: z.enum(ATTENDANCE_STATUSES, "Pilih status."),
          overtime_hours: z
            .number({ error: "Jam lembur harus angka." })
            .min(0, "Jam lembur minimal 0.")
            .max(24, "Jam lembur maksimal 24."),
          notes: z.string().max(200, "Catatan maksimal 200 karakter.").nullable(),
        })
        .refine((row) => row.status === "present" || row.overtime_hours === 0, {
          path: ["overtime_hours"],
          message: "Lembur hanya untuk status Hadir.",
        }),
    )
    .min(1, "Tidak ada kru untuk disimpan."),
});

export type AttendanceSheetInput = z.output<typeof attendanceSheetSchema>;

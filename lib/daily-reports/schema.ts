import { z } from "zod";
import { OBSTACLE_CATEGORIES, WEATHERS } from "@/lib/daily-reports/labels";

// Shared by the field form and the action; accepts its own output.

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

const weather = z.preprocess(emptyToNull, z.enum(WEATHERS).nullable());
const optionalText = (label: string, max: number) =>
  z.preprocess(emptyToNull, z.string().max(max, `${label} maksimal ${max} karakter.`).nullable());

/** OPS-01 daily report as sent from the field form. */
export const dailyReportSchema = z
  .object({
    project_id: z.uuid("Pilih proyek."),
    report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid."),
    no_activity: z.boolean(),
    no_activity_reason: optionalText("Alasan", 300),
    weather_morning: weather,
    weather_midday: weather,
    weather_afternoon: weather,
    effective_hours: z.preprocess(
      emptyNumberToNull,
      z.number({ error: "Jam kerja harus angka." }).min(0, "Jam kerja minimal 0.").max(24, "Jam kerja maksimal 24.").nullable(),
    ),
    safety_briefing: z.boolean(),
    briefing_participants: z.preprocess(
      emptyNumberToNull,
      z.number({ error: "Peserta harus angka." }).int("Peserta harus bilangan bulat.").min(0).max(500).nullable(),
    ),
    equipment_used: optionalText("Alat utama", 500),
    plan_tomorrow: optionalText("Rencana esok", 500),
    notes: optionalText("Catatan", 1000),
    activities: z.array(
      z.object({
        section_id: z.uuid("Pilih seksi."),
        stage_id: z.uuid("Pilih tahapan."),
        progress_after: z.preprocess(
          emptyNumberToNull,
          z.number({ error: "Isi progres kumulatif." }).min(0, "Progres minimal 0%.").max(100, "Progres maksimal 100%."),
        ),
        notes: optionalText("Keterangan", 300),
      }),
    ),
    obstacles: z.array(
      z.object({
        category: z.enum(OBSTACLE_CATEGORIES, "Pilih kategori kendala."),
        description: z.string().trim().min(1, "Isi keterangan kendala.").max(500, "Keterangan maksimal 500 karakter."),
      }),
    ),
  })
  .superRefine((values, ctx) => {
    if (values.no_activity) {
      if (!values.no_activity_reason) {
        ctx.addIssue({ code: "custom", path: ["no_activity_reason"], message: "Isi alasan Tidak Ada Kegiatan." });
      }
      return;
    }
    if (values.safety_briefing && values.briefing_participants === null) {
      ctx.addIssue({ code: "custom", path: ["briefing_participants"], message: "Isi jumlah peserta briefing." });
    }
    if (values.activities.length === 0) {
      ctx.addIssue({ code: "custom", path: ["activities"], message: "Tambahkan minimal satu aktivitas, atau tandai Tidak Ada Kegiatan." });
    }
    const keys = values.activities.map((activity) => `${activity.section_id}|${activity.stage_id}`);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({ code: "custom", path: ["activities"], message: "Seksi dan tahapan yang sama tercatat dua kali." });
    }
  });

export type DailyReportInput = z.output<typeof dailyReportSchema>;

export const reviewSchema = z
  .object({
    action: z.enum(["reviewed", "revision"]),
    comment: optionalText("Komentar", 500),
  })
  .refine((values) => values.action !== "revision" || Boolean(values.comment), {
    path: ["comment"],
    message: "Isi komentar revisi.",
  });

export type ReviewInput = z.output<typeof reviewSchema>;

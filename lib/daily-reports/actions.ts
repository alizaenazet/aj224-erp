"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import { dailyReportSchema, reviewSchema, type DailyReportInput, type ReviewInput } from "@/lib/daily-reports/schema";
import { createClient } from "@/lib/supabase/server";

function revalidateReports(projectId: string) {
  revalidatePath("/operations/daily-reports", "layout");
  revalidatePath(`/projects/${projectId}`, "layout");
  revalidatePath("/projects");
  revalidatePath("/");
}

/** Sends (or re-sends) the report of a project day; progress is applied by the database (OPS-01). */
export async function saveDailyReport(input: DailyReportInput): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["operations", "field"]);
  if (!auth.ok) return auth;

  const parsed = dailyReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const { project_id, report_date, activities, obstacles, ...report } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_daily_report", {
    p_project: project_id,
    p_date: report_date,
    p_report: report,
    p_activities: report.no_activity ? [] : activities,
    p_obstacles: report.no_activity ? [] : obstacles,
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateReports(project_id);
  return { ok: true, message: "Laporan harian terkirim.", data: { id: data as string } };
}

/** Sudah Diperiksa or Perlu Revisi with a comment (OPS-03). */
export async function reviewDailyReport(input: { id: string; projectId: string; values: ReviewInput }): Promise<ActionResult> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;

  const id = z.uuid().safeParse(input.id);
  if (!id.success) return { ok: false, error: "Laporan tidak valid." };
  const parsed = reviewSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_daily_report", {
    p_report: id.data,
    p_action: parsed.data.action,
    p_comment: parsed.data.comment ?? "",
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateReports(input.projectId);
  return {
    ok: true,
    message: parsed.data.action === "reviewed" ? "Laporan ditandai Sudah Diperiksa." : "Permintaan revisi dikirim ke pelapor.",
  };
}

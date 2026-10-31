import "server-only";

import { cache } from "react";
import {
  REPORT_STATUSES,
  type ObstacleCategory,
  type ReportActivity,
  type ReportObstacle,
  type ReportRow,
} from "@/lib/daily-reports/labels";
import {
  PAGE_SIZE,
  isUuid,
  parseDateRange,
  parseEnum,
  parsePage,
  parseSort,
  parseText,
  type RawSearchParams,
} from "@/lib/list/params";
import { createClient } from "@/lib/supabase/server";

const LIST_SELECT =
  "id, project_id, report_date, status, no_activity, no_activity_reason, weather_morning, weather_midday, weather_afternoon, effective_hours, safety_briefing, briefing_participants, equipment_used, plan_tomorrow, notes, submitted_by, submitted_at, reviewed_by, reviewed_at, review_comment, project_code, project_name, workforce, activity_count, obstacle_count, photo_count";

export const REPORT_SORTS = ["report_date", "project_code"] as const;

export function parseReportListParams(raw: RawSearchParams) {
  const project = parseText(raw.project);
  return {
    project: isUuid(project) ? project : null,
    status: parseEnum(raw.status, REPORT_STATUSES),
    range: parseDateRange(raw),
    sort: parseSort(raw.sort, REPORT_SORTS, { column: "report_date", ascending: false }),
    page: parsePage(raw.page),
  };
}

export type ReportListParams = ReturnType<typeof parseReportListParams>;

/** Laporan Harian list (OPS-03); `page: null` returns all rows (export). */
export async function queryReports(params: ReportListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("daily_report_list").select(LIST_SELECT, { count: "exact" });
  if (params.project) query = query.eq("project_id", params.project);
  if (params.status) query = query.eq("status", params.status);
  if (params.range.from) query = query.gte("report_date", params.range.from);
  if (params.range.to) query = query.lte("report_date", params.range.to);
  query = query.order(params.sort.column, { ascending: params.sort.ascending }).order("project_code");
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await query;
  return { rows: (data ?? []) as ReportRow[], count: count ?? 0, error };
}

export const getReport = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("daily_report_list").select(LIST_SELECT).eq("id", id).maybeSingle();
  return data as ReportRow | null;
});

export async function reportForDay(projectId: string, date: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_report_list")
    .select(LIST_SELECT)
    .eq("project_id", projectId)
    .eq("report_date", date)
    .maybeSingle();
  return data as ReportRow | null;
}

export async function reportActivities(reportId: string): Promise<ReportActivity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_report_activities")
    .select("section_id, stage_id, progress_after, notes, section:project_sections(code), stage:project_stages(name)")
    .eq("report_id", reportId)
    .order("sort_order");
  return (data ?? []).map((row) => ({
    section_id: row.section_id,
    stage_id: row.stage_id,
    section_code: row.section?.code ?? "—",
    stage_name: row.stage?.name ?? "—",
    progress_after: Number(row.progress_after),
    notes: row.notes,
  }));
}

export async function reportObstacles(reportId: string): Promise<ReportObstacle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_report_obstacles")
    .select("category, description")
    .eq("report_id", reportId)
    .order("sort_order");
  return (data ?? []).map((row) => ({ category: row.category as ObstacleCategory, description: row.description }));
}

/** OPS-02 recap per category for a project. */
export async function obstacleSummary(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_report_obstacle_summary")
    .select("category, obstacle_count, last_date")
    .eq("project_id", projectId)
    .order("obstacle_count", { ascending: false });
  return (data ?? []).map((row) => ({
    category: row.category as ObstacleCategory,
    count: row.obstacle_count,
    last_date: row.last_date,
  }));
}

/** OPS-03: running projects without a report for yesterday. */
export async function missingReports() {
  const supabase = await createClient();
  const { data } = await supabase.from("missing_daily_reports").select("project_id, code, name, report_date").order("code");
  return data ?? [];
}

/** Sections, stages and current progress for the report form of a project. */
export async function reportFormContext(projectId: string) {
  const supabase = await createClient();
  const [{ data: sections }, { data: stages }] = await Promise.all([
    supabase.from("project_sections").select("id, code, tower_from, tower_to").eq("project_id", projectId).order("sort_order").order("code"),
    supabase.from("project_stages").select("id, name").eq("project_id", projectId).order("sort_order"),
  ]);
  const sectionIds = (sections ?? []).map((section) => section.id);
  const { data: cells } = sectionIds.length
    ? await supabase.from("section_progress").select("section_id, stage_id, progress").in("section_id", sectionIds)
    : { data: [] as { section_id: string; stage_id: string; progress: number }[] };
  const current: Record<string, number> = {};
  for (const cell of cells ?? []) current[`${cell.section_id}|${cell.stage_id}`] = Number(cell.progress);
  return {
    sections: (sections ?? []).map((section) => ({
      value: section.id,
      label: `${section.code} (${section.tower_from} – ${section.tower_to})`,
    })),
    stages: (stages ?? []).map((stage) => ({ value: stage.id, label: stage.name })),
    current,
  };
}

/** Field input window in days (system parameter backdate_days, PRD §5 A5). */
export const backdateDays = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("backdate_days");
  return typeof data === "number" ? data : 3;
});

/** Signed URLs of a report's photos for printing (OPS-04). */
export async function reportPhotoUrls(reportId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attachments")
    .select("path, file_name, created_at")
    .eq("entity_type", "daily_report")
    .eq("entity_id", reportId)
    .eq("category", "photo")
    .order("created_at");
  const rows = data ?? [];
  if (!rows.length) return [];
  const { data: signed } = await supabase.storage.from("project-files").createSignedUrls(
    rows.map((row) => row.path),
    600,
  );
  return rows.map((row, index) => ({
    url: signed?.[index]?.signedUrl ?? null,
    file_name: row.file_name,
    created_at: row.created_at,
  }));
}

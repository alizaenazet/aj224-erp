import "server-only";

import { isUuid } from "@/lib/list/params";
import { peopleNames } from "@/lib/people";
import type {
  CurvePoint,
  ProgressCells,
  ProgressLogRow,
  ProjectProgress,
  SectionRow,
  StageRow,
} from "@/lib/progress/labels";
import { createClient } from "@/lib/supabase/server";

const SECTION_SELECT =
  "id, project_id, code, tower_from, tower_to, tower_count, length_km, circuits, kms, planned_start, planned_finish, sort_order, notes, progress, planned_progress, state";

export async function projectStages(projectId: string): Promise<StageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_stages")
    .select("id, name, weight, sort_order")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("name");
  return (data ?? []).map((row) => ({ ...row, weight: Number(row.weight) }));
}

/** Sections with their progress and plan (section_progress_summary, §11.2). */
export async function projectSections(projectId: string): Promise<SectionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("section_progress_summary")
    .select(SECTION_SELECT)
    .eq("project_id", projectId)
    .order("sort_order")
    .order("code");
  return (data ?? []).map((row) => ({
    ...(row as SectionRow),
    length_km: Number(row.length_km),
    kms: Number(row.kms),
    progress: Number(row.progress),
    planned_progress: Number(row.planned_progress),
  }));
}

/** Current progress per section and stage (missing cells are 0%). */
export async function progressCells(sectionIds: string[]): Promise<ProgressCells> {
  if (!sectionIds.length) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("section_progress")
    .select("section_id, stage_id, progress")
    .in("section_id", sectionIds);
  const cells: ProgressCells = {};
  for (const row of data ?? []) {
    (cells[row.section_id] ??= {})[row.stage_id] = Number(row.progress);
  }
  return cells;
}

/** Project progress, plan and deviation (project_progress, §11.2); null without sections. */
export async function projectProgress(projectId: string): Promise<ProjectProgress | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_progress")
    .select("section_count, total_kms, progress, planned_progress, deviation")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data) return null;
  return {
    section_count: Number(data.section_count),
    total_kms: Number(data.total_kms),
    progress: Number(data.progress),
    planned_progress: Number(data.planned_progress),
    deviation: Number(data.deviation),
  };
}

/** Latest progress changes with their source (PRJ-06). */
export async function progressLog(projectId: string, limit = 50): Promise<ProgressLogRow[]> {
  const supabase = await createClient();
  const [{ data }, names] = await Promise.all([
    supabase
      .from("progress_updates")
      .select(
        "id, created_at, old_progress, new_progress, source, note, created_by, section:project_sections(code), stage:project_stages(name)",
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit),
    peopleNames(),
  ]);
  return (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    section_code: row.section?.code ?? "—",
    stage_name: row.stage?.name ?? "—",
    old_progress: Number(row.old_progress),
    new_progress: Number(row.new_progress),
    source: row.source,
    note: row.note,
    created_by_name: row.created_by ? (names.get(row.created_by) ?? null) : null,
  }));
}

/** Weekly plan vs actual (PRJ-08). */
export async function progressCurve(projectId: string): Promise<CurvePoint[]> {
  if (!isUuid(projectId)) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("project_progress_curve", { p_project: projectId });
  return (data ?? []).map((row) => ({
    week_end: row.week_end,
    planned: row.planned === null ? null : Number(row.planned),
    actual: row.actual === null ? null : Number(row.actual),
  }));
}

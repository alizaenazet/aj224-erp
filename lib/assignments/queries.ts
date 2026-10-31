import "server-only";

import { ASSIGNMENT_STATES, type AssignmentRow } from "@/lib/assignments/labels";
import {
  PAGE_SIZE,
  isUuid,
  likePattern,
  parseEnum,
  parsePage,
  parseSort,
  parseText,
  type RawSearchParams,
} from "@/lib/list/params";
import { createClient } from "@/lib/supabase/server";

const LIST_SELECT =
  "id, employee_id, project_id, position_id, start_date, end_date, notes, override_reason, overridden_at, employee_no, employee_name, work_type, verification_status, employee_active, project_code, project_name, project_status, position_name, state, cert_state, cert_issues";

export const ASSIGNMENT_SORTS = ["start_date", "employee_name", "project_code"] as const;

export function parseAssignmentListParams(raw: RawSearchParams) {
  const project = parseText(raw.project);
  return {
    q: parseText(raw.q),
    project: isUuid(project) ? project : null,
    state: parseEnum(raw.state, ASSIGNMENT_STATES),
    override: parseText(raw.override) === "1",
    sort: parseSort(raw.sort, ASSIGNMENT_SORTS, { column: "start_date", ascending: false }),
    page: parsePage(raw.page),
  };
}

export type AssignmentListParams = ReturnType<typeof parseAssignmentListParams>;

/** Penugasan list (HCM-05); `page: null` returns all rows (export). */
export async function queryAssignments(params: AssignmentListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("assignment_list").select(LIST_SELECT, { count: "exact" });

  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`employee_name.ilike.${pattern},employee_no.ilike.${pattern}`);
  }
  if (params.project) query = query.eq("project_id", params.project);
  if (params.state) query = query.eq("state", params.state);
  if (params.override) query = query.not("overridden_at", "is", null);

  query = query.order(params.sort.column, { ascending: params.sort.ascending }).order("id");
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  return { rows: (data ?? []) as AssignmentRow[], count: count ?? 0, error };
}

/** Crew of a project on a date: assignments covering it (HCM-05). */
export async function projectCrew(projectId: string, onDate: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignment_list")
    .select(LIST_SELECT)
    .eq("project_id", projectId)
    .lte("start_date", onDate)
    .or(`end_date.is.null,end_date.gte.${onDate}`)
    .order("employee_name");
  const rows = (data ?? []) as AssignmentRow[];

  // Someone who left before this date is not crew, even when an assignment
  // starting after their exit date was kept for one day (HCM-01).
  const leftIds = rows.filter((row) => !row.employee_active).map((row) => row.employee_id);
  if (!leftIds.length) return rows;
  const { data: left } = await supabase.from("employees").select("id, exit_date").in("id", leftIds);
  const exitDates = new Map((left ?? []).map((row) => [row.id, row.exit_date]));
  return rows.filter((row) => {
    const exitDate = exitDates.get(row.employee_id);
    return !exitDate || exitDate >= onDate;
  });
}

/** Active employees for the assignment form, with their own position. */
export async function assignableEmployees() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, employee_no, full_name, position_id, work_type")
    .eq("is_active", true)
    .order("full_name");
  return (data ?? []).map((row) => ({
    value: row.id,
    label: `${row.full_name} (${row.employee_no})`,
    position_id: row.position_id,
  }));
}

/** Projects that can receive assignments (not completed or closed). */
export async function assignableProjects() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, code, name, status")
    .in("status", ["preparing", "running", "on_hold"])
    .order("code", { ascending: false });
  return (data ?? []).map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` }));
}

/** Projects that have assignments, for the list filter. */
export async function assignmentProjectOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id, code").order("code", { ascending: false });
  return (data ?? []).map((row) => ({ value: row.id, label: row.code }));
}

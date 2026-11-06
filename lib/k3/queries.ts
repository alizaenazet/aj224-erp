import "server-only";

import { cache } from "react";
import { todayWib } from "@/lib/format";
import {
  CLASSIFICATIONS,
  INCIDENT_STATUSES,
  type IncidentAction,
  type IncidentPerson,
  type IncidentRow,
  type K3StatsRow,
} from "@/lib/k3/labels";
import {
  PAGE_SIZE,
  isUuid,
  likePattern,
  parseDateRange,
  parseEnum,
  parsePage,
  parseText,
  type RawSearchParams,
} from "@/lib/list/params";
import { createClient } from "@/lib/supabase/server";

const INCIDENT_SELECT =
  "id, number, project_id, project_code, project_name, occurred_at, occurred_on, section_id, section_code, location_note, classification, chronology, body_parts, witnesses, immediate_action, status, direct_cause, root_cause, lost_days, investigated_by, investigated_at, closed_by, closed_at, cancel_reason, reported_by, created_at, action_count, open_actions, overdue_actions";

export function parseIncidentListParams(raw: RawSearchParams) {
  const project = parseText(raw.project);
  return {
    q: parseText(raw.q),
    project: isUuid(project) ? project : null,
    classification: parseEnum(raw.classification, CLASSIFICATIONS),
    status: parseEnum(raw.status, INCIDENT_STATUSES),
    range: parseDateRange(raw),
    page: parsePage(raw.page),
  };
}

export type IncidentListParams = ReturnType<typeof parseIncidentListParams>;

/** Insiden K3 (K3-01 … K3-04); `page: null` for export. */
export async function queryIncidents(params: IncidentListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("incident_list").select(INCIDENT_SELECT, { count: "exact" });
  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`number.ilike.${pattern},chronology.ilike.${pattern},location_note.ilike.${pattern}`);
  }
  if (params.project) query = query.eq("project_id", params.project);
  if (params.classification) query = query.eq("classification", params.classification);
  if (params.status) query = query.eq("status", params.status);
  if (params.range.from) query = query.gte("occurred_on", params.range.from);
  if (params.range.to) query = query.lte("occurred_on", params.range.to);
  query = query.order("occurred_at", { ascending: false });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data, count, error } = await query;
  return { rows: (data ?? []) as IncidentRow[], count: count ?? 0, error };
}

export const getIncident = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("incident_list").select(INCIDENT_SELECT).eq("id", id).maybeSingle();
  return (data as IncidentRow | null) ?? null;
});

export async function incidentPeople(incidentId: string): Promise<IncidentPerson[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("incident_people")
    .select("id, employee_id, external_name, involvement, injury, employee:employees(full_name, employee_no)")
    .eq("incident_id", incidentId)
    .order("sort_order");
  return (data ?? []).map((row) => ({
    id: row.id,
    employee_id: row.employee_id,
    employee_name: row.employee ? `${row.employee.full_name} (${row.employee.employee_no})` : null,
    external_name: row.external_name,
    involvement: row.involvement as IncidentPerson["involvement"],
    injury: row.injury,
  }));
}

export async function incidentActions(incidentId: string): Promise<IncidentAction[]> {
  const supabase = await createClient();
  const today = todayWib();
  const { data } = await supabase
    .from("incident_actions")
    .select("id, description, pic_employee_id, due_date, status, done_note, done_at, pic:employees(full_name)")
    .eq("incident_id", incidentId)
    .order("due_date");
  return (data ?? []).map((row) => ({
    id: row.id,
    description: row.description,
    pic_employee_id: row.pic_employee_id,
    pic_name: row.pic?.full_name ?? "—",
    due_date: row.due_date,
    status: row.status as IncidentAction["status"],
    done_note: row.done_note,
    done_at: row.done_at,
    overdue: row.status === "open" && row.due_date < today,
  }));
}

/** K3-05 per project plus the company row (project_id null). */
export async function k3Stats(from: string, to: string): Promise<K3StatsRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("k3_stats", { p_from: from, p_to: to });
  return ((data ?? []) as unknown as K3StatsRow[]).map((row) => ({
    ...row,
    work_hours: Number(row.work_hours),
    ltifr: row.ltifr === null ? null : Number(row.ltifr),
  }));
}

/** Incidents per month and classification (K3-05, DSB-03). */
export async function incidentMonthly(from: string, to: string, projectId?: string) {
  const supabase = await createClient();
  let query = supabase.from("incident_monthly").select("project_id, month, classification, count").gte("month", from.slice(0, 8) + "01").lte("month", to);
  if (projectId) query = query.eq("project_id", projectId);
  const { data } = await query.order("month");
  return (data ?? []) as { project_id: string; month: string; classification: string; count: number }[];
}

/** Projects, sections and people for the report form. */
export async function incidentFormOptions(role: string) {
  const supabase = await createClient();
  let projectQuery = supabase.from("projects").select("id, code, name, status").neq("status", "closed");
  if (role === "field") {
    const { data } = await supabase.rpc("user_project_ids");
    const ids = ((data ?? []) as unknown as string[]).map(String);
    projectQuery = projectQuery.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }
  const [{ data: projects }, { data: sections }, { data: employees }] = await Promise.all([
    projectQuery.order("code", { ascending: false }),
    supabase.from("project_sections").select("id, project_id, code, tower_from, tower_to").order("sort_order"),
    supabase.from("employees").select("id, employee_no, full_name").eq("is_active", true).order("full_name"),
  ]);
  return {
    projects: (projects ?? []).map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` })),
    sections: (sections ?? []).map((row) => ({
      project_id: row.project_id,
      value: row.id,
      label: `${row.code} (${row.tower_from}–${row.tower_to})`,
    })),
    employees: (employees ?? []).map((row) => ({ value: row.id, label: row.full_name, description: row.employee_no })),
  };
}

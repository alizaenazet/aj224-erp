import "server-only";

import type { Profile } from "@/lib/auth/session";
import { backdateDays } from "@/lib/daily-reports/queries";
import type { ReportRow } from "@/lib/daily-reports/labels";
import { fieldProjects } from "@/lib/field/queries";
import { formatDate, todayWib } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Projects a user may report on: Lapangan their active ones, Operasional all not closed. */
export async function reportProjects(profile: Profile) {
  if (profile.role === "field") {
    const projects = await fieldProjects();
    return projects.map((project) => ({ value: project.id, label: `${project.code} — ${project.name}` }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, code, name")
    .neq("status", "closed")
    .order("code", { ascending: false });
  return (data ?? []).map((project) => ({ value: project.id, label: `${project.code} — ${project.name}` }));
}

/** Dates Lapangan may report on (today back to H−backdate_days). */
export async function fieldReportDates() {
  const today = todayWib();
  const days = await backdateDays();
  return Array.from({ length: days + 1 }, (_, index) => {
    const value = addDays(today, -index);
    return {
      value,
      label: index === 0 ? `Hari ini, ${formatDate(value)}` : index === 1 ? `Kemarin, ${formatDate(value)}` : formatDate(value),
    };
  });
}

/** Whether a user may still change a report (OPS-01): never once reviewed; Lapangan within the window or on revision. */
export async function canEditReport(profile: Profile, report: ReportRow) {
  if (report.status === "reviewed") return false;
  if (profile.role === "operations") return true;
  if (profile.role !== "field") return false;
  if (report.status === "revision") return true;
  return report.report_date >= addDays(todayWib(), -(await backdateDays()));
}

/** Crew marked Hadir on a project day (tenaga kerja, OPS-01). */
export async function workforceOn(projectId: string, date: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("attendance")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("work_date", date)
    .eq("status", "present");
  return count ?? 0;
}

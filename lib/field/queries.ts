import "server-only";

import { projectCrew } from "@/lib/assignments/queries";
import { todayWib } from "@/lib/format";
import type { ProjectStatus } from "@/lib/projects/labels";
import { createClient } from "@/lib/supabase/server";

export type FieldProject = {
  id: string;
  code: string;
  name: string;
  site: string | null;
  status: ProjectStatus;
  progress: number | null;
  location_id: string | null;
  crew_today: number;
  recorded_today: number;
  /** Today's daily report, if sent (OPS-01). */
  report_today: { id: string; status: string } | null;
  /** Field cash balance (FIN-10); null when the project has no field cash yet. */
  cash_balance: number | null;
  /** Delivery notes to the project waiting for receipt (ALT-04). */
  incoming_notes: { id: string; number: string }[];
};

/** The Lapangan user's active projects with today's attendance status (DSB-04). */
export async function fieldProjects(): Promise<FieldProject[]> {
  const supabase = await createClient();
  const today = todayWib();
  const { data: ids } = await supabase.rpc("user_project_ids");
  const projectIds = (ids ?? []) as unknown as string[];
  if (!projectIds.length) return [];

  const { data: projects } = await supabase
    .from("project_overview")
    .select("id, code, name, site, status, progress, location_id")
    .in("id", projectIds)
    .order("code");

  return Promise.all(
    (projects ?? []).map(async (project) => {
      const [crew, { count }, { data: report }, { data: incoming }, { data: cash }] = await Promise.all([
        projectCrew(project.id, today),
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .eq("project_id", project.id)
          .eq("work_date", today),
        supabase
          .from("daily_reports")
          .select("id, status")
          .eq("project_id", project.id)
          .eq("report_date", today)
          .maybeSingle(),
        project.location_id
          ? supabase
              .from("delivery_notes")
              .select("id, number")
              .eq("to_location_id", project.location_id)
              .eq("status", "sent")
              .order("note_date")
          : Promise.resolve({ data: [] as { id: string; number: string }[] }),
        supabase.from("field_cash_balances").select("balance").eq("project_id", project.id).maybeSingle(),
      ]);
      return {
        id: project.id,
        code: project.code,
        name: project.name,
        site: project.site,
        status: project.status as ProjectStatus,
        progress: project.progress === null ? null : Number(project.progress),
        location_id: project.location_id,
        crew_today: crew.length,
        recorded_today: count ?? 0,
        report_today: report ?? null,
        incoming_notes: incoming ?? [],
        cash_balance: cash ? Number(cash.balance) : null,
      };
    }),
  );
}

/** Positions a local worker may take: active and without required certificates (HCM-12). */
export async function localWorkerPositions() {
  const supabase = await createClient();
  const [{ data: positions }, { data: required }] = await Promise.all([
    supabase.from("positions").select("id, name").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("position_required_certificates").select("position_id"),
  ]);
  const withCertificates = new Set((required ?? []).map((row) => row.position_id));
  return (positions ?? [])
    .filter((position) => !withCertificates.has(position.id))
    .map((position) => ({ value: position.id, label: position.name }));
}

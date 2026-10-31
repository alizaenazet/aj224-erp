import "server-only";

import { projectCrew } from "@/lib/assignments/queries";
import type { AttendanceStatus, RecapRow, SheetPerson } from "@/lib/attendance/labels";
import { todayWib } from "@/lib/format";
import { isUuid, parseDateRange, parseEnum, parseText, type RawSearchParams } from "@/lib/list/params";
import { createClient } from "@/lib/supabase/server";

type SavedRecord = NonNullable<SheetPerson["record"]>;

async function savedRecords(employeeIds: string[], date: string) {
  if (!employeeIds.length) return new Map<string, SavedRecord>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance")
    .select("employee_id, status, overtime_hours, notes, project_id")
    .eq("work_date", date)
    .in("employee_id", employeeIds);
  return new Map(
    (data ?? []).map((row) => [
      row.employee_id,
      {
        status: row.status as AttendanceStatus,
        overtime_hours: Number(row.overtime_hours),
        notes: row.notes,
        project_id: row.project_id,
      },
    ]),
  );
}

/**
 * People of a project day with their saved records (HCM-09): the crew assigned
 * on that date, plus anyone recorded on the project that day (Finance cannot
 * read assignments, so for them the records are the list).
 */
export async function projectSheet(projectId: string, date: string) {
  const supabase = await createClient();
  const [crew, { data: day }, { data: recorded }] = await Promise.all([
    projectCrew(projectId, date),
    supabase.from("attendance_days").select("id").eq("project_id", projectId).eq("work_date", date).maybeSingle(),
    supabase
      .from("attendance")
      .select("employee_id, employee:employees(employee_no, full_name, verification_status, position:positions(name))")
      .eq("project_id", projectId)
      .eq("work_date", date),
  ]);
  const crewIds = new Set(crew.map((row) => row.employee_id));
  const extra = (recorded ?? []).filter((row) => !crewIds.has(row.employee_id) && row.employee);
  const records = await savedRecords(
    [...crewIds, ...extra.map((row) => row.employee_id)],
    date,
  );
  const people: SheetPerson[] = crew.map((row) => ({
    employee_id: row.employee_id,
    employee_no: row.employee_no,
    name: row.employee_name,
    position: row.position_name,
    verification_status: row.verification_status,
    cert_state: row.cert_state,
    cert_issues: row.cert_issues,
    overridden: Boolean(row.overridden_at),
    record: records.get(row.employee_id) ?? null,
  }));
  for (const row of extra) {
    people.push({
      employee_id: row.employee_id,
      employee_no: row.employee!.employee_no,
      name: row.employee!.full_name,
      position: row.employee!.position?.name ?? "—",
      verification_status: row.employee!.verification_status as SheetPerson["verification_status"],
      cert_state: null,
      cert_issues: null,
      overridden: false,
      record: records.get(row.employee_id) ?? null,
    });
  }
  people.sort((a, b) => a.name.localeCompare(b.name));
  return { people, dayId: day?.id ?? null };
}

/** Active office staff on a date with their saved records (HCM-10). */
export async function officeSheet(date: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, employee_no, full_name, verification_status, join_date, exit_date, position:positions(name)")
    .eq("work_type", "office")
    .lte("join_date", date)
    .or(`exit_date.is.null,exit_date.gte.${date}`)
    .order("full_name");
  const staff = data ?? [];
  const records = await savedRecords(
    staff.map((row) => row.id),
    date,
  );
  const people: SheetPerson[] = staff.map((row) => ({
    employee_id: row.id,
    employee_no: row.employee_no,
    name: row.full_name,
    position: row.position?.name ?? "—",
    verification_status: row.verification_status as SheetPerson["verification_status"],
    cert_state: null,
    cert_issues: null,
    overridden: false,
    record: records.get(row.id) ?? null,
  }));
  return { people, dayId: null };
}

/** Attendance of a project day for the read-only project tab. */
export async function projectDayAttendance(projectId: string, date: string) {
  return projectSheet(projectId, date);
}

export function firstOfMonth(date: string) {
  return `${date.slice(0, 7)}-01`;
}

export function parseRecapParams(raw: RawSearchParams) {
  const range = parseDateRange(raw);
  const today = todayWib();
  const project = parseText(raw.project);
  return {
    from: range.from ?? firstOfMonth(today),
    to: range.to ?? today,
    project: project === "office" ? ("office" as const) : isUuid(project) ? project : null,
    type: parseEnum(raw.type, ["office", "field"] as const),
    q: parseText(raw.q),
  };
}

export type RecapParams = ReturnType<typeof parseRecapParams>;

/** Rekap absensi per employee and project (HCM-11), from attendance_recap(). */
export async function queryRecap(params: RecapParams) {
  const supabase = await createClient();
  const [{ data, error }, { data: employees }, { data: projects }] = await Promise.all([
    supabase.rpc("attendance_recap", { p_from: params.from, p_to: params.to }),
    supabase.from("employees").select("id, employee_no, full_name, work_type"),
    supabase.from("projects").select("id, code"),
  ]);
  const employeeById = new Map((employees ?? []).map((row) => [row.id, row]));
  const codeById = new Map((projects ?? []).map((row) => [row.id, row.code]));
  const q = params.q?.toLowerCase() ?? null;

  const rows: RecapRow[] = (data ?? [])
    .map((row) => {
      const employee = employeeById.get(row.employee_id);
      return {
        employee_id: row.employee_id,
        employee_no: employee?.employee_no ?? "—",
        employee_name: employee?.full_name ?? "—",
        work_type: employee?.work_type ?? "field",
        project_id: row.project_id,
        project_code: row.project_id ? (codeById.get(row.project_id) ?? "—") : null,
        present: row.present,
        permit: row.permit,
        sick: row.sick,
        leave: row.leave,
        absent: row.absent,
        off: row.off,
        overtime_hours: Number(row.overtime_hours),
      };
    })
    .filter((row) => {
      if (params.project === "office" && row.project_id !== null) return false;
      if (params.project && params.project !== "office" && row.project_id !== params.project) return false;
      if (params.type && row.work_type !== params.type) return false;
      if (q && !row.employee_name.toLowerCase().includes(q) && !row.employee_no.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort(
      (a, b) =>
        (a.project_code ?? "").localeCompare(b.project_code ?? "") || a.employee_name.localeCompare(b.employee_name),
    );
  return { rows, count: rows.length, error };
}

/** Projects with attendance scope for the SDM pages. */
export async function attendanceProjectOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, code, name, status")
    .order("code", { ascending: false });
  return (data ?? []).map((row) => ({ value: row.id, label: `${row.code} — ${row.name}` }));
}

export type DayRecord = {
  employee_id: string;
  employee_no: string;
  employee_name: string;
  status: AttendanceStatus;
  overtime_hours: number;
};

/** Saved attendance of a project day, read straight from attendance (Finance has no assignment access). */
export async function projectDayRecords(projectId: string, date: string): Promise<DayRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance")
    .select("employee_id, status, overtime_hours, employee:employees(employee_no, full_name)")
    .eq("project_id", projectId)
    .eq("work_date", date);
  return (data ?? [])
    .map((row) => ({
      employee_id: row.employee_id,
      employee_no: row.employee?.employee_no ?? "—",
      employee_name: row.employee?.full_name ?? "—",
      status: row.status as AttendanceStatus,
      overtime_hours: Number(row.overtime_hours),
    }))
    .sort((a, b) => a.employee_name.localeCompare(b.employee_name));
}

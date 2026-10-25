import "server-only";

import {
  PAGE_SIZE,
  isUuid,
  likePattern,
  parseDateRange,
  parseEnum,
  parsePage,
  parseSort,
  parseText,
  type RawSearchParams,
} from "@/lib/list/params";
import { createClient } from "@/lib/supabase/server";
import {
  TRAINING_KINDS,
  type EmployeeOption,
  type ParticipantRow,
  type Training,
  type TrainingNeedRow,
  type TrainingRow,
} from "@/lib/trainings/labels";

const LIST_SELECT =
  "id, name, kind, organizer, start_date, end_date, location, certificate_type_id, certificate_type:certificate_types(name), participants:training_participants(result)";

export const TRAINING_SORTS = ["start_date", "name"] as const;

export function parseTrainingListParams(raw: RawSearchParams) {
  return {
    q: parseText(raw.q),
    kind: parseEnum(raw.kind, TRAINING_KINDS),
    range: parseDateRange(raw),
    sort: parseSort(raw.sort, TRAINING_SORTS, { column: "start_date", ascending: false }),
    page: parsePage(raw.page),
  };
}

export type TrainingListParams = ReturnType<typeof parseTrainingListParams>;

/** Pelatihan list (HCM-07); the date range applies to the start date. */
export async function queryTrainings(params: TrainingListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("trainings").select(LIST_SELECT, { count: "exact" });

  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`name.ilike.${pattern},organizer.ilike.${pattern}`);
  }
  if (params.kind) query = query.eq("kind", params.kind);
  if (params.range.from) query = query.gte("start_date", params.range.from);
  if (params.range.to) query = query.lte("start_date", params.range.to);

  query = query
    .order(params.sort.column, { ascending: params.sort.ascending })
    .order("id");
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  return { rows: (data ?? []) as unknown as TrainingRow[], count: count ?? 0, error };
}

/** One training with its participants, or null. */
export async function getTraining(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const [{ data: training }, { data: participants }] = await Promise.all([
    supabase
      .from("trainings")
      .select(`${LIST_SELECT}, notes`)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("training_participants")
      .select(
        "employee_id, result, certificate_id, employee:employees(employee_no, full_name, is_active, position:positions(name))",
      )
      .eq("training_id", id),
  ]);
  if (!training) return null;

  const rows = ((participants ?? []) as unknown as ParticipantRow[]).sort((a, b) =>
    (a.employee?.full_name ?? "").localeCompare(b.employee?.full_name ?? "", "id"),
  );
  return { training: training as unknown as Training, participants: rows };
}

export function parseTrainingNeedParams(raw: RawSearchParams) {
  const type = parseText(raw.type);
  return { q: parseText(raw.q), type: isUuid(type) ? type : null };
}

/** HCM-08: required certificates missing, expired or expiring. */
export async function queryTrainingNeeds(params: ReturnType<typeof parseTrainingNeedParams>) {
  const supabase = await createClient();
  let query = supabase
    .from("training_needs")
    .select(
      "employee_id, employee_no, employee_name, position_name, certificate_type_id, certificate_type_name, certificate_id, expiry_date, status",
    );
  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(`employee_name.ilike.${pattern},employee_no.ilike.${pattern}`);
  }
  if (params.type) query = query.eq("certificate_type_id", params.type);

  const { data, error } = await query
    .order("certificate_type_name")
    .order("expiry_date", { ascending: true, nullsFirst: true })
    .order("employee_name")
    .range(0, 9999);
  const rows = (data ?? []) as TrainingNeedRow[];
  return { rows, count: rows.length, error };
}

/** Active employees for the participant picker. */
export async function employeeOptions(): Promise<EmployeeOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, employee_no, full_name, position:positions(name)")
    .eq("is_active", true)
    .order("full_name");
  return (data ?? []).map((employee) => ({
    id: employee.id,
    employee_no: employee.employee_no,
    full_name: employee.full_name,
    position: (employee.position as { name: string } | null)?.name ?? null,
  }));
}

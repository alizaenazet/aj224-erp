import "server-only";

import {
  EMPLOYEE_STATUSES,
  EMPLOYMENT_STATUSES,
  WORK_TYPES,
  type Employee,
  type EmployeeRow,
  type PaySettings,
} from "@/lib/employees/labels";
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

export const EMPLOYEE_SORTS = ["employee_no", "full_name", "join_date"] as const;

export function parseEmployeeListParams(raw: RawSearchParams) {
  const position = parseText(raw.position);
  return {
    q: parseText(raw.q),
    type: parseEnum(raw.type, WORK_TYPES),
    employment: parseEnum(raw.employment, EMPLOYMENT_STATUSES),
    position: isUuid(position) ? position : null,
    status: parseEnum(raw.status, EMPLOYEE_STATUSES),
    sort: parseSort(raw.sort, EMPLOYEE_SORTS, { column: "full_name", ascending: true }),
    page: parsePage(raw.page),
  };
}

export type EmployeeListParams = ReturnType<typeof parseEmployeeListParams>;

const LIST_SELECT =
  "id, employee_no, full_name, nik_ktp, phone, work_type, employment_status, join_date, exit_date, is_active, position:positions(name)";

/** Karyawan list (HCM-01); `page: null` returns all rows (export). */
export async function queryEmployees(params: EmployeeListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase.from("employees").select(LIST_SELECT, { count: "exact" });

  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(
      `full_name.ilike.${pattern},employee_no.ilike.${pattern},phone.ilike.${pattern}`,
    );
  }
  if (params.type) query = query.eq("work_type", params.type);
  if (params.employment) query = query.eq("employment_status", params.employment);
  if (params.position) query = query.eq("position_id", params.position);
  if (params.status) query = query.eq("is_active", params.status === "active");

  query = query
    .order(params.sort.column, { ascending: params.sort.ascending })
    .order("id", { ascending: true });
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  return { rows: (data ?? []) as EmployeeRow[], count: count ?? 0, error };
}

/** One employee with its position, or null when missing or not visible. */
export async function getEmployee(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("*, position:positions(name)")
    .eq("id", id)
    .maybeSingle();
  return data as Employee | null;
}

/** Pay settings (HCM, Finance, Direktur); null when not set or not visible. */
export async function getPaySettings(employeeId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employee_pay_settings")
    .select(
      "employee_id, pay_type, daily_wage, base_salary, fixed_allowance, meal_allowance_per_day, field_allowance_per_day, overtime_rate_per_hour, fixed_deduction",
    )
    .eq("employee_id", employeeId)
    .maybeSingle();
  return data as PaySettings | null;
}

/** Positions for filters (all) and forms (active, plus the current one). */
export async function positionOptions({ includeId }: { includeId?: string } = {}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("positions")
    .select("id, name, is_active")
    .order("sort_order")
    .order("name");
  return (data ?? []).map((position) => ({
    value: position.id,
    label: position.name,
    active: position.is_active || position.id === includeId,
  }));
}

export type EmployeeLinkOption = {
  id: string;
  employee_no: string;
  full_name: string;
  position: string | null;
  linkedProfileId: string | null;
  linkedProfileName: string | null;
};

/** Active employees for "Hubungkan karyawan", with the account each is linked to. */
export async function employeeLinkOptions(): Promise<EmployeeLinkOption[]> {
  const supabase = await createClient();
  const [{ data: employees }, { data: profiles }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, employee_no, full_name, position:positions(name)")
      .eq("is_active", true)
      .order("full_name"),
    supabase.from("profiles").select("id, full_name, employee_id").not("employee_id", "is", null),
  ]);

  const linked = new Map((profiles ?? []).map((profile) => [profile.employee_id, profile]));
  return (employees ?? []).map((employee) => ({
    id: employee.id,
    employee_no: employee.employee_no,
    full_name: employee.full_name,
    position: (employee.position as { name: string } | null)?.name ?? null,
    linkedProfileId: linked.get(employee.id)?.id ?? null,
    linkedProfileName: linked.get(employee.id)?.full_name ?? null,
  }));
}

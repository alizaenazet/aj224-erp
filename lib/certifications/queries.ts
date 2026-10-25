import "server-only";

import { CERTIFICATE_FILTERS, type CertificateRow } from "@/lib/certifications/labels";
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

const SELECT =
  "id, employee_id, certificate_type_id, certificate_no, issuer, issued_date, expiry_date, notes, training_id, employee_no, employee_name, employee_active, certificate_type_name, status, days_left, is_current";

export const CERTIFICATE_SORTS = ["expiry_date", "employee_name"] as const;

export function parseCertificateListParams(raw: RawSearchParams) {
  const type = parseText(raw.type);
  return {
    q: parseText(raw.q),
    status: parseEnum(raw.status, CERTIFICATE_FILTERS),
    type: isUuid(type) ? type : null,
    sort: parseSort(raw.sort, CERTIFICATE_SORTS, { column: "expiry_date", ascending: true }),
    page: parsePage(raw.page),
  };
}

export type CertificateListParams = ReturnType<typeof parseCertificateListParams>;

/** Current certificates of active employees (HCM-04); `page: null` = export. */
export async function queryCertificates(params: CertificateListParams, { page }: { page: number | null }) {
  const supabase = await createClient();
  let query = supabase
    .from("employee_certificate_list")
    .select(SELECT, { count: "exact" })
    .eq("is_current", true)
    .eq("employee_active", true);

  if (params.q) {
    const pattern = likePattern(params.q);
    query = query.or(
      `employee_name.ilike.${pattern},employee_no.ilike.${pattern},certificate_no.ilike.${pattern}`,
    );
  }
  if (params.status === "problem") query = query.in("status", ["expiring", "expired"]);
  else if (params.status) query = query.eq("status", params.status);
  if (params.type) query = query.eq("certificate_type_id", params.type);

  query = query
    .order(params.sort.column, { ascending: params.sort.ascending, nullsFirst: false })
    .order("employee_name")
    .order("id");
  query = page === null ? query.range(0, 9999) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  return { rows: (data ?? []) as CertificateRow[], count: count ?? 0, error };
}

/** All certificates of one employee, current first per type. */
export async function employeeCertificates(employeeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_certificate_list")
    .select(SELECT)
    .eq("employee_id", employeeId)
    .order("certificate_type_name")
    .order("is_current", { ascending: false })
    .order("expiry_date", { ascending: false, nullsFirst: true });
  return { rows: (data ?? []) as CertificateRow[], error };
}

/** Certificate types required by a position (MST-06). */
export async function positionRequirements(positionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("position_required_certificates")
    .select("certificate_type_id, certificate_types(name)")
    .eq("position_id", positionId);
  return (data ?? [])
    .map((row) => ({
      id: row.certificate_type_id,
      name: (row.certificate_types as { name: string } | null)?.name ?? "—",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export type CertificateTypeOption = {
  value: string;
  label: string;
  validityMonths: number | null;
  active: boolean;
};

/** Certificate types with their validity (forms suggest the expiry from it). */
export async function certificateTypeOptions(): Promise<CertificateTypeOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certificate_types")
    .select("id, name, validity_months, is_active")
    .order("name");
  return (data ?? []).map((type) => ({
    value: type.id,
    label: type.name,
    validityMonths: type.validity_months,
    active: type.is_active,
  }));
}

/** Ids of certificates that have a scan attached. */
export async function certificatesWithScan(certificateIds: string[]) {
  if (certificateIds.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("attachments")
    .select("id, entity_id")
    .eq("entity_type", "employee_certificate")
    .eq("category", "scan")
    .in("entity_id", certificateIds);
  return new Map((data ?? []).map((row) => [row.entity_id, row.id]));
}

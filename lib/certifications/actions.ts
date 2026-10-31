"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import { certificateSchema, type CertificateInput } from "@/lib/certifications/schema";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid("Data tidak valid.");

function revalidateCertificates(employeeId: string) {
  revalidatePath("/hr/certificates");
  revalidatePath("/hr/training-needs");
  revalidatePath(`/hr/employees/${employeeId}`);
}

/** Adds (no `certificateId`) or edits an employee's certificate (HCM-03). */
export async function saveCertificate(input: {
  employeeId: string;
  certificateId?: string;
  values: CertificateInput;
}): Promise<ActionResult> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const employeeId = idSchema.safeParse(input.employeeId);
  if (!employeeId.success) return { ok: false, error: "Karyawan tidak valid." };
  const parsed = certificateSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  if (input.certificateId) {
    const certificateId = idSchema.safeParse(input.certificateId);
    if (!certificateId.success) return { ok: false, error: "Sertifikat tidak valid." };
    const { data, error } = await supabase
      .from("employee_certificates")
      .update(parsed.data)
      .eq("id", certificateId.data)
      .eq("employee_id", employeeId.data)
      .select("id");
    if (error) return { ok: false, error: dbErrorMessage(error) };
    if (!data?.length) return { ok: false, error: "Sertifikat tidak ditemukan." };
  } else {
    const { error } = await supabase
      .from("employee_certificates")
      .insert({ ...parsed.data, employee_id: employeeId.data });
    if (error) return { ok: false, error: dbErrorMessage(error) };
  }

  revalidateCertificates(employeeId.data);
  return { ok: true, message: input.certificateId ? "Sertifikat diperbarui." : "Sertifikat ditambahkan." };
}

/** Removes a wrongly entered certificate and its scan. */
export async function deleteCertificate(certificateId: string): Promise<ActionResult> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const parsed = idSchema.safeParse(certificateId);
  if (!parsed.success) return { ok: false, error: "Sertifikat tidak valid." };

  const supabase = await createClient();
  const { data: scans } = await supabase
    .from("attachments")
    .select("id, bucket, path")
    .eq("entity_type", "employee_certificate")
    .eq("entity_id", parsed.data);

  // The scan goes first: its access rules need the certificate to still exist.
  if (scans?.length) {
    const { error: removeError } = await supabase.storage.from(scans[0].bucket).remove(scans.map((scan) => scan.path));
    if (removeError) return { ok: false, error: "Scan sertifikat gagal dihapus." };
    const { error: scanError } = await supabase.from("attachments").delete().in("id", scans.map((scan) => scan.id));
    if (scanError) return { ok: false, error: dbErrorMessage(scanError) };
  }

  const { data, error } = await supabase
    .from("employee_certificates")
    .delete()
    .eq("id", parsed.data)
    .select("employee_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  const row = data?.[0];
  if (!row) return { ok: false, error: "Sertifikat tidak ditemukan." };

  revalidateCertificates(row.employee_id);
  return { ok: true, message: "Sertifikat dihapus." };
}

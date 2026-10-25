"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import {
  employeeSchema,
  exitDateSchema,
  paySettingsSchema,
  type EmployeeInput,
  type PaySettingsInput,
} from "@/lib/employees/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const LIST_PATH = "/hr/employees";
const BANNED_FOR = "876000h"; // same as deactivating on Pengguna & Peran

const idSchema = z.uuid("Karyawan tidak valid.");

function revalidateEmployee(id?: string) {
  revalidatePath(LIST_PATH);
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
}

export async function createEmployee(input: EmployeeInput): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateEmployee();
  return { ok: true, message: "Karyawan ditambahkan.", data: { id: data.id } };
}

export async function updateEmployee(input: {
  id: string;
  values: EmployeeInput;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  const parsed = employeeSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .update(parsed.data)
    .eq("id", id.data)
    .select("id");

  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Karyawan tidak ditemukan." };

  revalidateEmployee(id.data);
  return { ok: true, message: "Data karyawan disimpan.", data: { id: id.data } };
}

const setActiveSchema = z.object({
  employeeId: idSchema,
  /** Null reactivates; a date deactivates (PRD §14). */
  exitDate: exitDateSchema.nullable(),
});

export async function setEmployeeActive(
  input: z.infer<typeof setActiveSchema>,
): Promise<ActionResult> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const { employeeId, exitDate } = parsed.data;

  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("join_date, exit_date")
    .eq("id", employeeId)
    .maybeSingle();
  if (!employee) return { ok: false, error: "Karyawan tidak ditemukan." };
  if (exitDate && exitDate < employee.join_date) {
    return { ok: false, error: "Tanggal keluar tidak boleh sebelum tanggal masuk." };
  }
  if (exitDate && employee.exit_date) return { ok: false, error: "Karyawan sudah nonaktif." };
  if (!exitDate && !employee.exit_date) return { ok: false, error: "Karyawan sudah aktif." };

  // The database deactivates the linked profile in the same update.
  const { error } = await supabase
    .from("employees")
    .update({ exit_date: exitDate })
    .eq("id", employeeId);
  if (error) return { ok: false, error: dbErrorMessage(error) };

  // HCM cannot read other profiles, so look up the linked account as admin.
  const admin = createAdminClient();
  const { data: account } = await admin
    .from("profiles")
    .select("id, full_name, is_active")
    .eq("employee_id", employeeId)
    .maybeSingle();

  revalidateEmployee(employeeId);

  if (!exitDate) {
    return {
      ok: true,
      message: account && !account.is_active
        ? `Karyawan diaktifkan kembali. Akun ${account.full_name} tetap nonaktif sampai diaktifkan Super Admin.`
        : "Karyawan diaktifkan kembali.",
    };
  }

  if (!account) return { ok: true, message: "Karyawan dinonaktifkan." };

  // Ban so sign-in and token refresh fail too, as on Pengguna & Peran.
  const { error: banError } = await admin.auth.admin.updateUserById(account.id, {
    ban_duration: BANNED_FOR,
  });
  if (banError) {
    return {
      ok: true,
      message: `Karyawan dinonaktifkan dan akun ${account.full_name} tidak bisa membuka data. Pemblokiran login gagal; ulangi dari Pengguna & Peran.`,
    };
  }
  return {
    ok: true,
    message: `Karyawan dinonaktifkan. Akun ${account.full_name} juga dinonaktifkan.`,
  };
}

export async function savePaySettings(input: {
  employeeId: string;
  values: PaySettingsInput;
}): Promise<ActionResult> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.employeeId);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  const parsed = paySettingsSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("employee_pay_settings")
    .upsert({ employee_id: id.data, ...parsed.data }, { onConflict: "employee_id" });

  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateEmployee(id.data);
  return { ok: true, message: "Pengaturan gaji disimpan." };
}

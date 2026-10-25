"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { APP_ROLES } from "@/lib/auth/roles";
import { assertRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const USERS_PATH = "/settings/users";
const BANNED_FOR = "876000h"; // ~100 years: deactivated until reactivated

const inviteSchema = z.object({
  fullName: z.string().trim().min(1, "Nama wajib diisi."),
  email: z.email("Format email tidak valid."),
  role: z.enum(APP_ROLES, "Pilih peran."),
});

export type InviteUserInput = z.infer<typeof inviteSchema>;

export async function inviteUser(input: InviteUserInput): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { fullName, role } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return { ok: false, error: "Email sudah terdaftar." };

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  });
  if (error || !data.user) {
    if (error?.code === "email_exists" || error?.status === 422) {
      return { ok: false, error: "Email sudah terdaftar." };
    }
    return { ok: false, error: "Undangan gagal dikirim. Coba lagi." };
  }

  // Signed-in client (RLS: Super Admin) so the audit log records the inviter.
  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: data.user.id, full_name: fullName, email, role });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: "Undangan gagal disimpan. Coba lagi." };
  }

  revalidatePath(USERS_PATH);
  return { ok: true, message: `Undangan terkirim ke ${email}.` };
}

const userIdSchema = z.uuid("Pengguna tidak valid.");

export async function resendInvite(userId: string): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const parsed = userIdSchema.safeParse(userId);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(parsed.data);
  if (error || !data.user?.email) {
    return { ok: false, error: "Pengguna tidak ditemukan." };
  }
  if (data.user.email_confirmed_at) {
    return { ok: false, error: "Pengguna sudah menerima undangan." };
  }

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    data.user.email,
  );
  if (inviteError) {
    return { ok: false, error: "Undangan gagal dikirim ulang. Coba lagi." };
  }

  revalidatePath(USERS_PATH);
  return { ok: true, message: `Undangan dikirim ulang ke ${data.user.email}.` };
}

const changeRoleSchema = z.object({
  userId: userIdSchema,
  role: z.enum(APP_ROLES, "Pilih peran."),
});

export async function changeUserRole(
  input: z.infer<typeof changeRoleSchema>,
): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const parsed = changeRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  // Through the signed-in client so RLS and the profile guard trigger apply.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId)
    .select("id");

  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Pengguna tidak ditemukan." };

  revalidatePath(USERS_PATH);
  return { ok: true, message: "Peran pengguna diperbarui." };
}

const setActiveSchema = z.object({
  userId: userIdSchema,
  active: z.boolean(),
});

export async function setUserActive(
  input: z.infer<typeof setActiveSchema>,
): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { userId, active } = parsed.data;
  if (!active && userId === auth.profile.id) {
    return { ok: false, error: "Tidak dapat menonaktifkan akun sendiri" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: active })
    .eq("id", userId)
    .select("id");

  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Pengguna tidak ditemukan." };

  // Ban/unban so sign-in and token refresh follow the profile status.
  const admin = createAdminClient();
  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: active ? "none" : BANNED_FOR,
  });
  if (banError) {
    await supabase.from("profiles").update({ is_active: !active }).eq("id", userId);
    return { ok: false, error: "Status akun gagal diubah. Coba lagi." };
  }

  revalidatePath(USERS_PATH);
  return {
    ok: true,
    message: active ? "Akun diaktifkan kembali." : "Akun dinonaktifkan.",
  };
}

const linkEmployeeSchema = z.object({
  userId: userIdSchema,
  /** Null removes the link. */
  employeeId: z.uuid("Karyawan tidak valid.").nullable(),
});

/** Links an account to an employee record (MST-01); one account per employee. */
export async function linkEmployee(
  input: z.infer<typeof linkEmployeeSchema>,
): Promise<ActionResult> {
  const auth = await assertRole(["super_admin"]);
  if (!auth.ok) return auth;

  const parsed = linkEmployeeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ employee_id: parsed.data.employeeId })
    .eq("id", parsed.data.userId)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Karyawan sudah terhubung dengan akun lain." };
    }
    return { ok: false, error: dbErrorMessage(error) };
  }
  if (!data?.length) return { ok: false, error: "Pengguna tidak ditemukan." };

  revalidatePath(USERS_PATH);
  return {
    ok: true,
    message: parsed.data.employeeId ? "Akun dihubungkan dengan karyawan." : "Tautan karyawan dilepas.",
  };
}

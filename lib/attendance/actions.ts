"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { attendanceSheetSchema, type AttendanceSheetInput } from "@/lib/attendance/schema";
import { assertRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** Saves one sheet (HCM-09, HCM-10); the database enforces crew, H+3 and project rules. */
export async function saveAttendance(input: AttendanceSheetInput): Promise<ActionResult<{ saved: number }>> {
  const auth = await assertRole(["hcm", "field"]);
  if (!auth.ok) return auth;

  const parsed = attendanceSheetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  if (auth.profile.role === "field" && !parsed.data.project_id) {
    return { ok: false, error: "Pilih proyek." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_attendance", {
    p_project: parsed.data.project_id as string,
    p_date: parsed.data.work_date,
    p_rows: parsed.data.rows,
  });
  if (error) {
    if (error.code === "23514") return { ok: false, error: "Lembur hanya untuk status Hadir." };
    return { ok: false, error: dbErrorMessage(error) };
  }

  revalidatePath("/hr/attendance", "layout");
  revalidatePath("/field/attendance");
  revalidatePath("/");
  if (parsed.data.project_id) revalidatePath(`/projects/${parsed.data.project_id}`, "layout");
  const saved = Number(data ?? 0);
  return { ok: true, message: `Absensi ${saved} orang disimpan.`, data: { saved } };
}

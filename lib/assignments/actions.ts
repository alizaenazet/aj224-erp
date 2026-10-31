"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import type { FitnessRow } from "@/lib/assignments/labels";
import {
  assignmentSchema,
  endAssignmentSchema,
  type AssignmentInput,
  type EndAssignmentInput,
} from "@/lib/assignments/schema";
import { assertRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const MANAGERS = ["hcm"] as const;

function revalidateAssignments(projectId?: string) {
  revalidatePath("/hr/assignments");
  revalidatePath("/hr/attendance");
  if (projectId) revalidatePath(`/projects/${projectId}`, "layout");
}

/** Required certificates of a position for an employee on a date (HCM-06 preview). */
export async function checkAssignmentFitness(input: {
  employeeId: string;
  positionId: string;
  startDate: string;
}): Promise<ActionResult<FitnessRow[]>> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const parsed = z
    .object({ employeeId: z.uuid(), positionId: z.uuid(), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("assignment_fitness", {
    p_employee: parsed.data.employeeId,
    p_position: parsed.data.positionId,
    p_on: parsed.data.startDate,
  });
  if (error) return { ok: false, error: dbErrorMessage(error, "Pemeriksaan sertifikat gagal.") };
  return { ok: true, data: (data ?? []) as FitnessRow[] };
}

export async function createAssignment(input: AssignmentInput): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.from("assignments").insert(parsed.data).select("overridden_at");
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateAssignments(parsed.data.project_id);
  return {
    ok: true,
    message: data?.[0]?.overridden_at ? "Penugasan disimpan dengan override." : "Penugasan disimpan.",
  };
}

export async function endAssignment(input: { id: string; values: EndAssignmentInput }): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const id = z.uuid().safeParse(input.id);
  if (!id.success) return { ok: false, error: "Penugasan tidak valid." };
  const parsed = endAssignmentSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .update({ end_date: parsed.data.end_date, ...(parsed.data.notes ? { notes: parsed.data.notes } : {}) })
    .eq("id", id.data)
    .select("project_id");
  if (error) {
    if (error.code === "23514") return { ok: false, error: "Tanggal selesai tidak boleh sebelum tanggal mulai." };
    return { ok: false, error: dbErrorMessage(error) };
  }
  if (!data?.length) return { ok: false, error: "Penugasan tidak ditemukan." };

  revalidateAssignments(data[0].project_id);
  return { ok: true, message: "Penugasan diakhiri." };
}

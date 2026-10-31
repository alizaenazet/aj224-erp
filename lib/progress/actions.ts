"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import {
  sectionProgressSchema,
  sectionSchema,
  stagesSchema,
  type SectionInput,
  type SectionProgressInput,
  type StagesInput,
} from "@/lib/progress/schema";
import { createClient } from "@/lib/supabase/server";

const MANAGERS = ["operations"] as const;
const idSchema = z.uuid("Data tidak valid.");

function revalidateProgress(projectId: string) {
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`, "layout");
}

/** Adds (no `sectionId`) or edits a pulling section (PRJ-05). */
export async function saveSection(input: {
  projectId: string;
  sectionId?: string;
  values: SectionInput;
}): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const projectId = idSchema.safeParse(input.projectId);
  if (!projectId.success) return { ok: false, error: "Proyek tidak valid." };
  const parsed = sectionSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = input.sectionId
    ? await supabase
        .from("project_sections")
        .update(parsed.data)
        .eq("id", input.sectionId)
        .eq("project_id", projectId.data)
    : await supabase.from("project_sections").insert({ ...parsed.data, project_id: projectId.data });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Kode seksi sudah dipakai di proyek ini." };
    return { ok: false, error: dbErrorMessage(error) };
  }

  revalidateProgress(projectId.data);
  return { ok: true, message: input.sectionId ? "Seksi diperbarui." : "Seksi ditambahkan." };
}

export async function deleteSection(input: { projectId: string; sectionId: string }): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const sectionId = idSchema.safeParse(input.sectionId);
  if (!sectionId.success) return { ok: false, error: "Seksi tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_sections")
    .delete()
    .eq("id", sectionId.data)
    .select("project_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Seksi tidak ditemukan." };

  revalidateProgress(data[0].project_id);
  return { ok: true, message: "Seksi dihapus." };
}

/** Saves the project's stage list; removed stages lose their progress (PRJ-06). */
export async function saveProjectStages(input: { projectId: string; stages: StagesInput }): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const projectId = idSchema.safeParse(input.projectId);
  if (!projectId.success) return { ok: false, error: "Proyek tidak valid." };
  const parsed = stagesSchema.safeParse(input.stages);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_project_stages", {
    p_project: projectId.data,
    p_stages: parsed.data.map((stage, index) => ({ ...stage, sort_order: (index + 1) * 10 })),
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Nama tahapan tidak boleh sama." };
    return { ok: false, error: dbErrorMessage(error) };
  }

  revalidateProgress(projectId.data);
  return { ok: true, message: "Tahapan proyek disimpan." };
}

/** Sets the cumulative stage progress of one section; each change is logged (PRJ-06). */
export async function updateSectionProgress(input: {
  projectId: string;
  sectionId: string;
  values: SectionProgressInput;
}): Promise<ActionResult<{ changed: number }>> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const sectionId = idSchema.safeParse(input.sectionId);
  if (!sectionId.success) return { ok: false, error: "Seksi tidak valid." };
  const parsed = sectionProgressSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_section_progress", {
    p_section: sectionId.data,
    p_progress: parsed.data.values,
    p_note: parsed.data.note ?? "",
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateProgress(input.projectId);
  const changed = Number(data ?? 0);
  return {
    ok: true,
    message: changed ? `Progres diperbarui (${changed} tahap).` : "Tidak ada perubahan progres.",
    data: { changed },
  };
}

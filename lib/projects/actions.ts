"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import { SETTABLE_STATUSES } from "@/lib/projects/labels";
import {
  addendumSchema,
  budgetLinesSchema,
  contractSchema,
  projectSchema,
  termSchema,
  type AddendumInput,
  type BudgetLinesInput,
  type ContractInput,
  type ProjectInput,
  type TermInput,
} from "@/lib/projects/schema";
import { createClient } from "@/lib/supabase/server";

const MANAGERS = ["marketing", "finance"] as const;
const idSchema = z.uuid("Proyek tidak valid.");

function revalidateProject(id?: string) {
  revalidatePath("/projects");
  if (id) revalidatePath(`/projects/${id}`, "layout");
  revalidatePath("/marketing/tenders/[id]", "page");
}

/** Creates a project with its contract in one transaction (create_project). */
export async function createProject(input: {
  project: ProjectInput;
  contract: ContractInput;
  tenderId?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const project = projectSchema.safeParse(input.project);
  if (!project.success) return { ok: false, error: firstZodError(project.error) };
  const contract = contractSchema.safeParse(input.contract);
  if (!contract.success) return { ok: false, error: firstZodError(contract.error) };
  const tenderId = input.tenderId ? idSchema.safeParse(input.tenderId) : null;
  if (tenderId && !tenderId.success) return { ok: false, error: "Tender tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_project", {
    p_project: { ...project.data, tender_id: tenderId?.data ?? null },
    p_contract: contract.data,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Tender ini sudah dijadikan proyek." };
    return { ok: false, error: dbErrorMessage(error) };
  }

  revalidateProject();
  return { ok: true, message: "Proyek dibuat.", data: { id: data as string } };
}

export async function updateProject(input: { id: string; values: ProjectInput }): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  const parsed = projectSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").update(parsed.data).eq("id", id.data).select("id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Proyek tidak ditemukan." };

  revalidateProject(id.data);
  return { ok: true, message: "Data proyek disimpan.", data: { id: id.data } };
}

export async function setProjectStatus(input: { id: string; status: string }): Promise<ActionResult> {
  const auth = await assertRole(["finance", "operations"]);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  if (!(SETTABLE_STATUSES as readonly string[]).includes(input.status)) {
    return { ok: false, error: "Penutupan proyek memerlukan checklist penutupan." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_project_status", { p_project: id.data, p_status: input.status });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateProject(id.data);
  return { ok: true, message: "Status proyek diperbarui." };
}

export async function saveContract(input: { projectId: string; values: ContractInput }): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.projectId);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  const parsed = contractSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_contracts")
    .upsert({ project_id: id.data, ...parsed.data }, { onConflict: "project_id" });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateProject(id.data);
  return { ok: true, message: "Data kontrak disimpan." };
}

export async function addAddendum(input: { projectId: string; values: AddendumInput }): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.projectId);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  const parsed = addendumSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("project_addenda").insert({ project_id: id.data, ...parsed.data });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Nomor addendum sudah dipakai di proyek ini." };
    return { ok: false, error: dbErrorMessage(error) };
  }

  revalidateProject(id.data);
  return { ok: true, message: "Addendum ditambahkan." };
}

/** Adds (no `termId`) or edits a payment term (PRJ-03). */
export async function saveTerm(input: {
  projectId: string;
  termId?: string;
  values: TermInput;
}): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.projectId);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  const parsed = termSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { value_type, percent, amount, condition_type, condition_progress, condition_date, ...rest } = parsed.data;
  const row = {
    ...rest,
    percent: value_type === "percent" ? percent : null,
    amount: value_type === "amount" ? amount : null,
    condition_type,
    condition_progress: condition_type === "progress" ? condition_progress : null,
    condition_date: condition_type === "date" ? condition_date : null,
  };

  const supabase = await createClient();
  const { error } = input.termId
    ? await supabase.from("project_terms").update(row).eq("id", input.termId).eq("project_id", id.data)
    : await supabase.from("project_terms").insert({ ...row, project_id: id.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateProject(id.data);
  return { ok: true, message: input.termId ? "Termin diperbarui." : "Termin ditambahkan." };
}

export async function deleteTerm(termId: string): Promise<ActionResult> {
  const auth = await assertRole(MANAGERS);
  if (!auth.ok) return auth;

  const id = z.uuid().safeParse(termId);
  if (!id.success) return { ok: false, error: "Termin tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("project_terms").delete().eq("id", id.data).select("project_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Termin tidak ditemukan." };

  revalidateProject(data[0].project_id);
  return { ok: true, message: "Termin dihapus." };
}

/** Manual Siap Ditagih (e.g. after BAST); Finance is notified (PRJ-03). */
export async function markTermReady(input: { projectId: string; termId: string }): Promise<ActionResult> {
  const auth = await assertRole(["finance", "operations"]);
  if (!auth.ok) return auth;

  const termId = z.uuid().safeParse(input.termId);
  if (!termId.success) return { ok: false, error: "Termin tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_term_ready", { p_term: termId.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateProject(input.projectId);
  return { ok: true, message: "Termin ditandai Siap Ditagih. Finance menerima notifikasi." };
}

/** Saves RAB lines: amounts upserted, empty amounts removed (PRJ-04). */
export async function saveBudget(input: { projectId: string; lines: BudgetLinesInput }): Promise<ActionResult> {
  const auth = await assertRole(["finance", "operations"]);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.projectId);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  const parsed = budgetLinesSchema.safeParse(input.lines);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const keep = parsed.data.filter((line) => line.amount !== null);
  const remove = parsed.data.filter((line) => line.amount === null).map((line) => line.cost_category_id);

  if (keep.length) {
    const { error } = await supabase.from("project_budgets").upsert(
      keep.map((line) => ({
        project_id: id.data,
        cost_category_id: line.cost_category_id,
        amount: line.amount ?? 0,
        notes: line.notes,
      })),
      { onConflict: "project_id,cost_category_id" },
    );
    if (error) return { ok: false, error: dbErrorMessage(error) };
  }
  if (remove.length) {
    const { error } = await supabase
      .from("project_budgets")
      .delete()
      .eq("project_id", id.data)
      .in("cost_category_id", remove);
    if (error) return { ok: false, error: dbErrorMessage(error) };
  }

  revalidateProject(id.data);
  return { ok: true, message: "RAB disimpan." };
}

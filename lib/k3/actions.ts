"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import {
  actionSchema,
  incidentSchema,
  investigationSchema,
  type ActionInput,
  type IncidentInput,
  type InvestigationInput,
} from "@/lib/k3/schema";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid("Data tidak valid.");

function revalidateK3() {
  revalidatePath("/operations/incidents", "layout");
  revalidatePath("/projects/[id]", "layout");
  revalidatePath("/");
}

/** K3-01: report (id null) or edit an incident; time is entered in WIB. */
export async function saveIncident(input: { id: string | null; values: IncidentInput }): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(input.id ? ["operations"] : ["operations", "field"]);
  if (!auth.ok) return auth;
  if (input.id && !idSchema.safeParse(input.id).success) return { ok: false, error: "Insiden tidak valid." };
  const parsed = incidentSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const { people, occurred_date, occurred_time, ...incident } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_incident", {
    // null = new incident (the generated types do not allow null).
    p_id: input.id as string,
    p_incident: { ...incident, occurred_at: `${occurred_date}T${occurred_time}:00+07:00` },
    p_people: people,
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateK3();
  return { ok: true, message: input.id ? "Insiden disimpan." : "Insiden dilaporkan.", data: { id: data as string } };
}

/** K3-03 */
export async function saveInvestigation(input: { id: string; values: InvestigationInput }): Promise<ActionResult> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: "Insiden tidak valid." };
  const parsed = investigationSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_incident_investigation", { p_id: id.data, p_values: parsed.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateK3();
  return { ok: true, message: "Investigasi disimpan." };
}

/** K3-04: add (actionId null) or edit a corrective action. */
export async function saveAction(input: { incidentId: string; actionId: string | null; values: ActionInput }): Promise<ActionResult> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const parsed = actionSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_incident_action", {
    p_id: input.actionId as string,
    p_incident: input.incidentId,
    p_values: parsed.data,
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateK3();
  return { ok: true, message: "Tindakan perbaikan disimpan." };
}

export async function completeAction(input: { id: string; note: string }): Promise<ActionResult> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: "Tindakan tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_incident_action", { p_id: id.data, p_note: input.note.slice(0, 500) });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateK3();
  return { ok: true, message: "Tindakan ditandai Selesai." };
}

export async function closeIncident(input: { id: string }): Promise<ActionResult> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: "Insiden tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_incident", { p_id: id.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateK3();
  return { ok: true, message: "Insiden ditutup." };
}

export async function cancelIncident(input: { id: string; reason: string }): Promise<ActionResult> {
  const auth = await assertRole(["operations"]);
  if (!auth.ok) return auth;
  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: "Insiden tidak valid." };
  const reason = z.string().trim().min(1, "Isi alasan pembatalan.").max(300).safeParse(input.reason);
  if (!reason.success) return { ok: false, error: firstZodError(reason.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_incident", { p_id: id.data, p_reason: reason.data });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidateK3();
  return { ok: true, message: "Insiden dibatalkan." };
}

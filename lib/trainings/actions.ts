"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PARTICIPANT_RESULTS } from "@/lib/trainings/labels";
import { employeeIdsSchema, trainingSchema, type TrainingInput } from "@/lib/trainings/schema";

const LIST_PATH = "/hr/trainings";
const idSchema = z.uuid("Pelatihan tidak valid.");

// Results create or remove certificates, which change needs and certificate lists.
function revalidateTraining(id?: string) {
  revalidatePath(LIST_PATH);
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
  revalidatePath("/hr/training-needs");
  revalidatePath("/hr/certificates");
  revalidatePath("/hr/employees/[id]", "page");
}

export async function createTraining(input: {
  values: TrainingInput;
  employeeIds: string[];
}): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const parsed = trainingSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
  const employeeIds = employeeIdsSchema.safeParse(input.employeeIds);
  if (!employeeIds.success) return { ok: false, error: firstZodError(employeeIds.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.from("trainings").insert(parsed.data).select("id").single();
  if (error) return { ok: false, error: dbErrorMessage(error) };

  if (employeeIds.data.length) {
    const { error: participantError } = await supabase
      .from("training_participants")
      .insert([...new Set(employeeIds.data)].map((employeeId) => ({ training_id: data.id, employee_id: employeeId })));
    if (participantError) {
      await supabase.from("trainings").delete().eq("id", data.id);
      return { ok: false, error: dbErrorMessage(participantError, "Peserta gagal disimpan. Coba lagi.") };
    }
  }

  revalidateTraining(data.id);
  return { ok: true, message: "Pelatihan ditambahkan.", data: { id: data.id } };
}

export async function updateTraining(input: {
  id: string;
  values: TrainingInput;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.id);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  const parsed = trainingSchema.safeParse(input.values);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.from("trainings").update(parsed.data).eq("id", id.data).select("id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Pelatihan tidak ditemukan." };

  revalidateTraining(id.data);
  return { ok: true, message: "Pelatihan disimpan.", data: { id: id.data } };
}

export async function deleteTraining(trainingId: string): Promise<ActionResult> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(trainingId);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.from("trainings").delete().eq("id", id.data).select("id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Pelatihan tidak ditemukan." };

  revalidateTraining();
  return { ok: true, message: "Pelatihan dihapus." };
}

export async function addParticipants(input: {
  trainingId: string;
  employeeIds: string[];
}): Promise<ActionResult> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const id = idSchema.safeParse(input.trainingId);
  if (!id.success) return { ok: false, error: firstZodError(id.error) };
  const employeeIds = employeeIdsSchema.min(1, "Pilih peserta.").safeParse(input.employeeIds);
  if (!employeeIds.success) return { ok: false, error: firstZodError(employeeIds.error) };

  const supabase = await createClient();
  // Employees already in the training are skipped (one row per participant).
  const { error } = await supabase
    .from("training_participants")
    .upsert(
      employeeIds.data.map((employeeId) => ({ training_id: id.data, employee_id: employeeId })),
      { onConflict: "training_id,employee_id", ignoreDuplicates: true },
    );
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateTraining(id.data);
  return { ok: true, message: "Peserta ditambahkan." };
}

const participantSchema = z.object({
  trainingId: idSchema,
  employeeId: z.uuid("Peserta tidak valid."),
});

export async function removeParticipant(input: z.infer<typeof participantSchema>): Promise<ActionResult> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const parsed = participantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data: participant } = await supabase
    .from("training_participants")
    .select("result")
    .eq("training_id", parsed.data.trainingId)
    .eq("employee_id", parsed.data.employeeId)
    .maybeSingle();
  if (!participant) return { ok: false, error: "Peserta tidak ditemukan." };
  if (participant.result === "passed") {
    return { ok: false, error: "Ubah hasil peserta yang Lulus terlebih dahulu sebelum menghapusnya." };
  }

  const { error } = await supabase
    .from("training_participants")
    .delete()
    .eq("training_id", parsed.data.trainingId)
    .eq("employee_id", parsed.data.employeeId);
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidateTraining(parsed.data.trainingId);
  return { ok: true, message: "Peserta dihapus." };
}

const resultSchema = participantSchema.extend({
  result: z.enum(PARTICIPANT_RESULTS, "Hasil tidak valid."),
});

/** Sets a result; Lulus creates the certificate in the database (HCM-07). */
export async function setParticipantResult(input: z.infer<typeof resultSchema>): Promise<ActionResult> {
  const auth = await assertRole(["hcm"]);
  if (!auth.ok) return auth;

  const parsed = resultSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_participants")
    .update({ result: parsed.data.result })
    .eq("training_id", parsed.data.trainingId)
    .eq("employee_id", parsed.data.employeeId)
    .select("certificate_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Peserta tidak ditemukan." };

  revalidateTraining(parsed.data.trainingId);
  const certificateCreated = parsed.data.result === "passed" && data[0].certificate_id;
  return {
    ok: true,
    message: certificateCreated ? "Hasil disimpan. Sertifikat peserta dibuat." : "Hasil disimpan.",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, firstZodError, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import { STAGE_MANAGE_ROLES } from "@/lib/master-data/entities";
import { createClient } from "@/lib/supabase/server";

const stageSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Nama tahapan wajib diisi.").max(80, "Nama tahapan maksimal 80 karakter."),
  default_weight: z
    .number({ error: "Bobot harus angka." })
    .gt(0, "Bobot harus lebih dari 0.")
    .max(100, "Bobot maksimal 100."),
  is_active: z.boolean(),
});

const templateSchema = z
  .array(stageSchema)
  .min(1, "Minimal satu tahapan.")
  .superRefine((stages, ctx) => {
    const total = stages
      .filter((stage) => stage.is_active)
      .reduce((sum, stage) => sum + stage.default_weight, 0);
    if (Math.abs(total - 100) > 0.001) {
      ctx.addIssue({
        code: "custom",
        message: `Total bobot harus 100 (sekarang ${Number(total.toFixed(2))})`,
      });
    }
  });

export type StageInput = z.infer<typeof stageSchema>;

/** Saves the whole stage template at once (MST-08); the DB re-checks the total. */
export async function saveStageTemplate(stages: StageInput[]): Promise<ActionResult> {
  const auth = await assertRole(STAGE_MANAGE_ROLES);
  if (!auth.ok) return auth;

  const parsed = templateSchema.safeParse(stages);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_stage_template", {
    p_stages: parsed.data.map((stage, index) => ({ ...stage, sort_order: (index + 1) * 10 })),
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidatePath("/settings/master-data/stages");
  return { ok: true, message: "Template tahapan disimpan." };
}

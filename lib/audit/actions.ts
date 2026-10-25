"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/actions";
import type { AuditEntry } from "@/lib/audit/labels";
import { AUDIT_SELECT, enrichAuditRows } from "@/lib/audit/queries";
import { assertRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const historySchema = z.object({
  table: z.string().min(1).max(63),
  recordId: z.string().min(1).max(100),
});

/** Change history of one record, newest first (Super Admin, Direktur). */
export async function getRecordHistory(
  input: z.infer<typeof historySchema>,
): Promise<ActionResult<AuditEntry[]>> {
  const auth = await assertRole(["super_admin", "director"]);
  if (!auth.ok) return auth;

  const parsed = historySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Data tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select(AUDIT_SELECT)
    .eq("table_name", parsed.data.table)
    .eq("record_id", parsed.data.recordId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { ok: false, error: "Riwayat gagal dimuat." };

  return { ok: true, data: await enrichAuditRows(data as never) };
}

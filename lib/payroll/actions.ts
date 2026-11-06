"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, type ActionResult } from "@/lib/actions";
import { assertRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Role = "hcm" | "director" | "finance";
const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.");

async function run(roles: Role[], call: (supabase: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ data: unknown; error: Parameters<typeof dbErrorMessage>[0] | null }>, message: string): Promise<ActionResult<{ id: string }>> {
  const auth = await assertRole(roles);
  if (!auth.ok) return auth;
  const supabase = await createClient();
  const { data, error } = await call(supabase);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidatePath("/hr/payroll", "layout");
  revalidatePath("/hr/kasbon");
  revalidatePath("/");
  return { ok: true, message, data: typeof data === "string" ? { id: data } : undefined };
}

const periodSchema = z
  .object({
    name: z.string().trim().min(1, "Isi nama periode.").max(80),
    period_start: dateText,
    period_end: dateText,
    group_kind: z.enum(["field", "office", "all"]),
  })
  .refine((value) => value.period_end >= value.period_start, { path: ["period_end"], message: "Tanggal selesai sebelum tanggal mulai." });

/** PAY-01 */
export async function createPeriod(values: z.input<typeof periodSchema>) {
  const parsed = periodSchema.safeParse(values);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  return run(["hcm"], (s) => s.rpc("create_payroll_period", { p_values: parsed.data }), "Periode gaji dibuat.");
}

/** PAY-02 */
export async function generatePayroll(input: { id: string }) {
  return run(["hcm"], (s) => s.rpc("generate_payroll", { p_period: input.id }), "Draf payroll dihitung dari absensi, pengaturan gaji dan kasbon.");
}

const adjustmentSchema = z.object({
  period_id: z.uuid(),
  employee_id: z.uuid(),
  kind: z.enum(["incentive", "pph21", "other_deduction", "correction"]),
  amount: z.coerce.number().refine((value) => value !== 0, "Jumlah tidak boleh 0."),
  note: z.string().trim().min(1, "Isi keterangan.").max(300),
});

/** PAY-03 */
export async function addAdjustment(values: z.input<typeof adjustmentSchema>) {
  const parsed = adjustmentSchema.safeParse(values);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  if (parsed.data.kind !== "correction" && parsed.data.amount < 0) return { ok: false as const, error: "Jumlah harus lebih dari 0." };
  return run(["hcm"], (s) => s.rpc("save_payslip_adjustment", { p_values: parsed.data }), "Penyesuaian disimpan; slip dihitung ulang.");
}

export async function deleteAdjustment(input: { id: string }) {
  return run(["hcm"], (s) => s.rpc("delete_payslip_adjustment", { p_id: input.id }), "Penyesuaian dihapus.");
}

/** PAY-04 */
export async function submitPayroll(input: { id: string }) {
  return run(["hcm"], (s) => s.rpc("submit_payroll", { p_period: input.id }), "Payroll dihitung ulang dan diajukan ke Direktur; absensi periode dikunci.");
}

export async function returnPayroll(input: { id: string; note: string }) {
  if (!input.note.trim()) return { ok: false as const, error: "Isi catatan pengembalian." };
  return run(["director"], (s) => s.rpc("return_payroll", { p_period: input.id, p_note: input.note }), "Payroll dikembalikan ke HCM.");
}

export async function approvePayroll(input: { id: string }) {
  return run(["director"], (s) => s.rpc("approve_payroll", { p_period: input.id }), "Payroll disetujui.");
}

export async function cancelPeriod(input: { id: string; reason: string }) {
  if (!input.reason.trim()) return { ok: false as const, error: "Isi alasan pembatalan." };
  return run(["hcm"], (s) => s.rpc("cancel_payroll_period", { p_period: input.id, p_reason: input.reason }), "Periode dibatalkan.");
}

/** PAY-06: slips null = all unpaid slips. */
export async function paySlips(input: { periodId: string; slips: string[] | null; date: string; method: "transfer" | "cash" }) {
  if (!dateText.safeParse(input.date).success) return { ok: false as const, error: "Tanggal tidak valid." };
  return run(
    ["finance"],
    (s) => s.rpc("pay_payslips", { p_period: input.periodId, p_slips: input.slips as string[], p_date: input.date, p_method: input.method }),
    "Slip ditandai dibayar.",
  );
}

/** HCM-11 */
export async function correctAttendance(input: { employeeId: string; date: string; status: string; overtime: number; reason: string }) {
  if (!input.reason.trim()) return { ok: false as const, error: "Isi alasan koreksi." };
  if (!dateText.safeParse(input.date).success) return { ok: false as const, error: "Tanggal tidak valid." };
  return run(
    ["hcm"],
    (s) =>
      s.rpc("correct_attendance", {
        p_employee: input.employeeId,
        p_date: input.date,
        p_status: input.status,
        p_overtime: input.overtime,
        p_reason: input.reason,
      }),
    "Absensi dikoreksi; selisihnya masuk payroll berikutnya.",
  );
}

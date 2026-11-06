import { z } from "zod";

// Shared by forms and actions; each schema accepts its own output.

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const money = (label: string) =>
  z.coerce.number({ error: `${label} tidak valid.` }).min(0, `${label} tidak boleh negatif.`).max(1e13, `${label} terlalu besar.`);
const dateText = (label: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `Isi ${label}.`);

/** FIN-01, FIN-02 (Draft fields; amounts are recomputed in SQL). */
export const invoiceSchema = z
  .object({
    kind: z.enum(["term", "other"]),
    project_id: z.preprocess(emptyToNull, z.uuid().nullable()),
    term_id: z.preprocess(emptyToNull, z.uuid().nullable()),
    description: z.preprocess(emptyToNull, z.string().max(300, "Uraian maksimal 300 karakter.").nullable()),
    invoice_date: dateText("tanggal invoice"),
    due_date: z.preprocess(emptyToNull, dateText("jatuh tempo").nullable()),
    gross_amount: money("Nilai bruto"),
    dp_deduction: money("Pengembalian uang muka"),
    retention_deduction: money("Retensi"),
    other_deduction: money("Potongan lain"),
    other_deduction_note: z.preprocess(emptyToNull, z.string().max(200).nullable()),
    notes: z.preprocess(emptyToNull, z.string().max(500).nullable()),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "term" && !value.term_id) ctx.addIssue({ code: "custom", path: ["term_id"], message: "Pilih termin." });
    if (value.kind === "other" && !value.project_id) ctx.addIssue({ code: "custom", path: ["project_id"], message: "Pilih proyek." });
    if (value.kind === "other" && !value.description) ctx.addIssue({ code: "custom", path: ["description"], message: "Isi uraian." });
    if (value.other_deduction > 0 && !value.other_deduction_note) {
      ctx.addIssue({ code: "custom", path: ["other_deduction_note"], message: "Isi keterangan potongan lain." });
    }
    if (value.dp_deduction + value.retention_deduction + value.other_deduction > value.gross_amount) {
      ctx.addIssue({ code: "custom", path: ["gross_amount"], message: "Potongan melebihi nilai bruto." });
    }
  });

export type InvoiceInput = z.output<typeof invoiceSchema>;

/** FIN-03 */
export const paymentSchema = z
  .object({
    payment_date: dateText("tanggal pembayaran"),
    amount_received: money("Jumlah diterima"),
    pph_amount: money("Potongan PPh"),
    pph_slip_no: z.preprocess(emptyToNull, z.string().max(60).nullable()),
    bank_account_id: z.preprocess(emptyToNull, z.uuid().nullable()),
    notes: z.preprocess(emptyToNull, z.string().max(300).nullable()),
  })
  .refine((value) => value.amount_received + value.pph_amount > 0, { path: ["amount_received"], message: "Isi jumlah diterima." })
  .refine((value) => value.pph_amount === 0 || Boolean(value.pph_slip_no), { path: ["pph_slip_no"], message: "Isi nomor bukti potong." });

export type PaymentInput = z.output<typeof paymentSchema>;

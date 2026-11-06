import { z } from "zod";

// Change D form schemas, shared by forms and actions (each accepts its own output).

export function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export const money = (label: string) =>
  z.coerce.number({ error: `${label} tidak valid.` }).min(0, `${label} tidak boleh negatif.`).max(1e13, `${label} terlalu besar.`);
export const positiveMoney = (label: string) =>
  z.coerce.number({ error: `${label} wajib diisi.` }).gt(0, `${label} harus lebih dari 0.`).max(1e13, `${label} terlalu besar.`);
export const dateText = (label: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `Isi ${label}.`);
const optionalUuid = z.preprocess(emptyToNull, z.uuid().nullable());

/** FIN-06: project_id null = Kantor/Umum. */
export const billSchema = z.object({
  supplier_id: z.uuid("Pilih supplier."),
  bill_no: z.string().trim().min(1, "Isi nomor nota/faktur.").max(60),
  bill_date: dateText("tanggal nota"),
  due_date: z.preprocess(emptyToNull, dateText("jatuh tempo").nullable()),
  ppn_amount: money("PPN"),
  delivery_note_id: optionalUuid,
  notes: z.preprocess(emptyToNull, z.string().max(500).nullable()),
  lines: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Setiap baris wajib memiliki uraian.").max(300),
        amount: positiveMoney("Jumlah baris"),
        project_id: optionalUuid,
        cost_category_id: z.uuid("Setiap baris wajib memiliki kategori biaya."),
      }),
    )
    .min(1, "Tambahkan minimal satu baris rincian."),
});

export type BillInput = z.output<typeof billSchema>;

/** FIN-07 */
export const billPaymentSchema = z.object({
  payment_date: dateText("tanggal pembayaran"),
  amount: positiveMoney("Jumlah pembayaran"),
  method: z.enum(["transfer", "cash"]),
  bank_account_id: optionalUuid,
  notes: z.preprocess(emptyToNull, z.string().max(300).nullable()),
});

export type BillPaymentInput = z.output<typeof billPaymentSchema>;

/** FIN-09 */
export const expenseSchema = z
  .object({
    expense_date: dateText("tanggal"),
    project_id: optionalUuid,
    cost_category_id: z.uuid("Pilih kategori biaya."),
    amount: positiveMoney("Jumlah"),
    payee: z.preprocess(emptyToNull, z.string().max(120).nullable()),
    method: z.enum(["cash", "transfer"]),
    description: z.string().trim().min(1, "Isi keterangan.").max(300),
    no_receipt: z.boolean(),
    no_receipt_note: z.preprocess(emptyToNull, z.string().max(300).nullable()),
    delivery_note_id: optionalUuid,
  })
  .refine((value) => !value.no_receipt || Boolean(value.no_receipt_note), {
    path: ["no_receipt_note"],
    message: "Pengeluaran tanpa nota wajib diberi keterangan.",
  });

export type ExpenseInput = z.output<typeof expenseSchema>;

/** FIN-10 top-up / return */
export const movementSchema = z.object({
  project_id: z.uuid("Pilih proyek."),
  kind: z.enum(["topup", "return"]),
  movement_date: dateText("tanggal"),
  amount: positiveMoney("Jumlah"),
  pic_employee_id: optionalUuid,
  method: z.enum(["transfer", "cash"]),
  bank_account_id: optionalUuid,
  notes: z.preprocess(emptyToNull, z.string().max(300).nullable()),
});

export type MovementInput = z.output<typeof movementSchema>;

/** FIN-10 field spending */
export const fieldExpenseSchema = z
  .object({
    project_id: z.uuid("Pilih proyek."),
    expense_date: dateText("tanggal"),
    kind: z.enum(["project_cost", "kasbon", "wage_payment"]),
    cost_category_id: optionalUuid,
    employee_id: optionalUuid,
    installment_amount: z.preprocess((value) => (value === "" || value === null ? null : value), z.coerce.number().gt(0).nullable()),
    amount: positiveMoney("Jumlah"),
    description: z.string().trim().min(1, "Isi keterangan.").max(300),
    no_receipt: z.boolean(),
    no_receipt_note: z.preprocess(emptyToNull, z.string().max(300).nullable()),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "project_cost" && !value.cost_category_id) {
      ctx.addIssue({ code: "custom", path: ["cost_category_id"], message: "Pilih kategori biaya." });
    }
    if (value.kind !== "project_cost" && !value.employee_id) {
      ctx.addIssue({ code: "custom", path: ["employee_id"], message: "Pilih karyawan." });
    }
    if (value.kind === "kasbon" && value.installment_amount !== null && value.installment_amount > value.amount) {
      ctx.addIssue({ code: "custom", path: ["installment_amount"], message: "Cicilan tidak boleh melebihi jumlah kasbon." });
    }
    if (value.no_receipt && !value.no_receipt_note) {
      ctx.addIssue({ code: "custom", path: ["no_receipt_note"], message: "Pengeluaran tanpa nota wajib diberi keterangan." });
    }
  });

export type FieldExpenseInput = z.output<typeof fieldExpenseSchema>;

/** PAY-05 */
export const kasbonSchema = z
  .object({
    employee_id: z.uuid("Pilih karyawan."),
    kasbon_date: dateText("tanggal"),
    amount: positiveMoney("Jumlah kasbon"),
    installment_amount: positiveMoney("Cicilan per periode"),
    description: z.preprocess(emptyToNull, z.string().max(300).nullable()),
  })
  .refine((value) => value.installment_amount <= value.amount, {
    path: ["installment_amount"],
    message: "Cicilan tidak boleh melebihi jumlah kasbon.",
  });

export type KasbonInput = z.output<typeof kasbonSchema>;

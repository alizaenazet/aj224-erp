import "server-only";

import { dbErrorMessage } from "@/lib/actions";
import { RowReader, normalizeName } from "@/lib/import/cells";
import type { ImportColumn, ImportContext, ImportTemplate, Prepared, RowError } from "@/lib/import/types";

// Opening balances for payables, project cost and kasbon (UMM-13, PRD §16).

async function insertEach<T>(valid: Prepared<T>[], call: (value: T) => PromiseLike<{ error: unknown }>) {
  let inserted = 0;
  const errors: RowError[] = [];
  for (const item of valid) {
    const { error } = await call(item.value);
    if (error) errors.push({ row: item.row, message: dbErrorMessage(error as never, "Baris gagal disimpan.") });
    else inserted += 1;
  }
  return { inserted, errors };
}

const BILL_COLUMNS: ImportColumn[] = [
  { key: "supplier_id", header: "Supplier", required: true, note: "Nama supplier yang sudah ada.", example: "CV Sarana Stringing", width: 26 },
  { key: "bill_no", header: "No. Nota", required: true, note: "Unik per supplier.", example: "NS-190", width: 16 },
  { key: "bill_date", header: "Tanggal", required: true, note: "Tanggal nota.", example: "20/09/2026", format: "date" },
  { key: "due_date", header: "Jatuh Tempo", note: "Kosongkan bila sama dengan tanggal.", example: "20/10/2026", format: "date" },
  { key: "total", header: "Total", required: true, note: "Termasuk PPN.", example: "5000000", format: "rupiah" },
  { key: "ppn_amount", header: "PPN", note: "0 bila tanpa PPN.", example: "0", format: "rupiah" },
  { key: "paid", header: "Sudah Dibayar", note: "0 bila belum dibayar.", example: "1000000", format: "rupiah" },
];

type OpeningBill = { supplier_id: string; bill_no: string; bill_date: string; due_date: string | null; total: number; ppn_amount: number; paid: number };

/** Saldo awal utang: open bills; not costs (cost to cut-off is imported per category). */
export const openingBillsTemplate: ImportTemplate<OpeningBill> = {
  key: "opening-bills",
  title: "Saldo Awal Utang",
  description: "Tagihan supplier sebelum cut-off yang belum lunas. Tidak dihitung sebagai biaya proyek.",
  roles: ["finance"],
  fileBase: "templat-saldo-awal-utang",
  columns: BILL_COLUMNS,
  async references(ctx) {
    const { data } = await ctx.supabase.from("suppliers").select("name").order("name");
    return [{ title: "Supplier", values: (data ?? []).map((row) => row.name) }];
  },
  async prepare(rows, ctx) {
    const { data } = await ctx.supabase.from("suppliers").select("id, name");
    const suppliers = new Map((data ?? []).map((row) => [normalizeName(row.name), row.id]));
    const valid: Prepared<OpeningBill>[] = [];
    const errors: RowError[] = [];
    for (const row of rows) {
      const reader = new RowReader(row, BILL_COLUMNS);
      const supplier = reader.lookup("supplier_id", suppliers, "Supplier");
      const billNo = reader.text("bill_no");
      const billDate = reader.date("bill_date");
      const total = reader.number("total");
      const ppn = reader.number("ppn_amount") ?? 0;
      const paid = reader.number("paid") ?? 0;
      if (!billNo) reader.fail("bill_no", "No. nota wajib diisi.");
      if (!billDate) reader.fail("bill_date", "Tanggal wajib diisi.");
      if (total === null || total <= 0) reader.fail("total", "Total harus lebih dari 0.");
      if (total !== null && (ppn < 0 || ppn > total)) reader.fail("ppn_amount", "PPN tidak valid.");
      if (total !== null && (paid < 0 || paid > total)) reader.fail("paid", "Sudah dibayar melebihi total.");
      if (reader.errors.length || !supplier || !billNo || !billDate || total === null) {
        errors.push(...reader.errors);
        continue;
      }
      valid.push({ row: row.row, value: { supplier_id: supplier, bill_no: billNo, bill_date: billDate, due_date: reader.date("due_date"), total, ppn_amount: ppn, paid } });
    }
    return { valid, errors };
  },
  insert: (valid, ctx) => insertEach(valid, (value) => ctx.supabase.rpc("import_opening_bill", { p_values: value })),
};

const COST_COLUMNS: ImportColumn[] = [
  { key: "project_id", header: "Kode Proyek", required: true, note: "Kode proyek berjalan.", example: "PRJ/AJ224/2026/001", width: 22 },
  { key: "cost_category_id", header: "Kategori Biaya", required: true, note: "Nama kategori biaya.", example: "Upah & Gaji", width: 24 },
  { key: "amount", header: "Jumlah", required: true, note: "Total biaya s.d. cut-off.", example: "150000000", format: "rupiah" },
  { key: "expense_date", header: "Tanggal Cut-off", required: true, note: "Tanggal saldo awal.", example: "31/10/2026", format: "date" },
];

type OpeningCost = { project_id: string; cost_category_id: string; amount: number; expense_date: string };

/** Saldo awal biaya proyek: one row per project × category (counts as cost). */
export const openingCostsTemplate: ImportTemplate<OpeningCost> = {
  key: "opening-costs",
  title: "Saldo Awal Biaya Proyek",
  description: "Biaya proyek berjalan s.d. cut-off, satu baris per kategori, agar L/R tetap lengkap.",
  roles: ["finance"],
  fileBase: "templat-saldo-awal-biaya",
  columns: COST_COLUMNS,
  async references(ctx) {
    const [{ data: projects }, { data: categories }] = await Promise.all([
      ctx.supabase.from("projects").select("code").order("code"),
      ctx.supabase.from("cost_categories").select("name").eq("is_active", true).order("sort_order"),
    ]);
    return [
      { title: "Proyek", values: (projects ?? []).map((row) => row.code) },
      { title: "Kategori Biaya", values: (categories ?? []).map((row) => row.name) },
    ];
  },
  async prepare(rows, ctx: ImportContext) {
    const [{ data: projects }, { data: categories }] = await Promise.all([
      ctx.supabase.from("projects").select("id, code"),
      ctx.supabase.from("cost_categories").select("id, name"),
    ]);
    const projectIds = new Map((projects ?? []).map((row) => [normalizeName(row.code), row.id]));
    const categoryIds = new Map((categories ?? []).map((row) => [normalizeName(row.name), row.id]));
    const valid: Prepared<OpeningCost>[] = [];
    const errors: RowError[] = [];
    for (const row of rows) {
      const reader = new RowReader(row, COST_COLUMNS);
      const project = reader.lookup("project_id", projectIds, "Proyek");
      const category = reader.lookup("cost_category_id", categoryIds, "Kategori biaya");
      const amount = reader.number("amount");
      const date = reader.date("expense_date");
      if (amount === null || amount <= 0) reader.fail("amount", "Jumlah harus lebih dari 0.");
      if (!date) reader.fail("expense_date", "Tanggal wajib diisi.");
      if (reader.errors.length || !project || !category || amount === null || !date) {
        errors.push(...reader.errors);
        continue;
      }
      valid.push({ row: row.row, value: { project_id: project, cost_category_id: category, amount, expense_date: date } });
    }
    return { valid, errors };
  },
  insert: (valid, ctx) =>
    insertEach(valid, (value) =>
      ctx.supabase.rpc("save_expense", {
        p_id: null as unknown as string,
        p_values: { ...value, description: "Saldo awal biaya s.d. cut-off", is_opening: true },
      }),
    ),
};

const KASBON_COLUMNS: ImportColumn[] = [
  { key: "employee_id", header: "NIK Karyawan", required: true, note: "NIK karyawan di sistem.", example: "AJ-0005", width: 16 },
  { key: "kasbon_date", header: "Tanggal", required: true, note: "Tanggal saldo.", example: "31/10/2026", format: "date" },
  { key: "amount", header: "Sisa Kasbon", required: true, note: "Saldo yang belum dipotong.", example: "600000", format: "rupiah" },
  { key: "installment_amount", header: "Cicilan per Periode", required: true, note: "Tidak melebihi sisa.", example: "200000", format: "rupiah" },
  { key: "description", header: "Keterangan", note: "Opsional.", example: "Saldo awal", width: 24 },
];

type OpeningKasbon = { employee_id: string; kasbon_date: string; amount: number; installment_amount: number; description: string | null };

/** Saldo awal kasbon per karyawan (PAY-05). */
export const openingKasbonTemplate: ImportTemplate<OpeningKasbon> = {
  key: "opening-kasbon",
  title: "Saldo Awal Kasbon",
  description: "Kasbon terbuka per karyawan beserta cicilan per periode.",
  roles: ["hcm", "finance"],
  fileBase: "templat-saldo-awal-kasbon",
  columns: KASBON_COLUMNS,
  async prepare(rows, ctx) {
    const { data } = await ctx.supabase.from("employees").select("id, employee_no");
    const employees = new Map((data ?? []).map((row) => [normalizeName(row.employee_no), row.id]));
    const valid: Prepared<OpeningKasbon>[] = [];
    const errors: RowError[] = [];
    for (const row of rows) {
      const reader = new RowReader(row, KASBON_COLUMNS);
      const employee = reader.lookup("employee_id", employees, "Karyawan");
      const date = reader.date("kasbon_date");
      const amount = reader.number("amount");
      const installment = reader.number("installment_amount");
      if (!date) reader.fail("kasbon_date", "Tanggal wajib diisi.");
      if (amount === null || amount <= 0) reader.fail("amount", "Sisa kasbon harus lebih dari 0.");
      if (installment === null || installment <= 0 || (amount !== null && installment > amount)) {
        reader.fail("installment_amount", "Cicilan harus lebih dari 0 dan tidak melebihi sisa.");
      }
      if (reader.errors.length || !employee || !date || amount === null || installment === null) {
        errors.push(...reader.errors);
        continue;
      }
      valid.push({ row: row.row, value: { employee_id: employee, kasbon_date: date, amount, installment_amount: installment, description: reader.text("description") } });
    }
    return { valid, errors };
  },
  insert: (valid, ctx) => insertEach(valid, (value) => ctx.supabase.rpc("save_kasbon", { p_values: { ...value, source: "opening" } })),
};

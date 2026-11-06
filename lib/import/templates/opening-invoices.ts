import "server-only";

import { dbErrorMessage } from "@/lib/actions";
import { RowReader, normalizeName } from "@/lib/import/cells";
import type { ImportColumn, ImportTemplate, Prepared, RowError } from "@/lib/import/types";

type OpeningInvoice = {
  project_id: string;
  number: string;
  invoice_date: string;
  due_date: string | null;
  description: string | null;
  dpp: number;
  ppn_amount: number;
  received: number;
};

const COLUMNS: ImportColumn[] = [
  { key: "project_id", header: "Kode Proyek", required: true, note: "Kode proyek yang sudah ada.", example: "PRJ/AJ224/2026/001", width: 22 },
  { key: "number", header: "No. Invoice", required: true, note: "Nomor invoice lama; harus unik.", example: "INV/2026/09/015", width: 20 },
  { key: "invoice_date", header: "Tanggal", required: true, note: "Tanggal invoice.", example: "15/09/2026", format: "date" },
  { key: "due_date", header: "Jatuh Tempo", note: "Kosongkan bila sama dengan tanggal.", example: "15/10/2026", format: "date" },
  { key: "description", header: "Uraian", note: "Mis. Termin 1.", example: "Termin 1", width: 24 },
  { key: "dpp", header: "DPP", required: true, note: "Nilai sebelum PPN.", example: "100000000", format: "rupiah" },
  { key: "ppn_amount", header: "PPN", note: "0 bila tanpa PPN.", example: "11000000", format: "rupiah" },
  { key: "received", header: "Sudah Diterima", note: "Termasuk potongan PPh; 0 bila belum dibayar.", example: "50000000", format: "rupiah" },
];

/** Saldo awal piutang (UMM-13, FIN-04): issued invoices from before cut-off. */
export const openingInvoicesTemplate: ImportTemplate<OpeningInvoice> = {
  key: "opening-invoices",
  title: "Saldo Awal Piutang",
  description: "Invoice sebelum cut-off beserta jumlah yang sudah diterima.",
  roles: ["finance"],
  fileBase: "templat-saldo-awal-piutang",
  columns: COLUMNS,

  async references(ctx) {
    const { data } = await ctx.supabase.from("projects").select("code, name").order("code");
    return [{ title: "Proyek", values: (data ?? []).map((row) => `${row.code} — ${row.name}`) }];
  },

  async prepare(rows, ctx) {
    const [{ data: projects }, { data: existing }] = await Promise.all([
      ctx.supabase.from("projects").select("id, code"),
      ctx.supabase.from("invoices").select("number").not("number", "is", null),
    ]);
    const projectIds = new Map((projects ?? []).map((row) => [normalizeName(row.code), row.id]));
    const seen = new Set((existing ?? []).map((row) => normalizeName(row.number as string)));
    const valid: Prepared<OpeningInvoice>[] = [];
    const errors: RowError[] = [];

    for (const row of rows) {
      const reader = new RowReader(row, COLUMNS);
      const project = reader.lookup("project_id", projectIds, "Proyek");
      const number = reader.text("number");
      const invoiceDate = reader.date("invoice_date");
      const dueDate = reader.date("due_date");
      const dpp = reader.number("dpp");
      const ppn = reader.number("ppn_amount") ?? 0;
      const received = reader.number("received") ?? 0;
      if (!number) reader.fail("number", "No. invoice wajib diisi.");
      else if (seen.has(normalizeName(number))) reader.fail("number", "Nomor invoice sudah ada.");
      if (!invoiceDate) reader.fail("invoice_date", "Tanggal wajib diisi.");
      if (dpp === null || dpp < 0) reader.fail("dpp", "DPP wajib diisi dan tidak negatif.");
      if (ppn < 0) reader.fail("ppn_amount", "PPN tidak boleh negatif.");
      if (dpp !== null && ppn > dpp) reader.fail("ppn_amount", "PPN tidak boleh melebihi DPP.");
      if (received < 0) reader.fail("received", "Sudah diterima tidak boleh negatif.");
      if (dpp !== null && received > dpp + ppn) reader.fail("received", "Sudah diterima melebihi total invoice.");
      if (invoiceDate && dueDate && dueDate < invoiceDate) reader.fail("due_date", "Jatuh tempo sebelum tanggal invoice.");
      if (reader.errors.length || !project || !number || !invoiceDate || dpp === null) {
        errors.push(...reader.errors);
        continue;
      }
      seen.add(normalizeName(number));
      valid.push({
        row: row.row,
        value: { project_id: project, number, invoice_date: invoiceDate, due_date: dueDate, description: reader.text("description"), dpp, ppn_amount: ppn, received },
      });
    }
    return { valid, errors };
  },

  async insert(valid, ctx) {
    let inserted = 0;
    const errors: RowError[] = [];
    for (const item of valid) {
      const { error } = await ctx.supabase.rpc("import_opening_invoice", { p_values: item.value });
      if (error) errors.push({ row: item.row, message: dbErrorMessage(error, "Baris gagal disimpan.") });
      else inserted += 1;
    }
    return { inserted, errors };
  },
};

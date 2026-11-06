import "server-only";

import {
  BILL_STATUS_LABELS,
  DUE_GROUP_LABELS,
  KASBON_VIEW_ROLES,
  METHOD_LABELS,
  PAYABLE_VIEW_ROLES,
  type BillRow,
  type ExpenseRow,
  type KasbonRow,
} from "@/lib/bills/labels";
import {
  parseBillListParams,
  parseExpenseListParams,
  parseKasbonListParams,
  queryBills,
  queryExpenses,
  queryKasbons,
  queryPayableAging,
} from "@/lib/bills/queries";
import { defineExport } from "@/lib/export/define";

type PayableAging = Awaited<ReturnType<typeof queryPayableAging>>["rows"][number];

/** Payables, expense and kasbon exports (UMM-04). */
export const PAYABLE_EXPORTS = {
  bills: defineExport<BillRow>({
    roles: PAYABLE_VIEW_ROLES,
    fileBase: "tagihan-supplier",
    sheetName: "Tagihan Supplier",
    columns: [
      { header: "Supplier", value: (row) => row.supplier_name, width: 28 },
      { header: "No. Nota", value: (row) => row.bill_no, width: 18 },
      { header: "Tanggal", value: (row) => row.bill_date, type: "date", width: 14 },
      { header: "Jatuh Tempo", value: (row) => row.due_date, type: "date", width: 14 },
      { header: "Proyek", value: (row) => row.projects, width: 24 },
      { header: "Subtotal", value: (row) => row.subtotal, type: "rupiah" },
      { header: "PPN", value: (row) => row.ppn_amount, type: "rupiah" },
      { header: "Total", value: (row) => row.total, type: "rupiah" },
      { header: "Dibayar", value: (row) => row.paid, type: "rupiah" },
      { header: "Sisa", value: (row) => row.balance, type: "rupiah" },
      { header: "Kelompok Jatuh Tempo", value: (row) => (row.due_group ? DUE_GROUP_LABELS[row.due_group] : null) },
      { header: "Status", value: (row) => BILL_STATUS_LABELS[row.status] },
    ],
    load: (raw) => queryBills(parseBillListParams(raw), { page: null }),
  }),
  "payable-aging": defineExport<PayableAging>({
    roles: PAYABLE_VIEW_ROLES,
    fileBase: "umur-utang",
    sheetName: "Umur Utang",
    columns: [
      { header: "Supplier", value: (row) => row.supplier_name, width: 30 },
      { header: "Belum Jatuh Tempo", value: (row) => row.current_amount, type: "rupiah" },
      { header: "1–30 Hari", value: (row) => row.d1_30, type: "rupiah" },
      { header: "31–60 Hari", value: (row) => row.d31_60, type: "rupiah" },
      { header: "61–90 Hari", value: (row) => row.d61_90, type: "rupiah" },
      { header: "> 90 Hari", value: (row) => row.d90_plus, type: "rupiah" },
      { header: "Total", value: (row) => row.total_balance, type: "rupiah" },
    ],
    load: () => queryPayableAging(),
  }),
  expenses: defineExport<ExpenseRow>({
    roles: PAYABLE_VIEW_ROLES,
    fileBase: "pengeluaran",
    sheetName: "Pengeluaran",
    columns: [
      { header: "Tanggal", value: (row) => row.expense_date, type: "date", width: 14 },
      { header: "Proyek", value: (row) => row.project_code ?? "Kantor/Umum", width: 20 },
      { header: "Kategori", value: (row) => row.category_name, width: 24 },
      { header: "Keterangan", value: (row) => row.description, width: 32 },
      { header: "Penerima", value: (row) => row.payee, width: 20 },
      { header: "Metode", value: (row) => METHOD_LABELS[row.method] },
      { header: "Jumlah", value: (row) => row.amount, type: "rupiah" },
      { header: "Tanpa Nota", value: (row) => (row.no_receipt ? `Ya — ${row.no_receipt_note ?? ""}` : null), width: 24 },
      { header: "Status", value: (row) => (row.status === "cancelled" ? "Batal" : "Aktif") },
    ],
    load: (raw) => queryExpenses(parseExpenseListParams(raw), { page: null }),
  }),
  kasbon: defineExport<KasbonRow>({
    roles: KASBON_VIEW_ROLES,
    fileBase: "kasbon",
    sheetName: "Kasbon",
    columns: [
      { header: "NIK Karyawan", value: (row) => row.employee_no },
      { header: "Nama", value: (row) => row.full_name, width: 26 },
      { header: "Tanggal", value: (row) => row.kasbon_date, type: "date", width: 14 },
      { header: "Jumlah", value: (row) => row.amount, type: "rupiah" },
      { header: "Cicilan/Periode", value: (row) => row.installment_amount, type: "rupiah" },
      { header: "Sudah Dipotong", value: (row) => row.deducted, type: "rupiah" },
      { header: "Saldo", value: (row) => row.balance, type: "rupiah" },
      { header: "Keterangan", value: (row) => row.description, width: 28 },
      { header: "Status", value: (row) => (row.status === "cancelled" ? "Batal" : "Aktif") },
    ],
    load: (raw) => queryKasbons(parseKasbonListParams(raw), { page: null }),
  }),
};

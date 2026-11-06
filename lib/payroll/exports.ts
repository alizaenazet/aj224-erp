import "server-only";

import { defineExport } from "@/lib/export/define";
import { PAYROLL_VIEW_ROLES, type PayslipRow, type RecapRow } from "@/lib/payroll/labels";
import { periodRecap, periodSlips } from "@/lib/payroll/queries";

const periodOf = (raw: Record<string, string | string[] | undefined>) => (typeof raw.period === "string" ? raw.period : "");

/** Payroll exports: slips, transfer list (PAY-06) and recap per project (PAY-09). */
export const PAYROLL_EXPORTS = {
  payslips: defineExport<PayslipRow>({
    roles: PAYROLL_VIEW_ROLES,
    fileBase: "slip-gaji",
    sheetName: "Slip Gaji",
    columns: [
      { header: "NIK Karyawan", value: (row) => row.employee_no },
      { header: "Nama", value: (row) => row.full_name, width: 26 },
      { header: "Proyek", value: (row) => row.projects, width: 22 },
      { header: "Hadir", value: (row) => row.present_days, type: "number" },
      { header: "Alpa", value: (row) => row.absent_days, type: "number" },
      { header: "Lembur (jam)", value: (row) => row.overtime_hours, type: "number" },
      { header: "Upah/Gaji", value: (row) => row.wage_amount + row.base_amount, type: "rupiah" },
      { header: "Potongan Alpa", value: (row) => row.absence_deduction, type: "rupiah" },
      { header: "Uang Makan", value: (row) => row.meal_amount, type: "rupiah" },
      { header: "Tunj. Lapangan", value: (row) => row.field_amount, type: "rupiah" },
      { header: "Lembur", value: (row) => row.overtime_amount, type: "rupiah" },
      { header: "Insentif", value: (row) => row.incentive_amount, type: "rupiah" },
      { header: "Koreksi", value: (row) => row.correction_amount, type: "rupiah" },
      { header: "Bruto", value: (row) => row.gross, type: "rupiah" },
      { header: "BPJS", value: (row) => row.bpjs_deduction, type: "rupiah" },
      { header: "PPh 21", value: (row) => row.pph21_deduction, type: "rupiah" },
      { header: "Potongan Lain", value: (row) => row.other_deduction, type: "rupiah" },
      { header: "Kasbon", value: (row) => row.kasbon_deduction, type: "rupiah" },
      { header: "Gaji Bersih", value: (row) => row.net, type: "rupiah" },
    ],
    load: async (raw) => {
      const rows = await periodSlips(periodOf(raw));
      return { rows, count: rows.length };
    },
  }),
  "payroll-transfer": defineExport<PayslipRow>({
    roles: ["finance", "director"],
    fileBase: "daftar-transfer-gaji",
    sheetName: "Transfer",
    columns: [
      { header: "Nama", value: (row) => row.full_name, width: 26 },
      { header: "Bank", value: (row) => row.bank_name, width: 14 },
      { header: "No. Rekening", value: (row) => row.bank_account_number, width: 20 },
      { header: "Atas Nama", value: (row) => row.bank_account_holder, width: 24 },
      { header: "Jumlah", value: (row) => row.net, type: "rupiah" },
    ],
    load: async (raw) => {
      const rows = (await periodSlips(periodOf(raw))).filter((row) => row.net > 0);
      return { rows, count: rows.length };
    },
  }),
  "payroll-recap": defineExport<RecapRow>({
    roles: PAYROLL_VIEW_ROLES,
    fileBase: "rekap-payroll",
    sheetName: "Rekap",
    columns: [
      { header: "Proyek", value: (row) => row.project_code, width: 22 },
      { header: "Karyawan", value: (row) => row.employees, type: "number" },
      { header: "Hari Hadir", value: (row) => row.days, type: "number" },
      { header: "Biaya Gaji Dialokasikan", value: (row) => row.allocated, type: "rupiah" },
    ],
    load: async (raw) => {
      const rows = await periodRecap(periodOf(raw));
      return { rows, count: rows.length };
    },
  }),
};

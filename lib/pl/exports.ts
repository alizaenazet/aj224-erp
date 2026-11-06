import "server-only";

import { defineExport } from "@/lib/export/define";
import { HEALTH_LABELS, PL_VIEW_ROLES, type FinancialRow, type MonthlyRow } from "@/lib/pl/labels";
import { monthlySummary, parsePlParams, queryFinancials } from "@/lib/pl/queries";
import { PROJECT_STATUS_LABELS } from "@/lib/projects/labels";

/** P/L exports (FIN-12, FIN-14). */
export const PL_EXPORTS = {
  "project-pl": defineExport<FinancialRow>({
    roles: PL_VIEW_ROLES,
    fileBase: "laporan-laba-rugi-proyek",
    sheetName: "L-R Proyek",
    columns: [
      { header: "Proyek", value: (row) => row.code, width: 20 },
      { header: "Nama", value: (row) => row.name, width: 30 },
      { header: "Status", value: (row) => PROJECT_STATUS_LABELS[row.status as keyof typeof PROJECT_STATUS_LABELS] },
      { header: "Nilai Kontrak", value: (row) => row.contract_value, type: "rupiah" },
      { header: "Progres (%)", value: (row) => row.progress, type: "number" },
      { header: "Rencana (%)", value: (row) => row.planned_progress, type: "number" },
      { header: "Pekerjaan Terselesaikan", value: (row) => row.work_done, type: "rupiah" },
      { header: "Pendapatan Diakui", value: (row) => row.revenue, type: "rupiah" },
      { header: "Belum Ditagih", value: (row) => row.unbilled, type: "rupiah" },
      { header: "Biaya Realisasi", value: (row) => row.cost, type: "rupiah" },
      { header: "Laba Kotor", value: (row) => row.gross_profit, type: "rupiah" },
      { header: "Margin (%)", value: (row) => row.margin, type: "number" },
      { header: "Total RAB", value: (row) => row.total_budget, type: "rupiah" },
      { header: "Laba Rencana", value: (row) => row.planned_profit, type: "rupiah" },
      { header: "Estimasi Biaya Akhir", value: (row) => row.final_cost, type: "rupiah" },
      { header: "Proyeksi Laba Akhir", value: (row) => row.projected_profit, type: "rupiah" },
      { header: "Kas Masuk", value: (row) => row.cash_in, type: "rupiah" },
      { header: "Dibayar ke Supplier", value: (row) => row.supplier_paid, type: "rupiah" },
      { header: "Upah Dibayar", value: (row) => row.payroll_paid, type: "rupiah" },
      { header: "Pengeluaran Dibayar", value: (row) => row.expenses_paid, type: "rupiah" },
      { header: "Kas Keluar", value: (row) => row.cash_out, type: "rupiah" },
      { header: "Posisi Kas Proyek", value: (row) => row.cash_position, type: "rupiah" },
      { header: "Indeks Biaya", value: (row) => row.cost_index, type: "number" },
      { header: "Deviasi Jadwal", value: (row) => row.schedule_deviation, type: "number" },
      { header: "Kesehatan", value: (row) => HEALTH_LABELS[row.health] },
    ],
    load: (raw) => queryFinancials(parsePlParams(raw)),
  }),
  "monthly-summary": defineExport<MonthlyRow>({
    roles: PL_VIEW_ROLES,
    fileBase: "ringkasan-bulanan",
    sheetName: "Ringkasan Bulanan",
    columns: [
      { header: "Bulan", value: (row) => row.month, type: "date", width: 14 },
      { header: "Pendapatan", value: (row) => row.revenue, type: "rupiah" },
      { header: "Biaya Proyek", value: (row) => row.project_cost, type: "rupiah" },
      { header: "Overhead", value: (row) => row.overhead, type: "rupiah" },
      { header: "Laba Sederhana", value: (row) => row.profit, type: "rupiah" },
      { header: "Kas Masuk", value: (row) => row.cash_in, type: "rupiah" },
      { header: "Kas Keluar", value: (row) => row.cash_out, type: "rupiah" },
    ],
    load: async (raw) => {
      const rows = await monthlySummary(parsePlParams(raw).year);
      return { rows, count: rows.length };
    },
  }),
};

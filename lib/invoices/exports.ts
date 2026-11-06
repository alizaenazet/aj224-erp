import "server-only";

import { defineExport } from "@/lib/export/define";
import { INVOICE_KIND_LABELS, INVOICE_STATUS_LABELS, INVOICE_VIEW_ROLES, type AgingRow, type InvoiceRow } from "@/lib/invoices/labels";
import { parseInvoiceListParams, queryAging, queryInvoices } from "@/lib/invoices/queries";
import { isUuid } from "@/lib/list/params";

/** Receivable exports (UMM-04, FIN-04, FIN-05). */
export const INVOICE_EXPORTS = {
  invoices: defineExport<InvoiceRow>({
    roles: INVOICE_VIEW_ROLES,
    fileBase: "invoice-piutang",
    sheetName: "Invoice",
    columns: [
      { header: "Nomor", value: (row) => row.number ?? "Draft", width: 22 },
      { header: "Jenis", value: (row) => INVOICE_KIND_LABELS[row.kind] },
      { header: "Proyek", value: (row) => row.project_code, width: 20 },
      { header: "Klien", value: (row) => row.client_name, width: 28 },
      { header: "Uraian", value: (row) => row.description, width: 30 },
      { header: "Tanggal", value: (row) => row.invoice_date, type: "date", width: 14 },
      { header: "Jatuh Tempo", value: (row) => row.due_date, type: "date", width: 14 },
      { header: "DPP", value: (row) => row.dpp, type: "rupiah" },
      { header: "PPN", value: (row) => row.ppn_amount, type: "rupiah" },
      { header: "Total", value: (row) => row.total, type: "rupiah" },
      { header: "Diterima", value: (row) => row.received, type: "rupiah" },
      { header: "PPh Dipotong", value: (row) => row.pph, type: "rupiah" },
      { header: "Sisa", value: (row) => row.balance, type: "rupiah" },
      { header: "Hari Terlambat", value: (row) => row.days_overdue, type: "number" },
      { header: "Status", value: (row) => INVOICE_STATUS_LABELS[row.status] },
    ],
    load: (raw) => queryInvoices(parseInvoiceListParams(raw), { page: null }),
  }),

  "receivable-aging": defineExport<AgingRow>({
    roles: INVOICE_VIEW_ROLES,
    fileBase: "umur-piutang",
    sheetName: "Umur Piutang",
    columns: [
      { header: "Klien", value: (row) => row.client_name, width: 30 },
      { header: "Proyek", value: (row) => row.project_code, width: 20 },
      { header: "Belum Jatuh Tempo", value: (row) => row.current_amount, type: "rupiah" },
      { header: "1–30 Hari", value: (row) => row.d1_30, type: "rupiah" },
      { header: "31–60 Hari", value: (row) => row.d31_60, type: "rupiah" },
      { header: "61–90 Hari", value: (row) => row.d61_90, type: "rupiah" },
      { header: "> 90 Hari", value: (row) => row.d90_plus, type: "rupiah" },
      { header: "Total", value: (row) => row.total_balance, type: "rupiah" },
    ],
    load: (raw) =>
      queryAging({
        project: typeof raw.project === "string" && isUuid(raw.project) ? raw.project : null,
        client: typeof raw.client === "string" && isUuid(raw.client) ? raw.client : null,
      }),
  }),
};

import "server-only";

import { defineExport } from "@/lib/export/define";
import {
  MATERIAL_OFFICE_VIEW_ROLES,
  MATERIAL_OWNERSHIP_LABELS,
  TXN_KIND_LABELS,
  TXN_SOURCE_LABELS,
  type MaterialRow,
  type ReconciliationRow,
  type TxnRow,
} from "@/lib/materials/labels";
import {
  parseMaterialListParams,
  parseReconciliationParams,
  parseTxnListParams,
  queryMaterials,
  queryReconciliation,
  queryTransactions,
} from "@/lib/materials/queries";

/** Material exports (UMM-04, MAT-06). */
export const MATERIAL_EXPORTS = {
  materials: defineExport<MaterialRow>({
    roles: MATERIAL_OFFICE_VIEW_ROLES,
    fileBase: "material",
    sheetName: "Material",
    columns: [
      { header: "Kode", value: (row) => row.code, width: 14 },
      { header: "Nama", value: (row) => row.name, width: 30 },
      { header: "Kategori", value: (row) => row.category_name, width: 18 },
      { header: "Satuan", value: (row) => row.unit_code },
      { header: "Kepemilikan", value: (row) => MATERIAL_OWNERSHIP_LABELS[row.ownership], width: 16 },
      { header: "Di Lokasi Terpilih", value: (row) => row.at_location ?? null, type: "number" },
      { header: "Stok", value: (row) => row.on_hand, type: "number" },
      { header: "Dalam Perjalanan", value: (row) => row.in_transit, type: "number" },
      { header: "Stok Minimum", value: (row) => row.min_stock, type: "number" },
      { header: "Lokasi di Bawah Minimum", value: (row) => row.low_locations, type: "number" },
      { header: "Status", value: (row) => (row.is_active ? "Aktif" : "Nonaktif") },
    ],
    load: (raw) => queryMaterials(parseMaterialListParams(raw), { page: null }),
  }),

  "material-transactions": defineExport<TxnRow>({
    roles: MATERIAL_OFFICE_VIEW_ROLES,
    fileBase: "transaksi-material",
    sheetName: "Transaksi Material",
    columns: [
      { header: "Tanggal", value: (row) => row.txn_date, type: "date", width: 14 },
      { header: "Jenis", value: (row) => TXN_KIND_LABELS[row.kind], width: 16 },
      { header: "Lokasi", value: (row) => row.location_name, width: 28 },
      { header: "Sumber", value: (row) => (row.source ? TXN_SOURCE_LABELS[row.source] : null) },
      { header: "Supplier", value: (row) => row.supplier_name, width: 22 },
      { header: "No. Dokumen", value: (row) => row.doc_no, width: 18 },
      { header: "Seksi", value: (row) => row.section_code },
      { header: "Material", value: (row) => row.summary, width: 40 },
      { header: "Keterangan", value: (row) => row.notes, width: 28 },
      { header: "Status", value: (row) => (row.status === "cancelled" ? "Batal" : "Aktif") },
      { header: "Alasan Batal", value: (row) => row.cancel_reason, width: 24 },
    ],
    load: (raw) => queryTransactions(parseTxnListParams(raw), { page: null }),
  }),

  "material-reconciliation": defineExport<ReconciliationRow>({
    roles: MATERIAL_OFFICE_VIEW_ROLES,
    fileBase: "rekonsiliasi-material-titipan",
    sheetName: "Rekonsiliasi",
    columns: [
      { header: "Proyek", value: (row) => row.project_code, width: 22 },
      { header: "Nama Proyek", value: (row) => row.project_name, width: 30 },
      { header: "Kode Material", value: (row) => row.material_code, width: 14 },
      { header: "Material", value: (row) => row.material_name, width: 30 },
      { header: "Satuan", value: (row) => row.unit_code },
      { header: "Diterima dari Klien", value: (row) => row.received, type: "number" },
      { header: "Transfer Masuk", value: (row) => row.transferred_in, type: "number" },
      { header: "Transfer Keluar", value: (row) => row.transferred_out, type: "number" },
      { header: "Terpakai", value: (row) => row.used, type: "number" },
      { header: "Dikembalikan", value: (row) => row.returned, type: "number" },
      { header: "Susut", value: (row) => row.shrinkage, type: "number" },
      { header: "Sisa", value: (row) => row.on_hand, type: "number" },
    ],
    load: (raw) => queryReconciliation(parseReconciliationParams(raw)),
  }),
};

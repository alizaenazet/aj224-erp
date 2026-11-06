import "server-only";

import { defineExport } from "@/lib/export/define";
import {
  CLASSIFICATION_LABELS,
  INCIDENT_STATUS_LABELS,
  K3_OFFICE_VIEW_ROLES,
  ROOT_CAUSE_LABELS,
  type IncidentRow,
  type K3StatsRow,
} from "@/lib/k3/labels";
import { k3Stats, parseIncidentListParams, queryIncidents } from "@/lib/k3/queries";

function period(raw: Record<string, string | string[] | undefined>) {
  const year = new Date().getFullYear();
  const from = typeof raw.from === "string" ? raw.from : `${year}-01-01`;
  const to = typeof raw.to === "string" ? raw.to : `${year}-12-31`;
  return { from, to };
}

/** K3 exports (UMM-04, K3-05). */
export const K3_EXPORTS = {
  incidents: defineExport<IncidentRow>({
    roles: K3_OFFICE_VIEW_ROLES,
    fileBase: "insiden-k3",
    sheetName: "Insiden K3",
    columns: [
      { header: "Nomor", value: (row) => row.number, width: 20 },
      { header: "Tanggal", value: (row) => row.occurred_on, type: "date", width: 14 },
      { header: "Proyek", value: (row) => row.project_code, width: 22 },
      { header: "Seksi", value: (row) => row.section_code },
      { header: "Lokasi/Tower", value: (row) => row.location_note, width: 14 },
      { header: "Klasifikasi", value: (row) => CLASSIFICATION_LABELS[row.classification], width: 22 },
      { header: "Kronologi", value: (row) => row.chronology, width: 50 },
      { header: "Status", value: (row) => INCIDENT_STATUS_LABELS[row.status] },
      { header: "Akar Masalah", value: (row) => (row.root_cause ? ROOT_CAUSE_LABELS[row.root_cause] : null) },
      { header: "Hari Kerja Hilang", value: (row) => row.lost_days, type: "number" },
      { header: "Tindakan Terbuka", value: (row) => row.open_actions, type: "number" },
      { header: "Tindakan Terlambat", value: (row) => row.overdue_actions, type: "number" },
      { header: "Alasan Batal", value: (row) => row.cancel_reason, width: 24 },
    ],
    load: (raw) => queryIncidents(parseIncidentListParams(raw), { page: null }),
  }),

  "k3-summary": defineExport<K3StatsRow>({
    roles: K3_OFFICE_VIEW_ROLES,
    fileBase: "ringkasan-k3",
    sheetName: "Ringkasan K3",
    columns: [
      { header: "Proyek", value: (row) => row.project_code ?? "Perusahaan", width: 22 },
      { header: "Near Miss", value: (row) => row.near_miss, type: "number" },
      { header: "P3K", value: (row) => row.first_aid, type: "number" },
      { header: "Medis", value: (row) => row.medical, type: "number" },
      { header: "LTI", value: (row) => row.lti, type: "number" },
      { header: "Fatal", value: (row) => row.fatal, type: "number" },
      { header: "Properti", value: (row) => row.property, type: "number" },
      { header: "Total", value: (row) => row.total, type: "number" },
      { header: "Tindakan Terbuka", value: (row) => row.open_actions, type: "number" },
      { header: "Tindakan Terlambat", value: (row) => row.overdue_actions, type: "number" },
      { header: "Jam Kerja", value: (row) => row.work_hours, type: "number" },
      { header: "LTIFR", value: (row) => row.ltifr, type: "number" },
      { header: "Hari Tanpa LTI", value: (row) => row.lti_free_days, type: "number" },
    ],
    load: async (raw) => {
      const { from, to } = period(raw);
      const rows = await k3Stats(from, to);
      return { rows, count: rows.length };
    },
  }),
};

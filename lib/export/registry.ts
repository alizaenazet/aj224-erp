import "server-only";

import { auditActionLabel, auditTableLabel, describeChanges, type AuditEntry } from "@/lib/audit/labels";
import { parseAuditListParams, queryAuditLog } from "@/lib/audit/queries";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import {
  EMPLOYEE_VIEW_ROLES,
  EMPLOYMENT_STATUS_LABELS,
  WORK_TYPE_LABELS,
  type EmployeeRow,
} from "@/lib/employees/labels";
import { parseEmployeeListParams, queryEmployees } from "@/lib/employees/queries";
import type { ExportColumn } from "@/lib/export/xlsx";
import {
  ACTIVITY_KIND_LABELS,
  CLIENT_KIND_LABELS,
  MARKETING_VIEW_ROLES,
  formatRate,
  type ActivityRow,
  type ClientRow,
} from "@/lib/clients/labels";
import {
  parseClientListParams,
  parseFollowUpParams,
  queryClients,
  queryFollowUps,
} from "@/lib/clients/queries";
import { TENDER_STATUS_LABELS, type TenderRow } from "@/lib/tenders/labels";
import { parseTenderListParams, queryTenders } from "@/lib/tenders/queries";
import type { RawSearchParams } from "@/lib/list/params";
import {
  CERTIFICATE_STATUS_LABELS,
  CERTIFICATE_VIEW_ROLES,
  describeDaysLeft,
  type CertificateRow,
} from "@/lib/certifications/labels";
import { parseCertificateListParams, queryCertificates } from "@/lib/certifications/queries";
import { MASTER_ENTITIES } from "@/lib/master-data/entities";
import {
  PARTICIPANT_RESULT_LABELS,
  TRAINING_KIND_LABELS,
  type TrainingNeedRow,
  type TrainingRow,
} from "@/lib/trainings/labels";
import {
  parseTrainingListParams,
  parseTrainingNeedParams,
  queryTrainingNeeds,
  queryTrainings,
} from "@/lib/trainings/queries";
import { parseMasterListParams, queryMaster } from "@/lib/master-data/queries";
import { parseNotificationListParams, queryNotifications, type NotificationItem } from "@/lib/notifications/queries";
import { USER_STATUS_LABELS, parseUserListParams, queryUsers, type UserRow } from "@/lib/users/queries";

const MAX_ROWS = 10000;

type ExportDefinition<T> = {
  roles: readonly AppRole[];
  fileBase: string;
  sheetName: string;
  columns: ExportColumn<T>[];
  /** Rows matching the list's URL params (same query as the page). */
  load: (params: RawSearchParams) => Promise<{ rows: T[]; count: number }>;
};

function defineExport<T>(definition: ExportDefinition<T>) {
  return definition as ExportDefinition<unknown>;
}

/** Export per list key, used by /api/export/[list] (UMM-04). */
export const EXPORTS: Record<string, ExportDefinition<unknown>> = {
  users: defineExport<UserRow>({
    roles: ["super_admin", "director"],
    fileBase: "pengguna",
    sheetName: "Pengguna",
    columns: [
      { header: "Nama", value: (row) => row.full_name, width: 28 },
      { header: "Email", value: (row) => row.email, width: 30 },
      { header: "Peran", value: (row) => ROLE_LABELS[row.role] },
      { header: "Karyawan", value: (row) => row.employee_name, width: 24 },
      { header: "Status", value: (row) => USER_STATUS_LABELS[row.status] ?? row.status, width: 20 },
      { header: "Login Terakhir", value: (row) => row.last_sign_in_at, type: "datetime", width: 18 },
    ],
    load: (raw) => queryUsers(parseUserListParams(raw), { page: null }),
  }),

  "audit-log": defineExport<AuditEntry>({
    roles: ["super_admin", "director"],
    fileBase: "log-audit",
    sheetName: "Log Audit",
    columns: [
      { header: "Waktu", value: (row) => row.created_at, type: "datetime", width: 18 },
      { header: "Pengguna", value: (row) => row.actor_name ?? "Sistem", width: 24 },
      { header: "Jenis data", value: (row) => auditTableLabel(row.table_name) },
      { header: "Tindakan", value: (row) => auditActionLabel(row.action) },
      {
        header: "Perubahan",
        value: (row) =>
          row.action === "insert"
            ? "Data dibuat"
            : describeChanges(row).map((c) => `${c.label}: ${c.from} → ${c.to}`).join("; "),
        width: 50,
      },
      { header: "Alasan", value: (row) => row.reason, width: 30 },
    ],
    load: (raw) => queryAuditLog(parseAuditListParams(raw), { page: null }),
  }),

  notifications: defineExport<NotificationItem>({
    roles: APP_ROLES,
    fileBase: "notifikasi",
    sheetName: "Notifikasi",
    columns: [
      { header: "Waktu", value: (row) => row.created_at, type: "datetime", width: 18 },
      { header: "Judul", value: (row) => row.title, width: 36 },
      { header: "Isi", value: (row) => row.body, width: 50 },
      { header: "Status", value: (row) => (row.read_at ? "Dibaca" : "Belum dibaca") },
    ],
    load: (raw) => queryNotifications(parseNotificationListParams(raw), { page: null }),
  }),

  employees: defineExport<EmployeeRow>({
    roles: EMPLOYEE_VIEW_ROLES,
    fileBase: "karyawan",
    sheetName: "Karyawan",
    columns: [
      { header: "NIK Karyawan", value: (row) => row.employee_no, width: 14 },
      { header: "Nama", value: (row) => row.full_name, width: 28 },
      { header: "NIK KTP", value: (row) => row.nik_ktp, width: 20 },
      { header: "Jabatan", value: (row) => row.position?.name, width: 20 },
      { header: "Tipe", value: (row) => WORK_TYPE_LABELS[row.work_type] },
      { header: "Status Kerja", value: (row) => EMPLOYMENT_STATUS_LABELS[row.employment_status], width: 16 },
      { header: "No. HP", value: (row) => row.phone, width: 18 },
      { header: "Tanggal Masuk", value: (row) => row.join_date, type: "date", width: 14 },
      { header: "Tanggal Keluar", value: (row) => row.exit_date, type: "date", width: 14 },
      { header: "Status", value: (row) => (row.is_active ? "Aktif" : "Nonaktif") },
    ],
    load: (raw) => queryEmployees(parseEmployeeListParams(raw), { page: null }),
  }),

  certificates: defineExport<CertificateRow>({
    roles: CERTIFICATE_VIEW_ROLES,
    fileBase: "sertifikat",
    sheetName: "Sertifikat",
    columns: [
      { header: "NIK Karyawan", value: (row) => row.employee_no, width: 14 },
      { header: "Nama", value: (row) => row.employee_name, width: 28 },
      { header: "Jenis Sertifikat", value: (row) => row.certificate_type_name, width: 22 },
      { header: "Nomor", value: (row) => row.certificate_no, width: 22 },
      { header: "Penerbit", value: (row) => row.issuer, width: 26 },
      { header: "Tanggal Terbit", value: (row) => row.issued_date, type: "date", width: 14 },
      { header: "Tanggal Kedaluwarsa", value: (row) => row.expiry_date, type: "date", width: 18 },
      { header: "Status", value: (row) => CERTIFICATE_STATUS_LABELS[row.status], width: 20 },
      { header: "Sisa Hari", value: (row) => describeDaysLeft(row.days_left), width: 16 },
    ],
    load: (raw) => queryCertificates(parseCertificateListParams(raw), { page: null }),
  }),

  trainings: defineExport<TrainingRow>({
    roles: CERTIFICATE_VIEW_ROLES,
    fileBase: "pelatihan",
    sheetName: "Pelatihan",
    columns: [
      { header: "Nama Pelatihan", value: (row) => row.name, width: 36 },
      { header: "Jenis", value: (row) => TRAINING_KIND_LABELS[row.kind] },
      { header: "Penyelenggara", value: (row) => row.organizer, width: 28 },
      { header: "Tanggal Mulai", value: (row) => row.start_date, type: "date", width: 14 },
      { header: "Tanggal Selesai", value: (row) => row.end_date, type: "date", width: 14 },
      { header: "Lokasi", value: (row) => row.location, width: 20 },
      { header: "Sertifikat", value: (row) => row.certificate_type?.name, width: 20 },
      { header: "Peserta", value: (row) => row.participants.length, type: "number" },
      {
        header: PARTICIPANT_RESULT_LABELS.passed,
        value: (row) => row.participants.filter((participant) => participant.result === "passed").length,
        type: "number",
      },
    ],
    load: (raw) => queryTrainings(parseTrainingListParams(raw), { page: null }),
  }),

  "training-needs": defineExport<TrainingNeedRow>({
    roles: CERTIFICATE_VIEW_ROLES,
    fileBase: "kebutuhan-pelatihan",
    sheetName: "Kebutuhan Pelatihan",
    columns: [
      { header: "Jenis Sertifikat", value: (row) => row.certificate_type_name, width: 22 },
      { header: "NIK Karyawan", value: (row) => row.employee_no, width: 14 },
      { header: "Nama", value: (row) => row.employee_name, width: 28 },
      { header: "Jabatan", value: (row) => row.position_name, width: 20 },
      { header: "Status", value: (row) => CERTIFICATE_STATUS_LABELS[row.status], width: 20 },
      { header: "Tanggal Kedaluwarsa", value: (row) => row.expiry_date, type: "date", width: 18 },
    ],
    load: (raw) => queryTrainingNeeds(parseTrainingNeedParams(raw)),
  }),

  clients: defineExport<ClientRow>({
    roles: MARKETING_VIEW_ROLES,
    fileBase: "klien",
    sheetName: "Klien",
    columns: [
      { header: "Nama Perusahaan", value: (row) => row.name, width: 36 },
      { header: "Jenis", value: (row) => CLIENT_KIND_LABELS[row.kind], width: 16 },
      { header: "NPWP", value: (row) => row.npwp, width: 22 },
      { header: "Termin (hari)", value: (row) => row.payment_term_days, type: "number" },
      { header: "Jumlah Tender", value: (row) => row.stats.tender_count, type: "number" },
      { header: "Win Rate", value: (row) => formatRate(row.stats.win_rate_count) },
      { header: "Status", value: (row) => (row.is_active ? "Aktif" : "Nonaktif") },
    ],
    load: (raw) => queryClients(parseClientListParams(raw), { page: null }),
  }),

  "follow-ups": defineExport<ActivityRow>({
    roles: MARKETING_VIEW_ROLES,
    fileBase: "tindak-lanjut",
    sheetName: "Tindak Lanjut",
    columns: [
      { header: "Tanggal Tindak Lanjut", value: (row) => row.follow_up_date, type: "date", width: 18 },
      { header: "Klien", value: (row) => row.client_name, width: 32 },
      { header: "Tender", value: (row) => row.tender_name, width: 32 },
      { header: "Aktivitas", value: (row) => ACTIVITY_KIND_LABELS[row.kind] },
      { header: "Catatan", value: (row) => row.notes, width: 50 },
      { header: "Dicatat oleh", value: (row) => row.owner_name, width: 22 },
      { header: "Status", value: (row) => (row.follow_up_done_at ? "Selesai" : "Belum selesai") },
    ],
    load: (raw) => queryFollowUps(parseFollowUpParams(raw), { page: null }),
  }),

  tenders: defineExport<TenderRow>({
    roles: MARKETING_VIEW_ROLES,
    fileBase: "tender",
    sheetName: "Tender",
    columns: [
      { header: "Nama Paket", value: (row) => row.name, width: 40 },
      { header: "Klien", value: (row) => row.client?.name, width: 32 },
      { header: "Tegangan (kV)", value: (row) => row.voltage_kv, type: "number" },
      { header: "Batas Penawaran", value: (row) => row.bid_deadline, type: "date", width: 16 },
      { header: "Nilai Penawaran", value: (row) => row.bid_value, type: "rupiah", width: 20 },
      { header: "Estimasi Biaya", value: (row) => row.estimated_cost, type: "rupiah", width: 20 },
      { header: "Margin Rencana (%)", value: (row) => row.planned_margin, type: "number" },
      { header: "Peluang (%)", value: (row) => row.win_probability, type: "number" },
      { header: "Nilai Tertimbang", value: (row) => row.weighted_value, type: "rupiah", width: 20 },
      { header: "Status", value: (row) => TENDER_STATUS_LABELS[row.status], width: 20 },
      { header: "PIC", value: (row) => row.pic_name, width: 22 },
      { header: "Win Rate Klien", value: (row) => formatRate(row.client_stats?.win_rate_count) },
    ],
    load: (raw) => queryTenders(parseTenderListParams(raw), { page: null }),
  }),

  // One export per master-data list: its list columns plus Status.
  ...Object.fromEntries(
    Object.values(MASTER_ENTITIES).map((entity) => [
      `master-${entity.key}`,
      defineExport<Record<string, unknown>>({
        roles: entity.viewRoles,
        fileBase: entity.exportFileBase,
        sheetName: entity.title,
        columns: [
          ...entity.fields
            .filter((field) => field.list)
            .map((field) => ({
              header: field.label,
              value: (row: Record<string, unknown>) =>
                field.format ? field.format(row[field.name], row) : (row[field.name] as string),
              width: 24,
            })),
          {
            header: "Status",
            value: (row: Record<string, unknown>) => (row.is_active ? "Aktif" : "Nonaktif"),
          },
        ],
        load: (raw) => queryMaster(entity, parseMasterListParams(entity, raw), { page: null }),
      }),
    ]),
  ),
};

export { MAX_ROWS };

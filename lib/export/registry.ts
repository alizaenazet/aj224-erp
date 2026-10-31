import "server-only";

import { auditActionLabel, auditTableLabel, describeChanges, type AuditEntry } from "@/lib/audit/labels";
import { parseAuditListParams, queryAuditLog } from "@/lib/audit/queries";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import {
  EMPLOYEE_VIEW_ROLES,
  EMPLOYMENT_STATUS_LABELS,
  VERIFICATION_LABELS,
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
import { PROJECT_STATUS_LABELS, PROJECT_VIEW_ROLES, type ProjectRow } from "@/lib/projects/labels";
import { getProject, parseProjectListParams, queryProjects } from "@/lib/projects/queries";
import { PROGRESS_VIEW_ROLES } from "@/lib/progress/labels";
import {
  ASSIGNMENT_STATE_LABELS,
  ASSIGNMENT_VIEW_ROLES,
  CERT_STATE_LABELS,
  type AssignmentRow,
} from "@/lib/assignments/labels";
import { parseAssignmentListParams, queryAssignments } from "@/lib/assignments/queries";
import { ATTENDANCE_OFFICE_VIEW_ROLES, type RecapRow } from "@/lib/attendance/labels";
import { parseRecapParams, queryRecap } from "@/lib/attendance/queries";
import {
  REPORT_OFFICE_VIEW_ROLES,
  REPORT_STATUS_LABELS,
  describeWeather,
  type ReportRow,
} from "@/lib/daily-reports/labels";
import { parseReportListParams, queryReports } from "@/lib/daily-reports/queries";
import {
  EQUIPMENT_OFFICE_VIEW_ROLES,
  EQUIPMENT_VIEW_ROLES,
  NOTE_STATUS_LABELS,
  OWNERSHIP_LABELS,
  TRACKING_LABELS,
  type NoteRow,
  type ToolRow,
} from "@/lib/equipment/labels";
import { parseNoteListParams, parseToolListParams, queryNotes, queryTools } from "@/lib/equipment/queries";
import { progressCells, projectProgress, projectSections, projectStages } from "@/lib/progress/queries";
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
  /**
   * Rows matching the list's URL params (same query as the page). An export
   * whose columns depend on the data (e.g. a project's stages) returns them here.
   */
  load: (params: RawSearchParams) => Promise<{ rows: T[]; count: number; columns?: ExportColumn<T>[] }>;
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
      { header: "Verifikasi", value: (row) => VERIFICATION_LABELS[row.verification_status], width: 20 },
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

  projects: defineExport<ProjectRow>({
    roles: PROJECT_VIEW_ROLES,
    fileBase: "proyek",
    sheetName: "Proyek",
    columns: [
      { header: "Kode", value: (row) => row.code, width: 20 },
      { header: "Nama Proyek", value: (row) => row.name, width: 40 },
      { header: "Klien", value: (row) => row.client_name, width: 34 },
      { header: "Status", value: (row) => PROJECT_STATUS_LABELS[row.status] },
      { header: "Tanggal Mulai", value: (row) => row.start_date, type: "date", width: 14 },
      { header: "Target Selesai", value: (row) => row.finish_date, type: "date", width: 14 },
      // Null for roles without contract or progress access (RLS), so the cell stays empty.
      { header: "Progres (%)", value: (row) => (row.progress === null ? null : Math.round(Number(row.progress) * 10) / 10), type: "number" },
      { header: "Nilai Kontrak", value: (row) => row.contract_value, type: "rupiah", width: 20 },
    ],
    load: (raw) => queryProjects(parseProjectListParams(raw), { page: null }),
  }),

  assignments: defineExport<AssignmentRow>({
    roles: ASSIGNMENT_VIEW_ROLES,
    fileBase: "penugasan",
    sheetName: "Penugasan",
    columns: [
      { header: "NIK Karyawan", value: (row) => row.employee_no, width: 16 },
      { header: "Nama", value: (row) => row.employee_name, width: 26 },
      { header: "Proyek", value: (row) => row.project_code, width: 20 },
      { header: "Jabatan", value: (row) => row.position_name, width: 20 },
      { header: "Mulai", value: (row) => row.start_date, type: "date", width: 14 },
      { header: "Selesai", value: (row) => row.end_date, type: "date", width: 14 },
      { header: "Status", value: (row) => ASSIGNMENT_STATE_LABELS[row.state] },
      { header: "Sertifikat", value: (row) => (row.cert_state ? CERT_STATE_LABELS[row.cert_state] : "Tidak wajib"), width: 22 },
      { header: "Keterangan Sertifikat", value: (row) => row.cert_issues, width: 30 },
      { header: "Alasan Override", value: (row) => row.override_reason, width: 36 },
    ],
    load: (raw) => queryAssignments(parseAssignmentListParams(raw), { page: null }),
  }),

  // HCM-11 recap per employee and project for the chosen period.
  "attendance-recap": defineExport<RecapRow>({
    roles: ATTENDANCE_OFFICE_VIEW_ROLES,
    fileBase: "rekap-absensi",
    sheetName: "Rekap Absensi",
    columns: [
      { header: "NIK Karyawan", value: (row) => row.employee_no, width: 16 },
      { header: "Nama", value: (row) => row.employee_name, width: 26 },
      { header: "Proyek", value: (row) => row.project_code ?? "Kantor", width: 20 },
      { header: "Hadir", value: (row) => row.present, type: "number" },
      { header: "Izin", value: (row) => row.permit, type: "number" },
      { header: "Sakit", value: (row) => row.sick, type: "number" },
      { header: "Cuti", value: (row) => row.leave, type: "number" },
      { header: "Alpa", value: (row) => row.absent, type: "number" },
      { header: "Libur", value: (row) => row.off, type: "number" },
      { header: "Jam Lembur", value: (row) => row.overtime_hours, type: "number" },
    ],
    load: (raw) => queryRecap(parseRecapParams(raw)),
  }),

  "daily-reports": defineExport<ReportRow>({
    roles: REPORT_OFFICE_VIEW_ROLES,
    fileBase: "laporan-harian",
    sheetName: "Laporan Harian",
    columns: [
      { header: "Tanggal", value: (row) => row.report_date, type: "date", width: 14 },
      { header: "Proyek", value: (row) => row.project_code, width: 20 },
      { header: "Status", value: (row) => REPORT_STATUS_LABELS[row.status], width: 16 },
      { header: "Kegiatan", value: (row) => (row.no_activity ? `Tidak ada: ${row.no_activity_reason ?? ""}` : "Ada"), width: 30 },
      { header: "Cuaca (pagi · siang · sore)", value: (row) => describeWeather(row), width: 30 },
      { header: "Jam Kerja", value: (row) => row.effective_hours, type: "number" },
      { header: "Tenaga Kerja", value: (row) => row.workforce, type: "number" },
      { header: "Aktivitas", value: (row) => row.activity_count, type: "number" },
      { header: "Kendala", value: (row) => row.obstacle_count, type: "number" },
      { header: "Foto", value: (row) => row.photo_count, type: "number" },
      { header: "Rencana Esok", value: (row) => row.plan_tomorrow, width: 36 },
    ],
    load: (raw) => queryReports(parseReportListParams(raw), { page: null }),
  }),

  tools: defineExport<ToolRow>({
    roles: EQUIPMENT_OFFICE_VIEW_ROLES,
    fileBase: "alat",
    sheetName: "Alat",
    columns: [
      { header: "Kode", value: (row) => row.code, width: 14 },
      { header: "Nama", value: (row) => row.name, width: 30 },
      { header: "Kategori", value: (row) => row.category_name, width: 16 },
      { header: "Pelacakan", value: (row) => TRACKING_LABELS[row.tracking] },
      { header: "No. Seri", value: (row) => row.serial_no, width: 16 },
      { header: "Kepemilikan", value: (row) => OWNERSHIP_LABELS[row.ownership] },
      { header: "Supplier", value: (row) => row.supplier_name, width: 22 },
      { header: "Baik", value: (row) => row.good, type: "number" },
      { header: "Rusak", value: (row) => row.damaged, type: "number" },
      { header: "Dalam Perbaikan", value: (row) => row.repair, type: "number" },
      { header: "Hilang", value: (row) => row.lost, type: "number" },
      { header: "Dalam Perjalanan", value: (row) => row.in_transit, type: "number" },
      { header: "Total", value: (row) => row.total, type: "number" },
    ],
    load: (raw) => queryTools(parseToolListParams(raw), { page: null }),
  }),

  "delivery-notes": defineExport<NoteRow>({
    roles: EQUIPMENT_VIEW_ROLES,
    fileBase: "surat-jalan",
    sheetName: "Surat Jalan",
    columns: [
      { header: "Nomor", value: (row) => row.number, width: 22 },
      { header: "Tanggal", value: (row) => row.note_date, type: "date", width: 14 },
      { header: "Asal", value: (row) => row.from_location, width: 28 },
      { header: "Tujuan", value: (row) => row.to_location, width: 28 },
      { header: "Kendaraan", value: (row) => row.vehicle, width: 16 },
      { header: "Sopir", value: (row) => row.driver, width: 16 },
      { header: "Status", value: (row) => NOTE_STATUS_LABELS[row.status] },
      { header: "Jumlah Baris", value: (row) => row.line_count, type: "number" },
      { header: "Alasan Batal", value: (row) => row.cancel_reason, width: 24 },
    ],
    load: (raw) => queryNotes(parseNoteListParams(raw), { page: null }),
  }),

  // PRJ-07 progress matrix of one project (?project=<id>); one column per stage.
  "project-progress": defineExport<Record<string, unknown>>({
    roles: PROGRESS_VIEW_ROLES,
    fileBase: "progres-proyek",
    sheetName: "Matriks Progres",
    columns: [],
    load: async (raw) => {
      const project = await getProject(typeof raw.project === "string" ? raw.project : "");
      if (!project) return { rows: [], count: 0 };
      const [stages, sections, summary] = await Promise.all([
        projectStages(project.id),
        projectSections(project.id),
        projectProgress(project.id),
      ]);
      const cells = await progressCells(sections.map((section) => section.id));
      const rows: Record<string, unknown>[] = sections.map((section) => ({
        code: section.code,
        towers: `${section.tower_from} – ${section.tower_to}`,
        kms: section.kms,
        ...Object.fromEntries(stages.map((stage) => [stage.id, cells[section.id]?.[stage.id] ?? 0])),
        progress: Math.round(section.progress * 100) / 100,
        planned: Math.round(section.planned_progress * 100) / 100,
      }));
      rows.push({
        code: `Total ${project.code}`,
        towers: null,
        kms: summary?.total_kms ?? 0,
        progress: summary ? Math.round(summary.progress * 100) / 100 : 0,
        planned: summary ? Math.round(summary.planned_progress * 100) / 100 : 0,
      });
      const columns: ExportColumn<Record<string, unknown>>[] = [
        { header: "Seksi", value: (row) => row.code as string, width: 22 },
        { header: "Tower", value: (row) => row.towers as string | null, width: 14 },
        { header: "kms", value: (row) => row.kms as number, type: "number" },
        ...stages.map((stage) => ({
          header: `${stage.name} (${stage.weight}) %`,
          value: (row: Record<string, unknown>) => row[stage.id] as number | undefined,
          type: "number" as const,
          width: 16,
        })),
        { header: "Progres Seksi (%)", value: (row) => row.progress as number, type: "number", width: 16 },
        { header: "Rencana (%)", value: (row) => row.planned as number, type: "number", width: 14 },
      ];
      return { rows, count: rows.length, columns };
    },
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

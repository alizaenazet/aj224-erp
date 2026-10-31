import { ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import {
  EMPLOYMENT_STATUS_LABELS,
  PAY_TYPE_LABELS,
  WORK_TYPE_LABELS,
  type EmploymentStatus,
  type PayType,
  type WorkType,
} from "@/lib/employees/labels";
import { CLIENT_KIND_LABELS, type ClientKind } from "@/lib/clients/labels";
import {
  REPORT_STATUS_LABELS,
  WEATHER_LABELS,
  type ReportStatus,
  type Weather,
} from "@/lib/daily-reports/labels";
import { formatDate, formatRupiah } from "@/lib/format";
import {
  PROJECT_STATUS_LABELS,
  TERM_CONDITION_LABELS,
  TERM_KIND_LABELS,
  TERM_STATUS_LABELS,
  type ProjectStatus,
  type TermCondition,
  type TermKind,
  type TermStatus,
} from "@/lib/projects/labels";
import {
  LOST_REASON_LABELS,
  TENDER_STATUS_LABELS,
  type LostReason,
  type TenderStatus,
} from "@/lib/tenders/labels";

// Indonesian labels for audit entries. Each module adds its tables and fields.

export const AUDIT_TABLE_LABELS: Record<string, string> = {
  profiles: "Pengguna",
  company_profile: "Profil Perusahaan",
  system_parameters: "Parameter Sistem",
  document_types: "Format Nomor Dokumen",
  employees: "Karyawan",
  employee_pay_settings: "Pengaturan Gaji",
  employee_certificates: "Sertifikat Karyawan",
  clients: "Klien",
  tenders: "Tender",
  projects: "Proyek",
  project_contracts: "Kontrak Proyek",
  project_addenda: "Addendum",
  project_terms: "Termin",
  project_budgets: "RAB Proyek",
  project_sections: "Seksi Tarik",
  project_stages: "Tahapan Proyek",
  assignments: "Penugasan",
  daily_reports: "Laporan Harian",
  tools: "Alat",
  delivery_notes: "Surat Jalan",
};

/** Audit tables whose entries only Direktur may read (PRD §6, SQL is_pay_table). */
export const PAY_AUDIT_TABLES = ["employee_pay_settings"];

/**
 * Fields that store an id; the server swaps the id for this column of the
 * referenced row before the entry is shown.
 */
export const AUDIT_REFS: Record<
  string,
  Record<
    string,
    {
      table:
        | "positions"
        | "employees"
        | "certificate_types"
        | "clients"
        | "cost_categories"
        | "projects"
        | "item_categories"
        | "suppliers"
        | "locations";
      column: string;
    }
  >
> = {
  employees: { position_id: { table: "positions", column: "name" } },
  profiles: { employee_id: { table: "employees", column: "full_name" } },
  employee_certificates: {
    employee_id: { table: "employees", column: "full_name" },
    certificate_type_id: { table: "certificate_types", column: "name" },
  },
  tenders: { client_id: { table: "clients", column: "name" } },
  projects: { client_id: { table: "clients", column: "name" } },
  project_budgets: { cost_category_id: { table: "cost_categories", column: "name" } },
  project_sections: { project_id: { table: "projects", column: "code" } },
  project_stages: { project_id: { table: "projects", column: "code" } },
  daily_reports: { project_id: { table: "projects", column: "code" } },
  tools: {
    category_id: { table: "item_categories", column: "name" },
    supplier_id: { table: "suppliers", column: "name" },
  },
  delivery_notes: {
    from_location_id: { table: "locations", column: "name" },
    to_location_id: { table: "locations", column: "name" },
  },
  assignments: {
    employee_id: { table: "employees", column: "full_name" },
    project_id: { table: "projects", column: "code" },
    position_id: { table: "positions", column: "name" },
  },
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  insert: "Dibuat",
  update: "Diubah",
  cancel: "Dibatalkan",
  override: "Override",
};

type FieldSpec = { label: string; format?: (value: unknown) => string };

const asDate = (value: unknown) => formatDate(String(value));
const asRupiah = (value: unknown) => formatRupiah(Number(value));
const asActive = (value: unknown) => (value ? "Aktif" : "Nonaktif");

const AUDIT_FIELDS: Record<string, Record<string, FieldSpec>> = {
  profiles: {
    full_name: { label: "Nama" },
    email: { label: "Email" },
    role: {
      label: "Peran",
      format: (value) => ROLE_LABELS[value as AppRole] ?? String(value),
    },
    is_active: { label: "Status", format: asActive },
    employee_id: { label: "Karyawan" },
  },
  company_profile: {
    name: { label: "Nama" },
    address: { label: "Alamat" },
    phone: { label: "Telepon" },
    email: { label: "Email" },
    npwp: { label: "NPWP" },
    is_pkp: { label: "Status PKP", format: (value) => (value ? "PKP" : "Non-PKP") },
    logo_path: { label: "Logo", format: () => "diperbarui" },
  },
  system_parameters: {
    backdate_days: { label: "Batas input mundur" },
    cert_expiry_warning_days: { label: "Batas segera kedaluwarsa" },
    health_warning_points: { label: "Ambang Waspada" },
    health_critical_points: { label: "Ambang Kritis" },
    ppn_rate: { label: "Tarif PPN" },
    standard_work_hours: { label: "Jam kerja standar" },
    monthly_salary_divisor: { label: "Pembagi gaji harian" },
  },
  document_types: {
    format: { label: "Format" },
    reset_period: {
      label: "Reset nomor",
      format: (value) =>
        ({ month: "Setiap bulan", year: "Setiap tahun", never: "Tidak pernah" })[String(value)] ??
        String(value),
    },
  },
  // position_id is resolved to the position name through AUDIT_REFS.
  employees: {
    employee_no: { label: "NIK karyawan" },
    full_name: { label: "Nama" },
    nik_ktp: { label: "NIK KTP" },
    birth_place: { label: "Tempat lahir" },
    birth_date: { label: "Tanggal lahir", format: asDate },
    address: { label: "Alamat" },
    phone: { label: "No. HP" },
    emergency_contact_name: { label: "Kontak darurat" },
    emergency_contact_phone: { label: "No. HP kontak darurat" },
    blood_type: { label: "Golongan darah" },
    employment_status: {
      label: "Status kerja",
      format: (value) => EMPLOYMENT_STATUS_LABELS[value as EmploymentStatus] ?? String(value),
    },
    work_type: {
      label: "Tipe",
      format: (value) => WORK_TYPE_LABELS[value as WorkType] ?? String(value),
    },
    position_id: { label: "Jabatan" },
    join_date: { label: "Tanggal masuk", format: asDate },
    exit_date: { label: "Tanggal keluar", format: asDate },
    is_active: { label: "Status", format: asActive },
    bank_name: { label: "Bank" },
    bank_account_number: { label: "No. rekening" },
    bank_account_holder: { label: "Atas nama" },
    bpjs_number: { label: "No. BPJS" },
    verification_status: {
      label: "Verifikasi",
      format: (value) => (value === "pending" ? "Menunggu Verifikasi" : "Terverifikasi"),
    },
    registered_by: { label: "Didaftarkan oleh", format: () => "Lapangan" },
  },
  employee_pay_settings: {
    pay_type: {
      label: "Tipe gaji",
      format: (value) => PAY_TYPE_LABELS[value as PayType] ?? String(value),
    },
    daily_wage: { label: "Upah harian", format: asRupiah },
    base_salary: { label: "Gaji pokok", format: asRupiah },
    fixed_allowance: { label: "Tunjangan tetap", format: asRupiah },
    meal_allowance_per_day: { label: "Uang makan/hari", format: asRupiah },
    field_allowance_per_day: { label: "Tunjangan lapangan/hari", format: asRupiah },
    overtime_rate_per_hour: { label: "Tarif lembur/jam", format: asRupiah },
    fixed_deduction: { label: "Potongan tetap (BPJS)", format: asRupiah },
  },
  employee_certificates: {
    employee_id: { label: "Karyawan" },
    certificate_type_id: { label: "Jenis sertifikat" },
    certificate_no: { label: "Nomor" },
    issuer: { label: "Penerbit" },
    issued_date: { label: "Tanggal terbit", format: asDate },
    expiry_date: { label: "Tanggal kedaluwarsa", format: asDate },
    notes: { label: "Catatan" },
    training_id: { label: "Pelatihan", format: () => "dari pelatihan" },
  },
  clients: {
    name: { label: "Nama" },
    kind: { label: "Jenis", format: (value) => CLIENT_KIND_LABELS[value as ClientKind] ?? String(value) },
    address: { label: "Alamat" },
    npwp: { label: "NPWP" },
    payment_term_days: { label: "Termin pembayaran (hari)" },
    notes: { label: "Catatan" },
    is_active: { label: "Status", format: asActive },
  },
  tenders: {
    name: { label: "Nama paket" },
    client_id: { label: "Klien" },
    end_owner: { label: "Pemilik akhir" },
    location: { label: "Lokasi" },
    voltage_kv: { label: "Tegangan", format: (value) => `${value} kV` },
    length_kms: { label: "Panjang (kms)" },
    tower_count: { label: "Jumlah tower" },
    scope: { label: "Lingkup pekerjaan" },
    info_date: { label: "Tanggal informasi", format: asDate },
    bid_deadline: { label: "Batas penawaran", format: asDate },
    bid_value: { label: "Nilai penawaran", format: asRupiah },
    estimated_cost: { label: "Estimasi biaya", format: asRupiah },
    pic_id: { label: "PIC", format: () => "diubah" },
    win_probability: { label: "Peluang menang", format: (value) => `${value}%` },
    planned_margin: { label: "Margin rencana", format: (value) => `${value}%` },
    weighted_value: { label: "Nilai tertimbang", format: asRupiah },
    status: { label: "Status", format: (value) => TENDER_STATUS_LABELS[value as TenderStatus] ?? String(value) },
    closed_date: { label: "Tanggal penutupan", format: asDate },
    lost_reason: { label: "Alasan kalah", format: (value) => LOST_REASON_LABELS[value as LostReason] ?? String(value) },
    lost_note: { label: "Keterangan kalah" },
    winner_name: { label: "Pemenang" },
    winner_price: { label: "Harga pemenang", format: asRupiah },
    notes: { label: "Catatan" },
  },
  projects: {
    name: { label: "Nama proyek" },
    client_id: { label: "Klien" },
    end_owner: { label: "Pemilik akhir" },
    site: { label: "Lokasi pekerjaan" },
    voltage_kv: { label: "Tegangan", format: (value) => `${value} kV` },
    length_kms: { label: "Panjang (kms)" },
    tower_count: { label: "Jumlah tower" },
    start_date: { label: "Tanggal mulai", format: asDate },
    target_finish_date: { label: "Target selesai", format: asDate },
    finish_date: { label: "Target selesai berlaku", format: asDate },
    status: { label: "Status", format: (value) => PROJECT_STATUS_LABELS[value as ProjectStatus] ?? String(value) },
    notes: { label: "Catatan" },
  },
  project_contracts: {
    contract_no: { label: "Nomor kontrak" },
    contract_date: { label: "Tanggal kontrak", format: asDate },
    contract_value: { label: "Nilai kontrak", format: asRupiah },
    ppn_applicable: { label: "Kena PPN", format: (value) => (value ? "Ya" : "Tidak") },
    maintenance_months: { label: "Masa pemeliharaan (bulan)" },
    scope: { label: "Lingkup" },
  },
  project_addenda: {
    addendum_no: { label: "Nomor" },
    addendum_date: { label: "Tanggal", format: asDate },
    new_value: { label: "Nilai baru", format: asRupiah },
    new_finish_date: { label: "Target selesai baru", format: asDate },
  },
  project_terms: {
    name: { label: "Nama termin" },
    kind: { label: "Jenis", format: (value) => TERM_KIND_LABELS[value as TermKind] ?? String(value) },
    percent: { label: "Persentase", format: (value) => `${value}%` },
    amount: { label: "Nilai", format: asRupiah },
    condition_type: {
      label: "Syarat",
      format: (value) => TERM_CONDITION_LABELS[value as TermCondition] ?? String(value),
    },
    condition_progress: { label: "Progres syarat", format: (value) => `${value}%` },
    condition_date: { label: "Tanggal syarat", format: asDate },
    status: { label: "Status", format: (value) => TERM_STATUS_LABELS[value as TermStatus] ?? String(value) },
    ready_at: { label: "Siap ditagih", format: (value) => formatDate(String(value)) },
    ready_by: { label: "Ditandai oleh", format: () => "diubah" },
  },
  project_budgets: {
    cost_category_id: { label: "Kategori" },
    amount: { label: "Anggaran", format: asRupiah },
    notes: { label: "Catatan" },
  },
  project_sections: {
    project_id: { label: "Proyek" },
    code: { label: "Kode seksi" },
    tower_from: { label: "Tower awal" },
    tower_to: { label: "Tower akhir" },
    tower_count: { label: "Jumlah tower" },
    length_km: { label: "Panjang (km)" },
    circuits: { label: "Jumlah sirkuit" },
    kms: { label: "kms" },
    planned_start: { label: "Rencana mulai", format: asDate },
    planned_finish: { label: "Rencana selesai", format: asDate },
    sort_order: { label: "Urutan" },
    notes: { label: "Catatan" },
  },
  project_stages: {
    project_id: { label: "Proyek" },
    name: { label: "Tahapan" },
    weight: { label: "Bobot" },
    sort_order: { label: "Urutan" },
  },
  assignments: {
    employee_id: { label: "Karyawan" },
    project_id: { label: "Proyek" },
    position_id: { label: "Jabatan" },
    start_date: { label: "Tanggal mulai", format: asDate },
    end_date: { label: "Tanggal selesai", format: asDate },
    notes: { label: "Catatan" },
    override_reason: { label: "Alasan override" },
    overridden_by: { label: "Override oleh", format: () => "HCM" },
    overridden_at: { label: "Waktu override", format: (value) => formatDate(String(value)) },
    missing_certificates: { label: "Sertifikat tidak lengkap" },
  },
  daily_reports: {
    project_id: { label: "Proyek" },
    report_date: { label: "Tanggal", format: asDate },
    status: {
      label: "Status",
      format: (value) => REPORT_STATUS_LABELS[value as ReportStatus] ?? String(value),
    },
    no_activity: { label: "Tidak ada kegiatan", format: (value) => (value ? "Ya" : "Tidak") },
    no_activity_reason: { label: "Alasan" },
    weather_morning: { label: "Cuaca pagi", format: (value) => WEATHER_LABELS[value as Weather] ?? "—" },
    weather_midday: { label: "Cuaca siang", format: (value) => WEATHER_LABELS[value as Weather] ?? "—" },
    weather_afternoon: { label: "Cuaca sore", format: (value) => WEATHER_LABELS[value as Weather] ?? "—" },
    effective_hours: { label: "Jam kerja efektif" },
    safety_briefing: { label: "Safety briefing", format: (value) => (value ? "Ya" : "Tidak") },
    briefing_participants: { label: "Peserta briefing" },
    equipment_used: { label: "Alat utama" },
    plan_tomorrow: { label: "Rencana esok" },
    notes: { label: "Catatan" },
    submitted_by: { label: "Dikirim oleh", format: () => "diubah" },
    submitted_at: { label: "Dikirim", format: (value) => formatDate(String(value)) },
    reviewed_by: { label: "Diperiksa oleh", format: () => "Operasional" },
    reviewed_at: { label: "Diperiksa", format: (value) => formatDate(String(value)) },
    review_comment: { label: "Komentar pemeriksaan" },
  },
  tools: {
    code: { label: "Kode" },
    name: { label: "Nama" },
    category_id: { label: "Kategori" },
    tracking: { label: "Pelacakan", format: (value) => (value === "unit" ? "Per Unit" : "Per Jumlah") },
    serial_no: { label: "No. seri" },
    ownership: { label: "Kepemilikan", format: (value) => (value === "rented" ? "Sewa" : "Milik Sendiri") },
    supplier_id: { label: "Supplier" },
    rental_rate: { label: "Tarif sewa", format: asRupiah },
    rental_period: { label: "Periode sewa", format: (value) => (value === "month" ? "per bulan" : "per hari") },
    notes: { label: "Catatan" },
    is_active: { label: "Status", format: asActive },
    stock_adjustment: { label: "Penyesuaian stok" },
  },
  delivery_notes: {
    number: { label: "Nomor" },
    from_location_id: { label: "Asal" },
    to_location_id: { label: "Tujuan" },
    note_date: { label: "Tanggal", format: asDate },
    vehicle: { label: "Kendaraan" },
    driver: { label: "Sopir" },
    notes: { label: "Catatan" },
    status: {
      label: "Status",
      format: (value) => ({ sent: "Dikirim", received: "Diterima", cancelled: "Batal" })[String(value)] ?? String(value),
    },
    sent_by: { label: "Dikirim oleh", format: () => "Operasional" },
    sent_at: { label: "Dikirim", format: (value) => formatDate(String(value)) },
    received_by: { label: "Diterima oleh", format: () => "diubah" },
    received_at: { label: "Diterima", format: (value) => formatDate(String(value)) },
    receipt_note: { label: "Catatan penerimaan" },
    cancelled_at: { label: "Dibatalkan", format: (value) => formatDate(String(value)) },
    cancel_reason: { label: "Alasan batal" },
  },
};

export type AuditEntry = {
  id: number;
  table_name: string;
  record_id: string;
  action: string;
  actor_name: string | null;
  created_at: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_fields: string[] | null;
  reason: string | null;
};

export type AuditChange = { label: string; from: string; to: string };

function formatValue(table: string, field: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const spec = AUDIT_FIELDS[table]?.[field];
  if (spec?.format) return spec.format(value);
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

/** Changed fields of an update or cancel entry, labelled and formatted. */
export function describeChanges(entry: AuditEntry): AuditChange[] {
  const fields = entry.changed_fields ?? [];
  return fields.map((field) => ({
    label: AUDIT_FIELDS[entry.table_name]?.[field]?.label ?? field,
    from: formatValue(entry.table_name, field, entry.old_values?.[field]),
    to: formatValue(entry.table_name, field, entry.new_values?.[field]),
  }));
}

export function auditTableLabel(table: string) {
  return AUDIT_TABLE_LABELS[table] ?? table;
}

export function auditActionLabel(action: string) {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

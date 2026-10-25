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
import { formatDate, formatRupiah } from "@/lib/format";
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
};

/** Audit tables whose entries only Direktur may read (PRD §6, SQL is_pay_table). */
export const PAY_AUDIT_TABLES = ["employee_pay_settings"];

/**
 * Fields that store an id; the server swaps the id for this column of the
 * referenced row before the entry is shown.
 */
export const AUDIT_REFS: Record<
  string,
  Record<string, { table: "positions" | "employees" | "certificate_types" | "clients"; column: string }>
> = {
  employees: { position_id: { table: "positions", column: "name" } },
  profiles: { employee_id: { table: "employees", column: "full_name" } },
  employee_certificates: {
    employee_id: { table: "employees", column: "full_name" },
    certificate_type_id: { table: "certificate_types", column: "name" },
  },
  tenders: { client_id: { table: "clients", column: "name" } },
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

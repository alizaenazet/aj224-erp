// Employee enums and labels (HCM-01, HCM-02), shared by client and server.

export const EMPLOYMENT_STATUSES = ["permanent", "contract", "daily"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];
export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  permanent: "Tetap",
  contract: "Kontrak",
  daily: "Harian Lepas",
};

export const WORK_TYPES = ["office", "field"] as const;
export type WorkType = (typeof WORK_TYPES)[number];
export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  office: "Kantor",
  field: "Lapangan",
};

export const BLOOD_TYPES = ["A", "B", "AB", "O"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const EMPLOYEE_STATUSES = ["active", "inactive"] as const;
export const EMPLOYEE_STATUS_LABELS: Record<(typeof EMPLOYEE_STATUSES)[number], string> = {
  active: "Aktif",
  inactive: "Nonaktif",
};

/** HCM-12: local workers added from the field wait for HCM verification. */
export const VERIFICATION_STATUSES = ["verified", "pending"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  verified: "Terverifikasi",
  pending: "Menunggu Verifikasi",
};

export const PAY_TYPES = ["daily", "monthly"] as const;
export type PayType = (typeof PAY_TYPES)[number];
export const PAY_TYPE_LABELS: Record<PayType, string> = {
  daily: "Harian",
  monthly: "Bulanan",
};

/** Roles that see the general employee data (PRD §13). */
export const EMPLOYEE_VIEW_ROLES = ["super_admin", "director", "finance", "hcm", "operations"] as const;
/** Roles that see pay settings (HCM-02, PRD §6). */
export const PAY_VIEW_ROLES = ["hcm", "finance", "director"] as const;
/** Roles that see employee documents (HCM-02). */
export const DOCUMENT_VIEW_ROLES = ["hcm", "director"] as const;

export type EmployeeRow = {
  id: string;
  employee_no: string;
  full_name: string;
  nik_ktp: string | null;
  phone: string | null;
  work_type: WorkType;
  employment_status: EmploymentStatus;
  join_date: string;
  exit_date: string | null;
  is_active: boolean;
  verification_status: VerificationStatus;
  position: { name: string } | null;
};

export type Employee = EmployeeRow & {
  birth_place: string | null;
  birth_date: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_type: BloodType | null;
  position_id: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  bpjs_number: string | null;
};

export type PaySettings = {
  employee_id: string;
  pay_type: PayType;
  daily_wage: number | null;
  base_salary: number | null;
  fixed_allowance: number;
  meal_allowance_per_day: number;
  field_allowance_per_day: number;
  overtime_rate_per_hour: number;
  fixed_deduction: number;
};

/** Pay components in display order, with their labels. */
export const PAY_COMPONENTS = [
  { name: "fixed_allowance", label: "Tunjangan tetap" },
  { name: "meal_allowance_per_day", label: "Uang makan/hari" },
  { name: "field_allowance_per_day", label: "Tunjangan lapangan/hari" },
  { name: "overtime_rate_per_hour", label: "Tarif lembur/jam" },
  { name: "fixed_deduction", label: "Potongan tetap (BPJS)" },
] as const;

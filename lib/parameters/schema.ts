import { z } from "zod";

const int = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} harus angka.` })
    .int(`${label} harus bilangan bulat.`)
    .min(min, `${label} minimal ${min}.`)
    .max(max, `${label} maksimal ${max}.`);

const decimal = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} harus angka.` })
    .min(min, `${label} minimal ${min}.`)
    .max(max, `${label} maksimal ${max}.`);

/** MST-10 parameters with the same bounds as the database checks. */
export const parametersSchema = z
  .object({
    backdate_days: int("Batas input mundur", 0, 31),
    cert_expiry_warning_days: int("Batas segera kedaluwarsa", 1, 365),
    health_warning_points: decimal("Ambang Waspada", 0.01, 999),
    health_critical_points: decimal("Ambang Kritis", 0.01, 999),
    ppn_rate: decimal("Tarif PPN", 0, 100),
    standard_work_hours: decimal("Jam kerja standar", 1, 24),
    monthly_salary_divisor: int("Pembagi gaji harian", 1, 31),
  })
  .refine((values) => values.health_warning_points < values.health_critical_points, {
    path: ["health_warning_points"],
    message: "Ambang Waspada harus lebih kecil dari ambang Kritis.",
  });

export type ParametersInput = z.input<typeof parametersSchema>;

export const PARAMETER_LABELS: Record<string, string> = {
  backdate_days: "Batas input mundur",
  cert_expiry_warning_days: "Batas segera kedaluwarsa",
  health_warning_points: "Ambang Waspada",
  health_critical_points: "Ambang Kritis",
  ppn_rate: "Tarif PPN",
  standard_work_hours: "Jam kerja standar",
  monthly_salary_divisor: "Pembagi gaji harian",
};

export const RESET_PERIODS = [
  { value: "month", label: "Setiap bulan" },
  { value: "year", label: "Setiap tahun" },
  { value: "never", label: "Tidak pernah" },
] as const;

export const documentFormatSchema = z.object({
  format: z
    .string()
    .trim()
    .min(1, "Format wajib diisi.")
    .max(60, "Format maksimal 60 karakter.")
    .regex(/\{SEQ:[0-9]+\}/, "Format harus memuat {SEQ:n}, mis. {SEQ:3}."),
  reset_period: z.enum(["month", "year", "never"], "Pilih periode reset."),
});

export type DocumentFormatInput = z.input<typeof documentFormatSchema>;

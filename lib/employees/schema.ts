import { z } from "zod";
import {
  BLOOD_TYPES,
  EMPLOYMENT_STATUSES,
  PAY_TYPES,
  WORK_TYPES,
} from "@/lib/employees/labels";

// Shared by the forms and the server actions. Each schema accepts its own
// output, because zodResolver passes the parsed values to the action.

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function emptyNumberToNull(value: unknown) {
  if (value === "" || value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value === "string") return Number(value);
  return value;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const optionalText = (label: string, max = 200) =>
  z.preprocess(emptyToNull, z.string().max(max, `${label} maksimal ${max} karakter.`).nullable());

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(1, `${label} wajib diisi.`)
    .max(max, `${label} maksimal ${max} karakter.`);

const optionalPhone = (label: string) =>
  z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^[0-9+\-\s]{8,20}$/, `${label} hanya angka, spasi, + atau -, 8–20 karakter.`)
      .nullable(),
  );

const optionalDate = (label: string) =>
  z.preprocess(emptyToNull, z.string().regex(ISO_DATE, `${label} tidak valid.`).nullable());

/** HCM-01 employee data (the exit date has its own action). */
export const employeeSchema = z.object({
  employee_no: requiredText("NIK karyawan", 30),
  full_name: requiredText("Nama", 120),
  nik_ktp: z.preprocess(
    emptyToNull,
    z.string().regex(/^\d{16}$/, "NIK KTP harus 16 digit angka.").nullable(),
  ),
  birth_place: optionalText("Tempat lahir", 80),
  birth_date: optionalDate("Tanggal lahir"),
  address: optionalText("Alamat", 300),
  phone: optionalPhone("No. HP"),
  emergency_contact_name: optionalText("Nama kontak darurat", 120),
  emergency_contact_phone: optionalPhone("No. HP kontak darurat"),
  blood_type: z.preprocess(emptyToNull, z.enum(BLOOD_TYPES).nullable()),
  employment_status: z.enum(EMPLOYMENT_STATUSES, "Pilih status kerja."),
  work_type: z.enum(WORK_TYPES, "Pilih tipe karyawan."),
  position_id: z.uuid("Pilih jabatan."),
  join_date: z
    .string({ error: "Tanggal masuk wajib diisi." })
    .regex(ISO_DATE, "Tanggal masuk wajib diisi."),
  bank_name: optionalText("Bank", 60),
  bank_account_number: optionalText("No. rekening", 40),
  bank_account_holder: optionalText("Atas nama", 120),
  bpjs_number: optionalText("No. BPJS", 30),
});

export type EmployeeInput = z.output<typeof employeeSchema>;

const MAX_AMOUNT = 1_000_000_000;

const amount = (label: string) =>
  z.preprocess(
    emptyNumberToNull,
    z
      .number({ error: `${label} harus angka.` })
      .min(0, `${label} tidak boleh negatif.`)
      .max(MAX_AMOUNT, `${label} terlalu besar.`)
      .nullable(),
  );

/** Components default to 0 when left empty. */
const component = (label: string) =>
  z.preprocess(
    (value) => emptyNumberToNull(value) ?? 0,
    z
      .number({ error: `${label} harus angka.` })
      .min(0, `${label} tidak boleh negatif.`)
      .max(MAX_AMOUNT, `${label} terlalu besar.`),
  );

/** HCM-02 pay settings; the wage that does not apply to the type is cleared. */
export const paySettingsSchema = z
  .object({
    pay_type: z.enum(PAY_TYPES, "Pilih tipe gaji."),
    daily_wage: amount("Upah harian"),
    base_salary: amount("Gaji pokok"),
    fixed_allowance: component("Tunjangan tetap"),
    meal_allowance_per_day: component("Uang makan/hari"),
    field_allowance_per_day: component("Tunjangan lapangan/hari"),
    overtime_rate_per_hour: component("Tarif lembur/jam"),
    fixed_deduction: component("Potongan tetap"),
  })
  .superRefine((values, ctx) => {
    if (values.pay_type === "daily" && values.daily_wage === null) {
      ctx.addIssue({
        code: "custom",
        path: ["daily_wage"],
        message: "Upah harian wajib diisi untuk tipe Harian.",
      });
    }
    if (values.pay_type === "monthly" && values.base_salary === null) {
      ctx.addIssue({
        code: "custom",
        path: ["base_salary"],
        message: "Gaji pokok wajib diisi untuk tipe Bulanan.",
      });
    }
  })
  .transform((values) => ({
    ...values,
    daily_wage: values.pay_type === "daily" ? values.daily_wage : null,
    base_salary: values.pay_type === "monthly" ? values.base_salary : null,
  }));

export type PaySettingsInput = z.output<typeof paySettingsSchema>;

/** Exit date for deactivation: today or earlier (WIB), checked again in SQL. */
export const exitDateSchema = z
  .string({ error: "Tanggal keluar wajib diisi." })
  .regex(ISO_DATE, "Tanggal keluar wajib diisi.");

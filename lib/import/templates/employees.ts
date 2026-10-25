import "server-only";

import {
  BLOOD_TYPES,
  EMPLOYMENT_STATUS_LABELS,
  PAY_TYPE_LABELS,
  WORK_TYPE_LABELS,
} from "@/lib/employees/labels";
import {
  employeeSchema,
  paySettingsSchema,
  type EmployeeInput,
  type PaySettingsInput,
} from "@/lib/employees/schema";
import { RowReader, normalizeName } from "@/lib/import/cells";
import { insertPrepared } from "@/lib/import/insert";
import type { ImportColumn, ImportTemplate, Prepared, RowError } from "@/lib/import/types";

type EmployeeImport = { employee: EmployeeInput; pay: PaySettingsInput | null };

const BLOOD_LABELS = Object.fromEntries(BLOOD_TYPES.map((type) => [type, type])) as Record<
  (typeof BLOOD_TYPES)[number],
  string
>;

const PAY_KEYS = [
  "pay_type",
  "daily_wage",
  "base_salary",
  "fixed_allowance",
  "meal_allowance_per_day",
  "field_allowance_per_day",
  "overtime_rate_per_hour",
  "fixed_deduction",
] as const;

const COLUMNS: ImportColumn[] = [
  { key: "employee_no", header: "NIK Karyawan", required: true, note: "Unik, mis. AJ-0101.", example: "AJ-0101", width: 14 },
  { key: "full_name", header: "Nama", required: true, note: "Nama lengkap.", example: "Agus Salim", width: 24 },
  { key: "nik_ktp", header: "NIK KTP", note: "16 digit angka; tulis sebagai teks.", example: "3524010101900001", width: 20 },
  { key: "birth_place", header: "Tempat Lahir", note: "Teks.", example: "Lamongan" },
  { key: "birth_date", header: "Tanggal Lahir", note: "Tanggal (yyyy-mm-dd atau dd/mm/yyyy).", example: "1990-01-01", format: "date" },
  { key: "address", header: "Alamat", note: "Teks.", example: "Desa Kemlagi, Lamongan", width: 28 },
  { key: "phone", header: "No. HP", note: "Angka, spasi, + atau -.", example: "0813-3002-0101", width: 16 },
  { key: "emergency_contact_name", header: "Kontak Darurat", note: "Nama kontak darurat.", example: "Siti" },
  { key: "emergency_contact_phone", header: "No. HP Kontak Darurat", note: "Angka, spasi, + atau -.", example: "0813-3002-1101", width: 18 },
  { key: "blood_type", header: "Golongan Darah", note: "A, B, AB atau O.", example: "O", options: BLOOD_TYPES },
  {
    key: "employment_status",
    header: "Status Kerja",
    required: true,
    note: "Tetap, Kontrak atau Harian Lepas.",
    example: "Harian Lepas",
    options: Object.values(EMPLOYMENT_STATUS_LABELS),
  },
  { key: "work_type", header: "Tipe", required: true, note: "Kantor atau Lapangan.", example: "Lapangan", options: Object.values(WORK_TYPE_LABELS) },
  { key: "position_id", header: "Jabatan", required: true, note: "Nama jabatan dari Master Data (lihat daftar di bawah).", example: "Linesman/Pemanjat", width: 20 },
  { key: "join_date", header: "Tanggal Masuk", required: true, note: "Tanggal (yyyy-mm-dd atau dd/mm/yyyy).", example: "2026-10-01", format: "date" },
  { key: "bank_name", header: "Bank", note: "Teks.", example: "BRI" },
  { key: "bank_account_number", header: "No. Rekening", note: "Tulis sebagai teks.", example: "0021-01-000101-50-1", width: 20 },
  { key: "bank_account_holder", header: "Atas Nama", note: "Teks.", example: "Agus Salim" },
  { key: "bpjs_number", header: "No. BPJS", note: "Tulis sebagai teks.", example: "0001234601" },
  {
    key: "pay_type",
    header: "Tipe Gaji",
    note: "Harian atau Bulanan. Wajib bila salah satu kolom gaji diisi.",
    example: "Harian",
    options: Object.values(PAY_TYPE_LABELS),
  },
  { key: "daily_wage", header: "Upah Harian", note: "Rupiah; wajib untuk tipe Harian.", example: "150000", format: "rupiah" },
  { key: "base_salary", header: "Gaji Pokok", note: "Rupiah; wajib untuk tipe Bulanan.", example: "", format: "rupiah" },
  { key: "fixed_allowance", header: "Tunjangan Tetap", note: "Rupiah; kosong = 0.", example: "0", format: "rupiah" },
  { key: "meal_allowance_per_day", header: "Uang Makan/Hari", note: "Rupiah; kosong = 0.", example: "25000", format: "rupiah" },
  { key: "field_allowance_per_day", header: "Tunjangan Lapangan/Hari", note: "Rupiah; kosong = 0.", example: "30000", format: "rupiah" },
  { key: "overtime_rate_per_hour", header: "Tarif Lembur/Jam", note: "Rupiah; kosong = 0.", example: "25000", format: "rupiah" },
  { key: "fixed_deduction", header: "Potongan Tetap", note: "Rupiah (BPJS); kosong = 0.", example: "0", format: "rupiah" },
];

/** Karyawan + pengaturan gaji (HCM-01, HCM-02; PRD §16). */
export const employeesTemplate: ImportTemplate<EmployeeImport> = {
  key: "employees",
  title: "Karyawan",
  description: "Data karyawan beserta pengaturan gaji (opsional). Wajib selesai sebelum absensi dimulai.",
  roles: ["hcm"],
  fileBase: "templat-karyawan",
  columns: COLUMNS,

  async references(ctx) {
    const { data } = await ctx.supabase.from("positions").select("name").eq("is_active", true).order("sort_order");
    return [{ title: "Jabatan", values: (data ?? []).map((row) => row.name) }];
  },

  async prepare(rows, ctx) {
    const [{ data: positions }, { data: existing }] = await Promise.all([
      ctx.supabase.from("positions").select("id, name").eq("is_active", true),
      ctx.supabase.from("employees").select("employee_no, nik_ktp"),
    ]);
    const positionIds = new Map((positions ?? []).map((row) => [normalizeName(row.name), row.id]));
    const numbers = new Set((existing ?? []).map((row) => normalizeName(row.employee_no)));
    const niks = new Set((existing ?? []).map((row) => row.nik_ktp).filter(Boolean));

    const valid: Prepared<EmployeeImport>[] = [];
    const errors: RowError[] = [];

    for (const row of rows) {
      const reader = new RowReader(row, COLUMNS);
      const candidate = {
        employee_no: reader.text("employee_no"),
        full_name: reader.text("full_name"),
        nik_ktp: reader.text("nik_ktp"),
        birth_place: reader.text("birth_place"),
        birth_date: reader.date("birth_date"),
        address: reader.text("address"),
        phone: reader.text("phone"),
        emergency_contact_name: reader.text("emergency_contact_name"),
        emergency_contact_phone: reader.text("emergency_contact_phone"),
        blood_type: reader.choice("blood_type", BLOOD_LABELS),
        employment_status: reader.choice("employment_status", EMPLOYMENT_STATUS_LABELS),
        work_type: reader.choice("work_type", WORK_TYPE_LABELS),
        position_id: reader.lookup("position_id", positionIds, "Jabatan"),
        join_date: reader.date("join_date"),
        bank_name: reader.text("bank_name"),
        bank_account_number: reader.text("bank_account_number"),
        bank_account_holder: reader.text("bank_account_holder"),
        bpjs_number: reader.text("bpjs_number"),
      };
      const parsed = employeeSchema.safeParse(candidate);
      if (!parsed.success) reader.zod(parsed.error);

      if (candidate.employee_no) {
        const key = normalizeName(candidate.employee_no);
        if (numbers.has(key)) reader.fail("employee_no", "NIK karyawan sudah ada.");
      }
      if (candidate.nik_ktp && niks.has(candidate.nik_ktp)) reader.fail("nik_ktp", "NIK KTP sudah ada.");

      let pay: PaySettingsInput | null = null;
      const hasPay = PAY_KEYS.some((key) => reader.raw(key) !== null && String(reader.raw(key)).trim() !== "");
      if (hasPay) {
        const payCandidate = {
          pay_type: reader.choice("pay_type", PAY_TYPE_LABELS),
          daily_wage: reader.number("daily_wage"),
          base_salary: reader.number("base_salary"),
          fixed_allowance: reader.number("fixed_allowance"),
          meal_allowance_per_day: reader.number("meal_allowance_per_day"),
          field_allowance_per_day: reader.number("field_allowance_per_day"),
          overtime_rate_per_hour: reader.number("overtime_rate_per_hour"),
          fixed_deduction: reader.number("fixed_deduction"),
        };
        const payParsed = paySettingsSchema.safeParse(payCandidate);
        if (payParsed.success) pay = payParsed.data;
        else reader.zod(payParsed.error);
      }

      if (reader.errors.length || !parsed.success) {
        errors.push(...reader.errors);
        continue;
      }
      // Later rows of the same file see this one as existing.
      numbers.add(normalizeName(parsed.data.employee_no));
      if (parsed.data.nik_ktp) niks.add(parsed.data.nik_ktp);
      valid.push({ row: row.row, value: { employee: parsed.data, pay } });
    }

    return { valid, errors };
  },

  async insert(valid, ctx) {
    const { inserted, errors } = await insertPrepared(valid, (values) =>
      ctx.supabase
        .from("employees")
        .insert(values.map((value) => value.employee))
        .select("id"),
    );

    const pays = inserted.filter((item) => item.value.pay);
    if (pays.length) {
      const payResult = await insertPrepared(
        pays.map((item) => ({ row: item.row, value: { employee_id: item.result.id, ...item.value.pay! } })),
        (values) => ctx.supabase.from("employee_pay_settings").insert(values).select("employee_id"),
      );
      errors.push(
        ...payResult.errors.map((error) => ({
          ...error,
          message: `Karyawan tersimpan, pengaturan gaji gagal: ${error.message}`,
        })),
      );
    }

    return { inserted: inserted.length, errors };
  },
};

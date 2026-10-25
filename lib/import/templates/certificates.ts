import "server-only";

import { certificateSchema, type CertificateInput } from "@/lib/certifications/schema";
import { RowReader, normalizeName } from "@/lib/import/cells";
import { insertPrepared } from "@/lib/import/insert";
import type { ImportColumn, ImportTemplate, Prepared, RowError } from "@/lib/import/types";

type CertificateImport = CertificateInput & { employee_id: string };

const COLUMNS: ImportColumn[] = [
  { key: "employee_id", header: "NIK Karyawan", required: true, note: "NIK karyawan yang sudah ada.", example: "AJ-0103", width: 14 },
  { key: "certificate_type_id", header: "Jenis Sertifikat", required: true, note: "Nama jenis dari Master Data (lihat daftar di bawah).", example: "TKBT Tingkat 2", width: 20 },
  { key: "certificate_no", header: "Nomor", note: "Nomor sertifikat.", example: "TKBT2/2024/0101", width: 18 },
  { key: "issuer", header: "Penerbit", note: "Lembaga penerbit.", example: "PT Sertifikasi K3 Nusantara", width: 26 },
  { key: "issued_date", header: "Tanggal Terbit", required: true, note: "Tanggal (yyyy-mm-dd atau dd/mm/yyyy).", example: "2024-03-01", format: "date" },
  { key: "expiry_date", header: "Tanggal Kedaluwarsa", note: "Kosongkan bila berlaku seumur hidup.", example: "2029-03-01", format: "date" },
  { key: "notes", header: "Catatan", note: "Teks.", example: "", width: 24 },
];

/** Sertifikat karyawan (HCM-03; PRD §16). Scans are uploaded per certificate. */
export const certificatesTemplate: ImportTemplate<CertificateImport> = {
  key: "certificates",
  title: "Sertifikat Karyawan",
  description: "Sertifikat per karyawan. File scan diunggah lewat halaman karyawan setelah impor.",
  roles: ["hcm"],
  fileBase: "templat-sertifikat",
  columns: COLUMNS,

  async references(ctx) {
    const { data } = await ctx.supabase.from("certificate_types").select("name").eq("is_active", true).order("name");
    return [{ title: "Jenis Sertifikat", values: (data ?? []).map((row) => row.name) }];
  },

  async prepare(rows, ctx) {
    const [{ data: employees }, { data: types }, { data: existing }] = await Promise.all([
      ctx.supabase.from("employees").select("id, employee_no"),
      ctx.supabase.from("certificate_types").select("id, name").eq("is_active", true),
      ctx.supabase.from("employee_certificates").select("employee_id, certificate_type_id, issued_date"),
    ]);
    const employeeIds = new Map((employees ?? []).map((row) => [normalizeName(row.employee_no), row.id]));
    const typeIds = new Map((types ?? []).map((row) => [normalizeName(row.name), row.id]));
    const seen = new Set((existing ?? []).map((row) => `${row.employee_id}|${row.certificate_type_id}|${row.issued_date}`));

    const valid: Prepared<CertificateImport>[] = [];
    const errors: RowError[] = [];

    for (const row of rows) {
      const reader = new RowReader(row, COLUMNS);
      const employeeId = reader.lookup("employee_id", employeeIds, "Karyawan dengan NIK");
      const parsed = certificateSchema.safeParse({
        certificate_type_id: reader.lookup("certificate_type_id", typeIds, "Jenis sertifikat"),
        certificate_no: reader.text("certificate_no"),
        issuer: reader.text("issuer"),
        issued_date: reader.date("issued_date"),
        expiry_date: reader.date("expiry_date"),
        notes: reader.text("notes"),
      });
      if (!parsed.success) reader.zod(parsed.error);

      if (parsed.success && employeeId) {
        const key = `${employeeId}|${parsed.data.certificate_type_id}|${parsed.data.issued_date}`;
        if (seen.has(key)) reader.fail(undefined, "Sertifikat dengan jenis dan tanggal terbit yang sama sudah ada.");
        else seen.add(key);
      }

      if (reader.errors.length || !parsed.success || !employeeId) {
        errors.push(...reader.errors);
        continue;
      }
      valid.push({ row: row.row, value: { ...parsed.data, employee_id: employeeId } });
    }

    return { valid, errors };
  },

  async insert(valid, ctx) {
    const { inserted, errors } = await insertPrepared(valid, (values) =>
      ctx.supabase.from("employee_certificates").insert(values).select("id"),
    );
    return { inserted: inserted.length, errors };
  },
};

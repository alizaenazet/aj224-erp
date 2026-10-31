import "server-only";

import { dbErrorMessage } from "@/lib/actions";
import { ATTENDANCE_STATUS_LABELS, type AttendanceStatus } from "@/lib/attendance/labels";
import { RowReader, normalizeName } from "@/lib/import/cells";
import type { ImportColumn, ImportTemplate, Prepared, RowError } from "@/lib/import/types";

type AttendanceImport = {
  employee_id: string;
  work_date: string;
  status: AttendanceStatus;
  overtime_hours: number;
  project_id: string | null;
  notes: string | null;
};

const COLUMNS: ImportColumn[] = [
  { key: "employee_id", header: "NIK Karyawan", required: true, note: "NIK karyawan yang sudah ada.", example: "AJ-0005", width: 16 },
  { key: "work_date", header: "Tanggal", required: true, note: "Tanggal, paling lambat hari ini.", example: "2026-10-01", format: "date" },
  {
    key: "status",
    header: "Status",
    required: true,
    note: Object.values(ATTENDANCE_STATUS_LABELS).join(", ") + ".",
    example: "Hadir",
    options: Object.values(ATTENDANCE_STATUS_LABELS),
  },
  { key: "overtime_hours", header: "Jam Lembur", note: "0–24, hanya untuk Hadir.", example: "0", format: "number" },
  { key: "project_id", header: "Kode Proyek", note: "Kosongkan untuk absensi kantor.", example: "", width: 22 },
  { key: "notes", header: "Catatan", note: "Teks.", example: "", width: 24 },
];

/** Absensi kantor dan lapangan (HCM-10, UMM-13); a row for an existing date replaces it. */
export const attendanceTemplate: ImportTemplate<AttendanceImport> = {
  key: "attendance",
  title: "Absensi",
  description: "Absensi harian per karyawan; baris untuk tanggal yang sudah tercatat akan menggantikannya.",
  roles: ["hcm"],
  fileBase: "templat-absensi",
  columns: COLUMNS,

  async prepare(rows, ctx) {
    const [{ data: employees }, { data: projects }] = await Promise.all([
      ctx.supabase.from("employees").select("id, employee_no"),
      ctx.supabase.from("projects").select("id, code"),
    ]);
    const employeeIds = new Map((employees ?? []).map((row) => [normalizeName(row.employee_no), row.id]));
    const projectIds = new Map((projects ?? []).map((row) => [normalizeName(row.code), row.id]));
    const seen = new Set<string>();

    const valid: Prepared<AttendanceImport>[] = [];
    const errors: RowError[] = [];

    for (const row of rows) {
      const reader = new RowReader(row, COLUMNS);
      const employeeId = reader.lookup("employee_id", employeeIds, "Karyawan");
      const workDate = reader.date("work_date");
      const status = reader.choice("status", ATTENDANCE_STATUS_LABELS);
      const overtime = reader.number("overtime_hours") ?? 0;
      const projectId = reader.text("project_id") ? reader.lookup("project_id", projectIds, "Proyek") : null;
      const notes = reader.text("notes");

      if (!employeeId && !reader.errors.length) reader.fail("employee_id", "NIK Karyawan wajib diisi.");
      if (!workDate && !reader.errors.some((error) => error.column === "Tanggal")) reader.fail("work_date", "Tanggal wajib diisi.");
      if (!status && !reader.errors.some((error) => error.column === "Status")) reader.fail("status", "Status wajib diisi.");
      if (workDate && workDate > ctx.today) reader.fail("work_date", "Tanggal tidak boleh melewati hari ini.");
      if (overtime < 0 || overtime > 24) reader.fail("overtime_hours", "Jam lembur 0–24.");
      if (status && status !== "present" && overtime > 0) reader.fail("overtime_hours", "Lembur hanya untuk status Hadir.");
      if (notes && notes.length > 200) reader.fail("notes", "Catatan maksimal 200 karakter.");
      if (employeeId && workDate) {
        const key = `${employeeId}|${workDate}`;
        if (seen.has(key)) reader.fail("work_date", "Karyawan ini sudah ada di baris lain untuk tanggal yang sama.");
        seen.add(key);
      }

      if (reader.errors.length || !employeeId || !workDate || !status) {
        errors.push(...reader.errors);
        continue;
      }
      valid.push({
        row: row.row,
        value: { employee_id: employeeId, work_date: workDate, status, overtime_hours: overtime, project_id: projectId, notes },
      });
    }

    return { valid, errors };
  },

  // Saved per project day through save_attendance, which updates only the
  // columns HCM may change; a failing day is retried row by row to name the rows.
  async insert(valid, ctx) {
    const days = new Map<string, Prepared<AttendanceImport>[]>();
    for (const item of valid) {
      const key = `${item.value.project_id ?? ""}|${item.value.work_date}`;
      days.set(key, [...(days.get(key) ?? []), item]);
    }
    const save = (items: Prepared<AttendanceImport>[]) =>
      ctx.supabase.rpc("save_attendance", {
        p_project: items[0].value.project_id as string,
        p_date: items[0].value.work_date,
        p_rows: items.map(({ value }) => ({
          employee_id: value.employee_id,
          status: value.status,
          overtime_hours: value.overtime_hours,
          notes: value.notes,
        })),
      });

    let inserted = 0;
    const errors: RowError[] = [];
    for (const items of days.values()) {
      const { error } = await save(items);
      if (!error) {
        inserted += items.length;
        continue;
      }
      for (const item of items) {
        const single = await save([item]);
        if (single.error) errors.push({ row: item.row, message: dbErrorMessage(single.error, "Baris gagal disimpan.") });
        else inserted += 1;
      }
    }
    return { inserted, errors };
  },
};

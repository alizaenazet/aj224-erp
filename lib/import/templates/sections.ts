import "server-only";

import { RowReader, normalizeName } from "@/lib/import/cells";
import { insertPrepared } from "@/lib/import/insert";
import type { ImportColumn, ImportTemplate, Prepared, RowError } from "@/lib/import/types";
import { sectionSchema, type SectionInput } from "@/lib/progress/schema";

type SectionImport = SectionInput & { project_id: string };

const COLUMNS: ImportColumn[] = [
  { key: "project_id", header: "Kode Proyek", required: true, note: "Kode proyek yang sudah ada (lihat daftar di bawah).", example: "PRJ/AJ224/2026/001", width: 22 },
  { key: "code", header: "Kode Seksi", required: true, note: "Unik dalam proyek, mis. S-05.", example: "S-05", width: 12 },
  { key: "tower_from", header: "Tower Awal", required: true, note: "Teks, mis. T.21.", example: "T.21", width: 12 },
  { key: "tower_to", header: "Tower Akhir", required: true, note: "Teks, mis. T.27.", example: "T.27", width: 12 },
  { key: "tower_count", header: "Jumlah Tower", note: "Bilangan bulat.", example: "6", format: "number" },
  { key: "length_km", header: "Panjang (km)", required: true, note: "Lebih dari 0. kms dihitung otomatis = panjang × sirkuit.", example: "3.6", format: "number" },
  { key: "circuits", header: "Jumlah Sirkuit", required: true, note: "1–4.", example: "2", options: ["1", "2", "3", "4"] },
  { key: "planned_start", header: "Rencana Mulai", required: true, note: "Tanggal.", example: "2026-11-01", format: "date" },
  { key: "planned_finish", header: "Rencana Selesai", required: true, note: "Tanggal, tidak sebelum rencana mulai.", example: "2026-12-15", format: "date" },
  { key: "notes", header: "Catatan", note: "Teks.", example: "", width: 24 },
];

/** Seksi tarik per proyek (PRJ-05, UMM-13). */
export const sectionsTemplate: ImportTemplate<SectionImport> = {
  key: "sections",
  title: "Seksi Tarik",
  description: "Seksi tarik proyek berjalan beserta jadwal rencananya; progres diisi di tab Seksi & Progres.",
  roles: ["operations"],
  fileBase: "templat-seksi-tarik",
  columns: COLUMNS,

  async references(ctx) {
    const { data } = await ctx.supabase
      .from("projects")
      .select("code, name")
      .neq("status", "closed")
      .order("code");
    return [{ title: "Proyek", values: (data ?? []).map((row) => `${row.code} — ${row.name}`) }];
  },

  async prepare(rows, ctx) {
    const [{ data: projects }, { data: existing }] = await Promise.all([
      ctx.supabase.from("projects").select("id, code, status"),
      ctx.supabase.from("project_sections").select("project_id, code, sort_order"),
    ]);
    // "PRJ/AJ224/2026/001 — Nama" from the reference list is accepted too.
    const projectIds = new Map((projects ?? []).map((row) => [normalizeName(row.code), row.id]));
    const closed = new Set((projects ?? []).filter((row) => row.status === "closed").map((row) => row.id));
    const seen = new Set((existing ?? []).map((row) => `${row.project_id}|${normalizeName(row.code)}`));
    const nextOrder = new Map<string, number>();
    for (const row of existing ?? []) {
      nextOrder.set(row.project_id, Math.max(nextOrder.get(row.project_id) ?? 0, row.sort_order));
    }

    const valid: Prepared<SectionImport>[] = [];
    const errors: RowError[] = [];

    for (const row of rows) {
      const reader = new RowReader(row, COLUMNS);
      const projectText = reader.text("project_id");
      const projectId = projectText
        ? (projectIds.get(normalizeName(projectText.split(" — ")[0])) ?? null)
        : null;
      if (projectText && !projectId) reader.fail("project_id", `Proyek "${projectText}" tidak ditemukan.`);
      if (projectId && closed.has(projectId)) reader.fail("project_id", "Proyek sudah ditutup.");

      const order = projectId ? (nextOrder.get(projectId) ?? 0) + 10 : 10;
      const section = sectionSchema.safeParse({
        code: reader.text("code"),
        tower_from: reader.text("tower_from"),
        tower_to: reader.text("tower_to"),
        tower_count: reader.number("tower_count"),
        length_km: reader.number("length_km"),
        circuits: reader.number("circuits"),
        planned_start: reader.date("planned_start"),
        planned_finish: reader.date("planned_finish"),
        sort_order: order,
        notes: reader.text("notes"),
      });
      if (!section.success) reader.zod(section.error);

      if (section.success && projectId) {
        const key = `${projectId}|${normalizeName(section.data.code)}`;
        if (seen.has(key)) reader.fail("code", "Kode seksi sudah ada di proyek ini.");
      }

      if (reader.errors.length || !section.success || !projectId) {
        if (!projectText) reader.fail("project_id", "Kode Proyek wajib diisi.");
        errors.push(...reader.errors);
        continue;
      }
      seen.add(`${projectId}|${normalizeName(section.data.code)}`);
      nextOrder.set(projectId, order);
      valid.push({ row: row.row, value: { ...section.data, project_id: projectId } });
    }

    return { valid, errors };
  },

  async insert(valid, ctx) {
    const { inserted, errors } = await insertPrepared(valid, (values) =>
      ctx.supabase.from("project_sections").insert(values).select("id"),
    );
    return { inserted: inserted.length, errors };
  },
};

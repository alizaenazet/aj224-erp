import "server-only";

import { RowReader, normalizeName } from "@/lib/import/cells";
import { insertPrepared } from "@/lib/import/insert";
import type { ImportColumn, ImportTemplate, Prepared, RowError } from "@/lib/import/types";
import {
  CLOSED_STATUSES,
  LOST_REASON_LABELS,
  TENDER_STATUS_LABELS,
  VOLTAGES,
} from "@/lib/tenders/labels";
import {
  tenderSchema,
  tenderStatusSchema,
  type TenderInput,
  type TenderStatusInput,
} from "@/lib/tenders/schema";

type TenderImport = TenderInput & TenderStatusInput;

const COLUMNS: ImportColumn[] = [
  { key: "name", header: "Nama Paket", required: true, note: "Nama paket tender.", example: "SUTT 150 kV Mojokerto – Ngoro", width: 36 },
  { key: "client_id", header: "Klien", required: true, note: "Nama klien yang sudah ada (lihat daftar di bawah).", example: "PT PLN (Persero) UIP Jawa Bagian Timur", width: 34 },
  { key: "end_owner", header: "Pemilik Akhir", note: "Mis. PLN UIP JBTB.", example: "PLN UIP JBTB" },
  { key: "location", header: "Lokasi", note: "Teks.", example: "Mojokerto, Jawa Timur", width: 22 },
  { key: "voltage_kv", header: "Tegangan (kV)", note: "150, 275 atau 500.", example: "150", options: VOLTAGES.map(String) },
  { key: "length_kms", header: "Panjang (kms)", note: "Angka.", example: "16", format: "number" },
  { key: "tower_count", header: "Jumlah Tower", note: "Bilangan bulat.", example: "50", format: "number" },
  { key: "scope", header: "Lingkup Pekerjaan", note: "Teks.", example: "Pondasi, erection, stringing", width: 28 },
  { key: "info_date", header: "Tanggal Informasi", note: "Tanggal.", example: "2025-06-01", format: "date" },
  { key: "bid_deadline", header: "Batas Penawaran", note: "Tanggal.", example: "2025-07-01", format: "date" },
  { key: "bid_value", header: "Nilai Penawaran", note: "Rupiah (penawaran terakhir).", example: "7500000000", format: "rupiah" },
  { key: "estimated_cost", header: "Estimasi Biaya", note: "Rupiah (HPP).", example: "6600000000", format: "rupiah" },
  { key: "win_probability", header: "Peluang Menang (%)", note: "0–100.", example: "35", format: "number" },
  {
    key: "status",
    header: "Status",
    required: true,
    note: Object.values(TENDER_STATUS_LABELS).join(", ") + ".",
    example: "Kalah",
    options: Object.values(TENDER_STATUS_LABELS),
  },
  { key: "closed_date", header: "Tanggal Penutupan", note: "Wajib untuk Menang, Kalah dan Batal; paling lambat hari ini.", example: "2025-08-15", format: "date" },
  { key: "lost_reason", header: "Alasan Kalah", note: "Wajib untuk Kalah: " + Object.values(LOST_REASON_LABELS).join(", ") + ".", example: "Harga", options: Object.values(LOST_REASON_LABELS) },
  { key: "winner_name", header: "Pemenang", note: "Opsional, untuk Kalah.", example: "PT Kompetitor Jaya", width: 22 },
  { key: "winner_price", header: "Harga Pemenang", note: "Opsional, untuk Kalah.", example: "7100000000", format: "rupiah" },
  { key: "notes", header: "Catatan", note: "Teks.", example: "", width: 24 },
];

/** Riwayat tender (MKT-03, MKT-04; PRD §16: minimal 2 tahun terakhir). */
export const tendersTemplate: ImportTemplate<TenderImport> = {
  key: "tenders",
  title: "Riwayat Tender",
  description: "Tender beserta status dan hasilnya. Dasar win rate awal (minimal 2 tahun terakhir).",
  roles: ["marketing"],
  fileBase: "templat-riwayat-tender",
  columns: COLUMNS,

  async references(ctx) {
    const { data } = await ctx.supabase.from("clients").select("name").eq("is_active", true).order("name");
    return [{ title: "Klien", values: (data ?? []).map((row) => row.name) }];
  },

  async prepare(rows, ctx) {
    const [{ data: clients }, { data: existing }] = await Promise.all([
      ctx.supabase.from("clients").select("id, name"),
      ctx.supabase.from("tenders").select("name, client_id"),
    ]);
    const clientIds = new Map((clients ?? []).map((row) => [normalizeName(row.name), row.id]));
    const seen = new Set((existing ?? []).map((row) => `${row.client_id}|${normalizeName(row.name)}`));

    const valid: Prepared<TenderImport>[] = [];
    const errors: RowError[] = [];

    for (const row of rows) {
      const reader = new RowReader(row, COLUMNS);
      const tender = tenderSchema.safeParse({
        name: reader.text("name"),
        client_id: reader.lookup("client_id", clientIds, "Klien"),
        end_owner: reader.text("end_owner"),
        location: reader.text("location"),
        voltage_kv: reader.number("voltage_kv"),
        length_kms: reader.number("length_kms"),
        tower_count: reader.number("tower_count"),
        scope: reader.text("scope"),
        info_date: reader.date("info_date"),
        bid_deadline: reader.date("bid_deadline"),
        bid_value: reader.number("bid_value"),
        estimated_cost: reader.number("estimated_cost"),
        pic_id: null,
        win_probability: reader.number("win_probability"),
        notes: reader.text("notes"),
      });
      if (!tender.success) reader.zod(tender.error);

      const status = tenderStatusSchema.safeParse({
        status: reader.choice("status", TENDER_STATUS_LABELS),
        closed_date: reader.date("closed_date"),
        lost_reason: reader.choice("lost_reason", LOST_REASON_LABELS),
        lost_note: null,
        winner_name: reader.text("winner_name"),
        winner_price: reader.number("winner_price"),
      });
      if (!status.success) reader.zod(status.error);

      if (status.success) {
        const closed = CLOSED_STATUSES.includes(status.data.status);
        if (closed && !status.data.closed_date) {
          reader.fail("closed_date", "Tanggal penutupan wajib diisi untuk status Menang, Kalah dan Batal.");
        }
        if (status.data.closed_date && status.data.closed_date > ctx.today) {
          reader.fail("closed_date", "Tanggal penutupan tidak boleh melewati hari ini.");
        }
        if (!closed) status.data.closed_date = null;
        if (status.data.status !== "lost") {
          status.data.lost_reason = null;
          status.data.winner_name = null;
          status.data.winner_price = null;
        }
      }

      if (tender.success) {
        const key = `${tender.data.client_id}|${normalizeName(tender.data.name)}`;
        if (seen.has(key)) reader.fail("name", "Tender dengan nama ini sudah ada untuk klien tersebut.");
      }

      if (reader.errors.length || !tender.success || !status.success) {
        errors.push(...reader.errors);
        continue;
      }
      seen.add(`${tender.data.client_id}|${normalizeName(tender.data.name)}`);
      valid.push({ row: row.row, value: { ...tender.data, ...status.data } });
    }

    return { valid, errors };
  },

  async insert(valid, ctx) {
    const { inserted, errors } = await insertPrepared(valid, (values) =>
      ctx.supabase.from("tenders").insert(values).select("id"),
    );
    return { inserted: inserted.length, errors };
  },
};

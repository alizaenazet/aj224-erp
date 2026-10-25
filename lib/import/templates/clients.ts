import "server-only";

import { CLIENT_KIND_LABELS } from "@/lib/clients/labels";
import { clientSchema, contactSchema, type ClientInput, type ContactInput } from "@/lib/clients/schema";
import { RowReader, normalizeName } from "@/lib/import/cells";
import { insertPrepared } from "@/lib/import/insert";
import type { ImportColumn, ImportTemplate, Prepared, RowError } from "@/lib/import/types";

type ClientImport = { client: ClientInput; contact: ContactInput | null };

const COLUMNS: ImportColumn[] = [
  { key: "name", header: "Nama Perusahaan", required: true, note: "Unik.", example: "PT Mitra Transmisi Nusantara", width: 34 },
  { key: "kind", header: "Jenis", required: true, note: "Kontraktor EPC, BUMN, PLN atau Swasta.", example: "Kontraktor EPC", options: Object.values(CLIENT_KIND_LABELS) },
  { key: "address", header: "Alamat", note: "Teks.", example: "Jl. TB Simatupang 18, Jakarta", width: 30 },
  { key: "npwp", header: "NPWP", note: "Tulis sebagai teks.", example: "02.111.222.3-444.000", width: 22 },
  { key: "payment_term_days", header: "Termin Pembayaran (hari)", note: "0–365; kosong = 30.", example: "45", format: "number" },
  { key: "notes", header: "Catatan", note: "Teks.", example: "", width: 24 },
  { key: "contact_name", header: "Nama Kontak", note: "Opsional; satu kontak per baris.", example: "Ir. Hendra Wijaya", width: 22 },
  { key: "contact_position", header: "Jabatan Kontak", note: "Teks.", example: "Manajer Pengadaan", width: 20 },
  { key: "contact_phone", header: "No. HP Kontak", note: "Angka, spasi, + atau -.", example: "0811-3300-9988", width: 16 },
  { key: "contact_email", header: "Email Kontak", note: "Alamat email.", example: "hendra@contoh.co.id", width: 24 },
];

/** Klien dengan satu kontak (MKT-01; PRD §16). */
export const clientsTemplate: ImportTemplate<ClientImport> = {
  key: "clients",
  title: "Klien",
  description: "Perusahaan klien, dengan satu kontak opsional per baris.",
  roles: ["super_admin", "marketing"],
  fileBase: "templat-klien",
  columns: COLUMNS,

  async prepare(rows, ctx) {
    const { data: existing } = await ctx.supabase.from("clients").select("name");
    const names = new Set((existing ?? []).map((row) => normalizeName(row.name)));

    const valid: Prepared<ClientImport>[] = [];
    const errors: RowError[] = [];

    for (const row of rows) {
      const reader = new RowReader(row, COLUMNS);
      const term = reader.number("payment_term_days");
      const parsed = clientSchema.safeParse({
        name: reader.text("name"),
        kind: reader.choice("kind", CLIENT_KIND_LABELS),
        address: reader.text("address"),
        npwp: reader.text("npwp"),
        payment_term_days: term ?? 30,
        notes: reader.text("notes"),
        is_active: true,
      });
      if (!parsed.success) reader.zod(parsed.error);
      if (parsed.success && names.has(normalizeName(parsed.data.name))) reader.fail("name", "Klien dengan nama ini sudah ada.");

      let contact: ContactInput | null = null;
      if (reader.text("contact_name") || reader.text("contact_phone") || reader.text("contact_email")) {
        const contactParsed = contactSchema.safeParse({
          name: reader.text("contact_name"),
          position: reader.text("contact_position"),
          phone: reader.text("contact_phone"),
          email: reader.text("contact_email"),
          notes: null,
        });
        if (contactParsed.success) contact = contactParsed.data;
        else {
          for (const issue of contactParsed.error.issues) {
            const field = String(issue.path[0] ?? "");
            reader.fail(field ? `contact_${field}` : undefined, issue.message);
          }
        }
      }

      if (reader.errors.length || !parsed.success) {
        errors.push(...reader.errors);
        continue;
      }
      names.add(normalizeName(parsed.data.name));
      valid.push({ row: row.row, value: { client: parsed.data, contact } });
    }

    return { valid, errors };
  },

  async insert(valid, ctx) {
    const { inserted, errors } = await insertPrepared(valid, (values) =>
      ctx.supabase
        .from("clients")
        .insert(values.map((value) => value.client))
        .select("id"),
    );

    const contacts = inserted.filter((item) => item.value.contact);
    if (contacts.length) {
      const result = await insertPrepared(
        contacts.map((item) => ({ row: item.row, value: { ...item.value.contact!, client_id: item.result.id } })),
        (values) => ctx.supabase.from("client_contacts").insert(values).select("id"),
      );
      errors.push(
        ...result.errors.map((error) => ({ ...error, message: `Klien tersimpan, kontak gagal: ${error.message}` })),
      );
    }

    return { inserted: inserted.length, errors };
  },
};

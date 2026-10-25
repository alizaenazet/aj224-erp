import type { AppRole } from "@/lib/auth/roles";

// Config for the simple master-data lists (MST-03 … MST-09). Each entry
// drives the list, the form, the server action and the export.

export type FieldType =
  | "text"
  | "email"
  | "textarea"
  | "number"
  | "select"
  | "switch"
  | "certificates";

export type FieldOption = { value: string; label: string };

export type MasterField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: { regex: RegExp; message: string };
  transform?: "upper" | "lower";
  options?: readonly FieldOption[];
  placeholder?: string;
  description?: string;
  defaultValue?: string | number | boolean | null;
  /** False: set on create only (e.g. a code used as key). */
  editable?: boolean;
  /** Shown as a list column and export column. */
  list?: boolean;
  /** List / export display; defaults to the raw value. */
  format?: (value: unknown, row: Record<string, unknown>) => string;
};

export type MasterEntity = {
  key: string;
  table: string;
  idColumn: "id" | "code";
  title: string;
  singular: string;
  description: string;
  viewRoles: readonly AppRole[];
  manageRoles: readonly AppRole[];
  select: string;
  fields: MasterField[];
  searchColumns: string[];
  searchPlaceholder?: string;
  orderBy: { column: string; ascending: boolean }[];
  filter?: { param: string; column: string; allLabel: string; options: readonly FieldOption[] };
  /** Values forced on insert (e.g. users only create warehouses). */
  insertValues?: Record<string, unknown>;
  /** Rows the user may not edit or delete (e.g. project locations). */
  readOnlyRow?: (row: Record<string, unknown>) => boolean;
  exportFileBase: string;
};

export const SUPPLIER_CATEGORIES: readonly FieldOption[] = [
  { value: "material", label: "Material" },
  { value: "equipment_rental", label: "Sewa Alat" },
  { value: "transport", label: "Transportasi" },
  { value: "accommodation", label: "Akomodasi" },
  { value: "catering", label: "Katering" },
  { value: "other", label: "Lainnya" },
];

export const LOCATION_TYPES: readonly FieldOption[] = [
  { value: "warehouse", label: "Gudang" },
  { value: "project", label: "Proyek" },
];

export const ITEM_KINDS: readonly FieldOption[] = [
  { value: "tool", label: "Alat" },
  { value: "material", label: "Material" },
];

export function optionLabel(options: readonly FieldOption[], value: unknown) {
  return options.find((option) => option.value === value)?.label ?? String(value ?? "—");
}

const text = (value: unknown) => (value === null || value === undefined || value === "" ? "—" : String(value));

export const MASTER_ENTITIES: Record<string, MasterEntity> = {
  suppliers: {
    key: "suppliers",
    table: "suppliers",
    idColumn: "id",
    title: "Supplier",
    singular: "Supplier",
    description: "Pemasok material, penyewaan alat, transportasi, akomodasi dan lainnya.",
    viewRoles: ["super_admin", "director", "finance", "operations"],
    manageRoles: ["super_admin", "finance"],
    select:
      "id, name, category, contact_name, phone, email, address, npwp, bank_name, bank_account_number, bank_account_holder, payment_term_days, notes, is_active",
    searchColumns: ["name", "contact_name", "phone", "email"],
    searchPlaceholder: "Cari nama, kontak, telepon",
    orderBy: [{ column: "name", ascending: true }],
    filter: { param: "category", column: "category", allLabel: "Semua kategori", options: SUPPLIER_CATEGORIES },
    exportFileBase: "supplier",
    fields: [
      { name: "name", label: "Nama", type: "text", required: true, maxLength: 120, list: true },
      {
        name: "category",
        label: "Kategori",
        type: "select",
        required: true,
        options: SUPPLIER_CATEGORIES,
        list: true,
        format: (value) => optionLabel(SUPPLIER_CATEGORIES, value),
      },
      { name: "contact_name", label: "Kontak", type: "text", maxLength: 100, list: true, format: text },
      { name: "phone", label: "Telepon", type: "text", maxLength: 30, list: true, format: text },
      { name: "email", label: "Email", type: "email", maxLength: 120 },
      { name: "address", label: "Alamat", type: "textarea", maxLength: 300 },
      { name: "npwp", label: "NPWP", type: "text", maxLength: 30 },
      { name: "bank_name", label: "Bank", type: "text", maxLength: 60 },
      { name: "bank_account_number", label: "No. rekening", type: "text", maxLength: 40 },
      { name: "bank_account_holder", label: "Atas nama", type: "text", maxLength: 100 },
      {
        name: "payment_term_days",
        label: "Termin pembayaran (hari)",
        type: "number",
        required: true,
        min: 0,
        max: 365,
        defaultValue: 30,
        list: true,
        format: (value) => `${value} hari`,
      },
      { name: "notes", label: "Catatan", type: "textarea", maxLength: 500 },
    ],
  },

  locations: {
    key: "locations",
    table: "locations",
    idColumn: "id",
    title: "Lokasi",
    singular: "Gudang",
    description: "Gudang perusahaan dan lokasi proyek (dibuat otomatis bersama proyek).",
    viewRoles: ["super_admin", "director", "operations"],
    manageRoles: ["super_admin", "operations"],
    select: "id, code, name, type, address, is_active",
    searchColumns: ["code", "name"],
    searchPlaceholder: "Cari kode atau nama",
    orderBy: [
      { column: "type", ascending: false },
      { column: "code", ascending: true },
    ],
    filter: { param: "type", column: "type", allLabel: "Semua jenis", options: LOCATION_TYPES },
    insertValues: { type: "warehouse" },
    readOnlyRow: (row) => row.type === "project",
    exportFileBase: "lokasi",
    fields: [
      {
        name: "code",
        label: "Kode",
        type: "text",
        required: true,
        maxLength: 20,
        transform: "upper",
        pattern: { regex: /^[A-Z0-9][A-Z0-9-]{1,19}$/, message: "Kode hanya huruf besar, angka dan tanda hubung (mis. GDG-TBN)." },
        placeholder: "GDG-TBN",
        list: true,
      },
      { name: "name", label: "Nama", type: "text", required: true, maxLength: 120, list: true },
      {
        name: "type",
        label: "Jenis",
        type: "select",
        options: LOCATION_TYPES,
        editable: false,
        list: true,
        format: (value) => optionLabel(LOCATION_TYPES, value),
      },
      { name: "address", label: "Alamat", type: "textarea", maxLength: 300, list: true, format: text },
    ],
  },

  "cost-categories": {
    key: "cost-categories",
    table: "cost_categories",
    idColumn: "id",
    title: "Kategori Biaya",
    singular: "Kategori Biaya",
    description: "Setiap biaya, RAB dan alokasi gaji memakai salah satu kategori ini.",
    viewRoles: ["super_admin", "director", "finance"],
    manageRoles: ["super_admin", "finance"],
    select: "id, code, name, is_overhead, sort_order, is_active",
    searchColumns: ["code", "name"],
    searchPlaceholder: "Cari kode atau nama",
    orderBy: [
      { column: "sort_order", ascending: true },
      { column: "name", ascending: true },
    ],
    exportFileBase: "kategori-biaya",
    fields: [
      {
        name: "code",
        label: "Kode",
        type: "text",
        required: true,
        maxLength: 20,
        transform: "upper",
        pattern: { regex: /^[A-Z0-9_]{2,20}$/, message: "Kode 2–20 huruf besar, angka atau garis bawah." },
        list: true,
      },
      { name: "name", label: "Nama", type: "text", required: true, maxLength: 80, list: true },
      {
        name: "is_overhead",
        label: "Overhead Kantor",
        type: "switch",
        defaultValue: false,
        description: "Biaya kantor yang tidak masuk L/R proyek.",
        list: true,
        format: (value) => (value ? "Ya" : "—"),
      },
      { name: "sort_order", label: "Urutan", type: "number", min: 0, max: 9999, defaultValue: 100 },
    ],
  },

  positions: {
    key: "positions",
    table: "positions",
    idColumn: "id",
    title: "Jabatan",
    singular: "Jabatan",
    description: "Jabatan karyawan beserta sertifikat wajib untuk penugasan.",
    viewRoles: ["super_admin", "director", "hcm"],
    manageRoles: ["super_admin", "hcm"],
    select: "id, name, sort_order, is_active, position_required_certificates(certificate_type_id, certificate_types(name))",
    searchColumns: ["name"],
    searchPlaceholder: "Cari jabatan",
    orderBy: [
      { column: "sort_order", ascending: true },
      { column: "name", ascending: true },
    ],
    exportFileBase: "jabatan",
    fields: [
      { name: "name", label: "Nama jabatan", type: "text", required: true, maxLength: 80, list: true },
      {
        name: "required_certificates",
        label: "Sertifikat wajib",
        type: "certificates",
        list: true,
        format: (_value, row) => {
          const links = (row.position_required_certificates ?? []) as {
            certificate_types: { name: string } | null;
          }[];
          const names = links.map((link) => link.certificate_types?.name).filter(Boolean);
          return names.length > 0 ? names.join(", ") : "Tidak ada";
        },
      },
      { name: "sort_order", label: "Urutan", type: "number", min: 0, max: 9999, defaultValue: 100 },
    ],
  },

  "certificate-types": {
    key: "certificate-types",
    table: "certificate_types",
    idColumn: "id",
    title: "Jenis Sertifikat",
    singular: "Jenis Sertifikat",
    description: "Jenis sertifikat dan masa berlaku default (kosong = seumur hidup).",
    viewRoles: ["super_admin", "director", "hcm"],
    manageRoles: ["super_admin", "hcm"],
    select: "id, name, validity_months, description, is_active",
    searchColumns: ["name"],
    searchPlaceholder: "Cari jenis sertifikat",
    orderBy: [{ column: "name", ascending: true }],
    exportFileBase: "jenis-sertifikat",
    fields: [
      { name: "name", label: "Nama", type: "text", required: true, maxLength: 80, list: true },
      {
        name: "validity_months",
        label: "Masa berlaku (bulan)",
        type: "number",
        min: 1,
        max: 600,
        description: "Kosongkan bila berlaku seumur hidup.",
        list: true,
        format: (value) =>
          value === null || value === undefined ? "Seumur hidup" : `${value} bulan`,
      },
      { name: "description", label: "Keterangan", type: "textarea", maxLength: 300, list: true, format: text },
    ],
  },

  "item-categories": {
    key: "item-categories",
    table: "item_categories",
    idColumn: "id",
    title: "Kategori Alat & Material",
    singular: "Kategori",
    description: "Pengelompokan alat dan material.",
    viewRoles: ["super_admin", "director", "operations"],
    manageRoles: ["super_admin", "operations"],
    select: "id, kind, name, is_active",
    searchColumns: ["name"],
    searchPlaceholder: "Cari kategori",
    orderBy: [
      { column: "kind", ascending: false },
      { column: "name", ascending: true },
    ],
    filter: { param: "kind", column: "kind", allLabel: "Alat & material", options: ITEM_KINDS },
    exportFileBase: "kategori-alat-material",
    fields: [
      {
        name: "kind",
        label: "Jenis",
        type: "select",
        required: true,
        options: ITEM_KINDS,
        list: true,
        format: (value) => optionLabel(ITEM_KINDS, value),
      },
      { name: "name", label: "Nama", type: "text", required: true, maxLength: 80, list: true },
    ],
  },

  units: {
    key: "units",
    table: "units",
    idColumn: "code",
    title: "Satuan",
    singular: "Satuan",
    description: "Satuan jumlah untuk stok material dan alat.",
    viewRoles: ["super_admin", "director", "operations"],
    manageRoles: ["super_admin", "operations"],
    select: "code, name, is_active",
    searchColumns: ["code", "name"],
    searchPlaceholder: "Cari satuan",
    orderBy: [{ column: "code", ascending: true }],
    exportFileBase: "satuan",
    fields: [
      {
        name: "code",
        label: "Kode",
        type: "text",
        required: true,
        maxLength: 10,
        transform: "lower",
        pattern: { regex: /^[a-z0-9]{1,10}$/, message: "Kode 1–10 huruf kecil atau angka (mis. roll)." },
        editable: false,
        list: true,
      },
      { name: "name", label: "Nama", type: "text", required: true, maxLength: 40, list: true },
    ],
  },
};

/** Tabs under Master Data in display order; `stages` has its own editor. */
export const MASTER_TABS: { key: string; title: string; viewRoles: readonly AppRole[] }[] = [
  ...["suppliers", "locations", "cost-categories", "positions", "certificate-types"].map((key) => ({
    key,
    title: MASTER_ENTITIES[key].title,
    viewRoles: MASTER_ENTITIES[key].viewRoles,
  })),
  { key: "stages", title: "Tahapan Stringing", viewRoles: ["super_admin", "director", "operations"] },
  ...["item-categories", "units"].map((key) => ({
    key,
    title: MASTER_ENTITIES[key].title,
    viewRoles: MASTER_ENTITIES[key].viewRoles,
  })),
];

export const STAGE_MANAGE_ROLES: readonly AppRole[] = ["super_admin", "operations"];

export function getMasterEntity(key: string) {
  return Object.hasOwn(MASTER_ENTITIES, key) ? MASTER_ENTITIES[key] : null;
}

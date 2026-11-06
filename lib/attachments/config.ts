// Attachment rules (UMM-03), shared by client and server. Each module that
// attaches files adds its entity type here and, in SQL, one row in
// attachment_entity_types plus attachment_read_<type> / attachment_write_<type>
// functions (see 20261106210000_attachment_rules.sql).

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 1024 * 1024;

/** Allowed MIME types with the label shown to users. */
export const ALLOWED_FILE_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
};

const EXTENSION_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export const FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.xlsx";
export const PHOTO_ACCEPT = ".jpg,.jpeg,.png";
export const SCAN_ACCEPT = ".pdf,.jpg,.jpeg,.png";

export const ATTACHMENT_ENTITIES = {
  employee: {
    bucket: "employee-files",
    /** Page to refresh after a change (a route pattern revalidates every match). */
    path: (id: string) => `/hr/employees/${id}`,
    categories: {
      photo: "Foto",
      ktp: "KTP",
      kk: "KK",
      contract: "Kontrak kerja",
      diploma: "Ijazah",
      other: "Lainnya",
    } as Record<string, string>,
    /** Categories that keep only the newest file. */
    single: ["photo"],
  },
  employee_certificate: {
    bucket: "employee-files",
    // The certificate id does not name its employee page: refresh them all.
    path: () => "/hr/employees/[id]",
    categories: { scan: "Scan sertifikat" } as Record<string, string>,
    single: ["scan"],
  },
  project: {
    bucket: "project-files",
    path: (id: string) => `/projects/${id}/documents`,
    categories: {
      contract: "Kontrak",
      addendum: "Addendum",
      bap: "BAP",
      bast: "BAST",
      drawing: "Gambar",
      permit: "Izin",
      correspondence: "Korespondensi",
      other: "Lainnya",
    } as Record<string, string>,
    single: [] as string[],
  },
  attendance_day: {
    bucket: "project-files",
    // Sheet photos show on the field and SDM attendance pages.
    path: () => "/hr/attendance",
    categories: { sheet: "Lembar absensi" } as Record<string, string>,
    single: [] as string[],
  },
  daily_report: {
    bucket: "project-files",
    path: (id: string) => `/operations/daily-reports/${id}`,
    categories: { photo: "Foto kegiatan" } as Record<string, string>,
    single: [] as string[],
  },
  tool: {
    bucket: "project-files",
    path: (id: string) => `/operations/tools/${id}`,
    categories: { photo: "Foto alat", condition: "Foto kondisi" } as Record<string, string>,
    single: ["photo"],
  },
  delivery_note: {
    bucket: "project-files",
    path: (id: string) => `/operations/delivery-notes/${id}`,
    categories: { receipt: "Foto penerimaan/selisih" } as Record<string, string>,
    single: [] as string[],
  },
  material_transaction: {
    bucket: "project-files",
    path: (id: string) => `/operations/material-transactions/${id}`,
    categories: { document: "Foto dokumen" } as Record<string, string>,
    single: [] as string[],
  },
  incident: {
    bucket: "k3-files",
    path: (id: string) => `/operations/incidents/${id}`,
    categories: { photo: "Foto kejadian" } as Record<string, string>,
    single: [] as string[],
  },
  incident_action: {
    bucket: "k3-files",
    path: () => "/operations/incidents/[id]",
    categories: { evidence: "Bukti tindakan" } as Record<string, string>,
    single: [] as string[],
  },
  invoice: {
    bucket: "finance-files",
    path: (id: string) => `/finance/invoices/${id}`,
    categories: { bap: "BAP", other: "Lainnya" } as Record<string, string>,
    single: [] as string[],
  },
  invoice_payment: {
    bucket: "finance-files",
    path: () => "/finance/invoices/[id]",
    categories: { proof: "Bukti transfer" } as Record<string, string>,
    single: [] as string[],
  },
  supplier_bill: {
    bucket: "finance-files",
    path: (id: string) => `/finance/bills/${id}`,
    categories: { invoice: "Nota/faktur", other: "Lainnya" } as Record<string, string>,
    single: [] as string[],
  },
  supplier_payment: {
    bucket: "finance-files",
    path: () => "/finance/bills/[id]",
    categories: { proof: "Bukti bayar" } as Record<string, string>,
    single: [] as string[],
  },
  expense: {
    bucket: "finance-files",
    path: (id: string) => `/finance/expenses/${id}`,
    categories: { receipt: "Foto nota/bukti" } as Record<string, string>,
    single: [] as string[],
  },
  field_cash_expense: {
    bucket: "finance-files",
    path: (id: string) => `/finance/field-cash/expenses/${id}`,
    categories: { receipt: "Foto nota" } as Record<string, string>,
    single: [] as string[],
  },
  field_cash_movement: {
    bucket: "finance-files",
    path: () => "/finance/field-cash/[projectId]",
    categories: { proof: "Bukti transfer" } as Record<string, string>,
    single: [] as string[],
  },
  tender: {
    bucket: "marketing-files",
    path: (id: string) => `/marketing/tenders/${id}`,
    categories: {
      rks: "RKS",
      boq: "BoQ",
      offer_letter: "Surat penawaran",
      other: "Lainnya",
    } as Record<string, string>,
    single: [] as string[],
  },
} as const;

export type AttachmentEntityType = keyof typeof ATTACHMENT_ENTITIES;

export type AttachmentRow = {
  id: string;
  category: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

/** The file's MIME type, from the browser or the extension; null if not allowed. */
export function fileMimeType(file: { name: string; type: string }) {
  if (file.type && ALLOWED_FILE_TYPES[file.type]) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[extension] ?? null;
}

export function isImageType(mimeType: string) {
  return mimeType === "image/jpeg" || mimeType === "image/png";
}

/** Error message for a file that may not be attached, or null. */
export function validateFile(file: { name: string; type: string; size: number }) {
  const mimeType = fileMimeType(file);
  if (!mimeType) {
    return `Jenis berkas tidak didukung. Gunakan ${Object.values(ALLOWED_FILE_TYPES).join(", ")}.`;
  }
  if (file.size > MAX_FILE_BYTES) return "Ukuran berkas maksimal 10 MB.";
  if (file.size === 0) return "Berkas kosong.";
  return null;
}

/** "820 KB", "1,4 MB" */
export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

export function fileExtension(mimeType: string) {
  return (
    Object.entries(EXTENSION_TYPES).find(([extension, type]) => type === mimeType && extension !== "jpeg")?.[0] ??
    "bin"
  );
}

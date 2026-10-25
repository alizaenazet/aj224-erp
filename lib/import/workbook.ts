import "server-only";

import ExcelJS from "exceljs";
import type { ImportContext, ImportTemplate } from "@/lib/import/types";

const DATA_ROWS = 2000;

const NUM_FMT = {
  date: "yyyy-mm-dd",
  number: "#,##0.##",
  rupiah: "#,##0",
} as const;

// Range validations exist at runtime but are missing from the exceljs types.
type RangeValidations = { dataValidations: { add(range: string, validation: ExcelJS.DataValidation): void } };

function columnLetter(index: number) {
  let letter = "";
  let n = index + 1;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

/** Template .xlsx: Data sheet (titles, drop-downs, formats) + Petunjuk sheet. */
export async function buildTemplateWorkbook(template: ImportTemplate, ctx: ImportContext) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AJ224 ERP";
  workbook.created = new Date();

  const data = workbook.addWorksheet("Data", { views: [{ state: "frozen", ySplit: 1 }] });
  data.columns = template.columns.map((column) => {
    const header = column.required ? `${column.header} *` : column.header;
    return {
      header,
      width: column.width ?? Math.max(14, header.length + 4),
      style: column.format ? { numFmt: NUM_FMT[column.format] } : { numFmt: "@" },
    };
  });
  data.getRow(1).font = { bold: true };

  template.columns.forEach((column, index) => {
    if (!column.options?.length) return;
    const letter = columnLetter(index);
    (data as unknown as RangeValidations).dataValidations.add(`${letter}2:${letter}${DATA_ROWS + 1}`, {
      type: "list",
      allowBlank: true,
      formulae: [`"${column.options.join(",")}"`],
      showErrorMessage: true,
      errorTitle: column.header,
      error: `Pilih salah satu: ${column.options.join(", ")}`,
    });
  });

  const guide = workbook.addWorksheet("Petunjuk");
  guide.columns = [{ width: 28 }, { width: 10 }, { width: 70 }, { width: 34 }];
  const lines = [
    `Templat impor: ${template.title}`,
    template.description,
    "Isi data mulai baris 2 di sheet Data. Jangan ubah judul kolom; kolom bertanda * wajib diisi.",
    "Tanggal: yyyy-mm-dd atau dd/mm/yyyy. Angka boleh memakai titik ribuan (150.000) atau koma desimal (12,5).",
    `Maksimal ${DATA_ROWS.toLocaleString("id-ID")} baris per berkas. Data yang sudah ada tidak ditimpa; barisnya dilaporkan gagal.`,
    "Gunakan Periksa terlebih dahulu untuk melihat baris yang gagal beserta alasannya.",
  ];
  lines.forEach((line, index) => {
    const row = guide.addRow([line]);
    if (index === 0) row.font = { bold: true, size: 13 };
  });
  guide.addRow([]);
  const header = guide.addRow(["Kolom", "Wajib", "Keterangan", "Contoh"]);
  header.font = { bold: true };
  for (const column of template.columns) {
    guide.addRow([column.header, column.required ? "Ya" : "", column.note, column.example ?? ""]);
  }

  for (const reference of (await template.references?.(ctx)) ?? []) {
    guide.addRow([]);
    guide.addRow([`Daftar ${reference.title} yang berlaku`]).font = { bold: true };
    for (const value of reference.values) guide.addRow([value]);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

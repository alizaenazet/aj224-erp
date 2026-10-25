import "server-only";

import ExcelJS from "exceljs";
import { normalizeHeader } from "@/lib/import/cells";
import type { CellValue, ImportColumn, ImportRow } from "@/lib/import/types";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 2000;

export class ImportFileError extends Error {}

/** exceljs cell value → plain value (rich text, links and formulas unwrapped). */
function plain(value: ExcelJS.CellValue): CellValue {
  if (value === null || value === undefined) return null;
  if (value instanceof Date || typeof value === "number" || typeof value === "boolean" || typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("result" in value) return plain(value.result as ExcelJS.CellValue);
    if ("text" in value) return String(value.text);
    if ("error" in value) return null;
  }
  return String(value);
}

async function readXlsx(buffer: ArrayBuffer): Promise<CellValue[][]> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new ImportFileError("Berkas Excel tidak dapat dibaca. Simpan ulang sebagai .xlsx.");
  }
  const sheet = workbook.getWorksheet("Data") ?? workbook.worksheets[0];
  if (!sheet) throw new ImportFileError("Berkas tidak berisi sheet.");

  const rows: CellValue[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const values: CellValue[] = [];
    row.eachCell({ includeEmpty: true }, (cell, column) => {
      values[column - 1] = plain(cell.value);
    });
    rows[rowNumber - 1] = values;
  });
  return Array.from(rows, (row) => row ?? []);
}

/** RFC 4180 CSV with ";" or "," (detected from the header line). */
function readCsv(text: string): CellValue[][] {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: CellValue[][] = [];
  let row: CellValue[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function isBlank(row: CellValue[]) {
  return row.every((value) => value === null || value === undefined || String(value).trim() === "");
}

/**
 * Reads an uploaded .xlsx/.csv and maps its columns to the template by
 * title. Throws ImportFileError for problems with the whole file.
 */
export async function readImportFile(file: File, columns: ImportColumn[]): Promise<ImportRow[]> {
  const name = file.name.toLowerCase();
  if (file.size > MAX_IMPORT_BYTES) throw new ImportFileError("Ukuran berkas maksimal 5 MB.");
  if (!name.endsWith(".xlsx") && !name.endsWith(".csv")) {
    throw new ImportFileError("Gunakan berkas .xlsx atau .csv dari templat.");
  }

  const table = name.endsWith(".csv") ? readCsv(await file.text()) : await readXlsx(await file.arrayBuffer());
  const [header = [], ...body] = table;

  const keyByHeader = new Map(columns.map((column) => [normalizeHeader(column.header), column.key]));
  const columnKeys = header.map((title) => keyByHeader.get(normalizeHeader(String(title ?? ""))) ?? null);
  const missing = columns.filter((column) => column.required && !columnKeys.includes(column.key));
  if (missing.length) {
    throw new ImportFileError(`Kolom wajib tidak ditemukan: ${missing.map((column) => column.header).join(", ")}.`);
  }

  const rows: ImportRow[] = [];
  body.forEach((cells, index) => {
    if (isBlank(cells)) return;
    const values: Record<string, CellValue> = {};
    columnKeys.forEach((key, column) => {
      if (key) values[key] = cells[column] ?? null;
    });
    rows.push({ row: index + 2, values });
  });

  if (rows.length === 0) throw new ImportFileError("Tidak ada baris data. Isi mulai baris 2.");
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new ImportFileError(`Maksimal ${MAX_IMPORT_ROWS.toLocaleString("id-ID")} baris per berkas. Bagi berkas menjadi beberapa bagian.`);
  }
  return rows;
}

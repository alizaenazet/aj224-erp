import "server-only";

import ExcelJS from "exceljs";

export type ExportCellValue = string | number | boolean | Date | null | undefined;

export type ExportColumn<T> = {
  header: string;
  value: (row: T) => ExportCellValue;
  /** date: yyyy-mm-dd or timestamp; datetime: timestamp; both shown in WIB. */
  type?: "text" | "number" | "rupiah" | "date" | "datetime";
  width?: number;
};

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Excel stores dates without a time zone, so shift timestamps to WIB wall
 * time; date-only strings become midnight of that day.
 */
function toExcelDate(value: ExportCellValue, type: "date" | "datetime") {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  const wib = new Date(date.getTime() + WIB_OFFSET_MS);
  return type === "date"
    ? new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()))
    : wib;
}

const NUM_FMT: Record<string, string> = {
  rupiah: '"Rp" #,##0',
  number: "#,##0.##",
  date: "dd/mm/yyyy",
  datetime: "dd/mm/yyyy hh:mm",
};

/** Builds a one-sheet .xlsx: bold frozen header, auto-filter, typed cells. */
export async function buildWorkbook<T>({
  sheetName,
  columns,
  rows,
  truncated = false,
}: {
  sheetName: string;
  columns: ExportColumn<T>[];
  rows: T[];
  truncated?: boolean;
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AJ224 ERP";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = columns.map((column) => ({
    header: column.header,
    width: column.width ?? Math.max(12, column.header.length + 4),
    style: NUM_FMT[column.type ?? ""] ? { numFmt: NUM_FMT[column.type ?? ""] } : {},
  }));
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(
      columns.map((column) => {
        const value = column.value(row);
        if (column.type === "date" || column.type === "datetime") {
          return toExcelDate(value, column.type);
        }
        if ((column.type === "rupiah" || column.type === "number") && value !== null && value !== undefined && value !== "") {
          return Number(value);
        }
        return value ?? null;
      }),
    );
  }

  if (columns.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
  }

  if (truncated) {
    sheet.addRow([]);
    sheet.addRow([`Ekspor dibatasi ${rows.length.toLocaleString("id-ID")} baris pertama. Persempit filter untuk data lengkap.`]);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

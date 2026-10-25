import type { ZodError } from "zod";
import type { CellValue, ImportColumn, ImportRow, RowError } from "@/lib/import/types";

// Converts spreadsheet cells to form values and collects per-row errors.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DMY_DATE = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function validDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Reads one row; every conversion problem becomes a RowError for its column. */
export class RowReader {
  readonly errors: RowError[] = [];
  private readonly headers: Map<string, string>;

  constructor(
    private readonly row: ImportRow,
    columns: ImportColumn[],
  ) {
    this.headers = new Map(columns.map((column) => [column.key, column.header]));
  }

  header(key: string) {
    return this.headers.get(key) ?? key;
  }

  fail(key: string | undefined, message: string) {
    this.errors.push({ row: this.row.row, column: key ? this.header(key) : undefined, message });
  }

  raw(key: string): CellValue {
    return this.row.values[key] ?? null;
  }

  /** Trimmed text or null. */
  text(key: string): string | null {
    const value = this.raw(key);
    if (value === null) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const text = String(value).trim();
    return text === "" ? null : text;
  }

  /** yyyy-mm-dd from a date cell, "yyyy-mm-dd" or "dd/mm/yyyy"; null when empty. */
  date(key: string): string | null {
    const value = this.raw(key);
    if (value === null || value === "") return null;
    if (value instanceof Date) {
      return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
    }
    const text = String(value).trim();
    const iso = text.match(ISO_DATE);
    if (iso && validDate(+iso[1], +iso[2], +iso[3])) return text;
    const dmy = text.match(DMY_DATE);
    if (dmy && validDate(+dmy[3], +dmy[2], +dmy[1])) return `${dmy[3]}-${pad(+dmy[2])}-${pad(+dmy[1])}`;
    this.fail(key, "Format tanggal tidak dikenali (gunakan yyyy-mm-dd atau dd/mm/yyyy).");
    return null;
  }

  /** Number from a numeric cell or Indonesian text ("150.000", "12,5", "Rp 1.000"). */
  number(key: string): number | null {
    const value = this.raw(key);
    if (value === null || value === "") return null;
    if (typeof value === "number") return value;
    let text = String(value).replace(/rp/gi, "").replace(/\s/g, "");
    if (text === "") return null;
    if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, "");
    const number = Number(text);
    if (Number.isFinite(number) && /^-?\d+(\.\d+)?$/.test(text)) return number;
    this.fail(key, "Harus angka.");
    return null;
  }

  /** Code for a label (or code) of a choice list, case-insensitive. */
  choice<T extends string>(key: string, labels: Record<T, string>): T | null {
    const text = this.text(key);
    if (text === null) return null;
    const wanted = text.toLowerCase();
    for (const [code, label] of Object.entries(labels) as [T, string][]) {
      if (label.toLowerCase() === wanted || code.toLowerCase() === wanted) return code;
    }
    this.fail(key, `Pilihan tidak dikenal. Gunakan: ${Object.values(labels).join(", ")}.`);
    return null;
  }

  /** Id of a named reference (position, client, …); null with an error when unknown. */
  lookup(key: string, map: Map<string, string>, what: string): string | null {
    const text = this.text(key);
    if (text === null) return null;
    const id = map.get(normalizeName(text));
    if (!id) this.fail(key, `${what} "${text}" tidak ditemukan.`);
    return id ?? null;
  }

  /** Maps zod issues to their columns (issue path = column key). */
  zod(error: ZodError) {
    for (const issue of error.issues) {
      const key = typeof issue.path[0] === "string" ? issue.path[0] : undefined;
      // A column that already failed conversion is reported once.
      if (key && this.errors.some((existing) => existing.column === this.header(key))) continue;
      this.fail(key, issue.message);
    }
  }
}

/** Case- and space-insensitive key for names and numbers. */
export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Lower-cased header without the * marker. */
export function normalizeHeader(value: string) {
  return value.replace(/\*/g, "").trim().replace(/\s+/g, " ").toLowerCase();
}

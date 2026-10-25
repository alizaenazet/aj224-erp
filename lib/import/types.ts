import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/auth/roles";
import type { Database } from "@/lib/supabase/database.types";

// Import engine types (UMM-13). Templates live in lib/import/templates.

export type CellValue = string | number | boolean | Date | null;

export type ImportColumn = {
  /** Field name the value maps to (also used to map validation errors). */
  key: string;
  /** Column title in the template (without the * marker). */
  header: string;
  required?: boolean;
  /** Petunjuk text: format or allowed values. */
  note: string;
  example?: string;
  /** Short choice lists become a drop-down in the template. */
  options?: readonly string[];
  /** Cell format in the template. */
  format?: "date" | "number" | "rupiah";
  width?: number;
};

/** One data row with values by column key; `row` is the sheet row number. */
export type ImportRow = { row: number; values: Record<string, CellValue> };

export type RowError = { row: number; column?: string; message: string };

export type Prepared<T> = { row: number; value: T };

export type ImportContext = {
  supabase: SupabaseClient<Database>;
  profileId: string;
  /** Today in WIB (yyyy-mm-dd). */
  today: string;
};

export type ImportTemplate<T = unknown> = {
  key: string;
  title: string;
  description: string;
  /** Roles that may download and import (same as the data's manage roles). */
  roles: readonly AppRole[];
  fileBase: string;
  columns: ImportColumn[];
  /** Live reference lists for the Petunjuk sheet (positions, clients, …). */
  references?: (ctx: ImportContext) => Promise<{ title: string; values: string[] }[]>;
  /** Validates every row; nothing is written. */
  prepare: (rows: ImportRow[], ctx: ImportContext) => Promise<{ valid: Prepared<T>[]; errors: RowError[] }>;
  /** Writes valid rows under the user's session; failures are reported per row. */
  insert: (valid: Prepared<T>[], ctx: ImportContext) => Promise<{ inserted: number; errors: RowError[] }>;
};

export type ImportResult = {
  mode: "check" | "import";
  total: number;
  valid: number;
  imported: number;
  failed: number;
  errors: RowError[];
};

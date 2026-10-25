import "server-only";

import { readImportFile } from "@/lib/import/parse";
import type { ImportContext, ImportResult, ImportTemplate, RowError } from "@/lib/import/types";

const STORED_ERRORS = 200;

function byRow(a: RowError, b: RowError) {
  return a.row - b.row;
}

/**
 * Check (validate only) or import a file. Import saves the valid rows and
 * records the run in import_runs; file-level problems throw ImportFileError.
 */
export async function runImport({
  template,
  file,
  mode,
  ctx,
}: {
  template: ImportTemplate;
  file: File;
  mode: "check" | "import";
  ctx: ImportContext;
}): Promise<ImportResult> {
  const rows = await readImportFile(file, template.columns);
  const { valid, errors } = await template.prepare(rows, ctx);

  if (mode === "check") {
    return { mode, total: rows.length, valid: valid.length, imported: 0, failed: rows.length - valid.length, errors: errors.sort(byRow) };
  }

  const result = valid.length ? await template.insert(valid, ctx) : { inserted: 0, errors: [] };
  const allErrors = [...errors, ...result.errors].sort(byRow);
  const failed = rows.length - result.inserted;

  await ctx.supabase.from("import_runs").insert({
    template: template.key,
    file_name: file.name.slice(0, 200),
    total_rows: rows.length,
    imported_rows: result.inserted,
    failed_rows: failed,
    errors: allErrors.slice(0, STORED_ERRORS),
  });

  return { mode, total: rows.length, valid: valid.length, imported: result.inserted, failed, errors: allErrors };
}

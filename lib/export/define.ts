import type { AppRole } from "@/lib/auth/roles";
import type { ExportColumn } from "@/lib/export/xlsx";
import type { RawSearchParams } from "@/lib/list/params";

export type ExportDefinition<T> = {
  roles: readonly AppRole[];
  fileBase: string;
  sheetName: string;
  columns: ExportColumn<T>[];
  /**
   * Rows matching the list's URL params (same query as the page). An export
   * whose columns depend on the data (e.g. a project's stages) returns them here.
   */
  load: (params: RawSearchParams) => Promise<{ rows: T[]; count: number; columns?: ExportColumn<T>[] }>;
};

export function defineExport<T>(definition: ExportDefinition<T>) {
  return definition as ExportDefinition<unknown>;
}

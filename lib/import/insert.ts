import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { dbErrorMessage } from "@/lib/actions";
import type { Prepared, RowError } from "@/lib/import/types";

const CHUNK = 200;

type InsertBatch<V, R> = (values: V[]) => PromiseLike<{ data: R[] | null; error: PostgrestError | null }>;

/**
 * Inserts prepared rows in chunks; a failing chunk is retried row by row so
 * the rows the database refuses are named. Results keep their sheet rows.
 */
export async function insertPrepared<V, R>(valid: Prepared<V>[], insert: InsertBatch<V, R>) {
  const inserted: { row: number; value: V; result: R }[] = [];
  const errors: RowError[] = [];

  for (let start = 0; start < valid.length; start += CHUNK) {
    const chunk = valid.slice(start, start + CHUNK);
    const { data, error } = await insert(chunk.map((item) => item.value));
    if (!error && data && data.length === chunk.length) {
      chunk.forEach((item, index) => inserted.push({ ...item, result: data[index] }));
      continue;
    }

    for (const item of chunk) {
      const single = await insert([item.value]);
      if (single.error || !single.data?.length) {
        errors.push({
          row: item.row,
          message: single.error ? dbErrorMessage(single.error, "Baris gagal disimpan.") : "Baris gagal disimpan.",
        });
      } else {
        inserted.push({ ...item, result: single.data[0] });
      }
    }
  }

  return { inserted, errors };
}

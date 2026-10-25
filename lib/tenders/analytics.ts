import "server-only";

import { parseDateRange, type RawSearchParams } from "@/lib/list/params";
import { createClient } from "@/lib/supabase/server";
import { todayWib } from "@/lib/format";

/** Period by closing date (§11.1); default = 1 Jan of this year through today (WIB). */
export function parseAnalyticsPeriod(raw: RawSearchParams) {
  const range = parseDateRange(raw);
  const today = todayWib();
  return {
    from: range.from ?? `${today.slice(0, 4)}-01-01`,
    to: range.to ?? today,
    isDefault: !range.from,
  };
}

/** MKT-08 numbers straight from the database functions (no formulas here). */
export async function getTenderAnalytics(period: { from: string; to: string }) {
  const supabase = await createClient();
  const [stats, reasons, pipeline] = await Promise.all([
    supabase.rpc("tender_win_stats", { p_from: period.from, p_to: period.to }),
    supabase.rpc("tender_lost_reasons", { p_from: period.from, p_to: period.to }),
    supabase.rpc("tender_pipeline"),
  ]);
  const rows = stats.data ?? [];
  return {
    overall: rows.find((row) => row.dimension === "all") ?? null,
    perClient: rows.filter((row) => row.dimension === "client"),
    perVoltage: rows.filter((row) => row.dimension === "voltage"),
    lostReasons: reasons.data ?? [],
    pipeline: pipeline.data ?? [],
    error: stats.error ?? reasons.error ?? pipeline.error,
  };
}

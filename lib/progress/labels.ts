// Section and stage progress labels (PRJ-05 … PRJ-08), shared by client and server.
import { formatNumber } from "@/lib/format";

/** Roles that see sections and progress (PRD §13: Seksi & progres); Lapangan only their projects. */
export const PROGRESS_VIEW_ROLES = ["super_admin", "director", "marketing", "finance", "operations", "field"] as const;
export const PROGRESS_MANAGE_ROLES = ["operations"] as const;

export const PROGRESS_STATES = ["not_started", "in_progress", "done"] as const;
export type ProgressState = (typeof PROGRESS_STATES)[number];
export const PROGRESS_STATE_LABELS: Record<ProgressState, string> = {
  not_started: "Belum",
  in_progress: "Berjalan",
  done: "Selesai",
};
export const PROGRESS_STATE_VARIANTS: Record<ProgressState, "outline" | "secondary" | "success"> = {
  not_started: "outline",
  in_progress: "secondary",
  done: "success",
};

export function progressState(progress: number): ProgressState {
  if (progress >= 100) return "done";
  if (progress > 0) return "in_progress";
  return "not_started";
}

export const PROGRESS_SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  daily_report: "Laporan harian",
};

export type StageRow = { id: string; name: string; weight: number; sort_order: number };

/** A row of the section_progress_summary view. */
export type SectionRow = {
  id: string;
  project_id: string;
  code: string;
  tower_from: string;
  tower_to: string;
  tower_count: number | null;
  length_km: number;
  circuits: number;
  kms: number;
  planned_start: string;
  planned_finish: string;
  sort_order: number;
  notes: string | null;
  progress: number;
  planned_progress: number;
  state: ProgressState;
};

/** section id → stage id → progress (missing = 0). */
export type ProgressCells = Record<string, Record<string, number>>;

export type ProjectProgress = {
  section_count: number;
  total_kms: number;
  progress: number;
  planned_progress: number;
  deviation: number;
};

export type ProgressLogRow = {
  id: number;
  created_at: string;
  section_code: string;
  stage_name: string;
  old_progress: number;
  new_progress: number;
  source: string;
  note: string | null;
  created_by_name: string | null;
};

export type CurvePoint = { week_end: string; planned: number | null; actual: number | null };

/** "49,1%" */
export function formatProgress(value: number | null | undefined, fractionDigits = 1) {
  if (value === null || value === undefined) return "—";
  return `${formatNumber(Number(value), fractionDigits)}%`;
}

/** "−7,3 poin" / "+2 poin" (actual − planned). */
export function formatDeviation(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const rounded = Math.round(Number(value) * 10) / 10;
  if (rounded === 0) return "0 poin";
  return `${rounded > 0 ? "+" : "−"}${formatNumber(Math.abs(rounded), 1)} poin`;
}

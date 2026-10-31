// Daily report labels (OPS-01 … OPS-04), shared by client and server.

/** PRD §13: Laporan harian — SA/Dir view, Operasional manage + review, Lapangan their projects. */
export const REPORT_VIEW_ROLES = ["super_admin", "director", "operations", "field"] as const;
export const REPORT_OFFICE_VIEW_ROLES = ["super_admin", "director", "operations"] as const;
export const REPORT_MANAGE_ROLES = ["operations", "field"] as const;

export const WEATHERS = ["clear", "cloudy", "rain", "heavy_rain"] as const;
export type Weather = (typeof WEATHERS)[number];
export const WEATHER_LABELS: Record<Weather, string> = {
  clear: "Cerah",
  cloudy: "Berawan",
  rain: "Hujan",
  heavy_rain: "Hujan Lebat",
};

export const OBSTACLE_CATEGORIES = [
  "weather",
  "row_land",
  "material_late",
  "equipment_broken",
  "outage_permit",
  "labor",
  "other",
] as const;
export type ObstacleCategory = (typeof OBSTACLE_CATEGORIES)[number];
export const OBSTACLE_LABELS: Record<ObstacleCategory, string> = {
  weather: "Cuaca",
  row_land: "ROW/Lahan/Warga",
  material_late: "Material Belum Datang",
  equipment_broken: "Alat Rusak",
  outage_permit: "Izin Padam/Crossing",
  labor: "Tenaga Kerja",
  other: "Lainnya",
};

export const REPORT_STATUSES = ["submitted", "revision", "reviewed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: "Terkirim",
  revision: "Perlu Revisi",
  reviewed: "Sudah Diperiksa",
};
export const REPORT_STATUS_VARIANTS: Record<ReportStatus, "secondary" | "warning" | "success"> = {
  submitted: "secondary",
  revision: "warning",
  reviewed: "success",
};

export const MAX_REPORT_PHOTOS = 10;

/** A row of the daily_report_list view. */
export type ReportRow = {
  id: string;
  project_id: string;
  report_date: string;
  status: ReportStatus;
  no_activity: boolean;
  no_activity_reason: string | null;
  weather_morning: Weather | null;
  weather_midday: Weather | null;
  weather_afternoon: Weather | null;
  effective_hours: number | null;
  safety_briefing: boolean;
  briefing_participants: number | null;
  equipment_used: string | null;
  plan_tomorrow: string | null;
  notes: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  project_code: string;
  project_name: string;
  workforce: number;
  activity_count: number;
  obstacle_count: number;
  photo_count: number;
};

export type ReportActivity = {
  section_id: string;
  stage_id: string;
  section_code: string;
  stage_name: string;
  progress_after: number;
  notes: string | null;
};

export type ReportObstacle = { category: ObstacleCategory; description: string };

/** "Cerah · Berawan · Hujan" */
export function describeWeather(row: Pick<ReportRow, "weather_morning" | "weather_midday" | "weather_afternoon">) {
  const parts = [row.weather_morning, row.weather_midday, row.weather_afternoon].map((value) =>
    value ? WEATHER_LABELS[value] : "—",
  );
  return parts.join(" · ");
}

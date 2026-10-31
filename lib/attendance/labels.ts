// Attendance labels (HCM-09 … HCM-11), shared by client and server.
import type { CertState } from "@/lib/assignments/labels";

export const ATTENDANCE_STATUSES = ["present", "permit", "sick", "leave", "absent", "off"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Hadir",
  permit: "Izin",
  sick: "Sakit",
  leave: "Cuti",
  absent: "Alpa",
  off: "Libur",
};
export const ATTENDANCE_STATUS_VARIANTS: Record<AttendanceStatus, "success" | "secondary" | "destructive" | "outline"> = {
  present: "success",
  permit: "secondary",
  sick: "secondary",
  leave: "secondary",
  absent: "destructive",
  off: "outline",
};

/** Roles that see attendance (PRD §13: Absensi); Lapangan only their projects. */
export const ATTENDANCE_VIEW_ROLES = ["super_admin", "director", "finance", "hcm", "operations", "field"] as const;
/** Office roles of the SDM → Absensi pages. */
export const ATTENDANCE_OFFICE_VIEW_ROLES = ["super_admin", "director", "finance", "hcm", "operations"] as const;
export const ATTENDANCE_MANAGE_ROLES = ["hcm"] as const;
/** Project tab Tim & Absensi: crew (Penugasan readers) and/or attendance (Absensi readers). */
export const TEAM_VIEW_ROLES = ["super_admin", "director", "finance", "hcm", "operations", "field"] as const;

/** One person on an attendance sheet with their saved record, if any. */
export type SheetPerson = {
  employee_id: string;
  employee_no: string;
  name: string;
  position: string;
  verification_status: "verified" | "pending";
  cert_state: CertState | null;
  cert_issues: string | null;
  overridden: boolean;
  record: {
    status: AttendanceStatus;
    overtime_hours: number;
    notes: string | null;
    project_id: string | null;
  } | null;
};

/** A row of the recap per employee and project (null = kantor). */
export type RecapRow = {
  employee_id: string;
  employee_no: string;
  employee_name: string;
  work_type: string;
  project_id: string | null;
  project_code: string | null;
  present: number;
  permit: number;
  sick: number;
  leave: number;
  absent: number;
  off: number;
  overtime_hours: number;
};

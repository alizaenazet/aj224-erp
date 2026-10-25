// Training labels (HCM-07, HCM-08), shared by client and server.
import type { RequirementStatus } from "@/lib/certifications/labels";
import { formatDate } from "@/lib/format";

export const TRAINING_KINDS = ["internal", "external"] as const;
export type TrainingKind = (typeof TRAINING_KINDS)[number];
export const TRAINING_KIND_LABELS: Record<TrainingKind, string> = {
  internal: "Internal",
  external: "Eksternal",
};

export const PARTICIPANT_RESULTS = ["pending", "passed", "failed"] as const;
export type ParticipantResult = (typeof PARTICIPANT_RESULTS)[number];
export const PARTICIPANT_RESULT_LABELS: Record<ParticipantResult, string> = {
  pending: "Belum dinilai",
  passed: "Lulus",
  failed: "Tidak Lulus",
};

export type TrainingRow = {
  id: string;
  name: string;
  kind: TrainingKind;
  organizer: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  certificate_type_id: string | null;
  certificate_type: { name: string } | null;
  participants: { result: ParticipantResult }[];
};

export type Training = TrainingRow & { notes: string | null };

export type ParticipantRow = {
  employee_id: string;
  result: ParticipantResult;
  certificate_id: string | null;
  employee: {
    employee_no: string;
    full_name: string;
    is_active: boolean;
    position: { name: string } | null;
  } | null;
};

/** A row of the training_needs view. */
export type TrainingNeedRow = {
  employee_id: string;
  employee_no: string;
  employee_name: string;
  position_name: string;
  certificate_type_id: string;
  certificate_type_name: string;
  certificate_id: string | null;
  expiry_date: string | null;
  status: Exclude<RequirementStatus, "valid">;
};

/** Option for the participant picker. */
export type EmployeeOption = {
  id: string;
  employee_no: string;
  full_name: string;
  position: string | null;
};

/** "3 Nov 2026 – 5 Nov 2026", or one date. */
export function formatTrainingDates(start: string, end: string | null) {
  return end && end !== start ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start);
}

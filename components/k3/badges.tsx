import { Badge } from "@/components/ui/badge";
import {
  CLASSIFICATION_SHORT,
  CLASSIFICATION_VARIANTS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_STATUS_VARIANTS,
  type Classification,
  type IncidentStatus,
} from "@/lib/k3/labels";

export function ClassificationBadge({ classification }: { classification: Classification }) {
  return <Badge variant={CLASSIFICATION_VARIANTS[classification]}>{CLASSIFICATION_SHORT[classification]}</Badge>;
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return <Badge variant={INCIDENT_STATUS_VARIANTS[status]}>{INCIDENT_STATUS_LABELS[status]}</Badge>;
}

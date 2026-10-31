import { Badge } from "@/components/ui/badge";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_VARIANTS,
  TERM_STATUS_LABELS,
  TERM_STATUS_VARIANTS,
  type ProjectStatus,
  type TermStatus,
} from "@/lib/projects/labels";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={PROJECT_STATUS_VARIANTS[status]}>{PROJECT_STATUS_LABELS[status]}</Badge>;
}

export function TermStatusBadge({ status }: { status: TermStatus }) {
  return <Badge variant={TERM_STATUS_VARIANTS[status]}>{TERM_STATUS_LABELS[status]}</Badge>;
}

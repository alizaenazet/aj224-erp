import { Badge } from "@/components/ui/badge";
import {
  CONDITION_LABELS,
  CONDITION_VARIANTS,
  NOTE_STATUS_LABELS,
  NOTE_STATUS_VARIANTS,
  type NoteStatus,
  type ToolCondition,
} from "@/lib/equipment/labels";

export function ConditionBadge({ condition }: { condition: ToolCondition }) {
  return <Badge variant={CONDITION_VARIANTS[condition]}>{CONDITION_LABELS[condition]}</Badge>;
}

export function NoteStatusBadge({ status }: { status: NoteStatus }) {
  return <Badge variant={NOTE_STATUS_VARIANTS[status]}>{NOTE_STATUS_LABELS[status]}</Badge>;
}

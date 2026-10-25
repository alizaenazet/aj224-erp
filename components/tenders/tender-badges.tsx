import { Badge } from "@/components/ui/badge";
import {
  TENDER_STATUS_LABELS,
  TENDER_STATUS_VARIANTS,
  tenderUrgency,
  type TenderStatus,
} from "@/lib/tenders/labels";

export function TenderStatusBadge({ status }: { status: TenderStatus }) {
  return <Badge variant={TENDER_STATUS_VARIANTS[status]}>{TENDER_STATUS_LABELS[status]}</Badge>;
}

/** Mendesak / Lewat batas for bids not yet submitted (MKT-07). */
export function TenderUrgencyBadge({
  status,
  bidDeadline,
  today,
}: {
  status: TenderStatus;
  bidDeadline: string | null;
  today: string;
}) {
  const urgency = tenderUrgency(status, bidDeadline, today);
  if (!urgency) return null;
  return <Badge variant="destructive">{urgency === "urgent" ? "Mendesak" : "Lewat batas"}</Badge>;
}

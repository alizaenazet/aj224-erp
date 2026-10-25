import { Badge } from "@/components/ui/badge";
import {
  CERTIFICATE_STATUS_LABELS,
  CERTIFICATE_STATUS_VARIANTS,
  type RequirementStatus,
} from "@/lib/certifications/labels";

/** Berlaku / Segera Kedaluwarsa / Kedaluwarsa / Belum ada (PRD §11.5). */
export function CertificateStatusBadge({ status }: { status: RequirementStatus }) {
  return <Badge variant={CERTIFICATE_STATUS_VARIANTS[status]}>{CERTIFICATE_STATUS_LABELS[status]}</Badge>;
}

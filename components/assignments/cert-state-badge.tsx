import { Badge } from "@/components/ui/badge";
import { CERT_STATE_LABELS, CERT_STATE_VARIANTS, type CertState } from "@/lib/assignments/labels";

/** Required-certificate state of a crew member today (HCM-06); nothing when none is required. */
export function CertStateBadge({ state, issues }: { state: CertState | null; issues: string | null }) {
  if (!state) return null;
  return (
    <Badge variant={CERT_STATE_VARIANTS[state]} title={issues ?? undefined}>
      {state === "valid" ? CERT_STATE_LABELS.valid : (issues ?? CERT_STATE_LABELS[state])}
    </Badge>
  );
}

import { Badge } from "@/components/ui/badge";
import { HEALTH_LABELS, HEALTH_VARIANTS } from "@/lib/pl/labels";

/** Normal / Waspada / Kritis (PRD §11.3). */
export function HealthBadge({ health }: { health: string }) {
  return <Badge variant={HEALTH_VARIANTS[health] ?? "outline"}>{HEALTH_LABELS[health] ?? health}</Badge>;
}

import type { Metadata } from "next";
import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { IncidentsTable } from "@/components/k3/incidents-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { formatNumber, todayWib } from "@/lib/format";
import { K3_VIEW_ROLES } from "@/lib/k3/labels";
import { k3Stats, queryIncidents } from "@/lib/k3/queries";
import { PROJECT_VIEW_ROLES } from "@/lib/projects/labels";
import { getProject } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "K3 Proyek" };

type Params = Promise<{ id: string }>;

export default function ProjectK3Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProjectK3 params={params} />
    </Suspense>
  );
}

/** K3 tab: LTI-free days, counts and the project's incidents (K3-01, K3-05). */
async function ProjectK3({ params }: { params: Params }) {
  const profile = await requireProfile();
  if (!hasAnyRole(profile.role, PROJECT_VIEW_ROLES)) return null;
  if (!hasAnyRole(profile.role, K3_VIEW_ROLES)) return <AccessDenied />;
  const project = await getProject((await params).id);
  if (!project) notFound();

  const today = todayWib();
  const [stats, incidents] = await Promise.all([
    k3Stats(project.start_date ?? `${today.slice(0, 4)}-01-01`, today),
    queryIncidents(
      { q: null, project: project.id, classification: null, status: null, range: { from: null, to: null, gte: null, lt: null }, page: 1 },
      { page: null },
    ),
  ]);
  const row = stats.find((item) => item.project_id === project.id);
  const tiles: [string, string][] = [
    ["Hari tanpa LTI", row?.lti_free_days === null || !row ? "—" : formatNumber(row.lti_free_days)],
    ["Insiden sejak proyek mulai", formatNumber(row?.total ?? 0)],
    ["Tindakan terbuka", `${formatNumber(row?.open_actions ?? 0)}${row?.overdue_actions ? ` (${row.overdue_actions} terlambat)` : ""}`],
    ["LTIFR", row?.ltifr === null || !row ? "—" : formatNumber(row.ltifr, 2)],
  ];

  return (
    <div className="flex flex-col gap-4">
      {profile.role === "operations" || profile.role === "field" ? (
        <Button asChild size="lg" variant="destructive" className="sm:self-start">
          <Link href={`/operations/incidents/new?project=${project.id}`}>
            <TriangleAlertIcon />
            Lapor Insiden
          </Link>
        </Button>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-xl tabular-nums sm:text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Insiden proyek</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentsTable rows={incidents.rows} />
        </CardContent>
      </Card>
    </div>
  );
}

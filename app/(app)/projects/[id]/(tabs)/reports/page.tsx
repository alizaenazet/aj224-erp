import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ReportsTable } from "@/components/daily-reports/reports-table";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireProfile } from "@/lib/auth/session";
import { OBSTACLE_LABELS, REPORT_MANAGE_ROLES, REPORT_VIEW_ROLES } from "@/lib/daily-reports/labels";
import { obstacleSummary, parseReportListParams, queryReports } from "@/lib/daily-reports/queries";
import { formatDate } from "@/lib/format";
import type { RawSearchParams } from "@/lib/list/params";
import { PROJECT_VIEW_ROLES } from "@/lib/projects/labels";
import { getProject } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Laporan Harian Proyek" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<RawSearchParams>;

export default function ProjectReportsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ProjectReports params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** Laporan Harian tab: the project's reports and the obstacle recap (OPS-01, OPS-02). */
async function ProjectReports({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const profile = await requireProfile();
  if (!hasAnyRole(profile.role, PROJECT_VIEW_ROLES)) return null;
  if (!hasAnyRole(profile.role, REPORT_VIEW_ROLES)) return <AccessDenied />;

  const project = await getProject((await params).id);
  if (!project) notFound();

  const listParams = { ...parseReportListParams(await searchParams), project: project.id };
  const [{ rows }, summary] = await Promise.all([queryReports(listParams, { page: null }), obstacleSummary(project.id)]);
  const canCreate = hasAnyRole(profile.role, REPORT_MANAGE_ROLES) && project.status !== "closed";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Rekap kendala</CardTitle>
          <CardDescription>Jumlah kendala per kategori dari semua laporan proyek ini.</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada kendala tercatat.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Terakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((item) => (
                  <TableRow key={item.category}>
                    <TableCell>{OBSTACLE_LABELS[item.category]}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.count}</TableCell>
                    <TableCell>{formatDate(item.last_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Laporan harian</CardTitle>
          <CardDescription>{rows.length} laporan.</CardDescription>
          {canCreate ? (
            <CardAction>
              <Button asChild size="sm">
                <Link href={`/field/daily-reports/new?project=${project.id}`}>
                  <PlusIcon />
                  Buat laporan
                </Link>
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          <ReportsTable reports={rows} showProject={false} />
        </CardContent>
      </Card>
    </div>
  );
}

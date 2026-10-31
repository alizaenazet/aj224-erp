import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { ReportsTable, ReportsToolbar } from "@/components/daily-reports/reports-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { reportProjects } from "@/lib/daily-reports/context";
import { REPORT_OFFICE_VIEW_ROLES } from "@/lib/daily-reports/labels";
import { missingReports, parseReportListParams, queryReports } from "@/lib/daily-reports/queries";
import { formatDate } from "@/lib/format";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Laporan Harian" };

type SearchParams = Promise<RawSearchParams>;

export default function DailyReportsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Laporan Harian" description="Laporan harian dari semua proyek, terbaru di atas." />
      <Suspense fallback={<ContentSkeleton />}>
        <DailyReportsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DailyReportsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(REPORT_OFFICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseReportListParams(raw);
  const [{ rows, count, error }, projects, missing] = await Promise.all([
    queryReports(params, { page: params.page }),
    reportProjects(profile),
    missingReports(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      {missing.length ? (
        <Alert variant="warning">
          <AlertTitle>Belum mengirim laporan {formatDate(missing[0].report_date)}</AlertTitle>
          <AlertDescription>
            <ul className="flex flex-col gap-1">
              {missing.map((project) => (
                <li key={project.project_id}>
                  <Link href={`/projects/${project.project_id}/reports`} className="underline-offset-4 hover:underline">
                    {project.code} — {project.name}
                  </Link>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      <ReportsToolbar projects={projects} canCreate={profile.role === "operations"} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Laporan gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <ReportsTable reports={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/operations/daily-reports", page)}
      />
    </div>
  );
}

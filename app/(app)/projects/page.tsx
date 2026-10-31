import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { ProjectsTable, ProjectsToolbar } from "@/components/projects/projects-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { clientOptions } from "@/lib/clients/queries";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";
import { PROGRESS_VIEW_ROLES } from "@/lib/progress/labels";
import { CONTRACT_VIEW_ROLES, PROJECT_MANAGE_ROLES, PROJECT_VIEW_ROLES } from "@/lib/projects/labels";
import { parseProjectListParams, queryProjects } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Daftar Proyek" };

type SearchParams = Promise<RawSearchParams>;

export default function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Daftar Proyek" description="Semua proyek dengan status, jadwal, progres, dan nilai kontrak berlaku." />
      <Suspense fallback={<ContentSkeleton />}>
        <ProjectsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProjectsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(PROJECT_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseProjectListParams(raw);
  const [{ rows, count, error }, clients] = await Promise.all([
    queryProjects(params, { page: params.page }),
    clientOptions({ includeId: params.client ?? undefined }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <ProjectsToolbar clients={clients} canCreate={hasAnyRole(profile.role, PROJECT_MANAGE_ROLES)} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar proyek gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <ProjectsTable
          projects={rows}
          showValues={hasAnyRole(profile.role, CONTRACT_VIEW_ROLES)}
          showProgress={hasAnyRole(profile.role, PROGRESS_VIEW_ROLES)}
        />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/projects", page)}
      />
    </div>
  );
}

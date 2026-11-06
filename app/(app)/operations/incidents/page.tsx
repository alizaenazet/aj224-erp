import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { IncidentsTable, IncidentsToolbar } from "@/components/k3/incidents-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { K3_OFFICE_VIEW_ROLES } from "@/lib/k3/labels";
import { parseIncidentListParams, queryIncidents } from "@/lib/k3/queries";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";
import { projectOptions } from "@/lib/materials/queries";

export const metadata: Metadata = { title: "Insiden K3" };

type SearchParams = Promise<RawSearchParams>;

export default function IncidentsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Insiden K3" description="Laporan insiden, investigasi dan tindakan perbaikan." />
      <Suspense fallback={<ContentSkeleton />}>
        <IncidentsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function IncidentsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(K3_OFFICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const raw = await searchParams;
  const params = parseIncidentListParams(raw);
  const [{ rows, count, error }, projects] = await Promise.all([queryIncidents(params, { page: params.page }), projectOptions()]);
  return (
    <div className="flex flex-col gap-4">
      <IncidentsToolbar projects={projects} canReport={profile.role === "operations"} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar insiden gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <IncidentsTable rows={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/operations/incidents", page)}
      />
    </div>
  );
}

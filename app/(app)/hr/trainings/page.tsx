import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { TrainingsTable, TrainingsToolbar } from "@/components/trainings/trainings-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { CERTIFICATE_VIEW_ROLES } from "@/lib/certifications/labels";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";
import { parseTrainingListParams, queryTrainings } from "@/lib/trainings/queries";

export const metadata: Metadata = { title: "Pelatihan" };

type SearchParams = Promise<RawSearchParams>;

export default function TrainingsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Pelatihan"
        description="Pelatihan dan workshop karyawan. Peserta Lulus otomatis mendapat sertifikat."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <TrainingsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TrainingsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(CERTIFICATE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseTrainingListParams(raw);
  const { rows, count, error } = await queryTrainings(params, { page: params.page });

  return (
    <div className="flex flex-col gap-4">
      <TrainingsToolbar canManage={profile.role === "hcm"} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar pelatihan gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <TrainingsTable trainings={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/hr/trainings", page)}
      />
    </div>
  );
}

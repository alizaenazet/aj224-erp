import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { TrainingNeedsToolbar, TrainingNeedsView } from "@/components/trainings/training-needs-view";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { CERTIFICATE_VIEW_ROLES } from "@/lib/certifications/labels";
import { certificateTypeOptions } from "@/lib/certifications/queries";
import type { RawSearchParams } from "@/lib/list/params";
import { parseTrainingNeedParams, queryTrainingNeeds } from "@/lib/trainings/queries";

export const metadata: Metadata = { title: "Kebutuhan Pelatihan" };

type SearchParams = Promise<RawSearchParams>;

export default function TrainingNeedsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Kebutuhan Pelatihan"
        description="Karyawan aktif yang sertifikat wajib jabatannya belum ada, kedaluwarsa, atau segera kedaluwarsa."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <TrainingNeedsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TrainingNeedsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(CERTIFICATE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const params = parseTrainingNeedParams(await searchParams);
  const [{ rows, error }, types] = await Promise.all([queryTrainingNeeds(params), certificateTypeOptions()]);

  return (
    <div className="flex flex-col gap-4">
      <TrainingNeedsToolbar types={types.map(({ value, label }) => ({ value, label }))} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Kebutuhan pelatihan gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <TrainingNeedsView rows={rows} canManage={profile.role === "hcm"} />
      )}
    </div>
  );
}

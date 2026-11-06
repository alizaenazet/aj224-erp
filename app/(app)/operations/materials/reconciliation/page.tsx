import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { ReconciliationTable } from "@/components/materials/reconciliation-table";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/list/params";
import { MATERIAL_OFFICE_VIEW_ROLES } from "@/lib/materials/labels";
import { parseReconciliationParams, projectOptions, queryReconciliation } from "@/lib/materials/queries";

export const metadata: Metadata = { title: "Rekonsiliasi Material Titipan" };

type SearchParams = Promise<RawSearchParams>;

export default function ReconciliationPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Rekonsiliasi Material Titipan"
        description="Per proyek: diterima dari klien, terpakai, dikembalikan, susut dan sisa (MAT-06)."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <ReconciliationContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ReconciliationContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(MATERIAL_OFFICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const params = parseReconciliationParams(await searchParams);
  const [{ rows }, projects] = await Promise.all([queryReconciliation(params), projectOptions()]);
  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        searchPlaceholder="Cari material"
        filters={<SelectFilter param="project" allLabel="Semua proyek" options={projects} />}
        actions={<ExportButton exportKey="material-reconciliation" />}
      />
      <Card>
        <CardContent>
          <ReconciliationTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

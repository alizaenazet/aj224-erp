import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { MaterialsTable, MaterialsToolbar } from "@/components/materials/materials-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";
import { MATERIAL_OFFICE_VIEW_ROLES } from "@/lib/materials/labels";
import { materialFormOptions, parseMaterialListParams, queryMaterials } from "@/lib/materials/queries";

export const metadata: Metadata = { title: "Material & Stok" };

type SearchParams = Promise<RawSearchParams>;

export default function MaterialsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Material & Stok" description="Jumlah material per lokasi (tanpa nilai); biaya dicatat di Keuangan." />
      <Suspense fallback={<ContentSkeleton />}>
        <MaterialsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function MaterialsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(MATERIAL_OFFICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseMaterialListParams(raw);
  const [{ rows, count, error }, options] = await Promise.all([queryMaterials(params, { page: params.page }), materialFormOptions()]);

  return (
    <div className="flex flex-col gap-4">
      <MaterialsToolbar categories={options.categories} locations={options.locations} canManage={profile.role === "operations"} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar material gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <MaterialsTable materials={rows} byLocation={Boolean(params.location)} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/operations/materials", page)}
      />
    </div>
  );
}

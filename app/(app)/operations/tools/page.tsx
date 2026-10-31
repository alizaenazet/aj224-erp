import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { ToolsTable, ToolsToolbar } from "@/components/equipment/tools-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { EQUIPMENT_OFFICE_VIEW_ROLES } from "@/lib/equipment/labels";
import { parseToolListParams, queryTools, toolFormOptions } from "@/lib/equipment/queries";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Alat" };

type SearchParams = Promise<RawSearchParams>;

export default function ToolsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Alat" description="Stok alat per kondisi di semua lokasi, termasuk yang sedang dalam perjalanan." />
      <Suspense fallback={<ContentSkeleton />}>
        <ToolsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ToolsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(EQUIPMENT_OFFICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseToolListParams(raw);
  const [{ rows, count, error }, options] = await Promise.all([queryTools(params, { page: params.page }), toolFormOptions()]);

  return (
    <div className="flex flex-col gap-4">
      <ToolsToolbar categories={options.categories} locations={options.locations} canManage={profile.role === "operations"} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar alat gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <ToolsTable tools={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/operations/tools", page)}
      />
    </div>
  );
}

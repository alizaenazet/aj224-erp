import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { MasterDataView } from "@/components/master-data/master-data-view";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";
import { MASTER_ENTITIES, getMasterEntity } from "@/lib/master-data/entities";
import {
  certificateTypeOptions,
  parseMasterListParams,
  queryMaster,
} from "@/lib/master-data/queries";

type Params = Promise<{ entity: string }>;
type SearchParams = Promise<RawSearchParams>;

export function generateStaticParams() {
  return Object.keys(MASTER_ENTITIES).map((entity) => ({ entity }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const entity = getMasterEntity((await params).entity);
  return { title: entity ? entity.title : "Master Data" };
}

export default function MasterEntityPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <MasterEntityContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function MasterEntityContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const entity = getMasterEntity((await params).entity);
  if (!entity) notFound();

  const profile = await requireRole(entity.viewRoles);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const listParams = parseMasterListParams(entity, raw);
  const [{ rows, count, error }, certificateOptions] = await Promise.all([
    queryMaster(entity, listParams, { page: listParams.page }),
    entity.fields.some((field) => field.type === "certificates")
      ? certificateTypeOptions()
      : Promise.resolve([]),
  ]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Data gagal dimuat. Muat ulang halaman.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{entity.description}</p>
      <MasterDataView
        entityKey={entity.key}
        rows={rows}
        canManage={hasAnyRole(profile.role, entity.manageRoles)}
        certificateOptions={certificateOptions}
      />
      <ListPagination
        page={listParams.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, `/settings/master-data/${entity.key}`, page)}
      />
    </div>
  );
}

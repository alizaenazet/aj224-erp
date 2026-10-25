import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { TendersTable, TendersToolbar } from "@/components/tenders/tenders-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { MARKETING_VIEW_ROLES } from "@/lib/clients/labels";
import { clientOptions } from "@/lib/clients/queries";
import { todayWib } from "@/lib/format";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";
import { parseTenderListParams, queryTenders } from "@/lib/tenders/queries";

export const metadata: Metadata = { title: "Tender" };

type SearchParams = Promise<RawSearchParams>;

export default function TendersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Tender"
        description="Tender aktif diurutkan menurut nilai tertimbang (nilai penawaran × peluang menang)."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <TendersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TendersContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(MARKETING_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseTenderListParams(raw);
  const [{ rows, count, error }, clients] = await Promise.all([
    queryTenders(params, { page: params.page }),
    clientOptions({ includeId: params.client ?? undefined }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <TendersToolbar clients={clients} canManage={profile.role === "marketing"} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar tender gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <TendersTable tenders={rows} today={todayWib()} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/marketing/tenders", page)}
      />
    </div>
  );
}

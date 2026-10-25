import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { ClientsTable, ClientsToolbar } from "@/components/clients/clients-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { CLIENT_MANAGE_ROLES, MARKETING_VIEW_ROLES } from "@/lib/clients/labels";
import { parseClientListParams, queryClients } from "@/lib/clients/queries";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Klien" };

type SearchParams = Promise<RawSearchParams>;

export default function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Klien" description="Perusahaan klien beserta kontak, riwayat tender, dan win rate." />
      <Suspense fallback={<ContentSkeleton />}>
        <ClientsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ClientsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(MARKETING_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseClientListParams(raw);
  const { rows, count, error } = await queryClients(params, { page: params.page });

  return (
    <div className="flex flex-col gap-4">
      <ClientsToolbar canManage={hasAnyRole(profile.role, CLIENT_MANAGE_ROLES)} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar klien gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <ClientsTable clients={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/marketing/clients", page)}
      />
    </div>
  );
}

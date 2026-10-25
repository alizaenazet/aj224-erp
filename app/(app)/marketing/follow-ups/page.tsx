import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { FollowUpsTable, FollowUpsToolbar } from "@/components/clients/follow-ups-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { hasAnyRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { CLIENT_MANAGE_ROLES, MARKETING_VIEW_ROLES } from "@/lib/clients/labels";
import { parseFollowUpParams, queryFollowUps } from "@/lib/clients/queries";
import { todayWib } from "@/lib/format";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Tindak Lanjut" };

type SearchParams = Promise<RawSearchParams>;

export default function FollowUpsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Tindak Lanjut"
        description="Tindak lanjut dari aktivitas klien. Yang jatuh tempo dan terlambat tampil paling atas."
      />
      <Suspense fallback={<ContentSkeleton />}>
        <FollowUpsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function FollowUpsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(MARKETING_VIEW_ROLES);
  if (!profile) return <AccessDenied />;

  const raw = await searchParams;
  const params = parseFollowUpParams(raw);
  const { rows, count, error } = await queryFollowUps(params, { page: params.page });

  return (
    <div className="flex flex-col gap-4">
      <FollowUpsToolbar />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar tindak lanjut gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <FollowUpsTable
          rows={rows}
          today={todayWib()}
          canLog={hasAnyRole(profile.role, CLIENT_MANAGE_ROLES)}
          currentUserId={profile.id}
          isSuperAdmin={profile.role === "super_admin"}
        />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/marketing/follow-ups", page)}
      />
    </div>
  );
}

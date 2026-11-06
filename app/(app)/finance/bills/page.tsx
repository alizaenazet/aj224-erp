import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { BillsTable, BillsToolbar } from "@/components/bills/bills-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { PAYABLE_VIEW_ROLES } from "@/lib/bills/labels";
import { costFormOptions, parseBillListParams, queryBills } from "@/lib/bills/queries";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Tagihan Supplier & Utang" };

type SearchParams = Promise<RawSearchParams>;

export default function BillsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Tagihan Supplier & Utang" description="Biaya tercatat saat tagihan dibuat; pembayaran hanya melunasi." />
      <Suspense fallback={<ContentSkeleton />}>
        <BillsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function BillsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(PAYABLE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const raw = await searchParams;
  const params = parseBillListParams(raw);
  const [{ rows, count, error }, options] = await Promise.all([queryBills(params, { page: params.page }), costFormOptions()]);
  return (
    <div className="flex flex-col gap-4">
      <BillsToolbar suppliers={options.suppliers} canManage={profile.role === "finance"} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar tagihan gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <BillsTable rows={rows} />
      )}
      <ListPagination page={params.page} pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))} hrefForPage={(page) => withPage(raw, "/finance/bills", page)} />
    </div>
  );
}

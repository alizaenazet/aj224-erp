import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { TransactionsTable, TransactionsToolbar } from "@/components/materials/transactions-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";
import { MATERIAL_OFFICE_VIEW_ROLES } from "@/lib/materials/labels";
import { materialFormOptions, parseTxnListParams, queryTransactions } from "@/lib/materials/queries";

export const metadata: Metadata = { title: "Transaksi Material" };

type SearchParams = Promise<RawSearchParams>;

export default function MaterialTransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Transaksi Material" description="Penerimaan, pemakaian, pengembalian, saldo awal dan stok opname." />
      <Suspense fallback={<ContentSkeleton />}>
        <TransactionsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function TransactionsContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(MATERIAL_OFFICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const raw = await searchParams;
  const params = parseTxnListParams(raw);
  const [{ rows, count, error }, options] = await Promise.all([queryTransactions(params, { page: params.page }), materialFormOptions()]);
  return (
    <div className="flex flex-col gap-4">
      <TransactionsToolbar locations={options.locations} canManage={profile.role === "operations"} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar transaksi gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <TransactionsTable rows={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/operations/material-transactions", page)}
      />
    </div>
  );
}

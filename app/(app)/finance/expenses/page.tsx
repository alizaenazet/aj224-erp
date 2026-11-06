import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { ExpensesTable, ExpensesToolbar } from "@/components/expenses/expenses-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { PAYABLE_VIEW_ROLES } from "@/lib/bills/labels";
import { costFormOptions, parseExpenseListParams, queryExpenses } from "@/lib/bills/queries";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Pengeluaran" };

type SearchParams = Promise<RawSearchParams>;

export default function ExpensesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Pengeluaran" description="Pengeluaran langsung kantor, termasuk overhead (Kantor/Umum) dan saldo awal biaya." />
      <Suspense fallback={<ContentSkeleton />}>
        <ExpensesContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ExpensesContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(PAYABLE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const raw = await searchParams;
  const params = parseExpenseListParams(raw);
  const [{ rows, count, error }, options] = await Promise.all([queryExpenses(params, { page: params.page }), costFormOptions()]);
  return (
    <div className="flex flex-col gap-4">
      <ExpensesToolbar projects={options.projects} categories={options.categories} canManage={profile.role === "finance"} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar pengeluaran gagal dimuat.</AlertDescription>
        </Alert>
      ) : (
        <ExpensesTable rows={rows} />
      )}
      <ListPagination page={params.page} pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))} hrefForPage={(page) => withPage(raw, "/finance/expenses", page)} />
    </div>
  );
}

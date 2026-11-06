import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { ListPagination } from "@/components/app/list-pagination";
import { PageHeader } from "@/components/app/page-header";
import { InvoicesTable, InvoicesToolbar } from "@/components/invoices/invoices-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/session";
import { INVOICE_VIEW_ROLES } from "@/lib/invoices/labels";
import { invoiceFormOptions, parseInvoiceListParams, queryInvoices } from "@/lib/invoices/queries";
import { PAGE_SIZE, withPage, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Invoice & Piutang" };

type SearchParams = Promise<RawSearchParams>;

export default function InvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Invoice & Piutang" description="Invoice termin dibuat dari Kontrak & Termin proyek saat termin Siap Ditagih." />
      <Suspense fallback={<ContentSkeleton />}>
        <InvoicesContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function InvoicesContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(INVOICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const raw = await searchParams;
  const params = parseInvoiceListParams(raw);
  const [{ rows, count, error }, options] = await Promise.all([queryInvoices(params, { page: params.page }), invoiceFormOptions()]);
  return (
    <div className="flex flex-col gap-4">
      <InvoicesToolbar projects={options.projects} clients={options.clients} canManage={profile.role === "finance"} />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>Daftar invoice gagal dimuat. Muat ulang halaman.</AlertDescription>
        </Alert>
      ) : (
        <InvoicesTable rows={rows} />
      )}
      <ListPagination
        page={params.page}
        pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
        hrefForPage={(page) => withPage(raw, "/finance/invoices", page)}
      />
    </div>
  );
}

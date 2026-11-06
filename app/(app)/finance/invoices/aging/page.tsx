import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { SelectFilter } from "@/components/data-table/select-filter";
import { AgingTable } from "@/components/invoices/aging-table";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { INVOICE_VIEW_ROLES } from "@/lib/invoices/labels";
import { invoiceFormOptions, queryAging } from "@/lib/invoices/queries";
import { isUuid, parseText, type RawSearchParams } from "@/lib/list/params";

export const metadata: Metadata = { title: "Umur Piutang" };

type SearchParams = Promise<RawSearchParams>;

export default function AgingPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Umur Piutang" description="Sisa tagihan invoice Terbit dan Dibayar Sebagian menurut hari terlambat (PRD §11.4)." />
      <Suspense fallback={<ContentSkeleton />}>
        <AgingContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AgingContent({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireRole(INVOICE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const raw = await searchParams;
  const project = parseText(raw.project);
  const client = parseText(raw.client);
  const [{ rows }, options] = await Promise.all([
    queryAging({ project: isUuid(project) ? project : null, client: isUuid(client) ? client : null }),
    invoiceFormOptions(),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        filters={
          <>
            <SelectFilter param="client" allLabel="Semua klien" options={options.clients} />
            <SelectFilter param="project" allLabel="Semua proyek" options={options.projects} />
          </>
        }
        actions={<ExportButton exportKey="receivable-aging" />}
      />
      <Card>
        <CardContent>
          <AgingTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

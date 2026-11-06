import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportButton } from "@/components/data-table/export-button";
import { PayableAgingTable } from "@/components/bills/aging-table";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { PAYABLE_VIEW_ROLES } from "@/lib/bills/labels";
import { queryPayableAging } from "@/lib/bills/queries";

export const metadata: Metadata = { title: "Umur Utang" };

export default function PayableAgingPage() {
  return (
    <>
      <PageHeader title="Umur Utang" description="Sisa tagihan supplier yang belum lunas menurut hari terlambat." />
      <Suspense fallback={<ContentSkeleton />}>
        <AgingContent />
      </Suspense>
    </>
  );
}

async function AgingContent() {
  const profile = await requireRole(PAYABLE_VIEW_ROLES);
  if (!profile) return <AccessDenied />;
  const { rows } = await queryPayableAging();
  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar actions={<ExportButton exportKey="payable-aging" />} />
      <Card>
        <CardContent>
          <PayableAgingTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

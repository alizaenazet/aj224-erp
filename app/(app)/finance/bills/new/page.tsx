import type { Metadata } from "next";
import { Suspense } from "react";
import { AccessDenied } from "@/components/app/access-denied";
import { ContentSkeleton } from "@/components/app/content-skeleton";
import { PageHeader } from "@/components/app/page-header";
import { BillForm } from "@/components/bills/bill-form";
import { requireRole } from "@/lib/auth/session";
import { FINANCE_MANAGE_ROLES } from "@/lib/bills/labels";
import { costFormOptions } from "@/lib/bills/queries";
import { todayWib } from "@/lib/format";

export const metadata: Metadata = { title: "Tagihan Supplier Baru" };

export default function NewBillPage() {
  return (
    <>
      <PageHeader title="Tagihan Supplier Baru" />
      <Suspense fallback={<ContentSkeleton />}>
        <NewBillContent />
      </Suspense>
    </>
  );
}

async function NewBillContent() {
  const profile = await requireRole(FINANCE_MANAGE_ROLES);
  if (!profile) return <AccessDenied />;
  const options = await costFormOptions();
  return (
    <BillForm
      suppliers={options.suppliers}
      projects={options.projects}
      categories={options.categories}
      deliveryNotes={options.deliveryNotes}
      today={todayWib()}
    />
  );
}
